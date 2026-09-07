import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { toMarketplaceEstate } from "@/lib/economics/marketplace-view-model";
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

const estate = toMarketplaceEstate(listing);

describe("PropertyCard — Slice F canonical estate card", () => {
  it("links to property detail", () => {
    render(<PropertyCard estate={estate} nowMs={Date.UTC(2026, 6, 26)} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/property/prop-marina-vista-4b");
  });

  it("identity first: canonical name, location and property type", () => {
    render(<PropertyCard estate={estate} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByText("Grand 2 BDM Ocean Pool Villa (JOALI Being)")).toBeInTheDocument();
    expect(screen.getByText(/Bodufushi, JOALI Being/)).toBeInTheDocument();
    // PROMPT 03: canonical source-supported type — never the legacy fixture
    // type ("Apartment" for an overwater villa).
    expect(screen.getByText(/· Overwater Villa/)).toBeInTheDocument();
  });

  it("shows share price + canonical nightly + Estate Value + projected income, fraction and availability", () => {
    render(<PropertyCard estate={estate} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByText("Price / share")).toBeInTheDocument();
    expect(screen.getByText("$125.00")).toBeInTheDocument();
    expect(screen.getByText("Night / From")).toBeInTheDocument();
    expect(screen.getByText("$67,655–$76,458")).toBeInTheDocument();
    expect(screen.getByText("Estate value")).toBeInTheDocument();
    expect(screen.getByTestId("card-estate-value")).toHaveTextContent("$8M");
    expect(screen.getByText("Projected income / share")).toBeInTheDocument();
    expect(screen.getByTestId("card-fraction")).toHaveTextContent("1 share ≈ 1/1000 of the estate");
    expect(screen.getByTestId("card-availability")).toHaveTextContent("92% funded · 80 shares remaining");
  });

  it("Estate Value carries compact ⓘ provenance (estimated) — never a visible debug label", () => {
    render(<PropertyCard estate={estate} nowMs={Date.UTC(2026, 6, 26)} />);
    const info = screen.getByTestId("provenance-info");
    expect(info).toHaveAttribute("data-provenance", "estimated");
    expect(screen.queryByText("Estimated")).not.toBeInTheDocument();
    expect(screen.queryByText("Observed")).not.toBeInTheDocument();
    expect(screen.queryByText("Calculated")).not.toBeInTheDocument();
  });

  it("has no APY, no scarcity badges, no Property Value wording", () => {
    render(<PropertyCard estate={estate} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.queryByTestId("card-apy-badge")).not.toBeInTheDocument();
    expect(screen.queryByText("APY")).not.toBeInTheDocument();
    expect(screen.queryByText("Property Value")).not.toBeInTheDocument();
    // The listing is not within the "New" age window — no badge either.
    expect(screen.queryByTestId("card-status-badge")).not.toBeInTheDocument();
  });

  it("shows the quiet New badge only within the age window", () => {
    const fresh = toMarketplaceEstate({
      ...listing,
      createdAt: "2026-07-10T00:00:00Z",
      fundingProgressRatio: 0.92,
      sharesRemaining: 80,
    });
    render(<PropertyCard estate={fresh} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByTestId("card-status-badge")).toHaveTextContent("New");
  });

  it("renders 'Data pending' instead of a fabricated income figure when income data is missing", () => {
    const noIncome = toMarketplaceEstate({ ...listing, annualRentUsd: 0 });
    render(<PropertyCard estate={noIncome} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByTestId("card-income-pending")).toBeInTheDocument();
    expect(screen.getByText("Data pending")).toBeInTheDocument();
    // Never a zero dollar figure.
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
  });

  it("resale card labels the price as 'Last price', shows the market price and no availability (PD-07)", () => {
    const resale = toMarketplaceEstate({
      ...listing,
      id: "prop-tbilisi-riverhouse-loft",
      status: "resale",
      sharePriceUsd: 12_000,
      lastTradeUsd: 8_000,
      sharesSold: 600,
      sharesRemaining: 0,
      fundingProgressRatio: 1,
    });
    render(<PropertyCard estate={resale} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByText("Last price")).toBeInTheDocument();
    expect(screen.getByText("$80.00")).toBeInTheDocument();
    expect(screen.queryByText("$120.00")).not.toBeInTheDocument();
    expect(screen.queryByText("Price / share")).not.toBeInTheDocument();
    // Availability block is primary-only.
    expect(screen.queryByTestId("card-availability")).not.toBeInTheDocument();
  });

  it("PROMPT 03: Grand shows the $8M–$10M range with $18M growth potential (no percentage)", () => {
    render(<PropertyCard estate={estate} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByTestId("card-estate-value")).toHaveTextContent("$8M–$10M");
    expect(screen.getByTestId("card-growth-potential")).toHaveTextContent(
      "Estimated Growth Potential",
    );
    expect(screen.getByTestId("card-growth-potential")).toHaveTextContent("$18M");
    expect(screen.getByTestId("card-growth-potential").textContent).not.toContain("%");
  });

  it("PROMPT 03: single-value estates show compact growth potential with a percentage", () => {
    const aerial = toMarketplaceEstate({
      ...listing,
      id: "prop-soho-loft-studio",
      totalShares: 1000,
    });
    render(<PropertyCard estate={aerial} nowMs={Date.UTC(2026, 6, 26)} />);
    expect(screen.getByTestId("card-estate-value")).toHaveTextContent("$20M");
    expect(screen.getByTestId("card-growth-potential")).toHaveTextContent("$26.4M");
    expect(screen.getByTestId("card-growth-potential")).toHaveTextContent("+32%");
  });
});
