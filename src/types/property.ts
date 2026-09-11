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
  /** Whole-property value, minor units (offered = totalShares × sharePriceUsd). */
  totalValueUsd: number;
  /** Nightly rate display string (mixed currencies, e.g. "$52,200" / "€38,575");
   *  present on marketplace cards fed from villa source rates. */
  nightlyRate?: string;
}

export interface Listing extends Property {
  sharesSold: number;
  sharesRemaining: number;
  fundingProgressRatio: number; // 0..1
  /** Monthly yield rate (%) paid on locked shares — 4.50–7.50 (PRODUCT-PLAN §0.4). */
  monthlyYieldRate: number;
  /** Latest secondary-market executed price, minor units (PD-04/PD-07); absent before the first fill. */
  lastTradeUsd?: number;
  /**
   * Seeded order-book best ask snapshot, minor units (Slice 2 presentation layer).
   * Attached at the mock boundary from the same seed the live order book serves, so
   * book-less surfaces (marketplace cards) agree with book-fed surfaces (detail).
   * Absent on funding listings (no book) and unknown ids.
   */
  bestAskUsd?: number | null;
}
