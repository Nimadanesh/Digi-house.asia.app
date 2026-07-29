import { describe, expect, it } from "vitest";
import { tonFromUsdCents } from "./constants.js";
import {
  buildEarningsSummary,
  formatWeekOf,
  type EarningsEntryInput,
} from "./map-earnings.js";

/**
 * Proportional invariant (DATA_MODELS §6 / ROADMAP yield):
 *   amountUsd === Math.floor(rentPoolUsd * shareRatio)
 * Dust stays undistributed (no float cents).
 */
describe("proportional floor invariant", () => {
  it("amountUsd === floor(rentPoolUsd * shareRatio)", () => {
    const rentPoolUsd = 20_000;
    const shareRatio = 0.2;
    const amountUsd = Math.floor(rentPoolUsd * shareRatio);
    expect(amountUsd).toBe(4000);

    const summary = buildEarningsSummary([
      {
        id: "e1",
        userId: "u1",
        propertyId: "prop-bayside-marina-penthouse",
        weekOf: "2026-06-29",
        amountUsd,
        tonAmount: tonFromUsdCents(amountUsd),
        shareRatio,
        status: "paid",
        txHash: "simulated:test-1",
      },
    ]);
    expect(summary.entries[0]!.amountUsd).toBe(amountUsd);
    expect(summary.entries[0]!.amountUsd).toBe(
      Math.floor(rentPoolUsd * shareRatio),
    );
  });

  it("floors dust (no float cents)", () => {
    // rentPool=100, ratio=1/3 → floor(33.333…)=33
    expect(Math.floor(100 * (1 / 3))).toBe(33);
    const amountUsd = Math.floor(100 * (1 / 3));
    const summary = buildEarningsSummary([
      {
        id: "dust",
        userId: "u1",
        propertyId: "prop-a",
        weekOf: "2026-06-29",
        amountUsd,
        tonAmount: tonFromUsdCents(amountUsd),
        shareRatio: 1 / 3,
        status: "pending",
        txHash: null,
      },
    ]);
    expect(summary.entries[0]!.amountUsd).toBe(33);
    expect(Number.isInteger(summary.entries[0]!.amountUsd)).toBe(true);
  });

  it("alfama mock: floor(25000 * 0.2) === 5000", () => {
    expect(Math.floor(25_000 * 0.2)).toBe(5000);
  });
});

describe("formatWeekOf", () => {
  it("normalizes YYYY-MM-DD to Monday midnight UTC Z", () => {
    expect(formatWeekOf("2026-06-29")).toBe("2026-06-29T00:00:00Z");
  });

  it("keeps full ISO Z form", () => {
    expect(formatWeekOf("2026-07-20T00:00:00Z")).toBe(
      "2026-07-20T00:00:00Z",
    );
  });
});

describe("buildEarningsSummary", () => {
  const base = (
    over: Partial<EarningsEntryInput> & Pick<
      EarningsEntryInput,
      "id" | "weekOf" | "status" | "amountUsd"
    >,
  ): EarningsEntryInput => ({
    userId: "user-a",
    propertyId: "prop-bayside-marina-penthouse",
    tonAmount: tonFromUsdCents(over.amountUsd),
    shareRatio: 0.2,
    txHash: over.status === "paid" ? `simulated:${over.id}` : null,
    ...over,
  });

  it("returns empty zeros", () => {
    expect(buildEarningsSummary([])).toEqual({
      allTimeUsd: 0,
      thisWeekProjectedUsd: 0,
      projectedNextWeekUsd: 0,
      entries: [],
    });
  });

  it("aggregates paid vs pending and sorts newest week first", () => {
    const summary = buildEarningsSummary([
      base({
        id: "old",
        weekOf: "2026-06-29",
        status: "paid",
        amountUsd: 4000,
        propertyId: "prop-z",
      }),
      base({
        id: "new-b",
        weekOf: "2026-07-20",
        status: "pending",
        amountUsd: 4000,
        propertyId: "prop-bayside-marina-penthouse",
      }),
      base({
        id: "new-a",
        weekOf: "2026-07-20",
        status: "pending",
        amountUsd: 5000,
        propertyId: "prop-alfama-terrace-flat",
      }),
      base({
        id: "mid",
        weekOf: "2026-07-06",
        status: "paid",
        amountUsd: 4000,
      }),
    ]);

    expect(summary.allTimeUsd).toBe(8000);
    expect(summary.thisWeekProjectedUsd).toBe(9000);
    expect(summary.projectedNextWeekUsd).toBe(9000);
    expect(summary.entries.map((e) => e.id)).toEqual([
      "new-a",
      "new-b",
      "mid",
      "old",
    ]);
    expect(summary.entries[0]!.txHash).toBeUndefined();
    expect(summary.entries.find((e) => e.id === "mid")!.txHash).toBe(
      "simulated:mid",
    );
  });
});
