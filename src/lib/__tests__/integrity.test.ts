// File responsibility: yield integrity check — the numbers gate.
// Asserts that the rate-based weekly yield shown on Property detail === the paid Earnings
// entry for the same holding + week, and that the Home next-payout sum === the sum of
// pending entries. Model (PRODUCT-PLAN §0.4): weekly = invested × (rate − 1%) / 4.
import { describe, expect, it } from "vitest";
import { PROPERTIES } from "@/lib/mock/seed/properties";
import { HOLDINGS } from "@/lib/mock/seed/holdings";
import { EARNINGS_ENTRIES } from "@/lib/mock/seed/earnings";
import { positionYieldUsd } from "@/lib/property-yield";

function weeklyForHolding(propertyId: string, sharesOwned: number): number {
  const property = PROPERTIES.find((p) => p.id === propertyId);
  if (!property) throw new Error(`integrity: property ${propertyId} not found in seed`);
  return positionYieldUsd(property, sharesOwned).weeklyUsd;
}

describe("property seed integrity (PE-05 — §0.4a consistency chain)", () => {
  /** Same deterministic quality-driven rate as apps/api/src/db/seed/map-property.ts. */
  function seedYieldRate(yearBuilt: number): number {
    const t = Math.min(1, Math.max(0, (yearBuilt - 1975) / (2024 - 1975)));
    return Math.round((4.5 + t * 3) * 100) / 100;
  }

  it("seeds exactly 6 primary + 18 secondary properties", () => {
    const primary = PROPERTIES.filter((p) => p.status === "funding");
    const secondary = PROPERTIES.filter((p) => p.status !== "funding");
    expect(primary).toHaveLength(6);
    expect(secondary).toHaveLength(18);
  });

  it("every property holds the §0.4a chain (value > offered, price $80–150, rate by yearBuilt, rent = offered × rate × 12)", () => {
    for (const p of PROPERTIES) {
      const offered = p.totalShares * p.sharePriceUsd;
      // Whole-property value strictly greater than the offered amount.
      expect(p.totalValueUsd, p.id).toBeGreaterThan(offered);
      // Share price $80–150 (integer cents).
      expect(p.sharePriceUsd, p.id).toBeGreaterThanOrEqual(8_000);
      expect(p.sharePriceUsd, p.id).toBeLessThanOrEqual(15_000);
      // Monthly yield rate 4.50–7.50, derived from yearBuilt (quality).
      expect(p.monthlyYieldRate, p.id).toBeGreaterThanOrEqual(4.5);
      expect(p.monthlyYieldRate, p.id).toBeLessThanOrEqual(7.5);
      expect(p.monthlyYieldRate, p.id).toBe(seedYieldRate(p.meta.yearBuilt));
      // Annual rent pool = offered × monthly rate × 12 (integer cents).
      expect(p.annualRentUsd, p.id).toBe(
        Math.round(offered * (p.monthlyYieldRate / 100) * 12),
      );
    }
  });

  it("funding properties have remaining supply; secondary are fully sold", () => {
    for (const p of PROPERTIES) {
      if (p.status === "funding") {
        expect(p.sharesSold, p.id).toBeLessThan(p.totalShares);
        expect(p.sharesRemaining, p.id).toBe(p.totalShares - p.sharesSold);
      } else {
        expect(p.sharesSold, p.id).toBe(p.totalShares);
        expect(p.sharesRemaining, p.id).toBe(0);
      }
    }
  });

  it("secondary listings carry a last trade price", () => {
    for (const p of PROPERTIES) {
      if (p.status !== "funding") {
        expect(p.lastTradeUsd, p.id).toBeGreaterThan(0);
      }
    }
  });
});

describe("weekly-yield integrity check (R-6.6 judge gate)", () => {
  it("Property detail projected yield === Earnings paid entry amount for the same holding + week", () => {
    for (const holding of HOLDINGS) {
      const propertyDetailProjected = weeklyForHolding(
        holding.propertyId,
        holding.sharesOwned,
      );
      const paidEntriesForHolding = EARNINGS_ENTRIES.filter(
        (e) => e.propertyId === holding.propertyId && e.status === "paid",
      );
      if (paidEntriesForHolding.length === 0) continue;
      for (const e of paidEntriesForHolding) {
        expect(e.amountUsd).toBe(propertyDetailProjected);
      }
    }
  });

  it("Home next-payout contribution === Earnings pending entry amount for the same week", () => {
    const pendingTotal = EARNINGS_ENTRIES
      .filter((e) => e.status === "pending")
      .reduce((s, e) => s + e.amountUsd, 0);
    const sumByProjections = HOLDINGS.reduce(
      (s, h) => s + weeklyForHolding(h.propertyId, h.sharesOwned),
      0,
    );
    expect(pendingTotal).toBe(sumByProjections);
  });
});
