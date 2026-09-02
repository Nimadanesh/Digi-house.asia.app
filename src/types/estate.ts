// File responsibility: canonical Estate economic data model (Phase 9 Slice A — Economic Data
// Architecture). This is the SOURCE OF TRUTH for estate economics in the rebuild.
//
// Design contract (from the Slice A execution prompt):
// - Every important economic value carries provenance (observed | estimated | calculated |
//   projected | unknown) so the UI can distinguish fact from estimate.
// - Money is integer minor units (cents) per repository convention.
// - Nothing here is UI. Formulas live in `src/lib/economics/estate-economics.ts` (the ONE
//   canonical calculation layer); components must never re-derive them.
// - Missing product data is represented explicitly (ProvenancedValue with provenance "unknown"
//   or nullable option fields) — never guessed.
//
// Dependency direction (implementation order): EstateData → EconomicModel → (future) ScenarioEngine
// → ShareModel → PlanEngine → ViewModel → UI. This file covers EstateData (+ scenario inputs).

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

/** Data-quality class of an economic value (Slice A §10). */
export type Provenance = "observed" | "estimated" | "calculated" | "projected" | "unknown";

/**
 * A value that knows where it came from. The UI layer must be able to present the
 * distinction (e.g. "$8,000,000 (estimated)") — it must never present an estimate
 * as an observed fact.
 */
export interface ProvenancedValue<T = number> {
  value: T;
  provenance: Provenance;
}

// ---------------------------------------------------------------------------
// Asset
// ---------------------------------------------------------------------------

/** Currency of the estate's monetary fields (canonical seed: USD). */
export type EstateCurrency = "USD";

/**
 * Physical / rental asset facts for an estate.
 * - `propertyValue` in minor units.
 * - `nightlyRateMin/Max` define the observed rental range; ADR is NOT silently derived
 *   from them (§9) — it is an explicit scenario input.
 * - `occupancyRateMin/Max` bound the product-allowed occupancy range (no universal constant).
 * - `grossAnnualRevenue` is always provenance "calculated": ADR × 365 × occupancy.
 */
export interface EstateAsset {
  propertyValue: ProvenancedValue;
  currency: EstateCurrency;
  nightlyRateMin: ProvenancedValue;
  nightlyRateMax: ProvenancedValue;
  /**
   * Explicit ADR when the product defines one (§9). OPTIONAL: when absent, the canonical
   * layer derives the baseline ADR by its one documented rule (range midpoint, provenance
   * "estimated") — never silently picking min or max.
   */
  adrUsd?: ProvenancedValue;
  occupancyRateMin: ProvenancedValue;
  occupancyRateMax: ProvenancedValue;
  /** Calculated by the canonical economic layer; never authored by hand. */
  grossAnnualRevenue: ProvenancedValue;
}

// ---------------------------------------------------------------------------
// Cost model — the exact product-defined economic lines (Slice A §4)
// ---------------------------------------------------------------------------

/**
 * Fixed product assumptions for the rebuild (Slice A §4). One shared constant table;
 * do not duplicate these percentages anywhere else (especially not in components).
 */
export const ESTATE_COST_RATES = {
  /** 17% of gross annual revenue. */
  tourismTax: 0.17,
  /** 10% of gross annual revenue. */
  serviceCharge: 0.1,
  /** $12 per guest per occupied night (amount in minor units = 1200). */
  greenTaxPerGuestPerNight: 1200,
  /** 18% of gross annual revenue — agency / Rental Escapes / OTA cost line. */
  agencyRentalOta: 0.18,
  /** 12.5% of gross annual revenue — operator / resort operating costs. */
  operatorOperating: 0.125,
  /** 1.5% of property value — repair / insurance / maintenance reserve. */
  repairInsuranceMaintenance: 0.015,
} as const;

/** Days per year used by the canonical occupancy formula. */
export const DAYS_PER_YEAR = 365;

/**
 * Cost lines with their canonical basis, in cents.
 * `rate` is echoed for UI/inspection (e.g. 0.17 → "17%"); the derived value is `amountUsd`.
 */
export interface EstateCostLine {
  /** Stable machine id (cost-model line). */
  id:
    | "tourismTax"
    | "serviceCharge"
    | "greenTax"
    | "agencyRentalOta"
    | "operatorOperating"
    | "repairInsuranceMaintenance";
  basis: "grossAnnualRevenue" | "propertyValue" | "guestNights";
  /** Fraction (0.17 = 17%) when basis is a percentage; per-unit cents for guestNights. */
  rate: number;
  amountUsd: number; // minor units
  /** true when a required input is missing (e.g. averageOccupiedGuests) — amount is not a fact. */
  unknown?: boolean;
}

// ---------------------------------------------------------------------------
// Profit allocation — the distinct economic lines (Slice A §6)
// ---------------------------------------------------------------------------

