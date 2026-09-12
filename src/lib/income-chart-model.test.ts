// File responsibility: tests for the Slice I observatory chart model — typed
// timeline points, deterministic ranges, paid-only cumulative + composition.
// Missing weeks stay null/empty; nothing is interpolated or fabricated.
import { describe, expect, it } from "vitest";
import {
  buildTimelinePoints,
  applyRange,
  cumulativePaid,
  estateContribution,
  availableRanges,
  type TimelineRange,
} from "@/lib/income-chart-model";
import type { EarningsEntry } from "@/types/earnings";

function entry(overrides: Partial<EarningsEntry>): EarningsEntry {
  return {
    id: "e",
    userId: "u",
    propertyId: "test-a",
    weekOf: "2026-07-13T00:00:00Z",
    amountUsd: 1_000,
    tonAmount: 0,
    shareRatio: 0.1,
    status: "paid",
    ...overrides,
  };
}

const MIXED: EarningsEntry[] = [
  entry({ id: "a1", propertyId: "test-a", weekOf: "2026-07-06T00:00:00Z", amountUsd: 1_000, status: "paid" }),
  entry({ id: "b1", propertyId: "test-b", weekOf: "2026-07-06T00:00:00Z", amountUsd: 2_000, status: "paid" }),
  entry({ id: "a2", propertyId: "test-a", weekOf: "2026-07-13T00:00:00Z", amountUsd: 1_500, status: "paid" }),
  entry({ id: "a3", propertyId: "test-a", weekOf: "2026-07-20T00:00:00Z", amountUsd: 500, status: "pending" }),
];

describe("buildTimelinePoints — typed weekly points", () => {
  it("separates paid and projected per week with counts and estates", () => {
    const points = buildTimelinePoints(MIXED);
    expect(points).toHaveLength(3);
    const first = points[0];
    expect(first.weekOf).toBe("2026-07-06T00:00:00Z");
    expect(first.paidUsd).toBe(3_000);
    expect(first.projectedUsd).toBeNull();
    expect(first.distributionCount).toBe(2);
    expect(first.estateIds).toEqual(["test-a", "test-b"]);
    const last = points[2];
    expect(last.paidUsd).toBeNull();
    expect(last.projectedUsd).toBe(500);
  });

  it("keeps mixed paid+pending weeks on both series", () => {
    const points = buildTimelinePoints([
      entry({ id: "x", weekOf: "2026-07-13T00:00:00Z", amountUsd: 100, status: "paid" }),
      entry({ id: "y", weekOf: "2026-07-13T00:00:00Z", amountUsd: 200, status: "pending" }),
    ]);
    expect(points).toHaveLength(1);
    expect(points[0].paidUsd).toBe(100);
    expect(points[0].projectedUsd).toBe(200);
  });

  it("empty ledger yields no points (never padded fakes)", () => {
    expect(buildTimelinePoints([])).toEqual([]);
  });
});

describe("applyRange — deterministic windows", () => {
  const points = buildTimelinePoints(MIXED);

  it("12W pads empty weeks on the left, marked empty", () => {
    const view = applyRange(points, "12W");
    expect(view.weeks).toHaveLength(12);
    expect(view.weeks.slice(0, 9).every((w) => w.empty)).toBe(true);
    expect(view.weeks.slice(9).every((w) => !w.empty)).toBe(true);
    expect(view.constrained).toBe(true);
  });

  it("ALL shows only weeks with data", () => {
    const view = applyRange(points, "ALL");
    expect(view.weeks).toHaveLength(3);
    expect(view.weeks.every((w) => !w.empty)).toBe(true);
  });

  it("identical input always yields identical output", () => {
    expect(JSON.stringify(applyRange(points, "12W"))).toBe(
      JSON.stringify(applyRange(points, "12W")),
    );
  });
});

describe("availableRanges — honest period support", () => {
  it("offers 12W and ALL for short histories", () => {
    expect(availableRanges(3)).toEqual(["12W", "ALL"] satisfies TimelineRange[]);
  });

  it("unlocks longer ranges only when history covers them", () => {
    expect(availableRanges(30)).toContain("6M" satisfies TimelineRange);
    expect(availableRanges(60)).toContain("1Y" satisfies TimelineRange);
    expect(availableRanges(10)).not.toContain("6M");
  });
});

describe("cumulativePaid — paid-only running total", () => {
  it("accumulates paid left to right, ignoring projected", () => {
    const points = buildTimelinePoints(MIXED);
    expect(cumulativePaid(points)).toEqual([3_000, 4_500, 4_500]);
  });

  it("final total equals the paid-only sum", () => {
    const points = buildTimelinePoints(MIXED);
    const cum = cumulativePaid(points);
    expect(cum[cum.length - 1]).toBe(4_500);
  });
});

describe("estateContribution — paid-only composition", () => {
  it("computes per-estate paid shares that sum to ~100%", () => {
    const rows = estateContribution(MIXED);
    expect(rows).toHaveLength(2);
    const byId = new Map(rows.map((r) => [r.propertyId, r]));
    expect(byId.get("test-a")!.receivedUsd).toBe(2_500);
    expect(byId.get("test-b")!.receivedUsd).toBe(2_000);
    const total = rows.reduce((s, r) => s + r.sharePct, 0);
    expect(total).toBeGreaterThan(99);
    expect(total).toBeLessThanOrEqual(100.01);
    // Ranked: largest first.
    expect(rows[0].propertyId).toBe("test-a");
  });

  it("ignores pending entries entirely", () => {
    const rows = estateContribution([
      entry({ propertyId: "test-a", amountUsd: 500, status: "pending" }),
    ]);
    expect(rows).toEqual([]);
  });
});
