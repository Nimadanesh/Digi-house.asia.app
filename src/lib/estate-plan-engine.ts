// File responsibility: THE canonical Investment Plan calculation layer (Phase 9 Slice D).
// Pure, deterministic, UI-independent. Evaluates configuration-driven plans into
// PlanProjection outputs that are ALWAYS labeled PROJECTED.
//
// Rules encoded (Slice D contract):
// - Plans are configuration objects. The engine has NO built-in plan list; presets are
//   data of PlanConfig shape. No hardcoded marketing cards, no UI-inferred terms.
// - Approved product envelope: targetProfitRate ∈ [0.80, 1.25] (PLAN_TARGET_RATE_ENVELOPE).
//   Out-of-envelope rates are rejected by default. A "widerForTests" validation mode
//   exists ONLY as an explicit test flag; production callers use the default.
// - targetProfit = principal × targetProfitRate; targetTotalReturn = principal + targetProfit.
// - termMonths / payoutCadence / startDate / distributionMode are EXPLICIT inputs.
//   No product calendar rules are invented: the ONLY period-count rule implemented is
//   monthly → termMonths periods (a PROVISIONAL engineering rule flagged as needing
//   product confirmation — see the slice handoff "Product decisions required").
//   Weekly period counts are NOT derivable from the repo (no week/month calendar rule
//   exists) → weekly plans get totals only, no schedule, reported explicitly.
// - Distribution mode: only "evenProfitPerPeriod" (contract example) is implemented.
//   Unknown modes are rejected — never silently defaulted to "even".
// - Money: integer minor units (cents), half-up rounding once, no fractional residue.
//   Even per-period split: floor per period + the integer remainder distributed 1 cent
//   to the EARLIEST periods, so Σ schedule = targetProfit exactly.
// - Deterministic + pure: same inputs → same outputs; configs are never mutated; no
//   random, no market noise, no wall-clock time (dates are startDate + index only).
// - Estate economics snapshots are OPAQUE passthrough context. This engine NEVER
//   reimplements Estate cost/revenue formulas (those live in estate-economics.ts).

import {
  PLAN_TARGET_RATE_ENVELOPE,
} from "@/types/estate-plan";
import type {
  PlanConfig,
  PlanDistributionMode,
  PlanEvaluationOverrides,
  PlanPayoutCadence,
  PlanProjection,
  PlanProvenance,
  PlanScheduleEntry,
} from "@/types/estate-plan";
import { primaryPurchaseTotalUsd } from "./estate-share-model";

// ---------------------------------------------------------------------------
// Engineering guards (NOT business rules — explicit resource bounds, reported)
// ---------------------------------------------------------------------------

/** Max term in whole months accepted by validation (50 years) — beyond this, reject. */
export const MAX_TERM_MONTHS = 600;
/**
 * Max number of schedule entries the engine will materialize (50 years monthly).
 * A derivable period count above this is rejected explicitly instead of silently
 * building an unbounded array. Never used to change math — totals stay exact.
 */
export const MAX_SCHEDULE_PERIODS = 600;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validation mode for the target-profit-rate envelope.
 * - "approved" (default): rate must be within [0.80, 1.25].
 * - "widerForTests": rate only needs to be a finite non-negative number. This flag
 *   exists purely so internal tests can probe the engine's arithmetic with values
 *   outside the product envelope; production callers MUST use the default.
 */
export type PlanEnvelopeMode = "approved" | "widerForTests";

export interface PlanValidationIssues {
  /** No principal supplied (neither config.principal nor overrides.principal). */
  missingPrincipal: boolean;
  /** Principal is not a non-negative integer (negative / fractional / non-numeric). */
  invalidPrincipal: boolean;
  /** targetProfitRate is missing or not a finite number. */
  missingTargetProfitRate: boolean;
  /** Rate outside the approved envelope (checked only in "approved" mode). */
  targetProfitRateOutsideEnvelope: boolean;
  /** termMonths missing, 0, negative, fractional, or above MAX_TERM_MONTHS. */
  invalidTermMonths: boolean;
  /** payoutCadence is not one of the known cadences — never defaulted. */
  unknownPayoutCadence: boolean;
  /** distributionMode is not an implemented mode — never silently defaulted to "even". */
  unknownDistributionMode: boolean;
  /** startDate present but not a parseable date. */
  invalidStartDate: boolean;
  /** Evaluated principal is below the config's principalMinimum (when configured). */
  principalBelowConfiguredMinimum: boolean;
  /** Computed amounts are non-finite or beyond Number.MAX_SAFE_INTEGER. */
  unsafeAmounts: boolean;
  /** Derivable period count exceeds MAX_SCHEDULE_PERIODS (engineering guard). */
  scheduleTooLarge: boolean;
}

