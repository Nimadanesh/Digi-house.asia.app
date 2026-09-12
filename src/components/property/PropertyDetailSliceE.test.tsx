// Slice E route wiring tests (PROMPT 05): PropertyDetail composes the canonical
// view-model + V1 projected economics — Grand 2 BDM gets the V1 thesis +
// $8M single hero value, other listings degrade honestly, Income carries the
// V1 chain, Ownership carries V1 decision facts (no simulated holders), and
// the hero CTA follows the ShareModel market state. Existing flows (sheets,
// tabs, resale) untouched.

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
  id: "re-128862",
  title: "Grand 2 BDM Ocean Pool Villa",
  location: "JOALI Being, Maldives",
  description: "Waterfront one-bedroom.",
  images: ["/images/properties/joali-being-01.jpg"],
  totalShares: 2500,
  sharePriceUsd: 10000,
  status: "funding",
  ownerWalletAddress: "EQTest",
  annualRentUsd: 17256000,
  createdAt: "2026-07-10T09:00:00Z",
  sharesSold: 2300,
  sharesRemaining: 200,
  fundingProgressRatio: 0.92,
  monthlyYieldRate: 7.19,
  totalValueUsd: 8000000,
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
  id: "re-126855",
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
      ownedShares={0}
      lockedShares={0}
    />,
  );
}

describe("Slice E wiring (Grand 2 BDM, PROMPT 05 V1)", () => {
  it("shows the V1 thesis, $8M single hero value, and V1 investment facts", () => {
    renderDetail(grandListing);
    // V1 thesis: ANR $97,230.25, modeled revenue $21.39M–$31.89M, $195.43/yr.
    expect(screen.getByTestId("estate-v1-thesis")).toBeInTheDocument();
    expect(screen.getByTestId("thesis-anr")).toHaveTextContent("$97,230.25");
    expect(screen.getByTestId("thesis-revenue")).toHaveTextContent("$21,390,655.00");
    expect(screen.getByTestId("thesis-revenue")).toHaveTextContent("$31,891,522.00");
    expect(screen.getByTestId("thesis-pershare")).toHaveTextContent("$195.43");
    expect(screen.getByTestId("estate-investment")).toBeInTheDocument();
    // PROMPT 05: hero shows exactly $8M single (V1 canonical — never the band).
    expect(screen.getByTestId("hero-estate-value")).toHaveTextContent("$8,000,000.00");
    expect(screen.getByTestId("hero-estate-value")).not.toHaveTextContent("10,000,000");
    expect(
      screen.getByTestId("hero-estate-value").querySelector('[aria-label="Estimated value"]'),
    ).toBeInTheDocument();
    // QA: metrics KPI prefers the same canonical figure; investment shows V1 shares.
    expect(screen.getByTestId("metrics-grid")).toHaveTextContent("$8M");
    expect(screen.getByTestId("investment-estate-value")).toHaveTextContent("$8M");
    expect(screen.getByTestId("investment-total-shares")).toHaveTextContent("80,000");
    expect(screen.getByTestId("investment-primary-price")).toHaveTextContent("$100.00");
    // Legacy Slice A sections never render on the Estate tab.
    expect(screen.queryByTestId("estate-economics")).not.toBeInTheDocument();
    expect(screen.queryByTestId("estate-costs")).not.toBeInTheDocument();
    expect(screen.queryByTestId("estate-allocation")).not.toBeInTheDocument();
    // Reserve Villa CTA closes the Estate tab with the official listing URL.
    const panel = screen.getByTestId("panel-estate");
    expect(panel.lastElementChild).toHaveAttribute("data-testid", "reserve-villa-cta");
    expect(screen.getByTestId("reserve-villa-cta")).toHaveAttribute(
      "href",
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-asia/maldives/bodufushi/joali-being/grand-2-bdm-ocean-pool-villa-128862",
    );
  });

  it("Income tab carries the V1 chain; scenario pills switch modeled evaluations", () => {
    renderDetail(grandListing);
    fireEvent.click(screen.getByTestId("tab-income"));
    expect(screen.getByTestId("income-v1-story")).toBeInTheDocument();
    expect(screen.getByTestId("income-v1-gross")).toHaveTextContent("$26,543,858.25");
    fireEvent.click(screen.getByTestId("scenario-v1-optimistic"));
    expect(screen.getByTestId("income-v1-gross")).toHaveTextContent("$31,891,522.00");
    fireEvent.click(screen.getByTestId("scenario-v1-conservative"));
    expect(screen.getByTestId("income-v1-gross")).toHaveTextContent("$21,390,655.00");
    // V1-only cost lines (5% / 7.5% / 1.5%) — no legacy 17%/10%/18%/12.5%.
    expect(screen.getByTestId("income-v1-cost-agency")).toHaveTextContent("$1,069,532.75");
    expect(screen.getByTestId("income-v1-pershare-annual")).toHaveTextContent("$195.43");
  });

  it("Ownership tab carries V1 decision facts with no simulated holders", () => {
    renderDetail(grandListing);
    fireEvent.click(screen.getByTestId("tab-ownership"));
    expect(screen.getByTestId("ownership-v1-panel")).toBeInTheDocument();
    expect(screen.getByTestId("ownership-v1-price")).toHaveTextContent("$100.00");
    expect(screen.getByTestId("ownership-v1-total")).toHaveTextContent("80,000");
    expect(screen.queryByTestId("holder-analytics")).not.toBeInTheDocument();
  });
});

