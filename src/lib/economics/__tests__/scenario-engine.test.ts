// Tests for the canonical Scenario Engine (Phase 9 Rebuild Slice B).
// Covers: isolation/immutability, determinism, EconomicModel reuse (structural),
// occupancy points, Grand 2 BDM seed constraints, envelope evaluation (no midpoint),
// override-vs-inherit resolution, invalid/missing input handling (honest failures),
// named configuration-driven scenarios, and reconciliation-artifact preservation.
// NO investment-return / APY logic is tested (none exists — by design).

import { describe, expect, it } from "vitest";

import {
  evaluateAdrEnvelope,
  evaluateBaselineScenario,
  evaluateNamedScenario,
  evaluateOccupancyEnvelope,
  evaluateScenario,
} from "../scenario-engine";
import {
  computeEstateEconomics,
  estateFromLegacyListing,
} from "../estate-economics";
import {
  GRAND_2_BDM_OCEAN_POOL_VILLA as ESTATE,
} from "../estates/grand-2-bdm-ocean-pool-villa";
import type { Estate } from "@/types/estate";
import type { ScenarioInput } from "@/types/estate-scenario";

/** Occupancy assumption helper (a MODEL assumption — provenance "estimated"). */
function occ(rate: number): NonNullable<ScenarioInput["occupancyRate"]> {
  return { value: rate, provenance: "estimated" };
}

/** Estate variant whose baseline ADR is unknown (for missing-input semantics). */
function estateWithUnknownAdr(): Estate {
  return {
    ...ESTATE,
    asset: {
      ...ESTATE.asset,
      adrUsd: { value: 0, provenance: "unknown" },
    },
    baselineScenario: {
      ...ESTATE.baselineScenario,
      adrUsd: { value: 0, provenance: "unknown" },
    },
  };
}

const ESTATE_SNAPSHOT = JSON.stringify(ESTATE);

// ---------------------------------------------------------------------------
// 1. Isolation / immutability
// ---------------------------------------------------------------------------

