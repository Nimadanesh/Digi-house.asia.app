// File responsibility: Slice I observatory chart model — typed timeline points,
// deterministic range windows, paid-only cumulative + estate composition.
// Pure and deterministic: ledger entries in, chart facts out. Missing weeks stay
// null/empty; nothing is interpolated, averaged, or fabricated. Money: integer
// minor units (cents).
import type { EarningsEntry } from "@/types/earnings";

export interface TimelinePoint {
  weekOf: string;
  /** Paid ledger sum for the week; null when nothing was paid. */
  paidUsd: number | null;
  /** Pending-ledger sum for the week; null when nothing is projected. */
  projectedUsd: number | null;
  distributionCount: number;
  estateIds: string[];
  /** Padded calendar slot with no ledger data (renders faint, untappable detail). */
  empty: boolean;
}

export type TimelineRange = "12W" | "6M" | "1Y" | "ALL";

const RANGE_WEEKS: Record<TimelineRange, number> = {
  "12W": 12,
  "6M": 26,
  "1Y": 52,
  ALL: Number.POSITIVE_INFINITY,
};

/** Collapse ledger entries into ascending typed weekly points (data weeks only). */
export function buildTimelinePoints(entries: EarningsEntry[]): TimelinePoint[] {
  const map = new Map<string, { paid: number; projected: number; count: number; estates: Set<string> }>();
  for (const e of entries) {
    const cur = map.get(e.weekOf) ?? { paid: 0, projected: 0, count: 0, estates: new Set<string>() };
    if (e.status === "paid") cur.paid += e.amountUsd;
    else cur.projected += e.amountUsd;
    cur.count += 1;
    cur.estates.add(e.propertyId);
    map.set(e.weekOf, cur);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekOf, v]) => ({
      weekOf,
      paidUsd: v.paid > 0 ? v.paid : null,
      projectedUsd: v.projected > 0 ? v.projected : null,
      distributionCount: v.count,
      estateIds: [...v.estates].sort(),
      empty: false,
    }));
}

export interface RangeView {
  weeks: TimelinePoint[];
  /** True when history is shorter than the requested window. */
  constrained: boolean;
}

function padWeek(): TimelinePoint {
  return { weekOf: "", paidUsd: null, projectedUsd: null, distributionCount: 0, estateIds: [], empty: true };
}

/** Window the points into a range; short histories clamp to available data. */
export function applyRange(points: TimelinePoint[], range: TimelineRange): RangeView {
  if (range === "ALL") return { weeks: [...points], constrained: false };
  const width = RANGE_WEEKS[range];
  const tail = points.slice(-width);
  const view = [...tail];
  while (view.length < width) view.unshift(padWeek());
  return { weeks: view, constrained: points.length < width };
}

/** Ranges the data actually supports (short histories offer 12W + ALL only). */
export function availableRanges(dataWeekCount: number): TimelineRange[] {
  const out: TimelineRange[] = ["12W", "ALL"];
  if (dataWeekCount >= RANGE_WEEKS["6M"]) out.splice(1, 0, "6M");
  if (dataWeekCount >= RANGE_WEEKS["1Y"]) out.splice(2, 0, "1Y");
  return out;
}

/** Running paid-only total, left to right (pads contribute nothing). */
export function cumulativePaid(points: TimelinePoint[]): number[] {
  let running = 0;
  return points.map((p) => {
    running += p.paidUsd ?? 0;
    return running;
  });
}

export interface EstateContribution {
  propertyId: string;
  receivedUsd: number;
  /** Share of total paid income, 0..100. Paid-only — projections excluded. */
  sharePct: number;
}

/** Per-estate paid composition, ranked largest first. Pending ignored entirely. */
export function estateContribution(entries: EarningsEntry[]): EstateContribution[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.status !== "paid") continue;
    map.set(e.propertyId, (map.get(e.propertyId) ?? 0) + e.amountUsd);
  }
  const total = [...map.values()].reduce((s, v) => s + v, 0);
  if (total <= 0) return [];
  return [...map.entries()]
    .map(([propertyId, receivedUsd]) => ({
      propertyId,
      receivedUsd,
      sharePct: (receivedUsd / total) * 100,
    }))
    .sort((a, b) => b.receivedUsd - a.receivedUsd);
}
