// File responsibility: verbatim adoption of docs/product/rebuild/ESTATE-24-DATA.json.
// Single source of truth for rich Estate facts. No re-scrape, no re-estimate, no
// derived economics (no ADR/occupancy/revenue/yield invention). Runtime prop-* mapping
// reuses CANONICAL_RECONCILIATION so existing IDs keep working without duplication.
import type { Estate24Record } from "@/types/estate-24-data";
import raw24 from "../../../../docs/product/rebuild/ESTATE-24-DATA.json";
import { CANONICAL_RECONCILIATION } from "./canonical-24";

/** 24 authoritative records, preserved exactly as given in the JSON. */
export const ESTATE_24_DATA: readonly Estate24Record[] = raw24 as Estate24Record[];

/** Lookup by Rental Escapes Listing ID (authoritative JSON key). */
export const ESTATE_24_BY_LISTING_ID: Readonly<Record<string, Estate24Record>> =
  Object.fromEntries(ESTATE_24_DATA.map((e) => [e.listingId, e]));

/** Runtime prop-* → Listing ID, derived from the canonical reconciliation (no copy). */
export const ESTATE_24_RUNTIME_MAP: Readonly<Record<string, string>> = Object.fromEntries(
  CANONICAL_RECONCILIATION.map((r) => [r.propertyId, r.rentalEscapesListingId]),
);

export function getEstate24ByListingId(listingId: string): Estate24Record | undefined {
  return ESTATE_24_BY_LISTING_ID[listingId];
}

export function getEstate24ByRuntimeId(propertyId: string): Estate24Record | undefined {
  const listingId = ESTATE_24_RUNTIME_MAP[propertyId];
  return listingId ? getEstate24ByListingId(listingId) : undefined;
}
