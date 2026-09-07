// File responsibility: PROMPT 03-C canonical display identity for Income +
// Ownership surfaces (presentation data only, no economics).
//
// For the 24 canonical estates, user-visible name/location/image must resolve
// from the adopted ESTATE-24 dataset (name/location) + the R2 canonical layer
// (images), never from legacy Listing fixtures. Unknown/unmapped ids fall back
// to the caller-supplied listing facts (honest) and finally to the id itself —
// never invented data. No amounts, yields, or trading params live here.
import { getCanonicalEstate } from "./canonical-24";
import { getEstate24ByRuntimeId } from "./estate-24-data";

/** Canonical-first display identity (name/location/image) for Income rows. */
export interface EstateDisplayIdentity {
  name: string;
  location: string;
  image?: string;
}

/** Subset accepted as an honest fallback for unknown/unmapped ids. */
export interface EstateIdentityFallback {
  title?: string;
  location?: string;
  images?: string[];
}

/**
 * Resolve display identity for a runtime property id. Canonical ESTATE-24
 * name/location + canonical gallery image win for the 24; otherwise the
 * caller fallback (legacy listing facts for unknown ids); otherwise the id
 * itself with an empty location (honest, never invented).
 */
export function getEstateDisplayIdentity(
  propertyId: string,
  fallback?: EstateIdentityFallback,
): EstateDisplayIdentity {
  const estate24 = getEstate24ByRuntimeId(propertyId);
  const canonical = getCanonicalEstate(propertyId);
  const name = estate24?.name ?? fallback?.title ?? propertyId;
  const location = estate24?.location.full ?? fallback?.location ?? "";
  const image = canonical?.images.urls[0] ?? fallback?.images?.[0];
  return image === undefined ? { name, location } : { name, location, image };
}

/**
 * Resolve a single display name (journey chips, unlock confirm). Canonical
 * ESTATE-24 name wins for the 24; otherwise the caller fallback; otherwise
 * the id itself.
 */
export function getEstateDisplayName(
  propertyId: string,
  fallback?: string,
): string {
  return getEstate24ByRuntimeId(propertyId)?.name ?? fallback ?? propertyId;
}
