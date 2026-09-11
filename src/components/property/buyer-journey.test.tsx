// Phase 9 Slice 6 — first-time buyer journey coherence (RED-first).
//
// One screen must answer one question: the hero carries no duplicated funding
// caption (banner + metrics already state it), and the thesis ANR carries its
// plain-language note (it can exceed the card's from-range without explanation).
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Listing } from "@/types/property";
import { PropertyHero } from "@/components/property/PropertyHero";
import { EstateV1Thesis } from "@/components/property/EstateV1Thesis";
import { getFinancialModelV1 } from "@/lib/economics/estates/financial-model-v1-inputs";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

const listing: Listing = {
  id: "prop-marina-vista-4b",
  title: "Grand 2 BDM Ocean Pool Villa (JOALI Being)",
  location: "Bodufushi, JOALI Being, Raa Atoll, Maldives",
  description: "Waterfront.",
  images: ["/images/properties/p1.png"],
  totalShares: 80000,
  sharePriceUsd: 10000,
  status: "funding",
  ownerWalletAddress: "EQA",
  annualRentUsd: 21570000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 0,
  sharesRemaining: 80000,
  fundingProgressRatio: 0,
  monthlyYieldRate: 7.19,
  totalValueUsd: 800_000_000,
  meta: {
    sizeSqm: 382,
    yearBuilt: 2020,
    propertyType: "Overwater Villa",
    rentalStatus: "rented",
    leaseUntil: null,
    activeTenant: true,
    tokenizationDocUrl: "#",
  },
  rentalHistory: [],
};

describe("Slice 6 — hero states funding once (banner + metrics, not a third caption)", () => {
  it("primary hero renders no duplicate under-CTA funding caption", () => {
    render(<PropertyHero listing={listing} onBuy={() => {}} />);
    // Status banner + metrics sold/total remain the two funding statements.
    expect(screen.queryByTestId("hero-supply")).not.toBeInTheDocument();
    expect(screen.getByTestId("hero-cta")).toHaveTextContent("Buy · $100.00");
  });
});

describe("Slice 6 — thesis ANR explains itself in plain language", () => {
  it("renders the ANR note (projection input, not a bookable rate)", () => {
    const v1 = getFinancialModelV1("prop-marina-vista-4b")!;
    render(<EstateV1Thesis v1={v1} onShowIncome={() => {}} />);
    expect(screen.getByTestId("thesis-anr-note")).toHaveTextContent(
      /revenue model/,
    );
    expect(screen.getByTestId("thesis-anr-note")).toHaveTextContent(/not a bookable/i);
  });
});
