// File responsibility: canonical Investment Plan types (Phase 9 Slice D — Plan Engine).
// Sits above the Economic/Share layers; Snapshot linkage is OPAQUE passthrough only.
//
// Non-negotiable rules this file encodes (Slice D contract):
// - Plans are CONFIGURATION-DRIVEN objects, never hardcoded UI cards. The engine
//   evaluates ANY valid config; presets (if product defines them) are data.
// - Approved product envelope: targetProfitRate ∈ [0.80, 1.25] (PLAN_TARGET_RATE_ENVELOPE).
// - targetProfit = principal × targetProfitRate; targetTotalReturn = principal + targetProfit.
// - termMonths / payoutCadence / startDate / distributionMode are EXPLICIT inputs — never
//   inferred from layout, never defaulted silently.
// - ALL plan monetary outputs are PROJECTED. They are never Paid, never Accrued, and
//   never ownership proofs. Paid/accrued income belongs to a later slice (income ledger).
// - The engine does NOT reimplement Estate economics. An estate snapshot is opaque
//   linkage context calculated by the EconomicModel/ScenarioEngine layers.
// - Money: integer minor units (cents) per repository convention.

import type { Provenance, ProvenancedValue } from "./estate";

// ---------------------------------------------------------------------------
// Approved product envelope
// ---------------------------------------------------------------------------

/** Approved target-profit-rate envelope (product decision): 80% through 125%. */
export const PLAN_TARGET_RATE_ENVELOPE = {
  min: 0.8,
  max: 1.25,
} as const;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Explicit payout cadence. Only cadences with a defined period-count rule may be
 * scheduled (see `periodsForCadence` in the engine); unknown values are rejected,
 * never defaulted.
 */
export type PlanPayoutCadence = "monthly" | "weekly";

/**
 * Distribution mode. Only the contract's example mode exists today;
 * other modes are unspecified product decisions and are rejected — never silently
 * defaulted to "even".
 */
export type PlanDistributionMode = "evenProfitPerPeriod";

/**
 * Configuration object describing an investment plan. Presets (e.g. three marketing
 * cards at different rates/terms) are DATA of this shape — the engine itself has no
 * built-in plan list.
 *
 * Optional identity/minimums exist because preset definitions may carry them; every
 * field that drives math is explicit.
 */
export interface PlanConfig {
  /** Optional identity for config-driven presets. */
  id?: string;
  /** Optional human label for config-driven presets. */
  label?: string;
  /**
   * Optional configured principal floor (minor units). When set, evaluation validates
   * the evaluated principal against it. Absent → no minimum check.
   */
  principalMinimum?: number;
  /**
   * Optional configured principal (minor units). Presets MAY carry one; "what-if"
   * evaluation supplies the principal at evaluation time instead (it wins).
   */
  principal?: number;
  /** Target profit as a fraction of principal — must be within the approved envelope. */
  targetProfitRate: number;
  /** Plan term in whole months — explicit; 0/missing/invalid is rejected. */
  termMonths: number;
  /** Explicit payout cadence — no product calendar rules are invented. */
  payoutCadence: PlanPayoutCadence;
  /**
   * Explicit distribution mode. Only "evenProfitPerPeriod" is defined (contract
   * example); others are product decisions pending and rejected.
   */
  distributionMode: PlanDistributionMode;
  /**
   * Explicit schedule start date (ISO-8601 instant, e.g. "2026-10-01T00:00:00Z").
   * Required for calendar-dated schedule entries; totals never need it.
   */
  startDate?: string;
  /**
   * Optional opaque linkage to the estate economics snapshot (from the EconomicModel /
   * ScenarioEngine layers). The PlanEngine never reads it, recomputes it, or fabricates
   * fields — it is echoed on the projection for UI context only.
   */
  estateEconomicsSnapshot?: PlanEstateSnapshotRef;
}

/**
 * Opaque passthrough of an already-calculated estate snapshot summary. The engine
 * adds no economics; unknown/optional fields stay exactly as provided.
 */
export interface PlanEstateSnapshotRef {
  estateId?: string;
  /** Snapshot summary fields already calculated elsewhere — echoed verbatim. */
  summary?: Record<string, unknown>;
  /** Optional scenario label of the snapshot (e.g. "baseline", "ambitious"). */
  scenarioLabel?: string;
}

/**
 * What-if evaluation inputs. They OVERRIDE the corresponding PlanConfig fields for a
 * single evaluation WITHOUT mutating the stored preset. Only the evaluated combination
 * is validated — the caller may probe values outside this config's approved envelope
 * only when the evaluation itself is explicitly marked as outside the approved set.
 */
export interface PlanEvaluationOverrides {
  /** What-if principal (minor units); wins over `config.principal`. */
  principal?: number;
  /** What-if rate; must still pass the envelope check of the chosen validation mode. */
  targetProfitRate?: number;
  /** What-if term in whole months. */
  termMonths?: number;
  /** What-if cadence. */
  payoutCadence?: PlanPayoutCadence;
  /** What-if distribution mode. */
  distributionMode?: PlanDistributionMode;
  /** What-if start date (ISO-8601 instant). */
  startDate?: string;
}

// ---------------------------------------------------------------------------
// Projection output
// ---------------------------------------------------------------------------

/** Provenance carried on every plan monetary output (always "projected"). */
export type PlanProvenance = Extract<Provenance, "projected">;

/**
 * One dated, PROJECTED schedule entry. Dates are deterministic functions of
 * `startDate` + period index ONLY — no market noise, no time dependence.
 */
export interface PlanScheduleEntry {
  /** 1-based period index. */
  periodIndex: number;
  /** PROJECTED profit for the period (minor units, remainder policy applied). */
  periodProfitUsd: number;
  /** PROJECTED cumulative profit including this period (minor units). */
  cumulativeProfitUsd: number;
  /** Calendar date of the period end, ISO-8601 — only when startDate + cadence are explicit. */
  date?: string;
}

/**
 * Result of evaluating a plan. Every monetary field here is PROJECTED — the UI must
 * present it as a projection, never as paid income or an account balance.
 */
export interface PlanProjection {
  /** Echo of the evaluated inputs (configuration provenance). */
  principal: number;
  targetProfitRate: number;
  termMonths: number;
  payoutCadence: PlanPayoutCadence;
  distributionMode: PlanDistributionMode;

  // --- PROJECTED outputs (provenance explicitly attached) ---
  /** principal × targetProfitRate — PROJECTED, integer cents. */
  targetProfit: ProvenancedValue;
  /** principal + targetProfit — PROJECTED, integer cents. */
  targetTotalReturn: ProvenancedValue;

  /**
   * Number of payout periods — present ONLY when cadence + term fully define a period
   * count (see engine's documented period-count rules). Absent → schedule math is
   * undefined for this cadence and is deliberately not produced.
   */
  numberOfPeriods: number | null;
  /** targetProfit ÷ numberOfPeriods under the distribution mode — null when not derivable. */
  periodProfitUsd: number | null;
  /**
   * Full period schedule — present ONLY when numberOfPeriods is derivable AND the
   * period count is finite/sane (capped). startDate present → dated entries.
   */
  schedule: PlanScheduleEntry[] | null;
  /** true when `schedule` is null ONLY because startDate was missing (totals still valid). */
  scheduleOmittedReason: "missingStartDate" | "cadenceNotSchedulable" | null;

  /** "projected" — explicit so the UI can never confuse plan outputs with paid income. */
  provenance: PlanProvenance;

  /** Opaque snapshot linkage echoed from the config (no recomputation). */
  estateEconomicsSnapshot?: PlanEstateSnapshotRef;
}
