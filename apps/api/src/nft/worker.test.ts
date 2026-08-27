import { describe, expect, it } from "vitest";
import type { Logger } from "pino";
import { Address } from "ton";
import { createMemoryAuditStore } from "../audit/audit-store.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { createMemoryIntentStore } from "../buys/intent-store.js";
import { settleVerifiedBuy } from "../buys/settle-verified-buy.js";
import { createMemoryTxStore } from "../buys/tx-store.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { createMemoryHoldingStore } from "../portfolio/holding-store.js";
import { createSimulatedNftMinter, type NftMinter } from "./minter.js";
import { createMemoryNftStore, type NftStore } from "./nft-store.js";
import { requestNftForHolding } from "./request.js";
import { processNftJob, runNftSweep, type NftWorkerDeps } from "./worker.js";

const silentLog = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  fatal: () => {},
  trace: () => {},
  child: () => silentLog,
} as unknown as Logger;

const USER = "user-a";
const PROP = "prop-marina-vista-4b";
const ADDR = new Address(0, Buffer.alloc(32, 1)).toString();

function makeDeps(over: { minter?: NftMinter | null; nfts?: NftStore } = {}) {
  const nfts = (over.nfts ?? createMemoryNftStore()) as ReturnType<typeof createMemoryNftStore>;
  const properties = createMemoryPropertyStore(SEED_PROPERTIES.map(toPropertyInsert));
  const holdings = createMemoryHoldingStore([
    { userId: USER, propertyId: PROP, sharesOwned: 100, avgCostUsd: 12_500, updatedAt: new Date() },
  ]);
  const audit = createMemoryAuditStore();
  const deps: NftWorkerDeps = {
    nfts,
    minter: over.minter ?? createSimulatedNftMinter(),
    properties,
    holdings,
    audit,
    log: silentLog,
    maxAttempts: 3,
  };
  return { deps, nfts, properties, holdings, audit };
}

async function seedPending(nfts: NftStore): Promise<string> {
  const { record } = await nfts.insert({
    id: "nft_test",
    holdingKey: `${USER}:${PROP}`,
    userId: USER,
    propertyId: PROP,
    walletAddress: ADDR,
    metadataUrl: "http://localhost:8787/nft-metadata/nft_test.json",
  });
  return record.id;
}

function fakeQueue(collect: string[] = []) {
  return {
    async add(job: { name: string; data: { holdingNftId: string } }) {
      collect.push(job.data.holdingNftId);
    },
  };
}

describe("processNftJob — full lifecycle (Phase 1/6)", () => {
  it("pending → minting → minted → transferring → delivered with on-chain facts", async () => {
    const { deps, nfts, audit } = makeDeps();
    const id = await seedPending(nfts);

    const status = await processNftJob(deps, id, { attemptsMade: 0, attempts: 3 });
    expect(status).toBe("delivered");

    const r = await nfts.get(id);
    expect(r?.status).toBe("delivered");
    expect(r?.nftItemId).not.toBeNull();
    expect(r?.nftAddress).toBe(ADDR);
    expect(r?.mintTxHash?.startsWith("simulated:mint:")).toBe(true);
    expect(r?.transferTxHash?.startsWith("simulated:transfer:")).toBe(true);
    expect(r?.metadataUrl).toContain("/nft-metadata/nft_test.json");

    const actions = audit._rows.map((a) => a.action);
    expect(actions).toContain("nft.mint_started");
    expect(actions).toContain("nft.minted");
    expect(actions).toContain("nft.transfer_started");
    expect(actions).toContain("nft.delivered");
  });

  it("duplicate worker execution is a no-op (idempotent)", async () => {
    const { deps, nfts } = makeDeps();
    const id = await seedPending(nfts);
    await processNftJob(deps, id, { attemptsMade: 0, attempts: 3 });
    // Second run: claim fails → returns current status, no double-mint.
    const again = await processNftJob(deps, id, { attemptsMade: 0, attempts: 3 });
    expect(again).toBe("delivered");
    expect((await nfts.get(id))?.mintTxHash).toContain("simulated:mint:");
  });
});

