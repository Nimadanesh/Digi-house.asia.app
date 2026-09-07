// PROMPT 03 validation: Growth Potential valuation rules + canonical fact checks.
//
// Covers the Critical Valuation Rule (Grand 2 BDM), the General Growth
// Potential Rule, and the §12 validation bullets that are data-assertable:
// no invented ADR/occupancy/revenue, no legacy $82M, Grand band + $18M
// potential, $13.5M as research evidence only, no Grand percentage.
import { describe, expect, it } from "vitest";

import { PROPERTIES } from "@/lib/mock/seed/properties";
import {
  ESTATE_24_DATA,
  ESTATE_24_RUNTIME_MAP,
  getEstate24ByListingId,
  getEstate24ByRuntimeId,
} from "../estates/estate-24-data";
import {
  GRAND_2_BDM_RUNTIME_ID,
  LEGACY_82M_CENTS,
  formatGrowthPct,
  formatValuationDisplay,
  formatValuationDisplayCompact,
  getGrowthPotential,
  getValuationDisplay,
} from "../estates/growth-potential";

describe("PROMPT 03: Grand 2 BDM critical valuation rule", () => {
  it("keeps Current Estimated Value as the $8M–$10M range (not $13.5M, not $82M)", () => {
    const display = getValuationDisplay(GRAND_2_BDM_RUNTIME_ID)!;
    expect(display.kind).toBe("range");
    expect(display).toMatchObject({
      min: 800_000_000,
      max: 1_000_000_000,
      provenance: "estimated",
    });
    expect(formatValuationDisplayCompact(display)).toBe("$8M–$10M");
  });

  it("sets Growth Potential upper value to $18M with estimated provenance", () => {
    const growth = getGrowthPotential(GRAND_2_BDM_RUNTIME_ID)!;
    expect(growth.potentialValue).toBe(1_800_000_000);
    expect(growth.provenance).toBe("estimated");
  });

  it("preserves $9.6M–$18M as research evidence/provenance", () => {
    const growth = getGrowthPotential(GRAND_2_BDM_RUNTIME_ID)!;
    expect(growth.researchRange).toEqual({ min: 960_000_000, max: 1_800_000_000 });
  });

  it("calculates NO Growth Potential percentage for Grand (current is a range)", () => {
    expect(getGrowthPotential(GRAND_2_BDM_RUNTIME_ID)!.potentialPct).toBeNull();
    expect(formatGrowthPct(getGrowthPotential(GRAND_2_BDM_RUNTIME_ID)!.potentialPct)).toBeNull();
  });

  it("keeps $13.5M as research evidence, never as the current product value", () => {
    const grand24 = getEstate24ByListingId("128862")!;
    expect(grand24.estimates.valueCentral).toBe(13_500_000);
    const display = getValuationDisplay(GRAND_2_BDM_RUNTIME_ID)!;
    const currentValues =
      display.kind === "range" ? [display.min, display.max] : [display.value];
    expect(currentValues).not.toContain(1_350_000_000);
  });

  it("never displays the legacy $82M value anywhere", () => {
    for (const p of PROPERTIES) {
      const display = getValuationDisplay(p.id);
      const values =
        display == null
          ? []
          : display.kind === "range"
            ? [display.min, display.max]
            : [display.value];
      expect(values, `${p.id} current`).not.toContain(LEGACY_82M_CENTS);
      const growth = getGrowthPotential(p.id);
      expect(growth?.potentialValue, `${p.id} potential`).not.toBe(LEGACY_82M_CENTS);
    }
  });
});

describe("PROMPT 03: general Growth Potential rule", () => {
  it("derives potential from the research range upper with an unambiguous percentage", () => {
    // The Aerial: current $20M single, research $14.4M–$26.4M → +32%.
    const growth = getGrowthPotential("prop-soho-loft-studio")!;
    expect(growth.potentialValue).toBe(2_640_000_000);
    expect(growth.potentialPct).toBe(32);
    expect(growth.provenance).toBe("estimated");
    expect(formatGrowthPct(growth.potentialPct)).toBe("+32%");
  });

  it("resolves growth potential for all 24 canonical estates (none invented)", () => {
    expect(PROPERTIES).toHaveLength(24);
    for (const p of PROPERTIES) {
      const growth = getGrowthPotential(p.id);
      expect(growth, `${p.id} growth resolves`).not.toBeNull();
      expect(growth!.potentialValue).toBeGreaterThan(0);
      expect(growth!.provenance).toBe("estimated");
      expect(growth!.researchRange).not.toBeNull();
    }
  });

  it("returns null for unknown ids (never creates a current value to enable math)", () => {
    expect(getValuationDisplay("prop-does-not-exist")).toBeNull();
    expect(getGrowthPotential("prop-does-not-exist")).toBeNull();
  });

  it("formats single valuations exactly (no rounding, no currency conversion)", () => {
    const display = getValuationDisplay("prop-soho-loft-studio")!;
    expect(display).toEqual({ kind: "single", value: 2_000_000_000, provenance: "estimated" });
    expect(formatValuationDisplay(display)).toBe("$20,000,000.00");
    expect(formatValuationDisplayCompact(display)).toBe("$20M");
  });
});

describe("PROMPT 03 §12: canonical record validation (all 24)", () => {
  it("24 canonical records resolve with names, locations, listing IDs and source URLs", () => {
    expect(ESTATE_24_DATA).toHaveLength(24);
    for (const record of ESTATE_24_DATA) {
      expect(record.name.length).toBeGreaterThan(0);
      expect(record.location.full.length).toBeGreaterThan(0);
      expect(record.listingId).toMatch(/^\d+$/);
      expect(record.sourceUrl.startsWith("https://www.rentalescapes.com/")).toBe(true);
      expect(record.sourceUrl.endsWith(`-${record.listingId}`)).toBe(true);
    }
    // Every runtime prop-* id maps to exactly one canonical record and back.
    expect(Object.keys(ESTATE_24_RUNTIME_MAP)).toHaveLength(24);
    for (const p of PROPERTIES) {
      const listingId = ESTATE_24_RUNTIME_MAP[p.id];
      expect(listingId, `${p.id} maps to a listing`).toBeDefined();
      expect(getEstate24ByRuntimeId(p.id)?.listingId).toBe(listingId);
      expect(getEstate24ByListingId(listingId)?.sourceUrl).toContain(listingId);
    }
  });

  it("rate types and currencies remain correct (no conversion, no ADR creation)", () => {
    for (const record of ESTATE_24_DATA) {
      expect(["RANGE", "APPROXIMATE", "STARTING_FROM", "DYNAMIC"]).toContain(record.rates.type);
      expect(["USD", "EUR"]).toContain(record.rates.currency);
      expect(record.rates.nightly.length).toBeGreaterThan(0);
    }
    // No derived economics keys exist on the adopted records.
    for (const record of ESTATE_24_DATA as unknown as Record<string, unknown>[]) {
      expect("adr" in record).toBe(false);
      expect("annualRevenue" in record).toBe(false);
      expect("yield" in record).toBe(false);
      expect("appreciation" in record).toBe(false);
    }
  });

  it("nulls remain honest (no zero substitution, no invented descriptions/types)", () => {
    for (const record of ESTATE_24_DATA) {
      expect(record.estimates.occupancy).toBeNull();
      expect(record.propertyType.length).toBeGreaterThan(0);
      expect(record.description.short.length).toBeGreaterThan(0);
      expect(record.description.full.length).toBeGreaterThan(0);
    }
  });
});
