// File responsibility: legacy rate-based lock math (settlement paths only —
// NOT a display source). Slice 2 removed the fixture monthly/annual display
// shortcuts; user-facing income comes from the single presentation layer
// (lib/economics/property-presentation, V1-based).
//
// Preserved model (legacy weekly locks + whole-value helpers):
//   weekly  per share = sharePrice × (rate − 1pp) / 4     (legacy weekly-payout display rate)
// Example: $80 share @ 6% → $1.00/wk.
//
// Locked product decisions (PRODUCT-DECISION-LOCK.md §6, Final PO Decisions 3–5):
// - Profit is calculated AND communicated as a MONTHLY amount. Surfaces use the
//   full-rate monthly figure (monthlyUsd) labeled monthly — never "weekly profit
//   / weekly yield". Weekly transfers are a payment schedule, not profit frequency.
// - shareWeeklyYieldUsd/weeklyUsd survive ONLY for preserved legacy weekly lock
//   records and their settlement math. They must never feed user-facing income
//   display for new positions.
// - The "− 1pp" in the weekly display rate is NOT the withdrawal 1% fee. The
//   withdrawal fee (1%, net paid in 4 weekly installments) is charged separately
//   at request time in the withdrawal flow (see mock/withdrawals.ts
//   WITHDRAWAL_FEE_BPS vs yield-math.ts LEGACY_WEEKLY_RATE_PENALTY_PP).
//   The exact legal/accounting meaning of the withdrawal 1% remains a Product
//   Owner decision — see PRODUCT-DECISION-LOCK.md. Do not conflate the two.
import type { Listing } from "@/types/property";

/** Legacy weekly display rate for one share (rate − 1pp, integer cents).
 * Preserved ONLY for legacy weekly lock records + their settlement math.
 * User-facing income display must use the single presentation layer
 * (lib/economics/property-presentation, V1-based). */
export function shareWeeklyYieldUsd(listing: Listing): number {
  return Math.round(
    (listing.sharePriceUsd * (listing.monthlyYieldRate - 1)) / 100 / 4,
  );
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
