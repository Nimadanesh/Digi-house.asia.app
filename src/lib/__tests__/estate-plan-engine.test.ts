// Tests for the canonical PlanEngine (Phase 9 Slice D).
// Covers the Slice D test matrix: 80% / midpoint / 125% target math, rounding/remainder
// boundaries, terms, cadence rules (only defined mappings), zero/negative/missing
// principal, out-of-envelope rates, PROJECTED provenance, determinism + non-mutation,
// no Estate-formula duplication (opaque snapshot passthrough), and the ShareModel
// principal bridge. NO invented APY-from-occupancy behavior is tested (none exists).
//
// Money note: all values are integer cents (repo convention). e.g. 80_000 = $800.00.

import { describe, expect, it } from "vitest";

import {
  MAX_SCHEDULE_PERIODS,
  MAX_TERM_MONTHS,
  cumulativeProjectedProfit,
  evenSplitPeriodProfits,
  evaluatePlan,
  evaluatePlanOrThrow,
  hasPlanIssues,
  isSchedulableCadence,
  periodsForCadence,
  planPrincipalFromShares,
  remainingProjectedProfit,
  targetProfitUsd,
  targetTotalReturnUsd,
  validatePlanConfig,
} from "../estate-plan-engine";
import { PLAN_TARGET_RATE_ENVELOPE } from "@/types/estate-plan";
import type {
  PlanConfig,
  PlanEvaluationOverrides,
} from "@/types/estate-plan";
import { primaryPurchaseTotalUsd } from "../estate-share-model";

// ---------------------------------------------------------------------------
// Fixtures — TEST CONFIGURATION ONLY (no production plan presets invented)
// ---------------------------------------------------------------------------

