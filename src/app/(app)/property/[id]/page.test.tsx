import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor, fireEvent, within } from "@testing-library/react";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import type { PortfolioSummary } from "@/types/position";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

const listing: Listing = {
  id: "prop-marina-vista-4b",
  title: "Marina Vista Apt 4B",
  location: "Dubai Marina, UAE",
  description: "Waterfront one-bedroom.",
  images: ["/images/properties/p1.png"],
  totalShares: 1000,
  sharePriceUsd: 12500,
  status: "funding",
  ownerWalletAddress: "EQAtest",
  annualRentUsd: 520000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 640,
  sharesRemaining: 360,
  fundingProgressRatio: 0.64,
    monthlyYieldRate: 6.25,
    totalValueUsd: 8_000_000,
  meta: {
    sizeSqm: 72,
    yearBuilt: 2019,
    propertyType: "Apartment",
    rentalStatus: "rented",
    leaseUntil: "2026-12-31",
    activeTenant: true,
    tokenizationDocUrl: "#tokenization-demo",
  },
  rentalHistory: [{ id: "r1", paidAt: "2026-07-04", status: "paid" }],
};

const useProperty = vi.fn(() => ({
  data: undefined as Listing | undefined,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}));
const useOrderBook = vi.fn((): { data?: OrderBookState } => ({ data: undefined }));

const haptics = { impact: vi.fn(), notification: vi.fn(), selection: vi.fn() };
let mainHandler: (() => void | Promise<void>) | null = null;
const mainButton = {
  setParams: vi.fn(),
  hide: vi.fn(),
  onClick: vi.fn((fn: () => void | Promise<void>) => {
    mainHandler = fn;
    return () => {
      mainHandler = null;
    };
  }),
};
const backButton = {
  show: vi.fn(),
  hide: vi.fn(),
  onClick: vi.fn(() => () => {}),
};

vi.mock("@/hooks/useProperty", () => ({
  useProperty: () => useProperty(),
}));
vi.mock("@/hooks/useOrderBook", () => ({
  useOrderBook: () => useOrderBook(),
}));
vi.mock("@/hooks/useMarketplace", () => ({
  useMarketplace: () => ({ data: [], isLoading: false, isError: false }),
}));
vi.mock("@/hooks/usePropertyDocuments", () => ({
  usePropertyDocuments: () => ({
    documents: [],
    isLoading: false,
    isError: false,
    error: null,
    download: { mutateAsync: vi.fn() },
  }),
}));
vi.mock("@/hooks/useTelegram", () => ({
  useTelegram: () => ({
    ready: true,
    isDark: true,
    viewport: { width: 390, height: 800, stableHeight: 800, isExpanded: true },
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
    backButton,
    mainButton,
    haptics,
    themeParams: {},
  }),
}));
vi.mock("@/hooks/useTonConnect", () => ({
  useTonConnect: () => ({
    connected: true,
    openModal: vi.fn(),
    address: "EQxxx",
    short: "EQxx…",
    restoring: false,
    network: "testnet",
    disconnect: vi.fn(),
    send: vi.fn(),
  }),
}));
const mutateAsync = vi.fn();
vi.mock("@/hooks/useBuyShares", () => ({
  useBuyShares: () => ({ mutateAsync, isPending: false, phase: "idle" }),
}));
vi.mock("@/stores/ui.store", () => ({
  useUiStore: (sel: (s: Record<string, unknown>) => unknown) =>
    sel({
      setMainButtonActive: vi.fn(),
      mainButtonActive: false,
      stickyCtaVisible: false,
      setStickyCtaVisible: vi.fn(),
    }),
}));

const usePortfolio = vi.fn((): { data?: PortfolioSummary; isLoading: boolean } => ({
  data: undefined,
  isLoading: false,
}));
vi.mock("@/hooks/usePortfolio", () => ({
  usePortfolio: () => usePortfolio(),
}));
const useTrades = vi.fn(() => ({ data: [], isLoading: false, isError: false }));
vi.mock("@/hooks/useTrades", () => ({
  useTrades: () => useTrades(),
}));
vi.mock("@/hooks/useLocks", () => ({
  useLocks: vi.fn(() => ({ data: { locks: [] }, isLoading: false })),
  useMeSummary: vi.fn(() => ({ data: undefined, isLoading: false })),
  useCreateLock: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null })),
  useRequestUnlock: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null, variables: null })),
  activeLocksForProperty: vi.fn(() => []),
}));

