// File responsibility: canonical Share / ownership model types (Phase 9 Slice C).
// Sits above EstateData/EconomicModel (Slice A); ScenarioEngine (Slice B) is OPTIONAL here.
//
// Non-negotiable rules this file encodes (Slice C contract):
// - `totalShares`, `primarySharePrice`, `primarySharesAvailable` are EXPLICIT product
//   configuration — never inferred from UI, never invented for real estates.
// - Primary price, reference asset value per share, and secondary market price are THREE
//   DISTINCT concepts and must never collapse into one field.
// - No secondary price invention: a single secondary market price exists only when the
//   product/config provides one or exactly one active listing defines a price. With
//   multiple active listings the aggregation rule is UNDEFINED (product decision) — the
//   engine exposes the listings and the lowest active ask (a quoted fact), never a blend.
// - Money: integer minor units (cents) per repository convention.
// - Provenance is carried on every important value (reuses Slice A's Provenance).

import type { EstateCurrency, ProvenancedValue, Provenance } from "./estate";

// ---------------------------------------------------------------------------
// Configuration / Estate share structure (explicit product terms)
// ---------------------------------------------------------------------------

/**
 * Explicit share/offering configuration for an estate. TEST FIXTURES may invent values;
 * production configuration for real catalog estates is a PRODUCT DECISION still pending.
 */
export interface EstateShareConfig {
  estateId: string;
  /** Currency of all monetary fields (from the Estate model; the engine never hardcodes USD). */
  currency: EstateCurrency;
  /**
   * Whole-estate value input for reference-per-share math (minor units), provenance
   * preserved. `null` = not configured → reference value per share is UNKNOWN.
   */
  estateValue: ProvenancedValue | null;
  /** Total share supply — explicit; must be a positive integer. */
  totalShares: number;
  /** Primary offering price per share (minor units) — explicit; `null` = not configured. */
  primarySharePrice: number | null;
  /** Primary shares currently available for purchase — explicit, integer ≥ 0. */
  primarySharesAvailable: number;
  /**
   * "Nearly sold out" threshold (absolute remaining-share count) — PRODUCT DECISION,
   * not defined for the product yet. Absent → the nearly-sold-out state is NOT derivable
   * and must not be guessed (no magic numbers).
   */
  nearlySoldOutThreshold?: number;
}

// ---------------------------------------------------------------------------
// Secondary market (minimal canonical shape — no orderbook, no matching engine)
// ---------------------------------------------------------------------------

/** A holder's secondary listing. No PII; no orderbook depth. */
export interface EstateSecondaryListing {
  id: string;
  /** Opaque seller reference. */
  sellerRef: string;
  /** Asking price per share, minor units. */
  pricePerShareUsd: number;
  /** Shares offered; only `quantity > 0` AND `status "active"` counts as available. */
  quantity: number;
  status: "active" | "cancelled" | "filled";
}

// ---------------------------------------------------------------------------
// User position (calculation inputs — NOT portfolio storage, NOT transactions)
// ---------------------------------------------------------------------------

export interface EstateUserPosition {
  /** Shares currently owned, integer ≥ 0. */
  sharesOwned: number;
  /**
   * Average acquisition price per share (minor units) — mirrors the repo's
   * `Holding.avgCostUsd` convention (per-share average). `null` = unknown.
   */
  acquisitionPricePerShareUsd: number | null;
}

// ---------------------------------------------------------------------------
// Derived structure (calculated — never authored)
// ---------------------------------------------------------------------------

export interface EstateShareStructure {
  /** `1 / totalShares` as a 0..1 fraction; `null` when totalShares is invalid (≤ 0). */
  ownershipPerShare: number | null;
  /**
   * `estateValue / totalShares` (minor units, rounded half-up) — a PROPORTIONAL REFERENCE,
   * never a market price. `null` when estateValue or totalShares is missing/invalid.
   */
  referenceAssetValuePerShare: ProvenancedValue | null;
}

// ---------------------------------------------------------------------------
// Market / purchase states (data-driven — no UI guesses, no invented thresholds)
// ---------------------------------------------------------------------------

/** Mutually-exclusive primary-market supply situation (flag-level truth in `EstateShareState`). */
export type EstatePrimarySupplyState =
  | "available"
  /** Only when `nearlySoldOutThreshold` is configured and available ≤ threshold. */
  | "nearlySoldOut"
  | "soldOut";

/**
 * UI-facing mutually-exclusive market label (CTA context). The full truth lives in the
 * flags of `EstateShareState`; this enum only picks the single situation to surface.
 */
export type EstateShareMarketState =
  /** `primarySharesAvailable > 0` and not (configurably) nearly sold out. */
  | "primaryAvailable"
  /** Only when `nearlySoldOutThreshold` is configured and available ≤ threshold. */
  | "primaryNearlySoldOut"
  /** Primary sold out and at least one active secondary listing with quantity > 0. */
  | "secondaryAvailable"
  /** Primary sold out and no secondary availability. */
  | "primarySoldOut";

export interface EstateShareState {
  /** Single UI-facing label derived from the flags below. */
  market: EstateShareMarketState;
  /** Primary-market supply situation ("soldOut" ⇔ `primarySoldOut`). */
  primarySupplyState: EstatePrimarySupplyState;
  /** `primarySharesAvailable > 0`. */
  primaryAvailable: boolean;
  /** `primarySharesAvailable === 0` — a primary-market fact, independent of secondary. */
  primarySoldOut: boolean;
  /**
   * false when the nearly-sold-out threshold is not configured (state not derivable
   * without a product decision — no magic numbers).
   */
  nearlySoldOutKnown: boolean;
  /** At least one active secondary listing with quantity > 0. */
  secondaryAvailable: boolean;
  /** Primary sold out AND no secondary availability (nothing purchasable anywhere). */
  noSharesAvailable: boolean;
  /** `sharesOwned > 0`. */
  userOwnsShares: boolean;
  /** Owns shares → may sell (no lockup/eligibility invention — later product detail). */
  userMaySell: boolean;
  /** Active listings with quantity > 0. */
  secondaryAvailableListings: number;
}

// ---------------------------------------------------------------------------
// Calculation results
// ---------------------------------------------------------------------------

export type GainLossDirection = "gain" | "loss" | "breakEven";

export interface EstateGainLossResult {
  /** `shares × sale price` (minor units). */
  saleTotalUsd: number;
  /** `shares × acquisition price` (minor units). */
  acquisitionCostUsd: number;
  /** sale − acquisition (minor units; negative = loss). */
  gainLossUsd: number;
  direction: GainLossDirection;
}

export interface RemainingOwnershipAfterSale {
  /** Shares kept after the sale. */
  sharesRemaining: number;
  /** Remaining ownership fraction `sharesRemaining / totalShares` (0..1). */
  ownershipRemainingRatio: number;
}

export interface EstateShareOverview {
  config: EstateShareConfig;
  structure: EstateShareStructure;
  state: EstateShareState;
  /** The single secondary price — see the no-invention rules in the file header. */
  secondaryMarketPrice: ProvenancedValue | null;
  /** Lowest active ask (a quoted fact, not a blended mark); null when no active asks. */
  lowestActiveAskUsd: number | null;
  /** Active listings with quantity > 0, in input order. */
  activeListings: EstateSecondaryListing[];
}

/** Provenance helper: provenance classes used by share derivations (documentation type). */
export type ShareFieldProvenance = Provenance;
