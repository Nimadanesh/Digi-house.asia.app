import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Listing } from "@/types/property";
import { SimilarProperties, pickSimilar } from "@/components/property/SimilarProperties";

const useMarketplace = vi.fn();
vi.mock("@/hooks/useMarketplace", () => ({
  useMarketplace: () => useMarketplace(),
}));

function listing(id: string, location: string, monthlyYieldRate: number): Listing {
  return {
    id,
    title: id,
    location,
    description: "x",
    images: ["/images/properties/p1.png"],
    totalShares: 1000,
    sharePriceUsd: 8000,
    status: "funding",
    ownerWalletAddress: "EQAtest",
    annualRentUsd: 500_000,
    createdAt: "2026-01-12T09:00:00Z",
    sharesSold: 100,
    sharesRemaining: 900,
    fundingProgressRatio: 0.1,
    monthlyYieldRate,
    totalValueUsd: 8_000_000,
    meta: {
      sizeSqm: 72,
      yearBuilt: 2019,
      propertyType: "Apartment",
      rentalStatus: "rented",
      leaseUntil: null,
      activeTenant: true,
      tokenizationDocUrl: "#",
    },
    rentalHistory: [],
  };
}

const current = listing("prop-current", "Marina, UAE", 6);
const all = [
  current,
  listing("prop-a", "Downtown, UAE", 6.1), // same country, closest APY
  listing("prop-b", "Lisbon, Portugal", 5.9), // different country
  listing("prop-c", "Jumeirah, UAE", 7.4), // same country, far APY
  listing("prop-d", "Bali, Indonesia", 6.0),
];

describe("pickSimilar", () => {
  it("excludes the current listing and ranks same-country first, then closest APY", () => {
    const picked = pickSimilar(current, all);
    expect(picked.map((l) => l.id)).toEqual(["prop-a", "prop-c", "prop-d", "prop-b"]);
  });
});

describe("SimilarProperties — redesign Phase 5", () => {
  beforeEach(() => {
    useMarketplace.mockReturnValue({ data: all, isLoading: false, isError: false });
  });

  it("renders up to 4 cards with image, title, location, APY and price", () => {
    render(<SimilarProperties listing={current} />);
    const cards = screen.getAllByTestId("similar-card");
    expect(cards).toHaveLength(4);
    expect(screen.getByText("prop-a")).toBeInTheDocument();
    expect(screen.getByText("73% APY")).toBeInTheDocument(); // 6.1%/mo ×12 = 73%
    expect(screen.getAllByText(/UAE|Portugal|Indonesia/).length).toBeGreaterThan(0);
    // Card links route to the property page
    expect(cards[0].getAttribute("href")).toContain("prop-a");
  });

  it("renders nothing when there are no other properties", () => {
    useMarketplace.mockReturnValue({ data: [current], isLoading: false, isError: false });
    const { container } = render(<SimilarProperties listing={current} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while marketplace data is loading", () => {
    useMarketplace.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { container } = render(<SimilarProperties listing={current} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("secondary card price uses the current-price hierarchy (last trade over list)", () => {
    const resale = { ...listing("prop-e", "Marina, UAE", 6), status: "resale" as const, lastTradeUsd: 9500 };
    useMarketplace.mockReturnValue({ data: [current, resale], isLoading: false, isError: false });
    render(<SimilarProperties listing={current} />);
    expect(screen.getByText("$95.00")).toBeInTheDocument();
  });
});
