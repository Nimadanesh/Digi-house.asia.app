import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import { PropertyDetail } from "@/components/property/PropertyDetail";
import { getCurrentSharePrice } from "@/lib/property-price";
import { usd } from "@/lib/format";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

const useTrades = vi.fn(() => ({ data: [], isLoading: false, isError: false }));
vi.mock("@/hooks/useTrades", () => ({
  useTrades: () => useTrades(),
}));

vi.mock("@/hooks/useMarketplace", () => ({
  useMarketplace: () => ({ data: [], isLoading: false, isError: false }),
}));

vi.mock("@/hooks/usePortfolio", () => ({
  usePortfolio: vi.fn(() => ({ data: undefined, isLoading: false })),
}));
vi.mock("@/hooks/useLocks", () => ({
  useLocks: vi.fn(() => ({ data: { locks: [] }, isLoading: false })),
  useMeSummary: vi.fn(() => ({ data: undefined, isLoading: false })),
  useCreateLock: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null })),
  useRequestUnlock: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null, variables: null })),
  activeLocksForProperty: vi.fn(() => []),
}));
vi.mock("@/hooks/useSells", () => ({
  useInstantSell: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null })),
  usePlaceOrder: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false, error: null })),
}));

const baseMeta = {
  sizeSqm: 72,
  yearBuilt: 2019,
  propertyType: "Apartment",
  rentalStatus: "rented" as const,
  leaseUntil: null,
  activeTenant: true,
  tokenizationDocUrl: "#",
};

/** Primary listing — $120/share offering price. */
const primary: Listing = {
  id: "prop-palma-sky-villa",
  title: "Palma Sky Villa",
  location: "Mallorca, Spain",
  description: "x",
  images: ["/images/properties/p1.png"],
  totalShares: 1000,
  sharePriceUsd: 12_000,
  status: "funding",
  ownerWalletAddress: "EQAtest",
  annualRentUsd: 900_000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 640,
  sharesRemaining: 360,
  fundingProgressRatio: 0.64,
  monthlyYieldRate: 6,
  totalValueUsd: 12_000_000,
  meta: baseMeta,
  rentalHistory: [],
};

/** The Bayside shape — secondary with lastTrade far above list ($251 vs $120). */
const secondaryNoBook: Listing = {
  ...primary,
  id: "prop-bayside-marina-penthouse",
  title: "Bayside Marina Penthouse",
  status: "resale",
  sharesRemaining: 0,
  sharesSold: 1000,
  fundingProgressRatio: 1,
  annualRentUsd: 1_040_000,
  lastTradeUsd: 25_100,
};

const bookForBayside: OrderBookState = {
  propertyId: secondaryNoBook.id,
  // Book ladder centred on the same current price (mock derives it the same way).
  bids: [{ priceUsd: 24_598, quantity: 10, cumulative: 10 }],
  asks: [{ priceUsd: 25_602, quantity: 8, cumulative: 8 }],
  bestBidUsd: 24_598,
  bestAskUsd: 25_602,
  lastTradeUsd: 25_100,
};

function metricValue(label: string): string {
  const el = screen.getByText(label);
  return el.nextElementSibling?.textContent ?? "";
}

function renderPage(listing: Listing, orderBook?: OrderBookState) {
  return render(
    <PropertyDetail
      listing={listing}
      orderBook={orderBook}
      onBuy={() => {}}
      previewShares={1}
      onSharesChange={() => {}}
      ownedShares={0}
      onBuyShares={() => {}}
    />,
  );
}

/** Estate-tab price surfaces (metrics) + Income-tab calculator must show exactly this value. */
function expectPriceSurfacesShow(priceCents: number) {
  const price = usd(priceCents);
  fireEvent.click(screen.getByTestId("tab-estate"));
  // Single ownership-first KPI label carries the source-of-truth price.
  expect(metricValue("Share price")).toBe(price);
  // Calculator (projections) lives on the Income tab; cost basis uses the same price.
  fireEvent.click(screen.getByTestId("tab-income"));
  expect(screen.getByTestId("calc-buy")).toHaveTextContent(`Buy 1 share – ${price}`);
  expect(screen.getByTestId("calc-monthly").textContent).toBe(metricValue("Projected monthly income / share"));
}

/** Chart end label must match the current price — chart now lives behind the resale expanders. */
async function expectChartEndShows(priceCents: number) {
  fireEvent.click(screen.getByTestId("tab-estate"));
  fireEvent.click(screen.getByTestId("resale-toggle"));
  fireEvent.click(screen.getByTestId("resale-price-history-toggle"));
  expect(await screen.findByTestId("perf-end-price")).toHaveTextContent(usd(priceCents));
}

