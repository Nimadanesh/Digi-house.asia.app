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

describe("PropertyCard — Phase 9 estate card", () => {
  it("links to property detail", () => {
    render(<PropertyCard listing={listing} nowMs={Date.UTC(2026, 6, 26)} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/property/prop-marina-vista-4b");
  });

  it("identity first: name, location and property type", () => {
    render(<PropertyCard listing={listing} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByText("Marina Vista Apt 4B")).toBeInTheDocument();
    expect(screen.getByText(/Dubai Marina, UAE/)).toBeInTheDocument();
    expect(screen.getByText(/· Apartment/)).toBeInTheDocument();
  });

  it("shows price + projected income per share, ownership fraction and availability", () => {
    render(<PropertyCard listing={listing} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByText("Price / share")).toBeInTheDocument();
    expect(screen.getByText("Projected income / share")).toBeInTheDocument();
    expect(screen.getByTestId("card-fraction")).toHaveTextContent("1 share ≈ 1/1000 of the estate");
    expect(screen.getByTestId("card-availability")).toHaveTextContent("92% funded · 80 shares remaining");
  });

  it("has no APY, no scarcity badges, no duplicate price metric", () => {
    render(<PropertyCard listing={listing} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.queryByTestId("card-apy-badge")).not.toBeInTheDocument();
    expect(screen.queryByText("APY")).not.toBeInTheDocument();
    expect(screen.queryByText("Night / From")).not.toBeInTheDocument();
    expect(screen.queryByText("Monthly / share")).not.toBeInTheDocument();
    // The listing is not within the "New" age window — no scarcity badge either.
    expect(screen.queryByTestId("card-status-badge")).not.toBeInTheDocument();
  });

  it("shows the quiet New badge only within the age window", () => {
    const fresh: Listing = {
      ...listing,
      createdAt: "2026-07-10T00:00:00Z",
      fundingProgressRatio: 0.92,
      sharesRemaining: 80,
    };
    render(<PropertyCard listing={fresh} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByTestId("card-status-badge")).toHaveTextContent("New");
  });

  it("renders 'Data pending' instead of a fabricated income figure when income data is missing", () => {
    const noIncome: Listing = { ...listing, annualRentUsd: 0 };
    render(<PropertyCard listing={noIncome} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByTestId("card-income-pending")).toBeInTheDocument();
    expect(screen.getByText("Data pending")).toBeInTheDocument();
    // Never a zero dollar figure.
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
  });

  it("resale card labels the price as 'Last price', shows the market price and no availability (PD-07)", () => {
    const resale: Listing = {
      ...listing,
      id: "prop-tbilisi-riverhouse-loft",
      status: "resale",
      sharePriceUsd: 12_000,
      lastTradeUsd: 8_000,
      sharesSold: 600,
      sharesRemaining: 0,
      fundingProgressRatio: 1,
    };
    render(<PropertyCard listing={resale} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByText("Last price")).toBeInTheDocument();
    expect(screen.getByText("$80.00")).toBeInTheDocument();
    expect(screen.queryByText("$120.00")).not.toBeInTheDocument();
    expect(screen.queryByText("Price / share")).not.toBeInTheDocument();
    // Availability block is primary-only.
    expect(screen.queryByTestId("card-availability")).not.toBeInTheDocument();
  });
});