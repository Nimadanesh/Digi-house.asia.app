import { describe, expect, it } from "vitest";
import { Address } from "ton";
import { createMemoryNftStore } from "./nft-store.js";

const ADDR = new Address(0, Buffer.alloc(32, 1)).toString();
const ADDR2 = new Address(0, Buffer.alloc(32, 2)).toString();

function input(over: Partial<Parameters<ReturnType<typeof createMemoryNftStore>["insert"]>[0]> = {}) {
  return {
    id: over.id ?? "nft_1",
    holdingKey: over.holdingKey ?? "user-a:prop-a",
    userId: over.userId ?? "user-a",
    propertyId: over.propertyId ?? "prop-a",
    walletAddress: over.walletAddress ?? ADDR,
    metadataUrl: over.metadataUrl ?? null,
  };
}

describe("nft store — 1 holding → 1 NFT (Phase 2)", () => {
  it("insert creates a pending record", async () => {
    const store = createMemoryNftStore();
    const { record, created } = await store.insert(input());
    expect(created).toBe(true);
    expect(record.status).toBe("pending");
    expect(record.attempts).toBe(0);
    expect(record.holdingKey).toBe("user-a:prop-a");
  });

  it("a second insert for the same holding is a no-op (duplicate settlement event)", async () => {
    const store = createMemoryNftStore();
    const first = await store.insert(input());
    expect(first.created).toBe(true);
    const second = await store.insert(input({ id: "nft_2" }));
    expect(second.created).toBe(false);
    expect(second.record.id).toBe("nft_1");
    expect(store._rows).toHaveLength(1);
  });

  it("different holdings get different NFTs", async () => {
    const store = createMemoryNftStore();
    await store.insert(input({ id: "nft_1", holdingKey: "user-a:prop-a" }));
    await store.insert(input({ id: "nft_2", holdingKey: "user-a:prop-b", propertyId: "prop-b" }));
    expect(store._rows).toHaveLength(2);
  });
});

