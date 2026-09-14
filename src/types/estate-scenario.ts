// File responsibility: canonical Scenario Engine types (Phase 9 Rebuild Slice B).
// Sits between the EconomicModel (Slice A) and the future View/UI layers.
//
// Non-negotiable rules this file encodes (Slice B contract):
// - ScenarioEngine is an ORCHESTRATION layer. The EconomicModel remains the SINGLE
//   SOURCE OF TRUTH for every economic formula; this layer introduces NO arithmetic.
// - Scenario inputs are operating ASSUMPTIONS for one evaluation — never historical
//   observations, never paid/accrued/realized facts.
// - Omitted inputs are INHERITED from the canonical Estate; provided inputs override
//   for that evaluation only. The Estate is never mutated.
// - A range is not a point: envelope evaluations keep the explicit lower/upper bounds
//   distinct and never collapse them to a midpoint.
// - Every ScenarioResult carries the EconomicModel's own output object (composition,
//   not duplicated fields), so the reconciliation artifact and provenance survive
//   verbatim and can never diverge from the economics they describe.

import type {
  EstateCurrency,
  EstateEconomics,
  EstateScenario,
  Provenance,
} from "./estate";

// ---------------------------------------------------------------------------
// Scenario input model
// ---------------------------------------------------------------------------

/**
 * A scenario-capable value with explicit provenance class. Reuses Slice A's
 * `Provenance` (no second enum). Scenario-supplied assumptions are expected to be
 * `estimated` (a model assumption) — never `observed` (they are not measurements),
 * never `paid`-adjacent vocabulary (which does not exist in Slice A's provenance).
 */
export interface ScenarioValue<T = number> {
  value: T;
  provenance: Provenance;
}

/**
 * One evaluation's operating assumptions. Every field is OPTIONAL:
 * - omitted  → inherited from the canonical Estate (occupancy/ADR/guests from
 *   `baselineScenario`; occupancy bounds / nightly range / property value from `asset`);
 * - provided → overrides ONLY this evaluation. Nothing is written back.
 */
export interface ScenarioInput {
  /** Explicit occupancy for this evaluation (0..1). Overrides the inherited value. */
  occupancyRate?: ScenarioValue;
  /** Explicit ADR in minor units for this evaluation. Overrides the inherited value. */
  adrUsd?: ScenarioValue;
  /**
   * Explicit guests per occupied night for this evaluation. Omit → inherit the
   * canonical value (which may itself be unknown). Provide a non-negative integer →
   * a model assumption (never presented as observed). Provide `null` → force the
   * UNKNOWN state for this evaluation (green tax unknown — never guessed).
   */
  averageOccupiedGuests?: number | null;
}

/**
 * How the input was resolved for an evaluation — the inherit-vs-override record.
 * `overridden` entries echo the caller's assumption; `inherited` entries record the
 * canonical Estate configuration that was used. Nothing here mutates the Estate.
 */
export interface ScenarioResolution {
  occupancyRate: { source: "inherited" | "overridden"; value: number };
  adrUsd: { source: "inherited" | "overridden"; value: number };
  averageOccupiedGuests: { source: "inherited" | "overridden"; value: number | null };
}

/** Kind of evaluation performed (metadata for the UI layer). */
export type ScenarioEvaluationKind = "point" | "envelopeBound" | "baseline";

// ---------------------------------------------------------------------------
// Scenario result
// ---------------------------------------------------------------------------

/**
 * Result of one scenario evaluation. Composition, not duplication: `economics` IS the
 * canonical `EstateEconomics` produced by `computeEstateEconomics` — occupied nights,
 * gross revenue, every cost line, total costs, net/owner/operator profit, travel-agency
 * share, provenance classes and the reconciliation artifact all travel inside it, so
 * they can never diverge from the EconomicModel that computed them.
 */
export interface ScenarioResult {
  /** Stable id where the caller provides one (named/configured scenarios); optional. */
  id?: string;
  /** Human label where the caller provides one (e.g. "Conservative"); optional. */
  label?: string;
  /** Which kind of evaluation produced this result. */
  kind: ScenarioEvaluationKind;
  /** Position within an envelope evaluation ("lower" | "upper"); null otherwise. */
  bound: "lower" | "upper" | null;
  /** The effective operating context actually used (after inherit/override resolution). */
  resolution: ScenarioResolution;
  /** Currency of all monetary fields (echoed from the canonical Estate asset). */
  currency: EstateCurrency;
  /** THE canonical economics for this scenario — produced by the EconomicModel only. */
  economics: EstateEconomics;
}

/**
 * Result of an envelope evaluation: the two explicit bounds, evaluated independently
 * through the EconomicModel. Deliberately NOT collapsed — no midpoint exists anywhere.
 */
export interface ScenarioEnvelopeResult {
  lower: ScenarioResult;
  upper: ScenarioResult;
}

// ---------------------------------------------------------------------------
// Named scenarios — configuration-driven ONLY (no guessed defaults)
// ---------------------------------------------------------------------------

/**
 * A named scenario is DATA supplied by configuration. The engine ships none: exact
 * Conservative/Base/High numeric mappings are an unresolved product decision and are
 * NOT invented (see the Slice B handoff "Product decisions required").
 */
export interface NamedScenarioDefinition {
  id: string;
  label: string;
  input: ScenarioInput;
}
