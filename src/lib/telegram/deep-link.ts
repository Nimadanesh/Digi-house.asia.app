// File responsibility: pure Telegram estate deep-link parsers (Slice F §14).
// `startapp=re_<canonical-id>` and the estate-scoped share forms
// (`own_<estateId>_ref_<inviter>` / `coown_<estateId>_ref_<inviter>`) must
// resolve to the correct canonical property. No SDK, no router here — callers
// read start_param and route; this file only maps the raw param to a stable
// canonical `re-<listingId>` id (or null, never a fallback). Legacy `prop-*`
// ids are NOT recognized — canonical ids only.
import { getCanonicalEstate } from "@/lib/economics/estates/canonical-24";
import { SHARE_LINK_PREFIX, type ShareLinkContext } from "@/lib/coown/co-own-link";

/** Shared estate link contexts a recipient can arrive through. */
export type ShareStartParamContext = "estate" | ShareLinkContext;

export interface ShareStartParam {
  /** Canonical `re-<listingId>` id the recipient should land on. */
  estateId: string;
  context: ShareStartParamContext;
  /** Inviter id carried by the link for FUTURE attribution; null when absent. */
  inviterId: string | null;
}

const INVITER_MARKER = "_ref_";

/**
 * Canonicalize a start_param estate slug against the 24 canonical ids.
 * Accepts `re-…` (direct) and `re_…` (BotFather startapp form) with
 * underscores normalized to hyphens. Returns null for anything else.
 */
function resolveCanonicalEstateId(slug: string): string | null {
  let s = slug;
  if (s.startsWith("re_")) s = s.slice("re_".length);
  else if (s.startsWith("re-")) s = s.slice("re-".length);
  else return null;
  if (!s) return null;
  s = s.replace(/_/g, "-");
  const candidate = s.startsWith("re-") ? s : `re-${s}`;
  // Compatibility: resolve only against the 24 canonical ids.
  return getCanonicalEstate(candidate) ? candidate : null;
}

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
  return resolveCanonicalEstateId(head);
}

/**
 * Parse an estate-scoped SHARE start_param — the form a recipient receives from
 * Share Ownership (`own_…`) or Invite to Co-Own (`coown_…`) links, plus the
 * plain estate deep link (`re_…`). Returns the canonical estate id + context,
 * or null when the param is empty/unknown/malformed. Carries the inviter id
 * for future attribution only — never settles anything here, never routes to a
 * generic destination.
 */
export function parseShareStartParam(
  startParam: string | null | undefined,
): ShareStartParam | null {
  if (!startParam) return null;
  const head = startParam.split("~")[0] ?? "";
  if (!head) return null;

  for (const context of ["coown", "ownership"] as const) {
    const prefix = `${SHARE_LINK_PREFIX[context]}_`;
    if (!head.startsWith(prefix)) continue;
    const rest = head.slice(prefix.length);
    const marker = rest.indexOf(INVITER_MARKER);
    const estateSlug = marker >= 0 ? rest.slice(0, marker) : rest;
    const inviterId = marker >= 0 ? rest.slice(marker + INVITER_MARKER.length) : "";
    const estateId = resolveCanonicalEstateId(estateSlug);
    if (!estateId) return null;
    return { estateId, context, inviterId: inviterId || null };
  }

  const estateId = parseEstateStartParam(head);
  return estateId ? { estateId, context: "estate", inviterId: null } : null;
}
