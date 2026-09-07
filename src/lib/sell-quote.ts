// File responsibility: Slice H sell view-model — the single pure calculation layer for
// the secondary resale flow (Owned Position → Sell View Model → Sell Flow UI).
// No React, no IO, no wallet/settlement. Integer minor units (cents) throughout.
//
// - Totals reuse the canonical Share Model (Slice C): secondarySaleTotalUsd,
//   gainLossVsAcquisition, remainingOwnershipAfterSale, ownershipForShares.
// - The secondary-market fee is the canonical tiered schedule (previewFeeUsd with
//   "sell_secondary") — never invented here; null when no tier covers the amount
//   (the server always computes the actual charge on fill).
// - Gain/loss is gross sale value vs acquisition cost, BEFORE fees. Net proceeds
//   (gross − fee) are shown separately so the two are never conflated.
import {
  gainLossVsAcquisition,
  ownershipForShares,
  remainingOwnershipAfterSale,
  secondarySaleTotalUsd,
} from "./estate-share-model";
import { findFeeTier, previewFeeUsd, type FeeTier } from "@/types/fees";
import type { GainLossDirection } from "@/types/estate-share";
import type { Order, OrderBookState } from "@/types/order";

export interface SellQuote {
  quantity: number;
  pricePerShareUsd: number;
  /** shares × price (minor units). */
  grossUsd: number;
  /** shares × acquisition price, null when the acquisition basis is unknown. */
  acquisitionCostUsd: number | null;
  /** gross − acquisition, null when the basis is unknown (never guessed). */
  gainLossUsd: number | null;
  direction: GainLossDirection | null;
  sharesRemaining: number;
  /** sharesRemaining / totalShares (0..1). */
  remainingOwnershipRatio: number;
  /** quantity / totalShares (0..1) — the ownership being sold. */
  ownershipSoldRatio: number;
  /** Tiered sell_secondary preview, null when no tier covers the gross. */
  feeUsd: number | null;
  /** Applicable sell_secondary rate in bps (same tier as the preview), else null. */
  feeRateBps: number | null;
  /** gross − fee, null when the fee is unknown. */
  netProceedsUsd: number | null;
}

/**
 * Live sell preview. Throws RangeError on invalid numeric inputs (mirroring the
 * Share Model's explicit-failure style); callers validate first via
 * validateSellSelection and treat a throw as "no preview".
 */
export function previewSellQuote(input: {
  quantity: number;
  pricePerShareUsd: number;
  /** Per-share average cost; null = unknown basis → gain/loss stays unknown. */
  acquisitionPricePerShareUsd: number | null;
  sharesOwned: number;
  totalShares: number;
  feeTiers: FeeTier[];
}): SellQuote {
  const {
    quantity,
    pricePerShareUsd,
    acquisitionPricePerShareUsd,
    sharesOwned,
    totalShares,
    feeTiers,
  } = input;
  const grossUsd = secondarySaleTotalUsd(quantity, pricePerShareUsd);
  const remaining = remainingOwnershipAfterSale(sharesOwned, quantity, totalShares);
  const ownershipSoldRatio = ownershipForShares(quantity, totalShares);

  let acquisitionCostUsd: number | null = null;
  let gainLossUsd: number | null = null;
  let direction: GainLossDirection | null = null;
  if (acquisitionPricePerShareUsd != null) {
    const r = gainLossVsAcquisition(quantity, pricePerShareUsd, acquisitionPricePerShareUsd);
    acquisitionCostUsd = r.acquisitionCostUsd;
    gainLossUsd = r.gainLossUsd;
    direction = r.direction;
  }

  const feeUsd = previewFeeUsd(feeTiers, grossUsd, "sell_secondary");
  const feeRateBps = findFeeTier(feeTiers, grossUsd)?.sellSecondaryBps ?? null;
  return {
    quantity,
    pricePerShareUsd,
    grossUsd,
    acquisitionCostUsd,
    gainLossUsd,
    direction,
    sharesRemaining: remaining.sharesRemaining,
    remainingOwnershipRatio: remaining.ownershipRemainingRatio,
    ownershipSoldRatio,
    feeUsd,
    feeRateBps,
    netProceedsUsd: feeUsd == null ? null : grossUsd - feeUsd,
  };
}

// ---------------------------------------------------------------------------
// Selection validation (form-level; explicit flags, no silent coercion)
// ---------------------------------------------------------------------------

