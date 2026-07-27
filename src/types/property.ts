export type PropertyStatus = "funding" | "funded" | "resale";

/** Static trust + unit facts shown on Property detail (Fable §About / §Trust). */
export interface PropertyMeta {
  sizeSqm: number;
  yearBuilt: number;
  propertyType: string;
  rentalStatus: "rented" | "vacant";
  /** ISO date (YYYY-MM-DD) while leased; null when vacant. */
  leaseUntil: string | null;
  activeTenant: boolean;
  /** Demo placeholder link — never claims on-chain verification in MVP. */
  tokenizationDocUrl: string;
}

/** Simulated rental receipt row for Property detail history (MVP honesty). */
export interface RentalPayment {
  id: string;
  paidAt: string;
  status: "paid";
}

export interface Property {
  id: string;
  title: string;
  location: string;
  description: string;
  images: string[];
  totalShares: number;
  sharePriceUsd: number; // minor units
  status: PropertyStatus;
  ownerWalletAddress: string;
  annualRentUsd: number; // minor units
  createdAt: string;
  meta: PropertyMeta;
  rentalHistory: RentalPayment[];
}

export interface Listing extends Property {
  sharesSold: number;
  sharesRemaining: number;
  fundingProgressRatio: number; // 0..1
}