/** Labeled test configuration — terms/rates are NOT production plan presets. */
function makeConfig(overrides: Partial<PlanConfig> = {}): PlanConfig {
  return {
    id: "plan-test",
    label: "Test fixture plan",
    principal: 100_000, // $1,000.00 in cents — fixture, not a product minimum
    targetProfitRate: 1.0,
    termMonths: 12,
    payoutCadence: "monthly",
    distributionMode: "evenProfitPerPeriod",
    startDate: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Core math — 80% / midpoint / 125% (the approved envelope corners + mid)
// ---------------------------------------------------------------------------

describe("core math: approved envelope rates", () => {
  it("80% rate: targetProfit = principal × 0.80, total = principal + profit", () => {
    const p = evaluatePlanOrThrow(makeConfig({ targetProfitRate: 0.8 }), { principal: 100_000 });
    expect(p.targetProfit.value).toBe(80_000); // $800.00
    expect(p.targetTotalReturn.value).toBe(180_000); // $1,800.00
  });

  it("midpoint 1.00 rate: profit equals principal, total is double", () => {
    const p = evaluatePlanOrThrow(makeConfig({ targetProfitRate: 1.0 }), { principal: 100_000 });
    expect(p.targetProfit.value).toBe(100_000);
    expect(p.targetTotalReturn.value).toBe(200_000);
  });

  it("125% rate: profit = principal × 1.25, total = principal × 2.25", () => {
    const p = evaluatePlanOrThrow(makeConfig({ targetProfitRate: 1.25 }), { principal: 100_000 });
    expect(p.targetProfit.value).toBe(125_000); // $1,250.00
    expect(p.targetTotalReturn.value).toBe(225_000); // $2,250.00
  });

  it("exact envelope bounds 0.80 and 1.25 are accepted (inclusive)", () => {
    for (const rate of [PLAN_TARGET_RATE_ENVELOPE.min, PLAN_TARGET_RATE_ENVELOPE.max]) {
      expect(validatePlanConfig(makeConfig({ targetProfitRate: rate })).targetProfitRateOutsideEnvelope).toBe(false);
    }
  });

  it("envelope midpoint (0.80 + 1.25) / 2 = 1.025 is accepted", () => {
    const p = evaluatePlanOrThrow(makeConfig({ targetProfitRate: 1.025 }), { principal: 100_000 });
    expect(p.targetProfit.value).toBe(102_500); // $1,025.00
    expect(p.targetTotalReturn.value).toBe(202_500);
  });
});

// ---------------------------------------------------------------------------
// 2. Rounding policy (half-up once) — raw math primitives
// ---------------------------------------------------------------------------

describe("rounding: half-up once, no residue", () => {
  it("targetProfitUsd rounds half-up (…5 cents rounds up)", () => {
    expect(targetProfitUsd(12_345, 0.5)).toBe(6_173); // 6,172.5 → 6,173
    expect(targetProfitUsd(12_335, 0.5)).toBe(6_168); // 6,167.5 → 6,168
  });

  it("total return = principal + profit exactly", () => {
    expect(targetTotalReturnUsd(12_345, 0.5)).toBe(12_345 + 6_173);
  });

  it("envelope corners round half-up consistently", () => {
    expect(targetProfitUsd(1_001, 0.8)).toBe(801); // 800.8 → 801
    expect(targetProfitUsd(1_001, 1.25)).toBe(1_251); // 1,251.25 → 1,251
  });
});

// ---------------------------------------------------------------------------
// 3. Remainder policy — even split boundaries
// ---------------------------------------------------------------------------

describe("even split: floor + remainder to earliest periods, Σ = targetProfit", () => {
  it("clean division: every period identical", () => {
    expect(evenSplitPeriodProfits(12_000, 12)).toEqual(Array(12).fill(1_000));
  });

  it("remainder distributed 1 cent to the earliest periods", () => {
    expect(evenSplitPeriodProfits(10_000, 3)).toEqual([3_334, 3_333, 3_333]);
    expect(evenSplitPeriodProfits(1, 3)).toEqual([1, 0, 0]); // 1 cent ÷ 3
  });

  it("schedule Σ periodProfit === targetProfit; cumulative is monotonic and ends at target", () => {
    const p = evaluatePlanOrThrow(makeConfig({ targetProfitRate: 0.8 }), { principal: 1_000_001 });
    const schedule = p.schedule as NonNullable<typeof p.schedule>;
    const sum = schedule.reduce((s, e) => s + e.periodProfitUsd, 0);
    expect(sum).toBe(p.targetProfit.value);
    expect(schedule.at(-1)?.cumulativeProfitUsd).toBe(p.targetProfit.value);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].cumulativeProfitUsd).toBeGreaterThanOrEqual(schedule[i - 1].cumulativeProfitUsd);
    }
  });

  it("periodProfitUsd follows the remainder policy (last period = floor; earliest get +1)", () => {
    const p = evaluatePlanOrThrow(makeConfig({ targetProfitRate: 0.8 }), { principal: 1_000_001 });
    const floor = Math.floor(p.targetProfit.value / 12);
    expect(p.periodProfitUsd).toBe(floor);
    expect((p.schedule as NonNullable<typeof p.schedule>)[0].periodProfitUsd).toBe(floor + 1);
  });

  it("cumulative/remaining helpers match Σ of the first k schedule entries", () => {
    const p = evaluatePlanOrThrow(makeConfig({ targetProfitRate: 0.8 }), { principal: 1_000_001 });
    const schedule = p.schedule as NonNullable<typeof p.schedule>;
    for (const k of [0, 1, 5, 11, 12]) {
      const expected = schedule.slice(0, k).reduce((s, e) => s + e.periodProfitUsd, 0);
      expect(cumulativeProjectedProfit(p, k)).toBe(expected);
      expect(remainingProjectedProfit(p, k)).toBe(p.targetProfit.value - expected);
    }
  });

  it("cumulative/remaining helpers return null without a derivable period count", () => {
    const p = evaluatePlanOrThrow(makeConfig({ payoutCadence: "weekly" }), { principal: 100_000 });
    expect(cumulativeProjectedProfit(p, 1)).toBeNull();
    expect(remainingProjectedProfit(p, 1)).toBeNull();
  });

  it("cumulative helper rejects out-of-range k", () => {
    const p = evaluatePlanOrThrow(makeConfig(), { principal: 100_000 });
    expect(cumulativeProjectedProfit(p, 13)).toBeNull();
    expect(cumulativeProjectedProfit(p, -1)).toBeNull();
    expect(cumulativeProjectedProfit(p, 1.5)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. Terms & cadences — explicit inputs, only defined mappings
// ---------------------------------------------------------------------------

describe("terms and cadences (explicit, never inferred)", () => {
  it("different terms change the period count and per-period profit deterministically", () => {
    const six = evaluatePlanOrThrow(makeConfig({ termMonths: 6 }), { principal: 120_000, targetProfitRate: 1.0 });
    const twelve = evaluatePlanOrThrow(makeConfig({ termMonths: 12 }), { principal: 120_000, targetProfitRate: 1.0 });
    expect(six.numberOfPeriods).toBe(6);
    expect(twelve.numberOfPeriods).toBe(12);
    expect(six.periodProfitUsd).toBe(20_000); // 120,000c ÷ 6
    expect(twelve.periodProfitUsd).toBe(10_000); // 120,000c ÷ 12
  });

  it("monthly → termMonths periods (documented PROVISIONAL rule, needs product confirmation)", () => {
    expect(periodsForCadence("monthly", 12)).toBe(12);
    expect(periodsForCadence("monthly", 1)).toBe(1);
  });

  it("weekly → NO period count (product calendar rule undefined — totals only)", () => {
    expect(periodsForCadence("weekly", 12)).toBeNull();
    expect(isSchedulableCadence("weekly")).toBe(false);
    expect(isSchedulableCadence("monthly")).toBe(true);
  });

  it("weekly evaluation: totals valid, schedule omitted with explicit reason", () => {
    const p = evaluatePlanOrThrow(makeConfig({ payoutCadence: "weekly" }), { principal: 100_000 });
    expect(p.targetProfit.value).toBe(100_000);
    expect(p.targetTotalReturn.value).toBe(200_000);
    expect(p.numberOfPeriods).toBeNull();
    expect(p.periodProfitUsd).toBeNull();
    expect(p.schedule).toBeNull();
    expect(p.scheduleOmittedReason).toBe("cadenceNotSchedulable");
  });

  it("monthly + missing startDate: totals + period count valid, schedule omitted with explicit reason", () => {
    const { startDate: _omitted, ...noDate } = makeConfig();
    const p = evaluatePlanOrThrow(noDate as PlanConfig, { principal: 100_000 });
    expect(p.numberOfPeriods).toBe(12);
    expect(p.periodProfitUsd).toBe(8_333); // floor(100,000 ÷ 12); remainder to earliest periods
    expect(p.schedule).toBeNull();
    expect(p.scheduleOmittedReason).toBe("missingStartDate");
  });

  it("missing term is rejected — never inferred", () => {
    const noTerm = makeConfig() as Partial<PlanConfig>;
    delete noTerm.termMonths;
    const issues = validatePlanConfig(noTerm as PlanConfig);
    expect(issues.invalidTermMonths).toBe(true);
    expect(evaluatePlan(noTerm as PlanConfig).ok).toBe(false);
  });

  it("term 0 and fractional term are rejected", () => {
    expect(validatePlanConfig(makeConfig({ termMonths: 0 })).invalidTermMonths).toBe(true);
    expect(validatePlanConfig(makeConfig({ termMonths: 6.5 })).invalidTermMonths).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Principal edge cases
// ---------------------------------------------------------------------------

describe("principal edge cases", () => {
  it("principal = 0 is an explicit valid zero projection", () => {
    const p = evaluatePlanOrThrow(makeConfig(), { principal: 0 });
    expect(p.targetProfit.value).toBe(0);
    expect(p.targetTotalReturn.value).toBe(0);
    expect(p.provenance).toBe("projected");
  });

  it("negative principal is rejected", () => {
    expect(evaluatePlan(makeConfig(), { principal: -1 }).ok).toBe(false);
    expect(validatePlanConfig(makeConfig(), { principal: -1 }).invalidPrincipal).toBe(true);
  });

  it("fractional principal (non-integer cents) is rejected", () => {
    expect(validatePlanConfig(makeConfig(), { principal: 100.5 }).invalidPrincipal).toBe(true);
  });

  it("missing principal is rejected — never defaulted", () => {
    const noPrincipal = makeConfig();
    delete (noPrincipal as Partial<PlanConfig>).principal;
    const issues = validatePlanConfig(noPrincipal);
    expect(issues.missingPrincipal).toBe(true);
    expect(evaluatePlan(noPrincipal).ok).toBe(false);
  });

  it("very large safe principal works; overflow is an explicit error, never silent", () => {
    // 4e15 cents × 1.25 = 5e15 profit; total 9e15 ≤ 2^53−1 (rate 1.25 is float-exact).
    const big = 4_000_000_000_000_000;
    const p = evaluatePlanOrThrow(makeConfig({ targetProfitRate: 1.25 }), { principal: big });
    expect(p.targetProfit.value).toBe(5_000_000_000_000_000);
    expect(p.targetTotalReturn.value).toBe(9_000_000_000_000_000);
    // principal + profit beyond MAX_SAFE_INTEGER → explicit unsafeAmounts failure.
    const overflow = evaluatePlan(makeConfig({ targetProfitRate: 1.0 }), { principal: Number.MAX_SAFE_INTEGER });
    expect(overflow.ok).toBe(false);
    if (!overflow.ok) expect(overflow.issues.unsafeAmounts).toBe(true);
  });

  it("config principalMinimum is enforced at evaluation time", () => {
    const cfg = makeConfig({ principalMinimum: 50_000 });
    expect(validatePlanConfig(cfg, { principal: 10_000 }).principalBelowConfiguredMinimum).toBe(true);
    expect(evaluatePlan(cfg, { principal: 10_000 }).ok).toBe(false);
    expect(evaluatePlan(cfg, { principal: 50_000 }).ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. Out-of-envelope rates — rejected by default, test flag is explicit
// ---------------------------------------------------------------------------

describe("envelope enforcement", () => {
  it.each([0.79, 1.26, -1, 0])("rate %s is rejected in approved mode", (rate) => {
    expect(validatePlanConfig(makeConfig(), { targetProfitRate: rate }).targetProfitRateOutsideEnvelope).toBe(true);
    expect(evaluatePlan(makeConfig(), { targetProfitRate: rate }).ok).toBe(false);
  });

  it("widerForTests is an explicit flag; the default stays approved", () => {
    expect(evaluatePlan(makeConfig(), { targetProfitRate: 2 }, { envelope: "widerForTests" }).ok).toBe(true);
    expect(evaluatePlan(makeConfig(), { targetProfitRate: 2 }).ok).toBe(false);
  });

  it("non-finite rate is rejected in both modes", () => {
    for (const envelope of ["approved", "widerForTests"] as const) {
      expect(validatePlanConfig(makeConfig(), { targetProfitRate: NaN }, { envelope }).missingTargetProfitRate).toBe(true);
      expect(validatePlanConfig(makeConfig(), { targetProfitRate: Infinity }, { envelope }).missingTargetProfitRate).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Unknown cadence / distribution mode / date — rejected, never silent-defaulted
// ---------------------------------------------------------------------------

describe("unknown inputs are rejected", () => {
  it("unknown cadence is rejected", () => {
    const cfg = makeConfig({ payoutCadence: "quarterly" as never });
    expect(validatePlanConfig(cfg).unknownPayoutCadence).toBe(true);
    expect(evaluatePlan(cfg).ok).toBe(false);
  });

  it("unknown distribution mode is rejected — no silent default to even", () => {
    const cfg = makeConfig({ distributionMode: "frontLoaded" as never });
    expect(validatePlanConfig(cfg).unknownDistributionMode).toBe(true);
    expect(evaluatePlan(cfg).ok).toBe(false);
  });

  it("invalid startDate is rejected when present", () => {
    const cfg = makeConfig({ startDate: "not-a-date" });
    expect(validatePlanConfig(cfg).invalidStartDate).toBe(true);
    expect(evaluatePlan(cfg).ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 8. Provenance — PROJECTED on outputs, never Paid/Accrued
// ---------------------------------------------------------------------------

describe("PROJECTED provenance", () => {
  it("profit and total return carry provenance 'projected'", () => {
    const p = evaluatePlanOrThrow(makeConfig({ targetProfitRate: 0.8 }), { principal: 100_000 });
    expect(p.targetProfit).toEqual({ value: 80_000, provenance: "projected" });
    expect(p.targetTotalReturn).toEqual({ value: 180_000, provenance: "projected" });
    expect(p.provenance).toBe("projected");
  });

  it("the projection model contains no paid/accrued vocabulary", () => {
    const p = evaluatePlanOrThrow(makeConfig(), { principal: 100_000 });
    expect(Object.keys(p).join(" ")).not.toMatch(/paid|accrued/i);
    expect(p.schedule?.every((e) => Number.isInteger(e.periodProfitUsd) && Number.isInteger(e.cumulativeProfitUsd))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9. Determinism & non-mutation
// ---------------------------------------------------------------------------

describe("determinism and non-mutation", () => {
  it("same config + overrides → identical projection", () => {
    const cfg = makeConfig();
    const a = evaluatePlanOrThrow(cfg, { principal: 123_456, targetProfitRate: 1.025 });
    const b = evaluatePlanOrThrow(cfg, { principal: 123_456, targetProfitRate: 1.025 });
    expect(a).toEqual(b);
  });

  it("evaluation does not mutate the config or the overrides", () => {
    const cfg = makeConfig();
    const snapshot = JSON.stringify(cfg);
    const ov: PlanEvaluationOverrides = { principal: 50_000, targetProfitRate: 1.25 };
    const ovSnapshot = JSON.stringify(ov);
    evaluatePlanOrThrow(cfg, ov);
    expect(JSON.stringify(cfg)).toBe(snapshot);
    expect(JSON.stringify(ov)).toBe(ovSnapshot);
  });

  it("override fields absent from the config do not leak back into it", () => {
    const cfg = makeConfig();
    delete (cfg as Partial<PlanConfig>).principal;
    evaluatePlanOrThrow(cfg, { principal: 100_000 });
    expect(cfg.principal).toBeUndefined();
  });

  it("dates are deterministic functions of startDate + index (no wall clock)", () => {
    const a = evaluatePlanOrThrow(makeConfig(), { principal: 100_000 });
    const b = evaluatePlanOrThrow(makeConfig(), { principal: 100_000 });
    expect(a.schedule?.map((e) => e.date)).toEqual(b.schedule?.map((e) => e.date));
  });
});

// ---------------------------------------------------------------------------
// 10. Schedule dates + snapshot passthrough
// ---------------------------------------------------------------------------

describe("schedule dates and snapshot linkage", () => {
  it("monthly dates: period i ends start + i calendar months (same UTC day-of-month)", () => {
    const p = evaluatePlanOrThrow(makeConfig({ startDate: "2026-10-01T00:00:00.000Z" }), { principal: 100_000 });
    expect(p.schedule?.[0].date).toBe("2026-11-01T00:00:00.000Z"); // period 1
    expect(p.schedule?.[11].date).toBe("2027-10-01T00:00:00.000Z"); // period 12
  });

  it("weekly cadence produces no dated schedule (period count not derivable)", () => {
    const p = evaluatePlanOrThrow(
      makeConfig({ payoutCadence: "weekly", startDate: "2026-10-01T00:00:00.000Z" }),
      { principal: 100_000 },
    );
    expect(p.schedule).toBeNull();
    expect(p.scheduleOmittedReason).toBe("cadenceNotSchedulable");
  });

  it("estate snapshot is echoed opaquely — not read, not recomputed, not fabricated", () => {
    const snapshot = {
      estateId: "estate-test",
      scenarioLabel: "baseline",
      summary: { netProfitUsd: 99_900, ownerProfitUsd: 39_960, netProfitKnown: true },
    };
    const cfg = makeConfig({ estateEconomicsSnapshot: snapshot });
    const p = evaluatePlanOrThrow(cfg, { principal: 100_000, targetProfitRate: 0.8 });
    expect(p.estateEconomicsSnapshot).toEqual(snapshot); // verbatim passthrough
    expect(p.targetProfit.value).toBe(80_000); // principal-only math — NOT derived from snapshot fields
  });

  it("target math is independent of any snapshot values (no Estate formula fork)", () => {
    const wild = { estateId: "x", summary: { netProfitUsd: 1_000_000_000, occupancyRate: 0.99 } };
    const withSnap = evaluatePlanOrThrow(makeConfig({ estateEconomicsSnapshot: wild }), { principal: 100_000 });
    const withoutSnap = evaluatePlanOrThrow(makeConfig(), { principal: 100_000 });
    expect(withSnap.targetProfit).toEqual(withoutSnap.targetProfit);
    expect(withSnap.targetTotalReturn).toEqual(withoutSnap.targetTotalReturn);
  });
});

// ---------------------------------------------------------------------------
// 11. Share Model integration — principal bridge only
// ---------------------------------------------------------------------------

describe("ShareModel principal bridge", () => {
  it("planPrincipalFromShares = shares × primarySharePrice via the Slice C helper", () => {
    expect(planPrincipalFromShares(100, 100_000)).toBe(10_000_000); // 100 × $1,000 = $10,000
    expect(planPrincipalFromShares(100, 100_000)).toBe(primaryPurchaseTotalUsd(100, 100_000));
  });

  it("unconfigured primary price fails explicitly (no guessed total)", () => {
    expect(() => planPrincipalFromShares(100, null)).toThrow(RangeError);
  });

  it("shares → principal → projection end-to-end (principal-only math)", () => {
    const principal = planPrincipalFromShares(50, 100_000); // 50 × $1,000 = $50,000 = 5,000,000c
    const p = evaluatePlanOrThrow(makeConfig(), { principal, targetProfitRate: 1.25 });
    expect(p.targetProfit.value).toBe(6_250_000); // $62,500.00
    expect(p.targetTotalReturn.value).toBe(principal + p.targetProfit.value);
  });
});

// ---------------------------------------------------------------------------
// 12. Validation surface & engineering guards
// ---------------------------------------------------------------------------

describe("validation surface", () => {
  it("hasPlanIssues collapses the issues object", () => {
    expect(hasPlanIssues(validatePlanConfig(makeConfig()))).toBe(false);
    expect(hasPlanIssues(validatePlanConfig(makeConfig(), { principal: -5 }))).toBe(true);
  });

  it("term above MAX_TERM_MONTHS is rejected; the boundary is accepted", () => {
    expect(validatePlanConfig(makeConfig({ termMonths: MAX_TERM_MONTHS })).invalidTermMonths).toBe(false);
    expect(validatePlanConfig(makeConfig({ termMonths: MAX_TERM_MONTHS + 1 })).invalidTermMonths).toBe(true);
  });

  it("schedule guard equals the term guard (periods can never exceed MAX_SCHEDULE_PERIODS)", () => {
    // Defense-in-depth boundary: the largest valid term is exactly the schedule cap.
    expect(MAX_SCHEDULE_PERIODS).toBe(MAX_TERM_MONTHS);
  });

  it("evaluatePlan returns issues (non-throwing) while evaluatePlanOrThrow throws RangeError", () => {
    const bad = makeConfig({ principal: -1 });
    const result = evaluatePlan(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.invalidPrincipal).toBe(true);
    expect(() => evaluatePlanOrThrow(bad)).toThrow(RangeError);
    expect(() => evaluatePlanOrThrow(bad)).toThrow("invalid plan evaluation");
  });
});
