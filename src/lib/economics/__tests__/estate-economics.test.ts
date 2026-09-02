// Tests for the canonical Estate economic model (Phase 9 Slice A).
// These tests ARE the executable contract: formulas, distinct 18% concepts, provenance,
// fixture integrity, large-value handling, and the required edge cases.

import { describe, expect, it } from "vitest";

import {
  baselineAdr,
  baselineOccupancy,
  computeBaselineEstateEconomics,
  computeEstateEconomics,
  costLines,
  estateFromLegacyListing,
  grossAnnualRevenueUsd,
  occupiedNights,
  parseNightlyRateDisplayToCents,
} from "../estate-economics";
import {
  CANONICAL_ESTATES,
  GRAND_2_BDM_OCEAN_POOL_VILLA as ESTATE,
} from "../estates/grand-2-bdm-ocean-pool-villa";
import {
  DAYS_PER_YEAR,
  ESTATE_ALLOCATION_RATES,
  ESTATE_COST_RATES,
  type Estate,
  type EstateScenario,
} from "@/types/estate";

// Exact expected values for the canonical seed at the baseline scenario.
// ADR = (67,000 + 80,000)/2 = 73,500 ; occupancy = (0.6 + 0.9)/2 = 0.75
// occupiedNights = 365 × 0.75 = 273.75
// gross = 73,500 × 273.75 = $20,120,625 → 2,012,062,500 cents
const BASELINE_GROSS_CENTS = 2_012_062_500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function costById(result: ReturnType<typeof computeEstateEconomics>, id: string) {
  const line = result.costs.find((c) => c.id === id);
  expect(line, `cost line ${id} must exist`).toBeDefined();
  return line!;
}

/** Estate with the baseline scenario but a defined guest count (for green-tax tests). */
function withGuests(estate: Estate, guests: number): { estate: Estate; scenario: EstateScenario } {
  return {
    estate,
    scenario: { ...estate.baselineScenario, averageOccupiedGuests: guests },
  };
}

// ---------------------------------------------------------------------------
// Asset
// ---------------------------------------------------------------------------

describe("asset: canonical seed", () => {
  it("carries the fixed $8,000,000 property value (estimated)", () => {
    expect(ESTATE.asset.propertyValue.value).toBe(800_000_000);
    expect(ESTATE.asset.propertyValue.provenance).toBe("estimated");
  });

  it("carries the nightly range $67,000–$80,000", () => {
    expect(ESTATE.asset.nightlyRateMin.value).toBe(6_700_000);
    expect(ESTATE.asset.nightlyRateMax.value).toBe(8_000_000);
    expect(ESTATE.asset.nightlyRateMin.value).toBeLessThan(ESTATE.asset.nightlyRateMax.value);
  });

  it("carries the occupancy range 60%–90% as configurable bounds (not a universal constant)", () => {
    expect(ESTATE.asset.occupancyRateMin.value).toBe(0.6);
    expect(ESTATE.asset.occupancyRateMax.value).toBe(0.9);
  });

  it("carries an explicit baseline ADR that is not silently min or max", () => {
    const adr = baselineAdr(ESTATE);
    expect(adr.adrUsd).toBe(7_350_000); // (67k + 80k)/2
    expect(adr.provenance).toBe("estimated");
    expect(adr.adrUsd).not.toBe(ESTATE.asset.nightlyRateMin.value);
    expect(adr.adrUsd).not.toBe(ESTATE.asset.nightlyRateMax.value);
  });

  it("derives baseline occupancy as the midpoint of the estate's own bounds", () => {
    expect(baselineOccupancy(ESTATE)).toBe(0.75);
  });

  it("retains the mandatory product fields (photos, name, location)", () => {
    expect(ESTATE.name).toBe("Grand 2 BDM Ocean Pool Villa");
    expect(ESTATE.location).toBe("Bodufushi, Raa Atoll, Maldives");
    expect(ESTATE.images.length).toBe(33);
    expect(ESTATE.images.every((src) => src.startsWith("/images/properties/joali-being-"))).toBe(true);
  });

  it("asset grossAnnualRevenue is provenance 'calculated' and equals the baseline computation", () => {
    expect(ESTATE.asset.grossAnnualRevenue.provenance).toBe("calculated");
    expect(ESTATE.asset.grossAnnualRevenue.value).toBe(
      computeBaselineEstateEconomics(ESTATE).revenue.grossAnnualRevenueUsd,
    );
  });
});

