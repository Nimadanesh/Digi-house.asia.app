// File responsibility: Fifi brand-identity mirror for the DecisionEngine (FIFI-06).
// The canonical source of truth is rag/brand.json. This module carries the
// brand-neutral internal identity plus legacy aliases needed for routing
// (e.g. recognizing a legacy-name question as migration context). A test asserts
// this mirror stays in sync with rag/brand.json. Display-brand literals are banned
// from routing logic — grep must show none here outside this mirror list.

import { PLATFORM_ID } from "./decision-types";

export { PLATFORM_ID };

/** Internal product identity used by routing. Stable across renames. */
export const INTERNAL_PRODUCT_ID = PLATFORM_ID;

/**
 * Legacy brand aliases. Recognized ONLY as historical/migration context
 * (e.g. "What was DigiHouse?"). Never a current identity, never authority.
 * Must equal rag/brand.json legacyAliases (enforced by test).
 */
export const LEGACY_BRAND_ALIASES: readonly string[] = ["DigiHouse", "دیجی‌هاوس"];

/**
 * Display brand names, mirrored from rag/brand.json (test-enforced sync).
 * Used ONLY for data-driven recognition (e.g. "what is <brand>?" → product
 * overview). Routing logic never hard-codes these strings.
 */
export const DISPLAY_NAMES: readonly string[] = ["FractionalLuxe", "فرکشنال‌لوکس"];

/** True when the message is about a legacy brand name (migration context). */
export function mentionsLegacyBrand(message: string): boolean {
  const lower = message.toLowerCase();
  return LEGACY_BRAND_ALIASES.some((alias) => lower.includes(alias.toLowerCase()));
}

/** True when the message names the current display brand (product-identity question). */
export function mentionsDisplayBrand(message: string): boolean {
  const lower = message.toLowerCase();
  return DISPLAY_NAMES.some((name) => lower.includes(name.toLowerCase()));
}
