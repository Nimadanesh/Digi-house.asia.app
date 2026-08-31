import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import type { Trade } from "@/types/order";
import { MarketSection } from "@/components/property/MarketSection";

const useTrades = vi.fn();
vi.mock("@/hooks/useTrades", () => ({
  useTrades: () => useTrades(),
}));

const listing = {
  id: "prop-marina-vista-4b",
  status: "resale",
} as Listing;

const book: OrderBookState = {
  propertyId: listing.id,
  bids: [
    { priceUsd: 12_400, quantity: 10, cumulative: 10 },
    { priceUsd: 12_300, quantity: 8, cumulative: 18 },
    { priceUsd: 12_200, quantity: 6, cumulative: 24 },
    { priceUsd: 12_100, quantity: 4, cumulative: 28 },
    { priceUsd: 12_000, quantity: 2, cumulative: 30 },
    { priceUsd: 11_900, quantity: 1, cumulative: 31 },
  ],
  asks: [
    { priceUsd: 12_600, quantity: 5, cumulative: 5 },
    { priceUsd: 12_700, quantity: 7, cumulative: 12 },
    { priceUsd: 12_800, quantity: 9, cumulative: 21 },
    { priceUsd: 12_900, quantity: 3, cumulative: 24 },
    { priceUsd: 13_000, quantity: 2, cumulative: 26 },
    { priceUsd: 13_100, quantity: 1, cumulative: 27 },
  ],
  bestBidUsd: 12_400,
  bestAskUsd: 12_600,
  lastTradeUsd: 12_500,
};

function trade(id: string, n: number): Trade {
  return {
    id,
    propertyId: listing.id,
    priceUsd: 12_500,
    quantity: 1,
    buyFeeUsd: 0,
    sellFeeUsd: 0,
    createdAt: new Date(Date.now() - n * 60_000).toISOString(),
  };
}

describe("MarketSection — redesign Phase 4", () => {
  it("shows Resale market title with Best asking price / Best offer (ownership vocabulary)", () => {
    useTrades.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<MarketSection listing={listing} orderBook={book} />);
    expect(screen.getByText("Resale market")).toBeInTheDocument();
    expect(screen.getByText("Best asking price")).toBeInTheDocument();
    expect(screen.getByText("Best offer")).toBeInTheDocument();
    expect(screen.getByTestId("best-ask")).toHaveTextContent("$126.00");
    expect(screen.getByTestId("best-bid")).toHaveTextContent("$124.00");
    expect(screen.getByTestId("book-last-price")).toHaveTextContent("$125.00");
  });

  it("renders a compact book — at most 4 levels per side", () => {
    useTrades.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<MarketSection listing={listing} orderBook={book} />);
    const prices = screen.getAllByText(/^\$\d+\.\d{2}$/);
    // 4 bids + 4 asks + best bid/ask (2) + last price (1) + summary current price + spread (2) = 13 max
    expect(prices.length).toBeLessThanOrEqual(13);
    expect(screen.queryByText("$119.00")).not.toBeInTheDocument();
    expect(screen.queryByText("$131.00")).not.toBeInTheDocument();
  });

  it("caps recent trades at 5", () => {
    const many = Array.from({ length: 9 }, (_, i) => trade(`t${i}`, i + 1));
    useTrades.mockReturnValue({ data: many, isLoading: false, isError: false });
    render(<MarketSection listing={listing} orderBook={book} />);
    expect(screen.getAllByTestId("trade-row")).toHaveLength(5);
  });

  it("shows an em-dash placeholder when the book has no best prices", () => {
    useTrades.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(
      <MarketSection
        listing={listing}
        orderBook={{ propertyId: listing.id, bids: [], asks: [] }}
      />,
    );
    expect(screen.getByTestId("best-bid")).toHaveTextContent("—");
    expect(screen.getByTestId("best-ask")).toHaveTextContent("—");
  });

  it("shows the skeleton while the book loads", () => {
    useTrades.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<MarketSection listing={listing} />);
    expect(screen.getByTestId("market-skeleton")).toBeInTheDocument();
  });
});
