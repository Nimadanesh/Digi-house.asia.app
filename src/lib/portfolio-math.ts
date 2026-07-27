// File responsibility: pure portfolio PnL + allocation math (minor units). No React.
import type { Holding } from "@/types/position";

export interface HoldingPnl {
  investedUsd: number;
  unrealizedUsd: number;
  /** Invested-relative ratio; 0 if invested is 0. */
  unrealizedRatio: number;
}

export function holdingPnl(h: Holding): HoldingPnl {
  const investedUsd = h.avgCostUsd * h.sharesOwned;
  const unrealizedUsd = h.currentValueUsd - investedUsd;
  const unrealizedRatio = investedUsd > 0 ? unrealizedUsd / investedUsd : 0;
  return { investedUsd, unrealizedUsd, unrealizedRatio };
}

export function portfolioUnrealizedUsd(totalValueUsd: number, totalInvestedUsd: number): number {
  return totalValueUsd - totalInvestedUsd;
}

export function portfolioUnrealizedRatio(totalValueUsd: number, totalInvestedUsd: number): number {
  return totalInvestedUsd > 0 ? (totalValueUsd - totalInvestedUsd) / totalInvestedUsd : 0;
}

export interface AllocationSlice {
  propertyId: string;
  ratio: number; // 0..1 of portfolio value
  valueUsd: number;
}

export function portfolioAllocation(holdings: Holding[], totalValueUsd: number): AllocationSlice[] {
  if (totalValueUsd <= 0 || holdings.length === 0) return [];
  return holdings.map((h) => ({
    propertyId: h.propertyId,
    valueUsd: h.currentValueUsd,
    ratio: h.currentValueUsd / totalValueUsd,
  }));
}

/** Distinct palette per property (not finance green/red; varied hue for readability). */
export const ALLOCATION_COLORS = [
  "bg-[oklch(0.62_0.19_250)]", // Telegram blue
  "bg-[oklch(0.72_0.14_55)]", // amber
  "bg-[oklch(0.65_0.12_200)]", // cyan
  "bg-[oklch(0.62_0.14_310)]", // violet
  "bg-[oklch(0.7_0.12_140)]", // teal-mint
  "bg-[oklch(0.68_0.1_30)]", // peach
] as const;
