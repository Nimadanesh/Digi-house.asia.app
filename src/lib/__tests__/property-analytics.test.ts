// File responsibility: Phase 4 data-integrity tests for the shared analytics
// datasets (REDESIGN-SPEC §15 required relationships + Phase 4 validation list).
// These tests are the coherence gate for Phases 5–7: totals, percentages, date
// order, final/current alignment, and the Primary fixed-price rule.
import { describe, it, expect } from "vitest";
import type { Listing } from "@/types/property";
import { PROPERTIES } from "@/lib/mock/seed/properties";
import { getCurrentSharePrice } from "@/lib/property-price";
import {
  getPropertyAnalytics,
  sliceRange,
  priceToOhlc,
  type PricePoint,
} from "@/lib/property-analytics";

const NOW = Date.UTC(2026, 7, 25, 12); // 2026-08-25T12:00:00Z — fixed for determinism

const primary = PROPERTIES.find((p) => p.status === "funding")!;
const secondary = PROPERTIES.find((p) => p.status !== "funding")!;

function listingOf(p: Listing): Listing {
  return p;
}

describe("property analytics — determinism", () => {
  it("is deterministic for the same property + instant", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    const b = getPropertyAnalytics(listingOf(secondary), NOW);
    expect(a).toEqual(b);
  });

  it("is stable within a day but keyed per property", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    const b = getPropertyAnalytics(listingOf(secondary), NOW + 3_600_000);
    // Same-day instants share the noise seed; both end at the same current price.
    expect(b.priceHistory![b.priceHistory!.length - 1]!.priceUsd).toBe(
      a.priceHistory![a.priceHistory!.length - 1]!.priceUsd,
    );
    const other = PROPERTIES.find((p) => p.id !== secondary.id && p.status !== "funding")!;
    const c = getPropertyAnalytics(listingOf(other), NOW);
    expect(c.propertyId).toBe(other.id);
    expect(c.priceHistory![c.priceHistory!.length - 1]!.priceUsd).not.toBe(
      a.priceHistory![a.priceHistory!.length - 1]!.priceUsd,
    );
  });
});

describe("property analytics — coverage", () => {
  it("every seeded property yields a complete dataset", () => {
    for (const p of PROPERTIES) {
      const a = getPropertyAnalytics(listingOf(p), NOW);
      expect(a.propertyId, p.id).toBe(p.id);
      expect(a.status, p.id).toBe(p.status);
      expect(a.holders.length, p.id).toBeGreaterThan(0);
      expect(a.ownershipHistory.length, p.id).toBe(52);
      expect(a.incomeHistory.length, p.id).toBe(12);
      expect(a.metrics.totalShares, p.id).toBe(p.totalShares);
    }
  });

  it("history spans ~12 months: 52 weekly points, 12 monthly income points", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    expect(a.priceHistory).toHaveLength(52);
    expect(a.ohlc).toHaveLength(52);
    expect(a.incomeHistory).toHaveLength(12);
    expect(a.ownershipHistory).toHaveLength(52);
  });

  it("Secondary gets price/OHLC/trades; Primary does NOT (fixed offering price)", () => {
    const sec = getPropertyAnalytics(listingOf(secondary), NOW);
    expect(sec.priceHistory).not.toBeNull();
    expect(sec.ohlc).not.toBeNull();
    expect(sec.trades).not.toBeNull();
    expect(sec.fundingHistory).toBeNull();

    const pri = getPropertyAnalytics(listingOf(primary), NOW);
    expect(pri.priceHistory).toBeNull();
    expect(pri.ohlc).toBeNull();
    expect(pri.trades).toBeNull();
    expect(pri.fundingHistory).not.toBeNull();
  });
});