export interface SellSelectionIssues {
  /** Nothing sellable (free shares ≤ 0). */
  missingPosition: boolean;
  /** Quantity is not an integer ≥ 1. */
  invalidQuantity: boolean;
  /** Quantity exceeds the sellable (free) shares. */
  exceedsSellable: boolean;
  /** Price is not a positive integer (minor units). */
  invalidPrice: boolean;
  /** Price is exactly zero (explicit so the UI can name it). */
  zeroPrice: boolean;
}

export function validateSellSelection(input: {
  quantity: number;
  pricePerShareUsd: number;
  freeShares: number;
}): SellSelectionIssues {
  const { quantity, pricePerShareUsd, freeShares } = input;
  const invalidQuantity = !Number.isInteger(quantity) || quantity < 1;
  return {
    missingPosition: freeShares <= 0,
    invalidQuantity,
    exceedsSellable: !invalidQuantity && quantity > freeShares,
    invalidPrice: !Number.isInteger(pricePerShareUsd) || pricePerShareUsd < 1,
    zeroPrice: pricePerShareUsd === 0,
  };
}

export function hasSellIssues(issues: SellSelectionIssues): boolean {
  return issues.missingPosition ||
    issues.invalidQuantity ||
    issues.exceedsSellable ||
    issues.invalidPrice;
}

// ---------------------------------------------------------------------------
// Market-price guidance (informational only — never feeds the quote)
// ---------------------------------------------------------------------------

/**
 * Sell-side comparison reference for price guidance, from values the Sell flow
 * already shows (best offer block, last-price row):
 * 1. best offer (best bid) — live buyer demand, i.e. what the market will
 *    actually pay the seller right now;
 * 2. otherwise the last executed price (established book/listing fallback);
 * 3. otherwise null — guidance stays silent rather than guessing.
 */
export function selectMarketReference(
  bestOfferUsd: number | null | undefined,
  lastPriceUsd: number | null | undefined,
): number | null {
  return bestOfferUsd ?? lastPriceUsd ?? null;
}

export type PriceGuideDirection = "above" | "below";

/**
 * Compare a proposed price against the market reference. A ±5% quiet band
 * (integer math: 20×price vs 19/21×ref) keeps tiny differences from nagging.
 * Null when inside the band or without a reference — the caller shows nothing.
 */
export function priceGuidance(
  pricePerShareUsd: number,
  marketReferenceUsd: number | null,
): PriceGuideDirection | null {
  if (marketReferenceUsd == null) return null;
  if (20 * pricePerShareUsd > 21 * marketReferenceUsd) return "above";
  if (20 * pricePerShareUsd < 19 * marketReferenceUsd) return "below";
  return null;
}

// ---------------------------------------------------------------------------
// Listing state machine (order-level; derived from the existing order states)
// ---------------------------------------------------------------------------

/**
 * UI-facing sell-listing states. The order-level truth comes from the existing
 * secondary-market order lifecycle (open / queued / filled / cancelled); the
 * open sub-states separate "live with demand" (active) from "live, no fill yet,
 * book unknown" (pendingLiquidity) and the honest "no buyer" case (noLiquidity).
 * Listed is never Sold: only `filled` means sold.
 */
export type SellListingStatus =
  | "queued"
  | "active"
  | "pendingLiquidity"
  | "noLiquidity"
  | "partiallyFilled"
  | "filled"
  | "cancelled"
  | "rejected";

/**
 * Derive the listing status from an existing order + the live book (when known).
 * `book` null/undefined = book unknown → generic pending (never claim "no buyer"
 * without book data; UNKNOWN stays pending).
 */
export function resolveSellListingStatus(
  order: Pick<Order, "status" | "quantity" | "filledQuantity">,
  book?: Pick<OrderBookState, "bids" | "bestBidUsd"> | null,
): SellListingStatus {
  if (order.status === "cancelled") return "cancelled";
  if (order.status === "rejected") return "rejected";
  if (order.status === "filled" || order.filledQuantity >= order.quantity) return "filled";
  if (order.status === "queued") return "queued";
  if (order.filledQuantity > 0) return "partiallyFilled";
  if (book == null) return "pendingLiquidity";
  const hasBids = (book.bids?.length ?? 0) > 0 || book.bestBidUsd != null;
  return hasBids ? "active" : "noLiquidity";
}
