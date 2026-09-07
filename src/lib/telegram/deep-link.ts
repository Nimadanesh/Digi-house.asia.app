// File responsibility: pure Telegram estate deep-link parser (Slice F §14).
// `startapp=prop_<stable-id>` must resolve to the correct canonical property.
// No SDK, no router here — callers read start_param and route; this file only
// maps the raw param to a stable `prop-*` id (or null, never a fallback).
import { getCanonicalEstate } from "@/lib/economics/estates/canonical-24";

/**
 * Parse a Telegram `start_param` into a canonical marketplace property id.
 * Accepts `prop-…` (direct), `prop_…` (BotFather startapp form, underscores or
 * hyphens), with an optional `~utm_…` suffix (I4). Underscores in the slug are
 * normalized to hyphens; a missing `prop-` prefix is restored. Returns null
 * for empty / non-estate / unknown ids — never another property.
 */
export function parseEstateStartParam(
  startParam: string | null | undefined,
): string | null {
  if (!startParam) return null;
  // I4 utm suffix: `prop_<id>~utm_<source>` — the property comes first.
  const head = startParam.split("~")[0] ?? "";
  if (!head) return null;
  let slug = head;
  if (slug.startsWith("prop_")) slug = slug.slice("prop_".length);
  else if (slug.startsWith("prop-")) slug = slug.slice("prop-".length);
  else return null;
  if (!slug) return null;
  slug = slug.replace(/_/g, "-");
  const candidate = slug.startsWith("prop-") ? slug : `prop-${slug}`;
  // Compatibility: resolve only against the 24 canonical ids.
  return getCanonicalEstate(candidate) ? candidate : null;
}