describe("property analytics — price series integrity (Secondary)", () => {
  it("final price point === getCurrentSharePrice() (single source of truth)", () => {
    for (const p of PROPERTIES.filter((x) => x.status !== "funding")) {
      const a = getPropertyAnalytics(listingOf(p), NOW);
      const last = a.priceHistory![a.priceHistory!.length - 1]!;
      expect(last.priceUsd, p.id).toBe(getCurrentSharePrice(p));
    }
  });

  it("dates are strictly ascending weekly ISO timestamps ending at now", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    const ats = a.priceHistory!.map((pt) => pt.at);
    const parsed = ats.map((at) => Date.parse(at));
    for (let i = 1; i < parsed.length; i++) {
      expect(parsed[i]!, `${secondary.id} idx ${i}`).toBeGreaterThan(parsed[i - 1]!);
    }
    // ~7-day spacing across the whole series (52 weeks ≈ 364 days).
    const spanDays = (parsed[parsed.length - 1]! - parsed[0]!) / 86_400_000;
    expect(spanDays).toBeGreaterThan(350);
    expect(spanDays).toBeLessThan(372);
    expect(parsed[parsed.length - 1]!).toBe(NOW);
  });

  it("variation is measured, real-estate-like — no crypto-like swings", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    const prices = a.priceHistory!.map((pt) => pt.priceUsd);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    // Full-year band stays within ±25% of the current price.
    expect(min).toBeGreaterThan(a.metrics.valuePerShareUsd * 0.75);
    expect(max).toBeLessThan(a.metrics.valuePerShareUsd * 1.25);
    // No single weekly move exceeds ±5%.
    for (let i = 1; i < prices.length; i++) {
      const move = Math.abs(prices[i]! - prices[i - 1]!) / prices[i - 1]!;
      expect(move, `${secondary.id} week ${i}`).toBeLessThan(0.05);
    }
  });

  it("OHLC bars bracket their close and chain open→close across weeks", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    const bars = a.ohlc!;
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i]!;
      expect(b.highUsd, `idx ${i}`).toBeGreaterThanOrEqual(Math.max(b.openUsd, b.closeUsd));
      expect(b.lowUsd, `idx ${i}`).toBeLessThanOrEqual(Math.min(b.openUsd, b.closeUsd));
      if (i > 0) expect(b.openUsd, `idx ${i}`).toBe(bars[i - 1]!.closeUsd);
    }
    expect(bars[bars.length - 1]!.closeUsd).toBe(getCurrentSharePrice(secondary));
  });

  it("volume is present, non-negative, and consistent between priceHistory and OHLC", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    a.priceHistory!.forEach((pt, i) => {
      expect(pt.volumeShares, `idx ${i}`).toBeGreaterThanOrEqual(0);
      expect(pt.volumeShares, `idx ${i}`).toBe(a.ohlc![i]!.volumeShares);
    });
  });

  it("trades are sampled from the same walk and align with priceHistory points", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    const byAt = new Map(a.priceHistory!.map((pt) => [pt.at, pt.priceUsd]));
    expect(a.trades!.length).toBeGreaterThan(0);
    for (const t of a.trades!) {
      expect(byAt.get(t.at), t.id).toBe(t.priceUsd);
      expect(t.quantity, t.id).toBeGreaterThan(0);
      expect(["buy", "sell"], t.id).toContain(t.side);
    }
  });

  it("priceToOhlc reproduces the stored bars from the public price series", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    const rebuilt = priceToOhlc(a.priceHistory as PricePoint[]);
    expect(rebuilt.map((b) => b.closeUsd)).toEqual(a.ohlc!.map((b) => b.closeUsd));
  });

  it("sliceRange returns the requested window, newest last", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    expect(sliceRange(a.priceHistory!, "1M")).toHaveLength(4);
    expect(sliceRange(a.priceHistory!, "3M")).toHaveLength(13);
    expect(sliceRange(a.priceHistory!, "6M")).toHaveLength(26);
    expect(sliceRange(a.priceHistory!, "1Y")).toHaveLength(52);
    const last4 = sliceRange(a.priceHistory!, "1M");
    expect(last4[last4.length - 1]!.at).toBe(a.priceHistory![a.priceHistory!.length - 1]!.at);
  });
});

describe("property analytics — holder integrity", () => {
  it("holder share totals === totalShares for every property", () => {
    for (const p of PROPERTIES) {
      const a = getPropertyAnalytics(listingOf(p), NOW);
      const total = a.holders.reduce((s, h) => s + h.shares, 0);
      expect(total, p.id).toBe(p.totalShares);
    }
  });

  it("holder weights are integer bps summing to exactly 10_000", () => {
    for (const p of PROPERTIES) {
      const a = getPropertyAnalytics(listingOf(p), NOW);
      const bps = a.holders.reduce((s, h) => s + h.weightBps, 0);
      expect(bps, p.id).toBe(10_000);
      for (const h of a.holders) {
        expect(h.weightBps, `${p.id}:${h.label}`).toBeGreaterThan(0);
        expect(h.shares, `${p.id}:${h.label}`).toBeGreaterThan(0);
      }
    }
  });

  it("no holder exceeds the total; labels are anonymized bucket keys", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    for (const h of a.holders) {
      expect(h.shares).toBeLessThanOrEqual(secondary.totalShares);
      expect(h.label).toMatch(/^holder\.[A-F]$/);
    }
  });

  it("ownership history: totals === totalShares, bps === 10_000 at EVERY point", () => {
    for (const p of PROPERTIES) {
      const a = getPropertyAnalytics(listingOf(p), NOW);
      for (const point of a.ownershipHistory) {
        const total = point.buckets.reduce((s, b) => s + b.shares, 0);
        expect(total, `${p.id} @ ${point.at}`).toBe(p.totalShares);
        const bps = point.buckets.reduce((s, b) => s + b.weightBps, 0);
        expect(bps, `${p.id} @ ${point.at}`).toBe(10_000);
      }
    }
  });

  it("ownership history dates ascend and the final point IS the current distribution", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    const ats = a.ownershipHistory.map((pt) => Date.parse(pt.at));
    for (let i = 1; i < ats.length; i++) {
      expect(ats[i]!).toBeGreaterThan(ats[i - 1]!);
    }
    const finalPoint = a.ownershipHistory[a.ownershipHistory.length - 1]!;
    expect(finalPoint.buckets).toEqual(a.holders);
    expect(Date.parse(finalPoint.at)).toBe(NOW);
  });

  it("ownership history leads logically to the current state (bounded drift)", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    const first = a.ownershipHistory[0]!;
    const currentWeights = a.holders.map((h) => h.weightBps / 10_000);
    for (let i = 0; i < first.buckets.length; i++) {
      const oldest = first.buckets[i]!.weightBps / 10_000;
      const now = currentWeights[i]!;
      // 12 months of organic drift — not a teleporting distribution.
      expect(Math.abs(oldest - now), `bucket ${i}`).toBeLessThan(0.15);
    }
  });
});

