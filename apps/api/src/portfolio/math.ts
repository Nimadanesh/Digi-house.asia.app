/** floor(annualRentUsdCents / 52) — integer minor units. */
export function weeklyRentUsd(annualRentUsdCents: number): number {
  return Math.floor(annualRentUsdCents / 52);
}

/**
 * floor(weekly * shares / totalShares) — integer minor units.
 * 0 when totalShares is 0.
 */
export function projectedYieldUsd(
  weeklyRentUsdCents: number,
  sharesOwned: number,
  totalShares: number,
): number {
  if (totalShares <= 0) return 0;
  return Math.floor((weeklyRentUsdCents * sharesOwned) / totalShares);
}

/**
 * Simulated day-change ratio (demo). Same spirit as Mini App seedPortfolioSummary:
 * clamp( (value - invested) / invested * 0.15, -0.05, 0.08 ); 0 when invested ≤ 0.
 */
export function clampDayChangeRatio(
  totalValueUsd: number,
  totalInvestedUsd: number,
): number {
  if (totalInvestedUsd <= 0) return 0;
  const raw =
    ((totalValueUsd - totalInvestedUsd) / totalInvestedUsd) * 0.15;
  return Math.max(-0.05, Math.min(0.08, raw));
}
