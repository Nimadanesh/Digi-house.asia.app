import type { PayoutPeriod } from "../db/schema/share-locks.js";

/**
 * Yield math (PRODUCT-PLAN §0.4). All money is integer cents; all rates are
 * percent with two decimals (e.g. 6.25). Conventions:
 *
 * - monthly locks: 30-day accrual month. daily = principal × rate% / 30.
 *   A full 30 days locked pays exactly principal × rate% (pro-rata by day).
 * - weekly locks: effective monthly rate = rate − 1pp, paid as 4 weekly
 *   installments. daily = principal × (rate−1)% / 28, so 7 days = exactly
 *   one weekly installment of principal × (rate−1)% / 4.
 * - accrual day = UTC calendar day; the lock day itself counts (yield from
 *   day 1); the unlock-request day still accrues (cutoff is inclusive).
 */

export const ACCRUAL_DAYS_PER_MONTH = 30;
export const WEEKLY_RATE_PENALTY_PP = 1; // rate − 1pp when paid weekly

/** Effective monthly rate in percent: rate − 1pp for weekly payouts. */
export function effectiveMonthlyRatePct(
  monthlyRatePct: number,
  period: PayoutPeriod,
): number {
  return period === "weekly"
    ? monthlyRatePct - WEEKLY_RATE_PENALTY_PP
    : monthlyRatePct;
}

/** One installment in cents: monthly = principal × rate; weekly = (rate−1)%/4. */
export function installmentUsd(
  principalUsd: number,
  monthlyRatePct: number,
  period: PayoutPeriod,
): number {
  const effective = effectiveMonthlyRatePct(monthlyRatePct, period);
  const per = period === "monthly" ? 1 : 4;
  return Math.round((principalUsd * (effective / 100)) / per);
}

export function payoutIntervalDays(period: PayoutPeriod): number {
  return period === "monthly" ? ACCRUAL_DAYS_PER_MONTH : 7;
}

/**
 * Accrual amount for the day at `dayIndex` (0-based from the lock day).
 * Distribution is exact per period: floor(installment/interval) on every day
 * except the period's last day, which carries the remainder — so interval
 * consecutive days always sum to exactly one installment (no rounding drift).
 */
export function dailyAccrualAtDayIndex(
  principalUsd: number,
  monthlyRatePct: number,
  period: PayoutPeriod,
  dayIndex: number,
): number {
  if (dayIndex < 0) return 0;
  const installment = installmentUsd(principalUsd, monthlyRatePct, period);
  const interval = payoutIntervalDays(period);
  const j = dayIndex % interval;
  const base = Math.floor(installment / interval);
  return j < interval - 1 ? base : installment - base * (interval - 1);
}

/** UTC calendar day (YYYY-MM-DD) of a timestamp. */
export function utcDay(ts: Date): string {
  return ts.toISOString().slice(0, 10);
}

export function addDaysToDay(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return utcDay(d);
}

export function dayDiff(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00.000Z`);
  const b = Date.parse(`${to}T00:00:00.000Z`);
  return Math.round((b - a) / 86_400_000);
}

/** Accrued-but-unpaid total for a window of days (integer cents). */
export function sumAccruals(amounts: number[]): number {
  return amounts.reduce((s, x) => s + x, 0);
}
