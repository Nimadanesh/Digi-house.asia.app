/** Platform fee schedule (PRODUCT-PLAN §0.5) — per-transaction tiers, basis points. */
export interface FeeTier {
  id: number;
  /** Inclusive lower bound, integer cents. */
  minAmountUsd: number;
  /** Inclusive upper bound, integer cents; null = unbounded. */
  maxAmountUsd: number | null;
  buyPrimaryBps: number;
  buySecondaryBps: number;
  sellSecondaryBps: number;
}

/** Flat instant-sell fee (primary phase only), basis points — never tiered. */
export const SELL_INSTANT_BPS = 700;

export function bpsToPct(bps: number): string {
  const pct = bps / 100;
  // 300 → "3%", 90 → "0.9%", 1 → "0.01%"
  return `${Number.isInteger(pct) ? pct : pct.toFixed(2)}%`;
}

/** Mirror of the API fee resolver for UI previews. Returns fee cents or null (no tier). */
export function previewFeeUsd(
  tiers: FeeTier[],
  amountUsd: number,
  op: "buy_secondary" | "sell_secondary",
): number | null {
  const tier = tiers.find(
    (t) =>
      amountUsd >= t.minAmountUsd &&
      (t.maxAmountUsd == null || amountUsd <= t.maxAmountUsd),
  );
  if (!tier) return null;
  const bps = op === "buy_secondary" ? tier.buySecondaryBps : tier.sellSecondaryBps;
  return Math.floor((amountUsd * bps) / 10_000);
}
