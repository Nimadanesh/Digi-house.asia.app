// Mock earnings determinism: the frontend-phase ledger is frozen —
// tickPayout must not flip pending entries, so repeated summaries are identical.
import { describe, it, expect } from "vitest";
import { MockEarningsRepo } from "@/lib/mock/earnings";

describe("mock earnings determinism (frozen ledger)", () => {
  it("tickPayout is a no-op and summaries are stable", async () => {
    const repo = MockEarningsRepo();
    const before = await repo.summary();
    const tick = await repo.tickPayout();
    const after = await repo.summary();

    expect(tick.paidEntries).toBe(0);
    expect(after.allTimeUsd).toBe(before.allTimeUsd);
    expect(after.thisWeekProjectedUsd).toBe(before.thisWeekProjectedUsd);
    expect(after.entries.map((e) => `${e.id}:${e.status}`)).toEqual(
      before.entries.map((e) => `${e.id}:${e.status}`),
    );
  });

  it("seed baseline stays at 3 paid weeks ($1,810.41) with pending expected", async () => {
    const repo = MockEarningsRepo();
    const summary = await repo.summary();
    // 3 weeks × ($294.24 + $309.23) = $1,810.41
    expect(summary.allTimeUsd).toBe(181041);
    expect(summary.thisWeekProjectedUsd).toBe(60347);
    expect(summary.entries.filter((e) => e.status === "paid")).toHaveLength(6);
    expect(summary.entries.filter((e) => e.status === "pending")).toHaveLength(2);
  });
});
