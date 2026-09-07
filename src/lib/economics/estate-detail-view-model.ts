// File responsibility: Slice E view-model — assemble canonical engine outputs into
// Estate Detail section props. ONE responsibility: Listing (+ order-book asks +
// position) → { canonical Estate?, scenario economics, share overview, CTA kind }.
//
// This is the ONLY place on the Estate Detail route that touches the engines.
// Components receive engine outputs as props and format them; they never import an
// engine or re-derive a tax/net/share figure (auditable by import direction).
//
// Honesty rules encoded:
// - A canonical `Estate` exists only where product-configured inputs exist. Slice A
//   ships exactly one (Grand 2 BDM); every other listing resolves to null and its
//   economics sections render Unknown — never bridged from legacy display figures.
// - Share config comes from explicit listing facts only (totalShares, sharePriceUsd
//   on primary, sharesRemaining). No nearly-sold-out threshold is configured
//   (product decision pending) — the engine then reports nearlySoldOutKnown: false.
// - Secondary listings are verbatim order-book ask levels (price + quantity); the
//   engine's no-invention price rules apply unchanged.
// - The canonical Estate object is never mutated (engine immutability).

import { ESTATE_COST_RATES, type Estate, type EstateCostLine, type Provenance } from "@/types/estate";
import type { Estate24Record } from "@/types/estate-24-data";
import type { OrderBookLevel } from "@/types/order";
import type { Listing } from "@/types/property";
import type { ScenarioEnvelopeResult, ScenarioResult } from "@/types/estate-scenario";
import type { EstateShareOverview, EstateUserPosition } from "@/types/estate-share";
import { getCanonicalEstate } from "./estates/canonical-24";
import { getEstate24ByRuntimeId } from "./estates/estate-24-data";
import {
  getGrowthPotential,
  getValuationDisplay,
  type GrowthPotential,
  type ValuationDisplay,
} from "./estates/growth-potential";
import { GRAND_2_BDM_OCEAN_POOL_VILLA } from "./estates/grand-2-bdm-ocean-pool-villa";
import {
  evaluateBaselineScenario,
  evaluateOccupancyEnvelope,
} from "./scenario-engine";
import { estateShareOverview } from "../estate-share-model";

/** CTA intent derived from the ShareModel market state (+ ownership). */
export type EstateDetailCtaKind = "manage" | "buyPrimary" | "buySecondary" | "viewResale";

/**
 * Pending cost structure for listings without engine economics (all-24
 * consistency). The six canonical lines in engine order, all flagged unknown
 * with zeroed amounts — the engine's own unknown convention — so the Cost
 * section renders the same structure with honest pending states. Rate bases
 * come from the shared product table; no arithmetic happens here.
 */
function pendingCostLines(): EstateCostLine[] {
  const defs: Array<Pick<EstateCostLine, "id" | "basis" | "rate">> = [
    { id: "tourismTax", basis: "grossAnnualRevenue", rate: ESTATE_COST_RATES.tourismTax },
    { id: "serviceCharge", basis: "grossAnnualRevenue", rate: ESTATE_COST_RATES.serviceCharge },
    { id: "agencyRentalOta", basis: "grossAnnualRevenue", rate: ESTATE_COST_RATES.agencyRentalOta },
    { id: "operatorOperating", basis: "grossAnnualRevenue", rate: ESTATE_COST_RATES.operatorOperating },
    { id: "greenTax", basis: "guestNights", rate: ESTATE_COST_RATES.greenTaxPerGuestPerNight },
    {
      id: "repairInsuranceMaintenance",
      basis: "propertyValue",
      rate: ESTATE_COST_RATES.repairInsuranceMaintenance,
    },
  ];
  return defs.map((line) => ({ ...line, amountUsd: 0, unknown: true as const }));
}

/** Runtime listing id whose canonical estate is the Grand 2 BDM seed. */
export const GRAND_2_BDM_LISTING_ID = "prop-marina-vista-4b";

/**
 * Canonical estate for a runtime listing, or null when no product-configured
 * estate exists. Grows slice by slice as canonical estates land; never guesses.
 */
export function resolveCanonicalEstateForListing(listingId: string): Estate | null {
  if (listingId === GRAND_2_BDM_LISTING_ID) return GRAND_2_BDM_OCEAN_POOL_VILLA;
  return null;
}

/** Scenario selector bound (UI state only — never written back to the estate). */
export type ScenarioBound = "base" | "lower" | "upper";

/** One selected scenario evaluation, shaped for section props (outputs only). */
export interface SelectedScenario {
  bound: ScenarioBound;
  result: ScenarioResult;
  adrProvenance: Provenance;
  /** Occupancy as a 0..1 fraction for the selected bound. */
  occupancyValue: number;
  occupancyProvenance: Provenance;
}

