import { describe, expect, it } from "vitest";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import { mapPropertyToListing } from "./map-listing.js";

describe("mapPropertyToListing", () => {
  it("computes remaining and progress from seed row", () => {
    const row = toPropertyInsert(SEED_PROPERTIES[0]!);
    const listing = mapPropertyToListing(row);
    expect(listing.sharesRemaining).toBe(row.totalShares - row.sharesSold);
    expect(listing.fundingProgressRatio).toBeCloseTo(
      row.sharesSold / row.totalShares,
    );
    expect(listing.createdAt).toMatch(/^\d{4}-/);
  });
});
