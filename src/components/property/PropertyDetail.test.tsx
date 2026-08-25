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
      onBuyShares={overrides?.onBuyShares ?? (() => {})}
      documents={overrides?.documents}
      onDownloadDoc={overrides?.onDownloadDoc}
    />,
  );
}

describe("PropertyDetail — redesign Phase 1 skeleton", () => {
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

  it("renders spec's four key metric cards", () => {
    renderDetail(listing);
    expect(screen.getByText("Price per share")).toBeInTheDocument();
    expect(screen.getByText("Monthly yield / share")).toBeInTheDocument();
    expect(screen.getByText("Total property value")).toBeInTheDocument();
    expect(screen.getByText("Shares sold")).toBeInTheDocument();
  });

  it("renders the upgraded calculator in position", () => {
    const onBuyShares = vi.fn();
    renderDetail(listing, { onBuyShares });
    expect(screen.getByTestId("income-calculator")).toBeInTheDocument();
    expect(screen.getByText("How much can I earn?")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("calc-buy"));
    expect(onBuyShares).toHaveBeenCalledWith(1);
  });

  it("renders Phase 5 sections: trust, about + sheet, documents, similar", () => {
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
    expect(screen.getByTestId("property-trust")).toHaveTextContent("Why invest with confidence");
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

  it("hides Market section for primary, shows it for secondary", () => {
    const { unmount } = renderDetail(listing);
    expect(screen.queryByTestId("market-section")).not.toBeInTheDocument();
    unmount();
    renderDetail(secondaryListing, { orderBook });
    expect(screen.getByTestId("market-section")).toBeInTheDocument();
    expect(screen.getByTestId("best-bid-ask")).toBeInTheDocument();
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