// ---------------------------------------------------------------------------
// Revenue formulas
// ---------------------------------------------------------------------------

describe("revenue formulas", () => {
  it("occupiedNights = 365 × occupancyRate", () => {
    expect(occupiedNights(0.75)).toBeCloseTo(273.75, 10);
    expect(occupiedNights(0)).toBe(0);
    expect(occupiedNights(1)).toBe(DAYS_PER_YEAR);
  });

  it("grossAnnualRevenue = ADR × occupiedNights", () => {
    expect(grossAnnualRevenueUsd(7_350_000, 0.75)).toBe(BASELINE_GROSS_CENTS);
  });

  it("baseline revenue uses the explicit ADR + baseline occupancy", () => {
    const result = computeBaselineEstateEconomics(ESTATE);
    expect(result.revenue.grossAnnualRevenueUsd).toBe(BASELINE_GROSS_CENTS);
    expect(result.revenue.occupiedNights).toBeCloseTo(273.75, 10);
  });

  it("revenue is zero at 0% occupancy and ADR × 365 at 100%", () => {
    expect(grossAnnualRevenueUsd(7_350_000, 0)).toBe(0);
    expect(grossAnnualRevenueUsd(7_350_000, 1)).toBe(7_350_000 * 365);
  });
});

// ---------------------------------------------------------------------------
// Costs (the exact product lines)
// ---------------------------------------------------------------------------

describe("cost model (baseline scenario)", () => {
  const result = computeBaselineEstateEconomics(ESTATE);

  it("tourism tax = 17% of gross annual revenue", () => {
    expect(ESTATE_COST_RATES.tourismTax).toBe(0.17);
    expect(costById(result, "tourismTax").amountUsd).toBe(Math.round(BASELINE_GROSS_CENTS * 0.17));
  });

  it("service charge = 10% of gross annual revenue", () => {
    expect(ESTATE_COST_RATES.serviceCharge).toBe(0.1);
    expect(costById(result, "serviceCharge").amountUsd).toBe(Math.round(BASELINE_GROSS_CENTS * 0.1));
  });

  it("agency / Rental Escapes / OTA cost = 18% of gross annual revenue", () => {
    expect(ESTATE_COST_RATES.agencyRentalOta).toBe(0.18);
    expect(costById(result, "agencyRentalOta").amountUsd).toBe(Math.round(BASELINE_GROSS_CENTS * 0.18));
  });

  it("operator operating costs = 12.5% of gross annual revenue", () => {
    expect(ESTATE_COST_RATES.operatorOperating).toBe(0.125);
    expect(costById(result, "operatorOperating").amountUsd).toBe(Math.round(BASELINE_GROSS_CENTS * 0.125));
  });

  it("repair / insurance / maintenance = 1.5% of property value", () => {
    expect(ESTATE_COST_RATES.repairInsuranceMaintenance).toBe(0.015);
    expect(costById(result, "repairInsuranceMaintenance").amountUsd).toBe(
      Math.round(800_000_000 * 0.015),
    );
  });

  it("green tax requires averageOccupiedGuests and is unknown when they are missing (never guessed)", () => {
    const baseline = computeBaselineEstateEconomics(ESTATE); // guests unknown
    const green = costById(baseline, "greenTax");
    expect(green.unknown).toBe(true);
    expect(green.amountUsd).toBe(0);
    expect(baseline.revenue.guestNights).toBeNull();

    const { estate, scenario } = withGuests(ESTATE, 4);
    const withFour = computeEstateEconomics(estate, scenario);
    expect(costById(withFour, "greenTax").amountUsd).toBe(
      Math.round(273.75 * 4 * ESTATE_COST_RATES.greenTaxPerGuestPerNight),
    );
    expect(withFour.revenue.guestNights).toBeCloseTo(273.75 * 4, 10);
  });

  it("green tax = guest-nights × $12 exactly (guests ≠ capacity is expressible)", () => {
    // Capacity-independent: any guest count can be plugged in — here 6 guests on a 2-guest
    // "capacity" sanity value simply produces 6× the per-guest line.
    const { estate, scenario } = withGuests(ESTATE, 6);
    const result = computeEstateEconomics(estate, scenario);
    expect(costById(result, "greenTax").amountUsd).toBe(
      Math.round(273.75 * 6 * 1200),
    );
  });

  it("exposes exactly the six product-defined cost lines", () => {
    const { estate, scenario } = withGuests(ESTATE, 4);
    const lines = costLines(estate, scenario).map((c) => c.id);
    expect(lines).toEqual([
      "tourismTax",
      "serviceCharge",
      "agencyRentalOta",
      "operatorOperating",
      "greenTax",
      "repairInsuranceMaintenance",
    ]);
  });

  it("bases each line on the canonical basis (gross / property value / guest-nights)", () => {
    const { estate, scenario } = withGuests(ESTATE, 2);
    const lines = costLines(estate, scenario);
    expect(lines.find((c) => c.id === "repairInsuranceMaintenance")!.basis).toBe("propertyValue");
    expect(lines.find((c) => c.id === "greenTax")!.basis).toBe("guestNights");
    for (const id of ["tourismTax", "serviceCharge", "agencyRentalOta", "operatorOperating"]) {
      expect(lines.find((c) => c.id === id)!.basis).toBe("grossAnnualRevenue");
    }
  });
});

