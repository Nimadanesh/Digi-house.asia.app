// File responsibility: pure Telegram estate deep-link parser (Slice F §14).
// `startapp=re_<canonical-id>` must resolve to the correct canonical property.
// No SDK, no router here — callers read start_param and route; this file only
// maps the raw param to a stable canonical `re-<listingId>` id (or null, never
// a fallback). Legacy `prop-*` ids are NOT recognized — canonical ids only.
import { getCanonicalEstate } from "@/lib/economics/estates/canonical-24";

/**
 * Parse a Telegram `start_param` into a canonical marketplace property id.
 * Accepts `re-…` (direct) and `re_…` (BotFather startapp form, underscores or
 * hyphens), with an optional `~utm_…` suffix (I4). Underscores in the slug are
 * normalized to hyphens; a missing `re-` prefix is restored. Returns null
 * for empty / non-estate / unknown ids — never another property. Legacy
 * `prop_*`/`prop-…` params are rejected outright (canonical identity only).
 */
export function parseEstateStartParam(
  startParam: string | null | undefined,
): string | null {
  if (!startParam) return null;
  // I4 utm suffix: `re_<id>~utm_<source>` — the property comes first.
  const head = startParam.split("~")[0] ?? "";
  if (!head) return null;
  let slug = head;
  if (slug.startsWith("re_")) slug = slug.slice("re_".length);
  else if (slug.startsWith("re-")) slug = slug.slice("re-".length);
  else return null;
  if (!slug) return null;
  slug = slug.replace(/_/g, "-");
  const candidate = slug.startsWith("re-") ? slug : `re-${slug}`;
  // Compatibility: resolve only against the 24 canonical ids.
  return getCanonicalEstate(candidate) ? candidate : null;
}
