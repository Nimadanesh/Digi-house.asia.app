import type { HoldingPublic, PropertyMark } from "../portfolio/map-portfolio.js";
import {
  projectedYieldUsd,
  weeklyRentUsd,
} from "../portfolio/math.js";

/** Weighted average cost per share (cents). Matches Mini App mock transaction.ts. */
export function nextAvgCostUsd(
  oldShares: number,
  oldAvgCostUsd: number,
  buyQty: number,
  priceUsdPerShare: number,
): number {
  const newShares = oldShares + buyQty;
  if (oldShares <= 0) return priceUsdPerShare;
  return Math.round(
    (oldAvgCostUsd * oldShares + priceUsdPerShare * buyQty) / newShares,
  );
}

export function syntheticBuyTxHash(intentId: string): string {
  return `simulated:${intentId}`;
}

export function deriveHoldingPublic(
  input: {
    propertyId: string;
    sharesOwned: number;
    avgCostUsd: number;
  },
  mark: PropertyMark,
): HoldingPublic {
  const weekly = weeklyRentUsd(mark.annualRentUsd);
  return {
    propertyId: input.propertyId,
    sharesOwned: input.sharesOwned,
    avgCostUsd: input.avgCostUsd,
    currentValueUsd: input.sharesOwned * mark.sharePriceUsd,
    pendingWeekEarningsUsd: projectedYieldUsd(
      weekly,
      input.sharesOwned,
      mark.totalShares,
    ),
    shareRatio:
      mark.totalShares > 0 ? input.sharesOwned / mark.totalShares : 0,
  };
}
