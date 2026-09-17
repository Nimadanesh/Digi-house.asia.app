import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { PortfolioSummary } from "@/types/position";
import { usd } from "@/lib/format";

const back = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back, push: vi.fn(), replace: vi.fn() }),
}));

const usePortfolio = vi.fn();
vi.mock("@/hooks/usePortfolio", () => ({ usePortfolio: () => usePortfolio() }));

import CardPage from "@/app/(app)/card/page";

const summary: PortfolioSummary = {
  totalValueUsd: 2_558_700,
  totalInvestedUsd: 2_400_000,
  totalEarningsUsd: 1_200_000,
  weeklyProjectedUsd: 337_500,
  dayChangeRatio: 0.023,
  holdings: [
    {
      propertyId: "re-128862",
      sharesOwned: 20,
      avgCostUsd: 12500,
      currentValueUsd: 250_000,
      pendingWeekEarningsUsd: 200,
      shareRatio: 0.02,
    },
  ],
  openOrders: [],
};

describe("Card page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loading state", () => {
    usePortfolio.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() });
    render(<CardPage />);
    expect(screen.getByTestId("card-loading")).toBeInTheDocument();
  });

  it("error state with retry", () => {
    usePortfolio.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() });
    render(<CardPage />);
    expect(screen.getByTestId("card-error")).toBeInTheDocument();
  });

  it("shows the live Home balance with F.Luxe branding (never VISA)", () => {
    usePortfolio.mockReturnValue({ data: summary, isLoading: false, isError: false, refetch: vi.fn() });
    render(<CardPage />);
    expect(screen.getByTestId("card-page")).toBeInTheDocument();
    expect(screen.getByTestId("card-balance")).toHaveTextContent(usd(summary.totalValueUsd));
    expect(screen.getByTestId("card-preview")).toHaveTextContent("F.Luxe");
    expect(screen.queryByText(/visa/i)).not.toBeInTheDocument();
  });

  it("shows headline, benefits, CTA and support line", () => {
    usePortfolio.mockReturnValue({ data: summary, isLoading: false, isError: false, refetch: vi.fn() });
    render(<CardPage />);
    expect(screen.getByTestId("card-badge")).toHaveTextContent("New class Asset");
    expect(screen.getByRole("heading", { name: "Own your credit card" })).toBeInTheDocument();
    expect(screen.getByText("Track your balance in one place")).toBeInTheDocument();
    expect(screen.getByText("Access your fractional portfolio")).toBeInTheDocument();
    expect(screen.getByText("Unlock premium card benefits")).toBeInTheDocument();
    expect(screen.getByTestId("card-cta")).toHaveTextContent("Get Your F.Luxe Card");
    expect(screen.getByText("Secure payment. Cancel anytime.")).toBeInTheDocument();
  });

  it("close returns via router.back()", () => {
    usePortfolio.mockReturnValue({ data: summary, isLoading: false, isError: false, refetch: vi.fn() });
    render(<CardPage />);
    fireEvent.click(screen.getByTestId("card-close"));
    expect(back).toHaveBeenCalledOnce();
  });

  it("no ownership: zero balance, never hardcoded", () => {
    usePortfolio.mockReturnValue({
      data: { ...summary, holdings: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(<CardPage />);
    expect(screen.getByTestId("card-balance")).toHaveTextContent(usd(0));
  });
});
