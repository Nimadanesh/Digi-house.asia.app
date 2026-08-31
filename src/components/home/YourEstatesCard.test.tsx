import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { YourEstatesCard } from "@/components/home/YourEstatesCard";
import type { PortfolioSummary } from "@/types/position";

const summary: PortfolioSummary = {
  totalValueUsd: 250_000,
  totalInvestedUsd: 240_000,
  totalEarningsUsd: 12_000,
  weeklyProjectedUsd: 3_375,
  dayChangeRatio: 0.023,
  holdings: [
    {
      propertyId: "prop-a",
      sharesOwned: 20,
      avgCostUsd: 12500,
      currentValueUsd: 150_000,
      pendingWeekEarningsUsd: 200,
      shareRatio: 0.02,
    },
    {
      propertyId: "prop-b",
      sharesOwned: 10,
      avgCostUsd: 12500,
      currentValueUsd: 100_000,
      pendingWeekEarningsUsd: 100,
      shareRatio: 0.01,
    },
  ],
  openOrders: [],
};

describe("YourEstatesCard — ownership hero", () => {
  it("renders total ownership value, calm estates line, and the dominant View My Estates CTA", () => {
    render(<YourEstatesCard summary={summary} />);
    expect(screen.getByTestId("your-estates-card")).toHaveAttribute("href", "/portfolio");
    expect(screen.getByText("Your Estates")).toBeInTheDocument();
    expect(screen.getByTestId("your-estates-amount")).toHaveTextContent("$2,500.00");
    const secondary = screen.getByTestId("your-estates-secondary");
    expect(secondary).toHaveTextContent("2 estates");
    expect(secondary).toHaveTextContent("$2,400.00 Total Invested");
    // YTD rental income counts paid earnings only — the sum of paid entries in the repo contract.
    expect(secondary).toHaveTextContent("+$120.00 rental income YTD");
    expect(screen.getByTestId("your-estates-cta")).toHaveTextContent("View My Estates");
  });

  it("never renders the simulated day-change badge (no trustworthy baseline)", () => {
    render(<YourEstatesCard summary={summary} />);
    expect(screen.queryByTestId("day-change-badge")).not.toBeInTheDocument();
  });

  it("calls the haptic on navigate", () => {
    const onNavigateHaptic = vi.fn();
    render(<YourEstatesCard summary={summary} onNavigateHaptic={onNavigateHaptic} />);
    screen.getByTestId("your-estates-card").click();
    expect(onNavigateHaptic).toHaveBeenCalledTimes(1);
  });
});