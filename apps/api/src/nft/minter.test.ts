import { describe, expect, it } from "vitest";
import { Address, beginCell, type TonClient } from "ton";
import {
  buildDeployItemBody,
  buildOffChainMetadataCell,
  buildTransferBody,
  createSimulatedNftMinter,
  createTonNftMinter,
  isValidNftDestinationWallet,
} from "./minter.js";

// Deterministic valid user-friendly addresses (checksummed by the Address builder).
const VALID_ADDR = new Address(0, Buffer.alloc(32, 1)).toString();
const ADDR2 = new Address(0, Buffer.alloc(32, 2)).toString();

describe("isValidNftDestinationWallet", () => {
  it("accepts valid TON addresses", () => {
    expect(isValidNftDestinationWallet(VALID_ADDR)).toBe(true);
  });

  it("rejects junk, empty and malformed addresses", () => {
    for (const bad of ["", "abc", "EQ", "not-an-address-at-all", "0x1234"]) {
      expect(isValidNftDestinationWallet(bad), bad).toBe(false);
    }
  });
});

describe("createSimulatedNftMinter", () => {
  it("mints with synthetic facts and validates the destination", async () => {
    const minter = createSimulatedNftMinter();
    expect(minter.kind).toBe("simulated");
    const r = await minter.mint({
      destinationAddress: VALID_ADDR,
      collectionAddress: null,
      metadataUrl: "http://localhost:8787/nft-metadata/nft_x.json",
      metadata: { name: "x", description: "y", attributes: [] },
    });
    expect(r.nftItemId).toBeGreaterThanOrEqual(100_000);
    expect(r.mintTxHash.startsWith("simulated:mint:")).toBe(true);
  });

  it("rejects an invalid destination (no mint)", async () => {
    const minter = createSimulatedNftMinter();
    await expect(
      minter.mint({
        destinationAddress: "junk",
        collectionAddress: null,
        metadataUrl: "",
        metadata: { name: "x", description: "y", attributes: [] },
      }),
    ).rejects.toThrow(/invalid wallet/i);
  });

  it("transfers to the user wallet and validates both sides", async () => {
    const minter = createSimulatedNftMinter();
    const r = await minter.transfer({ nftAddress: VALID_ADDR, toAddress: ADDR2 });
    expect(r.transferTxHash.startsWith("simulated:transfer:")).toBe(true);
    await expect(
      minter.transfer({ nftAddress: "bad", toAddress: VALID_ADDR }),
    ).rejects.toThrow(/invalid wallet/i);
  });
});

describe("createTonNftMinter config gate (REQUIRES USER CONFIGURATION)", () => {
  const MNEMONIC =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  it("returns null when the mnemonic is missing or too short", () => {
    expect(
      createTonNftMinter({
        mnemonic: "",
        collectionAddress: VALID_ADDR,
        toncenterUrl: "https://testnet.toncenter.com/api/v2/jsonRPC",
      }),
    ).toBeNull();
    expect(
      createTonNftMinter({
        mnemonic: "one two three",
        collectionAddress: VALID_ADDR,
        toncenterUrl: "https://testnet.toncenter.com/api/v2/jsonRPC",
      }),
    ).toBeNull();
  });

  it("returns null when the collection address is invalid", () => {
    expect(
      createTonNftMinter({
        mnemonic: MNEMONIC,
        collectionAddress: "not-an-address",
        toncenterUrl: "https://testnet.toncenter.com/api/v2/jsonRPC",
      }),
    ).toBeNull();
  });

  it("returns null when no Toncenter endpoint is configured", () => {
    expect(
      createTonNftMinter({
        mnemonic: MNEMONIC,
        collectionAddress: VALID_ADDR,
        toncenterUrl: "",
      }),
    ).toBeNull();
  });
});

