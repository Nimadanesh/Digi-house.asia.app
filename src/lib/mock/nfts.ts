// File responsibility: NftsRepo mock impl — simulated collectible-NFT receipts for demo mode.
// SIMULATED: no real on-chain minting; the statuses mirror what the API produces but the
// mint/transfer hashes are synthetic. The DB holding remains the source of truth — the NFT
// is display-only. Mirrors the HTTP /v1/nfts response shape.
import type { NftsRepo } from "@/lib/api/repos";
import type { HoldingNft } from "@/types/nft";
import { HOLDINGS } from "./seed/holdings";
import { PROPERTIES } from "./seed/properties";
import { USER } from "./seed/user";
import { sleep, jitter } from "./sleep";

function titleFor(propertyId: string): string {
  return PROPERTIES.find((p) => p.id === propertyId)?.title ?? propertyId;
}

function locationFor(propertyId: string): string {
  return PROPERTIES.find((p) => p.id === propertyId)?.location ?? "";
}

function sharesFor(propertyId: string): number {
  return HOLDINGS.find((h) => h.propertyId === propertyId)?.sharesOwned ?? 0;
}

// Demo state: one fully delivered (bayside), one still pending (alfama).
const state: HoldingNft[] = [
  {
    id: "nft-demo-bayside",
    propertyId: "prop-bayside-marina-penthouse",
    propertyTitle: titleFor("prop-bayside-marina-penthouse"),
    propertyLocation: locationFor("prop-bayside-marina-penthouse"),
    sharesOwned: sharesFor("prop-bayside-marina-penthouse"),
    status: "delivered",
    walletAddress: USER.walletAddress ?? "",
    collectionAddress: null,
    nftItemId: 100_001,
    nftAddress: null,
    metadataUrl: null,
    mintTxHash: "simulated:mint:bayside",
    transferTxHash: "simulated:transfer:bayside",
    attempts: 1,
    errorCode: null,
    errorMessage: null,
    createdAt: new Date(Date.now() - 12 * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86_400_000).toISOString(),
  },
  {
    id: "nft-demo-alfama",
    propertyId: "prop-alfama-terrace-flat",
    propertyTitle: titleFor("prop-alfama-terrace-flat"),
    propertyLocation: locationFor("prop-alfama-terrace-flat"),
    sharesOwned: sharesFor("prop-alfama-terrace-flat"),
    status: "pending",
    walletAddress: USER.walletAddress ?? "",
    collectionAddress: null,
    nftItemId: null,
    nftAddress: null,
    metadataUrl: null,
    mintTxHash: null,
    transferTxHash: null,
    attempts: 0,
    errorCode: null,
    errorMessage: null,
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
];

export function MockNftsRepo(): NftsRepo {
  return {
    async list() {
      await sleep(jitter());
      return state.map((n) => ({ ...n }));
    },
  };
}
