import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/hooks/usePortfolio", () => ({ usePortfolio: vi.fn() }));
vi.mock("@/hooks/useMarketplace", () => ({
  useMarketplace: vi.fn(() => ({
    data: [
      { id: "prop-bayside-marina-penthouse", title: "Bayside Marina Penthouse" },
      { id: "prop-alfama-terrace-flat", title: "Alfama Terrace" },
    ],
    isLoading: false, isError: false, refetch: vi.fn(),
  })),
}));

import { usePortfolio } from "@/hooks/usePortfolio";
import PortfolioPage from "@/app/(app)/portfolio/page";
import type { PortfolioSummary } from "@/types/position";

const loaded: PortfolioSummary = {
  totalValueUsd: 2_347_500, // 60*26000 + 75*10500
  totalInvestedUsd: 2_250_000, // 60*25000 + 75*10000
  totalEarningsUsd: 9_000, // paid sum (seed)
  weeklyProjectedUsd: 3_375,
  holdings: [
    { propertyId: "prop-bayside-marina-penthouse", sharesOwned: 60, avgCostUsd: 25000, currentValueUsd: 60 * 26000, pendingWeekEarningsUsd: 1500, shareRatio: 0.075 },
  ],
  openOrders: [],
};

describe("Portfolio page — honesty contract (paid green / pending neutral)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loaded: 'Total earnings' row value is tinted --success (paid = honest green)", () => {
    vi.mocked(usePortfolio).mockReturnValue({ data: loaded, isLoading: false, isError: false, refetch: vi.fn() } as never);
    render(<PortfolioPage />);
    const earningsValue = screen.getByText("$90.00"); // 9000 cents
    expect(earningsValue).toHaveClass("text-success");
    expect(earningsValue).toHaveClass("tnum");
  });

  it("loaded: 'Next payout' row value is NEUTRAL --foreground (pending, NOT green) — honesty", () => {
    vi.mocked(usePortfolio).mockReturnValue({ data: loaded, isLoading: false, isError: false, refetch: vi.fn() } as never);
    render(<PortfolioPage />);
    const nextPayout = screen.getByText("$33.75"); // 3375 cents
    expect(nextPayout).toHaveClass("text-foreground");
    expect(nextPayout).not.toHaveClass("text-success");
    expect(nextPayout).toHaveClass("tnum");
  });

  it("loaded: does NOT render the PAYOUT_DISCLAIMER (only Earnings + Settings carry it)", () => {
    vi.mocked(usePortfolio).mockReturnValue({ data: loaded, isLoading: false, isError: false, refetch: vi.fn() } as never);
    render(<PortfolioPage />);
    expect(screen.queryByText("simulated weekly payout · on-chain verifiable post-MVP")).not.toBeInTheDocument();
  });

  it("loading: renders skeleton placeholders", () => {
    vi.mocked(usePortfolio).mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() } as never);
    const { container } = render(<PortfolioPage />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("empty (no holdings): renders 'No holdings yet' + the Explore Marketplace CTA", () => {
    vi.mocked(usePortfolio).mockReturnValue({ data: { ...loaded, holdings: [] }, isLoading: false, isError: false, refetch: vi.fn() } as never);
    render(<PortfolioPage />);
    expect(screen.getByText("No holdings yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore Marketplace" })).toBeInTheDocument();
  });

  it("error: renders the Retry button", () => {
    vi.mocked(usePortfolio).mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() } as never);
    render(<PortfolioPage />);
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});