import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeaturedPropertyCard } from "@/components/home/FeaturedPropertyCard";
vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

import type { Listing } from "@/types/property";

const listing: Listing = {
  id: "re-128862",
  title: "Grand 2 BDM Ocean Pool Villa (JOALI Being)",
  location: "Bodufushi, JOALI Being, Raa Atoll, Maldives",
  description: "Waterfront",
  images: ["/images/properties/p1.png"],
  totalShares: 1000,
  sharePriceUsd: 12500,
  status: "funding",
  ownerWalletAddress: "EQA",
  annualRentUsd: 520000,
  createdAt: "2026-07-10T00:00:00Z",
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
    tokenizationDocUrl: "#",
  },
  rentalHistory: [],
};

describe("FeaturedPropertyCard — Featured Estate (identity first)", () => {
  it("renders identity, entry price, projected income, honest owner-stay state and View Estate CTA", () => {
    render(<FeaturedPropertyCard listing={listing} />);
    expect(screen.getByTestId("featured-section")).toBeInTheDocument();
    expect(screen.getByText("Featured Estate")).toBeInTheDocument();
    expect(screen.getByText("Grand 2 BDM Ocean Pool Villa (JOALI Being)")).toBeInTheDocument();
    expect(screen.getByTestId("featured-card")).toHaveAttribute(
      "href",
      "/property/re-128862",
    );
    // Entry/share price.
    expect(screen.getByText("$125.00/share")).toBeInTheDocument();
    // Slice 2: projected income from the single presentation layer (Grand V1:
    // $16.25/mo) — labeled, not presented as actual.
    expect(screen.getByText("Projected income / share")).toBeInTheDocument();
    expect(screen.getByText("$16.25")).toBeInTheDocument();
    // Owner-stay entitlement has no data anywhere → honest "Data pending".
    expect(screen.getByText("Owner stay")).toBeInTheDocument();
    expect(screen.getByText("Data pending")).toBeInTheDocument();
    expect(screen.getByTestId("featured-cta")).toHaveTextContent("View Estate");
  });

  it("shows pending (never a fixture figure) when V1 income is unknown", () => {
    // Option 1 FX (2026-09-18): all 24 canonical villas compute — pending is
    // exercised via a synthetic unknown id (no V1 input → null, never 0).
    render(
      <FeaturedPropertyCard listing={{ ...listing, id: "test-unknown-villa" }} />,
    );
    expect(screen.getByTestId("featured-income-pending")).toBeInTheDocument();
    expect(screen.queryByText("$16.25")).not.toBeInTheDocument();
  });

  it("view-estate chevron mirrors in RTL", () => {
    const { container } = render(<FeaturedPropertyCard listing={listing} />);
    const icon = container.querySelector('[data-testid="featured-cta"] svg');
    expect(icon?.getAttribute("class") ?? "").toMatch(/rtl:rotate-180/);
  });

  it("exposes no APY hero metric or scarcity cues", () => {
    render(<FeaturedPropertyCard listing={listing} />);
    expect(screen.queryByText("APY")).not.toBeInTheDocument();
    expect(screen.queryByText("Hot this week")).not.toBeInTheDocument();
  });

  it("calls the haptic on navigate", () => {
    const onNavigateHaptic = vi.fn();
    render(<FeaturedPropertyCard listing={listing} onNavigateHaptic={onNavigateHaptic} />);
    screen.getByTestId("featured-card").click();
    expect(onNavigateHaptic).toHaveBeenCalledTimes(1);
  });
});