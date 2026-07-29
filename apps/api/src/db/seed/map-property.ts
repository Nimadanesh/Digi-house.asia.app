import type { SEED_PROPERTIES } from "./properties-data.js";

export function toPropertyInsert(s: (typeof SEED_PROPERTIES)[number]) {
  const now = new Date();
  return {
    id: s.id,
    title: s.title,
    location: s.location,
    description: s.description,
    images: s.images,
    totalShares: s.totalShares,
    sharePriceUsd: s.sharePriceUsd,
    status: s.status,
    ownerWalletAddress: s.ownerWalletAddress,
    annualRentUsd: s.annualRentUsd,
    sharesSold: s.sharesSold,
    jettonDecimals: 9,
    tokenizationStatus: "pending" as const,
    meta: s.meta,
    rentalHistory: s.rentalHistory,
    onchainMaster: null as string | null,
    distributionAddress: null as string | null,
    createdAt: new Date(s.createdAt),
    updatedAt: now,
  };
}
