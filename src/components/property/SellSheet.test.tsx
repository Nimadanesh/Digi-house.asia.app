import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import type { FeeTier } from "@/types/fees";
import { SellSheet } from "@/components/property/SellSheet";
import { useUiStore } from "@/stores/ui.store";

const instantMutate = vi.fn();
const placeOrderMutate = vi.fn();
const cancelMutate = vi.fn();
const instantMock = {
  mutate: instantMutate,
  isPending: false,
  isError: false,
  error: null as Error | null,
};
const placeOrderMock = {
  mutate: placeOrderMutate,
  isPending: false,
  isError: false,
  error: null as Error | null,
};
const cancelMock = {
  mutate: cancelMutate,
  isPending: false,
  isError: false,
  error: null as Error | null,
  variables: null as unknown,
};

vi.mock("@/lib/telegram/haptics", () => ({
  haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
}));

vi.mock("@/hooks/useSells", () => ({
  useInstantSell: vi.fn(() => instantMock),
  usePlaceOrder: vi.fn(() => placeOrderMock),
  useCancelOrder: vi.fn(() => cancelMock),
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
  {
    id: 2,
    minAmountUsd: 50_000,
    maxAmountUsd: 200_000,
    buyPrimaryBps: 250,
    buySecondaryBps: 80,
    sellSecondaryBps: 80,
  },
];
const useFees = vi.fn(() => ({ data: tiers, isLoading: false, isError: false }));
vi.mock("@/hooks/useFees", () => ({
  useFees: () => useFees(),
}));

const listing: Listing = {
  id: "prop-x",
  title: "Villa One",
  location: "Y",
  description: "x",
  images: [],
  totalShares: 1000,
  sharePriceUsd: 12_000,
  status: "funding",
  ownerWalletAddress: "EQAtest",
  annualRentUsd: 500_000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 100,
  sharesRemaining: 900,
  fundingProgressRatio: 0.1,
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
const book: OrderBookState = {
  propertyId: "prop-x",
  bids: [{ priceUsd: 11_800, quantity: 5, cumulative: 5 }],
  asks: [{ priceUsd: 12_200, quantity: 4, cumulative: 4 }],
  bestBidUsd: 11_800,
  bestAskUsd: 12_200,
  lastTradeUsd: 12_000,
};

function renderSheet(
  onClose = vi.fn(),
  overrides: Partial<Parameters<typeof SellSheet>[0]> = {},
) {
  return render(
    <SellSheet
      open
      onClose={onClose}
      listing={listing}
      freeShares={10}
      avgCostUsd={12_000}
      ownedShares={10}
      orderBook={book}
      {...overrides}
    />,
  );
}

function openCustom() {
  fireEvent.click(screen.getByRole("button", { name: /sell custom price/i }));
}

describe("SellSheet — price input editing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({ toast: null });
  });

  function customPriceInput() {
    renderSheet();
    openCustom();
    return screen.getByTestId("sell-price-input") as HTMLInputElement;
  }

  it("can be fully cleared without restoring the first digit", () => {
    const input = customPriceInput();
    expect(input.value).toBe("120");
    fireEvent.change(input, { target: { value: "" } });
    expect(input.value).toBe("");
    // No misleading quote while empty; the next step stays gated.
    expect(screen.queryByTestId("sell-quote")).not.toBeInTheDocument();
    expect(screen.getByTestId("custom-sell-review")).toBeDisabled();
  });

  it("accepts a fresh value typed from empty", () => {
    const input = customPriceInput();
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.change(input, { target: { value: "90" } });
    expect(input.value).toBe("90");
    expect(screen.getByText("$90.00")).toBeInTheDocument();
  });

  it("accepts a higher fresh value typed from empty", () => {
    const input = customPriceInput();
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.change(input, { target: { value: "150" } });
    expect(input.value).toBe("150");
    expect(screen.getByText("$150.00")).toBeInTheDocument();
  });

  it("supports digit-by-digit edits including zero", () => {
    const input = customPriceInput();
    fireEvent.change(input, { target: { value: "12" } });
    expect(input.value).toBe("12");
    fireEvent.change(input, { target: { value: "0" } });
    expect(input.value).toBe("0");
    expect(screen.getByTestId("custom-sell-review")).toBeDisabled();
  });
});