/** Allocation fractions of net profit / gross revenue (Slice A §6). */
export const ESTATE_ALLOCATION_RATES = {
  /** 40% of net profit — property owner / investor side. */
  ownerProfit: 0.4,
  /** 60% of net profit — operator / resort side. */
  operatorProfit: 0.6,
  /** 18% of gross revenue — travel agency share. */
  travelAgency: 0.18,
} as const;

// ---------------------------------------------------------------------------
// Scenario inputs — the EconomicModel inputs (Slice A §8/§9)
// ---------------------------------------------------------------------------

/**
 * Canonical economic scenario inputs. Slice A fixes the baseline scenario
 * (ADR midpoint + occupancy midpoint) — never silently: the derivation rule is
 * stated in `src/lib/economics/estate-economics.ts`.
 */
export interface EstateScenario {
  /** Average Daily Rate in minor units — explicit, never silently picked from the nightly range. */
  adrUsd: ProvenancedValue;
  /** Occupancy as a configurable 0..1 fraction. */
  occupancyRate: number;
  /**
   * Average guests per occupied night. REQUIRED by the green-tax formula and explicitly
   * independent of property capacity (Slice A §4). Nullable: when missing the model
   * reports the green tax as unknown instead of guessing.
   */
  averageOccupiedGuests: number | null;
}

// ---------------------------------------------------------------------------
// Canonical Estate
// ---------------------------------------------------------------------------

/**
 * Canonical Estate model (rebuild). Carries the mandatory product fields the UI must
 * retain (photos, name, location, nightly rental price/range) plus the full economic
 * data needed by the EconomicModel layer.
 *
 * Intentionally a SEPARATE type from the legacy `Listing` (marketplace trading model);
 * bridge helpers live in the economics layer. Legacy trading fields (share supply,
 * prices, orders) must NOT be invented here.
 */
export interface Estate {
  /** Stable estate id (matches the legacy property id when bridged). */
  id: string;
  name: string;
  location: string;
  description?: string;
  /** Property photos (mandatory product field for UI). */
  images: string[];
  asset: EstateAsset;
  /**
   * Baseline economic scenario of the estate (canonical ADR derivation + baseline occupancy).
   * `averageOccupiedGuests: null` = product decision pending (green tax unknown).
   */
  baselineScenario: EstateScenario;
}

// ---------------------------------------------------------------------------
// Economic result shapes (produced ONLY by src/lib/economics/estate-economics.ts)
// ---------------------------------------------------------------------------

export interface EstateRevenueBreakdown {
  /** occupiedNights = 365 × occupancyRate. */
  occupiedNights: number;
  /** guestNights = occupiedNights × averageOccupiedGuests; null when guests are unknown. */
  guestNights: number | null;
  /** grossAnnualRevenue = ADR × occupiedNights (minor units). */
  grossAnnualRevenueUsd: number;
}

export interface EstateProfitBreakdown {
  /** Total of all configured cost lines (minor units). */
  totalCostsUsd: number;
  /** netProfit = grossAnnualRevenue − all configured cost lines (minor units). */
  netProfitUsd: number;
  /** 40% of net profit — property owner / investor side. */
  ownerProfitUsd: number;
  /** 60% of net profit — operator / resort side. */
  operatorProfitUsd: number;
  /** false when a cost line is unknown (missing guests) — net profit must then not be
   *  presented as a fact by the UI (Slice A §2.1: represent missing explicitly). */
  netProfitKnown: boolean;
}

/**
 * Canonical economic result. One shape, one producer. Components receive this —
 * they never compute economics themselves.
 */
export interface EstateEconomics {
  revenue: EstateRevenueBreakdown;
  costs: EstateCostLine[];
  profit: EstateProfitBreakdown;
  /**
   * Travel agency share = 18% of GROSS revenue. Deliberately a separate economic
   * concept from the agency/Rental Escapes/OTA COST line (which is also 18% of gross
   * revenue); the two must remain distinct (Slice A §6).
   */
  travelAgencyShareUsd: number;
}

// ---------------------------------------------------------------------------
// Future rebuild layers (Slice B+ scaffolding placeholders — do not implement yet)
// ---------------------------------------------------------------------------

export type EstateScenarioKind = "conservative" | "baseline" | "ambitious";

/** ScenarioEngine (Slice B): bounds-driven scenario set derived from asset ranges. */
export interface EstateScenarioSet {
  conservative: EstateScenario;
  baseline: EstateScenario;
  ambitious: EstateScenario;
}

/** ShareModel (Slice C): canonical share configuration, states and calculation types. */
export type {
  EstateSecondaryListing,
  EstateShareConfig,
  EstateShareMarketState,
  EstateShareState,
  EstateShareStructure,
  EstateUserPosition,
} from "./estate-share";

/** PlanEngine (future slice). Placeholder — plan terms are product decisions, not invented. */
export type EstatePlanEngine = never;
