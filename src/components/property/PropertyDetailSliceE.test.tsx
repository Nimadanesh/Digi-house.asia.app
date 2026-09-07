// Slice E route wiring tests: PropertyDetail composes the canonical view-model —
// Grand 2 BDM gets engine-wired economics + hero value, other listings degrade
// honestly, scenario pills switch evaluations, and the hero CTA follows the
// ShareModel market state. Existing flows (sheets, tabs, resale) untouched.

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import { PropertyDetail } from "@/components/property/PropertyDetail";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock("@/hooks/useTrades", () => ({
  useTrades: () => ({ data: [], isLoading: false, isError: false }),
}));
vi.mock("@/hooks/useMarketplace", () => ({
  useMarketplace: () => ({ data: [], isLoading: false, isError: false }),
}));
vi.mock("@/hooks/usePortfolio", () => ({
  usePortfolio: () => ({ data: undefined, isLoading: false }),
}));
vi.mock("@/hooks/useLocks", () => ({
  useLocks: () => ({ data: { locks: [] }, isLoading: false }),
  useMeSummary: () => ({ data: undefined, isLoading: false }),
  useCreateLock: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useRequestUnlock: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null, variables: null }),
  activeLocksForProperty: () => [],
}));
vi.mock("@/hooks/useSells", () => ({
  useInstantSell: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  usePlaceOrder: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
}));

const grandListing: Listing = {
  id: "prop-marina-vista-4b",
  title: "Grand 2 BDM Ocean Pool Villa",
  location: "JOALI Being, Maldives",
  description: "Waterfront one-bedroom.",
  images: ["/images/properties/joali-being-01.jpg"],
  totalShares: 2500,
  sharePriceUsd: 8000,
  status: "funding",
  ownerWalletAddress: "EQTest",
  annualRentUsd: 17256000,
  createdAt: "2026-07-10T09:00:00Z",
  sharesSold: 2300,
  sharesRemaining: 200,
  fundingProgressRatio: 0.92,
  monthlyYieldRate: 7.19,
  totalValueUsd: 82000000,
  nightlyRate: "$67,655",
  meta: {
    sizeSqm: 72,
    yearBuilt: 2019,
    propertyType: "Apartment",
    rentalStatus: "rented",
    leaseUntil: "2026-12-31",
    activeTenant: true,
    tokenizationDocUrl: "#tokenization-demo",
  },
  rentalHistory: [],
};

const plainListing: Listing = {
  ...grandListing,
  id: "prop-soho-loft-studio",
  title: "The Aerial",
  totalShares: 1000,
  sharesRemaining: 600,
};

function renderDetail(listing: Listing, orderBook?: OrderBookState) {
  return render(
    <PropertyDetail
      listing={listing}
      orderBook={orderBook}
      onBuy={() => {}}
      previewShares={1}
      onSharesChange={() => {}}
      ownedShares={0}
      lockedShares={0}
      onBuyShares={() => {}}
    />,
  );
}

describe("Slice E wiring (Grand 2 BDM)", () => {
  it("shows canonical economics, hero value with provenance, and all four sections", () => {
    renderDetail(grandListing);
    expect(screen.getByTestId("estate-economics")).toBeInTheDocument();
    expect(screen.getByTestId("economics-gross")).toHaveTextContent("$20,120,625.00");
    expect(screen.getByTestId("estate-costs")).toBeInTheDocument();
    expect(screen.getByTestId("estate-allocation")).toBeInTheDocument();
    expect(screen.getByTestId("estate-investment")).toBeInTheDocument();
    expect(screen.getByTestId("hero-estate-value")).toHaveTextContent("$8,000,000.00");
    expect(
      screen.getByTestId("hero-estate-value").querySelector('[aria-label="Estimated value"]'),
    ).toBeInTheDocument();
    // QA: metrics KPI prefers the same canonical figure (no $8M-vs-legacy clash).
    expect(screen.getByTestId("metrics-grid")).toHaveTextContent("$8,000,000.00");
    expect(screen.getByTestId("investment-estate-value")).toHaveTextContent("$8,000,000.00");
    // Reserve Villa CTA closes the Estate tab with the official listing URL.
    const panel = screen.getByTestId("panel-estate");
    expect(panel.lastElementChild).toHaveAttribute("data-testid", "reserve-villa-cta");
    expect(screen.getByTestId("reserve-villa-cta")).toHaveAttribute(
      "href",
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-asia/maldives/bodufushi/joali-being/grand-2-bdm-ocean-pool-villa-128862",
    );
  });

  it("switches scenario evaluations without touching canonical inputs", () => {
    renderDetail(grandListing);
    fireEvent.click(screen.getByTestId("scenario-pill-upper"));
    expect(screen.getByTestId("economics-gross")).toHaveTextContent("$24,144,750.00");
    expect(screen.getByTestId("economics-occupancy")).toHaveTextContent("90%");
  });
});

