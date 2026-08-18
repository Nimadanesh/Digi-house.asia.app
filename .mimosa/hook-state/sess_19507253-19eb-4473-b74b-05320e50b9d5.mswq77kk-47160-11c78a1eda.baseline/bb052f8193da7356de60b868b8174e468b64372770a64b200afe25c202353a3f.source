import { describe, expect, it } from "vitest";
import {
  annualReturnRatio,
  offeredValueUsd,
  positionYieldUsd,
  shareAnnualYieldUsd,
  shareMonthlyYieldUsd,
  shareWeeklyYieldUsd,
  totalValueUsd,
} from "./property-yield";
import type { Listing } from "@/types/property";

const listing = {
  sharePriceUsd: 8_000, // $80
  monthlyYieldRate: 6,
  totalShares: 2_500,
  totalValueUsd: 80_000_000, // $800,000
} as Listing;

describe("property-yield — user spec example ($80 share @ 6%)", () => {
  it("per-share figures", () => {
    expect(shareMonthlyYieldUsd(listing)).toBe(480); // $4.80
    expect(shareWeeklyYieldUsd(listing)).toBe(100); // $1.00 (5% / 4)
    expect(shareAnnualYieldUsd(listing)).toBe(5_760); // $57.60
    expect(annualReturnRatio(listing)).toBeCloseTo(0.72);
  });

  it("10 shares → $800 invested → $48/mo → $576/yr", () => {
    const p = positionYieldUsd(listing, 10);
    expect(p.investedUsd).toBe(80_000);
    expect(p.monthlyUsd).toBe(4_800);
    expect(p.weeklyUsd).toBe(1_000); // $10/wk = $40 (5% of $800)
    expect(p.annualUsd).toBe(57_600);
  });

  it("offered value = shares × price; total value passthrough", () => {
    expect(offeredValueUsd(listing)).toBe(20_000_000); // $200,000
    expect(totalValueUsd(listing)).toBe(80_000_000);
  });

  it("total value falls back to offered when unknown", () => {
    const l = { ...listing, totalValueUsd: 0 } as Listing;
    expect(totalValueUsd(l)).toBe(20_000_000);
  });
});
