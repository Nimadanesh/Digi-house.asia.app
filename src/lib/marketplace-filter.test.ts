import { describe, it, expect } from "vitest";
import {
  filterMarketplaceListings,
  listingStatusBadge,
  type MarketplaceChip,
} from "@/lib/marketplace-filter";
import type { Listing } from "@/types/property";

function base(over: Partial<Listing> & Pick<Listing, "id" | "title">): Listing {
  return {
    location: "City",
    description: "Desc",
    images: ["/images/properties/p1.png"],
    totalShares: 1000,
    sharePriceUsd: 10_000,
    status: "funding",
    ownerWalletAddress: "EQA",
    annualRentUsd: 520_000,
    createdAt: "2026-01-01T00:00:00Z",
    sharesSold: 100,
    sharesRemaining: 900,
    fundingProgressRatio: 0.1,
    meta: {
      sizeSqm: 50,
      yearBuilt: 2020,
      propertyType: "Apt",
      rentalStatus: "rented",
      leaseUntil: "2026-12-31",
      activeTenant: true,
      tokenizationDocUrl: "#",
    },
    rentalHistory: [],
    ...over,
  };
}

const list: Listing[] = [
  base({
    id: "a",
    title: "Alpha High Yield",
    sharePriceUsd: 20_000,
    annualRentUsd: 1_000_000,
    createdAt: "2026-01-01T00:00:00Z",
    fundingProgressRatio: 0.9,
    sharesSold: 900,
    sharesRemaining: 100,
    status: "funding",
  }),
  base({
    id: "b",
    title: "Beta Low Price",
    location: "Lisbon",
    sharePriceUsd: 5_000,
    annualRentUsd: 100_000,
    createdAt: "2026-07-20T00:00:00Z",
    fundingProgressRatio: 0.3,
    sharesSold: 300,
    sharesRemaining: 700,
  }),
  base({
    id: "c",
    title: "Gamma Mid",
    sharePriceUsd: 12_000,
    annualRentUsd: 400_000,
    createdAt: "2026-06-01T00:00:00Z",
    fundingProgressRatio: 0.6,
    sharesSold: 600,
    sharesRemaining: 400,
    status: "funding",
  }),
];

describe("filterMarketplaceListings", () => {
  it("filters by query on title/location", () => {
    const r = filterMarketplaceListings(list, { query: "lisbon" });
    expect(r.map((x) => x.id)).toEqual(["b"]);
  });

  it("highest_yield sorts by APY desc", () => {
    const r = filterMarketplaceListings(list, { chip: "highest_yield" as MarketplaceChip });
    expect(r[0]?.id).toBe("a");
  });

  it("new sorts by createdAt desc", () => {
    const r = filterMarketplaceListings(list, { chip: "new" });
    expect(r[0]?.id).toBe("b");
  });

  it("almost_sold keeps high-progress funding only", () => {
    const r = filterMarketplaceListings(list, { chip: "almost_sold" });
    expect(r.every((x) => x.fundingProgressRatio >= 0.5)).toBe(true);
    expect(r[0]?.id).toBe("a");
  });

  it("low_price sorts by share price asc", () => {
    const r = filterMarketplaceListings(list, { chip: "low_price" });
    expect(r.map((x) => x.id)).toEqual(["b", "c", "a"]);
  });
});

describe("listingStatusBadge", () => {
  const now = Date.UTC(2026, 6, 26); // Jul 26 2026

  it("marks recent listings New", () => {
    const b = listingStatusBadge(
      base({ id: "n", title: "N", createdAt: "2026-07-10T00:00:00Z" }),
      now,
    );
    expect(b.kind).toBe("new");
    expect(b.label).toBe("New");
  });

  it("marks >=80% funding as % Sold when not New", () => {
    const b = listingStatusBadge(
      base({
        id: "s",
        title: "S",
        createdAt: "2025-01-01T00:00:00Z",
        fundingProgressRatio: 0.85,
        sharesRemaining: 150,
        status: "funding",
      }),
      now,
    );
    expect(b.label).toBe("85% Sold");
  });

  it("marks mid scramble as Hot", () => {
    const b = listingStatusBadge(
      base({
        id: "h",
        title: "H",
        createdAt: "2025-01-01T00:00:00Z",
        fundingProgressRatio: 0.55,
        sharesRemaining: 400,
        status: "funding",
      }),
      now,
    );
    expect(b.kind).toBe("hot");
    expect(b.label).toBe("Hot");
  });
});