describe("createTonNftMinter — broadcast ordering, network serialization, reconciliation", () => {
  // Standard 24-word BIP-39 test vector (public fixture, not a secret).
  const MNEMONIC_24 =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art";
  const ITEM_ADDR = new Address(0, Buffer.alloc(32, 3));
  const OWNER_ADDR = new Address(0, Buffer.alloc(32, 4));

  // Injected fake TonClient: seqno/get_collection_data/get_nft_address_by_index return
  // deterministic values; get_nft_data can be scripted (throw → not deployed).
  function makeClient(opts: { nftDataThrows?: boolean; nftDataOwner?: Address | null } = {}) {
    const events: string[] = [];
    const runMethod = async (_addr: unknown, method: string) => {
      const stack = {
        readBigNumber: () => (method === "get_nft_data" ? 1n : 0n),
        readAddress: () => ITEM_ADDR,
        readAddressOpt: () => opts.nftDataOwner ?? null,
        readCell: () => beginCell().endCell(),
      };
      if (method === "get_nft_data" && opts.nftDataThrows) {
        throw new Error("contract not found");
      }
      return { stack };
    };
    const sendFile = async () => {
      events.push("sendFile");
    };
    return { client: { runMethod, sendFile } as unknown as TonClient, events };
  }

  function makeMinter(client: TonClient, network: "testnet" | "mainnet" = "testnet") {
    return createTonNftMinter({
      mnemonic: MNEMONIC_24,
      collectionAddress: VALID_ADDR,
      toncenterUrl:
        network === "testnet"
          ? "https://testnet.toncenter.com/api/v2/jsonRPC"
          : "https://toncenter.com/api/v2/jsonRPC",
      network,
      client,
    })!;
  }

  it("persists expected facts via beforeSend BEFORE broadcasting (crash-window close)", async () => {
    const { client, events } = makeClient();
    const minter = makeMinter(client);
    const seen: { facts: { nftItemId: number; mintTxHash: string } | null } = { facts: null };
    const r = await minter.mint({
      destinationAddress: VALID_ADDR,
      collectionAddress: null,
      metadataUrl: "https://api.example.com/nft-metadata/nft_x.json",
      metadata: { name: "x", description: "y", attributes: [] },
      beforeSend: async (facts) => {
        seen.facts = facts;
        events.push("beforeSend");
      },
    });
    expect(seen.facts?.nftItemId).toBe(0);
    expect(seen.facts?.mintTxHash).toBe(r.mintTxHash);
    expect(events).toEqual(["beforeSend", "sendFile"]);
  });

  it("serializes the item address with the testnet flag (testOnly) by default", async () => {
    const { client } = makeClient();
    const minter = makeMinter(client, "testnet");
    const r = await minter.mint({
      destinationAddress: VALID_ADDR,
      collectionAddress: null,
      metadataUrl: "",
      metadata: { name: "x", description: "y", attributes: [] },
    });
    expect(r.nftAddress).toBe(ITEM_ADDR.toString({ testOnly: true }));
    expect(r.nftAddress).not.toBe(ITEM_ADDR.toString({ testOnly: false }));
  });

  it("serializes the item address as mainnet-form only when the network is configured mainnet", async () => {
    const { client } = makeClient();
    const minter = makeMinter(client, "mainnet");
    const r = await minter.mint({
      destinationAddress: VALID_ADDR,
      collectionAddress: null,
      metadataUrl: "",
      metadata: { name: "x", description: "y", attributes: [] },
    });
    expect(r.nftAddress).toBe(ITEM_ADDR.toString({ testOnly: false }));
  });

  it("a failing beforeSend aborts the mint — nothing is broadcast", async () => {
    const { client, events } = makeClient();
    const minter = makeMinter(client);
    await expect(
      minter.mint({
        destinationAddress: VALID_ADDR,
        collectionAddress: null,
        metadataUrl: "",
        metadata: { name: "x", description: "y", attributes: [] },
        beforeSend: async () => {
          throw new Error("nft: expectation persist failed");
        },
      }),
    ).rejects.toThrow(/expectation persist failed/);
    expect(events).not.toContain("sendFile");
  });

  it("itemStatus reports an existing item with its owner (check-before-mint)", async () => {
    const { client } = makeClient({ nftDataOwner: OWNER_ADDR });
    const minter = makeMinter(client);
    const s = await minter.itemStatus({ collectionAddress: null, itemIndex: 3 });
    expect(s.exists).toBe(true);
    expect(s.nftAddress).toBe(ITEM_ADDR.toString({ testOnly: true }));
    expect(s.ownerAddress).toBe(OWNER_ADDR.toString({ testOnly: true }));
  });

  it("itemStatus reports not-exists when the item contract is not deployed", async () => {
    const { client } = makeClient({ nftDataThrows: true });
    const minter = makeMinter(client);
    const s = await minter.itemStatus({ collectionAddress: null, itemIndex: 9 });
    expect(s.exists).toBe(false);
    expect(s.ownerAddress).toBeNull();
    // The deterministic item address is still reported for reference.
    expect(s.nftAddress).toBe(ITEM_ADDR.toString({ testOnly: true }));
  });
});

describe("message builders (standard TON NFT opcodes, no financial logic)", () => {
  it("deploy_item body carries op 2, query id, index, owner and the off-chain content ref", () => {
    const content = buildOffChainMetadataCell("https://api.example.com/nft-metadata/nft_x.json");
    const body = buildDeployItemBody({
      queryId: 7,
      itemIndex: 42,
      ownerAddress: Address.parse(VALID_ADDR),
      content,
    });
    const slice = body.beginParse();
    expect(Number(slice.loadUint(32))).toBe(2); // op: deploy_item
    expect(Number(slice.loadUint(64))).toBe(7); // query_id
    expect(Number(slice.loadUint(256))).toBe(42); // index
    expect(slice.loadAddress()!.toString()).toBe(
      Address.parse(VALID_ADDR).toString(),
    );
    const ref = slice.loadRef().beginParse();
    expect(Number(ref.loadUint(8))).toBe(0x01); // off-chain layout
    expect(ref.loadStringTail()).toBe("https://api.example.com/nft-metadata/nft_x.json");
  });

  it("transfer body carries op 0x5fcc3d14 and the new owner", () => {
    const body = buildTransferBody({ queryId: 0, newOwner: Address.parse(ADDR2) });
    const slice = body.beginParse();
    expect(Number(slice.loadUint(32))).toBe(0x5fcc3d14);
    expect(Number(slice.loadUint(64))).toBe(0);
    expect(slice.loadAddress()!.toString()).toBe(Address.parse(ADDR2).toString());
  });

  it("off-chain metadata cell uses the standard uri dict layout", () => {
    const cell = buildOffChainMetadataCell("https://api.example.com/m.json");
    const s = cell.beginParse();
    expect(Number(s.loadUint(8))).toBe(0x01);
    expect(s.loadStringTail()).toBe("https://api.example.com/m.json");
    // beginCell round-trips cleanly
    expect(beginCell().storeSlice(cell.beginParse()).endCell().hash().equals(cell.hash())).toBe(true);
  });
});