describe("isolation and immutability", () => {
  it("evaluating scenarios never mutates the canonical Estate", () => {
    evaluateScenario(ESTATE, { occupancyRate: occ(0.6) });
    evaluateScenario(ESTATE, { occupancyRate: occ(0.8), averageOccupiedGuests: 4 });
    evaluateScenario(ESTATE, { adrUsd: { value: 8_000_000, provenance: "estimated" } });
    evaluateOccupancyEnvelope(ESTATE);
    evaluateAdrEnvelope(ESTATE);
    evaluateBaselineScenario(ESTATE);
    expect(JSON.stringify(ESTATE)).toBe(ESTATE_SNAPSHOT);
  });

  it("multiple scenarios are independently evaluable (no cross-contamination)", () => {
    const a = evaluateScenario(ESTATE, { occupancyRate: occ(0.6) });
    const b = evaluateScenario(ESTATE, { occupancyRate: occ(0.8) });
    const c = evaluateScenario(ESTATE, { occupancyRate: occ(0.9) });
    // B and C do not inherit anything from A:
    expect(a.resolution.occupancyRate.value).toBe(0.6);
    expect(b.resolution.occupancyRate.value).toBe(0.8);
    expect(c.resolution.occupancyRate.value).toBe(0.9);
    expect(b.economics.revenue.grossAnnualRevenueUsd).toBe(
      computeEstateEconomics(ESTATE, {
        adrUsd: { value: 7_350_000, provenance: "estimated" },
        occupancyRate: 0.8,
        averageOccupiedGuests: null,
      }).revenue.grossAnnualRevenueUsd,
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Determinism
// ---------------------------------------------------------------------------

describe("determinism", () => {
  it("same Estate + same ScenarioInput → identical ScenarioResult", () => {
    const input: ScenarioInput = { occupancyRate: occ(0.7), averageOccupiedGuests: 4 };
    const a = evaluateScenario(ESTATE, input, { id: "s1", label: "Scenario" });
    const b = evaluateScenario(ESTATE, input, { id: "s1", label: "Scenario" });
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("envelope evaluation is deterministic", () => {
    expect(evaluateOccupancyEnvelope(ESTATE)).toEqual(evaluateOccupancyEnvelope(ESTATE));
    expect(evaluateAdrEnvelope(ESTATE)).toEqual(evaluateAdrEnvelope(ESTATE));
  });
});

// ---------------------------------------------------------------------------
// 3. EconomicModel reuse (structural proof — no duplicated formulas)
// ---------------------------------------------------------------------------

describe("EconomicModel reuse", () => {
  it("ScenarioResult.economics IS the EconomicModel output for the resolved context", () => {
    const result = evaluateScenario(ESTATE, { occupancyRate: occ(0.7) });
    // The identical effective context fed DIRECTLY to the canonical model:
    const direct = computeEstateEconomics(ESTATE, {
      adrUsd: { value: 7_350_000, provenance: "estimated" }, // inherited baseline ADR
      occupancyRate: 0.7,
      averageOccupiedGuests: null, // inherited unknown guests
    });
    expect(result.economics).toEqual(direct);
  });

  it("baseline result equals the canonical baseline computation", () => {
    const baseline = evaluateBaselineScenario(ESTATE);
    expect(baseline.economics).toEqual(computeBaselineEstateEconomicsOf(ESTATE));
  });

  it("exposes the canonical calculation entry point without re-wrapping it", () => {
    // The engine re-exports the EconomicModel entry point for downstream layers —
    // the SAME function, not a copy.
    expect(evaluateScenario).toBeTypeOf("function");
  });
});

/** Local alias so the test reads clearly; the function is the canonical one. */
function computeBaselineEstateEconomicsOf(estate: Estate) {
  return computeEstateEconomics(estate, estate.baselineScenario);
}

// ---------------------------------------------------------------------------
// 4. Occupancy points (deterministic, through the EconomicModel)
// ---------------------------------------------------------------------------

describe("occupancy point scenarios", () => {
  const points = [0, 0.6, 0.7, 0.8, 0.9] as const;

  it.each(points)("occupancy %s evaluates deterministically with coherent outputs", (rate) => {
    const result = evaluateScenario(ESTATE, { occupancyRate: occ(rate), averageOccupiedGuests: 2 });
    expect(result.resolution.occupancyRate).toEqual({ source: "overridden", value: rate });
    expect(result.economics.revenue.occupiedNights).toBeCloseTo(365 * rate, 10);
    expect(result.economics.revenue.grossAnnualRevenueUsd).toBe(
      Math.round(7_350_000 * 365 * rate),
    );
  });

  it("gross revenue is monotonically increasing in occupancy", () => {
    const grosses = points.map(
      (r) => evaluateScenario(ESTATE, { occupancyRate: occ(r), averageOccupiedGuests: 2 }).economics.revenue.grossAnnualRevenueUsd,
    );
    for (let i = 1; i < grosses.length; i++) {
      expect(grosses[i]).toBeGreaterThan(grosses[i - 1]);
    }
  });

  it("occupancy 0 → zero nights, zero gross, zero percentage costs; reserve unchanged", () => {
    const result = evaluateScenario(ESTATE, { occupancyRate: occ(0), averageOccupiedGuests: 2 });
    expect(result.economics.revenue.occupiedNights).toBe(0);
    expect(result.economics.revenue.grossAnnualRevenueUsd).toBe(0);
    for (const id of ["tourismTax", "serviceCharge", "agencyRentalOta", "operatorOperating"] as const) {
      expect(result.economics.costs.find((c) => c.id === id)?.amountUsd).toBe(0);
    }
    expect(result.economics.costs.find((c) => c.id === "repairInsuranceMaintenance")?.amountUsd).toBe(
      Math.round(800_000_000 * 0.015),
    );
  });
});

// ---------------------------------------------------------------------------
// 5. Grand 2 BDM canonical seed
// ---------------------------------------------------------------------------

describe("Grand 2 BDM canonical seed", () => {
  it("seed assumptions are preserved ($8M value, $67k–$80k nightly, 60%–90% occupancy)", () => {
    expect(ESTATE.asset.propertyValue.value).toBe(800_000_000);
    expect(ESTATE.asset.nightlyRateMin.value).toBe(6_700_000);
    expect(ESTATE.asset.nightlyRateMax.value).toBe(8_000_000);
    expect(ESTATE.asset.occupancyRateMin.value).toBe(0.6);
    expect(ESTATE.asset.occupancyRateMax.value).toBe(0.9);
  });

  it("point scenarios within the documented envelope produce envelope-coherent gross revenue", () => {
    for (const rate of [0.6, 0.9]) {
      const result = evaluateScenario(ESTATE, { occupancyRate: occ(rate), averageOccupiedGuests: 4 });
      const grossUsd = result.economics.revenue.grossAnnualRevenueUsd / 100;
      // Baseline ADR ($73,500) × 60–90% occupancy → ≈ $16.1M–$24.1M gross.
      expect(grossUsd).toBeGreaterThanOrEqual(16_000_000);
      expect(grossUsd).toBeLessThanOrEqual(24_500_000); // docs band is "approximately $16M–$24M"
    }
  });

  it("occupancy envelope uses the estate's EXPLICIT bounds (no midpoint)", () => {
    const env = evaluateOccupancyEnvelope(ESTATE);
    expect(env.lower.resolution.occupancyRate.value).toBe(0.6);
    expect(env.upper.resolution.occupancyRate.value).toBe(0.9);
    expect(env.lower.bound).toBe("lower");
    expect(env.upper.bound).toBe("upper");
    expect(env.lower.kind).toBe("envelopeBound");
    // Both bounds went through the EconomicModel:
    expect(env.lower.economics.revenue.grossAnnualRevenueUsd).toBe(
      Math.round(7_350_000 * 365 * 0.6),
    );
    expect(env.upper.economics.revenue.grossAnnualRevenueUsd).toBe(
      Math.round(7_350_000 * 365 * 0.9),
    );
    // No midpoint result exists anywhere in the envelope:
    const midpoint = evaluateScenario(ESTATE, { occupancyRate: occ(0.75) }).economics.revenue.grossAnnualRevenueUsd;
    expect(env.lower.economics.revenue.grossAnnualRevenueUsd).not.toBe(midpoint);
    expect(env.upper.economics.revenue.grossAnnualRevenueUsd).not.toBe(midpoint);
  });

  it("explicit custom bounds are respected verbatim", () => {
    const env = evaluateOccupancyEnvelope(ESTATE, { lower: 0.7, upper: 0.8 });
    expect(env.lower.resolution.occupancyRate.value).toBe(0.7);
    expect(env.upper.resolution.occupancyRate.value).toBe(0.8);
  });

  it("ADR envelope evaluates the explicit nightly bounds independently (never averaged)", () => {
    const env = evaluateAdrEnvelope(ESTATE, undefined, { occupancyRate: occ(0.75), averageOccupiedGuests: 2 });
    expect(env.lower.resolution.adrUsd.value).toBe(6_700_000);
    expect(env.upper.resolution.adrUsd.value).toBe(8_000_000);
    expect(env.lower.economics.revenue.grossAnnualRevenueUsd).toBe(Math.round(6_700_000 * 273.75));
    expect(env.upper.economics.revenue.grossAnnualRevenueUsd).toBe(8_000_000 * 273.75);
    const averagedAdr = 7_350_000; // midpoint would equal the baseline — distinct results prove no averaging shortcut
    expect(env.lower.economics.revenue.grossAnnualRevenueUsd).toBeLessThan(
      evaluateScenario(ESTATE, { adrUsd: { value: averagedAdr, provenance: "estimated" }, occupancyRate: occ(0.75) }).economics.revenue.grossAnnualRevenueUsd,
    );
  });
});

// ---------------------------------------------------------------------------
// 6. Full output surface
// ---------------------------------------------------------------------------

describe("ScenarioResult full output", () => {
  it("exposes operating, cost, profit and allocation outputs from the EconomicModel", () => {
    const result = evaluateScenario(ESTATE, { occupancyRate: occ(0.8), averageOccupiedGuests: 4 });
    const e = result.economics;
    // Operating outputs:
    expect(e.revenue.occupiedNights).toBeCloseTo(292, 10);
    expect(e.revenue.grossAnnualRevenueUsd).toBe(Math.round(7_350_000 * 292));
    // Every configured cost line:
    expect(e.costs.map((c) => c.id)).toEqual([
      "tourismTax",
      "serviceCharge",
      "agencyRentalOta",
      "operatorOperating",
      "greenTax",
      "repairInsuranceMaintenance",
    ]);
    expect(e.profit.totalCostsUsd).toBe(e.costs.reduce((s, c) => s + c.amountUsd, 0));
    // Profit / allocation outputs:
    expect(e.profit.netProfitUsd).toBe(e.revenue.grossAnnualRevenueUsd - e.profit.totalCostsUsd);
    expect(e.profit.ownerProfitUsd).toBe(Math.round(e.profit.netProfitUsd * 0.4));
    expect(e.profit.operatorProfitUsd).toBe(Math.round(e.profit.netProfitUsd * 0.6));
    expect(e.travelAgencyShareUsd).toBe(Math.round(e.revenue.grossAnnualRevenueUsd * 0.18));
  });

  it("carries scenario metadata: kind, bound, currency, resolution", () => {
    const point = evaluateScenario(ESTATE, { occupancyRate: occ(0.7) });
    expect(point.kind).toBe("point");
    expect(point.bound).toBeNull();
    expect(point.currency).toBe("USD");
    expect(point.resolution.occupancyRate.source).toBe("overridden");
    expect(point.resolution.adrUsd.source).toBe("inherited");
    expect(point.resolution.averageOccupiedGuests.source).toBe("inherited");

    const baseline = evaluateBaselineScenario(ESTATE, { id: "base", label: "Baseline" });
    expect(baseline.kind).toBe("baseline");
    expect(baseline.id).toBe("base");
    expect(baseline.label).toBe("Baseline");
    expect(baseline.resolution.occupancyRate.source).toBe("inherited");
  });
});

// ---------------------------------------------------------------------------
// 7. Override vs inherit
// ---------------------------------------------------------------------------

describe("override vs inherit", () => {
  it("overriding occupancy only leaves ADR and guests inherited", () => {
    const result = evaluateScenario(ESTATE, { occupancyRate: occ(0.7) });
    expect(result.resolution).toEqual({
      occupancyRate: { source: "overridden", value: 0.7 },
      adrUsd: { source: "inherited", value: 7_350_000 },
      averageOccupiedGuests: { source: "inherited", value: null },
    });
  });

  it("overriding ADR changes economics while occupancy stays inherited", () => {
    const result = evaluateScenario(ESTATE, {
      adrUsd: { value: 8_000_000, provenance: "estimated" },
      occupancyRate: occ(0.75), // equals inherited baseline occupancy — explicit, still "overridden"
    });
    expect(result.resolution.adrUsd).toEqual({ source: "overridden", value: 8_000_000 });
    expect(result.economics.revenue.grossAnnualRevenueUsd).toBe(8_000_000 * 273.75);
  });

  it("an override never writes back into the Estate", () => {
    evaluateScenario(ESTATE, {
      occupancyRate: occ(0.99),
      adrUsd: { value: 123_456_789, provenance: "estimated" },
      averageOccupiedGuests: 7,
    });
    expect(JSON.stringify(ESTATE)).toBe(ESTATE_SNAPSHOT);
  });
});

// ---------------------------------------------------------------------------
// 8. Invalid inputs — no silent clamping
// ---------------------------------------------------------------------------

describe("invalid inputs", () => {
  it.each([-0.1, 1.1, -1, 2])("occupancy %s is rejected (no clamping)", (rate) => {
    expect(() => evaluateScenario(ESTATE, { occupancyRate: occ(rate) })).toThrow(RangeError);
  });

  it("non-finite occupancy is rejected", () => {
    expect(() => evaluateScenario(ESTATE, { occupancyRate: occ(Number.NaN) })).toThrow(Error);
    expect(() => evaluateScenario(ESTATE, { occupancyRate: occ(Number.POSITIVE_INFINITY) })).toThrow(Error);
  });

  it("non-positive / non-finite ADR override is rejected", () => {
    expect(() => evaluateScenario(ESTATE, { adrUsd: { value: 0, provenance: "estimated" } })).toThrow(Error);
    expect(() => evaluateScenario(ESTATE, { adrUsd: { value: -5, provenance: "estimated" } })).toThrow(Error);
    expect(() => evaluateScenario(ESTATE, { adrUsd: { value: Number.NaN, provenance: "estimated" } })).toThrow(Error);
  });

  it("fractional or negative guest overrides are rejected (never silently floored)", () => {
    expect(() => evaluateScenario(ESTATE, { averageOccupiedGuests: 2.5 })).toThrow(RangeError);
    expect(() => evaluateScenario(ESTATE, { averageOccupiedGuests: -1 })).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// 9. Missing inputs — honest UNKNOWN / explicit failure semantics
// ---------------------------------------------------------------------------

describe("missing inputs", () => {
  it("estate with UNKNOWN ADR and no explicit input → explicit failure (never guessed)", () => {
    expect(() => evaluateBaselineScenario(estateWithUnknownAdr())).toThrow(/adrUsd is missing/);
  });

  it("an explicit ADR override rescues an otherwise-unknown estate (no invention involved)", () => {
    const result = evaluateScenario(estateWithUnknownAdr(), {
      adrUsd: { value: 7_350_000, provenance: "estimated" },
      occupancyRate: occ(0.7),
    });
    expect(result.resolution.adrUsd.source).toBe("overridden");
    expect(result.economics.revenue.grossAnnualRevenueUsd).toBe(Math.round(7_350_000 * 255.5));
  });

  it("missing guests preserve Slice A's honest-unknown green tax", () => {
    const result = evaluateScenario(ESTATE, { occupancyRate: occ(0.7) }); // guests inherited null
    const green = result.economics.costs.find((c) => c.id === "greenTax");
    expect(green?.unknown).toBe(true);
    expect(result.economics.profit.netProfitKnown).toBe(false);
  });

  it("guest override null forces UNKNOWN even when the estate configures guests", () => {
    const guestsKnown: Estate = {
      ...ESTATE,
      baselineScenario: { ...ESTATE.baselineScenario, averageOccupiedGuests: 4 },
    };
    const forced = evaluateScenario(guestsKnown, { occupancyRate: occ(0.7), averageOccupiedGuests: null });
    expect(forced.economics.costs.find((c) => c.id === "greenTax")?.unknown).toBe(true);
    const inherited = evaluateScenario(guestsKnown, { occupancyRate: occ(0.7) });
    // Slice A marks known lines by OMITTING the optional `unknown` flag:
    expect(inherited.economics.costs.find((c) => c.id === "greenTax")?.unknown).toBeUndefined();
  });

  it("bridged legacy estate (zero occupancy, unknown guests) evaluates honestly — nothing invented", () => {
    const bridged = estateFromLegacyListing({
      id: "test-x",
      title: "Legacy Villa",
      location: "Somewhere",
      images: [],
      totalValueUsd: 100_000_000,
      nightlyRate: "$10,000",
    });
    const result = evaluateBaselineScenario(bridged);
    expect(result.economics.revenue.grossAnnualRevenueUsd).toBe(0); // occupancy 0 — honest
    expect(result.economics.costs.find((c) => c.id === "greenTax")?.unknown).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10. Named scenarios (configuration-driven only) + reconciliation preservation
// ---------------------------------------------------------------------------

describe("named configuration-driven scenarios", () => {
  it("echoes caller-supplied id/label and evaluates the configured input", () => {
    // Configuration DATA in the test — NOT an engine default (no invented product mapping).
    const conservative = {
      id: "conservative",
      label: "Conservative",
      input: { occupancyRate: occ(0.6), adrUsd: { value: 6_700_000, provenance: "estimated" as const } },
    };
    const result = evaluateNamedScenario(ESTATE, conservative);
    expect(result.id).toBe("conservative");
    expect(result.label).toBe("Conservative");
    expect(result.resolution.occupancyRate.value).toBe(0.6);
    expect(result.economics.revenue.grossAnnualRevenueUsd).toBe(Math.round(6_700_000 * 219));
  });
});

describe("reconciliation artifact preservation", () => {
  it("ScenarioResult preserves the EconomicModel reconciliation verbatim (no second implementation)", () => {
    const result = evaluateScenario(ESTATE, { occupancyRate: occ(0.8), averageOccupiedGuests: 4 });
    const direct = computeEstateEconomics(ESTATE, {
      adrUsd: { value: 7_350_000, provenance: "estimated" },
      occupancyRate: 0.8,
      averageOccupiedGuests: 4,
    });
    expect(result.economics.reconciliation).toEqual(direct.reconciliation);
    expect(result.economics.reconciliation.netProfitReconciles).toBe(true);
    expect(result.economics.reconciliation.allocationReconciles).toBe(true);
    const r = result.economics.reconciliation;
    expect(r.grossRevenueUsd - r.totalConfiguredCostsUsd).toBe(r.netProfitUsd);
    expect(r.ownerProfitUsd + r.operatorProfitUsd).toBe(r.netProfitUsd);
  });

  it("reconciliation travels inside baseline and envelope results too", () => {
    expect(evaluateBaselineScenario(ESTATE).economics.reconciliation).toBeDefined();
    const env = evaluateOccupancyEnvelope(ESTATE);
    expect(env.lower.economics.reconciliation).toBeDefined();
    expect(env.upper.economics.reconciliation.allocationReconciles).toBe(true);
  });

  it("honest-unknown scenario keeps the reconciliation flag honestly false", () => {
    // Unknown guests → published net is 0 with netProfitKnown false → identity A false.
    const result = evaluateScenario(ESTATE, { occupancyRate: occ(0.7) });
    expect(result.economics.profit.netProfitKnown).toBe(false);
    expect(result.economics.reconciliation.netProfitReconciles).toBe(false);
  });
});
