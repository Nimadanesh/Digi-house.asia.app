import type { FeeTierRecord } from "./fee-tier-store.js";

export type FeeOp =
  | "buy_primary"
  | "buy_secondary"
  | "sell_secondary"
  | "sell_instant";

/** Instant sell is a flat 7% (PRODUCT-PLAN §0.5), independent of tier. */
export const SELL_INSTANT_BPS = 700;

export type FeeQuote = {
  op: FeeOp;
  /** Gross transaction amount, integer cents. */
  amountUsd: number;
  /** Matched tier (null for flat sell_instant). */
  tierId: number | null;
  bps: number;
  /** Fee in integer cents, floor-rounded. */
  feeUsd: number;
  /** Amount minus fee — what a seller receives. */
  netUsd: number;
  /** Amount plus fee — what a buyer pays. */
  totalUsd: number;
};

function bpsForTier(op: FeeOp, tier: FeeTierRecord): number {
  switch (op) {
    case "buy_primary":
      return tier.buyPrimaryBps;
    case "buy_secondary":
      return tier.buySecondaryBps;
    case "sell_secondary":
      return tier.sellSecondaryBps;
    case "sell_instant":
      return SELL_INSTANT_BPS;
  }
}

/**
 * Resolve the platform fee for one transaction (PRODUCT-PLAN §0.5).
 * Tier bounds are inclusive on both ends; a tier with maxAmountUsd = null is unbounded.
 * Returns null when no tier covers the amount (e.g. below the 80$ floor).
 */
export function resolveFee(
  tiers: FeeTierRecord[],
  amountUsd: number,
  op: FeeOp,
): FeeQuote | null {
  if (!Number.isInteger(amountUsd) || amountUsd <= 0) return null;

  let tier: FeeTierRecord | null = null;
  if (op === "sell_instant") {
    tier = null; // flat rate, tier lookup intentionally skipped
  } else {
    tier =
      tiers.find(
        (t) =>
          amountUsd >= t.minAmountUsd &&
          (t.maxAmountUsd == null || amountUsd <= t.maxAmountUsd),
      ) ?? null;
    if (!tier) return null;
  }

  const bps = tier ? bpsForTier(op, tier) : SELL_INSTANT_BPS;
  const feeUsd = Math.floor((amountUsd * bps) / 10_000);
  return {
    op,
    amountUsd,
    tierId: tier?.id ?? null,
    bps,
    feeUsd,
    netUsd: amountUsd - feeUsd,
    totalUsd: amountUsd + feeUsd,
  };
}