describe("failures + retries (Phase 10)", () => {
  it("mint failure on the final attempt marks the record failed (retryable) and audits", async () => {
    const failing: NftMinter = {
      kind: "simulated",
      itemStatus: createSimulatedNftMinter().itemStatus,
      mint: async () => {
        throw new Error("mint boom");
      },
      transfer: createSimulatedNftMinter().transfer,
    };
    const { deps, nfts, audit } = makeDeps({ minter: failing });
    const id = await seedPending(nfts);

    await expect(
      processNftJob(deps, id, { attemptsMade: 2, attempts: 3 }),
    ).rejects.toThrow(/mint boom/);
    const r = await nfts.get(id);
    expect(r?.status).toBe("failed");
    expect(r?.errorCode).toBe("mint_failed");
    expect(r?.attempts).toBe(1);
    expect(audit._rows.some((a) => a.action === "nft.failed")).toBe(true);
  });

  it("transient mint failure releases back to pending so the next attempt re-claims", async () => {
    const failing: NftMinter = {
      kind: "simulated",
      itemStatus: createSimulatedNftMinter().itemStatus,
      mint: async () => {
        throw new Error("rpc timeout");
      },
      transfer: createSimulatedNftMinter().transfer,
    };
    const { deps, nfts } = makeDeps({ minter: failing });
    const id = await seedPending(nfts);

    await expect(
      processNftJob(deps, id, { attemptsMade: 0, attempts: 3 }),
    ).rejects.toThrow(/rpc timeout/);
    // Released back to pending for BullMQ retry.
    expect((await nfts.get(id))?.status).toBe("pending");
  });

  it("transient transfer failure releases back to minted (never re-mints)", async () => {
    const base = createSimulatedNftMinter();
    const failing: NftMinter = {
      kind: "simulated",
      itemStatus: createSimulatedNftMinter().itemStatus,
      mint: base.mint,
      transfer: async () => {
        throw new Error("transfer timeout");
      },
    };
    const { deps, nfts } = makeDeps({ minter: failing });
    const id = await seedPending(nfts);

    await expect(
      processNftJob(deps, id, { attemptsMade: 0, attempts: 3 }),
    ).rejects.toThrow(/transfer timeout/);
    const r = await nfts.get(id);
    expect(r?.status).toBe("minted"); // released, not re-minted
    expect(r?.mintTxHash).toContain("simulated:mint:");
  });

  it("retry: failed → pending → delivered", async () => {
    const failOnce: NftMinter = {
      kind: "simulated",
      itemStatus: createSimulatedNftMinter().itemStatus,
      mint: async () => {
        throw new Error("boom");
      },
      transfer: createSimulatedNftMinter().transfer,
    };
    const { deps, nfts } = makeDeps({ minter: failOnce });
    const id = await seedPending(nfts);

    await expect(
      processNftJob(deps, id, { attemptsMade: 2, attempts: 3 }),
    ).rejects.toThrow(/boom/);
    expect((await nfts.get(id))?.status).toBe("failed");

    // Admin retry: failed → pending, then process again with a working minter.
    const retried = await nfts.retry(id);
    expect(retried?.status).toBe("pending");
    const { deps: deps2, nfts: nfts2 } = makeDeps({ nfts });
    const status = await processNftJob(deps2, id, { attemptsMade: 0, attempts: 3 });
    expect(status).toBe("delivered");
    expect((await nfts2.get(id))?.status).toBe("delivered");
  });

  it("crash after broadcast: retry reconciles the on-chain item and does NOT double-mint", async () => {
    let mintCalls = 0;
    const base = createSimulatedNftMinter();
    const crashMinter: NftMinter = {
      kind: "simulated",
      // The on-chain item DID land (the simulated "chain" says it exists).
      itemStatus: async () => ({ exists: true, nftAddress: ADDR, ownerAddress: null }),
      mint: async ({ beforeSend }) => {
        mintCalls++;
        // Expectation persisted, then the process dies before markMinted.
        await beforeSend?.({ nftItemId: 5, mintTxHash: "expected-hash" });
        throw new Error("crash after broadcast");
      },
      transfer: base.transfer,
    };
    const { deps, nfts, audit } = makeDeps({ minter: crashMinter });
    const id = await seedPending(nfts);

    // First run: claim → mint → expectation persisted → crash → transient release.
    await expect(
      processNftJob(deps, id, { attemptsMade: 0, attempts: 3 }),
    ).rejects.toThrow(/crash/);
    let r = await nfts.get(id);
    expect(r?.status).toBe("pending"); // released for BullMQ retry
    expect(r?.nftItemId).toBe(5); // expectation survived the crash

    // Admin retry: check-before-mint finds the item → adopts it, transfers, delivers.
    await nfts.retry(id);
    const status = await processNftJob(deps, id, { attemptsMade: 0, attempts: 3 });
    expect(status).toBe("delivered");
    expect(mintCalls).toBe(1); // NEVER minted a second NFT
    r = await nfts.get(id);
    expect(r?.nftItemId).toBe(5);
    expect(r?.mintTxHash).toBe("expected-hash");
    expect(audit._rows.some((a) => a.action === "nft.mint_recovered")).toBe(true);
  });

  it("crash before broadcast: item never landed → retry mints fresh (nothing to adopt)", async () => {
    const crashMinter: NftMinter = {
      kind: "simulated",
      itemStatus: createSimulatedNftMinter().itemStatus,
      mint: async ({ beforeSend }) => {
        await beforeSend?.({ nftItemId: 5, mintTxHash: "expected-hash" });
        throw new Error("crash before broadcast");
      },
      transfer: createSimulatedNftMinter().transfer,
    };
    const { deps, nfts } = makeDeps({ minter: crashMinter });
    const id = await seedPending(nfts);

    await expect(
      processNftJob(deps, id, { attemptsMade: 0, attempts: 3 }),
    ).rejects.toThrow(/crash/);
    const before = await nfts.get(id);
    expect(before?.status).toBe("pending");
    expect(before?.nftItemId).toBe(5); // stale expectation

    // Retry with a working minter — reconciliation finds NO on-chain item → fresh mint.
    const { deps: deps2 } = makeDeps({ nfts });
    const status = await processNftJob(deps2, id, { attemptsMade: 0, attempts: 3 });
    expect(status).toBe("delivered");
    const r = await nfts.get(id);
    expect(r?.nftItemId).not.toBe(5); // fresh mint facts overwrote the stale expectation
    expect(r?.mintTxHash).toContain("simulated:mint:");
  });

  it("admin retry after a transfer failure re-uses the minted item (no second mint)", async () => {
    const base = createSimulatedNftMinter();
    const failTransfer: NftMinter = {
      kind: "simulated",
      itemStatus: base.itemStatus,
      mint: base.mint,
      transfer: async () => {
        throw new Error("transfer boom");
      },
    };
    const { deps, nfts } = makeDeps({ minter: failTransfer });
    const id = await seedPending(nfts);

    // Final-attempt transfer failure → failed, with the mint facts preserved.
    await expect(
      processNftJob(deps, id, { attemptsMade: 2, attempts: 3 }),
    ).rejects.toThrow(/transfer boom/);
    let r = await nfts.get(id);
    expect(r?.status).toBe("failed");
    expect(r?.nftItemId).not.toBeNull();
    expect(r?.mintTxHash).toContain("simulated:mint:");
    const mintHashBefore = r!.mintTxHash;

    // Retry: the item exists on-chain → adopt + transfer → delivered, SAME mint hash.
    await nfts.retry(id);
    const adopting: NftMinter = {
      ...createSimulatedNftMinter(),
      itemStatus: async () => ({ exists: true, nftAddress: r!.nftAddress!, ownerAddress: null }),
    };
    const { deps: deps2 } = makeDeps({ nfts, minter: adopting });
    const status = await processNftJob(deps2, id, { attemptsMade: 0, attempts: 3 });
    expect(status).toBe("delivered");
    r = await nfts.get(id);
    expect(r?.status).toBe("delivered");
    expect(r?.mintTxHash).toBe(mintHashBefore); // NOT re-minted
  });
});

