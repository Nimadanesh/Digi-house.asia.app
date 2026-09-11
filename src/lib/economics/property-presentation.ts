// File responsibility: Phase 9 Slice 2 — THE single canonical financial presentation
// layer. Marketplace cards AND property detail pages consume these functions; no
// user-facing surface derives displayed economics any other way.
//
// Approved paths (delegation only — no new math is invented here):
// - primary share price: CANONICAL_BASE_PRICE_USD ($100, canonical-offering)
// - monthly income per share: V1 perShare.monthlyCents (financial-model-v1);
//   null = UNKNOWN → callers render pending, never 0, never a fixture figure
// - current price: getCurrentSharePrice(listing, { bestAskUsd: listing.bestAskUsd })
//   (the mock boundary attaches the seeded bestAsk snapshot so cards, which have no
//   live book, agree with detail pages, whose live book serves the identical seed
//   value; placed orders never move best, so the snapshot cannot drift)
// - valuation: canonical offering valuation (listing.totalValueUsd post-canonicalization)
// - supply/progress: canonical offering totals + demo-ledger sold/remaining
//   (toCanonicalListing; real demo facts under the global DEMO disclosure)
import type { Listing } from "@/types/property";
import type { FinancialModelV1Currency } from "@/types/financial-model-v1";
import { getFinancialModelV1 } from "./estates/financial-model-v1-inputs";
import { CANONICAL_BASE_PRICE_USD } from "./canonical-offering";
import { getCurrentSharePrice } from "@/lib/property-price";

/** Presented monthly income per share. Null cents = UNKNOWN → render pending. */
export interface PresentedMonthlyIncome {
  /** V1 per-share monthly income, minor units. Null when V1 cannot compute. */
  cents: number | null;
  currency: FinancialModelV1Currency;
}

/** Single approved primary share price for every villa. */
export function getPresentedPrimaryPrice(): number {
  return CANONICAL_BASE_PRICE_USD;
}

/** Single approved monthly income per share for a villa (V1, or UNKNOWN). */
export function getPresentedMonthlyIncome(propertyId: string): PresentedMonthlyIncome {
  const v1 = getFinancialModelV1(propertyId);
  return {
    cents: v1?.perShare.monthlyCents ?? null,
    currency: v1?.perShare.currency ?? "USD",
  };
}

/** Presented monthly income for a position of `shares` shares (null when UNKNOWN). */
export function presentPositionMonthlyIncome(
  propertyId: string,
  shares: number,
): number | null {
  const { cents } = getPresentedMonthlyIncome(propertyId);
  return cents == null ? null : cents * shares;
}

/** Single approved current price for display surfaces (cards and detail alike). */
export function getPresentedCurrentPrice(
  listing: Pick<
    Listing,
    "status" | "sharePriceUsd" | "lastTradeUsd" | "bestAskUsd"
  >,
): number {
  return getCurrentSharePrice(listing, { bestAskUsd: listing.bestAskUsd ?? undefined });
}
