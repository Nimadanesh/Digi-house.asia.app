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
import { getFinancialModelV1 } from "@/lib/economics/estates/financial-model-v1-inputs";
import { v1ScenarioPerShareCents } from "@/lib/economics/property-presentation";
import { usd } from "@/lib/format";

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

describe("Structure §4 wiring (Grand 2 BDM, villa 1)", () => {
  it("Estate tab: desire sections lead; $8M hero value; reserve CTA closes; economics moved off-tab", () => {
    renderDetail(grandListing);
    // Structure §4.1–§4.4: why / specs / amenities / location.
    expect(screen.getByTestId("estate-why")).toBeInTheDocument();
    expect(screen.getByTestId("estate-specs")).toBeInTheDocument();
    expect(screen.getByTestId("estate-amenities")).toBeInTheDocument();
    expect(screen.getByTestId("estate-location")).toBeInTheDocument();
    // PROMPT 05 (DEC-013 form): the hero value row shows the compact $8M single
    // (V1 canonical — never the band, never the full "Own a piece" sentence).
    expect(screen.getByTestId("hero-estate-value")).toHaveTextContent("Estate value: $8M");
    expect(screen.getByTestId("hero-estate-value")).not.toHaveTextContent("10,000,000");
    expect(
      screen.getByTestId("hero-estate-value").querySelector('[aria-label="Estimated value"]'),
    ).toBeInTheDocument();
    // Structure §3: the 4-stat grid carries the presented BASE monthly (Grand
    // $16.25) — thesis/investment no longer render on this tab (moved).
    expect(screen.getByTestId("metrics-grid")).toHaveTextContent("$16.25");
    expect(screen.queryByTestId("estate-v1-thesis")).not.toBeInTheDocument();
    expect(screen.queryByTestId("estate-investment")).not.toBeInTheDocument();
    // Legacy Slice A sections never render on the Estate tab.
    expect(screen.queryByTestId("estate-economics")).not.toBeInTheDocument();
    expect(screen.queryByTestId("estate-costs")).not.toBeInTheDocument();
    expect(screen.queryByTestId("estate-allocation")).not.toBeInTheDocument();
    // Reserve Villa CTA closes the Estate tab with the official listing URL.
    // Revision contract: the Reserve CTA closes the Location card.
    expect(screen.getByTestId("estate-location-card").contains(screen.getByTestId("reserve-villa-cta"))).toBe(
      true,
    );
    expect(screen.getByTestId("reserve-villa-cta")).toHaveAttribute(
      "href",
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-asia/maldives/bodufushi/joali-being/grand-2-bdm-ocean-pool-villa-128862",
    );
  });

  it("Income tab: the V1 chain with scenario cards switching modeled evaluations", () => {
    renderDetail(grandListing);
    fireEvent.click(screen.getByTestId("tab-income"));
    expect(screen.getByTestId("panel-income")).toBeInTheDocument();
    expect(screen.getByTestId("income-basis-anr")).toBeInTheDocument();
    // Base expanded by default; its gross row shows the modeled base revenue.
    expect(screen.getByTestId("scenario-cards-base")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("scenario-base-gross")).toHaveTextContent("$26.5M");
    fireEvent.click(screen.getByTestId("scenario-cards-optimistic"));
    expect(screen.getByTestId("scenario-optimistic-gross")).toHaveTextContent("$31.9M");
    fireEvent.click(screen.getByTestId("scenario-cards-conservative"));
    expect(screen.getByTestId("scenario-conservative-gross")).toHaveTextContent("$21.4M");
    // Per-share rows follow the selected scenario (locked ÷ shares derivation).
    const grand = getFinancialModelV1("re-128862")!;
    const conservative = v1ScenarioPerShareCents(grand.conservative, grand.totalShares);
    expect(screen.getByTestId("scenario-conservative-per-share-annual")).toHaveTextContent(
      usd(conservative.annualCents!),
    );
  });

  it("Ownership tab: V1 decision facts (valuation 2×2) with no simulated holders", () => {
    renderDetail(grandListing);
    fireEvent.click(screen.getByTestId("tab-ownership"));
    expect(screen.getByTestId("panel-ownership")).toBeInTheDocument();
    expect(screen.getByTestId("ownership-valuation-reference")).toHaveTextContent("$100.00");
    expect(screen.getByTestId("ownership-valuation-shares")).toHaveTextContent("80,000");
    expect(screen.queryByTestId("holder-analytics")).not.toBeInTheDocument();
  });
});

