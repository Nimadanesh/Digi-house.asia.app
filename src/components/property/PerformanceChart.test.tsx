import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Listing } from "@/types/property";
import { PerformanceChart } from "@/components/property/PerformanceChart";

vi.mock("@/lib/telegram/haptics", () => ({
  haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
}));

const listing: Listing = {
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

describe("PerformanceChart — redesign Phase 3", () => {
  it("renders title, tabs, range pills and the SVG line", () => {
    render(<PerformanceChart listing={listing} />);
    expect(screen.getByText("Performance")).toBeInTheDocument();
    expect(screen.getByTestId("perf-tab-price")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("perf-range-1Y")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("perf-line")).toBeInTheDocument();
    expect(screen.getByText(/Simulated price history/)).toBeInTheDocument();
  });

  it("switches between Price and Yield tabs", () => {
    render(<PerformanceChart listing={listing} />);
    fireEvent.click(screen.getByTestId("perf-tab-yield"));
    expect(screen.getByTestId("perf-tab-yield")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("perf-tab-price")).toHaveAttribute("aria-pressed", "false");
    // Yield values are percentages
    expect(screen.getAllByText(/%$/).length).toBeGreaterThan(0);
  });

  it("switches time ranges", () => {
    render(<PerformanceChart listing={listing} />);
    for (const r of ["1M", "6M", "ALL"]) {
      fireEvent.click(screen.getByTestId(`perf-range-${r}`));
      expect(screen.getByTestId(`perf-range-${r}`)).toHaveAttribute("aria-pressed", "true");
    }
    fireEvent.click(screen.getByTestId("perf-range-1Y"));
    expect(screen.getByTestId("perf-range-1Y")).toHaveAttribute("aria-pressed", "true");
  });
});
