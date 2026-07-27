// File responsibility: pure Earnings page stats (chart buckets, paid-week streaks). No React.
import type { EarningsEntry } from "@/types/earnings";

export interface WeeklyBucket {
  weekOf: string; // ISO Monday
  totalUsd: number; // minor units
  hasPending: boolean;
  hasPaid: boolean;
}

/** Aggregate entries by weekOf (newest last for chart left→right chronological). */
export function weeklyEarningsBuckets(
  entries: EarningsEntry[],
  weekCount = 8,
): WeeklyBucket[] {
  const map = new Map<string, WeeklyBucket>();
  for (const e of entries) {
    const key = e.weekOf;
    const cur = map.get(key) ?? {
      weekOf: key,
      totalUsd: 0,
      hasPending: false,
      hasPaid: false,
    };
    cur.totalUsd += e.amountUsd;
    if (e.status === "pending") cur.hasPending = true;
    if (e.status === "paid") cur.hasPaid = true;
    map.set(key, cur);
  }

  const sorted = [...map.values()].sort((a, b) => a.weekOf.localeCompare(b.weekOf));
  // Take last N weeks; if fewer, pad historically empty weeks left of the oldest (optional display).
  const tail = sorted.slice(-weekCount);
  while (tail.length < weekCount) {
    tail.unshift({
      weekOf: `pad-${tail.length}`,
      totalUsd: 0,
      hasPending: false,
      hasPaid: false,
    });
  }
  return tail;
}

/**
 * Count consecutive paid weeks ending at the most recent fully-paid week.
 * A week with any pending (e.g. current) is skipped and does not break older streak behind it.
 */
export function consecutivePaidWeeks(entries: EarningsEntry[]): number {
  if (entries.length === 0) return 0;
  const map = new Map<string, { paid: boolean; pending: boolean }>();
  for (const e of entries) {
    const cur = map.get(e.weekOf) ?? { paid: false, pending: false };
    if (e.status === "paid") cur.paid = true;
    if (e.status === "pending") cur.pending = true;
    map.set(e.weekOf, cur);
  }
  const weeks = [...map.keys()].sort((a, b) => b.localeCompare(a)); // newest first
  let streak = 0;
  for (const w of weeks) {
    const g = map.get(w)!;
    if (g.pending) continue; // current projected week — don't count, keep scanning older
    if (g.paid) {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}

/** Heuristic: hero is Pending if any entry is pending, else Paid when there is paid history. */
export function thisWeekStatus(entries: EarningsEntry[]): "pending" | "paid" {
  if (entries.some((e) => e.status === "pending")) return "pending";
  return "paid";
}
