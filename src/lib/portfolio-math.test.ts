import { describe, it, expect } from "vitest";
import { holdingPnl, portfolioAllocation } from "@/lib/portfolio-math";
import type { Holding } from "@/types/position";

const base: Holding = {
  propertyId: "prop-a",
  sharesOwned: 60,
  avgCostUsd: 25_000,
  currentValueUsd: 1_560_000,
  pendingWeekEarningsUsd: 3_375,
  shareRatio: 0.075,
};

describe("holdingPnl", () => {
  it("computes invested, unrealized dollar and ratio", () => {
    const pnl = holdingPnl(base);
    expect(pnl.investedUsd).toBe(1_500_000);
    expect(pnl.unrealizedUsd).toBe(60_000);
    expect(pnl.unrealizedRatio).toBeCloseTo(0.04);
  });

  it("returns zero ratio when invested is zero", () => {
    const pnl = holdingPnl({ ...base, avgCostUsd: 0, sharesOwned: 0, currentValueUsd: 0 });
    expect(pnl.investedUsd).toBe(0);
    expect(pnl.unrealizedUsd).toBe(0);
    expect(pnl.unrealizedRatio).toBe(0);
  });

  it("handles negative unrealized", () => {
    const pnl = holdingPnl({ ...base, currentValueUsd: 1_200_000 });
    expect(pnl.unrealizedUsd).toBe(-300_000);
    expect(pnl.unrealizedRatio).toBeCloseTo(-0.2);
  });
});

describe("portfolioAllocation", () => {
  it("returns empty when total value is zero or no holdings", () => {
    expect(portfolioAllocation([], 1_000)).toEqual([]);
    expect(portfolioAllocation([base], 0)).toEqual([]);
  });

  it("maps holdings to value and ratio of total", () => {
    const other: Holding = {
      ...base,
      propertyId: "prop-b",
      currentValueUsd: 440_000,
    };
    const slices = portfolioAllocation([base, other], 2_000_000);
    expect(slices).toEqual([
      { propertyId: "prop-a", valueUsd: 1_560_000, ratio: 0.78 },
      { propertyId: "prop-b", valueUsd: 440_000, ratio: 0.22 },
    ]);
  });
});
