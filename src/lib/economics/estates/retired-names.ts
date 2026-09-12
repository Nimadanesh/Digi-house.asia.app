// File responsibility: retired (pre-canonical) estate display names and their old
// URL slugs, keyed by canonical property id — identity-regression data ONLY.
//
// Before canonicalization the 24 marketplace estates carried old technical
// `prop-*` ids and old display names (e.g. re-108924 was "Bayside Marina
// Penthouse"). This table records those retired strings so tests can assert they
// never reappear on any canonical surface. Nothing here may map back to a
// canonical id: no runtime code may import this file — only tests do.
export interface RetiredIdentity {
  /** Old display name (must never render again). */
  name: string;
  /** Slug of the old technical prop-* id (must never appear in a URL again). */
  slug: string;
}

export const RETIRED_ESTATE_NAMES: Readonly<Record<string, RetiredIdentity>> = {
  "re-128862": { name: "Marina Vista Apt 4B", slug: "marina-vista-4b" },
  "re-126855": { name: "The Aerial Loft", slug: "soho-loft-studio" },
  "re-108924": { name: "Bayside Marina Penthouse", slug: "bayside-marina-penthouse" },
  "re-123861": { name: "Alfama Terrace Flat", slug: "alfama-terrace-flat" },
  "re-125643": { name: "Tbilisi Riverhouse Loft", slug: "tbilisi-riverhouse-loft" },
  "re-130393": { name: "Canggu Surf Villa", slug: "canggu-surf-villa" },
  "re-130901": { name: "Tokyo Shibuya Studio", slug: "tokyo-shibuya-studio" },
  "re-131293": { name: "Brooklyn Brownstone Flat", slug: "brooklyn-brownstone-flat" },
  "re-128529": { name: "Berlin Mitte Apartment", slug: "berlin-mitte-apartment" },
  "re-123320": { name: "Barcelona Eixample Flat", slug: "barcelona-eixample-flat" },
  "re-109098": { name: "London Camden Loft", slug: "london-camden-loft" },
  "re-127825": { name: "Sydney Harbour Apartment", slug: "sydney-harbour-apartment" },
  "re-122422": { name: "Toronto Condo", slug: "toronto-condo" },
  "re-129548": { name: "Melbourne Loft", slug: "melbourne-loft" },
  "re-122903": { name: "Miami Beach Condo", slug: "miami-beach-condo" },
  "re-126870": { name: "Istanbul Bosphorus Flat", slug: "istanbul-bosphorus-flat" },
  "re-130397": { name: "Mexico City Penthouse", slug: "mexico-city-penthouse" },
  "re-127483": { name: "Kyoto Machiya", slug: "kyoto-machiya" },
  "re-108856": { name: "Cape Town Villa", slug: "cape-town-villa" },
  "re-108860": { name: "Bangkok Sukhumvit Condo", slug: "bangkok-sukhumvit-condo" },
  "re-106441": { name: "Amsterdam Canal House", slug: "amsterdam-canal-house" },
  "re-129549": { name: "Buenos Aires Recoleta Flat", slug: "buenos-aires-recoleta-flat" },
  "re-123919": { name: "Seoul Gangnam Studio", slug: "seoul-gangnam-studio" },
  "re-122113": { name: "NYC Chelsea Loft", slug: "nyc-chelsea-loft" },
};
