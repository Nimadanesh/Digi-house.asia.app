import { describe, it, expect } from "vitest";
import type { Listing } from "@/types/property";
import { performanceSeries } from "@/lib/performance-series";

const listing: Listing = {
  id: "prop-marina-vista-4b",
  title: "Marina Vista Apt 4B",
  location: "Dubai Marina, UAE",
  description: "x",
  images: [],
  totalShares: 1000,
  sharePriceUsd: 8000,
  status: "resale",
  ownerWalletAddress: "EQAtest",
  annualRentUsd: 520000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 1000,
  sharesRemaining: 0,
  fundingProgressRatio: 1,
  monthlyYieldRate: 6,
  totalValueUsd: 8_000_000,
  lastTradeUsd: 8200,
  meta: {
    sizeSqm: 72,
    yearBuilt: 2019,
    propertyType: "Apartment",
    rentalStatus: "rented",
    leaseUntil: null,
    activeTenant: true,
    tokenizationDocUrl: "#",
  },
  rentalHistory: [],
};

describe("performanceSeries", () => {
  it("returns the right number of weekly points per range", () => {
    const now = Date.UTC(2026, 7, 25);
    expect(performanceSeries(listing, "1M", now)).toHaveLength(4);
    expect(performanceSeries(listing, "6M", now)).toHaveLength(26);
    expect(performanceSeries(listing, "1Y", now)).toHaveLength(52);
    expect(performanceSeries(listing, "ALL", now)).toHaveLength(104);
  });

  it("anchors the last price to the passed anchor (source of truth), not lastTradeUsd", () => {
    const now = Date.UTC(2026, 7, 25);
    const pts = performanceSeries(listing, "1Y", now);
    expect(pts[pts.length - 1].priceUsd).toBe(8000); // default anchor
    const anchored = performanceSeries(listing, "ALL", now, 25_100);
    expect(anchored[anchored.length - 1].priceUsd).toBe(25_100);
  });

  it("is deterministic for the same property + range", () => {
    const now = Date.UTC(2026, 7, 25);
    const a = performanceSeries(listing, "6M", now);
    const b = performanceSeries(listing, "6M", now);
    expect(a).toEqual(b);
  });

  it("yield ratio uses the existing annual-rent-over-value helper", () => {
    const now = Date.UTC(2026, 7, 25);
    const pts = performanceSeries(listing, "1M", now);
    const last = pts[pts.length - 1];
    // annualRent 520000 / value 1000 × 8000 (default anchor) = 0.065
    expect(last.yieldRatio).toBeCloseTo(520000 / 8_000_000, 6);
  });
});
