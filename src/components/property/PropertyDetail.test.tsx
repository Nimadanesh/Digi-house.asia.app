import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import { PropertyDetail } from "@/components/property/PropertyDetail";

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

const useMarketplace = vi.fn((): { data?: Listing[]; isLoading: boolean; isError: boolean } => ({
  data: [],
  isLoading: false,
  isError: false,
}));
vi.mock("@/hooks/useMarketplace", () => ({
  useMarketplace: () => useMarketplace(),
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

const listing: Listing = {
  id: "prop-marina-vista-4b",
  title: "Marina Vista Apt 4B",
  location: "Dubai Marina, UAE",
  description: "Waterfront one-bedroom with marina view and 24h concierge.",
  images: ["/images/properties/p1.png", "/images/properties/p2.png"],
  totalShares: 1000,
  sharePriceUsd: 12500,
  status: "funding",
  ownerWalletAddress: "EQAtest",
  annualRentUsd: 520000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 920,
  sharesRemaining: 80,
  fundingProgressRatio: 0.92,
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
  rentalHistory: [
    { id: "r1", paidAt: "2026-07-04", status: "paid" },
    { id: "r2", paidAt: "2026-06-06", status: "paid" },
    { id: "r3", paidAt: "2026-05-02", status: "paid" },
  ],
};

const secondaryListing: Listing = {
  ...listing,
  status: "resale",
  sharesRemaining: 0,
  lastTradeUsd: 13100,
};

/** Secondary with NO last trade — the delta must not render (spec §9). */
const secondaryNoLastTrade: Listing = {
  ...listing,
  status: "resale",
  sharesRemaining: 0,
};

const orderBook: OrderBookState = {
  propertyId: secondaryListing.id,
  bids: [],
  asks: [],
  bestAskUsd: 13200,
};

function renderDetail(
  l: Listing,
  overrides?: {
    orderBook?: OrderBookState;
    ownedShares?: number;
    lockedShares?: number;
    onBuyShares?: (n: number) => void;
    documents?: { id: string; title: string; kind: "legal" | "financial" | "offering" | "other"; fileSize: number | null; createdAt: string }[];
    onDownloadDoc?: (docId: string) => void;
    accruedUnpaidUsd?: number;
  },
) {
  return render(
    <PropertyDetail
      listing={l}
      orderBook={overrides?.orderBook}
      onBuy={() => {}}
      previewShares={1}
      onSharesChange={() => {}}
      ownedShares={overrides?.ownedShares ?? 0}
      lockedShares={overrides?.lockedShares ?? 0}
      accruedUnpaidUsd={overrides?.accruedUnpaidUsd}
      onBuyShares={overrides?.onBuyShares ?? (() => {})}
      documents={overrides?.documents}
      onDownloadDoc={overrides?.onDownloadDoc}
    />,
  );
}

describe("PropertyDetail — redesign Phase 1 foundation (tabs)", () => {
  it("renders header + KPI + 5 tabs on Overview by default", () => {
    renderDetail(listing);
    expect(screen.getByTestId("property-hero")).toBeInTheDocument();
    expect(screen.getByTestId("metrics-grid")).toBeInTheDocument();
    expect(screen.getByTestId("property-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("tab-overview")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("panel-overview")).toBeInTheDocument();
    // Overview panel holds the relocated existing sections
    expect(screen.getByTestId("income-calculator")).toBeInTheDocument();
    expect(screen.getByTestId("yield-lock-section")).toBeInTheDocument();
  });

  it("PRIMARY Overview: funding panel leads, fundamentals + trust on hierarchy", () => {
    renderDetail(listing);
    expect(screen.getByTestId("funding-panel")).toBeInTheDocument();
    expect(screen.getByTestId("funding-pct")).toHaveTextContent("92%");
    expect(screen.getByTestId("funding-caption")).toHaveTextContent(/92% funded · 80 shares remaining/);
    expect(screen.getByTestId("funding-sold-total")).toHaveTextContent("920 / 1,000");
    expect(screen.getByTestId("funding-remaining")).toHaveTextContent("80");
    expect(screen.getByTestId("funding-target")).toHaveTextContent("$125,000.00");
    expect(screen.getByTestId("funding-price")).toHaveTextContent("$125.00");
    // Fundamentals (existing data only)
    expect(screen.getByTestId("property-fundamentals")).toBeInTheDocument();
    expect(screen.getByTestId("fundamentals-value")).toHaveTextContent("$80,000.00");
    expect(screen.getByTestId("fundamentals-rent")).toHaveTextContent("$5,200.00");
    expect(screen.getByTestId("fundamentals-gross-yield")).toHaveTextContent("6.5%");
    // Trust renders on the Primary Overview hierarchy
    expect(screen.getByTestId("property-trust")).toBeInTheDocument();
  });

  it("SECONDARY Overview: no funding panel or fundamentals (Phase 3 territory)", () => {
    renderDetail(secondaryListing, { orderBook });
    expect(screen.queryByTestId("funding-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("property-fundamentals")).not.toBeInTheDocument();
  });

  it("SECONDARY Overview: market summary leads with current price, bid/ask, spread", () => {
    renderDetail(secondaryListing, { orderBook });
    expect(screen.getByTestId("market-section")).toBeInTheDocument();
    expect(screen.getByTestId("market-summary")).toBeInTheDocument();
    // Current price = single source of truth at the live ask ($132.00).
    expect(screen.getByTestId("market-current-price")).toHaveTextContent("$132.00");
    expect(screen.getByTestId("best-bid")).toHaveTextContent("—");
    expect(screen.getByTestId("best-ask")).toHaveTextContent("$132.00");
    // Spread renders only when both sides exist; here the book has no bids.
    expect(screen.getByTestId("market-spread")).toHaveTextContent("—");
  });

  it("SECONDARY Overview: no vs-offer delta without a last trade", () => {
    renderDetail(secondaryNoLastTrade, { orderBook });
    expect(screen.queryByTestId("market-delta")).not.toBeInTheDocument();
  });

  it("SECONDARY Overview: vs-offer delta renders only when a last trade exists", () => {
    // lastTrade $131.00 vs offer $125.00 → +4.8%.
    renderDetail(secondaryListing, { orderBook });
    expect(screen.getByTestId("market-delta")).toHaveTextContent("+4.8% vs offer");
  });

  it("SECONDARY Overview: position card shows total/locked/free/accrued/value + sheets", () => {
    renderDetail(
      secondaryListing,
      { orderBook, ownedShares: 160, lockedShares: 100, accruedUnpaidUsd: 1250 },
    );
    expect(screen.getByTestId("position-card")).toBeInTheDocument();
    expect(screen.getByTestId("position-total")).toHaveTextContent("160");
    expect(screen.getByTestId("position-locked")).toHaveTextContent("100");
    expect(screen.getByTestId("position-free")).toHaveTextContent("60");
    expect(screen.getByTestId("position-accrued")).toHaveTextContent("$12.50");
    // Estimated value at the single source of truth: 160 × $132.00.
    expect(screen.getByTestId("position-value")).toHaveTextContent("$21,120.00");
    // Lock opens the existing LockSheet; Sell opens the existing SellSheet.
    fireEvent.click(screen.getByTestId("position-lock"));
    expect(screen.getByTestId("lock-sheet")).toBeInTheDocument();
  });

  it("SECONDARY Overview: no position card when the user owns nothing", () => {
    renderDetail(secondaryListing, { orderBook });
    expect(screen.queryByTestId("position-card")).not.toBeInTheDocument();
  });

  it("SECONDARY Performance tab: Phase 5 charts replace the old chart; book/trades stay on Overview", async () => {
    renderDetail(secondaryListing, { orderBook });
    fireEvent.click(screen.getByTestId("tab-performance"));
    expect(await screen.findByTestId("secondary-performance-charts")).toBeInTheDocument();
    expect(screen.getByTestId("price-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("market-section")).not.toBeInTheDocument();
  });

  it("SECONDARY: ownership banner is replaced by the position card", () => {
    renderDetail(secondaryListing, { orderBook, ownedShares: 160, lockedShares: 100 });
    expect(screen.queryByTestId("ownership-banner")).not.toBeInTheDocument();
    expect(screen.getByTestId("position-card")).toBeInTheDocument();
  });

  it("primary: banner, hero APY + trust line, Buy Shares CTA at list price", () => {
    const onBuy = vi.fn();
    render(<PropertyDetail listing={listing} onBuy={onBuy} previewShares={1} onSharesChange={() => {}} onBuyShares={() => {}} />);
    expect(screen.getByTestId("status-banner")).toHaveTextContent(/Open for Funding · 92% · 80 shares left/);
    expect(screen.getByTestId("hero-apy")).toBeInTheDocument();
    expect(screen.getByTestId("hero-trust-line")).toHaveTextContent(/3 months on-time payments/);
    expect(screen.getByTestId("hero-cta")).toHaveTextContent(/Buy Shares · \$125\.00/);
    fireEvent.click(screen.getByTestId("hero-cta"));
    expect(onBuy).toHaveBeenCalledOnce();
  });

  it("renders the KPI cards with translated labels", () => {
    renderDetail(listing);
    // "Offer price" appears twice on a Primary page (KPI grid + FundingPanel row) — assert both.
    expect(screen.getAllByText("Offer price")).toHaveLength(2);
    expect(screen.getByText("Monthly yield / share")).toBeInTheDocument();
    expect(screen.getByText("Total property value")).toBeInTheDocument();
    expect(screen.getByText("Shares sold / total")).toBeInTheDocument();
    // The sold/total figure appears in both the KPI grid and the FundingPanel — assert both.
    expect(screen.getAllByText("920 / 1,000")).toHaveLength(2);
  });

  it("PRIMARY: Performance tab shows NO price chart (strict spec rule)", async () => {
    renderDetail(listing);
    fireEvent.click(screen.getByTestId("tab-performance"));
    expect(screen.getByTestId("panel-performance")).toBeInTheDocument();
    expect(screen.getByTestId("primary-performance-note")).toBeInTheDocument();
    expect(screen.getByTestId("primary-performance-note")).toHaveTextContent(/fixed price/i);
    expect(await screen.findByTestId("primary-performance-charts")).toBeInTheDocument();
    expect(screen.getByTestId("funding-progress-chart")).toBeInTheDocument();
    expect(screen.getByTestId("cumulative-shares-chart")).toBeInTheDocument();
    // Strict spec §10: no price chart, no price svg on Primary
    expect(screen.queryByTestId("performance-chart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("price-svg")).not.toBeInTheDocument();
    expect(screen.queryByTestId("market-section")).not.toBeInTheDocument();
  });

  it("SECONDARY: Performance tab keeps the chart; market moved to Overview", async () => {
    renderDetail(secondaryListing, { orderBook });
    fireEvent.click(screen.getByTestId("tab-performance"));
    expect(await screen.findByTestId("secondary-performance-charts")).toBeInTheDocument();
    expect(screen.queryByTestId("market-section")).not.toBeInTheDocument();
  });

  it("Holders tab renders the Phase 6 analytics; Income renders the Phase 7 analytics", async () => {
    renderDetail(listing);
    fireEvent.click(screen.getByTestId("tab-holders"));
    expect(await screen.findByTestId("holder-analytics")).toBeInTheDocument();
    expect(screen.getByTestId("holder-donut")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("tab-income"));
    expect(await screen.findByTestId("income-analytics")).toBeInTheDocument();
  });

  it("Details tab holds trust, about + sheet, documents, similar", () => {
    useMarketplace.mockReturnValue({
      data: [{ ...listing, id: "prop-other-1", title: "Other Villa", location: "Other, UAE" }],
      isLoading: false,
      isError: false,
    });
    render(
      <PropertyDetail
        listing={listing}
        onBuy={() => {}}
        previewShares={1}
        onSharesChange={() => {}}
        onBuyShares={() => {}}
        documents={[{ id: "d1", title: "Offering Memorandum", kind: "offering", fileSize: 1_200_000, createdAt: "2026-01-01" }]}
        onDownloadDoc={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId("tab-details"));
    expect(screen.getByTestId("panel-details")).toBeInTheDocument();
    // Trust lives on the Primary Overview now — Details keeps about/docs/similar
    expect(screen.queryByTestId("property-trust")).not.toBeInTheDocument();
    expect(screen.getByTestId("property-about")).toBeInTheDocument();

    // About opens a bottom sheet with full details
    fireEvent.click(screen.getByTestId("about-more"));
    expect(screen.getByTestId("sheet-panel")).toBeInTheDocument();
    expect(screen.getByTestId("about-details")).toBeInTheDocument();
    expect(screen.getByText("72 m²")).toBeInTheDocument();

    // Documents list renders rows
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Offering Memorandum")).toBeInTheDocument();

    // Similar rail renders from marketplace data (current listing excluded)
    expect(screen.getByTestId("similar-properties")).toBeInTheDocument();
    const cards = screen.getAllByTestId("similar-card");
    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).not.toContain("Marina Vista Apt 4B");
  });

  it("market section: never for Primary, on Secondary Overview since Phase 3", () => {
    const { unmount } = renderDetail(listing);
    expect(screen.queryByTestId("market-section")).not.toBeInTheDocument();
    unmount();
    renderDetail(secondaryListing, { orderBook });
    // Secondary: on the Overview (Phase 3), not on Performance.
    expect(screen.getByTestId("market-section")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("tab-performance"));
    expect(screen.queryByTestId("market-section")).not.toBeInTheDocument();
  });

  it("secondary: green live-trading banner + Buy-at-ask hero CTA", () => {
    renderDetail(secondaryListing, { orderBook });
    expect(screen.getByTestId("status-banner")).toHaveTextContent(/Resale · Live Trading/);
    expect(screen.getByTestId("hero-cta")).toHaveTextContent(/Buy at \$132\.00/);
  });

  it("Phase 6: no ownership banner when the user owns nothing; yield section shows hint", () => {
    renderDetail(listing);
    expect(screen.queryByTestId("ownership-banner")).not.toBeInTheDocument();
    expect(screen.getByTestId("yield-lock-section")).toHaveTextContent(/Buy shares first/);
  });

  it("Phase 6: banner reflects unlocked vs locked and offers the lock sheet", () => {
    renderDetail(listing, { ownedShares: 160, lockedShares: 100 });
    expect(screen.getByTestId("ownership-copy")).toHaveTextContent(/You own 160 shares · 100 locked/);
    expect(screen.getByTestId("ownership-state")).toHaveTextContent("Not earning yet");
    fireEvent.click(screen.getByTestId("banner-lock"));
    expect(screen.getByTestId("lock-sheet")).toBeInTheDocument();

    // Calculator pill mirrors the same numbers
    expect(screen.getByTestId("owned-pill")).toHaveTextContent(/You own 160 · 100 locked/);
  });

  it("Phase 6: fully locked state shows Earning and hides the lock CTA", () => {
    renderDetail(listing, { ownedShares: 100, lockedShares: 100 });
    expect(screen.getByTestId("ownership-state")).toHaveTextContent("Earning");
    expect(screen.queryByTestId("banner-lock")).not.toBeInTheDocument();
  });

  it("Phase 8: sold-out primary disables the hero CTA with calm copy", () => {
    renderDetail({ ...listing, sharesRemaining: 0, fundingProgressRatio: 1 });
    expect(screen.getByTestId("hero-cta")).toHaveTextContent(/Primary offering sold out/);
    expect(screen.getByTestId("hero-cta")).toBeDisabled();
    expect(screen.getByTestId("status-banner")).toHaveTextContent(/Open for Funding · 100%/);
  });
});
