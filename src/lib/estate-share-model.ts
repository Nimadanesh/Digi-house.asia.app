// File responsibility: canonical Share Model calculation layer (Phase 9 Slice C).
// Pure, deterministic helpers above the Estate/Economic layers. NO revenue/cost formulas
// here (those live in estate-economics.ts) and NO order matching / wallet / settlement.
//
// Rules encoded:
// - Explicit config only: totalShares / primarySharePrice / primarySharesAvailable are
//   inputs, never inferred. Unknown stays unknown.
// - Primary price ≠ reference asset value per share ≠ secondary price — three distinct
//   concepts, never collapsed.
// - No secondary price invention: single price only when configured or exactly one active
//   listing defines a price; multiple active listings → price UNKNOWN (aggregation rule is
//   a product decision), listings + lowest active ask exposed as quoted facts.
// - Money: integer minor units (cents). Rounding: half-up, once per result, documented.
// - Every helper is pure: inputs are never mutated; results are new objects.

import { computeBaselineEstateEconomics } from "./economics/estate-economics";
import type {
  Estate,
  EstateEconomics,
  ProvenancedValue,
} from "@/types/estate";
import type {
  EstateGainLossResult,
  EstateSecondaryListing,
  EstateShareConfig,
  EstateShareOverview,
  EstateShareState,
  EstateUserPosition,
  GainLossDirection,
  RemainingOwnershipAfterSale,
} from "@/types/estate-share";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface EstateShareConfigIssues {
  invalidTotalShares: boolean; // ≤ 0 or non-integer
  negativePrimarySharesAvailable: boolean;
  negativePrimarySharePrice: boolean; // negative when provided
  negativeNearlySoldOutThreshold: boolean; // negative when provided
}

/** Explicit config validation — callers can reject invalid config without silent coercion. */
export function validateEstateShareConfig(config: EstateShareConfig): EstateShareConfigIssues {
  return {
    invalidTotalShares: !Number.isInteger(config.totalShares) || config.totalShares <= 0,
    negativePrimarySharesAvailable: !Number.isInteger(config.primarySharesAvailable) || config.primarySharesAvailable < 0,
    negativePrimarySharePrice: config.primarySharePrice != null && config.primarySharePrice < 0,
    negativeNearlySoldOutThreshold: config.nearlySoldOutThreshold != null && config.nearlySoldOutThreshold < 0,
  };
}

export function hasConfigIssues(issues: EstateShareConfigIssues): boolean {
  return issues.invalidTotalShares ||
    issues.negativePrimarySharesAvailable ||
    issues.negativePrimarySharePrice ||
    issues.negativeNearlySoldOutThreshold;
}

function requireValidConfig(config: EstateShareConfig): void {
  const issues = validateEstateShareConfig(config);
  if (issues.invalidTotalShares) {
    throw new RangeError(`invalid totalShares: ${config.totalShares} (must be a positive integer)`);
  }
  if (issues.negativePrimarySharesAvailable) {
    throw new RangeError(`invalid primarySharesAvailable: ${config.primarySharesAvailable} (must be an integer ≥ 0)`);
  }
  if (issues.negativePrimarySharePrice) {
    throw new RangeError(`invalid primarySharePrice: ${config.primarySharePrice} (must be ≥ 0 when provided)`);
  }
  if (issues.negativeNearlySoldOutThreshold) {
    throw new RangeError(`invalid nearlySoldOutThreshold: ${config.nearlySoldOutThreshold} (must be ≥ 0 when provided)`);
  }
}

// ---------------------------------------------------------------------------
// Derived structure (deterministic; guards per contract §13)
// ---------------------------------------------------------------------------

/** ownershipPerShare = 1 / totalShares; null when totalShares ≤ 0 (never divide by zero). */
export function ownershipPerShare(totalShares: number): number | null {
  if (!Number.isInteger(totalShares) || totalShares <= 0) return null;
  return 1 / totalShares;
}

/** Ownership fraction for N shares: N × (1 / totalShares). Throws on invalid totalShares. */
export function ownershipForShares(shares: number, totalShares: number): number {
  const per = ownershipPerShare(totalShares);
  if (per == null) throw new RangeError(`invalid totalShares: ${totalShares}`);
  return shares * per;
}

/**
 * referenceAssetValuePerShare = estateValue / totalShares — a PROPORTIONAL REFERENCE,
 * never a market price. Half-up rounded to integer cents. Unknown (null) when estate
 * value is absent or totalShares invalid; provenance "calculated" when derived.
 */
export function referenceAssetValuePerShare(
  estateValue: ProvenancedValue | null,
  totalShares: number,
): ProvenancedValue | null {
  const per = ownershipPerShare(totalShares);
  if (estateValue == null || per == null) return null;
  return {
    value: Math.round(estateValue.value / totalShares),
    provenance: "calculated",
  };
}

// ---------------------------------------------------------------------------
// Buy / sell totals (pure)
// ---------------------------------------------------------------------------

/**
 * Primary purchase total: shares × primarySharePrice (integer cents; price may be a
 * non-integer cents input from configuration — result rounded half-up once).
 * Explicit failure when the price is not configured (never a guessed total).
 */
