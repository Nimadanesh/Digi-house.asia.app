import { describe, expect, it } from "vitest";
import {
  offeredValueUsd,
  positionYieldUsd,
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

// Slice 2: the fixture monthly/annual display shortcuts are removed — user-facing
// income comes from the single presentation layer (V1). What remains here is the
// legacy weekly lock math + whole-value helpers (settlement paths, untouched).
describe("property-yield — legacy weekly lock math ($80 share @ 6%)", () => {
  it("legacy weekly per-share figure (rate − 1pp)", () => {
    expect(shareWeeklyYieldUsd(listing)).toBe(100); // $1.00 (5% / 4)
  });

  it("10 shares → $800 invested → weekly figure preserved", () => {
    const p = positionYieldUsd(listing, 10);
    expect(p.investedUsd).toBe(80_000);
    expect(p.weeklyUsd).toBe(1_000); // $10/wk = $40 (5% of $800)
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
