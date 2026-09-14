// File responsibility: mock-boundary canonicalization (Final PO Decisions 1, 2, 6).
//
// This is the ONE place where fixture `Listing`s become user-facing listings:
// identity (name/location/images/nightly/description/propertyType) comes from the
// canonical Tier-1/2 records, supply + price from the canonical V1 offering
// (valuation ÷ $100, $100 base). Sold/remaining/progress have no canonical source
// and are derived from the LIVE demo ownership ledger (mock holdings) — real
// demo-ledger facts under the global DEMO disclosure, never fixture canon.
// The seeded best-ask snapshot (same ORDER_BOOKS the live book serves) rides along
// so book-less surfaces agree with book-fed ones (Slice 2 presentation layer).
//
// Mapping (new objects) — the fixture seed is never mutated, so isolated tests
// importing PROPERTIES keep fixture values while the product sees canonical ones.
// Unknown/unmapped ids pass through untouched (honest fallback, never for the 24).
import type { Listing } from "@/types/property";
import { getCanonicalOffering } from "@/lib/economics/canonical-offering";
import { getCanonicalEstate } from "@/lib/economics/estates/canonical-24";
import { getEstate24ByRuntimeId } from "@/lib/economics/estates/estate-24-data";
import { HOLDINGS } from "./seed/holdings";
import { ORDER_BOOKS } from "./seed/orderbooks";
import { PROPERTIES } from "./seed/properties";

/** Demo-ledger sold shares for a property (live holdings, mutated by buys/sells). */
export function demoSoldShares(propertyId: string): number {
  return HOLDINGS.filter((h) => h.propertyId === propertyId)
    .reduce((sum, h) => sum + h.sharesOwned, 0);
}

/**
 * Canonicalize one fixture listing for user-facing use. Pure mapping except for
 * reading the live demo holdings ledger (sold counts).
 */
export function toCanonicalListing(p: Listing): Listing {
  const offering = getCanonicalOffering(p.id);
  if (offering == null) return p;
  const estate24 = getEstate24ByRuntimeId(p.id);
  const canonical = getCanonicalEstate(p.id);
  const totalShares = offering.totalShares;
  const sold = demoSoldShares(p.id);
  const remaining = Math.max(0, totalShares - sold);
  return {
    ...p,
    // Tier-1 identity (verbatim canonical records; fixture fallback impossible here
    // since the offering exists only for mapped ids, but guarded regardless).
    title: estate24?.name ?? p.title,
    location: estate24?.location.full ?? p.location,
    description: estate24?.description.short ?? p.description,
    images: canonical?.images.urls ?? p.images,
    nightlyRate: canonical?.observedRentalRate.display ?? p.nightlyRate,
    meta: {
      ...p.meta,
      propertyType: estate24?.propertyType ?? p.meta.propertyType,
    },
    // Tier-2 canonical supply + base price (V1 model — never fixture values).
    totalShares,
    sharePriceUsd: offering.basePriceUsd,
    // No canonical sales ledger exists: sold/remaining/progress are the live demo
    // ownership ledger (real demo facts, DEMO-disclosed) — never fixture canon.
    sharesSold: sold,
    sharesRemaining: remaining,
    fundingProgressRatio: totalShares > 0 ? sold / totalShares : 0,
    // Canonical valuation replaces the quarantined legacy totalValueUsd figure.
    totalValueUsd: offering.valuationCents,
    // Seeded best-ask snapshot (Slice 2 presentation layer): the same ORDER_BOOKS
    // the live order-book repo serves, so book-less surfaces (marketplace cards)
    // agree with book-fed surfaces (detail). Null on funding listings (no book).
    bestAskUsd:
      ORDER_BOOKS.find((b) => b.propertyId === p.id)?.bestAskUsd ?? null,
    // Demo product-model parameters (explicitly disclosed projections, NOT
    // canonical facts): yield rate, rent basis, secondary-demo tape, scenario
    // state. Untouched here — see PRODUCT-DECISION-LOCK.md §6.
  };
}

/** Canonicalized lookup by id (unknown ids fall back to the fixture record). */
export function getCanonicalListing(propertyId: string): Listing | undefined {
  const found = PROPERTIES.find((p) => p.id === propertyId);
  return found ? toCanonicalListing(found) : undefined;
}