export function primaryPurchaseTotalUsd(shares: number, primarySharePrice: number | null): number {
  if (primarySharePrice == null) {
    throw new RangeError("primarySharePrice is not configured");
  }
  if (!Number.isInteger(shares) || shares < 0) {
    throw new RangeError(`invalid shares: ${shares}`);
  }
  return Math.round(shares * primarySharePrice);
}

/** Secondary sale total: shares × price (integer cents). Throws on invalid inputs. */
export function secondarySaleTotalUsd(shares: number, pricePerShareUsd: number): number {
  if (!Number.isInteger(shares) || shares < 0) {
    throw new RangeError(`invalid shares: ${shares}`);
  }
  if (pricePerShareUsd < 0) {
    throw new RangeError(`invalid price: ${pricePerShareUsd}`);
  }
  return Math.round(shares * pricePerShareUsd);
}

// ---------------------------------------------------------------------------
// Gain / loss vs acquisition
// ---------------------------------------------------------------------------

/**
 * Gain/loss for selling `shares` at `salePricePerShareUsd` against the user's average
 * acquisition price. Explicit failure when acquisition price is unknown (no invented
 * basis). Direction: gain | loss | breakEven.
 */
export function gainLossVsAcquisition(
  shares: number,
  salePricePerShareUsd: number,
  acquisitionPricePerShareUsd: number | null,
): EstateGainLossResult {
  if (!Number.isInteger(shares) || shares < 0) {
    throw new RangeError(`invalid shares: ${shares}`);
  }
  if (acquisitionPricePerShareUsd == null) {
    throw new RangeError("acquisitionPricePerShareUsd is unknown");
  }
  const saleTotalUsd = secondarySaleTotalUsd(shares, salePricePerShareUsd);
  const acquisitionCostUsd = Math.round(shares * acquisitionPricePerShareUsd);
  const gainLossUsd = saleTotalUsd - acquisitionCostUsd;
  const direction: GainLossDirection =
    gainLossUsd > 0 ? "gain" : gainLossUsd < 0 ? "loss" : "breakEven";
  return { saleTotalUsd, acquisitionCostUsd, gainLossUsd, direction };
}

// ---------------------------------------------------------------------------
// Remaining ownership after sale (pure projection — no persistence)
// ---------------------------------------------------------------------------

/** Remaining shares + ownership fraction after selling `quantity ≤ sharesOwned`. Throws on oversell. */
export function remainingOwnershipAfterSale(
  sharesOwned: number,
  quantityToSell: number,
  totalShares: number,
): RemainingOwnershipAfterSale {
  if (!Number.isInteger(sharesOwned) || sharesOwned < 0) {
    throw new RangeError(`invalid sharesOwned: ${sharesOwned}`);
  }
  if (!Number.isInteger(quantityToSell) || quantityToSell < 0) {
    throw new RangeError(`invalid quantityToSell: ${quantityToSell}`);
  }
  if (quantityToSell > sharesOwned) {
    throw new RangeError(`cannot sell ${quantityToSell} of ${sharesOwned} owned shares`);
  }
  const sharesRemaining = sharesOwned - quantityToSell;
  return {
    sharesRemaining,
    ownershipRemainingRatio: ownershipForShares(sharesRemaining, totalShares),
  };
}

// ---------------------------------------------------------------------------
// Primary supply projection (pure — what-if, never persisted)
// ---------------------------------------------------------------------------

export interface PrimarySupplyAfterPurchase {
  /** Remaining primary shares after the purchase. */
  primarySharesRemaining: number;
  /** Ownership fraction the purchased shares represent (of totalShares). */
  ownershipAcquiredRatio: number;
}

/** `primarySharesAvailable − purchased` with explicit oversupply rejection. Throws on invalid. */
export function primarySupplyAfterPurchase(
  config: EstateShareConfig,
  quantityToBuy: number,
): PrimarySupplyAfterPurchase {
  requireValidConfig(config);
  if (!Number.isInteger(quantityToBuy) || quantityToBuy < 0) {
    throw new RangeError(`invalid quantityToBuy: ${quantityToBuy}`);
  }
  if (quantityToBuy > config.primarySharesAvailable) {
    throw new RangeError(
      `cannot buy ${quantityToBuy} shares; only ${config.primarySharesAvailable} primary shares available`,
    );
  }
  return {
    primarySharesRemaining: config.primarySharesAvailable - quantityToBuy,
    ownershipAcquiredRatio: ownershipForShares(quantityToBuy, config.totalShares),
  };
}

// ---------------------------------------------------------------------------
// Market / purchase states (data-driven)
// ---------------------------------------------------------------------------

function activeListings(listings: EstateSecondaryListing[]): EstateSecondaryListing[] {
  return listings.filter((l) => l.status === "active" && l.quantity > 0);
}

/**
 * Explicit state derivation. Rules (no invention):
 * - `primarySoldOut` ⇔ `primarySharesAvailable === 0` — a primary-market fact,
 *   independent of the secondary surface.
 * - Nearly-sold-out is only derivable when `nearlySoldOutThreshold` is configured
 *   (product decision pending — no magic numbers); without it the state stays
 *   "available" with `nearlySoldOutKnown: false`.
 * - `noSharesAvailable` ⇔ primary sold out AND no active secondary listings.
 * - `market` is the single UI-facing label: the primary situation when supply exists,
 *   otherwise the secondary path or the honest sold-out label.
 */
