// File responsibility: THE single canonical share-supply + base-price source for the
// FractionalLuxe product (Final PO Decisions 1–2).
//
// Canonical model (V1 economic model):
//   Total shares = property valuation ÷ $100
//   Base share price = $100 per share at the primary offering (minor: 10_000)
// Grand example: $8,000,000 ÷ $100 = 80,000 shares.
//
// Sourcing: approved ESTIMATED valuations from the V1 inputs (themselves derived
// verbatim from ESTATE-24-DATA.json). Fixture supplies (2,500 / 600–2,500),
// fixture prices ($85–$150), and mock supply values are NOT authoritative and must
// never be used for user-facing ownership or primary-offering calculations.
//
// Sold/remaining/progress have NO canonical source (no canonical sales ledger).
// They are derived from the live demo ownership ledger (mock holdings) at the
// mock boundary (see ../mock/canonical-listing.ts) — real demo-ledger facts under
// the global DEMO disclosure, never fixture canon, never invented certainty.
// Pure module: no React, no IO. Leaf-adjacent: imports types + V1 inputs only.
import { getFinancialModelV1Input } from "./estates/financial-model-v1-inputs";
import { v1TotalShares } from "./financial-model-v1";

/** Canonical base share price: $100 per share at the primary offering (minor units). */
export const CANONICAL_BASE_PRICE_USD = 10_000;

export interface CanonicalOffering {
  propertyId: string;
  /** Canonical total shares = valuation ÷ $100 (V1 model). */
  totalShares: number;
  /** Always $100 (minor units) for the current product model. */
  basePriceUsd: number;
  /** Approved ESTIMATED valuation (minor units, USD). */
  valuationCents: number;
  currency: "USD";
  provenance: "estimated";
}

/**
 * Canonical offering for a runtime property id, or null when no canonical
 * record exists (unknown ids only — never the 24). Callers fall back honestly,
 * never to fixture supply/price.
 */
export function getCanonicalOffering(propertyId: string): CanonicalOffering | null {
  const input = getFinancialModelV1Input(propertyId);
  if (input == null) return null;
  return {
    propertyId,
    totalShares: v1TotalShares(input.valuation.valueCents),
    basePriceUsd: CANONICAL_BASE_PRICE_USD,
    valuationCents: input.valuation.valueCents,
    currency: "USD",
    provenance: "estimated",
  };
}

/** True when the id has a canonical V1 offering (all 24 frozen properties). */
export function isCanonicalOfferingId(propertyId: string): boolean {
  return getFinancialModelV1Input(propertyId) !== undefined;
}
