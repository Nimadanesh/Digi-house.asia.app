import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Listing } from "@/types/property";
import { SecondaryPerformanceCharts } from "@/components/property/SecondaryPerformanceCharts";
import { getPropertyAnalytics } from "@/lib/property-analytics";

vi.mock("@/lib/telegram/haptics", () => ({
  haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
}));

const primaryListing: Listing = {
  id: "prop-marina-vista-4b",
  title: "Marina Vista Apt 4B",
  location: "Dubai Marina, UAE",
  description: "x",
  images: [],
  totalShares: 1000,
  sharePriceUsd: 8000,
  status: "funding",
  ownerWalletAddress: "EQAtest",
  annualRentUsd: 520000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 640,
  sharesRemaining: 360,
  fundingProgressRatio: 0.64,
  monthlyYieldRate: 6,
  totalValueUsd: 8_000_000,
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

const secondaryListing: Listing = {
  ...primaryListing,
  id: "prop-bali-sunset-2a",
  title: "Bali Sunset Villa 2A",
  status: "resale",
  sharesSold: 1000,
  sharesRemaining: 0,
  fundingProgressRatio: 1,
  lastTradeUsd: 8400,
};

describe("SecondaryPerformanceCharts — redesign Phase 5", () => {
  it("renders the main chart with price line, OHLC candles and volume underlay", () => {
    render(<SecondaryPerformanceCharts listing={secondaryListing} anchorUsd={8400} />);
    expect(screen.getByTestId("price-chart")).toBeInTheDocument();
    expect(screen.getByTestId("price-svg")).toBeInTheDocument();
    expect(screen.getByTestId("perf-line")).toBeInTheDocument();
    // OHLC candles exist because Phase 4 dataset provides them
    expect(screen.getByTestId("candle-0")).toBeInTheDocument();
    // Volume underlay exists
    expect(screen.getByTestId("volume-0")).toBeInTheDocument();
  });

  it("price series ends exactly at the current anchor price", () => {
    const analytics = getPropertyAnalytics(secondaryListing, Date.now(), { bestAskUsd: 8400 });
    expect(analytics.priceHistory).not.toBeNull();
    const last = analytics.priceHistory![analytics.priceHistory!.length - 1];
    expect(last!.priceUsd).toBe(8400);
  });

  it("switches between Price Performance and Yield Performance", () => {
    render(<SecondaryPerformanceCharts listing={secondaryListing} anchorUsd={8400} />);
    expect(screen.getByTestId("perf-tab-price")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByTestId("perf-tab-yield"));
    expect(screen.getByTestId("perf-tab-yield")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("perf-tab-price")).toHaveAttribute("aria-pressed", "false");
    // Yield mode hides candles and volume (price-only features)
    expect(screen.queryByTestId("candle-0")).not.toBeInTheDocument();
    expect(screen.queryByTestId("volume-0")).not.toBeInTheDocument();
  });

  it("exposes all meaningful timeframes backed by the 52-week dataset", () => {
    render(<SecondaryPerformanceCharts listing={secondaryListing} anchorUsd={8400} />);
    for (const r of ["1M", "3M", "6M", "1Y", "ALL"]) {
      expect(screen.getByTestId(`perf-range-${r}`)).toBeInTheDocument();
    }
    fireEvent.click(screen.getByTestId("perf-range-3M"));
    expect(screen.getByTestId("perf-range-3M")).toHaveAttribute("aria-pressed", "true");
  });
});
