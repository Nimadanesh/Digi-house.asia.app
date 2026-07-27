import { describe, it, expect } from "vitest";
import {
  consecutivePaidWeeks,
  weeklyEarningsBuckets,
  thisWeekStatus,
} from "@/lib/earnings-stats";
import type { EarningsEntry } from "@/types/earnings";

function base(
  over: Partial<EarningsEntry> & Pick<EarningsEntry, "id" | "weekOf" | "status">,
): EarningsEntry {
  return {
    userId: "u1",
    propertyId: "p1",
    amountUsd: 100,
    tonAmount: 1,
    shareRatio: 0.1,
    ...over,
  };
}

describe("earnings-stats", () => {
  it("weeklyEarningsBuckets pads to 8 and aggregates", () => {
    const entries = [
      base({ id: "a", weekOf: "2026-07-06T00:00:00Z", status: "paid", amountUsd: 100 }),
      base({ id: "b", weekOf: "2026-07-06T00:00:00Z", status: "paid", amountUsd: 50 }),
      base({ id: "c", weekOf: "2026-07-13T00:00:00Z", status: "pending", amountUsd: 80 }),
    ];
    const buckets = weeklyEarningsBuckets(entries, 8);
    expect(buckets).toHaveLength(8);
    const week = buckets.find((b) => b.weekOf.startsWith("2026-07-06"));
    expect(week?.totalUsd).toBe(150);
  });

  it("consecutivePaidWeeks skips pending current week", () => {
    const entries = [
      base({ id: "1", weekOf: "2026-06-29T00:00:00Z", status: "paid" }),
      base({ id: "2", weekOf: "2026-07-06T00:00:00Z", status: "paid" }),
      base({ id: "3", weekOf: "2026-07-13T00:00:00Z", status: "paid" }),
      base({ id: "4", weekOf: "2026-07-20T00:00:00Z", status: "pending" }),
    ];
    expect(consecutivePaidWeeks(entries)).toBe(3);
  });

  it("thisWeekStatus pending when any pending", () => {
    expect(
      thisWeekStatus([base({ id: "x", weekOf: "2026-07-20T00:00:00Z", status: "pending" })]),
    ).toBe("pending");
  });
});