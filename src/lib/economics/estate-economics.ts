// File responsibility: THE canonical Estate economic calculation layer (Phase 9 Slice A).
// One deterministic, pure, UI-independent source of truth for every estate economic formula.
// React components must NEVER re-implement these formulas — they consume `EstateEconomics`
// produced here (or via a future ViewModel layer).
//
// Money convention: integer minor units (cents), per repository convention.
// Determinism: same inputs → same outputs; integer rounding only at the final step of
// each line (half-up via Math.round), in list order, never compounding rounding.
//
// Dependency direction (Slice A §11): EstateData (types/estate) → EconomicModel (this file)
// → (future: ScenarioEngine → ShareModel → PlanEngine → ViewModel) → UI.

import {
  DAYS_PER_YEAR,
  ESTATE_ALLOCATION_RATES,
  ESTATE_COST_RATES,
} from "@/types/estate";
import type {
  Estate,
  EstateCostLine,
  EstateEconomics,
  EstateProfitBreakdown,
  EstateReconciliation,
  EstateScenario,
  Provenance,
} from "@/types/estate";

// Re-export for one-stop imports by future layers (ViewModel/UI) without widening the surface.
export type {
  Estate,
  EstateCostLine,
  EstateEconomics,
  EstateScenario,
} from "@/types/estate";
export { ESTATE_ALLOCATION_RATES, ESTATE_COST_RATES, DAYS_PER_YEAR };

// ---------------------------------------------------------------------------
// Rounding policy (documented, deterministic)
// ---------------------------------------------------------------------------

/**
 * All money results are integer cents. Each cost line is rounded once (half-up) from its
 * exact fractional value; net profit subtracts the ROUNDED lines so that the arithmetic
 * is exactly reproducible from the published cost lines (no hidden fractional residue).
 */
function roundCents(x: number): number {
  return Math.round(x);
}

// ---------------------------------------------------------------------------
// Canonical ADR derivation (Slice A §9) — the ONE documented rule
// ---------------------------------------------------------------------------

/**
 * ADR derivation rule (single canonical rule; no silent min/max picking):
 * 1. If the estate defines an explicit `asset.adrUsd`, that is the ADR (its provenance is kept).
 * 2. Otherwise the baseline ADR is the MIDPOINT of the nightly rental range
 *    (min + max) / 2, provenance "estimated".
 * The nightly range itself is never used as ADR.
 *
 * If the product later specifies a different methodology (e.g. seasonally weighted ADR),
 * this function is the only place that changes.
 */
export function baselineAdr(estate: Estate): { adrUsd: number; provenance: Provenance } {
  if (estate.asset.adrUsd) {
    return { adrUsd: estate.asset.adrUsd.value, provenance: estate.asset.adrUsd.provenance };
  }
  const { nightlyRateMin, nightlyRateMax } = estate.asset;
  return {
    adrUsd: roundCents((nightlyRateMin.value + nightlyRateMax.value) / 2),
    provenance: "estimated",
  };
}

/**
 * Resolve the ADR for a scenario run: the scenario's explicit ADR when it is known;
 * otherwise the estate's canonical ADR derivation (documented rule above). A scenario
 * that declares its ADR unknown gets the estate's derived ADR — never a guessed number.
 */
export function scenarioAdrUsd(estate: Estate, scenario: EstateScenario): { adrUsd: number; provenance: Provenance } {
  if (scenario.adrUsd.provenance !== "unknown") {
    return { adrUsd: scenario.adrUsd.value, provenance: scenario.adrUsd.provenance };
  }
  return baselineAdr(estate);
}

/** Occupancy bounds helper: [min, max] in 0..1 (exact bounds are product data, not guesses). */
export function occupancyBounds(estate: Estate): { min: number; max: number } {
  return {
    min: estate.asset.occupancyRateMin.value,
    max: estate.asset.occupancyRateMax.value,
  };
}

/**
 * Baseline occupancy rule (documented): midpoint of the estate's own occupancy bounds.
 * Not a universal constant — each estate carries its own bounds.
 */
export function baselineOccupancy(estate: Estate): number {
  const { min, max } = occupancyBounds(estate);
  return (min + max) / 2;
}

// ---------------------------------------------------------------------------
// Revenue
// ---------------------------------------------------------------------------

/** occupiedNights = 365 × occupancyRate (exact fractional; callers round only for display). */
export function occupiedNights(occupancyRate: number): number {
  return DAYS_PER_YEAR * occupancyRate;
}

/**
 * grossAnnualRevenue = ADR × occupiedNights, rounded once to integer cents.
 * This is the canonical derivation; `EstateAsset.grossAnnualRevenue` provenance is
 * always "calculated" and must equal this result for the same scenario.
 */
export function grossAnnualRevenueUsd(adrUsd: number, occupancyRate: number): number {
  return roundCents(adrUsd * occupiedNights(occupancyRate));
}

// ---------------------------------------------------------------------------
// Cost lines (the exact product-defined economics — Slice A §4)
// ---------------------------------------------------------------------------

