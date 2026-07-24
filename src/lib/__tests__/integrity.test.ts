// File responsibility: weekly-yield integrity check (R-6.6) — the Phase 3 final gate.
// Asserts that the projected weekly yield shown on Property detail === the paid Earnings entry
// for the same holding + week, and that the Home next-payout sum === the sum of pending entries.
// Seed numbers are designed to make this true (see seed/holdings.ts + seed/earnings.ts comments).
import { describe, expect, it } from "vitest";
import { PROPERTIES } from "@/lib/mock/seed/properties";
import { HOLDINGS } from "@/lib/mock/seed/holdings";
import { EARNINGS_ENTRIES } from "@/lib/mock/seed/earnings";
import { weeklyRent, projectedYield } from "@/lib/format";

describe("weekly-yield integrity check (R-6.6 judge gate)", () => {
  it("Property detail projected yield === Earnings paid entry amount for the same holding + week", () => {
    for (const holding of HOLDINGS) {
      const property = PROPERTIES.find((p) => p.id === holding.propertyId);
      if (!property) throw new Error(`integrity: property ${holding.propertyId} not found in seed`);
      // The amount a property-detail screen would show for this holding's current share:
      const propertyDetailProjected = projectedYield(
        weeklyRent(property.annualRentUsd),
        holding.sharesOwned,
        property.totalShares,
      );
      // The amount an Earnings timeline paid entry would show for the same share ratio (any paid week):
      const paidEntriesForHolding = EARNINGS_ENTRIES.filter(
        (e) => e.propertyId === property.id && e.status === "paid",
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
    const sumByProjections = HOLDINGS.reduce((s, h) => {
      const p = PROPERTIES.find((p) => p.id === h.propertyId);
      if (!p) return s;
      return s + projectedYield(weeklyRent(p.annualRentUsd), h.sharesOwned, p.totalShares);
    }, 0);
    expect(pendingTotal).toBe(sumByProjections);
  });
});