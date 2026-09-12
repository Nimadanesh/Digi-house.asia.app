// Slice F: filter/sort operate on the canonical view model (not fixtures).
// Search must match canonical identity; Estate Value sort must be deterministic.
import { describe, expect, it } from "vitest";

import { PROPERTIES } from "@/lib/mock/seed/properties";
import { toMarketplaceEstates } from "@/lib/economics/marketplace-view-model";
import { filterEstates } from "@/lib/marketplace-filter";

const ESTATES = toMarketplaceEstates(PROPERTIES);

describe("Slice F: marketplace search on canonical identity", () => {
  it("matches the canonical name (JOALI Being) even though the fixture title is shorthand", () => {
    const r = filterEstates(ESTATES, { query: "JOALI Being" });
    expect(r.map((x) => x.id)).toContain("re-128862");
  });

  it("matches canonical location tokens (Raa Atoll) from the observed location", () => {
    const r = filterEstates(ESTATES, { query: "Raa Atoll" });
    expect(r.map((x) => x.id)).toContain("re-128862");
  });

  it("matches destination/region (Turks and Caicos) across multiple estates", () => {
    const r = filterEstates(ESTATES, { query: "Turks and Caicos" });
    expect(r.length).toBeGreaterThan(3);
    expect(r.every((x) => x.location.includes("Turks and Caicos"))).toBe(true);
  });

  it("returns empty (not fake results) for no-match queries", () => {
    expect(filterEstates(ESTATES, { query: "zzzz-no-such-estate" })).toEqual([]);
  });
});

describe("Slice F: Estate Value sort", () => {
  it("sorts by canonical Estate Value descending, deterministic", () => {
    const a = filterEstates(ESTATES, { sort: "value" });
    const b = filterEstates(ESTATES, { sort: "value" });
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
    const values = a.map((x) => x.estateValue?.value ?? 0);
    for (let i = 1; i < values.length; i++) {
      expect(values[i - 1]).toBeGreaterThanOrEqual(values[i]!);
    }
    // Highest approved valuation first (Pearls of Long Bay $70M central).
    expect(a[0]!.id).toBe("re-130397");
  });
});

describe("Slice F: inventory invariant", () => {
  it("marketplace feed holds exactly 24 unique canonical estates", () => {
    expect(ESTATES).toHaveLength(24);
    expect(new Set(ESTATES.map((x) => x.id)).size).toBe(24);
    expect(new Set(ESTATES.map((x) => x.rentalEscapesListingId)).size).toBe(24);
  });
});
