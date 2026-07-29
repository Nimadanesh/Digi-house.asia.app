import { describe, expect, it } from "vitest";
import {
  deriveHoldingPublic,
  nextAvgCostUsd,
  syntheticBuyTxHash,
} from "./settle-buy.js";

describe("nextAvgCostUsd", () => {
  it("first buy uses list price", () => {
    expect(nextAvgCostUsd(0, 0, 10, 12_500)).toBe(12_500);
  });

  it("second buy weighted average rounds", () => {
    // (100*10 + 200*20) / 30 = 5000/30 = 166.666 → 167
    expect(nextAvgCostUsd(10, 100, 20, 200)).toBe(167);
  });

  it("equal price keeps avg", () => {
    expect(nextAvgCostUsd(5, 10_000, 5, 10_000)).toBe(10_000);
  });
});

describe("syntheticBuyTxHash", () => {
  it("prefixes simulated:", () => {
    expect(syntheticBuyTxHash("intent-1")).toBe("simulated:intent-1");
  });
});

describe("deriveHoldingPublic", () => {
  it("derives mark fields with integer money", () => {
    const h = deriveHoldingPublic(
      { propertyId: "p1", sharesOwned: 10, avgCostUsd: 12_500 },
      { totalShares: 1000, sharePriceUsd: 12_500, annualRentUsd: 520_000 },
    );
    expect(h.currentValueUsd).toBe(125_000);
    expect(Number.isInteger(h.pendingWeekEarningsUsd)).toBe(true);
    expect(h.shareRatio).toBeCloseTo(0.01, 10);
  });
});
