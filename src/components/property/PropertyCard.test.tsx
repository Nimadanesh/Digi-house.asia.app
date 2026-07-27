import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PropertyCard } from "@/components/property/PropertyCard";
import type { Listing } from "@/types/property";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

const listing: Listing = {
  id: "prop-marina-vista-4b",
  title: "Marina Vista Apt 4B",
  location: "Dubai Marina, UAE",
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

describe("PropertyCard — Fable list layout", () => {
  it("links to property detail", () => {
    render(<PropertyCard listing={listing} nowMs={Date.UTC(2026, 6, 26)} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/property/prop-marina-vista-4b");
  });

  it("shows image badges: status + APY", () => {
    render(<PropertyCard listing={listing} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByTestId("card-status-badge")).toHaveTextContent("92% Sold");
    expect(screen.getByTestId("card-apy-badge")).toHaveTextContent(/APY/);
  });

  it("shows name, location, 3 metrics, absolute sold text", () => {
    render(<PropertyCard listing={listing} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByText("Marina Vista Apt 4B")).toBeInTheDocument();
    expect(screen.getByText("Dubai Marina, UAE")).toBeInTheDocument();
    expect(screen.getByText("Price / share")).toBeInTheDocument();
    expect(screen.getByText("Weekly / share")).toBeInTheDocument();
    expect(screen.getByText("Min. purchase")).toBeInTheDocument();
    expect(screen.getByTestId("card-sold-label")).toHaveTextContent("920 of 1000 shares sold");
  });

  it("does not show obsolete 'Total' property value row", () => {
    render(<PropertyCard listing={listing} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.queryByText("Total")).not.toBeInTheDocument();
  });
});