describe("runNftSweep (recovery)", () => {
  it("re-enqueues stale pending records and times out stuck active ones", async () => {
    const { deps, nfts } = makeDeps();
    const staleId = await seedPending(nfts);
    // Make it stale by backdating.
    nfts._rows[0]!.createdAt = new Date(Date.now() - 60 * 60_000);

    const stuckId = "nft_stuck";
    await nfts.insert({
      id: stuckId,
      holdingKey: `${USER}:prop-other`,
      userId: USER,
      propertyId: "prop-other",
      walletAddress: ADDR,
    });
    await nfts.claimForMint(stuckId);
    nfts._rows.find((r) => r.id === stuckId)!.updatedAt = new Date(Date.now() - 2 * 60 * 60_000);

    const collect: string[] = [];
    const r = await runNftSweep(deps, fakeQueue(collect), {
      stalePendingMs: 5 * 60_000,
      staleActiveMs: 60 * 60_000,
    });

    expect(collect).toContain(staleId);
    expect(r.reenqueued).toBe(1);
    expect(r.timedOut).toBe(1);
    expect((await nfts.get(stuckId))?.status).toBe("failed");
    expect((await nfts.get(stuckId))?.errorCode).toBe("timeout");
  });

  it("does not re-enqueue fresh pending records", async () => {
    const { deps, nfts } = makeDeps();
    const id = await seedPending(nfts); // fresh
    const collect: string[] = [];
    const r = await runNftSweep(deps, fakeQueue(collect), {
      stalePendingMs: 5 * 60_000,
      staleActiveMs: 60 * 60_000,
    });
    expect(collect).not.toContain(id);
    expect(r.reenqueued).toBe(0);
  });
});

