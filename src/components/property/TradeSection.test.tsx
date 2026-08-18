import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TradeSection } from "@/components/property/TradeSection";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import type { FeeTier } from "@/types/fees";

const usePortfolio = vi.fn();
vi.mock("@/hooks/usePortfolio", () => ({
  usePortfolio: () => usePortfolio(),
}));

const useLocks = vi.fn();
vi.mock("@/hooks/useLocks", () => ({
  useLocks: () => useLocks(),
  useMeSummary: vi.fn(() => ({ data: undefined, isLoading: false })),
  useCreateLock: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null })),
  useRequestUnlock: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null })),
  activeLocksForProperty: vi.fn(() => []),
}));

const useTrades = vi.fn();
vi.mock("@/hooks/useTrades", () => ({
  useTrades: () => useTrades(),
}));

const useFees = vi.fn();
vi.mock("@/hooks/useFees", () => ({
  useFees: () => useFees(),
}));

const placeOrder = vi.fn();
vi.mock("@/hooks/useSells", () => ({
  useInstantSell: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null })),
  usePlaceOrder: () => placeOrder(),
}));

const tiers: FeeTier[] = [
  {
    id: 1,
    minAmountUsd: 8_000,
    maxAmountUsd: 50_000,
    buyPrimaryBps: 300,
    buySecondaryBps: 90,
    sellSecondaryBps: 90,
  },
];

const listing: Listing = {
  id: "prop-tbilisi-riverhouse-loft",
  title: "Tbilisi Riverhouse Loft",
  location: "Tbilisi",
  description: "d",
  images: ["/images/properties/p5.png"],
  totalShares: 600,
  sharePriceUsd: 12_000,
  status: "resale",
  ownerWalletAddress: "EQA",
  annualRentUsd: 6376320,
  createdAt: "2026-01-01T00:00:00Z",
  sharesSold: 600,
  sharesRemaining: 0,
  fundingProgressRatio: 1,
  monthlyYieldRate: 7.38,
  totalValueUsd: 44_000_000,
  meta: {
    sizeSqm: 110,
    yearBuilt: 2022,
    propertyType: "Loft",
    rentalStatus: "rented",
    leaseUntil: "2027-03-01",
    activeTenant: true,
    tokenizationDocUrl: "#",
  },
  rentalHistory: [],
};

const book: OrderBookState = {
  propertyId: listing.id,
  bids: [{ priceUsd: 11_800, quantity: 5, cumulative: 5 }],
  asks: [{ priceUsd: 12_200, quantity: 4, cumulative: 4 }],
  bestBidUsd: 11_800,
  bestAskUsd: 12_200,
  lastTradeUsd: 12_000,
};

describe("TradeSection — PD-06", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePortfolio.mockReturnValue({ data: { holdings: [] }, isLoading: false });
    useLocks.mockReturnValue({ data: { locks: [] }, isLoading: false });
    useTrades.mockReturnValue({
      data: [{ id: "t1", propertyId: listing.id, priceUsd: 12_000, quantity: 2, buyFeeUsd: 0, sellFeeUsd: 0, createdAt: new Date().toISOString() }],
      isLoading: false,
      isError: false,
    });
    useFees.mockReturnValue({ data: tiers, isLoading: false, isError: false });
    placeOrder.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, error: null });
  });

  it("renders the market header, order book, recent trades, and Buy/Sell actions", () => {
    render(<TradeSection listing={listing} orderBook={book} />);
    expect(screen.getByText("Market")).toBeInTheDocument();
    expect(screen.getByText("Order book")).toBeInTheDocument();
    expect(screen.getByText("Recent trades")).toBeInTheDocument();
    expect(screen.getByTestId("open-limit-buy")).toBeInTheDocument();
    expect(screen.getByTestId("open-limit-sell")).toBeInTheDocument();
  });

  it("shows an order-book skeleton while the book loads", () => {
    render(<TradeSection listing={listing} orderBook={undefined} />);
    expect(screen.getByTestId("orderbook-skeleton")).toBeInTheDocument();
  });

  it("opens the limit buy sheet from the Buy action", () => {
    render(<TradeSection listing={listing} orderBook={book} />);
    fireEvent.click(screen.getByTestId("open-limit-buy"));
    expect(screen.getByText("Buy on market")).toBeInTheDocument();
  });

  it("opens the sell sheet from the Sell action with free-share context", () => {
    usePortfolio.mockReturnValue({
      data: { holdings: [{ propertyId: listing.id, sharesOwned: 10, avgCostUsd: 12_000 }] },
      isLoading: false,
    });
    render(<TradeSection listing={listing} orderBook={book} />);
    fireEvent.click(screen.getByTestId("open-limit-sell"));
    expect(screen.getByText("Sell shares")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument(); // free shares row
  });
});