describe("Slice E wiring (non-Grand listing, PROMPT 05 V1)", () => {
  it("Structure §4 sections render for every adopted villa (Aerial) — no legacy sections", () => {
    renderDetail(plainListing);
    // Structure §4: canonical facts lead; the rental story retired from the tab.
    expect(screen.getByTestId("estate-why")).toBeInTheDocument();
    expect(screen.getByTestId("estate-location")).toBeInTheDocument();
    expect(screen.queryByTestId("estate-economics-empty")).not.toBeInTheDocument();
    // Legacy Slice A sections never render.
    expect(screen.queryByTestId("estate-economics")).not.toBeInTheDocument();
    expect(screen.queryByTestId("estate-costs")).not.toBeInTheDocument();
    expect(screen.queryByTestId("estate-allocation")).not.toBeInTheDocument();
    // Aerial $18M approved ESTIMATED (research $18–22M band low per PM lowest-value rule) — compact form.
    expect(screen.getByTestId("hero-estate-value")).toHaveTextContent("Estate value: $18M");
    expect(
      screen.getByTestId("hero-estate-value").querySelector('[aria-label="Estimated value"]'),
    ).toBeInTheDocument();
    // Reserve Villa CTA closes the Estate tab even without engine economics.
    // Revision contract: the Reserve CTA closes the Location card.
    expect(screen.getByTestId("estate-location-card").contains(screen.getByTestId("reserve-villa-cta"))).toBe(
      true,
    );
    expect(screen.getByTestId("reserve-villa-cta").getAttribute("href")).toMatch(/-126855$/);
  });

  it("Income scenario cards stay selectable and never fabricate (Aerial base gross)", () => {
    renderDetail(plainListing);
    fireEvent.click(screen.getByTestId("tab-income"));
    expect(screen.getByTestId("scenario-cards-base")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("scenario-base-gross")).toHaveTextContent("$17.5M");
    fireEvent.click(screen.getByTestId("scenario-cards-conservative"));
    expect(screen.getByTestId("scenario-cards-conservative")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("scenario-cards-base")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("scenario-conservative-gross")).toHaveTextContent("$14.1M");
    // Honest zeros only: 0% BVI tax may read $0.00, but modeled gross never
    // fabricates a zero.
    expect(screen.getByTestId("scenario-conservative-gross")).not.toHaveTextContent("$0.00");
  });

  it("resale (non-funding) listing renders the CTA last with its own URL (no funding guard)", () => {
    renderDetail({ ...plainListing, status: "resale", sharesRemaining: 0 });
    // Revision contract: the Reserve CTA closes the Location card.
    expect(screen.getByTestId("estate-location-card").contains(screen.getByTestId("reserve-villa-cta"))).toBe(
      true,
    );
    expect(screen.getByTestId("reserve-villa-cta")).toHaveTextContent("View & Reserve");
    expect(screen.getByTestId("reserve-villa-cta").getAttribute("href")).toMatch(/-126855$/);
  });

  it("funded (non-funding) listing renders the CTA last with its own URL (no funding guard)", () => {
    renderDetail({ ...grandListing, status: "funded", sharesRemaining: 0 });
    // Revision contract: the Reserve CTA closes the Location card.
    expect(screen.getByTestId("estate-location-card").contains(screen.getByTestId("reserve-villa-cta"))).toBe(
      true,
    );
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
    // Layer-1: the secondary CTA is priced at the live ask.
    expect(cta).toHaveTextContent("Buy resale · $132.00");
    expect(cta).toBeEnabled();
  });

  it("resale with no ask keeps the CTA disabled (no invented liquidity)", () => {
    const resale: Listing = { ...plainListing, status: "resale", sharesRemaining: 0 };
    renderDetail(resale, { propertyId: resale.id, bids: [], asks: [] });
    expect(screen.getByTestId("hero-cta")).toBeDisabled();
  });
});