describe("SellSheet — market price guidance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({ toast: null });
  });

  // Fixture book: best offer $118.00, last price $120.00.
  function guidedPriceInput(overrides: Partial<Parameters<typeof SellSheet>[0]> = {}) {
    renderSheet(vi.fn(), overrides);
    openCustom();
    return screen.getByTestId("sell-price-input") as HTMLInputElement;
  }

  it("shows below-market guidance with the actual reference price", () => {
    const input = guidedPriceInput();
    fireEvent.change(input, { target: { value: "100" } });
    expect(
      screen.getByText("Current market price is higher — around $118.00 per share."),
    ).toBeInTheDocument();
  });

  it("shows above-market guidance for a materially higher price", () => {
    const input = guidedPriceInput();
    fireEvent.change(input, { target: { value: "130" } });
    expect(
      screen.getByText("Price is above the current market range. Your listing may take longer to sell."),
    ).toBeInTheDocument();
  });

  it("stays quiet near the market price", () => {
    guidedPriceInput();
    expect(screen.queryByTestId("sell-price-guide")).not.toBeInTheDocument();
  });

  it("shows no guidance without a market reference", () => {
    const input = guidedPriceInput({ orderBook: null });
    fireEvent.change(input, { target: { value: "100" } });
    expect(screen.queryByTestId("sell-price-guide")).not.toBeInTheDocument();
  });

  it("shows no guidance for empty or invalid input", () => {
    const input = guidedPriceInput();
    fireEvent.change(input, { target: { value: "" } });
    expect(screen.queryByTestId("sell-price-guide")).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "0" } });
    expect(screen.queryByTestId("sell-price-guide")).not.toBeInTheDocument();
  });
});

describe("SellSheet — instant sell review → confirm → success", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    instantMock.isPending = false;
    instantMock.isError = false;
    instantMock.error = null;
    placeOrderMock.isPending = false;
    useUiStore.setState({ toast: null });
  });

  it("does not execute the sale before the review step", () => {
    renderSheet();
    expect(screen.queryByTestId("instant-sell-confirm")).not.toBeInTheDocument();
    expect(instantMutate).not.toHaveBeenCalled();
  });

  it("review step itemizes value, 7% fee and net proceeds", () => {
    renderSheet();
    fireEvent.click(screen.getByTestId("instant-sell-review"));
    expect(screen.getByText("Confirm instant sale")).toBeInTheDocument();
    expect(screen.getByText("Fee (7%)")).toBeInTheDocument();
    // 1 share × $120.00 − 7% = $111.60
    expect(screen.getByText("−$8.40")).toBeInTheDocument();
    expect(screen.getByText("$111.60")).toBeInTheDocument();
    expect(instantMutate).not.toHaveBeenCalled();
  });

  it("instant review shows cost basis, break-even and remaining position", () => {
    renderSheet();
    fireEvent.click(screen.getByTestId("instant-sell-review"));
    // avg cost == list price → break-even on the gross basis.
    expect(screen.getByTestId("sell-gain-loss")).toHaveTextContent("Break-even");
    expect(screen.getByTestId("sell-remaining")).toHaveTextContent("9");
  });

  it("confirm sells: existing instant mutation with property + shares", () => {
    renderSheet();
    fireEvent.click(screen.getByTestId("instant-sell-review"));
    fireEvent.click(screen.getByTestId("instant-sell-confirm"));
    expect(instantMutate).toHaveBeenCalledWith(
      { propertyId: "prop-x", shares: 1 },
      expect.any(Object),
    );
  });

  it("pending disables confirm and shows Selling…", () => {
    const onClose = vi.fn();
    const view = renderSheet(onClose);
    // Enter review first (pending only exists once the sale is executing).
    fireEvent.click(screen.getByTestId("instant-sell-review"));
    instantMock.isPending = true;
    view.rerender(
      <SellSheet
        open
        onClose={onClose}
        listing={listing}
        freeShares={10}
        avgCostUsd={12_000}
        ownedShares={10}
        orderBook={book}
      />,
    );
    const confirm = screen.getByTestId("instant-sell-confirm");
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveTextContent("Selling…");
    fireEvent.click(confirm);
    expect(instantMutate).not.toHaveBeenCalled();
  });

  it("success shows the completion state with the credited amount; Done closes", () => {
    instantMutate.mockImplementation((_input: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    const onClose = vi.fn();
    renderSheet(onClose);
    fireEvent.click(screen.getByTestId("instant-sell-review"));
    fireEvent.click(screen.getByTestId("instant-sell-confirm"));
    expect(screen.getByTestId("instant-sell-success")).toBeInTheDocument();
    expect(screen.getByText("Shares sold")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /done/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("error keeps the user in the review step with a retry path", () => {
    instantMutate.mockImplementation(() => {}); // success/failure of the retry is not the point here
    instantMock.isError = true;
    instantMock.error = new Error("Sale window closed");
    renderSheet();
    fireEvent.click(screen.getByTestId("instant-sell-review"));
    fireEvent.click(screen.getByTestId("instant-sell-confirm"));
    expect(screen.getByTestId("instant-sell-error")).toHaveTextContent("Sale window closed");
    expect(screen.getByTestId("instant-sell-confirm")).toBeEnabled();
  });
});

describe("SellSheet — initial mode follows availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({ toast: null });
  });

  it("opens directly on Custom price when instant is unavailable (funded/resale)", () => {
    renderSheet(vi.fn(), {
      listing: { ...listing, status: "resale", sharesRemaining: 0 } as typeof listing,
    });
    expect(screen.getByTestId("sell-quote")).toBeInTheDocument();
    expect(screen.queryByTestId("instant-summary")).not.toBeInTheDocument();
  });

  it("keeps Instant first where it is genuinely available (funding)", () => {
    renderSheet();
    expect(screen.getByTestId("instant-summary")).toBeInTheDocument();
    expect(screen.queryByTestId("sell-quote")).not.toBeInTheDocument();
  });
});

