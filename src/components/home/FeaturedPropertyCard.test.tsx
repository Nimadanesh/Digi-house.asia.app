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
  id: "prop-marina-vista-4b",
  title: "Marina Vista Apt 4B",
  location: "Dubai Marina, UAE",
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
    expect(screen.getByText("Marina Vista Apt 4B")).toBeInTheDocument();
    expect(screen.getByTestId("featured-card")).toHaveAttribute(
      "href",
      "/property/prop-marina-vista-4b",
    );
    // Entry/share price.
    expect(screen.getByText("$125.00/share")).toBeInTheDocument();
    // Projected rental income (existing calculator math) — labeled, not presented as actual.
    expect(screen.getByText("Projected income / share")).toBeInTheDocument();
    // Owner-stay entitlement has no data anywhere → honest "Data pending".
    expect(screen.getByText("Owner stay")).toBeInTheDocument();
    expect(screen.getByText("Data pending")).toBeInTheDocument();
    expect(screen.getByTestId("featured-cta")).toHaveTextContent("View Estate");
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