describe("property analytics — funding history (Primary)", () => {
  it("ends exactly at the current (sharesSold, progressRatio); starts at 0", () => {
    const a = getPropertyAnalytics(listingOf(primary), NOW);
    const hist = a.fundingHistory!;
    expect(hist[0]!.sharesSold).toBe(0);
    const last = hist[hist.length - 1]!;
    expect(last.sharesSold).toBe(primary.sharesSold);
    expect(last.progressRatio).toBeCloseTo(primary.fundingProgressRatio, 9);
    expect(Date.parse(last.at)).toBe(NOW);
  });

  it("cumulative sold is monotonically non-decreasing and never exceeds the target", () => {
    for (const p of PROPERTIES.filter((x) => x.status === "funding")) {
      const a = getPropertyAnalytics(listingOf(p), NOW);
      let prev = 0;
      for (const point of a.fundingHistory!) {
        expect(point.sharesSold, `${p.id} @ ${point.at}`).toBeGreaterThanOrEqual(prev);
        expect(point.sharesSold, `${p.id} @ ${point.at}`).toBeLessThanOrEqual(p.sharesSold);
        expect(point.progressRatio, `${p.id} @ ${point.at}`).toBeCloseTo(
          point.sharesSold / p.totalShares,
          9,
        );
        prev = point.sharesSold;
      }
    }
  });

  it("Primary never simulates offer-price volatility: no price series exists", () => {
    for (const p of PROPERTIES.filter((x) => x.status === "funding")) {
      const a = getPropertyAnalytics(listingOf(p), NOW);
      expect(a.priceHistory, p.id).toBeNull();
      expect(a.ohlc, p.id).toBeNull();
      expect(a.trades, p.id).toBeNull();
      // The only price surfaced is the fixed offering price.
      expect(a.metrics.valuePerShareUsd, p.id).toBe(p.sharePriceUsd);
    }
  });
});

describe("property analytics — income history", () => {
  it("12 ascending monthly keys ending at the current month; pool correlates with rent", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    const months = a.incomeHistory.map((pt) => pt.month);
    expect(months[months.length - 1]).toBe("2026-08");
    for (let i = 1; i < months.length; i++) {
      expect(months[i]! > months[i - 1]!).toBe(true);
    }
    const monthlyBase = Math.floor(secondary.annualRentUsd / 12);
    for (const pt of a.incomeHistory) {
      // Bounded ±5% around the contractual monthly pool.
      expect(pt.poolUsd).toBeGreaterThan(monthlyBase * 0.95);
      expect(pt.poolUsd).toBeLessThan(monthlyBase * 1.05);
    }
  });

  it("per-share × totalShares is consistent with the pool (floor rounding)", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    for (const pt of a.incomeHistory) {
      expect(pt.perShareUsd).toBe(Math.floor(pt.poolUsd / secondary.totalShares));
      expect(pt.perShareUsd * secondary.totalShares).toBeLessThanOrEqual(pt.poolUsd);
    }
  });

  it("payout dates are ISO and fall on the payout day of their month", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    for (const pt of a.incomeHistory) {
      const d = new Date(pt.paidAt);
      expect(pt.paidAt, pt.month).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(d.getUTCDate()).toBe(2);
      expect(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`).toBe(
        pt.month,
      );
    }
  });
});

describe("property analytics — metrics derived only from existing fields", () => {
  it("metrics re-derive exactly from the listing (nothing fabricated)", () => {
    const a = getPropertyAnalytics(listingOf(secondary), NOW);
    expect(a.metrics.totalValueUsd).toBe(secondary.totalValueUsd);
    expect(a.metrics.annualRentUsd).toBe(secondary.annualRentUsd);
    expect(a.metrics.grossYieldRatio).toBeCloseTo(
      secondary.annualRentUsd / secondary.totalValueUsd,
      9,
    );
    expect(a.metrics.annualYieldRatePct).toBeCloseTo(secondary.monthlyYieldRate * 12, 9);
    expect(a.metrics.totalShares).toBe(secondary.totalShares);
    expect(a.metrics.sharesSold).toBe(secondary.sharesSold);
    expect(a.metrics.valuePerShareUsd).toBe(getCurrentSharePrice(secondary));
  });
});
