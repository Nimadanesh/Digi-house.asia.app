import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { toMarketplaceEstate } from "@/lib/economics/marketplace-view-model";
import type { Listing } from "@/types/property";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

const listing: Listing = {
  id: "re-128862",
  title: "Grand 2 BDM Ocean Pool Villa (JOALI Being)",
  location: "Bodufushi, JOALI Being, Raa Atoll, Maldives",
  description: "Waterfront one-bedroom.",
  images: ["/images/properties/p1.png"],
  totalShares: 1000,
  sharePriceUsd: 12500,
  status: "funding",
  ownerWalletAddress: "EQA",
  annualRentUsd: 520000,
  createdAt: "2025-01-01T00:00:00Z",
  sharesSold: 920,
  sharesRemaining: 80,
  fundingProgressRatio: 0.92,
  monthlyYieldRate: 6.25,
  totalValueUsd: 8_000_000,
  meta: {
    sizeSqm: 72,
    yearBuilt: 2020,
    propertyType: "Apartment",
    rentalStatus: "rented",
    leaseUntil: "2026-12-31",
    activeTenant: true,
    tokenizationDocUrl: "#",
  },
  rentalHistory: [],
};

const estate = toMarketplaceEstate(listing);

describe("PropertyCard — marketplace villa card with phase variant", () => {
  it("primary: data-phase, Plus icon, offer price, funding line; no growth, no View Estate", () => {
    const { container } = render(<PropertyCard estate={estate} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByTestId("property-card")).toHaveAttribute("data-phase", "primary");
    const phase = screen.getByTestId("card-phase");
    expect(phase).toHaveAttribute("aria-label", "Primary offering");
    expect(container.querySelector(".lucide-plus")).not.toBeNull();
    expect(container.querySelector(".lucide-arrow-left-right")).toBeNull();
    // Offer/share field — never lastTrade on primary.
    expect(screen.getByText("Price / share")).toBeInTheDocument();
    expect(screen.getByTestId("card-price")).toHaveTextContent("$125.00");
    expect(screen.getByTestId("card-availability")).toHaveTextContent("92% funded · 80 shares remaining");
    expect(screen.queryByTestId("card-growth-potential")).not.toBeInTheDocument();
    expect(screen.queryByText("Estimated growth potential")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-view")).not.toBeInTheDocument();
    expect(screen.queryByText("View Estate")).not.toBeInTheDocument();
  });

  it("secondary: data-phase, ArrowLeftRight icon, last-trade price, no funding line", () => {
    const resale = toMarketplaceEstate({
      ...listing,
      id: "re-125643",
      status: "resale",
      sharePriceUsd: 12_000,
      lastTradeUsd: 25_602,
      sharesSold: 600,
      sharesRemaining: 0,
      fundingProgressRatio: 1,
    });
    const { container } = render(<PropertyCard estate={resale} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByTestId("property-card")).toHaveAttribute("data-phase", "secondary");
    const phase = screen.getByTestId("card-phase");
    expect(phase).toHaveAttribute("aria-label", "Secondary market");
    expect(container.querySelector(".lucide-arrow-left-right")).not.toBeNull();
    expect(container.querySelector(".lucide-plus")).toBeNull();
    // Last-price path — never the offer on secondary.
    expect(screen.getByText("Last price")).toBeInTheDocument();
    expect(screen.getByTestId("card-price")).toHaveTextContent("$256.02");
    expect(screen.queryByText("$120.00")).not.toBeInTheDocument();
    expect(screen.queryByText("Price / share")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-availability")).not.toBeInTheDocument();
  });

  it("income unknown: Data pending chip, never a fabricated figure", () => {
    // Pending follows the presentation layer (V1 unknown), not fixture fields.
    // D11 locked 2026-09-13: remaining V1-unknowns are the EUR villas.
    const noIncome = toMarketplaceEstate({
      ...listing,
      id: "re-130901",
    });
    render(<PropertyCard estate={noIncome} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByTestId("card-income-pending")).toBeInTheDocument();
    expect(screen.getByText("Data pending")).toBeInTheDocument();
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
  });

  it("whole card routes to the existing property href", () => {
    const onNavigateHaptic = vi.fn();
    render(
      <PropertyCard estate={estate} nowMs={Date.UTC(2026, 6, 26)} onNavigateHaptic={onNavigateHaptic} />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/property/re-128862");
    fireEvent.click(link);
    expect(onNavigateHaptic).toHaveBeenCalledTimes(1);
  });

  it("no visible market-stage words (aria-labels excluded)", () => {
    const resale = toMarketplaceEstate({ ...listing, id: "re-125643", status: "resale" });
    const { container } = render(<PropertyCard estate={resale} nowMs={Date.UTC(2026, 6, 26)} />);
    const text = container.querySelector('[data-testid="property-card"]')?.textContent ?? "";
    expect(text).not.toMatch(/primary|secondary|ipo|resale/i);
  });

  it("identity first: canonical name, single place token, property type", () => {
    render(<PropertyCard estate={estate} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByText("Grand 2 BDM Ocean Pool Villa (JOALI Being)")).toBeInTheDocument();
    const loc = screen.getByTestId("card-location");
    expect(loc).toHaveTextContent("Bodufushi");
    expect(loc.textContent).not.toContain("Raa Atoll");
    expect(loc.textContent).not.toContain("Maldives");
    expect(screen.getByText(/· Overwater Villa/)).toBeInTheDocument();
    // Title→location stack uses the spacing token, not a one-off margin.
    expect(loc.parentElement?.className).toContain("space-y-2");
    expect(screen.getByTestId("card-fraction")).toHaveTextContent("1 share ≈ 1/1,000 of the estate");
  });

  it("stats row says Income / share; meta whisper is icon-free and one type step up", () => {
    render(<PropertyCard estate={estate} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByText("Income / share")).toBeInTheDocument();
    expect(screen.queryByText("Projected income / share")).not.toBeInTheDocument();
    const meta = screen.getByTestId("card-meta");
    expect(meta).toHaveTextContent("$67,655–$76,458");
    expect(meta).toHaveTextContent("$8M");
    expect(meta.querySelector("svg")).toBeNull();
    expect(meta.className).toContain("text-[0.8125rem]");
    // Merged-tree presentation value for Grand (estate-page econ inputs).
    expect(screen.getByText("$16.25")).toBeInTheDocument();
    expect(screen.queryByTestId("card-income-pending")).not.toBeInTheDocument();
    // 8px below the meta line before the fraction.
    expect(screen.getByTestId("card-fraction").className).toContain("mt-2");
  });

  it("shows the quiet New badge only within the age window, top-right", () => {
    const fresh = toMarketplaceEstate({
      ...listing,
      createdAt: "2026-07-10T00:00:00Z",
      fundingProgressRatio: 0.92,
      sharesRemaining: 80,
    });
    render(<PropertyCard estate={fresh} nowMs={Date.UTC(2026, 6, 26)} />);
    const badge = screen.getByTestId("card-status-badge");
    expect(badge).toHaveTextContent("New");
    expect(badge.className).toContain("right-2");
  });

  it("has no APY and no growth/provenance extras on the card", () => {
    render(<PropertyCard estate={estate} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.queryByTestId("card-apy-badge")).not.toBeInTheDocument();
    expect(screen.queryByText("APY")).not.toBeInTheDocument();
    expect(screen.queryByText("Property Value")).not.toBeInTheDocument();
  });
});
