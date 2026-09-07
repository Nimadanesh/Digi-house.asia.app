import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Listing } from "@/types/property";
import { SimilarProperties, pickSimilar } from "@/components/property/SimilarProperties";

const useMarketplace = vi.fn();
vi.mock("@/hooks/useMarketplace", () => ({
  useMarketplace: () => useMarketplace(),
}));

function listing(id: string, location: string): Listing {
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
    monthlyYieldRate: 6,
    totalValueUsd: 8_000_000,
    nightlyRate: "$1,000",
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

const current = listing("prop-current", "Marina, UAE");
const all = [
  current,
  listing("prop-a", "Downtown, UAE"), // same country
  listing("prop-b", "Lisbon, Portugal"), // different country
  listing("prop-c", "Jumeirah, UAE"), // same country
  listing("prop-d", "Bali, Indonesia"),
];

describe("pickSimilar", () => {
  it("excludes the current listing and ranks same-country first (PROMPT 03: no APY ranking)", () => {
    const picked = pickSimilar(current, all);
    // Unmapped test ids carry no canonical valuation — same-country group
    // keeps feed order, then the rest in feed order.
    expect(picked.map((l) => l.id)).toEqual(["prop-a", "prop-c", "prop-b", "prop-d"]);
  });
});

describe("SimilarProperties — redesign Phase 5", () => {
  beforeEach(() => {
    useMarketplace.mockReturnValue({ data: all, isLoading: false, isError: false });
  });

  it("renders up to 4 cards with image, title, location, nightly rate and price (no APY)", () => {
    render(<SimilarProperties listing={current} />);
    const cards = screen.getAllByTestId("similar-card");
    expect(cards).toHaveLength(4);
    expect(screen.getByText("prop-a")).toBeInTheDocument();
    // Canonical nightly display for unmapped ids falls back to the listing rate.
    expect(screen.getAllByText("$1,000").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/UAE|Portugal|Indonesia/).length).toBeGreaterThan(0);
    // PROMPT 03: legacy APY must not drive user-visible property facts.
    expect(screen.queryByText(/APY/)).not.toBeInTheDocument();
    // Card links route to the property page
    expect(cards[0].getAttribute("href")).toContain("prop-a");
  });

  it("renders canonical identity for canonical estates (not fixture shorthand)", () => {
    const grand = { ...listing("prop-marina-vista-4b", "JOALI Being, Maldives") };
    const aerial = { ...listing("prop-soho-loft-studio", "Buck Island, BVI") };
    useMarketplace.mockReturnValue({ data: [grand, aerial], isLoading: false, isError: false });
    render(<SimilarProperties listing={grand} />);
    expect(screen.getByText("The Aerial")).toBeInTheDocument();
    expect(screen.getByText("Buck Island, British Virgin Islands")).toBeInTheDocument();
    expect(screen.getByText("$52,200–$75,800+")).toBeInTheDocument();
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
    const resale = { ...listing("prop-e", "Marina, UAE"), status: "resale" as const, lastTradeUsd: 9500 };
    useMarketplace.mockReturnValue({ data: [current, resale], isLoading: false, isError: false });
    render(<SimilarProperties listing={current} />);
    expect(screen.getByText("$95.00")).toBeInTheDocument();
  });
});