describe("guarded status transitions (Phase 10 — idempotency)", () => {
  it("claimForMint wins exactly once; a duplicate claim is null", async () => {
    const store = createMemoryNftStore();
    const { record } = await store.insert(input());
    const claimed = await store.claimForMint(record.id);
    expect(claimed?.status).toBe("minting");
    expect(await store.claimForMint(record.id)).toBeNull();
  });

  it("markMinted only from minting; claimForTransfer only from minted; markDelivered only from transferring", async () => {
    const store = createMemoryNftStore();
    const { record } = await store.insert(input());
    // markMinted before claim → rejected
    expect(
      await store.markMinted(record.id, {
        nftItemId: 1,
        nftAddress: ADDR,
        mintTxHash: "h",
        metadataUrl: "u",
      }),
    ).toBeNull();

    await store.claimForMint(record.id);
    const minted = await store.markMinted(record.id, {
      nftItemId: 1,
      nftAddress: ADDR,
      mintTxHash: "mint-hash",
      metadataUrl: "https://api.example.com/nft-metadata/nft_1.json",
    });
    expect(minted?.status).toBe("minted");
    expect(minted?.nftItemId).toBe(1);
    expect(minted?.mintTxHash).toBe("mint-hash");
    // duplicate markMinted → null
    expect(
      await store.markMinted(record.id, {
        nftItemId: 2,
        nftAddress: ADDR,
        mintTxHash: "x",
        metadataUrl: "u",
      }),
    ).toBeNull();

    const transferring = await store.claimForTransfer(record.id);
    expect(transferring?.status).toBe("transferring");
    // claimForTransfer again → null
    expect(await store.claimForTransfer(record.id)).toBeNull();

    const delivered = await store.markDelivered(record.id, "transfer-hash");
    expect(delivered?.status).toBe("delivered");
    expect(delivered?.transferTxHash).toBe("transfer-hash");
    // double deliver → null
    expect(await store.markDelivered(record.id, "x")).toBeNull();
  });

  it("markFailed works from pending/minting/transferring but not from delivered", async () => {
    const store = createMemoryNftStore();
    const { record } = await store.insert(input());
    const failed = await store.markFailed(record.id, "rpc_timeout", "timed out");
    expect(failed?.status).toBe("failed");
    expect(failed?.attempts).toBe(1);
    expect(failed?.errorCode).toBe("rpc_timeout");
    // second markFailed on already-failed → null
    expect(await store.markFailed(record.id, "x", "y")).toBeNull();
  });

  it("retry resets failed → pending and clears error facts", async () => {
    const store = createMemoryNftStore();
    const { record } = await store.insert(input());
    await store.claimForMint(record.id);
    await store.markFailed(record.id, "mint_failed", "boom");
    const retried = await store.retry(record.id);
    expect(retried?.status).toBe("pending");
    expect(retried?.attempts).toBe(0);
    expect(retried?.errorCode).toBeNull();
    // retry only from failed
    expect(await store.retry(record.id)).toBeNull();
  });

  it("persistMintExpectation only works while minting (guards the pre-broadcast write)", async () => {
    const store = createMemoryNftStore();
    const { record } = await store.insert(input());
    // Not minting yet → rejected.
    expect(
      await store.persistMintExpectation(record.id, { nftItemId: 1, mintTxHash: "h" }),
    ).toBeNull();
    await store.claimForMint(record.id);
    const r = await store.persistMintExpectation(record.id, {
      nftItemId: 7,
      mintTxHash: "expected-hash",
    });
    expect(r?.status).toBe("minting");
    expect(r?.nftItemId).toBe(7);
    expect(r?.mintTxHash).toBe("expected-hash");
    // After minted, the expectation write is rejected too.
    await store.markMinted(record.id, {
      nftItemId: 7,
      nftAddress: ADDR,
      mintTxHash: "expected-hash",
      metadataUrl: "u",
    });
    expect(
      await store.persistMintExpectation(record.id, { nftItemId: 8, mintTxHash: "x" }),
    ).toBeNull();
  });

  it("retry PRESERVES persisted on-chain facts so the retry can reconcile (check-before-mint)", async () => {
    const store = createMemoryNftStore();
    const { record } = await store.insert(input());
    // Simulate: crash after broadcast but before markMinted → record swept to failed.
    await store.claimForMint(record.id);
    await store.persistMintExpectation(record.id, { nftItemId: 7, mintTxHash: "expected-hash" });
    await store.markFailed(record.id, "timeout", "stuck in minting");
    expect(record?.nftItemId).toBeNull(); // the var is stale; re-read below

    const retried = await store.retry(record.id);
    expect(retried?.status).toBe("pending");
    expect(retried?.attempts).toBe(0);
    expect(retried?.errorCode).toBeNull();
    expect(retried?.errorMessage).toBeNull();
    // On-chain facts survive the retry for reconciliation.
    expect(retried?.nftItemId).toBe(7);
    expect(retried?.mintTxHash).toBe("expected-hash");
  });

  it("full happy path: pending → minting → minted → transferring → delivered", async () => {
    const store = createMemoryNftStore();
    const { record } = await store.insert(input());
    await store.claimForMint(record.id);
    await store.markMinted(record.id, { nftItemId: 1, nftAddress: ADDR, mintTxHash: "m", metadataUrl: "u" });
    await store.claimForTransfer(record.id);
    const done = await store.markDelivered(record.id, "t");
    expect(done?.status).toBe("delivered");
  });
});

describe("queries", () => {
  it("listByUser / getByHolding / listAll / listStalePending", async () => {
    const store = createMemoryNftStore();
    await store.insert(input({ id: "nft_1", holdingKey: "user-a:prop-a" }));
    await store.insert(
      input({
        id: "nft_2",
        holdingKey: "user-a:prop-b",
        propertyId: "prop-b",
        userId: "user-a",
      }),
    );
    await store.insert(
      input({
        id: "nft_3",
        holdingKey: "user-b:prop-a",
        userId: "user-b",
        walletAddress: ADDR2,
      }),
    );

    expect((await store.listByUser("user-a")).map((r) => r.id).sort()).toEqual(["nft_1", "nft_2"]);
    expect((await store.getByHolding("user-a", "prop-a"))?.id).toBe("nft_1");
    expect((await store.getByHolding("user-b", "prop-a"))?.id).toBe("nft_3");
    expect((await store.listAll()).map((r) => r.id).sort()).toEqual(["nft_1", "nft_2", "nft_3"]);

    // Only the record older than the cutoff is stale.
    const stale = await store.listStalePending(new Date(Date.now() + 60_000));
    expect(stale.map((r) => r.id).sort()).toEqual(["nft_1", "nft_2", "nft_3"]);
    expect(await store.listStalePending(new Date(Date.now() - 60_000))).toEqual([]);
  });
});
