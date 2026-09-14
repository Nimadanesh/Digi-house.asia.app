// File responsibility: Phase 9 Slice 2 — THE single canonical financial presentation
// layer. Marketplace cards AND property detail pages consume these functions; no
// user-facing surface derives displayed economics any other way.
//
// Approved paths (delegation only — no new math is invented here):
// - primary share price: CANONICAL_BASE_PRICE_USD ($100, canonical-offering)
// - per-share income: BASE-scenario owner profit ÷ total shares
//   (PO decision 2026-09-13, Estate Page Structure §3/§8 D1: the presented
//   Monthly Income and Proj./Year figures MUST equal the Base scenario card —
//   the pre-D11 average-based perShare is retired from display). Derivation is
//   integer-cents half-up, mirroring the engine's own per-share smoothing
//   (monthly = annual ÷ 12, rounded half-up).
//   null = UNKNOWN → callers render pending, never 0, never a fixture figure
// - current price: getCurrentSharePrice(listing, { bestAskUsd: listing.bestAskUsd })
//   (the mock boundary attaches the seeded bestAsk snapshot so cards, which have no
//   live book, agree with detail pages, whose live book serves the identical seed
//   value; placed orders never move best, so the snapshot cannot drift)
// - valuation: canonical offering valuation (listing.totalValueUsd post-canonicalization)
// - supply/progress: canonical offering totals + demo-ledger sold/remaining
//   (toCanonicalListing; real demo facts under the global DEMO disclosure)
// - modeled occupancy: presentation equivalent of the locked scenario nights
//   (nights ÷ 365; average = mean of the three locked night counts). Labeled
//   MODELED everywhere — never observed, never a promise. PO decision
//   2026-09-13 ("occupancy on the Average basis") while the dataset occupancy
//   stays UNKNOWN.
import type { Listing } from "@/types/property";
import type {
  FinancialModelV1Currency,
  FinancialModelV1PropertyModel,
  FinancialModelV1ScenarioResult,
} from "@/types/financial-model-v1";
import {
  getFinancialModelV1,
  getFinancialModelV1Input,
} from "./estates/financial-model-v1-inputs";
import { CANONICAL_BASE_PRICE_USD } from "./canonical-offering";
import { getCurrentSharePrice } from "@/lib/property-price";

/**
 * Why presented monthly income is UNKNOWN (Slice 3). Classified from the V1
 * input — never string-matched, never invented:
 * - eur_mixed_currency: rental income is non-USD while the reserve is USD
 *   denominated and no approved FX rate exists;
 * - unknown_owner_tax: the V1 input records explicitly unknown owner-side tax
 *   (listing taxes carry revenueTreatment UNKNOWN).
 */
export type PresentedIncomeUnknownKind =
  | "eur_mixed_currency"
  | "unknown_owner_tax";

/** Presented monthly income per share. Null cents = UNKNOWN → render pending. */
export interface PresentedMonthlyIncome {
  /** V1 per-share monthly income, minor units. Null when V1 cannot compute. */
  cents: number | null;
  currency: FinancialModelV1Currency;
  /** Machine-readable unknown cause (null when known, or when no V1 input exists). */
  unknownKind: PresentedIncomeUnknownKind | null;
}

/** Single approved primary share price for every villa. */
export function getPresentedPrimaryPrice(): number {
  return CANONICAL_BASE_PRICE_USD;
}

/**
 * Per-share figures for ONE V1 scenario: owner profit ÷ total shares, integer
 * cents half-up (annual), monthly = annual ÷ 12 half-up — the same smoothing
 * the engine applies to its own per-share output. Null while the scenario's
 * owner profit is UNKNOWN (EUR mixed currency) or shares are not positive.
 */
export function v1ScenarioPerShareCents(
  scenario: FinancialModelV1ScenarioResult,
  totalShares: number,
): { annualCents: number | null; monthlyCents: number | null } {
  if (scenario.ownerProfitCents == null || totalShares <= 0) {
    return { annualCents: null, monthlyCents: null };
  }
  const annualCents = Math.round(scenario.ownerProfitCents / totalShares);
  return { annualCents, monthlyCents: Math.round(annualCents / 12) };
}

/**
 * Modeled occupancy equivalent of one scenario, whole percent: locked nights
 * ÷ 365 (Conservative 220 → ≈60%, Base 273 → ≈75%, Optimistic 328 → ≈90%).
 * The Average scenario has no night count — it uses the mean of the three
 * locked counts (≈274 nights → ≈75%). MODELED presentation only, never
 * observed and never a promise; null when nights are absent.
 */
export function v1ModeledOccupancyPct(
  scenario: FinancialModelV1ScenarioResult,
  v1: Pick<FinancialModelV1PropertyModel, "conservative" | "base" | "optimistic">,
): number | null {
  if (scenario.nights != null) {
    return scenario.nights > 0 ? Math.round((scenario.nights / 365) * 100) : null;
  }
  // Average: mean of the three locked night counts (all three are set).
  const locked = [v1.conservative.nights, v1.base.nights, v1.optimistic.nights];
  if (locked.some((n) => n == null || n <= 0)) return null;
  const meanNights = Math.round(
    (locked.reduce<number>((sum, n) => sum + (n ?? 0), 0)) / 3,
  );
  return meanNights > 0 ? Math.round((meanNights / 365) * 100) : null;
}

/** Single approved monthly income per share for a villa (V1 Base, or UNKNOWN). */
export function getPresentedMonthlyIncome(propertyId: string): PresentedMonthlyIncome {
  const v1 = getFinancialModelV1(propertyId);
  const monthly = v1 ? v1ScenarioPerShareCents(v1.base, v1.totalShares).monthlyCents : null;
  if (monthly != null) {
    return {
      cents: monthly,
      currency: v1?.currency ?? "USD",
      unknownKind: null,
    };
  }
  const input = getFinancialModelV1Input(propertyId);
  const unknownKind =
    input == null
      ? null
      : input.anr.currency !== "USD"
        ? "eur_mixed_currency"
        : input.ownerTax.kind === "unknown"
          ? "unknown_owner_tax"
          : null;
  return {
    cents: null,
    currency: v1?.currency ?? input?.anr.currency ?? "USD",
    unknownKind,
  };
}

/** Single approved annual income per share for a villa (V1 Base, or UNKNOWN). */
export function getPresentedAnnualIncome(propertyId: string): PresentedMonthlyIncome {
  const v1 = getFinancialModelV1(propertyId);
  const annual = v1 ? v1ScenarioPerShareCents(v1.base, v1.totalShares).annualCents : null;
  if (annual != null) {
    return {
      cents: annual,
      currency: v1?.currency ?? "USD",
      unknownKind: null,
    };
  }
  const input = getFinancialModelV1Input(propertyId);
  const unknownKind =
    input == null
      ? null
      : input.anr.currency !== "USD"
        ? "eur_mixed_currency"
        : input.ownerTax.kind === "unknown"
          ? "unknown_owner_tax"
          : null;
  return {
    cents: null,
    currency: v1?.currency ?? input?.anr.currency ?? "USD",
    unknownKind,
  };
}

/**
 * Short human-readable caption for an unknown income figure (Slice 3). Null
 * when known — callers render the value instead. English-only, same precedent
 * as the unavailable vocabulary (translators follow up per locale process).
 */
export function presentedIncomeUnknownCaption(
  kind: PresentedIncomeUnknownKind | null,
): string | null {
  switch (kind) {
    case "eur_mixed_currency":
      return "Income is in EUR — no approved USD conversion.";
    case "unknown_owner_tax":
      return "Owner-side tax is not published yet.";
    default:
      return null;
  }
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
