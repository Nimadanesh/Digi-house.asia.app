import type {
  PropertyMetaJson,
  PropertyRow,
  RentalPaymentJson,
} from "../db/schema/properties.js";

export type PropertyStatus = "draft" | "funding" | "funded" | "resale";

/** Public Listing JSON — matches Mini App `Listing` / OpenAPI. */
export type ListingPublic = {
  id: string;
  title: string;
  location: string;
  description: string;
  images: string[];
  totalShares: number;
  sharePriceUsd: number;
  status: PropertyStatus;
  ownerWalletAddress: string;
  annualRentUsd: number;
  createdAt: string;
  meta: PropertyMetaJson;
  rentalHistory: RentalPaymentJson[];
  sharesSold: number;
  sharesRemaining: number;
  fundingProgressRatio: number;
  salePaused: boolean;
  distributionPaused: boolean;
};

export function mapPropertyToListing(row: PropertyRow): ListingPublic {
  const totalShares = row.totalShares;
  const sharesSold = row.sharesSold;
  const sharesRemaining = totalShares - sharesSold;
  const fundingProgressRatio =
    totalShares > 0 ? sharesSold / totalShares : 0;
  const status = normalizeStatus(row.status);

  return {
    id: row.id,
    title: row.title,
    location: row.location,
    description: row.description,
    images: Array.isArray(row.images) ? row.images : [],
    totalShares,
    sharePriceUsd: Number(row.sharePriceUsd),
    status,
    ownerWalletAddress: row.ownerWalletAddress,
    annualRentUsd: Number(row.annualRentUsd),
    createdAt: row.createdAt.toISOString(),
    meta: row.meta,
    rentalHistory: Array.isArray(row.rentalHistory) ? row.rentalHistory : [],
    sharesSold,
    sharesRemaining,
    fundingProgressRatio,
    salePaused: row.salePaused,
    distributionPaused: row.distributionPaused,
  };
}

function normalizeStatus(s: string): PropertyStatus {
  if (s === "draft" || s === "funding" || s === "funded" || s === "resale") return s;
  return "funding";
}

export const PROPERTY_STATUSES: readonly PropertyStatus[] = [
  "draft",
  "funding",
  "funded",
  "resale",
] as const;

export function isPropertyStatus(v: string): v is PropertyStatus {
  return (PROPERTY_STATUSES as readonly string[]).includes(v);
}