describe("Slice E wiring (non-Grand listing, PROMPT 05 V1)", () => {
  it("V1 thesis + investment with honest architecture (no legacy sections)", () => {
    renderDetail(plainListing);
    // Rental performance leads with the observed nightly display (range kept).
    expect(screen.getByTestId("rental-story-rent")).toHaveTextContent("$52,200");
    // V1 thesis renders for every V1 estate (Aerial: ANR $64,000, BVI 0% tax).
    expect(screen.getByTestId("estate-v1-thesis")).toBeInTheDocument();
    expect(screen.getByTestId("thesis-anr")).toHaveTextContent("$64,000.00");
    expect(screen.queryByTestId("estate-economics-empty")).not.toBeInTheDocument();
    // Legacy Slice A sections never render.
    expect(screen.queryByTestId("estate-economics")).not.toBeInTheDocument();
    expect(screen.queryByTestId("estate-costs")).not.toBeInTheDocument();
    expect(screen.queryByTestId("estate-allocation")).not.toBeInTheDocument();
    // Aerial $18M approved ESTIMATED (research $18–22M band low per PM lowest-value rule).
    expect(screen.getByTestId("hero-estate-value")).toHaveTextContent("$18,000,000.00");
    expect(
      screen.getByTestId("hero-estate-value").querySelector('[aria-label="Estimated value"]'),
    ).toBeInTheDocument();
    // V1 fractionalization: 180,000 shares at $100 (never fixture 1,000).
    expect(screen.getByTestId("investment-total-shares")).toHaveTextContent("180,000");
    expect(screen.getByTestId("investment-reference-value")).toHaveTextContent("$100.00");
    expect(screen.getByTestId("estate-investment")).toBeVisible();
    // Reserve Villa CTA closes the Estate tab even without engine economics.
    const panel = screen.getByTestId("panel-estate");
    expect(panel.lastElementChild).toHaveAttribute("data-testid", "reserve-villa-cta");
    expect(screen.getByTestId("reserve-villa-cta").getAttribute("href")).toMatch(/-126855$/);
  });

  it("Income V1 pills stay selectable and never fabricate (Aerial base gross)", () => {
    renderDetail(plainListing);
    fireEvent.click(screen.getByTestId("tab-income"));
    expect(screen.getByTestId("scenario-v1-base")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("income-v1-gross")).toHaveTextContent("$17,472,000.00");
    fireEvent.click(screen.getByTestId("scenario-v1-conservative"));
    expect(screen.getByTestId("scenario-v1-conservative")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("scenario-v1-base")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("income-v1-gross")).toHaveTextContent("$14,080,000.00");
    // Honest zeros only: 0% BVI tax and no-lock accrued may read $0.00, but
    // modeled gross never fabricates a zero.
    expect(screen.getByTestId("income-v1-gross")).not.toHaveTextContent("$0.00");
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
