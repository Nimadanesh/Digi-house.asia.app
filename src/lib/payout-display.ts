// File responsibility: pure payout *display* helpers. No business logic.
// - Monthly estimate uses the presentation conversion documented in FRACTIONALLUXE-PROGRAM A4
//   (weekly ×52 ÷ 12) because settlement code still pays on its original schedule; we display
//   the locked income model without touching any payment semantics.
// - The payout date reuses the exact Sunday rule the existing countdowns use (nextSundayParts),
//   so Home and Earnings can never disagree about "when is my next payout".
import type { EarningsEntry } from "@/types/earnings";

/** Presentation conversion only (A4): weekly figure → monthly estimate, integer minor units. */
export function monthlyFromWeeklyUsd(weeklyUsdCents: number): number {
  return Math.round((weeklyUsdCents * 52) / 12);
}

/** Next display payout date — same Sunday rule as format.nextSundayParts (display contract). */
export function nextPayoutDate(nowMs: number): Date {
  const now = new Date(nowMs);
  const daysUntilSun = (0 - now.getUTCDay() + 7) % 7;
  const nextSunMs = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilSun,
    0,
    0,
    0,
  );
  // Same wrap-around guard as the countdown: past Sunday 00:00 UTC → next week.
  return new Date(nextSunMs <= nowMs ? nextSunMs + 7 * 86_400_000 : nextSunMs);
}

/**
 * "Fri, Mar 14"-style label for a date. `locale` defaults to the runtime locale
 * (matches weekLabel behaviour); pass explicitly in tests for determinism.
 */
export function formatPayoutDate(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale ?? undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

/** weekOf of the newest fully-paid week, or null when nothing has been paid yet. */
export function lastPaidWeekOf(entries: EarningsEntry[]): string | null {
  let latest: string | null = null;
  const seenPending = new Set<string>();
  for (const e of entries) if (e.status === "pending") seenPending.add(e.weekOf);
  // Newest first (repo contract returns entries sorted newest first).
  for (const e of entries) {
    if (seenPending.has(e.weekOf)) continue; // projected/current weeks don't count as paid
    if (e.status === "paid") {
      latest = e.weekOf;
      break;
    }
  }
  return latest;
}

export interface WeeklyPoolAggregate {
  totalUsd: number;
  hasPaid: boolean;
  hasPending: boolean;
}

/** Sum per weekOf across entries — aggregation of existing fields only (no new math). */
export function weeklyEarningsPool(entries: EarningsEntry[]): Map<string, WeeklyPoolAggregate> {
  const map = new Map<string, WeeklyPoolAggregate>();
  for (const e of entries) {
    const cur =
      map.get(e.weekOf) ?? { totalUsd: 0, hasPaid: false, hasPending: false };
    cur.totalUsd += e.amountUsd;
    if (e.status === "paid") cur.hasPaid = true;
    if (e.status === "pending") cur.hasPending = true;
    map.set(e.weekOf, cur);
  }
  return map;
}
