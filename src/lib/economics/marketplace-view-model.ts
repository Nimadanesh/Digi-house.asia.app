// File responsibility: Slice F marketplace view model — the SOLE bridge from
// Canonical Estate Data + listing trading params to Marketplace UI.
//
// Data flow: Canonical Estate Data → this view model → Marketplace UI.
// Components never hardcode property info, never duplicate the dataset, never
// read legacy `totalValueUsd` (CONFLICTED evidence only — must never render).
//
// - Identity (name/location/images/nightly) = canonical observed Rental Escapes
//   facts, verbatim (fixes fixture shorthand + €-encoding drift).
// - Estate Value = approved canonical ESTIMATED valuation (all 24), never legacy.
// - Trading params (share price/status/funding) = listing facts by reference.
// - Unknown ids fall back to listing identity with null canonical fields so
//   routing/deep-links never crash on an unmapped id.
import type { Provenance } from "@/types/estate";
import type { Listing } from "@/types/property";
import {
  getPresentedCurrentPrice,
  getPresentedMonthlyIncome,
} from "./property-presentation";
import { getCanonicalEstate } from "./estates/canonical-24";
import { getEstate24ByRuntimeId } from "./estates/estate-24-data";
import {
  getGrowthPotential,
  getValuationDisplay,
  type GrowthPotential,
  type ValuationDisplay,
} from "./estates/growth-potential";

export interface MarketplaceEstate {
  /** Stable technical id (existing runtime `prop-*`, preserved exactly). */
  id: string;
  /** Canonical observed name; fallback listing.title for unmapped ids. */
  name: string;
  /** Canonical observed location; fallback listing.location for unmapped ids. */
  location: string;
  /** Canonical short description (search continuity); fallback listing copy for unmapped ids. */
  description: string;
  /**
   * Canonical property type (source-supported, e.g. "Overwater Villa").
   * Null when unknown — never a legacy fixture type ("Apartment"/"Studio"…).
   */
  propertyType: string | null;
  /**
   * Current Estimated Value for DISPLAY (PROMPT 03 §4–§5): Grand 2 BDM is the
   * approved $8M–$10M range; others are their approved single value.
   */
  valuationDisplay: ValuationDisplay | null;
  /**
   * Growth Potential (PROMPT 03 §4–§6): research-range upper, estimated.
   * Grand 2 BDM → $18M, no percentage. Null when the basis is unavailable.
   */
  growthPotential: GrowthPotential | null;
  /** Canonical gallery urls (= fixture images, asserted by R2 tests). */
  images: string[];
  rentalEscapesListingId: string | null;
  rentalEscapesSourceUrl: string | null;
  /** Canonical nightly display verbatim (range/approx/starting-from/dynamic). */
  nightlyDisplay: string | null;
  nightlyRateType: "RANGE" | "APPROXIMATE" | "STARTING_FROM" | "DYNAMIC" | null;
  /**
   * Approved canonical Estate Value (minor units, ESTIMATED/MODELED).
   * Null only when no canonical record exists — render pending, never legacy.
   */
  estateValue: { value: number; provenance: Provenance } | null;
  status: Listing["status"];
  sharePriceUsd: number;
  /** Single-source current price (primary offer / last-trade fallback). */
  currentPriceUsd: number;
  totalShares: number;
  sharesSold: number;
  sharesRemaining: number;
  fundingProgressRatio: number;
  createdAt: string;
  /**
   * Presented monthly income per share, minor units (Slice 2 single presentation
   * layer = V1). Null = UNKNOWN → callers render pending, never 0.
   */
  presentedMonthlyIncomeCents: number | null;
}

export function toMarketplaceEstate(listing: Listing): MarketplaceEstate {
  const canonical = getCanonicalEstate(listing.id);
  const valuation = canonical?.fractionalLuxe.valuationUsd;
  // PROMPT 03 canonical property facts: the adopted Estate24 record is the
  // authoritative source for description and property type. Absent values stay
  // null (render pending) — never legacy fixture copy ("Apartment" for villas…).
  // Unknown ids keep the listing fallback so routing/deep-links never crash.
  const estate24 = getEstate24ByRuntimeId(listing.id) ?? null;
  return {
    id: listing.id,
    name: canonical?.name.value ?? listing.title,
    location: canonical?.location.value ?? listing.location,
    description: estate24?.description.short ?? listing.description,
    propertyType: estate24?.propertyType ?? null,
    valuationDisplay: getValuationDisplay(listing.id),
    growthPotential: getGrowthPotential(listing.id),
    images: canonical?.images.urls ?? listing.images,
    rentalEscapesListingId: canonical?.rentalEscapesListingId ?? null,
    rentalEscapesSourceUrl: canonical?.rentalEscapesSourceUrl ?? null,
    nightlyDisplay:
      canonical?.observedRentalRate.display ?? listing.nightlyRate ?? null,
    nightlyRateType: canonical?.observedRentalRate.rateType ?? null,
    estateValue:
      valuation?.value != null && valuation.provenance === "estimated"
        ? { value: valuation.value, provenance: "estimated" }
        : null,
    status: listing.status,
    sharePriceUsd: listing.sharePriceUsd,
    currentPriceUsd: getPresentedCurrentPrice(listing),
    totalShares: listing.totalShares,
    sharesSold: listing.sharesSold,
    sharesRemaining: listing.sharesRemaining,
    fundingProgressRatio: listing.fundingProgressRatio,
    createdAt: listing.createdAt,
    presentedMonthlyIncomeCents: getPresentedMonthlyIncome(listing.id).cents,
  };
}

export function toMarketplaceEstates(listings: Listing[]): MarketplaceEstate[] {
  return listings.map(toMarketplaceEstate);
}

/** True when the id is one of the 24 canonical marketplace properties. */
export function isCanonicalMarketplaceId(propertyId: string): boolean {
  return getCanonicalEstate(propertyId) !== undefined;
}