const KNOWN_CADENCES: readonly PlanPayoutCadence[] = ["monthly", "weekly"];
const KNOWN_DISTRIBUTION_MODES: readonly PlanDistributionMode[] = ["evenProfitPerPeriod"];

/**
 * Full validation of the EVALUATED combination (config with overrides applied).
 * Non-throwing; callers decide. `hasPlanIssues` collapses this to a boolean.
 */
export function validatePlanConfig(
  config: PlanConfig,
  overrides: PlanEvaluationOverrides = {},
  opts: { envelope?: PlanEnvelopeMode } = {},
): PlanValidationIssues {
  const principal = overrides.principal ?? config.principal;
  const rate = overrides.targetProfitRate ?? config.targetProfitRate;
  const termMonths = overrides.termMonths ?? config.termMonths;
  const cadence = overrides.payoutCadence ?? config.payoutCadence;
  const mode = overrides.distributionMode ?? config.distributionMode;
  const startDate = overrides.startDate ?? config.startDate;
  const envelope = opts.envelope ?? "approved";

  return {
    missingPrincipal: principal == null,
    invalidPrincipal:
      principal != null &&
      (!Number.isFinite(principal) || !Number.isInteger(principal) || principal < 0),
    missingTargetProfitRate: rate == null || !Number.isFinite(rate),
    targetProfitRateOutsideEnvelope:
      rate != null &&
      Number.isFinite(rate) &&
      (envelope === "approved"
        ? rate < PLAN_TARGET_RATE_ENVELOPE.min || rate > PLAN_TARGET_RATE_ENVELOPE.max
        : rate < 0),
    invalidTermMonths:
      termMonths == null ||
      !Number.isFinite(termMonths) ||
      !Number.isInteger(termMonths) ||
      termMonths <= 0 ||
      termMonths > MAX_TERM_MONTHS,
    unknownPayoutCadence: !KNOWN_CADENCES.includes(cadence),
    unknownDistributionMode: !KNOWN_DISTRIBUTION_MODES.includes(mode),
    invalidStartDate: startDate != null && Number.isNaN(new Date(startDate).getTime()),
    principalBelowConfiguredMinimum:
      config.principalMinimum != null &&
      principal != null &&
      Number.isFinite(principal) &&
      principal < config.principalMinimum,
    unsafeAmounts: false, // finalized after math in evaluatePlan
    scheduleTooLarge: false, // finalized after period derivation in evaluatePlan
  };
}

export function hasPlanIssues(issues: PlanValidationIssues): boolean {
  return Object.values(issues).some(Boolean);
}

// ---------------------------------------------------------------------------
// Core math primitives (the exact contract formulas)
// ---------------------------------------------------------------------------

/**
 * targetProfit = principal × targetProfitRate — integer cents, rounded half-up once.
 * PRINCIPAL-ONLY math: no Estate economics involved. Callers must treat the result as
 * PROJECTED (the projection object attaches provenance; this primitive is the raw math).
 */
export function targetProfitUsd(principal: number, targetProfitRate: number): number {
  return Math.round(principal * targetProfitRate);
}

/** targetTotalReturn = principal + targetProfit (exact; principal is integer cents). */
export function targetTotalReturnUsd(principal: number, targetProfitRate: number): number {
  return principal + targetProfitUsd(principal, targetProfitRate);
}

// ---------------------------------------------------------------------------
// Periodization — the ONLY implemented cadence→period-count rules
// ---------------------------------------------------------------------------

