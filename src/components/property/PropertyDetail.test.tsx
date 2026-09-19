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
  id: "re-128862",
  title: "Grand 2 BDM Ocean Pool Villa (JOALI Being)",
  location: "Bodufushi, JOALI Being, Raa Atoll, Maldives",
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
      ownedShares={overrides?.ownedShares ?? 0}
      lockedShares={overrides?.lockedShares ?? 0}
      accruedUnpaidUsd={overrides?.accruedUnpaidUsd}
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

  it("PRIMARY Estate tab: desire sections (why/specs/amenities/location) per structure §4", async () => {
    renderDetail(listing);
    // Structure §4: desire via canonical facts; thesis/investment panels moved
    // to Income/Ownership; the funding panel / Slice A economics stay retired.
    expect(screen.queryByTestId("funding-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("estate-economics")).not.toBeInTheDocument();
    expect(screen.queryByTestId("estate-costs")).not.toBeInTheDocument();
    expect(screen.queryByTestId("estate-allocation")).not.toBeInTheDocument();
    expect(screen.queryByTestId("primary-performance-charts")).not.toBeInTheDocument();
    // §4.1 Why this estate — canonical description + derived highlights.
    expect(screen.getByTestId("estate-why")).toBeInTheDocument();
    // §4.2 Key specs — canonical facts; year/status/lease render pending.
    expect(screen.getByTestId("estate-specs")).toBeInTheDocument();
    // §4.3 Amenities grid (premium lists from the adopted record).
    expect(screen.getByTestId("estate-amenities")).toBeInTheDocument();
    // §4.4 Location (D7) — text-only until a map asset exists; the transfer
    // row is collapsed by default (revision contract) and expands to the
    // locked seaplane text + protected Reserve CTA closing the card.
    expect(screen.getByTestId("estate-location")).toBeInTheDocument();
    expect(screen.queryByTestId("estate-location-transfer")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("estate-location-transfer-toggle"));
    expect(screen.getByTestId("estate-location-transfer")).toHaveTextContent(/seaplane/);
    expect(screen.getByTestId("estate-location-card").contains(screen.getByTestId("reserve-villa-cta"))).toBe(
      true,
    );
    // Retired from this tab (files kept on disk, no longer wired).
    expect(screen.queryByTestId("estate-v1-thesis")).not.toBeInTheDocument();
    expect(screen.queryByTestId("estate-investment")).not.toBeInTheDocument();
    expect(screen.queryByTestId("rental-story")).not.toBeInTheDocument();
    // Protected: no resale block while primary shares remain; Reserve CTA closes.
    expect(screen.queryByTestId("resale-block")).not.toBeInTheDocument();
    expect(screen.getByTestId("reserve-villa-cta")).toBeInTheDocument();
  });

  it("SECONDARY Estate tab: desire sections + resale block collapsed by default", () => {
    renderDetail(secondaryListing, { orderBook });
    expect(screen.queryByTestId("funding-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("resale-block")).toBeInTheDocument();
    // Collapsed: only the header renders; market content is hidden from the default scroll.
    expect(screen.queryByTestId("resale-block-content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("market-summary")).not.toBeInTheDocument();
    expect(screen.getByTestId("estate-why")).toBeInTheDocument();
    expect(screen.queryByTestId("property-fundamentals")).not.toBeInTheDocument();
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

  it("Income tab: V1 chain (basis → scenarios → costs → excluded → net → position)", async () => {
    renderDetail(listing);
    fireEvent.click(screen.getByTestId("tab-income"));
    expect(await screen.findByTestId("panel-income")).toBeInTheDocument();
    // §5.1 Rental basis — ANR leads, modeled occupancy, honest historical line.
    expect(screen.getByTestId("income-basis")).toBeInTheDocument();
    expect(screen.getByTestId("income-basis-anr")).toBeInTheDocument();
    // §5.2 Four locked scenarios; Base expanded by default (controlled cards).
    expect(screen.getByTestId("income-scenarios")).toBeInTheDocument();
    expect(screen.getByTestId("scenario-cards-base")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("scenario-cards-conservative")).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByTestId("scenario-cards-average"));
    expect(screen.getByTestId("scenario-cards-average-detail")).toBeInTheDocument();
    expect(screen.queryByTestId("scenario-cards-base-detail")).not.toBeInTheDocument();
    // §5.3–§5.5: expandable modeled costs, excluded charges, net economics.
    expect(screen.getByTestId("income-costs")).toBeInTheDocument();
    expect(screen.getByTestId("income-excluded")).toBeInTheDocument();
    expect(screen.getByTestId("income-net")).toBeInTheDocument();
    // Preserved position-income block; retired surfaces stay retired.
    expect(screen.getByTestId("income-position")).toBeInTheDocument();
    expect(screen.queryByTestId("income-analytics")).not.toBeInTheDocument();
    expect(screen.queryByTestId("income-calculator")).not.toBeInTheDocument();
  });

  it("Ownership tab (secondary): decision sections (no yield, no preview — moved to Earn)", async () => {
    renderDetail(secondaryListing, { orderBook, ownedShares: 160, lockedShares: 100, accruedUnpaidUsd: 1250 });
    fireEvent.click(screen.getByTestId("tab-ownership"));
    expect(await screen.findByTestId("panel-ownership")).toBeInTheDocument();
    // §6.1 Valuation & Shares 2×2 — reference value per share = the $100 V1 nominal.
    expect(screen.getByTestId("ownership-valuation")).toBeInTheDocument();
    expect(screen.getByTestId("ownership-valuation-reference")).toHaveTextContent("$100.00");
    // §6.2 growth + §6.3 exit & liquidity + §6.5 risks.
    expect(screen.getByTestId("ownership-growth")).toBeInTheDocument();
    expect(screen.getByTestId("ownership-exit")).toBeInTheDocument();
    expect(screen.getByTestId("ownership-risks")).toBeInTheDocument();
    // Simulated holder analytics never render as real activity.
    expect(screen.queryByTestId("holder-analytics")).not.toBeInTheDocument();
    // Revision contract: the Yield section AND the position preview are gone
    // from this tab (preview → Earn; owner surfaces → Earn).
    expect(screen.queryByTestId("yield-lock-section")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ownership-preview")).not.toBeInTheDocument();
    expect(screen.queryByTestId("position-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("owner-stay-card")).toBeInTheDocument();
    expect(screen.getByTestId("owner-stay-calendar-cta")).toBeDisabled();
  });

  it("Earn tab (secondary): position simulator + preserved owner position with the lock flow", async () => {
    renderDetail(secondaryListing, { orderBook, ownedShares: 160, lockedShares: 100, accruedUnpaidUsd: 1250 });
    fireEvent.click(screen.getByTestId("tab-earn"));
    expect(await screen.findByTestId("panel-earn")).toBeInTheDocument();
    // Your position simulator (moved from Ownership; $100 × qty exactly).
    expect(screen.getByTestId("earn-card")).toBeInTheDocument();
    expect(screen.getByTestId("earn-investment")).toHaveTextContent("$100.00");
    // Preserved owner position surface + the existing lock flow.
    expect(await screen.findByTestId("position-card")).toBeInTheDocument();
    expect(screen.getByTestId("position-total")).toHaveTextContent("160");
    expect(screen.getByTestId("position-locked")).toHaveTextContent("100");
    expect(screen.getByTestId("position-free")).toHaveTextContent("60");
    expect(screen.getByTestId("position-accrued")).toHaveTextContent("$12.50");
    expect(screen.getByTestId("position-value")).toHaveTextContent("$21,120.00");
    fireEvent.click(screen.getByTestId("position-lock"));
    expect(screen.getByTestId("lock-sheet")).toBeInTheDocument();
  });

  it("Earn tab (primary): ownership banner replaces the position card", async () => {
    renderDetail(listing, { ownedShares: 160, lockedShares: 100 });
    fireEvent.click(screen.getByTestId("tab-earn"));
    expect(await screen.findByTestId("panel-earn")).toBeInTheDocument();
    expect(screen.getByTestId("ownership-banner")).toBeInTheDocument();
    expect(screen.queryByTestId("position-card")).not.toBeInTheDocument();
  });

  it("Details tab: truth sections — operator, legal, pending documents, distribution, historical", () => {
    renderDetail(listing);
    fireEvent.click(screen.getByTestId("tab-details"));
    expect(screen.getByTestId("panel-details")).toBeInTheDocument();
    // Revision contract §15: the pending-only trust block is gone — only
    // genuinely green trust items would render, and none exist yet.
    expect(screen.queryByTestId("property-trust")).not.toBeInTheDocument();
    // §7.1 Operator (D1): Rental Escapes + villa 1's locked specialist.
    expect(screen.getByTestId("details-operator")).toBeInTheDocument();
    expect(screen.getByTestId("details-operator-name")).toHaveTextContent("Amanda Singer");
    // §7.2 Legal & structure (D2): three collapsed rows — expand ownership.
    expect(screen.getByTestId("details-legal")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("details-legal-rows-ownership"));
    expect(screen.getByTestId("details-legal-rows-ownership-detail")).toHaveTextContent(
      /head-lease/,
    );
    // §7.3 Documents (D5): locked titles, honest pending — never fake downloads.
    expect(screen.getByTestId("details-documents")).toBeInTheDocument();
    expect(screen.getByTestId("details-documents-card")).toHaveTextContent(
      "Shareholder Agreement (SPV)",
    );
    expect(screen.getByTestId("details-documents-pending")).toBeInTheDocument();
    // §7.4 distribution & tax + §7.5 historical (honest disclosure).
    expect(screen.getByTestId("details-distribution")).toBeInTheDocument();
    expect(screen.getByTestId("details-historical")).toBeInTheDocument();
    // Retired: About sheet + Similar Properties (structure §7 order).
    expect(screen.queryByTestId("property-about")).not.toBeInTheDocument();
    expect(screen.queryByTestId("similar-properties")).not.toBeInTheDocument();
  });

  it("hero: identity-first — share price + fraction, no APY hero, no fabricated verification", () => {
    renderDetail(listing);
    // No yield-first hero number.
    expect(screen.queryByTestId("hero-apy")).not.toBeInTheDocument();
    expect(screen.getByTestId("hero-price")).toHaveTextContent("$125.00");
    // Hero share line mirrors the Ownership-tab percentage (Grand V1: 80,000
    // shares → shared ownershipPct format → "0.0013").
    expect(screen.getByTestId("hero-fraction")).toHaveTextContent("1 share ≈ 0.0013%");
    expect(screen.queryByText(/of the estate/)).not.toBeInTheDocument();
    // No verification chip without real data.
    expect(screen.queryByTestId("hero-verified")).not.toBeInTheDocument();
  });

  it("hero: verification chip renders when genuinely verified", () => {
    renderDetail(listing, { verification: { status: "verified", lastVerifiedAt: "2026-08-01" } });
    expect(screen.getByTestId("hero-verified")).toHaveTextContent("Verified 2026-08-01");
  });

  it("hero CTA states: primary non-owner → Buy", () => {
    const onBuy = vi.fn();
    render(<PropertyDetail listing={listing} onBuy={onBuy} />);
    expect(screen.getByTestId("hero-cta")).toHaveTextContent(/Buy · \$125\.00/);
    fireEvent.click(screen.getByTestId("hero-cta"));
    expect(onBuy).toHaveBeenCalledOnce();
  });

  it("hero CTA states: owner → Manage Ownership switches to the Ownership tab", async () => {
    renderDetail(listing, { ownedShares: 160 });
    expect(screen.getByTestId("hero-cta")).toHaveTextContent("Manage Ownership");
    // V1 canonical fraction (80,000 shares for Grand): 160 → 0.2% of the estate.
    expect(screen.getByTestId("hero-ownership")).toHaveTextContent(/You own 160 shares · 0\.2% of this estate/);
    fireEvent.click(screen.getByTestId("hero-cta"));
    expect(await screen.findByTestId("panel-ownership")).toBeInTheDocument();
  });

  it("hero CTA states: resale → Buy resale (priced, Layer-1)", () => {
    const onBuy = vi.fn();
    render(
      <PropertyDetail listing={secondaryListing} orderBook={orderBook} onBuy={onBuy} />,
    );
    expect(screen.getByTestId("hero-cta")).toHaveTextContent("Buy resale · $132.00");
    fireEvent.click(screen.getByTestId("hero-cta"));
    expect(onBuy).toHaveBeenCalledOnce();
  });

  it("hero CTA states: sold-out primary → View Resale Opportunities opens the resale block", () => {
    renderDetail({ ...listing, sharesRemaining: 0, fundingProgressRatio: 1 });
    // Layer-1: the funding bar renders the honest all-sold line (banner retired).
    expect(screen.getByTestId("funding-bar-sold-out")).toHaveTextContent(/resale is now the only way in/);
    fireEvent.click(screen.getByTestId("hero-cta"));
    // Resale block on the Estate tab is now expanded.
    expect(screen.getByTestId("resale-block-content")).toBeInTheDocument();
  });

  it("metrics grid: the fixed 4-stat section (structure §3) — Base figures, no price cell", () => {
    renderDetail(listing);
    expect(screen.getByText("Monthly income")).toBeInTheDocument();
    expect(screen.getByText("Proj. / year")).toBeInTheDocument();
    expect(screen.getByText("Avg. nightly rate")).toBeInTheDocument();
    expect(screen.getByText("Est. growth")).toBeInTheDocument();
    // Base-scenario consistency: monthly = the Base scenario per-share figure.
    expect(screen.getByTestId("metrics-monthly")).toHaveTextContent("$16.25");
    // Price/funding live in the hero (L0) — never duplicated in the 4-stat.
    expect(screen.queryByTestId("metrics-price")).not.toBeInTheDocument();
    expect(screen.queryByTestId("metrics-funded")).not.toBeInTheDocument();
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
});
