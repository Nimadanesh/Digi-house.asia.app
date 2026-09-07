// File responsibility: R2 canonical marketplace estate types — identity reconciliation
// between the stable runtime `propertyId` (existing `prop-*` fixtures consumed by the
// web runtime), the explicit Rental Escapes listing reference (Source URL + Listing ID
// from `docs/product/rebuild/research/24-PROPERTY-RESEARCH-DATASET.md`), research
// enrichment, and the FractionalLuxe economic layer.
//
// R2 is additive: this file introduces NO runtime behavior change, touches NO existing
// registry, and renames NO identifiers. Money follows the repository convention
// (integer minor units, i.e. cents).
//
// Provenance note: the economic-model `Provenance` (src/types/estate.ts) has no
// "derived"/"conflicted" classes. R2 requires OBSERVED / ESTIMATED / DERIVED /
// CONFLICTED / UNKNOWN, so this layer defines its own `CanonicalProvenance` and
// documents the mapping instead of widening the shared economic type:
//   observed   = directly sourced (Rental Escapes listing or another explicitly named source)
//   estimated  = FractionalLuxe research/model estimate (never presented as observed fact)
//   derived    = calculated from other canonical values (≈ "calculated" in the econ model)
//   conflicted = multiple credible values exist; preserved explicitly, never auto-resolved
//   unknown    = no sufficiently reliable value exists; must remain unknown

/** R2 data-quality class for every canonical marketplace field. */
export type CanonicalProvenance = "observed" | "estimated" | "derived" | "conflicted" | "unknown";

/** Rental-rate semantics verbatim from the research dataset `Rate Type` column. */
export type RentalRateType = "RANGE" | "APPROXIMATE" | "STARTING_FROM" | "DYNAMIC";

/** Research confidence verbatim from the research dataset. */
export type ResearchConfidence = "MEDIUM" | "HIGH";

/**
 * A canonical value that knows where it came from. `source` names the exact
 * origin (e.g. "rental-escapes-listing:128862", "research-dataset",
 * "product-owner-r2-approval", "existing-app-fixture") so provenance is auditable.
 */
export interface CanonicalField<T> {
  value: T;
  provenance: CanonicalProvenance;
  source: string;
}

/** Fractional-trading linkage carried by reference to the existing fixture (not duplicated). */
export interface CanonicalFixtureLink {
  /** Existing runtime `propertyId` — also the canonical record key. */
  propertyId: string;
  totalShares: number;
  sharePriceUsd: number; // minor units, verbatim from the existing fixture
  status: "funding" | "funded" | "resale"; // verbatim from the existing fixture
  provenance: CanonicalProvenance;
  source: string;
}

/**
 * R2 canonical marketplace estate — the single coherent record per marketplace
 * property. Layers are kept structurally separate so observed Rental Escapes facts
 * can never be confused with FractionalLuxe estimates.
 */
export interface CanonicalMarketplaceEstate {
  // -- Identity (Rental Escapes authoritative) --
  /** Stable technical identity: the existing runtime `propertyId`, preserved exactly. */
  propertyId: string;
  rentalEscapesListingId: string;
  rentalEscapesSourceUrl: string;
  name: CanonicalField<string>;
  location: CanonicalField<string>;
  images: {
    urls: string[];
    provenance: CanonicalProvenance;
    source: string;
  };
  // -- Observed listing data (Rental Escapes authoritative) --
  observedRentalRate: {
    /** Display string verbatim from the research dataset (never normalized to ADR here). */
    display: string;
    rateType: RentalRateType;
    provenance: CanonicalProvenance;
    source: string;
  };
  // -- Research enrichment (evidence only, never promoted to observed facts) --
  research: {
    sizeText: CanonicalField<string | null>;
    bedsText: CanonicalField<string | null>;
    bathsText: CanonicalField<string | null>;
    guestsText: CanonicalField<string | null>;
    seasonality: CanonicalField<string | null>;
    /** Verbatim research estimate text (central + 80–120% range), never canonical valuation. */
    estimatedValueText: string;
    estimatedValueProvenance: CanonicalProvenance;
    researchConfidence: ResearchConfidence;
  };
  // -- FractionalLuxe economics (separate layer, explicit provenance) --
  fractionalLuxe: {
    /** Canonical product valuation in minor units; null = UNKNOWN (no estimate given). */
    valuationUsd: CanonicalField<number | null>;
    /** Occupancy assumption as 0..1 fraction; null = UNKNOWN. */
    occupancyRate: CanonicalField<number | null>;
    /** Annual income assumption in minor units; null = UNKNOWN (never derived from rate alone). */
    annualIncomeUsd: CanonicalField<number | null>;
    /** Existing fixture trading params, carried by reference for audit continuity. */
    existingFixture: CanonicalFixtureLink;
  };
  /**
   * Legacy/conflict evidence that must stay visible (e.g. Grand 2 BDM $82M).
   * Null when no legacy conflict is recorded for the property.
   */
  legacyEvidence: {
    note: string;
    provenance: CanonicalProvenance;
  } | null;
  /** "MAPPED" via the explicit Rental Escapes reference; "NEEDS_REVIEW" when unresolvable. */
  reconciliationStatus: "MAPPED" | "NEEDS_REVIEW";
}

/** Machine-readable reconciliation row: propertyId → Rental Escapes Listing ID → estate. */
export interface CanonicalReconciliationRow {
  propertyId: string;
  rentalEscapesListingId: string;
  rentalEscapesSourceUrl: string;
  status: "MAPPED" | "NEEDS_REVIEW";
}