const GROSS_RATE_LINES = [
  { id: "tourismTax", rate: ESTATE_COST_RATES.tourismTax },
  { id: "serviceCharge", rate: ESTATE_COST_RATES.serviceCharge },
  { id: "agencyRentalOta", rate: ESTATE_COST_RATES.agencyRentalOta },
  { id: "operatorOperating", rate: ESTATE_COST_RATES.operatorOperating },
] as const;

/**
 * Canonical cost lines for a scenario. Order is stable and published: four percentage-of-
 * gross lines, then green tax, then the property-value reserve.
 *
 * Unknown handling (Slice A §2.1): when `averageOccupiedGuests` is missing, the green-tax
 * line is returned with `unknown: true` and amount 0 — the model does NOT guess a guest
 * count, and net profit is flagged not-known (`netProfitKnown: false`).
 */
export function costLines(
  estate: Estate,
  scenario: EstateScenario,
): EstateCostLine[] {
  const gross = grossAnnualRevenueUsd(scenarioAdrUsd(estate, scenario).adrUsd, scenario.occupancyRate);
  const lines: EstateCostLine[] = GROSS_RATE_LINES.map(({ id, rate }) => ({
    id,
    basis: "grossAnnualRevenue",
    rate,
    amountUsd: roundCents(gross * rate),
  }));

  if (scenario.averageOccupiedGuests == null) {
    lines.push({
      id: "greenTax",
      basis: "guestNights",
      rate: ESTATE_COST_RATES.greenTaxPerGuestPerNight,
      amountUsd: 0,
      unknown: true,
    });
  } else {
    const guestNights = occupiedNights(scenario.occupancyRate) * scenario.averageOccupiedGuests;
    lines.push({
      id: "greenTax",
      basis: "guestNights",
      rate: ESTATE_COST_RATES.greenTaxPerGuestPerNight,
      amountUsd: roundCents(guestNights * ESTATE_COST_RATES.greenTaxPerGuestPerNight),
    });
  }

  const propertyValue = estate.asset.propertyValue.value;
  lines.push({
    id: "repairInsuranceMaintenance",
    basis: "propertyValue",
    rate: ESTATE_COST_RATES.repairInsuranceMaintenance,
    amountUsd: roundCents(propertyValue * ESTATE_COST_RATES.repairInsuranceMaintenance),
  });

  return lines;
}

// ---------------------------------------------------------------------------
// Profit + allocations
// ---------------------------------------------------------------------------

/**
 * Net profit and the distinct profit-allocation lines.
 * - netProfit = grossAnnualRevenue − Σ(rounded cost lines)
 * - owner = 40% of net profit; operator = 60% of net profit (rounded once each).
 * When any cost line is unknown, `netProfitKnown` is false and allocations are reported
 * as 0 — they must not be presented as facts (Slice A §2.1).
 */
export function profitBreakdown(
  grossAnnualRevenue: number,
  costs: EstateCostLine[],
): EstateProfitBreakdown {
  const unknown = costs.some((c) => c.unknown);
  const totalCosts = costs.reduce((s, c) => s + c.amountUsd, 0);
  if (unknown) {
    return {
      totalCostsUsd: totalCosts,
      netProfitUsd: 0,
      ownerProfitUsd: 0,
      operatorProfitUsd: 0,
      netProfitKnown: false,
    };
  }
  const netProfit = grossAnnualRevenue - totalCosts;
  return {
    totalCostsUsd: totalCosts,
    netProfitUsd: netProfit,
    ownerProfitUsd: roundCents(netProfit * ESTATE_ALLOCATION_RATES.ownerProfit),
    operatorProfitUsd: roundCents(netProfit * ESTATE_ALLOCATION_RATES.operatorProfit),
    netProfitKnown: true,
  };
}

/** travelAgencyShare = 18% of GROSS revenue (distinct from the agencyRentalOta cost line). */
export function travelAgencyShareUsd(grossAnnualRevenue: number): number {
  return roundCents(grossAnnualRevenue * ESTATE_ALLOCATION_RATES.travelAgency);
}

// ---------------------------------------------------------------------------
// Canonical entry point
// ---------------------------------------------------------------------------

/**
 * THE one canonical calculation. Produces the full `EstateEconomics` result for an estate
 * under a scenario. Every consumer (ViewModel/UI today, ScenarioEngine/ShareModel/
 * PlanEngine later) must obtain economics through this function.
 */
export function computeEstateEconomics(
  estate: Estate,
  scenario: EstateScenario,
): EstateEconomics {
  const adr = scenarioAdrUsd(estate, scenario);
  const gross = grossAnnualRevenueUsd(adr.adrUsd, scenario.occupancyRate);
  const costs = costLines(estate, scenario);
  const profit = profitBreakdown(gross, costs);
  const result: EstateEconomics = {
    revenue: {
      occupiedNights: occupiedNights(scenario.occupancyRate),
      guestNights:
        scenario.averageOccupiedGuests == null
          ? null
          : occupiedNights(scenario.occupancyRate) * scenario.averageOccupiedGuests,
      grossAnnualRevenueUsd: gross,
    },
    costs,
    profit,
    travelAgencyShareUsd: travelAgencyShareUsd(gross),
    reconciliation: {
      grossRevenueUsd: 0,
      totalConfiguredCostsUsd: 0,
      netProfitUsd: 0,
      ownerProfitUsd: 0,
      operatorProfitUsd: 0,
      netProfitReconciles: false,
      allocationReconciles: false,
    },
  };
  // Derive the contract-required reconciliation artifact from the ALREADY-COMPUTED
  // result (verification only — no formula is re-run), then attach and return.
  result.reconciliation = reconcileEconomics(result);
  return result;
}

