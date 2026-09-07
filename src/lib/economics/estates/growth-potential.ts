// File responsibility: PROMPT 03 Growth Potential — the investment-story valuation
// concept for the Estate experience (ESTATE-DATA-EXECUTION-PROMPTS.md §4–§6).
//
// Two distinct valuation concepts (never mixed):
//   - Current Estimated Value — the currently approved FractionalLuxe valuation.
//     A single numeric value for 23 estates; an explicit $8M–$10M RANGE for
//     Grand 2 BDM (so no Growth Potential percentage is ever derived for Grand).
//   - Growth Potential — the upper end of the researched valuation range that the
//     Estate may potentially reach. Estimated/research-derived, never a forecast,
//     guaranteed return, promised appreciation, market prediction, or advice.
//
// Growth Potential is a valuation concept only. It must NOT be mixed with rental
// income, paid/projected/accrued income, or secondary-market gain.
//
// Data discipline (no invention):
//   - Current values come ONLY from the approved canonical layer (canonical-24).
//   - Research ranges come ONLY from the adopted ESTATE-24-DATA.json (verbatim).
//   - The legacy $82M figure is never admitted (kept CONFLICTED evidence only).
//   - The Grand $13.5M research central stays research evidence, never current.
//   - Missing current or missing research range → null (never a fabricated value).
//   - Percentage only when the basis is unambiguous: single current + range.
//     Formula: (Potential − Current) / Current × 100, labeled Estimated Growth
//     Potential — never "Return", "ROI", "Profit", or "Expected Return".
//
// This module is presentation data only. It touches no economic engine, no
// formula, no buy/sell/settlement logic. Money: integer minor units (cents).

import type { Provenance } from "@/types/estate";
import { usd, usdCompact } from "@/lib/format";
import { getCanonicalEstate } from "./canonical-24";
import { getEstate24ByRuntimeId } from "./estate-24-data";

/** Runtime listing id whose current valuation is the approved $8M–$10M band. */
export const GRAND_2_BDM_RUNTIME_ID = "prop-marina-vista-4b";

/** Approved Grand 2 BDM Current Estimated Value band, minor units. */
export const GRAND_CURRENT_MIN_CENTS = 800_000_000; // $8M
export const GRAND_CURRENT_MAX_CENTS = 1_000_000_000; // $10M

/** Grand 2 BDM Growth Potential upper value = research range upper, minor units. */
export const GRAND_POTENTIAL_CENTS = 1_800_000_000; // $18M

/** Grand 2 BDM research evidence (provenance only — never the current value). */
export const GRAND_RESEARCH_MIN_CENTS = 960_000_000; // $9.6M
export const GRAND_RESEARCH_MAX_CENTS = 1_800_000_000; // $18M
export const GRAND_RESEARCH_CENTRAL_CENTS = 1_350_000_000; // $13.5M

/** Legacy conflict figure — must never enter any valuation surface. */
export const LEGACY_82M_CENTS = 8_200_000_000; // $82M

export interface ValuationDisplaySingle {
  kind: "single";
  value: number;
  provenance: Provenance;
}

export interface ValuationDisplayRange {
  kind: "range";
  min: number;
  max: number;
  provenance: Provenance;
}

/** Current Estimated Value for display: single, or a range (Grand 2 BDM only). */
export type ValuationDisplay = ValuationDisplaySingle | ValuationDisplayRange;

export interface GrowthPotential {
  /** Upper end of the researched valuation range, minor units. */
  potentialValue: number;
  /**
   * Estimated growth percentage ((potential − current) / current × 100),
   * rounded to one decimal. Null when the basis is a range (Grand) or when
   * either value is unavailable — never derived from an invented current.
   */
  potentialPct: number | null;
  /** Always "estimated": growth potential is estimated/research-derived. */
  provenance: Provenance;
  /** Research valuation range evidence, minor units (provenance, not a price). */
  researchRange: { min: number; max: number } | null;
}

/**
 * Current Estimated Value for a runtime estate. Grand 2 BDM resolves to the
 * approved $8M–$10M range; other canonical estates resolve to their approved
 * single ESTIMATED value; unknown ids resolve to null (never legacy/invented).
 */
export function getValuationDisplay(propertyId: string): ValuationDisplay | null {
  if (propertyId === GRAND_2_BDM_RUNTIME_ID) {
    return {
      kind: "range",
      min: GRAND_CURRENT_MIN_CENTS,
      max: GRAND_CURRENT_MAX_CENTS,
      provenance: "estimated",
    };
  }
  const canonical = getCanonicalEstate(propertyId);
  const valuation = canonical?.fractionalLuxe.valuationUsd;
  if (valuation?.value == null || valuation.provenance !== "estimated") return null;
  if (valuation.value === LEGACY_82M_CENTS) return null;
  return { kind: "single", value: valuation.value, provenance: "estimated" };
}

/**
 * Growth Potential for a runtime estate, or null when it cannot be honestly
 * derived (no canonical current, no research range, or legacy conflict).
 * Grand 2 BDM: $18M potential, no percentage (current is a range).
 */
export function getGrowthPotential(propertyId: string): GrowthPotential | null {
  if (propertyId === GRAND_2_BDM_RUNTIME_ID) {
    return {
      potentialValue: GRAND_POTENTIAL_CENTS,
      potentialPct: null,
      provenance: "estimated",
      researchRange: { min: GRAND_RESEARCH_MIN_CENTS, max: GRAND_RESEARCH_MAX_CENTS },
    };
  }
  const canonical = getCanonicalEstate(propertyId);
  const current = canonical?.fractionalLuxe.valuationUsd;
  if (current?.value == null || current.provenance !== "estimated") return null;
  if (current.value === LEGACY_82M_CENTS || current.value <= 0) return null;
  const record = getEstate24ByRuntimeId(propertyId);
  const range = record?.estimates.valueRange;
  if (!range || range[1] == null || range[1] <= 0) return null;
  // ESTATE-24-DATA.json values are whole dollars; canonical layer is cents.
  const researchMin = Math.round(range[0] * 100);
  const researchMax = Math.round(range[1] * 100);
  const potentialPct = Math.round(((researchMax - current.value) / current.value) * 1000) / 10;
  return {
    potentialValue: researchMax,
    potentialPct,
    provenance: "estimated",
    researchRange: { min: researchMin, max: researchMax },
  };
}

/** Full valuation display, e.g. "$8,000,000.00–$10,000,000.00" or "$20,000,000.00". */
export function formatValuationDisplay(display: ValuationDisplay): string {
  return display.kind === "range"
    ? `${usd(display.min)}–${usd(display.max)}`
    : usd(display.value);
}

/** Compact valuation display for cards/chips, e.g. "$8M–$10M" or "$20M". */
export function formatValuationDisplayCompact(display: ValuationDisplay): string {
  return display.kind === "range"
    ? `${usdCompact(display.min)}–${usdCompact(display.max)}`
    : usdCompact(display.value);
}

/** Growth percentage display, e.g. "+32%". Null in → null out (never invented). */
export function formatGrowthPct(pct: number | null): string | null {
  if (pct == null || !Number.isFinite(pct)) return null;
  const rounded = Math.round(pct * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return `+${text}%`;
}