describe("getCurrentSharePrice — hierarchy", () => {
  it("primary always uses the list price", () => {
    expect(getCurrentSharePrice(primary)).toBe(12_000);
    expect(getCurrentSharePrice(primary, { bestAskUsd: 99_999 })).toBe(12_000);
  });

  it("secondary prefers bestAsk, then lastTrade, then list", () => {
    expect(getCurrentSharePrice(secondaryNoBook, { bestAskUsd: 25_602 })).toBe(25_602);
    expect(getCurrentSharePrice(secondaryNoBook)).toBe(25_100); // no book → last trade
    const thin = { ...secondaryNoBook, lastTradeUsd: undefined };
    expect(getCurrentSharePrice(thin)).toBe(12_000); // nothing → list
  });

  it("status × book-availability matrix never yields an undefined/negative price", () => {
    const funded = { ...secondaryNoBook, status: "funded" as const };
    const cases: Array<[Listing, { bestAskUsd?: number } | undefined]> = [
      [primary, undefined],
      [primary, { bestAskUsd: 12_800 }],
      [secondaryNoBook, undefined],
      [secondaryNoBook, { bestAskUsd: 25_602 }],
      [funded, undefined],
      [funded, { bestAskUsd: 25_602 }],
    ];
    for (const [l, book] of cases) {
      const price = getCurrentSharePrice(l, book);
      expect(Number.isFinite(price)).toBe(true);
      expect(price).toBeGreaterThan(0);
    }
  });
});

describe("Property page data consistency — one price everywhere", () => {
  it("primary: hero === metrics === calculator === $120.00 — and NO price chart", async () => {
    renderPage(primary);
    expect(screen.getByTestId("hero-price")).toHaveTextContent(usd(primary.sharePriceUsd));
    expect(screen.getByTestId("hero-cta")).toHaveTextContent(`Acquire Ownership · ${usd(primary.sharePriceUsd)}`);
    // KPI carries the same single value.
    fireEvent.click(screen.getByTestId("tab-estate"));
    expect(metricValue("Share price")).toBe(usd(primary.sharePriceUsd));
    // Strict spec rule: primary never renders a price-performance chart.
    expect(screen.queryByTestId("perf-svg")).not.toBeInTheDocument();
    // Funding charts (simulated, disclosed) are the only chart surface on primary.
    expect(await screen.findByTestId("primary-performance-charts")).toBeInTheDocument();
  });

  it("secondary with book: everything coherent at the live ask ($256.02)", async () => {
    renderPage(secondaryNoBook, bookForBayside);
    const ask = bookForBayside.bestAskUsd!;
    expect(screen.getByTestId("hero-price")).toHaveTextContent(usd(ask));
    expect(screen.getByTestId("hero-cta")).toHaveTextContent("Acquire Resale Ownership");
    expectPriceSurfacesShow(ask);
    await expectChartEndShows(ask);
    // Resale summary (still expanded on the Estate tab) shows the source-of-truth value.
    expect(screen.getByTestId("best-ask").textContent).toBe(usd(ask));
  });

  it("secondary without a book: everything coherent at the last trade ($251.00)", async () => {
    renderPage(secondaryNoBook);
    expect(screen.getByTestId("hero-price")).toHaveTextContent(usd(25_100));
    expect(screen.getByTestId("hero-cta")).toHaveTextContent("Acquire Resale Ownership");
    expectPriceSurfacesShow(25_100);
    await expectChartEndShows(25_100);
  });

  it("market context stays centred on the current price", () => {
    renderPage(secondaryNoBook, bookForBayside);
    fireEvent.click(screen.getByTestId("tab-estate"));
    fireEvent.click(screen.getByTestId("resale-toggle"));
    const bidText = screen.getByTestId("best-bid").textContent!;
    const askText = screen.getByTestId("best-ask").textContent!;
    const toCents = (s: string) => Math.round(parseFloat(s.replace(/[$,]/g, "")) * 100);
    const current = getCurrentSharePrice(secondaryNoBook, { bestAskUsd: bookForBayside.bestAskUsd });
    // Bid below, ask at/above, both within ±20% of the current price.
    expect(toCents(bidText)).toBeLessThan(current);
    expect(toCents(bidText)).toBeGreaterThan(current * 0.8);
    expect(toCents(askText)).toBeGreaterThanOrEqual(current);
    expect(toCents(askText)).toBeLessThan(current * 1.2);
  });
});