/** Convenience: economics under the estate's own baseline scenario. */
export function computeBaselineEstateEconomics(estate: Estate): EstateEconomics {
  return computeEstateEconomics(estate, estate.baselineScenario);
}

// ---------------------------------------------------------------------------
// Reconciliation (verification artifact — NOT a second calculation engine)
// ---------------------------------------------------------------------------

/**
 * Build the contract-required reconciliation result from the ALREADY-COMPUTED values of
 * one economics result. No formula is re-run: each field is reused verbatim from the
 * result it travels with, so the artifact can never diverge from that result.
 * Flags report the two contract identities over integer cents:
 *   1. net profit = gross revenue − total configured costs
 *   2. owner profit + operator profit = net profit
 */
function reconcileEconomics(result: EstateEconomics): EstateReconciliation {
  const { revenue, profit } = result;
  return {
    grossRevenueUsd: revenue.grossAnnualRevenueUsd,
    totalConfiguredCostsUsd: profit.totalCostsUsd,
    netProfitUsd: profit.netProfitUsd,
    ownerProfitUsd: profit.ownerProfitUsd,
    operatorProfitUsd: profit.operatorProfitUsd,
    netProfitReconciles:
      profit.netProfitUsd === revenue.grossAnnualRevenueUsd - profit.totalCostsUsd,
    allocationReconciles:
      profit.ownerProfitUsd + profit.operatorProfitUsd === profit.netProfitUsd,
  };
}

// ---------------------------------------------------------------------------
// Bridge to the legacy marketplace model (additive — no legacy file is modified)
// ---------------------------------------------------------------------------

/**
 * Minimal structural view of the legacy marketplace `Listing` (src/types/property.ts)
 * needed for bridging. Kept structural (not imported) so the canonical model stays
 * decoupled from the legacy type while the rebuild proceeds slice by slice.
 */
interface LegacyListingBridge {
  id: string;
  title: string;
  location: string;
  description?: string;
  images: string[];
  totalValueUsd: number; // minor units
  nightlyRate?: string; // display string, e.g. "$67,655"
}

/** Parse a legacy display nightly rate ("$67,655" / "€40,000") into integer cents, or null. */
export function parseNightlyRateDisplayToCents(display: string): number | null {
  const m = display.replace(/\s/g, "").match(/^[$€]?([\d.,]+)$/);
  if (!m) return null;
  const normalized = m[1].replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  return Math.round(parseFloat(normalized) * 100);
}

/**
 * Bridge a legacy marketplace listing into the canonical Estate model.
 * - `propertyValue` ← `totalValueUsd` (provenance "unknown" — legacy field has no sourcing).
 * - Nightly range: only derivable when the legacy display rate parses; then min = max = that
 *   single observed figure (an honest degenerate range), provenance "observed" w.r.t. the
 *   legacy feed. Otherwise the range is unknown.
 * - `averageOccupiedGuests`: NOT bridged — no legacy source exists. Green tax reports
 *   unknown until the product defines guest counts.
 * - Scenario inputs (ADR/occupancy): { value: 0, provenance: "unknown" } / 0 — the model
 *   then produces zero revenue, i.e. NO economic assumption is made. Bridged estates must
 *   receive real scenario inputs (product data) before their economics are presented.
 * Trading fields (shares, prices, orders) are deliberately NOT bridged.
 */
export function estateFromLegacyListing(listing: LegacyListingBridge): Estate {
  const nightlyCents = listing.nightlyRate ? parseNightlyRateDisplayToCents(listing.nightlyRate) : null;
  return {
    id: listing.id,
    name: listing.title,
    location: listing.location,
    description: listing.description,
    images: listing.images,
    asset: {
      propertyValue: { value: listing.totalValueUsd, provenance: "unknown" },
      currency: "USD",
      nightlyRateMin:
        nightlyCents != null
          ? { value: nightlyCents, provenance: "observed" }
          : { value: 0, provenance: "unknown" },
      nightlyRateMax: nightlyCents != null
        ? { value: nightlyCents, provenance: "observed" }
        : { value: 0, provenance: "unknown" },
      occupancyRateMin: { value: 0, provenance: "unknown" },
      occupancyRateMax: { value: 1, provenance: "unknown" },
      grossAnnualRevenue: { value: 0, provenance: "calculated" },
      adrUsd: undefined,
    },
    baselineScenario: {
      adrUsd: nightlyCents != null
        ? { value: nightlyCents, provenance: "observed" }
        : { value: 0, provenance: "unknown" },
      occupancyRate: 0,
      averageOccupiedGuests: null,
    },
  };
}