describe("SellSheet — custom price listing (form → review → listed)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({ toast: null });
  });

  it("orders the form as position → market context → price → outcome → review", () => {
    renderSheet();
    openCustom();
    const market = screen.getByText("Best offer");
    const price = screen.getByTestId("sell-price-input");
    const quote = screen.getByTestId("sell-quote");
    const cta = screen.getByTestId("custom-sell-review");
    expect(market.compareDocumentPosition(price) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(quote.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("explains available-to-sell at the point of action", () => {
    // 160 owned, 10 free → 150 locked: the cap must explain itself.
    renderSheet(vi.fn(), { ownedShares: 160 });
    openCustom();
    expect(screen.getByText("Available to sell")).toBeInTheDocument();
    expect(screen.getByText("10 shares")).toBeInTheDocument();
    expect(screen.getByText("150 · not sellable")).toBeInTheDocument();
  });

  it("live quote shows break-even at cost and the remaining position", () => {
    renderSheet();
    openCustom();
    // 1 share @ $120 cost $120 → break-even; 9 of 10 remain (0.9%).
    expect(screen.getByTestId("sell-quote")).toBeInTheDocument();
    expect(screen.getByTestId("sell-gain-loss")).toHaveTextContent("Break-even");
    expect(screen.getByTestId("sell-remaining")).toHaveTextContent("9");
  });

  it("a higher price previews a gain; a lower price previews a loss", () => {
    renderSheet();
    openCustom();
    const price = screen.getByTestId("sell-price-input");
    fireEvent.change(price, { target: { value: "130" } });
    // 1 × $130 vs $120 cost → +$10.00 gain.
    expect(screen.getByText("+$10.00 · Gain")).toBeInTheDocument();
    fireEvent.change(price, { target: { value: "100" } });
    // 1 × $100 vs $120 cost → −$20.00 loss.
    expect(screen.getByText("−$20.00 · Loss")).toBeInTheDocument();
  });

  it("previews the market fee and net proceeds from the canonical tiers", () => {
    renderSheet();
    openCustom();
    // 1 × $120 = $120.00 → tier 1 sell 0.90% → $1.08 fee → $118.92 net.
    expect(screen.getByText("Market fee (0.90%)")).toBeInTheDocument();
    expect(screen.getByText("$1.08")).toBeInTheDocument();
    expect(screen.getByText("$118.92")).toBeInTheDocument();
    expect(screen.getByText("Charged only when your shares sell.")).toBeInTheDocument();
  });

  it("review answers what is sold, received, remaining and the outcome vs cost", () => {
    renderSheet();
    openCustom();
    fireEvent.click(screen.getByTestId("custom-sell-review"));
    expect(screen.getByTestId("sell-review")).toBeInTheDocument();
    expect(screen.getByText("Review your listing")).toBeInTheDocument();
    expect(placeOrderMutate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("custom-sell-confirm"));
    expect(placeOrderMutate).toHaveBeenCalledWith(
      { propertyId: "prop-x", side: "sell", priceUsd: 12_000, quantity: 1 },
      expect.any(Object),
    );
  });

  it("listing lands in the Active state (never Sold) with a cancel path", () => {
    placeOrderMutate.mockImplementation(
      (input: { quantity: number; priceUsd: number }, opts?: { onSuccess?: (o: unknown) => void }) => {
        opts?.onSuccess?.({
          id: "ord-1",
          propertyId: "prop-x",
          makerAddress: "EQtest",
          side: "sell",
          priceUsd: input.priceUsd,
          quantity: input.quantity,
          filledQuantity: 0,
          status: "open",
          createdAt: "2026-01-01T00:00:00Z",
        });
      },
    );
    const onClose = vi.fn();
    renderSheet(onClose);
    openCustom();
    fireEvent.click(screen.getByTestId("custom-sell-review"));
    fireEvent.click(screen.getByTestId("custom-sell-confirm"));
    expect(screen.getByTestId("sell-listed")).toBeInTheDocument();
    // PROMPT 04 Matrix identity.name primary: the listed state keeps estate
    // orientation (canonical displayTitle; fixture fallback for unmapped ids).
    expect(screen.getByTestId("sell-listed-estate")).toHaveTextContent("Villa One");
    // Heading + status must never read as a completed sale.
    expect(screen.getByText("Your listing is active")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.queryByText("Sold")).not.toBeInTheDocument();
    expect(screen.queryByText("Sell order placed")).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    // Remaining keeps the ownership fraction, same source as Review.
    expect(screen.getByText("9 · 0.9%")).toBeInTheDocument();
    // Fee carries the canonical rate, same as Review.
    expect(screen.getByText("Market fee (0.90%)")).toBeInTheDocument();

    // Cancel arms, then confirms against the backend; the state flips on success.
    cancelMutate.mockImplementation((_id: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    fireEvent.click(screen.getByTestId("sell-cancel"));
    fireEvent.click(screen.getByTestId("sell-cancel-confirm"));
    expect(cancelMutate).toHaveBeenCalledWith("ord-1", expect.any(Object));
    expect(screen.getByText("Listing cancelled")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("queued listings stay distinct from live ones while funding is open", () => {
    placeOrderMutate.mockImplementation(
      (input: { quantity: number; priceUsd: number }, opts?: { onSuccess?: (o: unknown) => void }) => {
        opts?.onSuccess?.({
          id: "ord-q",
          propertyId: "prop-x",
          makerAddress: "EQtest",
          side: "sell",
          priceUsd: input.priceUsd,
          quantity: input.quantity,
          filledQuantity: 0,
          status: "queued",
          createdAt: "2026-01-01T00:00:00Z",
        });
      },
    );
    renderSheet();
    openCustom();
    fireEvent.click(screen.getByTestId("custom-sell-review"));
    // Funding → the confirm names the queued outcome honestly.
    expect(screen.getByTestId("custom-sell-confirm")).toHaveTextContent("Queue sell order");
    fireEvent.click(screen.getByTestId("custom-sell-confirm"));
    expect(screen.getByTestId("sell-listed")).toBeInTheDocument();
    expect(screen.getByText("Sell order queued")).toBeInTheDocument();
    expect(screen.getByText("Queued")).toBeInTheDocument();
    expect(screen.queryByText("Sold")).not.toBeInTheDocument();
  });

  it("honest no-buyer state when the live book has no bids", () => {
    renderSheet(vi.fn(), { orderBook: { propertyId: "prop-x", bids: [], asks: [] } });
    openCustom();
    expect(
      screen.getByText(/No buyer has matched this market yet/),
    ).toBeInTheDocument();
  });

  it("empty state when nothing is sellable", () => {
    renderSheet(vi.fn(), { freeShares: 0, ownedShares: 0 });
    expect(screen.getByTestId("sell-empty")).toBeInTheDocument();
    expect(screen.getByText("Nothing to sell")).toBeInTheDocument();
    expect(screen.queryByTestId("sell-qty")).not.toBeInTheDocument();
  });
});
