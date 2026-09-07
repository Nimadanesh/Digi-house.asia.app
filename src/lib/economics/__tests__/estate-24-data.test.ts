// PROMPT 02 RED: Adopt ESTATE-24-DATA.json verbatim into the canonical data layer.
// These tests prove exact preservation (no re-estimate, no invention) + runtime mapping.
import { describe, expect, it } from "vitest";

import {
  ESTATE_24_DATA,
  ESTATE_24_BY_LISTING_ID,
  getEstate24ByListingId,
  getEstate24ByRuntimeId,
  ESTATE_24_RUNTIME_MAP,
} from "../estates/estate-24-data";

describe("PROMPT 02: ESTATE-24-DATA.json adopted verbatim", () => {
  it("loads exactly 24 estates", () => {
    expect(ESTATE_24_DATA).toHaveLength(24);
  });

  it("preserves Grand 2 BDM identity exactly (no alteration)", () => {
    const grand = getEstate24ByListingId("128862");
    expect(grand).toBeDefined();
    expect(grand!.name).toBe("Grand 2 BDM Ocean Pool Villa (JOALI Being)");
    expect(grand!.slug).toBe("grand-2-bdm-ocean-pool-villa-joali-being");
    expect(grand!.sourceUrl).toBe(
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-asia/maldives/bodufushi/joali-being/grand-2-bdm-ocean-pool-villa-128862",
    );
    expect(grand!.rates).toEqual({
      nightly: "$67,655–$76,458",
      type: "RANGE",
      currency: "USD",
      notes:
        "Rates inclusive of 10% service charge and 17% Tourism Goods & Service Tax in many published rates. Children over 12 considered adults. No charges for children under 5.",
      observedPeriod: "Sep–Oct 2026",
    });
  });

  it("preserves nulls exactly (no invention for missing specs)", () => {
    const grand = getEstate24ByListingId("128862")!;
    expect(grand.specs.landHa).toBeNull();
    expect(grand.specs.landNote).toBeNull();
    expect(grand.estimates.occupancy).toBeNull();
  });

  it("preserves all four rate types and both currencies verbatim", () => {
    const types = new Set(ESTATE_24_DATA.map((e) => e.rates.type));
    expect(types).toEqual(new Set(["RANGE", "APPROXIMATE", "STARTING_FROM", "DYNAMIC"]));
    const currencies = new Set(ESTATE_24_DATA.map((e) => e.rates.currency));
    expect(currencies.has("USD")).toBe(true);
    expect(currencies.has("EUR")).toBe(true);
  });

  it("keeps all 24 runtime prop-* ids working with no duplicates", () => {
    expect(Object.keys(ESTATE_24_RUNTIME_MAP)).toHaveLength(24);
    expect(new Set(Object.keys(ESTATE_24_RUNTIME_MAP)).size).toBe(24);
    expect(new Set(Object.values(ESTATE_24_RUNTIME_MAP)).size).toBe(24);
    // Spot-check ends of the ordered mapping.
    expect(ESTATE_24_RUNTIME_MAP["prop-marina-vista-4b"]).toBe("128862");
    expect(ESTATE_24_RUNTIME_MAP["prop-nyc-chelsea-loft"]).toBe("122113");
  });

  it("resolves rich record from runtime id for view-model use", () => {
    const viaRuntime = getEstate24ByRuntimeId("prop-marina-vista-4b");
    const viaListing = getEstate24ByListingId("128862");
    expect(viaRuntime).toEqual(viaListing);
    expect(ESTATE_24_BY_LISTING_ID["126855"].name).toBe("The Aerial");
  });

  it("marks occupancy UNKNOWN (null) for all 24 — never invents ADR/revenue/yield", () => {
    for (const e of ESTATE_24_DATA) {
      expect(e.estimates.occupancy).toBeNull();
    }
    // Layer exposes no derived economics: keys must not exist.
    for (const e of ESTATE_24_DATA as unknown as Record<string, unknown>[]) {
      expect("adr" in e).toBe(false);
      expect("annualRevenue" in e).toBe(false);
      expect("yield" in e).toBe(false);
    }
  });
});
