import { describe, expect, it } from "vitest";
import {
  buildPortfolioSummary,
  type PropertyMark,
} from "./map-portfolio.js";
import { projectedYieldUsd, weeklyRentUsd } from "./math.js";

describe("buildPortfolioSummary", () => {
  const bayside: PropertyMark = {
    totalShares: 800,
    sharePriceUsd: 26_000,
    annualRentUsd: 1_040_000,
  };
  const alfama: PropertyMark = {
    totalShares: 1000,
    sharePriceUsd: 10_500,
    annualRentUsd: 1_300_000,
  };

  it("returns empty zeros when no holdings", () => {
    const s = buildPortfolioSummary([], new Map());
    expect(s).toEqual({
      totalValueUsd: 0,
      totalInvestedUsd: 0,
      totalEarningsUsd: 0,
      weeklyProjectedUsd: 0,
      dayChangeRatio: 0,
      holdings: [],
      openOrders: [],
    });
  });

  it("derives holding fields and aggregates", () => {
    const props = new Map<string, PropertyMark>([
      ["prop-bayside-marina-penthouse", bayside],
      ["prop-alfama-terrace-flat", alfama],
    ]);
    const s = buildPortfolioSummary(
      [
        {
          propertyId: "prop-bayside-marina-penthouse",
          sharesOwned: 160,
          avgCostUsd: 25_000,
        },
        {
          propertyId: "prop-alfama-terrace-flat",
          sharesOwned: 200,
          avgCostUsd: 10_000,
        },
      ],
      props,
    );

    expect(s.holdings).toHaveLength(2);
    expect(s.totalEarningsUsd).toBe(0);
    expect(s.openOrders).toEqual([]);

    const h0 = s.holdings[0]!;
    expect(h0.currentValueUsd).toBe(160 * 26_000);
    expect(h0.pendingWeekEarningsUsd).toBe(
      projectedYieldUsd(weeklyRentUsd(1_040_000), 160, 800),
    );
    expect(h0.shareRatio).toBeCloseTo(0.2, 10);
    expect(Number.isInteger(h0.currentValueUsd)).toBe(true);
    expect(Number.isInteger(h0.pendingWeekEarningsUsd)).toBe(true);
    expect(Number.isInteger(h0.avgCostUsd)).toBe(true);
    expect(Number.isInteger(h0.sharesOwned)).toBe(true);

    expect(s.totalInvestedUsd).toBe(160 * 25_000 + 200 * 10_000);
    expect(s.totalValueUsd).toBe(160 * 26_000 + 200 * 10_500);
    expect(s.weeklyProjectedUsd).toBe(
      s.holdings.reduce((a, h) => a + h.pendingWeekEarningsUsd, 0),
    );
    expect(Number.isInteger(s.totalValueUsd)).toBe(true);
    expect(Number.isInteger(s.totalInvestedUsd)).toBe(true);
    expect(Number.isInteger(s.weeklyProjectedUsd)).toBe(true);
  });

  it("skips missing properties and zero shares", () => {
    const props = new Map<string, PropertyMark>([
      ["prop-a", { totalShares: 100, sharePriceUsd: 1000, annualRentUsd: 5200 }],
    ]);
    const s = buildPortfolioSummary(
      [
        { propertyId: "missing", sharesOwned: 10, avgCostUsd: 100 },
        { propertyId: "prop-a", sharesOwned: 0, avgCostUsd: 100 },
        { propertyId: "prop-a", sharesOwned: 5, avgCostUsd: 100 },
      ],
      props,
    );
    expect(s.holdings).toHaveLength(1);
    expect(s.holdings[0]!.sharesOwned).toBe(5);
  });
});
