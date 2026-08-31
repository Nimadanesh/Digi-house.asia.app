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
    verification?: { status: "verified" | "pending" | "unverified"; lastVerifiedAt: string | null };
    stay?: { availability: "available" | "partial" | "unavailable"; unavailableReason: "not_published" | "no_entitlement" | "backend_absent" | null; entitlement: Record<string, unknown> };
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
      verification={overrides?.verification}
      stay={overrides?.stay as never}
    />,
  );
}

describe("PropertyDetail — Phase 9 Slice 2 (4-tab Estate Detail)", () => {
  it("renders header + KPI + 4 tabs on Estate by default", () => {
    renderDetail(listing);
    expect(screen.getByTestId("property-hero")).toBeInTheDocument();
    expect(screen.getByTestId("metrics-grid")).toBeInTheDocument();
    expect(screen.getByTestId("property-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("tab-estate")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("panel-estate")).toBeInTheDocument();
    // The dissolved tabs are gone.
    expect(screen.queryByTestId("tab-overview")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tab-performance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tab-holders")).not.toBeInTheDocument();
  });

  it("PRIMARY Estate tab: funding panel leads, rental story + fundamentals follow", async () => {
    renderDetail(listing);
    expect(screen.getByTestId("funding-panel")).toBeInTheDocument();
    expect(screen.getByTestId("funding-pct")).toHaveTextContent("92%");
    expect(screen.getByTestId("funding-caption")).toHaveTextContent(/92% funded · 80 shares remaining/);
    // Rental-economics narrative with honest unavailable steps.
    expect(screen.getByTestId("rental-story")).toBeInTheDocument();
    expect(screen.getByTestId("rental-story-rent")).toHaveTextContent("$5,200.00");
    expect(screen.getByTestId("rental-story-costs")).toHaveTextContent("Not yet reported");
    expect(screen.getByTestId("rental-story-net")).toHaveTextContent("Not yet reported");
    // Fundamentals (existing data only)
    expect(screen.getByTestId("property-fundamentals")).toBeInTheDocument();
    expect(screen.getByTestId("fundamentals-value")).toHaveTextContent("$80,000.00");
    // Primary never gets a resale block while shares remain.
    expect(screen.queryByTestId("resale-block")).not.toBeInTheDocument();
    // Funding progress charts stay on the Estate tab (simulated, disclosed).
    expect(await screen.findByTestId("primary-performance-charts")).toBeInTheDocument();
    // The default tab ships WITHOUT the heavy analytics chunks.
    expect(screen.queryByTestId("income-analytics")).not.toBeInTheDocument();
  });

  it("SECONDARY Estate tab: resale block collapsed by default; no funding panel", () => {
    renderDetail(secondaryListing, { orderBook });
    expect(screen.queryByTestId("funding-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("resale-block")).toBeInTheDocument();
    // Collapsed: only the header renders; market content is hidden from the default scroll.
    expect(screen.queryByTestId("resale-block-content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("market-summary")).not.toBeInTheDocument();
    expect(screen.getByTestId("rental-story")).toBeInTheDocument();
    expect(screen.getByTestId("property-fundamentals")).toBeInTheDocument();
  });

  it("resale block expands: ownership-value summary + acquire CTA; charts behind nested expander", async () => {
    renderDetail(secondaryListing, { orderBook });
    fireEvent.click(screen.getByTestId("resale-toggle"));
    expect(screen.getByTestId("resale-block-content")).toBeInTheDocument();
    // Ownership vocabulary on the market summary.
    expect(screen.getByTestId("market-current-price")).toHaveTextContent("$132.00");
    expect(screen.getByTestId("best-ask")).toHaveTextContent("$132.00");
    expect(screen.getByTestId("best-bid")).toHaveTextContent("—");
    expect(screen.getByTestId("market-spread")).toHaveTextContent("—");
    expect(screen.getByText("Best asking price")).toBeInTheDocument();
    expect(screen.getByText("Best offer")).toBeInTheDocument();
    // Acquire CTA present; price history is demoted behind an expander.
    expect(screen.getByTestId("resale-acquire-cta")).toBeInTheDocument();
    expect(screen.queryByTestId("price-svg")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("resale-price-history-toggle"));
    expect(await screen.findByTestId("price-svg")).toBeInTheDocument();
    expect(screen.getByText("Price history (simulated)")).toBeInTheDocument();
  });

  it("SECONDARY resale summary: no vs-offer delta without a last trade", () => {
    renderDetail(secondaryNoLastTrade, { orderBook });
    fireEvent.click(screen.getByTestId("resale-toggle"));
    expect(screen.queryByTestId("market-delta")).not.toBeInTheDocument();
  });

  it("SECONDARY resale summary: vs-offer delta renders only when a last trade exists", () => {
    renderDetail(secondaryListing, { orderBook });
    fireEvent.click(screen.getByTestId("resale-toggle"));
    expect(screen.getByTestId("market-delta")).toHaveTextContent("+4.8% vs offer");
  });

  it("Income tab: analytics + projections calculator", async () => {
    renderDetail(listing);
    fireEvent.click(screen.getByTestId("tab-income"));
    expect(await screen.findByTestId("income-analytics")).toBeInTheDocument();
    expect(screen.getByTestId("income-calculator")).toBeInTheDocument();
  });

  it("Ownership tab (secondary): position card, owner stay, yield-lock, holder analytics", async () => {
    renderDetail(secondaryListing, { orderBook, ownedShares: 160, lockedShares: 100, accruedUnpaidUsd: 1250 });
    fireEvent.click(screen.getByTestId("tab-ownership"));
    expect(await screen.findByTestId("position-card")).toBeInTheDocument();
    expect(screen.getByTestId("position-total")).toHaveTextContent("160");
    expect(screen.getByTestId("position-locked")).toHaveTextContent("100");
    expect(screen.getByTestId("position-free")).toHaveTextContent("60");
    expect(screen.getByTestId("position-accrued")).toHaveTextContent("$12.50");
    expect(screen.getByTestId("position-value")).toHaveTextContent("$21,120.00");
    // Owner Stay P0 preview + lock management + holder analytics.
    expect(screen.getByTestId("owner-stay-card")).toBeInTheDocument();
    expect(screen.getByTestId("owner-stay-calendar-cta")).toBeDisabled();
    expect(screen.getByTestId("yield-lock-section")).toBeInTheDocument();
    expect(await screen.findByTestId("holder-analytics")).toBeInTheDocument();
    // Lock still opens the existing LockSheet flow.
    fireEvent.click(screen.getByTestId("position-lock"));
    expect(screen.getByTestId("lock-sheet")).toBeInTheDocument();
  });

  it("Ownership tab (primary): ownership banner replaces the position card", async () => {
    renderDetail(listing, { ownedShares: 160, lockedShares: 100 });
    fireEvent.click(screen.getByTestId("tab-ownership"));
    expect(await screen.findByTestId("ownership-banner")).toBeInTheDocument();
    expect(screen.queryByTestId("position-card")).not.toBeInTheDocument();
  });

  it("Details tab holds trust (verification + management), about, documents, similar", () => {
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
    // Trust lives on Details for every listing now.
    expect(screen.getByTestId("property-trust")).toBeInTheDocument();
    expect(screen.getByTestId("trust-verification-pending")).toHaveTextContent("Verification pending");
    expect(screen.getByTestId("trust-management")).toHaveTextContent(/not yet published/);
    expect(screen.getByTestId("property-about")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("about-more"));
    expect(screen.getByTestId("sheet-panel")).toBeInTheDocument();
    expect(screen.getByText("72 m²")).toBeInTheDocument();

    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Offering Memorandum")).toBeInTheDocument();
    expect(screen.getByTestId("similar-properties")).toBeInTheDocument();
    const cards = screen.getAllByTestId("similar-card");
    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).not.toContain("Marina Vista Apt 4B");
  });

  it("trust renders a Verified chip only when a real verification date exists", () => {
    renderDetail(listing, { verification: { status: "verified", lastVerifiedAt: "2026-08-01" } });
    fireEvent.click(screen.getByTestId("tab-details"));
    expect(screen.getByTestId("trust-verified")).toHaveTextContent("Verified 2026-08-01");
    expect(screen.queryByTestId("trust-verification-pending")).not.toBeInTheDocument();
  });

  it("hero: identity-first — share price + fraction, no APY hero, no fabricated verification", () => {
    renderDetail(listing);
    // No yield-first hero number.
    expect(screen.queryByTestId("hero-apy")).not.toBeInTheDocument();
    expect(screen.getByTestId("hero-price")).toHaveTextContent("$125.00");
    expect(screen.getByTestId("hero-fraction")).toHaveTextContent(/1 share ≈ 1\/[\d,]+ of the estate/);
    // No verification chip without real data.
    expect(screen.queryByTestId("hero-verified")).not.toBeInTheDocument();
  });

  it("hero: verification chip renders when genuinely verified", () => {
    renderDetail(listing, { verification: { status: "verified", lastVerifiedAt: "2026-08-01" } });
    expect(screen.getByTestId("hero-verified")).toHaveTextContent("Verified 2026-08-01");
  });

  it("hero CTA states: primary non-owner → Acquire Ownership", () => {
    const onBuy = vi.fn();
    render(<PropertyDetail listing={listing} onBuy={onBuy} previewShares={1} onSharesChange={() => {}} onBuyShares={() => {}} />);
    expect(screen.getByTestId("hero-cta")).toHaveTextContent(/Acquire Ownership · \$125\.00/);
    fireEvent.click(screen.getByTestId("hero-cta"));
    expect(onBuy).toHaveBeenCalledOnce();
  });

  it("hero CTA states: owner → Manage Ownership switches to the Ownership tab", async () => {
    renderDetail(listing, { ownedShares: 160 });
    expect(screen.getByTestId("hero-cta")).toHaveTextContent("Manage Ownership");
    expect(screen.getByTestId("hero-ownership")).toHaveTextContent(/You own 160 shares · 16% of this estate/);
    fireEvent.click(screen.getByTestId("hero-cta"));
    expect(await screen.findByTestId("panel-ownership")).toBeInTheDocument();
  });

  it("hero CTA states: resale → Acquire Resale Ownership", () => {
    const onBuy = vi.fn();
    render(
      <PropertyDetail listing={secondaryListing} orderBook={orderBook} onBuy={onBuy} previewShares={1} onSharesChange={() => {}} onBuyShares={() => {}} />,
    );
    expect(screen.getByTestId("hero-cta")).toHaveTextContent("Acquire Resale Ownership");
    fireEvent.click(screen.getByTestId("hero-cta"));
    expect(onBuy).toHaveBeenCalledOnce();
  });

  it("hero CTA states: sold-out primary → View Resale Opportunities opens the resale block", () => {
    renderDetail({ ...listing, sharesRemaining: 0, fundingProgressRatio: 1 });
    expect(screen.getByTestId("status-banner")).toHaveTextContent(/Open for Funding · 100%/);
    fireEvent.click(screen.getByTestId("hero-cta"));
    // Resale block on the Estate tab is now expanded.
    expect(screen.getByTestId("resale-block-content")).toBeInTheDocument();
  });

  it("metrics grid uses ownership-first labels", () => {
    renderDetail(listing);
    expect(screen.getByText("Share price")).toBeInTheDocument();
    expect(screen.getByText("Projected monthly income / share")).toBeInTheDocument();
    expect(screen.getByText("Total property value")).toBeInTheDocument();
    expect(screen.getByText("Shares sold / total")).toBeInTheDocument();
    // KPI grid + funding panel (primary charts may repeat the figure — be tolerant).
    expect(screen.getAllByText("920 / 1,000").length).toBeGreaterThanOrEqual(2);
  });

  it("owner stay card: non-owner sees the privilege explainer; owner sees the disabled calendar CTA", () => {
    const { unmount } = renderDetail(secondaryListing, { orderBook });
    fireEvent.click(screen.getByTestId("tab-ownership"));
    expect(screen.getByTestId("owner-stay-card")).toBeInTheDocument();
    expect(screen.queryByTestId("owner-stay-calendar-cta")).not.toBeInTheDocument();
    unmount();

    renderDetail(secondaryListing, { orderBook, ownedShares: 160 });
    fireEvent.click(screen.getByTestId("tab-ownership"));
    expect(screen.getByTestId("owner-stay-availability")).toHaveTextContent("Data pending");
    expect(screen.getByTestId("owner-stay-calendar-cta")).toBeDisabled();
  });

  it("yield section shows the buy-first hint for non-owners on the Ownership tab", () => {
    renderDetail(listing);
    fireEvent.click(screen.getByTestId("tab-ownership"));
    expect(screen.getByTestId("yield-lock-section")).toHaveTextContent(/Buy shares first/);
  });
});
