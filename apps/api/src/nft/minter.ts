// File responsibility: NFT minter seam (Phase 3/6). The NFT is a simple collectible with
// NO financial logic — standard TON NFT collection deploy_item + item transfer messages
// only (built with the repo's `ton`/`ton-core` primitives; this build ships no high-level
// NFT contract helpers, so the standard opcodes are encoded explicitly).
// Two implementations behind one interface:
//   * simulated — synthetic ids/hashes, clearly badged SIMULATED (demo + tests).
//   * ton       — real TON testnet minting from the minter wallet. Private keys NEVER live
//                 in code or the repo: the minter mnemonic comes from NFT_MINTER_MNEMONIC.
// When the TON config is incomplete, createTonNftMinter returns null — the worker then
// marks records `failed` with minter_not_configured (REQUIRES USER CONFIGURATION); we
// never guess credentials.
import { mnemonicToPrivateKey } from "ton-crypto";
import {
  Address,
  beginCell,
  type Cell,
  internal,
  SendMode,
  toNano,
  TonClient,
  WalletContractV4,
  type TupleItem,
} from "ton";
import { isValidTonAddress } from "../ton/address.js";
import type { NftMetadata } from "./metadata.js";

export type NftMintResult = {
  /** Item index within the collection. */
  nftItemId: number;
  /** Minted NFT item address (user-friendly). */
  nftAddress: string;
  /** Mint transaction hash (hex) — the signed external message hash. */
  mintTxHash: string;
};

export type NftTransferResult = {
  /** Transfer transaction hash (hex) — the signed external message hash. */
  transferTxHash: string;
};

export type NftMinter = {
  readonly kind: "simulated" | "ton";
  mint(input: {
    destinationAddress: string;
    collectionAddress: string | null;
    metadataUrl: string;
    metadata: NftMetadata;
    /**
     * Persist the EXPECTED on-chain facts (item index + tx hash) BEFORE broadcasting.
     * The worker uses this to close the crash window: if the process dies after the
     * send but before the record is marked minted, the persisted expectation lets a
     * retry reconcile via itemStatus instead of double-minting. If this callback
     * throws, the mint MUST abort without sending anything.
     */
    beforeSend?(facts: { nftItemId: number; mintTxHash: string }): Promise<void>;
  }): Promise<NftMintResult>;
  transfer(input: {
    nftAddress: string;
    toAddress: string;
  }): Promise<NftTransferResult>;
  /**
   * On-chain reconciliation: does the item at `itemIndex` exist, and who owns it?
   * Used by the retry path to adopt an already-landed mint instead of minting a
   * duplicate (check-before-mint). `nftAddress` is the deterministic item address
   * (present even when the item does not exist yet).
   */
  itemStatus(input: {
    collectionAddress: string | null;
    itemIndex: number;
  }): Promise<{ exists: boolean; nftAddress: string | null; ownerAddress: string | null }>;
};

/** Wallet validation for NFT delivery — reuse the repo's TON address check. */
export function isValidNftDestinationWallet(address: string): boolean {
  return isValidTonAddress(address);
}

/** Deterministic synthetic item index (high range, never collides with a real one in tests). */
function syntheticItemIndex(): number {
  return Math.floor(100_000 + Math.random() * 899_999);
}

function syntheticHash(prefix: string): string {
  return `${prefix}${Array.from({ length: 64 }, () =>
    "0123456789abcdef"[Math.floor(Math.random() * 16)],
  ).join("")}`;
}

/**
 * SIMULATED minter — no blockchain interaction. Produces the same record shape the TON
 * minter produces, but with synthetic ids/hashes. Used in demo mode (default) and every
 * test. Never claim this is a real on-chain NFT.
 */
