// TDD RED — hero header lines: single-word country location + ownership-% share line.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Listing } from "@/types/property";
import { PropertyHero } from "@/components/property/PropertyHero";

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
  totalShares: 80000,
  sharePriceUsd: 10000,
  status: "funding",
  ownerWalletAddress: "EQAtest",
  annualRentUsd: 520000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 0,
  sharesRemaining: 80000,
  fundingProgressRatio: 0,
  monthlyYieldRate: 6,
  totalValueUsd: 800_000_000,
  meta: {
    sizeSqm: 382,
    yearBuilt: 2020,
    propertyType: "Villa",
    rentalStatus: "rented",
    leaseUntil: "2026-12-31",
    activeTenant: true,
    tokenizationDocUrl: "#",
  },
  rentalHistory: [],
};

function renderHero(overrides?: Partial<React.ComponentProps<typeof PropertyHero>>) {
  return render(
    <PropertyHero
      listing={listing}
      onBuy={() => {}}
      canonicalName="Grand 2 BDM Ocean Pool Villa (JOALI Being)"
      canonicalLocation="Bodufushi, JOALI Being, Raa Atoll, Maldives"
      canonicalCountry="Maldives"
      totalSharesOverride={80000}
      {...overrides}
    />,
  );
}

describe("PropertyHero header lines", () => {
  it("location line shows only the country word (full address lives on Overview)", () => {
    renderHero();
    expect(screen.getByTestId("hero-location")).toHaveTextContent("Maldives");
    expect(screen.queryByText("Bodufushi, JOALI Being, Raa Atoll, Maldives")).not.toBeInTheDocument();
  });

  it("share line shows the Ownership-tab percentage instead of the 1/N fraction", () => {
    renderHero();
    // Shared ownershipPct format (max 4 decimals): 80,000 shares → 0.0013%.
    expect(screen.getByTestId("hero-fraction")).toHaveTextContent("1 share ≈ 0.0013%");
    expect(screen.queryByText(/of the estate/)).not.toBeInTheDocument();
  });

  it("truncates long ownership decimals to max 4 places (120k shares)", () => {
    renderHero({
      listing: { ...listing, totalShares: 120000 },
      totalSharesOverride: 120000,
    });
    // Raw value would be 0.0008333333333333334% — display stays short.
    expect(screen.getByTestId("hero-fraction")).toHaveTextContent("1 share ≈ 0.0008%");
  });

  it("falls back to the full location when no country is provided (unknown ids)", () => {
    renderHero({ canonicalCountry: null, canonicalLocation: null });
    expect(screen.getByTestId("hero-location")).toHaveTextContent(
      "Bodufushi, JOALI Being, Raa Atoll, Maldives",
    );
  });
});
