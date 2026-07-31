import { describe, expect, it } from "vitest";
import {
  deriveHoldingPublic,
  nextAvgCostUsd,
  syntheticBuyTxHash,
  usdCentsToNanoTon,
} from "./settle-buy.js";

describe("usdCentsToNanoTon", () => {
  it("converts USD cents to nanoTON at a cents-per-TON price", () => {
    // 62500¢ at 200¢/TON = 312.5 TON = 312_500_000_000 nanoTON
    expect(usdCentsToNanoTon(62_500, 200)).toBe(312_500_000_000n);
  });

  it("returns 0n for non-positive input or price", () => {
    expect(usdCentsToNanoTon(0, 200)).toBe(0n);
    expect(usdCentsToNanoTon(62_500, 0)).toBe(0n);
  });
});

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