export function createSimulatedNftMinter(): NftMinter {
  return {
    kind: "simulated",
    async mint({ destinationAddress, beforeSend }) {
      if (!isValidNftDestinationWallet(destinationAddress)) {
        throw new Error("invalid wallet address");
      }
      const facts = {
        nftItemId: syntheticItemIndex(),
        mintTxHash: syntheticHash("simulated:mint:"),
      };
      if (beforeSend) await beforeSend(facts);
      return { ...facts, nftAddress: destinationAddress };
    },
    async transfer({ nftAddress, toAddress }) {
      if (
        !isValidNftDestinationWallet(nftAddress) ||
        !isValidNftDestinationWallet(toAddress)
      ) {
        throw new Error("invalid wallet address");
      }
      return { transferTxHash: syntheticHash("simulated:transfer:") };
    },
    // Simulated mints cannot silently land on-chain — nothing to reconcile.
    async itemStatus() {
      return { exists: false, nftAddress: null, ownerAddress: null };
    },
  };
}

/** Standard NFT collection deploy_item body (opcode 2) — no financial logic. */
export function buildDeployItemBody(args: {
  queryId: number;
  itemIndex: number;
  ownerAddress: Address;
  content: Cell;
}): Cell {
  return beginCell()
    .storeUint(2, 32) // op: deploy_item
    .storeUint(args.queryId, 64)
    .storeUint(args.itemIndex, 256) // index (uint256 per the standard collection)
    .storeAddress(args.ownerAddress)
    .storeRef(args.content)
    .endCell();
}

/** Standard NFT item transfer body (opcode 0x5fcc3d14). */
export function buildTransferBody(args: {
  queryId: number;
  newOwner: Address;
}): Cell {
  return beginCell()
    .storeUint(0x5fcc3d14, 32) // op: transfer
    .storeUint(args.queryId, 64)
    .storeAddress(args.newOwner)
    .storeAddress(null) // response_destination
    .storeCoins(0) // custom payload amount
    .storeUint(0, 1) // custom_payload: maybe<cell> = null
    .storeCoins(toNano("0.01")) // forward_amount
    .storeRef(beginCell().endCell()) // forward_payload
    .endCell();
}

/** Standard off-chain metadata cell: dict with a single uri ref. */
export function buildOffChainMetadataCell(metadataUrl: string): Cell {
  return beginCell().storeUint(0x01, 8).storeStringRefTail(metadataUrl).endCell();
}

export type TonNftMinterConfig = {
  /** 24-word minter wallet mnemonic (from env, never logged). */
  mnemonic: string;
  /** TON NFT collection address (user-friendly). */
  collectionAddress: string;
  /** HTTP API v2 endpoint (Toncenter). Defaults to testnet. */
  toncenterUrl: string;
  /** Optional Toncenter API key. */
  toncenterApiKey?: string;
  /**
   * Network the minter operates on — the source of truth for the testOnly flag when
   * serializing NFT item addresses (testnet by default; mainnet requires explicit config).
   */
  network?: "testnet" | "mainnet";
  /** Optional injected client (tests). */
  client?: TonClient;
};

async function getWalletSeqno(client: TonClient, walletAddress: Address): Promise<number> {
  try {
    const res = await client.runMethod(walletAddress, "seqno");
    return Number(res.stack.readBigNumber());
  } catch {
    return 0; // wallet not deployed yet — seqno 0
  }
}

async function getNextItemIndex(client: TonClient, collection: Address): Promise<number> {
  const res = await client.runMethod(collection, "get_collection_data");
  // (next_item_index:int, collection_content:cell, owner_address:address)
  return Number(res.stack.readBigNumber());
}

async function getNftAddressByIndex(
  client: TonClient,
  collection: Address,
  index: number,
): Promise<Address> {
  const stack: TupleItem[] = [{ type: "int", value: BigInt(index) }];
  const res = await client.runMethod(collection, "get_nft_address_by_index", stack);
  return res.stack.readAddress();
}

/**
 * Builds the real TON minter when configuration is complete, else null.
 * Callers treat null as "minter not configured" — records go failed (retryable),
 * purchases are never affected. Testnet first: point TONCENTER_API_URL at testnet.
 */