describe("Slice E wiring (non-Grand listing)", () => {
  it("same section architecture with honest pending states (no empty shell)", () => {
    renderDetail(plainListing);
    // All four sections render — economics/costs/allocation pending, investment live.
    expect(screen.getByTestId("estate-economics")).toBeInTheDocument();
    expect(screen.getByTestId("economics-nightly")).toHaveTextContent("$52,200–$75,800+");
    expect(screen.getByTestId("economics-pending-note")).toBeInTheDocument();
    expect(screen.queryByTestId("estate-economics-empty")).not.toBeInTheDocument();
    expect(screen.getByTestId("estate-costs")).toBeInTheDocument();
    expect(screen.getByTestId("estate-allocation")).toBeInTheDocument();
    expect(screen.getByTestId("allocation-owner")).toHaveTextContent("Data pending");
    // Aerial $20M approved ESTIMATED/MODELED (central $18–22M midpoint).
    expect(screen.getByTestId("hero-estate-value")).toHaveTextContent("$20,000,000.00");
    expect(
      screen.getByTestId("hero-estate-value").querySelector('[aria-label="Estimated value"]'),
    ).toBeInTheDocument();
    // Share facts still work, now with an approved reference value.
    expect(screen.getByTestId("investment-total-shares")).toHaveTextContent("1,000");
    expect(screen.getByTestId("investment-reference-value")).toHaveTextContent("$20,000.00");
    // Reserve Villa CTA closes the Estate tab even without engine economics.
    const panel = screen.getByTestId("panel-estate");
    expect(panel.lastElementChild).toHaveAttribute("data-testid", "reserve-villa-cta");
    expect(screen.getByTestId("reserve-villa-cta").getAttribute("href")).toMatch(/-126855$/);
  });

  it("scenario tabs stay selectable without engine inputs (bound state is per-estate)", () => {
    renderDetail(plainListing);
    expect(screen.getByTestId("scenario-pill-base")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByTestId("scenario-pill-upper"));
    expect(screen.getByTestId("scenario-pill-upper")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("scenario-pill-base")).toHaveAttribute("aria-pressed", "false");
    // Selection fabricates nothing: derived rows stay pending.
    expect(screen.getByTestId("economics-gross")).toHaveTextContent("Data pending");
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
  });

  it("resale (non-funding) listing renders the CTA last with its own URL (no funding guard)", () => {
    renderDetail({ ...plainListing, status: "resale", sharesRemaining: 0 });
    const panel = screen.getByTestId("panel-estate");
    expect(panel.lastElementChild).toHaveAttribute("data-testid", "reserve-villa-cta");
    expect(screen.getByTestId("reserve-villa-cta")).toHaveTextContent("View & Reserve");
    expect(screen.getByTestId("reserve-villa-cta").getAttribute("href")).toMatch(/-126855$/);
  });

  it("funded (non-funding) listing renders the CTA last with its own URL (no funding guard)", () => {
    renderDetail({ ...grandListing, status: "funded", sharesRemaining: 0 });
    const panel = screen.getByTestId("panel-estate");
    expect(panel.lastElementChild).toHaveAttribute("data-testid", "reserve-villa-cta");
    expect(screen.getByTestId("reserve-villa-cta").getAttribute("href")).toMatch(/-128862$/);
  });

  it("Estate tab clearance follows buyability (fixed chrome differs by state)", () => {
    // Buyable (MainButton chrome): tight tail — the lifted stack is absent.
    renderDetail(plainListing);
    expect(screen.getByTestId("panel-estate").className).toContain("pb-4");
    expect(screen.getByTestId("panel-estate").className).not.toContain("pb-24");
  });

  it("non-buyable Estate tab keeps full clearance (tab bar + lifted sticky)", () => {
    renderDetail({ ...plainListing, status: "resale", sharesRemaining: 0 });
    expect(screen.getByTestId("panel-estate").className).toContain("pb-24");
  });
});

describe("Slice E hero CTA follows the ShareModel market state", () => {
  it("resale with an active ask offers resale acquisition (market-driven)", () => {
    const resale: Listing = { ...plainListing, status: "resale", sharesRemaining: 0 };
    renderDetail(resale, {
      propertyId: resale.id,
      bids: [],
      asks: [{ priceUsd: 13200, quantity: 18, cumulative: 18 }],
      bestAskUsd: 13200,
    });
    const cta = screen.getByTestId("hero-cta");
    expect(cta).toHaveTextContent("Acquire Resale Ownership");
    expect(cta).toBeEnabled();
  });

  it("resale with no ask keeps the CTA disabled (no invented liquidity)", () => {
    const resale: Listing = { ...plainListing, status: "resale", sharesRemaining: 0 };
    renderDetail(resale, { propertyId: resale.id, bids: [], asks: [] });
    expect(screen.getByTestId("hero-cta")).toBeDisabled();
  });
});