const placeOrderMutate = vi.fn();
vi.mock("@/hooks/useSells", () => ({
  useInstantSell: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null })),
  usePlaceOrder: () => ({
    mutate: placeOrderMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/hooks/useFees", () => ({
  useFees: vi.fn(() => ({ data: [], isLoading: false, isError: false })),
}));


import PropertyDetailPage from "@/app/(app)/property/[id]/page";

async function renderPage(id: string) {
  const params = Promise.resolve({ id });
  await act(async () => {
    render(<PropertyDetailPage params={params} />);
    await params;
  });
}

describe("Property detail page — states + buy happy path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mainHandler = null;
    mutateAsync.mockResolvedValue({ ok: true, txHash: "simulated:test" });
  });

  it("loading: shimmer skeleton", async () => {
    useProperty.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() });
    await renderPage(listing.id);
    expect(screen.getByTestId("property-detail-skeleton")).toBeInTheDocument();
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("error: Retry", async () => {
    useProperty.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() });
    await renderPage(listing.id);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("empty: property not found", async () => {
    useProperty.mockReturnValue({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() });
    await renderPage("missing");
    expect(screen.getByText("Property not found")).toBeInTheDocument();
  });

  it("shows Telegram BackButton when property loads", async () => {
    useProperty.mockReturnValue({ data: listing, isLoading: false, isError: false, refetch: vi.fn() });
    await renderPage(listing.id);
    expect(backButton.show).toHaveBeenCalled();
    expect(backButton.onClick).toHaveBeenCalled();
  });

  it("success: detail sections + MainButton Buy Share", async () => {
    useProperty.mockReturnValue({ data: listing, isLoading: false, isError: false, refetch: vi.fn() });
    await renderPage(listing.id);
    expect(screen.getByTestId("property-detail")).toBeInTheDocument();
    expect(mainButton.setParams).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Buy Share" }),
    );
  });

  it("buy happy path: open sheet → continue → confirm → success", async () => {
    useProperty.mockReturnValue({ data: listing, isLoading: false, isError: false, refetch: vi.fn() });
    await renderPage(listing.id);

    await act(async () => {
      await mainHandler?.();
    });
    expect(await screen.findByTestId("buy-qty-step")).toBeInTheDocument();

    await act(async () => {
      await mainHandler?.();
    });
    expect(await screen.findByTestId("buy-summary-step")).toBeInTheDocument();

    await act(async () => {
      await mainHandler?.();
    });
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ propertyId: listing.id, quantity: expect.any(Number) }),
      );
    });
    expect(await screen.findByTestId("buy-success-step")).toBeInTheDocument();
    expect(screen.getByText(/Congratulations/i)).toBeInTheDocument();
  });

  it("Phase 7 secondary: hero Buy-at CTA opens the market (limit) buy sheet", async () => {
    const resale = { ...listing, status: "resale" as const, sharesRemaining: 0, lastTradeUsd: 13_100 };
    useProperty.mockReturnValue({ data: resale, isLoading: false, isError: false, refetch: vi.fn() });
    useOrderBook.mockReturnValue({
      data: {
        propertyId: resale.id,
        bids: [{ priceUsd: 12_900, quantity: 5, cumulative: 5 }],
        asks: [{ priceUsd: 13_200, quantity: 4, cumulative: 4 }],
        bestBidUsd: 12_900,
        bestAskUsd: 13_200,
        lastTradeUsd: 13_100,
      },
    });
    await renderPage(resale.id);

    fireEvent.click(await screen.findByTestId("hero-cta"));
    expect(await screen.findByTestId("limit-buy-sheet")).toBeInTheDocument();
    // Price input defaults to the best ask — the page's source of truth
    expect(screen.getByTestId("limit-buy-price-input")).toHaveValue(132);
  });

  it("Phase 7 sell: owner sees the Sell sheet with free-share context via Yield section", async () => {
    useProperty.mockReturnValue({ data: listing, isLoading: false, isError: false, refetch: vi.fn() });
    const holding = {
      propertyId: listing.id,
      sharesOwned: 160,
      avgCostUsd: 12_000,
      currentValueUsd: 1_920_000,
      pendingWeekEarningsUsd: 0,
      shareRatio: 0.16,
    };
    usePortfolio.mockReturnValue({
      data: {
        holdings: [holding],
        totalValueUsd: 0,
        totalInvestedUsd: 0,
        totalEarningsUsd: 0,
        weeklyProjectedUsd: 0,
        dayChangeRatio: 0,
        openOrders: [],
      },
      isLoading: false,
    });
    await renderPage(listing.id);

    fireEvent.click(await screen.findByTestId("open-sell-sheet"));
    const sheet = await screen.findByTestId("sell-sheet");
    expect(within(sheet).getByText("Free shares")).toBeInTheDocument();
    expect(within(sheet).getByText("160")).toBeInTheDocument();
  });

  it("Phase 7 regression: a custom limit sell never changes the displayed current price", async () => {    // Secondary property with a live book; page price source of truth = bestAsk $132.00.
    const resale = { ...listing, status: "resale" as const, sharesRemaining: 0, lastTradeUsd: 13_100 };
    useProperty.mockReturnValue({ data: resale, isLoading: false, isError: false, refetch: vi.fn() });
    useOrderBook.mockReturnValue({
      data: {
        propertyId: resale.id,
        bids: [{ priceUsd: 12_900, quantity: 5, cumulative: 5 }],
        asks: [{ priceUsd: 13_200, quantity: 4, cumulative: 4 }],
        bestBidUsd: 12_900,
        bestAskUsd: 13_200,
        lastTradeUsd: 13_100,
      },
    });
    const holding = {
      propertyId: resale.id,
      sharesOwned: 50,
      avgCostUsd: 12_500,
      currentValueUsd: 625_000,
      pendingWeekEarningsUsd: 0,
      shareRatio: 0.05,
    };
    usePortfolio.mockReturnValue({
      data: {
        holdings: [holding],
        totalValueUsd: 0,
        totalInvestedUsd: 0,
        totalEarningsUsd: 0,
        weeklyProjectedUsd: 0,
        dayChangeRatio: 0,
        openOrders: [],
      },
      isLoading: false,
    });
    await renderPage(resale.id);

    // Price before
    expect(metricPrice("Price per share")).toBe("$132.00");

    // Owner places an absurd custom sell at $999/share
    fireEvent.click(await screen.findByTestId("open-sell-sheet"));
    fireEvent.click(await screen.findByLabelText("Sell Custom price"));
    const priceInput = await screen.findByTestId("sell-price-input");
    await act(async () => {
      fireEvent.change(priceInput, { target: { value: "999" } });
    });
    fireEvent.click(screen.getByTestId("custom-sell-confirm"));

    await waitFor(() => {
      expect(placeOrderMutate).toHaveBeenCalledWith(
        expect.objectContaining({ side: "sell", priceUsd: 99_900, quantity: 1 }),
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });

    // The order was placed — but the page-wide price is UNCHANGED.
    expect(metricPrice("Price per share")).toBe("$132.00");
    expect(screen.getByTestId("hero-cta")).toHaveTextContent(/Buy at \$132\.00/);

    function metricPrice(label: string): string {
      const grid = screen.getByTestId("metrics-grid");
      return (within(grid).getByText(label).nextElementSibling?.textContent) ?? "";
    }
  });

  it("Phase 7 sticky: Sell opens the SellSheet when the user has free shares", async () => {
    // Stub IntersectionObserver so the scroll-revealed sticky bar appears in jsdom.
    const instances: Array<{ callback: (entries: { isIntersecting: boolean }[]) => void }> = [];
    class FakeIO {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      callback: (entries: { isIntersecting: boolean }[]) => void;
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        this.callback = cb;
        instances.push(this);
      }
    }
    vi.stubGlobal("IntersectionObserver", FakeIO);
    try {
      const resale = { ...listing, status: "resale" as const, sharesRemaining: 0, lastTradeUsd: 13_100 };
      useProperty.mockReturnValue({ data: resale, isLoading: false, isError: false, refetch: vi.fn() });
      useOrderBook.mockReturnValue({
        data: {
          propertyId: resale.id,
          bids: [],
          asks: [],
          bestBidUsd: 12_900,
          bestAskUsd: 13_200,
        },
      });
      usePortfolio.mockReturnValue({
        data: {
          holdings: [
            { propertyId: resale.id, sharesOwned: 50, avgCostUsd: 12_500, currentValueUsd: 0, pendingWeekEarningsUsd: 0, shareRatio: 0.05 },
          ],
          totalValueUsd: 0,
          totalInvestedUsd: 0,
          totalEarningsUsd: 0,
          weeklyProjectedUsd: 0,
          dayChangeRatio: 0,
          openOrders: [],
        },
        isLoading: false,
      });
      await renderPage(resale.id);

      // Simulate the user scrolling the hero out of view (IO initial + scroll events).
      await act(async () => {
        instances.forEach((io) => io.callback([{ isIntersecting: true }]));
        instances.forEach((io) => io.callback([{ isIntersecting: false }]));
      });

      const sell = screen.getByTestId("sticky-sell");
      expect(sell).toBeEnabled();
      fireEvent.click(sell);
      expect(await screen.findByTestId("sell-sheet")).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