export function deriveShareState(
  config: EstateShareConfig,
  position: EstateUserPosition,
  listings: EstateSecondaryListing[],
): EstateShareState {
  requireValidConfig(config);
  const active = activeListings(listings);
  const userOwnsShares = position.sharesOwned > 0;

  const primaryAvailable = config.primarySharesAvailable > 0;
  const primarySoldOut = config.primarySharesAvailable === 0;
  const nearlySoldOutKnown = config.nearlySoldOutThreshold != null;
  const nearlySoldOut =
    nearlySoldOutKnown &&
    primaryAvailable &&
    config.primarySharesAvailable <= (config.nearlySoldOutThreshold as number);
  const secondaryAvailable = active.length > 0;
  const noSharesAvailable = primarySoldOut && !secondaryAvailable;

  const primarySupplyState: EstateShareState["primarySupplyState"] = primarySoldOut
    ? "soldOut"
    : nearlySoldOut
      ? "nearlySoldOut"
      : "available";

  const market: EstateShareState["market"] = primaryAvailable
    ? nearlySoldOut
      ? "primaryNearlySoldOut"
      : "primaryAvailable"
    : secondaryAvailable
      ? "secondaryAvailable"
      : "primarySoldOut";

  return {
    market,
    primarySupplyState,
    primaryAvailable,
    primarySoldOut,
    nearlySoldOutKnown,
    secondaryAvailable,
    noSharesAvailable,
    userOwnsShares,
    userMaySell: userOwnsShares,
    secondaryAvailableListings: active.length,
  };
}

// ---------------------------------------------------------------------------
// Secondary market price (no-invention rules)
// ---------------------------------------------------------------------------

/** Lowest active ask in cents, or null when no active asks (a quoted fact, not a blend). */
export function lowestActiveAskUsd(listings: EstateSecondaryListing[]): number | null {
  const active = activeListings(listings);
  if (active.length === 0) return null;
  return Math.min(...active.map((l) => l.pricePerShareUsd));
}

/**
 * THE single secondary market price, only when a valid one exists:
 * - a configured market mark (provenance preserved) wins;
 * - else exactly one active listing → that ask, provenance "observed";
 * - else (zero or multiple active listings) → null (UNKNOWN; aggregation across multiple
 *   listings is an undefined product rule — do not blend).
 */
export function secondaryMarketPrice(
  configuredMark: ProvenancedValue | null,
  listings: EstateSecondaryListing[],
): ProvenancedValue | null {
  if (configuredMark != null) return configuredMark;
  const active = activeListings(listings);
  if (active.length === 1) {
    return { value: active[0].pricePerShareUsd, provenance: "observed" };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Overview + optional economics-snapshot integration (no formula forks)
// ---------------------------------------------------------------------------

/** Assemble the full canonical share overview for an estate's share structure. */
export function estateShareOverview(
  config: EstateShareConfig,
  position: EstateUserPosition,
  listings: EstateSecondaryListing[],
  configuredSecondaryMark: ProvenancedValue | null = null,
): EstateShareOverview {
  requireValidConfig(config);
  return {
    config,
    structure: {
      ownershipPerShare: ownershipPerShare(config.totalShares),
      referenceAssetValuePerShare: referenceAssetValuePerShare(
        config.estateValue,
        config.totalShares,
      ),
    },
    state: deriveShareState(config, position, listings),
    secondaryMarketPrice: secondaryMarketPrice(configuredSecondaryMark, listings),
    lowestActiveAskUsd: lowestActiveAskUsd(listings),
    activeListings: activeListings(listings),
  };
}

/**
 * Owner profit attributed to an ownership fraction — the ONLY permitted economics
 * integration: `ownerProfitUsd × ownershipRatio`, using a snapshot produced by the
 * EconomicModel/ScenarioEngine. No new profit formulas; `netProfitKnown: false`
 * snapshots (unknown inputs) return null rather than fabricated attribution.
 */
export function attributeOwnerProfitToShares(
  snapshot: Pick<EstateEconomics, "profit">,
  ownershipRatio: number,
): number | null {
  if (!snapshot.profit.netProfitKnown) return null;
  return Math.round(
    snapshot.profit.ownerProfitUsd * ownershipRatio,
  );
}

/**
 * Convenience: attribute the estate's baseline owner profit to `sharesOwned` of
 * `totalShares`. Delegates ALL economics to the canonical EconomicModel (no formula fork);
 * returns null when the snapshot's net profit is unknown (missing inputs stay unknown).
 * Pure projection — no state changes.
 */
export function attributeBaselineOwnerProfit(
  estate: Estate,
  sharesOwned: number,
  totalShares: number,
): number | null {
  const snapshot = computeBaselineEstateEconomics(estate);
  return attributeOwnerProfitToShares(snapshot, ownershipForShares(sharesOwned, totalShares));
}
