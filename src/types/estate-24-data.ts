// File responsibility: exact TypeScript shape of docs/product/rebuild/ESTATE-24-DATA.json.
// Verbatim adoption (PROMPT 02): no re-estimation, no invented fields. Nullable where
// the JSON uses null. Leaf layer: imports nothing.
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
}
