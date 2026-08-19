import { describe, expect, it, vi, afterEach } from "vitest";
import {
  usd, usdCompact, ton, shortAddr, pct, weekLabel, weeklyRent, projectedYield,
  annualYieldRatio, annualFromWeekly, payoutCountdown, payoutCountdownLong, payoutCountdownDhms,
  timeAgo,
} from "@/lib/format";

describe("format", () => {
  it("usd formats cents to $X.XX with tabular-nums-aligned precision", () => {
    expect(usd(12500)).toBe("$125.00");
    expect(usd(0)).toBe("$0.00");
    expect(usd(5)).toBe("$0.05");
  });

  it("usdCompact uses K/M suffixes for large amounts", () => {
    expect(usdCompact(8_000)).toBe("$80");
    expect(usdCompact(50_000)).toBe("$500");
    expect(usdCompact(2_000_000)).toBe("$20K");
    expect(usdCompact(150_000)).toBe("$1.5K");
    expect(usdCompact(1_500_000)).toBe("$15K");
    expect(usdCompact(500_000_000)).toBe("$5M");
    expect(usdCompact(1_000_000_000)).toBe("$10M");
  });

  it("ton formats nanoTON as decimal TON, 2–4 fractional digits", () => {
    expect(ton(1_000_000_000n)).toBe("1.00 TON");
    expect(ton(10_500_000n)).toBe("0.0105 TON");
    expect(ton(0n)).toBe("0.00 TON");
  });

  it("shortAddr truncates long addresses and preserves short ones", () => {
    expect(shortAddr("EQARULx2r6JmOuMoQn7jVr8m9Rrjv0s4kq5t8s7q5t8s4kq5")).toBe("EQAR…4kq5");
    expect(shortAddr("EQAB")).toBe("EQAB");
  });

  it("pct renders a 0..1 ratio with 1 decimal under 10% else 0", () => {
    expect(pct(0.005)).toBe("0.5%");
    expect(pct(0.5)).toBe("50%");
    expect(pct(1)).toBe("100%");
  });

  it("weekLabel renders 'Mon D' from an ISO Monday", () => {
    expect(weekLabel("2026-07-20")).toBe("Jul 20");
  });

  it("timeAgo renders short relative time", () => {
    const now = Date.UTC(2026, 6, 26, 12, 0, 0);
    expect(timeAgo(new Date(now - 30_000).toISOString(), now)).toBe("just now");
    expect(timeAgo(new Date(now - 5 * 60_000).toISOString(), now)).toBe("5m ago");
    expect(timeAgo(new Date(now - 2 * 3_600_000).toISOString(), now)).toBe("2h ago");
    expect(timeAgo(new Date(now - 3 * 86_400_000).toISOString(), now)).toBe("3d ago");
  });

  it("weeklyRent floors annual rent / 52 to integer cents", () => {
    expect(weeklyRent(52_0000)).toBe(1_0000);     // $5,200 / 52 = $100.00 -> 10000 cents
    expect(weeklyRent(52_0001)).toBe(1_0000);     // floor
  });

  it("projectedYield floors weekly × share ratio to cents", () => {
    // weekly 10000 cents * 5 shares / 1000 total = 50 cents
    expect(projectedYield(10_000, 5, 1000)).toBe(50);
    expect(projectedYield(10_000, 0, 1000)).toBe(0);
    expect(projectedYield(10_000, 5, 0)).toBe(0);   // totalShares=0 guard
  });

  it("annualYieldRatio is rent / total value", () => {
    expect(annualYieldRatio(520_000, 12_500_000)).toBeCloseTo(0.0416, 4);
    expect(annualYieldRatio(100, 0)).toBe(0);
  });

  it("annualFromWeekly multiplies by 52", () => {
    expect(annualFromWeekly(500)).toBe(26_000);
  });
});

describe("format.payoutCountdown", () => {
  afterEach(() => vi.useRealTimers());

  it("returns days+hours when the next Sunday is >=1 day away", () => {
    // 2026-07-24 10:00 UTC → next Sunday = 2026-07-26 00:00 UTC
    const sampleNow: number = Date.UTC(2026, 6, 24, 10, 0, 0);
    expect(payoutCountdown(sampleNow)).toBe("in 1d 14h");
  });

  it("returns hours-only when under 24h to Sunday", () => {
    // 2026-07-25 22:00 UTC -> next Sunday 2026-07-26 00:00 = 2h away
    const near: number = Date.UTC(2026, 6, 25, 22, 0, 0);
    expect(payoutCountdown(near)).toBe("in 2h");
  });

  it("returns minutes-only when under 1h to Sunday", () => {
    const t: number = Date.UTC(2026, 6, 25, 23, 48, 0);
    expect(payoutCountdown(t)).toBe("in 12m");
  });

  it("rolls over to next week if now is Sunday after midnight", () => {
    // 2026-07-26 02:00 UTC (Sunday, after payout). Next Sunday = 2026-08-02 00:00.
    const after: number = Date.UTC(2026, 6, 26, 2, 0, 0);
    expect(payoutCountdown(after)).toBe("in 6d 22h");
  });
});

describe("format.payoutCountdownLong", () => {
  it("returns long English units for Home card", () => {
    const sampleNow: number = Date.UTC(2026, 6, 24, 10, 0, 0);
    expect(payoutCountdownLong(sampleNow)).toBe("1 day 14 hours");
  });
});

describe("format.payoutCountdownDhms", () => {
  it("returns d-h-m-s countdown", () => {
    const sampleNow: number = Date.UTC(2026, 6, 24, 10, 0, 0);
    expect(payoutCountdownDhms(sampleNow)).toBe("1d - 14h - 00m - 00s");
  });
});
