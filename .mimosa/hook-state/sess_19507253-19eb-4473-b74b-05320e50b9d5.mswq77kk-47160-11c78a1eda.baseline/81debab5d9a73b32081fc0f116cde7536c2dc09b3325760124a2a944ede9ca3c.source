import { describe, expect, it } from "vitest";
import {
  addDaysToDay,
  dailyAccrualAtDayIndex,
  dayDiff,
  effectiveMonthlyRatePct,
  installmentUsd,
  payoutIntervalDays,
  utcDay,
} from "./yield-math.js";

describe("effectiveMonthlyRatePct", () => {
  it("keeps monthly rate, subtracts 1pp for weekly", () => {
    expect(effectiveMonthlyRatePct(6, "monthly")).toBe(6);
    expect(effectiveMonthlyRatePct(6, "weekly")).toBe(5);
    expect(effectiveMonthlyRatePct(4.5, "weekly")).toBe(3.5);
    expect(effectiveMonthlyRatePct(7.5, "weekly")).toBe(6.5);
  });
});

describe("installmentUsd — product spec example ($1,000 @ 6%)", () => {
  const principal = 100_000; // $1,000 in cents
  it("monthly pays $60 once", () => {
    expect(installmentUsd(principal, 6, "monthly")).toBe(6_000);
  });
  it("weekly pays $12.50 four times (5% effective)", () => {
    expect(installmentUsd(principal, 6, "weekly")).toBe(1_250);
    expect(installmentUsd(principal, 6, "weekly") * 4).toBe(5_000);
  });
  it("weekly at 4.5% floor: $8.75 per week", () => {
    expect(installmentUsd(principal, 4.5, "weekly")).toBe(875);
  });
});

describe("dailyAccrualAtDayIndex — exact per-period distribution", () => {
  it("monthly: 30 daily accruals sum to exactly the monthly installment", () => {
    const installment = installmentUsd(100_000, 6, "monthly"); // $60
    let sum = 0;
    for (let i = 0; i < 30; i++) sum += dailyAccrualAtDayIndex(100_000, 6, "monthly", i);
    expect(sum).toBe(installment);
    expect(dailyAccrualAtDayIndex(100_000, 6, "monthly", 0)).toBe(200); // $2.00/day
  });

  it("weekly: 7 daily accruals sum to exactly the weekly installment", () => {
    const installment = installmentUsd(100_000, 6, "weekly"); // $12.50
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += dailyAccrualAtDayIndex(100_000, 6, "weekly", i);
    expect(sum).toBe(installment);
  });

  it("remainder lands on the period's last day, then the cycle repeats", () => {
    // 1250 cents / 7 → base 178 on days 0–5, remainder 182 on day 6
    expect(dailyAccrualAtDayIndex(100_000, 6, "weekly", 5)).toBe(178);
    expect(dailyAccrualAtDayIndex(100_000, 6, "weekly", 6)).toBe(182);
    expect(dailyAccrualAtDayIndex(100_000, 6, "weekly", 7)).toBe(178);
    expect(dailyAccrualAtDayIndex(100_000, 6, "weekly", 13)).toBe(182);
  });

  it("non-divisible rates keep exact period totals", () => {
    for (const rate of [4.5, 5.25, 7.5]) {
      for (const period of ["monthly", "weekly"] as const) {
        const interval = payoutIntervalDays(period);
        const installment = installmentUsd(33_333, rate, period);
        let sum = 0;
        for (let i = 0; i < interval; i++)
          sum += dailyAccrualAtDayIndex(33_333, rate, period, i);
        expect(sum).toBe(installment);
      }
    }
  });

  it("negative day index accrues nothing", () => {
    expect(dailyAccrualAtDayIndex(100_000, 6, "monthly", -1)).toBe(0);
  });
});

describe("day helpers (UTC)", () => {
  it("utcDay slices the ISO date", () => {
    expect(utcDay(new Date("2026-08-16T23:59:59.999Z"))).toBe("2026-08-16");
    expect(utcDay(new Date("2026-08-17T00:00:00.000Z"))).toBe("2026-08-17");
  });

  it("addDaysToDay / dayDiff round-trip across month ends", () => {
    expect(addDaysToDay("2026-01-30", 3)).toBe("2026-02-02");
    expect(dayDiff("2026-01-30", "2026-02-02")).toBe(3);
    expect(dayDiff("2026-02-02", "2026-01-30")).toBe(-3);
  });
});

describe("payoutIntervalDays", () => {
  it("monthly = 30d, weekly = 7d", () => {
    expect(payoutIntervalDays("monthly")).toBe(30);
    expect(payoutIntervalDays("weekly")).toBe(7);
  });
});
