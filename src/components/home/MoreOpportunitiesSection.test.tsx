import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  MoreOpportunitiesSection,
  pickMoreOpportunities,
  MORE_OPPORTUNITIES_LIMIT,
} from "@/components/home/MoreOpportunitiesSection";
vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

import type { Listing } from "@/types/property";

const fundingListing = (id: string, title: string): Listing => ({
  id,
  title,
  location: "Bali",
  description: "Oceanfront",
  images: ["/images/properties/p1.png"],
  totalShares: 1000,
  sharePriceUsd: 12500,
  status: "funding",
  ownerWalletAddress: "EQA",
  annualRentUsd: 520000,
  createdAt: "2026-07-10T00:00:00Z",
  sharesSold: 400,
  sharesRemaining: 600,
  fundingProgressRatio: 0.4,
  monthlyYieldRate: 6.25,
  totalValueUsd: 5_000_000,
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
});

const nonPrimary = (id: string): Listing => ({
  ...fundingListing(id, "Funded Villa"),
  status: "funded",
  sharesSold: 1000,
  sharesRemaining: 0,
  fundingProgressRatio: 1,
});

describe("pickMoreOpportunities", () => {
  it("returns only Primary (funding) listings, capped, excluding the featured id", () => {
    const a = fundingListing("a", "Alpha");
    const b = fundingListing("b", "Beta");
    const c = fundingListing("c", "Gamma");
    const sold = nonPrimary("d");
    const picked = pickMoreOpportunities([a, b, c, sold], "a");
    expect(picked.map((p) => p.id)).toEqual(["b", "c"]);
  });

  it("respects the two-listing limit", () => {
    const listings = [fundingListing("a", "Alpha"), fundingListing("b", "Beta"), fundingListing("c", "Gamma")];
    expect(pickMoreOpportunities(listings).length).toBe(MORE_OPPORTUNITIES_LIMIT);
  });

  it("returns empty when no Primary listings remain", () => {
    expect(pickMoreOpportunities([nonPrimary("d")])).toEqual([]);
  });
});

describe("MoreOpportunitiesSection", () => {
  it("renders one card per listing with a calm price/share + monthly line", () => {
    const listings = [fundingListing("a", "Alpha"), fundingListing("b", "Beta")];
    render(<MoreOpportunitiesSection listings={listings} />);
    expect(screen.getByTestId("more-opportunities-section")).toBeInTheDocument();
    expect(screen.getByText("More opportunities")).toBeInTheDocument();
    const cards = screen.getAllByTestId("more-opportunity-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAttribute("href", "/property/a");
    expect(cards[0]).toHaveTextContent("$125.00/");
    expect(cards[0]).toHaveTextContent("/share");
  });

  it("returns null when there are no listings", () => {
    const { container } = render(<MoreOpportunitiesSection listings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("calls the haptic on navigate", () => {
    const onNavigateHaptic = vi.fn();
    render(<MoreOpportunitiesSection listings={[fundingListing("a", "Alpha")]} onNavigateHaptic={onNavigateHaptic} />);
    screen.getByTestId("more-opportunity-card").click();
    expect(onNavigateHaptic).toHaveBeenCalledTimes(1);
  });
});