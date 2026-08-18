import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentTrades } from "@/components/property/RecentTrades";
import type { Trade } from "@/types/order";

const useTrades = vi.fn();
vi.mock("@/hooks/useTrades", () => ({
  useTrades: () => useTrades(),
}));

const trades: Trade[] = [
  {
    id: "t1",
    propertyId: "p1",
    priceUsd: 12_500,
    quantity: 4,
    buyFeeUsd: 100,
    sellFeeUsd: 100,
    createdAt: new Date(Date.now() - 60_000).toISOString(),
  },
  {
    id: "t0",
    propertyId: "p1",
    priceUsd: 12_000,
    quantity: 2,
    buyFeeUsd: 100,
    sellFeeUsd: 100,
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
];

describe("RecentTrades — PD-06", () => {
  it("renders the section label header", () => {
    useTrades.mockReturnValue({ data: trades, isLoading: false, isError: false });
    render(<RecentTrades propertyId="p1" />);
    expect(screen.getByText("Recent trades")).toBeInTheDocument();
  });

  it("lists price, quantity, and relative time per fill", () => {
    useTrades.mockReturnValue({ data: trades, isLoading: false, isError: false });
    render(<RecentTrades propertyId="p1" />);
    expect(screen.getByText("$125.00")).toBeInTheDocument();
    expect(screen.getByText("$120.00")).toBeInTheDocument();
    expect(screen.getByText("1m ago")).toBeInTheDocument();
    expect(screen.getByText("1h ago")).toBeInTheDocument();
    expect(screen.getAllByTestId("trade-row")).toHaveLength(2);
  });

  it("tints price green when it rose vs the previous trade, red when it fell", () => {
    useTrades.mockReturnValue({ data: trades, isLoading: false, isError: false });
    render(<RecentTrades propertyId="p1" />);
    // newest (12_500) vs older (12_000) → up → success
    const rows = screen.getAllByTestId("trade-row");
    expect(rows[0]!.firstChild).toHaveClass("text-success");
    // oldest (12_000) has no older trade → neutral foreground
    expect(rows[1]!.firstChild).toHaveClass("text-foreground");
  });

  it("renders the empty state when there are no fills", () => {
    useTrades.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<RecentTrades propertyId="p1" />);
    expect(screen.getByTestId("trades-empty")).toBeInTheDocument();
  });

  it("renders a skeleton while loading", () => {
    useTrades.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<RecentTrades propertyId="p1" />);
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders a muted error line on failure", () => {
    useTrades.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<RecentTrades propertyId="p1" />);
    expect(screen.getByText(/Couldn't load recent trades/)).toBeInTheDocument();
  });
});
