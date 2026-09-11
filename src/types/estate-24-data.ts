// File responsibility: exact TypeScript shape of docs/product/rebuild/ESTATE-24-DATA.json.
// Verbatim adoption (PROMPT 02): no re-estimation, no invented fields. Nullable where
// the JSON uses null. Leaf layer: imports nothing.
//
// CONSOLIDATION LAYER (2026-09-08, from the Master Extraction Report): strictly
// ADDITIVE optional keys. Every pre-existing field stays byte-identical (pinned by
// PROMPT 02 tests). New keys carry the live Rental Escapes rate-table observations,
// the layered valuation record, listing-observed taxes/fees, stay rules, conflict
// records, and the consolidation verdict. Nothing here is ADR, annual revenue,
// yield, ROI, profit, or income — those remain UNKNOWN by contract.
export interface Estate24Location {
  country: string;
  region: string;
  place: string;
  full: string;
}

export interface Estate24Specs {
  guests: number;
  bedrooms: number;
  bathrooms: number;
  /** Full-bath count stays in `bathrooms`; halves live here (OBSERVED, e.g. The Aerial). */
  halfBathrooms?: number | null;
  sizeInteriorM2: number | null;
  sizeTotalM2: number | null;
  poolM2: number | null;
  landHa: number | null;
  landNote: string | null;
}

export interface Estate24Description {
  short: string;
  full: string;
  seasonality: string;
}

export interface Estate24Amenities {
  general: string[];
  outdoor: string[];
  indoor: string[];
  kitchen: string[];
  entertainment: string[];
  activities: string[];
  nearby: string[];
}

export interface Estate24Services {
  included: string[];
  staff: string[];
  extraCost: string[];
}

export type Estate24RateType = "RANGE" | "APPROXIMATE" | "STARTING_FROM" | "DYNAMIC";

export interface Estate24Rates {
  nightly: string;
  type: Estate24RateType;
  currency: string;
  notes: string;
  observedPeriod: string;
}

export interface Estate24TaxFee {
  type: string;
  value: number | null;
  name?: string;
  note?: string;
  unit?: string;
  currency?: string;
}

export interface Estate24TaxesAndFees {
  tourismTax: Estate24TaxFee;
  serviceCharge: Estate24TaxFee | null;
  greenTax: Estate24TaxFee | null;
  damageWaiver: Estate24TaxFee | null;
  other: Estate24TaxFee[];
}

export interface Estate24CostDefaults {
  tourismTaxPct: number | null;
  serviceChargePct: number | null;
  agencyOtaPct: number | null;
  operatorPct: number | null;
  greenTaxPerGuestNight: number | null;
  repairInsurancePctOfValue: number | null;
}

export interface Estate24Estimates {
  valueCentral: number;
  valueRange: [number, number];
  occupancy: null;
  provenance: string;
}

export interface Estate24Research {
  confidence: "MEDIUM" | "HIGH";
  lastUpdated: string;
  sources: string[];
}

/** One authoritative record from ESTATE-24-DATA.json, preserved exactly. */
export interface Estate24Record {
  id: number;
  listingId: string;
  name: string;
  slug: string;
  location: Estate24Location;
  propertyType: string;
  sourceUrl: string;
  specs: Estate24Specs;
  description: Estate24Description;
  amenities: Estate24Amenities;
  services: Estate24Services;
  rates: Estate24Rates;
  taxesAndFees: Estate24TaxesAndFees;
  costStructureDefaults: Estate24CostDefaults;
  estimates: Estate24Estimates;
  research: Estate24Research;
  /** Consolidation layer (additive — see file header). Present on all 24 records. */
  rateTable: Estate24RateTable;
  valuation: Estate24Valuation;
  taxesListing: Estate24TaxesListing;
  taxesResearch: Estate24ResearchTax[];
  stayRules: Estate24StayRules;
  conflicts: Estate24ConflictRecord[];
  consolidation: Estate24Consolidation;
}

/** One dated price window collapsed from identical table rows. */
export interface Estate24SeasonPeriod {
  startDate: string;
  endDate: string;
}

export type Estate24PricingBasis = "NIGHTLY" | "WEEKLY";

export interface Estate24Season {
  /** Base category name with year/sequence suffixes removed. */
  name: string;
  /** Original table row names that were collapsed into this season. */
  variants: string[];
  periods: Estate24SeasonPeriod[];
  /** Bedroom-count configuration this row was published for (listing artifact). */
  rooms: string;
  pricingBasis: Estate24PricingBasis;
  /** Original nightly figure when the table prices nightly; otherwise null. */
  nightly: number | null;
  /** Original weekly figure when the table prices weekly; otherwise null. */
  weekly: number | null;
  /** weekly / 7 (rounded, 2dp) when WEEKLY; otherwise null. Never ADR. */
  nightlyDerived: number | null;
  minStay: number[];
  currency: string;
}