export function createTonNftMinter(
  config: TonNftMinterConfig,
): NftMinter | null {
  const words = config.mnemonic.trim().split(/\s+/);
  if (words.length < 12) return null; // not a usable mnemonic
  if (!isValidTonAddress(config.collectionAddress)) return null;
  if (!config.toncenterUrl.trim()) return null;

  let client: TonClient;
  try {
    client =
      config.client ??
      new TonClient({
        endpoint: config.toncenterUrl,
        apiKey: config.toncenterApiKey,
      });
  } catch {
    return null;
  }

  const isTestnet = (config.network ?? "testnet") === "testnet";
  const toFriendly = (address: Address): string => address.toString({ testOnly: isTestnet });

  return {
    kind: "ton",
    async mint({ destinationAddress, collectionAddress, metadataUrl, beforeSend }) {
      if (!isValidNftDestinationWallet(destinationAddress)) {
        throw new Error("invalid wallet address");
      }
      const key = await mnemonicToPrivateKey(words);
      const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: key.publicKey,
      });
      const seqno = await getWalletSeqno(client, wallet.address);
      const collection = Address.parse(collectionAddress ?? config.collectionAddress);
      const itemIndex = await getNextItemIndex(client, collection);

      const content = buildOffChainMetadataCell(metadataUrl);
      const body = buildDeployItemBody({
        queryId: 0,
        itemIndex,
        ownerAddress: Address.parse(destinationAddress),
        content,
      });

      const transfer = wallet.createTransfer({
        seqno,
        secretKey: key.secretKey,
        sendMode: SendMode.PAY_GAS_SEPARATELY,
        messages: [
          internal({ to: collection, value: toNano("0.1"), body }),
        ],
      });
      const mintTxHash = transfer.hash().toString("hex");
      // Persist the expected facts BEFORE broadcasting (see NftMinter.mint.beforeSend).
      // If this throws, the mint aborts and NOTHING is sent on-chain.
      if (beforeSend) {
        await beforeSend({ nftItemId: itemIndex, mintTxHash });
      }
      await client.sendFile(transfer.toBoc());

      const nftAddress = await getNftAddressByIndex(client, collection, itemIndex);
      return {
        nftItemId: itemIndex,
        nftAddress: toFriendly(nftAddress),
        mintTxHash,
      };
    },
    async transfer({ nftAddress, toAddress }) {
      if (
        !isValidNftDestinationWallet(nftAddress) ||
        !isValidNftDestinationWallet(toAddress)
      ) {
        throw new Error("invalid wallet address");
      }
      const key = await mnemonicToPrivateKey(words);
      const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: key.publicKey,
      });
      const seqno = await getWalletSeqno(client, wallet.address);
      const item = Address.parse(nftAddress);

      const body = buildTransferBody({
        queryId: 0,
        newOwner: Address.parse(toAddress),
      });
      const transfer = wallet.createTransfer({
        seqno,
        secretKey: key.secretKey,
        sendMode: SendMode.PAY_GAS_SEPARATELY,
        messages: [{ ...internal({ to: item, value: toNano("0.05"), body }) }],
      });
      await client.sendFile(transfer.toBoc());

      return { transferTxHash: transfer.hash().toString("hex") };
    },
    async itemStatus({ collectionAddress, itemIndex }) {
      const collection = Address.parse(collectionAddress ?? config.collectionAddress);
      const nftAddress = await getNftAddressByIndex(client, collection, itemIndex);
      const friendly = toFriendly(nftAddress);
      try {
        // Standard get_nft_data: (init:int, index:int, collection:cell, owner:slice, content:cell).
        const res = await client.runMethod(nftAddress, "get_nft_data");
        const init = Number(res.stack.readBigNumber());
        if (init !== 1) {
          return { exists: false, nftAddress: friendly, ownerAddress: null };
        }
        res.stack.readBigNumber(); // index
        res.stack.readCell(); // collection cell
        const owner = res.stack.readAddressOpt();
        return {
          exists: true,
          nftAddress: friendly,
          ownerAddress: owner ? toFriendly(owner) : null,
        };
      } catch {
        // Item contract not deployed yet (or RPC error) → the mint never landed.
        return { exists: false, nftAddress: friendly, ownerAddress: null };
      }
    },
  };
}
