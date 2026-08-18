// Yield math mirror of the API engine (apps/api/src/yield/yield-math.ts) — used by
// the mock repo and the lock-sheet live preview. Money: integer cents.
import type { PayoutPeriod } from "@/types/lock";

export const ACCRUAL_DAYS_PER_MONTH = 30;
export const WEEKLY_RATE_PENALTY_PP = 1;

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

/** Accrued cents after `daysElapsed` full days (inclusive lock day). */
export function accruedUsd(
  principalUsd: number,
  monthlyRatePct: number,
  period: PayoutPeriod,
  daysElapsed: number,
): number {
  if (daysElapsed < 0) return 0;
  const installment = installmentUsd(principalUsd, monthlyRatePct, period);
  const interval = payoutIntervalDays(period);
  const base = Math.floor(installment / interval);
  let total = 0;
  for (let i = 0; i <= daysElapsed; i++) {
    const j = i % interval;
    total += j < interval - 1 ? base : installment - base * (interval - 1);
  }
  return total;
}