/**
 * Select one scenario evaluation for presentation. Base uses the estate's
 * configured baseline; bounds use the envelope evaluations (never averaged).
 * Null when no canonical estate exists — sections then render Unknown.
 */
export function selectScenarioEconomics(
  vm: EstateDetailViewModel,
  bound: ScenarioBound,
): SelectedScenario | null {
  if (vm.estate == null || vm.baseline == null || vm.envelope == null) return null;
  if (bound === "base") {
    return {
      bound,
      result: vm.baseline,
      adrProvenance: vm.estate.baselineScenario.adrUsd.provenance,
      occupancyValue: vm.estate.baselineScenario.occupancyRate,
      occupancyProvenance: vm.estate.asset.occupancyRateMin.provenance,
    };
  }
  const result = bound === "lower" ? vm.envelope.lower : vm.envelope.upper;
  return {
    bound,
    result,
    adrProvenance: vm.estate.baselineScenario.adrUsd.provenance,
    occupancyValue: result.resolution.occupancyRate.value,
    // Matches the engine's explicit bound-input provenance (never averaged).
    occupancyProvenance: "estimated",
  };
}

export interface EstateDetailViewModel {
  /** Canonical estate when configured; null → economics sections show Unknown. */
  estate: Estate | null;
  economicsAvailable: boolean;
  /**
   * Adopted canonical Estate24 record (PROMPT 02 verbatim dataset) — the
   * authoritative source for user-visible PROPERTY FACTS (identity, specs,
   * description, rates, taxes/fees, amenities, services, research metadata).
   * Null only when no canonical record exists (never a legacy fixture).
   */
  estate24: Estate24Record | null;
  /**
   * Canonical user-visible identity from the Estate24 record. Components must
   * prefer this over legacy fixture title/location; null only without a
   * canonical record (callers then fall back for unknown ids, never for the 24).
   */
  identity: {
    name: string;
    location: string;
    propertyType: string;
    slug: string;
    listingId: string;
    sourceUrl: string;
  } | null;
  /** Canonical property type (source-supported); null when unknown (never a legacy fixture type). */
  propertyType: string | null;
  /** Canonical short description; null without a canonical record (never invented). */
  descriptionShort: string | null;
  /** Canonical full description; null without a canonical record (never invented). */
  descriptionFull: string | null;
  /**
   * Current Estimated Value for DISPLAY (PROMPT 03 §4–§5): Grand 2 BDM resolves
   * to the approved $8M–$10M range; other canonical estates to their approved
   * single value. Null only without a canonical record (never legacy/invented).
   */
  valuationDisplay: ValuationDisplay | null;
  /**
   * Growth Potential (PROMPT 03 §4–§6): the upper end of the researched
   * valuation range (estimated/research-derived, never a forecast or promise).
   * Grand 2 BDM → $18M with NO percentage (current is a range). Null when the
   * basis is unavailable. Never mixed with rental/income/market figures.
   */
  growthPotential: GrowthPotential | null;
  /** Canonical nightly range in minor units; null when no canonical estate. */
  nightlyRangeCents: { min: number; max: number } | null;
  /**
   * Approved canonical valuation (minor units, ESTIMATED/MODELED) — sourced
   * from the R2 canonical layer for all 24 estates. Null only when no
   * canonical record exists (never a legacy or invented figure).
   */
  valuation: { value: number; provenance: Provenance } | null;
  /**
   * Approved descriptive copy (research seasonality/qualitative notes).
   * Null only when no canonical record exists.
   */
  aboutText: string | null;
  /**
   * Approved physical size text, verbatim (units included, e.g. "382 m² total").
   * Null when the dataset records UNKNOWN — render pending, never a fixture number.
   */
  sizeText: string | null;
  /**
   * Approved nightly display text with source rate semantics intact
   * (range/approximate/starting-from/dynamic verbatim). Null only when no
   * canonical record exists.
   */
  nightlyDisplayText: string | null;
  /**
   * Official Rental Escapes listing URL, verbatim from the canonical record.
   * Null only when no canonical record exists — callers render no CTA rather
   * than a fabricated fallback URL.
   */
  rentalEscapesUrl: string | null;
  /** Base scenario evaluation; null when no canonical estate. */
  baseline: ScenarioResult | null;
  /** Occupancy envelope (lower/upper bounds); null when no canonical estate. */
  envelope: ScenarioEnvelopeResult | null;
  /**
   * Pending cost structure (six unknown lines, engine order) for listings
   * without engine economics; null when the engine provides cost lines.
   * Amounts are zeroed per the engine's unknown convention — never displayed.
   */
  pendingCosts: EstateCostLine[] | null;
  /** Full share overview (config + structure + state + secondary price). */
  share: EstateShareOverview;
  /** CTA intent following the ShareModel market state. */
  ctaKind: EstateDetailCtaKind;
}