export interface Estate24AverageNightlyRate {
  value: number;
  currency: string;
  /** Mean of the DISTINCT full-buyout nightly values (weekly/7 where weekly-priced). */
  method: string;
  inputs: number[];
  scope: "FULL_TABLE" | "HOLIDAY_ONLY" | "MODEL_INPUT";
  /** True when every input is a weekly-derived figure. */
  allDerived: boolean;
  /**
   * PM decision 2026-09-09: distinguishes table-derived ANRs from product-approved
   * model inputs. OBSERVED_DERIVED = arithmetic mean of distinct observed
   * full-buyout nightlies (the canonical ANR method; never ADR).
   * PM_APPROVED_MODEL_INPUT = explicit product input (Trajan $35k, Forza $20k),
   * NOT an observed table average. The model/UI must never present a model input
   * as an observed average.
   */
  provenance: "OBSERVED_DERIVED" | "PM_APPROVED_MODEL_INPUT";
}

export interface Estate24DefaultRate {
  name: string;
  nightly: number;
  currency: string;
  rooms: string;
  minStay: number;
}

export type Estate24RateTableStatus = "FULL" | "HOLIDAY_ONLY" | "DEFAULT_ONLY";

export interface Estate24RateTable {
  status: Estate24RateTableStatus;
  currency: string;
  seasons: Estate24Season[];
  averageNightlyRate: Estate24AverageNightlyRate | null;
  defaultRate: Estate24DefaultRate | null;
  observedAt: string;
  source: string;
}

export interface Estate24ValuationParty {
  /** Single current figure; null when the layer carries a range only. */
  central: number | null;
  range: [number, number] | null;
  provenance: "ESTIMATED";
  confidence?: "MEDIUM" | "HIGH";
  source: string;
  label?: string;
}

export interface Estate24LegacyValue {
  label: string;
  value: number;
  provenance: "CONFLICTED";
  note: string;
}

export interface Estate24Valuation {
  approved: Estate24ValuationParty;
  research: Estate24ValuationParty;
  legacy: Estate24LegacyValue[];
  status: "ADOPT" | "CONFLICTED";
}

export type Estate24TaxKind = "PERCENTAGE" | "FIXED";

/**
 * PM decision 2026-09-09 (tax accounting invariant): how a listing tax/fee
 * relates to villa rental revenue. Only VILLA_COST items may enter operating
 * costs. GUEST_PAID items are charged separately to the guest and stay
 * informational/listing data — they must NOT be deducted from Gross Rental
 * Revenue. UNKNOWN (the default; also when the field is absent on older
 * records) means the collection mechanism is unconfirmed — never guess, never
 * deduct. Requires explicit source confirmation to change.
 */
export type Estate24RevenueTreatment = "VILLA_COST" | "GUEST_PAID" | "UNKNOWN";

export interface Estate24ListingTax {
  /** Exact tax name from the source (VAT, Accommodation Tax, Tourism Tax, ...). Never merged/renamed. */
  name: string;
  kind: Estate24TaxKind;
  value: number;
  currency?: string;
  unit?: string;
  /** OBSERVED = Rental Escapes listing block; ADOPT = PM-adopted (e.g. country rule); absent = unclassified. */
  status?: "OBSERVED" | "ADOPT" | "ESTIMATED" | "UNKNOWN";
  source?: string;
  revenueTreatment?: Estate24RevenueTreatment;
  note?: string;
}

export interface Estate24ListingFee {
  /** Exact fee name from the source (Service Charge, Cleaning Fee, ...). Never merged/renamed. */
  name: string;
  amount: number;
  currency: string;
  unit?: string;
  refundable?: boolean;
  optional?: boolean;
  status?: "OBSERVED" | "ADOPT" | "ESTIMATED" | "UNKNOWN";
  source?: string;
  revenueTreatment?: Estate24RevenueTreatment;
  note?: string;
}

export interface Estate24TaxesListing {
  taxes: Estate24ListingTax[];
  fees: Estate24ListingFee[];
  houseRules: string[];
  observedAt: string;
  source: string;
  note?: string;
}

export interface Estate24ResearchTax {
  name: string;
  /** Null when the jurisdiction rule is variable by category/commune (range in basis). */
  value: number | null;
  unit: string;
  basis: string;
  status: "ESTIMATED";
  source: string;
}

export interface Estate24StayRules {
  checkIn: string | null;
  checkOut: string | null;
  minStayNights: number[] | null;
  policies: string[];
  observedAt: string;
  source: string;
}

export interface Estate24ConflictRecord {
  id: string;
  field: string;
  summary: string;
  treatment: string;
}

export type Estate24ConsolidationStatus =
  | "READY_WITH_GAPS"
  | "CONFLICTED"
  | "REQUIRES_SOURCE";

export interface Estate24Consolidation {
  status: Estate24ConsolidationStatus;
  gaps: string[];
  updatedAt: string;
  evidence: string;
}