/**
 * Period-count rules (documented, provisional where flagged):
 * - monthly → termMonths periods. PROVISIONAL ENGINEERING RULE: "monthly = one period
 *   per term month" matches the contract's periodization example but is NOT a locked
 *   product calendar rule — flagged in the slice handoff as needing product confirmation.
 * - weekly → NOT derivable: the repo/docs define no week→month calendar mapping
 *   (no week-start rule, no months-per-term basis). Returns null; weekly plans get
 *   totals only. DO NOT GUESS.
 */
export function periodsForCadence(
  payoutCadence: PlanPayoutCadence,
  termMonths: number,
): number | null {
  if (payoutCadence === "monthly") return termMonths;
  return null; // weekly: period-count rule is an undefined product decision
}

/** A cadence is schedulable when its period count is derivable (see periodsForCadence). */
export function isSchedulableCadence(payoutCadence: PlanPayoutCadence): boolean {
  return periodsForCadence(payoutCadence, 1) != null;
}

// ---------------------------------------------------------------------------
// Even-profit remainder policy (deterministic)
// ---------------------------------------------------------------------------

/**
 * Split an integer-cent profit evenly across `periods`: floor per period, then the
 * integer remainder (targetProfit − periods × floor) distributed 1 cent to the
 * EARLIEST periods. Σ entries === targetProfit exactly — no hidden residue.
 * This mirrors the repo's "round once, no compounding residue" money rule.
 */
export function evenSplitPeriodProfits(targetProfit: number, periods: number): number[] {
  const base = Math.floor(targetProfit / periods);
  const remainder = targetProfit - base * periods;
  return Array.from(
    { length: periods },
    (_, i) => base + (i < remainder ? 1 : 0),
  );
}

// ---------------------------------------------------------------------------
// Schedule dates — deterministic functions of startDate + index ONLY
// ---------------------------------------------------------------------------

/**
 * Period-end dates. PROVISIONAL calendar math (flagged for product confirmation):
 * - monthly: start + i calendar months, same UTC day-of-month as the start date
 *   (month-end clamping is the JS UTC-constructor normalization, e.g. Jan 31 + 1mo → Mar 2/3).
 * - weekly: start + 7 × i days (UTC).
 * No business calendar (business-day shifts, cutoffs, holidays) is invented.
 */
function periodEndDateIso(startDate: string, payoutCadence: PlanPayoutCadence, periodIndex: number): string {
  const start = new Date(startDate);
  if (payoutCadence === "monthly") {
    return new Date(
      Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth() + periodIndex,
        start.getUTCDate(),
        start.getUTCHours(),
        start.getUTCMinutes(),
        start.getUTCSeconds(),
        start.getUTCMilliseconds(),
      ),
    ).toISOString();
  }
  return new Date(start.getTime() + periodIndex * 7 * 24 * 60 * 60 * 1000).toISOString();
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

export type PlanEvaluationResult =
  | { ok: true; projection: PlanProjection }
  | { ok: false; issues: PlanValidationIssues };

/**
 * THE one canonical plan evaluation. Applies what-if overrides on top of the config
 * (WITHOUT mutating the config), validates the evaluated combination, and produces a
 * PlanProjection whose monetary outputs are always provenance "projected".
 *
 * - Totals need only principal + rate. Schedule additionally needs a derivable period
 *   count (monthly cadence, see periodsForCadence) and, for dated entries, startDate.
 * - Weekly cadence → totals + numberOfPeriods:null + schedule:null +
 *   scheduleOmittedReason:"cadenceNotSchedulable" (reported, not guessed).
 * - Missing startDate with a schedulable cadence → totals + undated schedule:null +
 *   scheduleOmittedReason:"missingStartDate". Re-evaluate with a startDate override to
 *   obtain the dated schedule.
 */
