// Final PO Decisions 1, 2, 6: the mock boundary serves canonical identity,
// V1 supply, and the $100 base price; sold/remaining/progress come from the live
// demo holdings ledger — never fixture canon. The fixture seed itself is untouched.
import { describe, it, expect } from "vitest";
import { PROPERTIES } from "@/lib/mock/seed/properties";
import { toCanonicalListing } from "@/lib/mock/canonical-listing";

describe("mock boundary canonicalization (Final PO Decisions 1, 2, 6)", () => {
  it("serves canonical V1 supply and the $100 base price for Grand", () => {
    const fixture = PROPERTIES.find((p) => p.id === "prop-marina-vista-4b")!;
    const listing = toCanonicalListing(fixture);
    expect(listing.totalShares).toBe(80_000);
    expect(listing.sharePriceUsd).toBe(10_000);
    expect(listing.totalValueUsd).toBe(800_000_000);
    // Fixture canon banned: no 2,500-supply, no legacy $82M figure.
    expect(listing.totalShares).not.toBe(2_500);
    expect(listing.totalValueUsd).not.toBe(82_000_000_00);
  });

  it("serves canonical Tier-1 identity, not fixture shorthand", () => {
    const fixture = PROPERTIES.find((p) => p.id === "prop-marina-vista-4b")!;
    const listing = toCanonicalListing(fixture);
    expect(listing.title).toBe("Grand 2 BDM Ocean Pool Villa (JOALI Being)");
    expect(listing.meta.propertyType).not.toBe("Apartment");
  });

  it("derives sold/remaining/progress from the demo holdings ledger", () => {
    const fixture = PROPERTIES.find((p) => p.id === "prop-bayside-marina-penthouse")!;
    const listing = toCanonicalListing(fixture);
    // Seed ledger holds 160 Bayside shares; canonical supply is 120,000.
    expect(listing.totalShares).toBe(120_000);
    expect(listing.sharesSold).toBe(160);
    expect(listing.sharesRemaining).toBe(120_000 - 160);
    expect(listing.fundingProgressRatio).toBeCloseTo(160 / 120_000, 12);
  });

  it("passes unknown ids through untouched", () => {
    const unknown = { ...PROPERTIES[0]!, id: "prop-unknown" };
    expect(toCanonicalListing(unknown).id).toBe("prop-unknown");
    expect(toCanonicalListing(unknown).totalShares).toBe(PROPERTIES[0]!.totalShares);
  });
});