describe("settlement hook — purchase remains successful when NFT fails (Phase 1 rule)", () => {
  async function settleWithNft(nftDeps: { nfts?: NftStore; queue?: { add: (j: { name: string; data: { holdingNftId: string } }) => Promise<unknown> } }) {
    const users = createMemoryUserStore([
      { id: USER, displayName: "A", walletAddress: ADDR, withdrawalAddress: null },
    ]);
    const intents = createMemoryIntentStore();
    const properties = createMemoryPropertyStore(SEED_PROPERTIES.map(toPropertyInsert));
    const holdings = createMemoryHoldingStore();
    const transactions = createMemoryTxStore();
    const audit = createMemoryAuditStore();
    const nfts = nftDeps.nfts ?? createMemoryNftStore();

    const intent = await intents.create({
      id: "intent_test",
      userId: USER,
      propertyId: PROP,
      quantity: 5,
      priceUsdPerShare: 12_500,
      totalUsd: 62_500,
      feeUsd: 1_562,
      destinationAddress: ADDR,
      paidByWallet: ADDR,
      currency: "TON",
      expectedNanoTon: "100000000",
      expiresAt: new Date(Date.now() + 60_000),
    });
    await intents.markConfirmedIfPending("intent_test", USER, new Date(), { txHash: "txhash123" });

    const result = await settleVerifiedBuy(
      {
        intents,
        properties,
        holdings,
        transactions,
        audit,
        log: silentLog,
        nfts,
        nftQueue: nftDeps.queue ?? null,
        nftMetadataBaseUrl: "http://localhost:8787",
        users,
      },
      { intent, actualAmountNano: "100000000" },
    );

    return { result, holdings, nfts, intent };
  }

  it("creates a pending NFT request after a successful settlement", async () => {
    const collect: string[] = [];
    const { result, holdings, nfts } = await settleWithNft({ queue: fakeQueue(collect) });
    expect(result.ok).toBe(true);
    const holding = await holdings.get(USER, PROP);
    expect(holding?.sharesOwned).toBe(5);

    const record = await nfts.getByHolding(USER, PROP);
    expect(record?.status).toBe("pending");
    expect(record?.walletAddress).toBe(ADDR);
    expect(collect).toContain(record!.id);
  });

  it("a duplicate settlement event never creates a second NFT", async () => {
    const collect: string[] = [];
    const { result, nfts } = await settleWithNft({ queue: fakeQueue(collect) });
    expect(result.ok).toBe(true);
    // Second attempt for the same holding → record exists, not re-created.
    const again = await nfts.insert({
      id: "nft_dup",
      holdingKey: `${USER}:${PROP}`,
      userId: USER,
      propertyId: PROP,
      walletAddress: ADDR,
    });
    expect(again.created).toBe(false);
  });

  it("an NFT store failure never breaks the buy", async () => {
    const explodingNfts = createMemoryNftStore();
    const originalInsert = explodingNfts.insert.bind(explodingNfts);
    explodingNfts.insert = async () => {
      throw new Error("nft db exploded");
    };
    void originalInsert;
    const { result, holdings } = await settleWithNft({
      nfts: explodingNfts,
      queue: fakeQueue([]),
    });
    expect(result.ok).toBe(true);
    expect((await holdings.get(USER, PROP))?.sharesOwned).toBe(5);
  });

  it("no valid wallet → NFT request skipped, buy still succeeds", async () => {
    const users = createMemoryUserStore([
      { id: USER, displayName: "A", walletAddress: null, withdrawalAddress: null },
    ]);
    const intents = createMemoryIntentStore();
    const properties = createMemoryPropertyStore(SEED_PROPERTIES.map(toPropertyInsert));
    const holdings = createMemoryHoldingStore();
    const transactions = createMemoryTxStore();
    const audit = createMemoryAuditStore();
    const nfts = createMemoryNftStore();
    const intent = await intents.create({
      id: "intent_nowallet",
      userId: USER,
      propertyId: PROP,
      quantity: 5,
      priceUsdPerShare: 12_500,
      totalUsd: 62_500,
      destinationAddress: ADDR,
      paidByWallet: null,
      currency: "TON",
      expectedNanoTon: "100000000",
      expiresAt: new Date(Date.now() + 60_000),
    });
    await intents.markConfirmedIfPending("intent_nowallet", USER, new Date(), { txHash: "txhash456" });

    const result = await settleVerifiedBuy(
      {
        intents,
        properties,
        holdings,
        transactions,
        audit,
        log: silentLog,
        nfts,
        nftQueue: fakeQueue([]),
        nftMetadataBaseUrl: "http://localhost:8787",
        users,
      },
      { intent, actualAmountNano: "100000000" },
    );
    expect(result.ok).toBe(true);
    expect(await nfts.getByHolding(USER, PROP)).toBeNull();
  });
});

describe("requestNftForHolding direct", () => {
  it("skips invalid wallets", async () => {
    const nfts = createMemoryNftStore();
    const r = await requestNftForHolding(
      {
        nfts,
        queue: fakeQueue([]),
        log: silentLog,
      },
      { userId: USER, propertyId: PROP, paidByWallet: "not-a-wallet" },
    );
    expect(r).toBeNull();
    expect(nfts._rows).toHaveLength(0);
  });
});