// ---------------------------------------------------------------------------
// Profit + allocations
// ---------------------------------------------------------------------------

describe("profit and allocations (baseline with guests defined)", () => {
  // Deterministic full-result check with guests = 4.
  const { estate, scenario } = withGuests(ESTATE, 4);
  const result = computeEstateEconomics(estate, scenario);

  const gross = BASELINE_GROSS_CENTS;
  const tourism = Math.round(gross * 0.17);
  const service = Math.round(gross * 0.1);
  const agency = Math.round(gross * 0.18);
  const operatorCosts = Math.round(gross * 0.125);
  const green = Math.round(273.75 * 4 * 1200);
  const repair = Math.round(800_000_000 * 0.015);
  const totalCosts = tourism + service + agency + operatorCosts + green + repair;
  const net = gross - totalCosts;

  it("net profit = gross − all configured cost lines (single canonical computation)", () => {
    expect(result.profit.totalCostsUsd).toBe(totalCosts);
    expect(result.profit.netProfitUsd).toBe(net);
    expect(result.profit.netProfitKnown).toBe(true);
  });

  it("owner allocation = 40% of net profit", () => {
    expect(ESTATE_ALLOCATION_RATES.ownerProfit).toBe(0.4);
    expect(result.profit.ownerProfitUsd).toBe(Math.round(net * 0.4));
  });

  it("operator allocation = 60% of net profit", () => {
    expect(ESTATE_ALLOCATION_RATES.operatorProfit).toBe(0.6);
    expect(result.profit.operatorProfitUsd).toBe(Math.round(net * 0.6));
  });

  it("owner + operator ≈ net profit (independent roundings only)", () => {
    expect(result.profit.ownerProfitUsd + result.profit.operatorProfitUsd).toBe(net); // 0.4+0.6 split rounds exactly
  });

  it("travel agency share = 18% of gross revenue and REMAINS DISTINCT from the OTA cost line", () => {
    expect(ESTATE_ALLOCATION_RATES.travelAgency).toBe(0.18);
    expect(result.travelAgencyShareUsd).toBe(Math.round(gross * 0.18));
    // Same number today, but structurally separate fields/lines — the two 18% concepts:
    expect(result.travelAgencyShareUsd).toBe(costById(result, "agencyRentalOta").amountUsd);
    expect("travelAgencyShareUsd" in result).toBe(true);
    expect(result.costs.some((c) => c.id === "agencyRentalOta")).toBe(true);
  });

  it("matches a hand-computed full economics snapshot", () => {
    expect(result).toEqual({
      revenue: {
        occupiedNights: 273.75,
        guestNights: 1095,
        grossAnnualRevenueUsd: gross,
      },
      costs: [
        { id: "tourismTax", basis: "grossAnnualRevenue", rate: 0.17, amountUsd: tourism },
        { id: "serviceCharge", basis: "grossAnnualRevenue", rate: 0.1, amountUsd: service },
        { id: "agencyRentalOta", basis: "grossAnnualRevenue", rate: 0.18, amountUsd: agency },
        { id: "operatorOperating", basis: "grossAnnualRevenue", rate: 0.125, amountUsd: operatorCosts },
        { id: "greenTax", basis: "guestNights", rate: 1200, amountUsd: green },
        { id: "repairInsuranceMaintenance", basis: "propertyValue", rate: 0.015, amountUsd: repair },
      ],
      profit: {
        totalCostsUsd: totalCosts,
        netProfitUsd: net,
        ownerProfitUsd: Math.round(net * 0.4),
        operatorProfitUsd: Math.round(net * 0.6),
        netProfitKnown: true,
      },
      travelAgencyShareUsd: Math.round(gross * 0.18),
    });
  });
});