export function buildEstateDetailViewModel(
  listing: Listing,
  ctx: {
    /** Verbatim ask levels from the order book (empty when none). */
    asks?: OrderBookLevel[];
    sharesOwned?: number;
    /** Per-share average cost (repo Holding convention); null when unknown. */
    acquisitionPricePerShareUsd?: number | null;
  } = {},
): EstateDetailViewModel {
  const estate = resolveCanonicalEstateForListing(listing.id);
  const isPrimary = listing.status === "funding";

  // Approved canonical record fields (identity/enrichment layer, all 24).
  // Only explicitly sourced canonical figures are admitted — anything else
  // stays null (render pending) rather than promoting research text beyond its
  // provenance or legacy mock figures.
  const canonicalRecord = getCanonicalEstate(listing.id);
  const canonicalValuation = canonicalRecord?.fractionalLuxe.valuationUsd;
  const valuation =
    canonicalValuation?.value != null && canonicalValuation.provenance === "estimated"
      ? { value: canonicalValuation.value, provenance: "estimated" as Provenance }
      : null;
  // PROMPT 03 canonical property facts: the adopted Estate24 record is the
  // authoritative source for identity, type, description, and valuation story.
  // Anything absent stays null (render pending) — never a legacy fixture fact.
  const estate24 = getEstate24ByRuntimeId(listing.id) ?? null;
  const identity = estate24
    ? {
        name: estate24.name,
        location: estate24.location.full,
        propertyType: estate24.propertyType,
        slug: estate24.slug,
        listingId: estate24.listingId,
        sourceUrl: estate24.sourceUrl,
      }
    : null;
  const aboutText = canonicalRecord?.research.seasonality.value ?? null;
  const sizeText = canonicalRecord?.research.sizeText.value ?? null;
  const nightlyDisplayText = canonicalRecord?.observedRentalRate.display ?? null;
  const rentalEscapesUrl = canonicalRecord?.rentalEscapesSourceUrl ?? null;

  const baseline = estate ? evaluateBaselineScenario(estate, { label: "Base" }) : null;
  const envelope = estate ? evaluateOccupancyEnvelope(estate) : null;

  const position: EstateUserPosition = {
    sharesOwned: ctx.sharesOwned ?? 0,
    acquisitionPricePerShareUsd: ctx.acquisitionPricePerShareUsd ?? null,
  };
  const share = estateShareOverview(
    {
      estateId: listing.id,
      currency: "USD",
      estateValue: valuation ? { ...valuation } : null,
      totalShares: listing.totalShares,
      // Primary price exists only while the primary offering is open.
      primarySharePrice: isPrimary ? listing.sharePriceUsd : null,
      primarySharesAvailable: isPrimary ? Math.max(0, listing.sharesRemaining) : 0,
      // nearlySoldOutThreshold intentionally absent (product decision pending).
    },
    position,
    (ctx.asks ?? [])
      .filter((a) => a.quantity > 0)
      .map((a, i) => ({
        id: `${listing.id}-ask-${i}`,
        sellerRef: "orderbook",
        pricePerShareUsd: a.priceUsd,
        quantity: a.quantity,
        status: "active" as const,
      })),
  );

  let ctaKind: EstateDetailCtaKind;
  if (share.state.userOwnsShares) {
    ctaKind = "manage";
  } else if (
    share.state.market === "primaryAvailable" ||
    share.state.market === "primaryNearlySoldOut"
  ) {
    ctaKind = "buyPrimary";
  } else if (share.state.market === "secondaryAvailable") {
    ctaKind = "buySecondary";
  } else {
    ctaKind = "viewResale";
  }

  return {
    estate,
    economicsAvailable: baseline != null,
    estate24,
    identity,
    propertyType: estate24?.propertyType ?? null,
    descriptionShort: estate24?.description.short ?? null,
    descriptionFull: estate24?.description.full ?? null,
    valuationDisplay: getValuationDisplay(listing.id),
    growthPotential: getGrowthPotential(listing.id),
    nightlyRangeCents: estate
      ? { min: estate.asset.nightlyRateMin.value, max: estate.asset.nightlyRateMax.value }
      : null,
    valuation,
    aboutText,
    sizeText,
    nightlyDisplayText,
    rentalEscapesUrl,
    baseline,
    envelope,
    pendingCosts: baseline ? null : pendingCostLines(),
    share,
    ctaKind,
  };
}
