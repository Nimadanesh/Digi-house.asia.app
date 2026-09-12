// Phase 9 Slice 7 — RTL numeric isolation (RED-first).
//
// Bidi algorithm reverses $-ranges in RTL locales ($67,655–$76,458 renders as
// $76,458–$67,655 — observed in fa). Numeric figures carry dir="ltr" so visual
// order is identical in every locale (no-op in LTR).
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Listing } from "@/types/property";
import { toMarketplaceEstate } from "@/lib/economics/marketplace-view-model";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyHero } from "@/components/property/PropertyHero";
import { RentalStoryBlock } from "@/components/property/RentalStoryBlock";
import { PropertyAbout } from "@/components/property/PropertyAbout";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

const listing: Listing = {
  id: "re-128862",
  title: "Grand",
  location: "Maldives",
  description: "x",
  images: ["/images/properties/p1.png"],
  totalShares: 80000,
  sharePriceUsd: 10000,
  status: "funding",
  ownerWalletAddress: "EQA",
  annualRentUsd: 21570000,
  createdAt: "2025-01-01T00:00:00Z",
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

const resale: Listing = {
  ...listing,
  id: "re-125643",
  status: "resale",
  lastTradeUsd: 8000,
  bestAskUsd: 8160,
};

describe("Slice 7 — numeric figures are bidi-isolated (dir=ltr)", () => {
  it("marketplace card nightly range keeps LTR order", () => {
    const estate = toMarketplaceEstate(listing);
    const { container } = render(
      <PropertyCard estate={estate} nowMs={Date.UTC(2026, 6, 26)} />,
    );
    const node = Array.from(container.querySelectorAll("[dir='ltr']")).find((el) =>
      el.textContent?.includes("$67,655"),
    );
    expect(node, "nightly range wrapped for bidi").toBeDefined();
  });

  it("marketplace card growth figures keep LTR order", () => {
    const estate = toMarketplaceEstate({
      ...listing,
      id: "re-126855",
    });
    const { container } = render(
      <PropertyCard estate={estate} nowMs={Date.UTC(2026, 6, 26)} />,
    );
    const node = Array.from(container.querySelectorAll("[dir='ltr']")).find((el) =>
      el.textContent?.includes("$26.4M"),
    );
    expect(node, "growth figures wrapped for bidi").toBeDefined();
  });

  it("rental story nightly range keeps LTR order", () => {
    const { container } = render(
      <RentalStoryBlock nightlyDisplay="$52,200–$75,800+" onShowIncome={() => {}} />,
    );
    const node = Array.from(container.querySelectorAll("[dir='ltr']")).find((el) =>
      el.textContent?.includes("$52,200"),
    );
    expect(node, "story nightly wrapped for bidi").toBeDefined();
  });

  it("about sheet nightly range keeps LTR order", () => {
    render(
      <PropertyAbout listing={listing} aboutText="x" sizeText="y" nightlyDisplay="~€40,000" />,
    );
    // Details rows render inside the Sheet (portaled to body) once opened.
    fireEvent.click(screen.getByTestId("about-more"));
    const node = Array.from(document.querySelectorAll("[dir='ltr']")).find((el) =>
      el.textContent?.includes("€40,000"),
    );
    expect(node, "about nightly wrapped for bidi").toBeDefined();
  });

  it("hero market caption isolates each figure (ask and last never reorder)", () => {
    const { container } = render(
      <PropertyHero listing={resale} bestAskUsd={8160} onBuy={() => {}} />,
    );
    const ctx = screen.getByTestId("hero-market-context");
    const ltr = Array.from(ctx.querySelectorAll("[dir='ltr']")).map(
      (el) => el.textContent,
    );
    expect(ltr.some((t) => t?.includes("$81.60")), "ask isolated").toBe(true);
    expect(ltr.some((t) => t?.includes("$80.00")), "last isolated").toBe(true);
    expect(container.querySelector("[data-testid='hero-market-context']")).not.toBeNull();
  });
});
