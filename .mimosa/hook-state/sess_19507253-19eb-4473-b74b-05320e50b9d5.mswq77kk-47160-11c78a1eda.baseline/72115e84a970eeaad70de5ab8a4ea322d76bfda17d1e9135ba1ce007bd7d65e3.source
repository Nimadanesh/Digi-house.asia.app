// File responsibility: rate-based yield math for property display (PRODUCT-PLAN §0.4).
// One source of truth so marketplace cards, property detail, and the buy sheet always agree.
//
// Model (user spec): each property has a monthly yield rate (4.5–7.5%). Yield is applied
// to the invested amount (shares × share price):
//   monthly per share = sharePrice × rate
//   weekly  per share = sharePrice × (rate − 1pp) / 4     (weekly option pays rate − 1%)
//   annual  per share = monthly × 12
// Example: $80 share @ 6% → $4.80/mo; 10 shares = $800 invested → $48/mo → $576/yr.
import type { Listing } from "@/types/property";

/** Monthly yield for one share, integer cents. */
export function shareMonthlyYieldUsd(listing: Listing): number {
  return Math.round((listing.sharePriceUsd * listing.monthlyYieldRate) / 100);
}

/** Weekly yield for one share (rate − 1pp, paid as 4 weekly installments), integer cents. */
export function shareWeeklyYieldUsd(listing: Listing): number {
  return Math.round(
    (listing.sharePriceUsd * (listing.monthlyYieldRate - 1)) / 100 / 4,
  );
}

/** Annual yield for one share, integer cents. */
export function shareAnnualYieldUsd(listing: Listing): number {
  return shareMonthlyYieldUsd(listing) * 12;
}

/** Annual return as a 0..1 ratio for pct(): rate × 12 (6%/mo → 0.72 → "72%"). */
export function annualReturnRatio(listing: Listing): number {
  return (listing.monthlyYieldRate * 12) / 100;
}

/** Amount offered in the primary sale: totalShares × sharePrice, cents. */
export function offeredValueUsd(listing: Listing): number {
  return listing.totalShares * listing.sharePriceUsd;
}

/** Whole-property value; falls back to the offered amount when unknown. */
export function totalValueUsd(listing: Listing): number {
  return listing.totalValueUsd || offeredValueUsd(listing);
}

/** Rate-based yield projection for a position of `shares` shares. */
export function positionYieldUsd(
  listing: Listing,
  shares: number,
): {
  investedUsd: number;
  monthlyUsd: number;
  weeklyUsd: number;
  annualUsd: number;
} {
  const investedUsd = shares * listing.sharePriceUsd;
  return {
    investedUsd,
    monthlyUsd: Math.round((investedUsd * listing.monthlyYieldRate) / 100),
    weeklyUsd: Math.round(
      (investedUsd * (listing.monthlyYieldRate - 1)) / 100 / 4,
    ),
    annualUsd: Math.round((investedUsd * listing.monthlyYieldRate * 12) / 100),
  };
}