export function evaluatePlan(
  config: PlanConfig,
  overrides: PlanEvaluationOverrides = {},
  opts: { envelope?: PlanEnvelopeMode } = {},
): PlanEvaluationResult {
  const issues = validatePlanConfig(config, overrides, opts);
  if (hasPlanIssues(issues)) return { ok: false, issues };

  const principal = overrides.principal ?? config.principal as number;
  const rate = overrides.targetProfitRate ?? config.targetProfitRate;
  const termMonths = overrides.termMonths ?? config.termMonths;
  const cadence = overrides.payoutCadence ?? config.payoutCadence;
  const mode = overrides.distributionMode ?? config.distributionMode;
  const startDate = overrides.startDate ?? config.startDate;

  const targetProfit = targetProfitUsd(principal, rate);
  const targetTotalReturn = principal + targetProfit;
  if (!Number.isSafeInteger(targetProfit) || !Number.isSafeInteger(targetTotalReturn)) {
    return { ok: false, issues: { ...issues, unsafeAmounts: true } };
  }

  const periods = periodsForCadence(cadence, termMonths);
  const provenance: PlanProvenance = "projected";

  let schedule: PlanScheduleEntry[] | null = null;
  let scheduleOmittedReason: PlanProjection["scheduleOmittedReason"] = null;

  if (periods == null) {
    scheduleOmittedReason = "cadenceNotSchedulable";
  } else if (periods > MAX_SCHEDULE_PERIODS) {
    return { ok: false, issues: { ...issues, scheduleTooLarge: true } };
  } else if (startDate == null) {
    scheduleOmittedReason = "missingStartDate";
  } else {
    const perPeriod = evenSplitPeriodProfits(targetProfit, periods);
    let cumulative = 0;
    schedule = perPeriod.map((amount, i) => {
      cumulative += amount;
      const entry: PlanScheduleEntry = {
        periodIndex: i + 1,
        periodProfitUsd: amount,
        cumulativeProfitUsd: cumulative,
      };
      entry.date = periodEndDateIso(startDate, cadence, i + 1);
      return entry;
    });
  }

  const projection: PlanProjection = {
    principal,
    targetProfitRate: rate,
    termMonths,
    payoutCadence: cadence,
    distributionMode: mode,
    targetProfit: { value: targetProfit, provenance },
    targetTotalReturn: { value: targetTotalReturn, provenance },
    numberOfPeriods: periods,
    periodProfitUsd:
      periods != null ? evenSplitPeriodProfits(targetProfit, periods)[periods - 1] : null,
    schedule,
    scheduleOmittedReason,
    provenance,
    estateEconomicsSnapshot: config.estateEconomicsSnapshot
      ? { ...config.estateEconomicsSnapshot }
      : undefined,
  };
  return { ok: true, projection };
}

/** Throwing variant for callers that treat an invalid evaluation as a programming error. */
export function evaluatePlanOrThrow(
  config: PlanConfig,
  overrides: PlanEvaluationOverrides = {},
  opts: { envelope?: PlanEnvelopeMode } = {},
): PlanProjection {
  const result = evaluatePlan(config, overrides, opts);
  if (!result.ok) {
    const failed = Object.entries(result.issues)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(", ");
    throw new RangeError(`invalid plan evaluation: ${failed}`);
  }
  return result.projection;
}

// ---------------------------------------------------------------------------
// Cumulative / remaining helpers (derived from the same deterministic split)
// ---------------------------------------------------------------------------

/**
 * PROJECTED cumulative profit after k periods (k may be 0..numberOfPeriods).
 * null when the projection has no derivable period count or k is out of range.
 * Matches Σ of the first k schedule entries without materializing the schedule.
 */
export function cumulativeProjectedProfit(projection: PlanProjection, k: number): number | null {
  const periods = projection.numberOfPeriods;
  if (periods == null || !Number.isInteger(k) || k < 0 || k > periods) return null;
  const base = Math.floor(projection.targetProfit.value / periods);
  const remainder = projection.targetProfit.value - base * periods;
  return base * k + Math.min(k, remainder);
}

/** PROJECTED remaining profit after k periods = targetProfit − cumulative(k). null as above. */
export function remainingProjectedProfit(projection: PlanProjection, k: number): number | null {
  const cumulative = cumulativeProjectedProfit(projection, k);
  return cumulative == null ? null : projection.targetProfit.value - cumulative;
}

// ---------------------------------------------------------------------------
// Share Model integration (the ONLY permitted principal bridge)
// ---------------------------------------------------------------------------

/**
 * Principal from a share purchase: shares × primarySharePrice via the Slice C Share
 * Model helper (no price/supply invention here). Throws when the primary price is not
 * configured — explicit, never a guessed total. Result feeds evaluatePlan as principal.
 */
export function planPrincipalFromShares(shares: number, primarySharePrice: number | null): number {
  return primaryPurchaseTotalUsd(shares, primarySharePrice);
}