// ---------------------------------------------------------------------------
// Data integrity
// ---------------------------------------------------------------------------

describe("data integrity", () => {
  it("canonical fixture has no NaN / undefined economic fields", () => {
    const result = computeBaselineEstateEconomics(ESTATE);
    const numbers = [
      ESTATE.asset.propertyValue.value,
      ESTATE.asset.nightlyRateMin.value,
      ESTATE.asset.nightlyRateMax.value,
      ESTATE.asset.occupancyRateMin.value,
      ESTATE.asset.occupancyRateMax.value,
      ESTATE.asset.grossAnnualRevenue.value,
      ESTATE.baselineScenario.adrUsd.value,
      ESTATE.baselineScenario.occupancyRate,
      ...result.costs.map((c) => c.amountUsd),
      result.revenue.grossAnnualRevenueUsd,
      result.travelAgencyShareUsd,
    ];
    for (const n of numbers) {
      expect(Number.isFinite(n)).toBe(true);
    }
  });

  it("canonical estates registry ships exactly the Slice A fixture", () => {
    expect(CANONICAL_ESTATES).toHaveLength(1);
    expect(CANONICAL_ESTATES[0].id).toBe("estate-grand-2-bdm-ocean-pool-villa");
  });

  it("large dollar values are handled exactly (integer cents, no float drift)", () => {
    expect(ESTATE.asset.propertyValue.value).toBe(800_000_000);
    expect(Number.isSafeInteger(ESTATE.asset.propertyValue.value)).toBe(true);
    expect(Number.isSafeInteger(BASELINE_GROSS_CENTS)).toBe(true);
    expect(grossAnnualRevenueUsd(8_000_000, 1)).toBe(8_000_000 * DAYS_PER_YEAR);
  });

  it("money helpers never produce fractional cents", () => {
    const { estate, scenario } = withGuests(ESTATE, 3);
    const result = computeEstateEconomics(estate, scenario);
    for (const line of result.costs) {
      expect(Number.isInteger(line.amountUsd)).toBe(true);
    }
    expect(Number.isInteger(result.profit.netProfitUsd)).toBe(true);
    expect(Number.isInteger(result.travelAgencyShareUsd)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge cases (no fabricated values — unknowns stay unknown)
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  it("0% occupancy → zero revenue, zero percentage costs, reserve still applies", () => {
    const result = computeEstateEconomics(ESTATE, {
      ...ESTATE.baselineScenario,
      occupancyRate: 0,
    });
    expect(result.revenue.grossAnnualRevenueUsd).toBe(0);
    expect(costById(result, "tourismTax").amountUsd).toBe(0);
    expect(costById(result, "serviceCharge").amountUsd).toBe(0);
    expect(costById(result, "agencyRentalOta").amountUsd).toBe(0);
    expect(costById(result, "operatorOperating").amountUsd).toBe(0);
    expect(costById(result, "repairInsuranceMaintenance").amountUsd).toBe(
      Math.round(800_000_000 * 0.015),
    );
  });

  it("100% occupancy → 365 occupied nights and full-rate revenue", () => {
    const result = computeEstateEconomics(ESTATE, {
      ...ESTATE.baselineScenario,
      occupancyRate: 1,
    });
    expect(result.revenue.occupiedNights).toBe(365);
    expect(result.revenue.grossAnnualRevenueUsd).toBe(7_350_000 * 365);
  });

  it("missing averageOccupiedGuests → green tax unknown, net profit flagged not known", () => {
    const result = computeBaselineEstateEconomics(ESTATE);
    expect(costById(result, "greenTax").unknown).toBe(true);
    expect(result.profit.netProfitKnown).toBe(false);
    expect(result.profit.netProfitUsd).toBe(0);
    expect(result.profit.ownerProfitUsd).toBe(0);
    expect(result.profit.operatorProfitUsd).toBe(0);
  });

  it("zero property value → reserve line is zero, other lines unaffected", () => {
    const zeroValue: Estate = {
      ...ESTATE,
      asset: { ...ESTATE.asset, propertyValue: { value: 0, provenance: "unknown" } },
    };
    const { estate, scenario } = withGuests(zeroValue, 2);
    const result = computeEstateEconomics(estate, scenario);
    expect(costById(result, "repairInsuranceMaintenance").amountUsd).toBe(0);
    expect(costById(result, "tourismTax").amountUsd).toBe(
      Math.round(BASELINE_GROSS_CENTS * 0.17),
    );
  });

  it("minimum nightly rate as ADR (scenario at range min) computes from 67,000", () => {
    const result = computeEstateEconomics(ESTATE, {
      adrUsd: { value: 6_700_000, provenance: "estimated" },
      occupancyRate: 0.75,
      averageOccupiedGuests: 2,
    });
    expect(result.revenue.grossAnnualRevenueUsd).toBe(Math.round(6_700_000 * 273.75));
  });

  it("maximum nightly rate as ADR (scenario at range max) computes from 80,000", () => {
    const result = computeEstateEconomics(ESTATE, {
      adrUsd: { value: 8_000_000, provenance: "estimated" },
      occupancyRate: 0.75,
      averageOccupiedGuests: 2,
    });
    expect(result.revenue.grossAnnualRevenueUsd).toBe(8_000_000 * 273.75);
  });

  it("explicit asset ADR overrides midpoint derivation (documented rule #1)", () => {
    const explicit: Estate = {
      ...ESTATE,
      asset: { ...ESTATE.asset, adrUsd: { value: 7_000_000, provenance: "observed" } },
    };
    expect(baselineAdr(explicit)).toEqual({ adrUsd: 7_000_000, provenance: "observed" });
  });

  it("estates without explicit ADR fall back to the documented midpoint rule", () => {
    const noAdr: Estate = { ...ESTATE, asset: { ...ESTATE.asset, adrUsd: undefined } };
    const derived = baselineAdr(noAdr);
    expect(derived.adrUsd).toBe(7_350_000);
    expect(derived.provenance).toBe("estimated");
  });
});

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

describe("provenance", () => {
  it("every important asset value carries a valid provenance class", () => {
    const valid = ["observed", "estimated", "calculated", "projected", "unknown"];
    const values = [
      ESTATE.asset.propertyValue,
      ESTATE.asset.nightlyRateMin,
      ESTATE.asset.nightlyRateMax,
      ESTATE.asset.occupancyRateMin,
      ESTATE.asset.occupancyRateMax,
      ESTATE.asset.grossAnnualRevenue,
      ESTATE.baselineScenario.adrUsd,
    ];
    for (const v of values) {
      expect(valid).toContain(v.provenance);
    }
  });

  it("baseline seed marks product assumptions as estimated and computed values as calculated", () => {
    expect(ESTATE.asset.propertyValue.provenance).toBe("estimated");
    expect(ESTATE.asset.nightlyRateMin.provenance).toBe("estimated");
    expect(ESTATE.asset.grossAnnualRevenue.provenance).toBe("calculated");
  });
});

// ---------------------------------------------------------------------------
// Legacy bridge (additive; legacy files untouched)
// ---------------------------------------------------------------------------

describe("legacy bridge", () => {
  it("parses legacy display rates into cents", () => {
    expect(parseNightlyRateDisplayToCents("$67,655")).toBe(6_765_500);
    expect(parseNightlyRateDisplayToCents("€40,000")).toBe(4_000_000);
    expect(parseNightlyRateDisplayToCents("n/a")).toBeNull();
  });

  it("bridges without inventing scenario data (unknowns stay unknown)", () => {
    const estate = estateFromLegacyListing({
      id: "prop-marina-vista-4b",
      title: "Grand 2 BDM Ocean Pool Villa",
      location: "JOALI Being, Maldives",
      images: ["/images/properties/joali-being-01.jpg"],
      totalValueUsd: 82_000_000,
      nightlyRate: "$67,655",
    });
    expect(estate.id).toBe("prop-marina-vista-4b");
    expect(estate.asset.propertyValue).toEqual({ value: 82_000_000, provenance: "unknown" });
    expect(estate.asset.nightlyRateMin).toEqual({ value: 6_765_500, provenance: "observed" });
    expect(estate.baselineScenario.averageOccupiedGuests).toBeNull();
    expect(estate.baselineScenario.occupancyRate).toBe(0);
    // No economics are asserted — bridged estates carry no invented assumptions.
    const result = computeBaselineEstateEconomics(estate);
    expect(result.revenue.grossAnnualRevenueUsd).toBe(0);
    expect(result.profit.netProfitKnown).toBe(false);
  });
});
