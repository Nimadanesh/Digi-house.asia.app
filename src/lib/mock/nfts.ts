// File responsibility: NftsRepo mock impl — simulated collectible-NFT receipts for demo mode.
// SIMULATED: no real on-chain minting; the statuses mirror what the API produces but the
// mint/transfer hashes are synthetic. The DB holding remains the source of truth — the NFT
// is display-only. Mirrors the HTTP /v1/nfts response shape.
import type { NftsRepo } from "@/lib/api/repos";
import type { HoldingNft } from "@/types/nft";
import { HOLDINGS } from "./seed/holdings";
import { USER } from "./seed/user";
import { getEstateDisplayIdentity } from "@/lib/economics/estates/estate-display-identity";
import { PROPERTIES } from "./seed/properties";
import { sleep, jitter } from "./sleep";

function titleFor(propertyId: string): string {
  // Canonical display identity (Final PO Decision 6); fixture fallback for unmapped ids.
  const fixture = PROPERTIES.find((p) => p.id === propertyId);
  return getEstateDisplayIdentity(propertyId, {
    title: fixture?.title,
    location: fixture?.location,
    images: fixture?.images,
  }).name;
}

function locationFor(propertyId: string): string {
  const fixture = PROPERTIES.find((p) => p.id === propertyId);
  return getEstateDisplayIdentity(propertyId, {
    title: fixture?.title,
    location: fixture?.location,
    images: fixture?.images,
  }).location;
}

function sharesFor(propertyId: string): number {
  return HOLDINGS.find((h) => h.propertyId === propertyId)?.sharesOwned ?? 0;
}

// Demo state: one fully delivered (Syrene), one still pending (Villa du Cap).
const state: HoldingNft[] = [
  {
    id: "nft-demo-re-108924",
    propertyId: "re-108924",
    propertyTitle: titleFor("re-108924"),
    propertyLocation: locationFor("re-108924"),
    sharesOwned: sharesFor("re-108924"),
    status: "delivered",
    walletAddress: USER.walletAddress ?? "",
    collectionAddress: null,
    nftItemId: 100_001,
    nftAddress: null,
    metadataUrl: null,
    mintTxHash: "simulated:mint:re-108924",
    transferTxHash: "simulated:transfer:re-108924",
    attempts: 1,
    errorCode: null,
    errorMessage: null,
    createdAt: new Date(Date.now() - 12 * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86_400_000).toISOString(),
  },
  {
    id: "nft-demo-re-123861",
    propertyId: "re-123861",
    propertyTitle: titleFor("re-123861"),
    propertyLocation: locationFor("re-123861"),
    sharesOwned: sharesFor("re-123861"),
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
