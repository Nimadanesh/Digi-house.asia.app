import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LimitBuySheet } from "@/components/property/LimitBuySheet";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import type { FeeTier } from "@/types/fees";

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

function renderSheet() {
  return render(
    <LimitBuySheet open onClose={() => {}} listing={listing} orderBook={book} />,
  );
}

describe("LimitBuySheet — PD-06", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFees.mockReturnValue({ data: tiers, isLoading: false, isError: false });
    placeOrder.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, error: null });
  });

  it("defaults the price to the best ask and shows book context", () => {
    renderSheet();
    expect(screen.getByText("Buy on market")).toBeInTheDocument();
    expect(screen.getAllByText("$122.00").length).toBeGreaterThanOrEqual(1); // best ask (also order value)
    expect(screen.getByText("$120.00")).toBeInTheDocument(); // last price
    expect(screen.getByTestId("limit-buy-price-input")).toHaveValue(122);
  });

  it("previews market fee and escrow total on the current notional", () => {
    renderSheet();
    // default 1 share × $122 = $122.00 → tier 1 buy_secondary 0.9% → fee $1.09 (floor)
    expect(screen.getByText(/Market fee \(0\.90%\)/)).toBeInTheDocument();
    expect(screen.getByText("$1.09")).toBeInTheDocument(); // fee
    expect(screen.getByText("$123.09")).toBeInTheDocument(); // escrow total
  });

  it("stepper changes quantity and the totals follow", () => {
    renderSheet();
    fireEvent.click(screen.getByLabelText("Increase quantity"));
    // 2 × $122 = $244 → fee $2.19 → escrow $246.19
    expect(screen.getByTestId("limit-buy-qty")).toHaveTextContent("2");
    expect(screen.getByText("$246.19")).toBeInTheDocument();
  });

  it("places a buy order with price in cents and quantity", () => {
    const mutate = vi.fn();
    placeOrder.mockReturnValue({ mutate, isPending: false, isError: false, error: null });
    renderSheet();
    fireEvent.click(screen.getByTestId("limit-buy-confirm"));
    expect(mutate).toHaveBeenCalledWith(
      { propertyId: listing.id, side: "buy", priceUsd: 12_200, quantity: 1 },
      expect.any(Object),
    );
  });

  it("shows a mutation error inline", () => {
    placeOrder.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error("Insufficient funds"),
    });
    renderSheet();
    expect(screen.getByText("Insufficient funds")).toBeInTheDocument();
  });
});
