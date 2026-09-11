// R2 validation: Canonical Estate Data Layer + reconciliation + provenance.
//
// These tests ARE the R2 audit gate (§13E). They prove, against the actual
// repository sources (not copied expectations where linkage matters):
//   - exactly 24 canonical marketplace properties exist;
//   - all 24 existing runtime `propertyId`s are preserved exactly;
//   - every property maps to exactly one Rental Escapes Listing ID (no duplicates);
//   - Rental Escapes identity fields are populated (no placeholders);
//   - UNKNOWN values remain unknown; CONFLICTED values remain explicitly conflicted;
//   - approved valuations are ESTIMATED/MODELED for all 24 (never observed/exact);
//   - research ranges stay verbatim as supporting context (never replaced);
//   - rental-rate semantics are preserved; no annual revenue is derived from rates;
//   - Grand 2 BDM does not inherit the legacy $82M valuation.
//
// R2 legacy audit (output D) is documented here as executable assertions:
//   - web runtime truth: `src/lib/mock/seed/properties.ts` (24 `prop-*` fixtures);
//   - API/DB truth: `portfolio-manifest.json` → `apps/api/.../manifest-data.ts`
//     (24 manifest IDs — a SEPARATE set, preserved untouched, not keyed here);
//   - rebuild econ truth: `src/lib/economics/estates/*` (canonical $8M Grand 2 BDM seed).
// This layer keys on the runtime set and references (never duplicates) its trading
// params; it does not rename, delete, or reorder any existing identifier.

import { describe, expect, it } from "vitest";

import { PROPERTIES } from "@/lib/mock/seed/properties";
import {
  CANONICAL_MARKETPLACE_ESTATES,
  CANONICAL_RECONCILIATION,
  getCanonicalEstate,
  getCanonicalEstateByListingId,
} from "../estates/canonical-24";

const RATE_TYPES = ["RANGE", "APPROXIMATE", "STARTING_FROM", "DYNAMIC"] as const;

// Legacy $82M in minor units — must appear NOWHERE as a canonical valuation.
const LEGACY_82M_CENTS = 8_200_000_000;
// Approved Grand 2 BDM band ~$8–10M in minor units.
const GRAND_MIN_CENTS = 800_000_000;
const GRAND_MAX_CENTS = 1_000_000_000;

describe("R2: exactly 24 canonical marketplace properties", () => {
  it("registry holds exactly 24 estates", () => {
    expect(CANONICAL_MARKETPLACE_ESTATES).toHaveLength(24);
  });

  it("preserves all 24 existing runtime propertyIds exactly (no rename/add/remove)", () => {
    const fixtureIds = new Set(PROPERTIES.map((p) => p.id));
    expect(fixtureIds.size).toBe(24);
    const canonicalIds = new Set(CANONICAL_MARKETPLACE_ESTATES.map((e) => e.propertyId));
    expect(canonicalIds.size).toBe(24);
    for (const id of fixtureIds) {
      expect(canonicalIds.has(id), `canonical layer must preserve runtime id ${id}`).toBe(true);
    }
  });
});

describe("R2: reconciliation propertyId → Listing ID → estate", () => {
  it("emits exactly 24 reconciliation rows, one per property", () => {
    expect(CANONICAL_RECONCILIATION).toHaveLength(24);
    const ids = CANONICAL_RECONCILIATION.map((r) => r.propertyId);
    expect(new Set(ids).size).toBe(24);
  });

  it("every property maps to exactly one Rental Escapes Listing ID (no duplicates)", () => {
    const listingIds = CANONICAL_MARKETPLACE_ESTATES.map((e) => e.rentalEscapesListingId);
    expect(new Set(listingIds).size).toBe(24);
    for (const id of listingIds) {
      expect(id, "listing id must be a non-empty numeric string").toMatch(/^\d+$/);
    }
  });

  it("every source URL is a Rental Escapes URL ending in the listing id", () => {
    for (const e of CANONICAL_MARKETPLACE_ESTATES) {
      expect(e.rentalEscapesSourceUrl.startsWith("https://www.rentalescapes.com/")).toBe(true);
      expect(
        e.rentalEscapesSourceUrl.endsWith(`-${e.rentalEscapesListingId}`),
        `${e.propertyId}: URL must end with -${e.rentalEscapesListingId}`,
      ).toBe(true);
    }
  });

  it("no property is left NEEDS_REVIEW (explicit references covered all 24)", () => {
    for (const e of CANONICAL_MARKETPLACE_ESTATES) {
      expect(e.reconciliationStatus).toBe("MAPPED");
    }
    expect(CANONICAL_RECONCILIATION.every((r) => r.status === "MAPPED")).toBe(true);
  });

  it("lookup helpers resolve in both directions", () => {
    const byProp = getCanonicalEstate("prop-marina-vista-4b");
    expect(byProp?.rentalEscapesListingId).toBe("128862");
    const byListing = getCanonicalEstateByListingId("128862");
    expect(byListing?.propertyId).toBe("prop-marina-vista-4b");
    expect(getCanonicalEstate("prop-does-not-exist")).toBeUndefined();
    expect(getCanonicalEstateByListingId("000000")).toBeUndefined();
  });
});

describe("R2: Rental Escapes identity populated, no placeholders", () => {
  it("name/location/rate/images are populated for every estate", () => {
    for (const e of CANONICAL_MARKETPLACE_ESTATES) {
      expect(e.name.value.length).toBeGreaterThan(0);
      expect(e.name.provenance).toBe("observed");
      expect(e.location.value.length).toBeGreaterThan(0);
      expect(e.location.provenance).toBe("observed");
      expect(e.observedRentalRate.display.length).toBeGreaterThan(0);
      expect(e.observedRentalRate.provenance).toBe("observed");
      expect(e.images.urls.length).toBeGreaterThan(0);
    }
  });

  it("canonical images reproduce the existing-app galleries exactly (no placeholder imagery)", () => {
    for (const fixture of PROPERTIES) {
      const canonical = getCanonicalEstate(fixture.id);
      expect(canonical, `missing canonical record for ${fixture.id}`).toBeDefined();
      expect(canonical!.images.urls).toEqual(fixture.images);
    }
  });

  it("existing fixture trading params are carried by reference, matching the fixtures", () => {
    for (const fixture of PROPERTIES) {
      const canonical = getCanonicalEstate(fixture.id)!;
      expect(canonical.fractionalLuxe.existingFixture.totalShares).toBe(fixture.totalShares);
      expect(canonical.fractionalLuxe.existingFixture.sharePriceUsd).toBe(fixture.sharePriceUsd);
      expect(canonical.fractionalLuxe.existingFixture.status).toBe(fixture.status);
    }
  });
});

describe("R2: provenance discipline", () => {
  it("UNKNOWN stays unknown: occupancy + annual income are unknown for all 24", () => {
    for (const e of CANONICAL_MARKETPLACE_ESTATES) {
      expect(e.fractionalLuxe.occupancyRate.value).toBeNull();
      expect(e.fractionalLuxe.occupancyRate.provenance).toBe("unknown");
      expect(e.fractionalLuxe.annualIncomeUsd.value).toBeNull();
      expect(e.fractionalLuxe.annualIncomeUsd.provenance).toBe("unknown");
    }
  });

  it("CONFLICTED stays conflicted: ANI land size + Grand 2 BDM legacy value", () => {
    const ani = getCanonicalEstate("prop-toronto-condo")!;
    expect(ani.research.sizeText.provenance).toBe("conflicted");
    expect(ani.research.sizeText.value).toContain("CONFLICTED");
    const grand = getCanonicalEstate("prop-marina-vista-4b")!;
    expect(grand.legacyEvidence?.provenance).toBe("conflicted");
    expect(grand.legacyEvidence?.note).toContain("$82M");
    const othersWithLegacy = CANONICAL_MARKETPLACE_ESTATES.filter(
      (e) => e.propertyId !== "prop-marina-vista-4b" && e.legacyEvidence !== null,
    );
    expect(othersWithLegacy).toHaveLength(0);
  });

  it("approved valuations: all 24 carry ESTIMATED/MODELED canonical values (never observed)", () => {
    for (const e of CANONICAL_MARKETPLACE_ESTATES) {
      expect(e.research.estimatedValueProvenance).toBe("estimated");
      expect(e.fractionalLuxe.valuationUsd.provenance).toBe("estimated");
      expect(e.fractionalLuxe.valuationUsd.value).not.toBeNull();
      expect(e.fractionalLuxe.valuationUsd.value!).toBeGreaterThan(0);
    }
  });

  it("approved centrals equal the PM lowest-valid-value rule (research-band lows)", () => {
    const expected: Record<string, number> = {
      "prop-marina-vista-4b": 800_000_000,
      "prop-soho-loft-studio": 1_800_000_000,
      "prop-bayside-marina-penthouse": 1_200_000_000,
      "prop-alfama-terrace-flat": 2_500_000_000,
      "prop-tbilisi-riverhouse-loft": 2_800_000_000,
      "prop-canggu-surf-villa": 3_000_000_000,
      "prop-tokyo-shibuya-studio": 1_200_000_000,
      "prop-brooklyn-brownstone-flat": 1_800_000_000,
      "prop-berlin-mitte-apartment": 800_000_000,
      "prop-barcelona-eixample-flat": 1_500_000_000,
      "prop-london-camden-loft": 1_200_000_000,
      "prop-sydney-harbour-apartment": 3_500_000_000,
      "prop-toronto-condo": 5_000_000_000,
      "prop-melbourne-loft": 2_500_000_000,
      "prop-miami-beach-condo": 3_200_000_000,
      "prop-istanbul-bosphorus-flat": 3_500_000_000,
      "prop-mexico-city-penthouse": 6_000_000_000,
      "prop-kyoto-machiya": 2_000_000_000,
      "prop-cape-town-villa": 4_500_000_000,
      "prop-bangkok-sukhumvit-condo": 5_000_000_000,
      "prop-amsterdam-canal-house": 2_500_000_000,
      "prop-buenos-aires-recoleta-flat": 1_800_000_000,
      "prop-seoul-gangnam-studio": 1_500_000_000,
      "prop-nyc-chelsea-loft": 2_200_000_000,
    };
    expect(Object.keys(expected)).toHaveLength(24);
    for (const [id, cents] of Object.entries(expected)) {
      expect(getCanonicalEstate(id)?.fractionalLuxe.valuationUsd.value, id).toBe(cents);
    }
  });
});

describe("R2: rental-rate semantics preserved", () => {
  it("every rate carries a valid Rate Type from the research dataset", () => {
    for (const e of CANONICAL_MARKETPLACE_ESTATES) {
      expect(RATE_TYPES).toContain(e.observedRentalRate.rateType);
    }
  });

  it("matches the dataset distribution: 5 RANGE, 2 STARTING_FROM, 1 DYNAMIC, 16 APPROXIMATE", () => {
    const count = (t: string) =>
      CANONICAL_MARKETPLACE_ESTATES.filter((e) => e.observedRentalRate.rateType === t).length;
    expect(count("RANGE")).toBe(5);
    expect(count("STARTING_FROM")).toBe(2);
    expect(count("DYNAMIC")).toBe(1);
    expect(count("APPROXIMATE")).toBe(16);
  });

  it("La Dolce Vita keeps its DYNAMIC no-rate anchor (never normalized to ADR)", () => {
    const dolce = getCanonicalEstate("prop-miami-beach-condo")!;
    expect(dolce.observedRentalRate.rateType).toBe("DYNAMIC");
    expect(dolce.observedRentalRate.display).toContain("DYNAMIC");
  });
});

describe("R2: Grand 2 BDM special case", () => {
  it("is one of the 24 (not an additional estate) with Listing ID 128862", () => {
    const grand = getCanonicalEstate("prop-marina-vista-4b")!;
    expect(grand.rentalEscapesListingId).toBe("128862");
    expect(grand.name.value).toContain("Grand 2 BDM");
  });

  it("valuation stays in the approved ~$8–10M ESTIMATED/MODELED band", () => {
    const grand = getCanonicalEstate("prop-marina-vista-4b")!;
    expect(grand.fractionalLuxe.valuationUsd.provenance).toBe("estimated");
    const v = grand.fractionalLuxe.valuationUsd.value;
    expect(v).not.toBeNull();
    expect(v!).toBeGreaterThanOrEqual(GRAND_MIN_CENTS);
    expect(v!).toBeLessThanOrEqual(GRAND_MAX_CENTS);
  });

  it("never inherits legacy $82M or research $12–15M as canonical valuation", () => {
    for (const e of CANONICAL_MARKETPLACE_ESTATES) {
      expect(e.fractionalLuxe.valuationUsd.value).not.toBe(LEGACY_82M_CENTS);
    }
    const grand = getCanonicalEstate("prop-marina-vista-4b")!;
    expect(grand.fractionalLuxe.valuationUsd.value).toBe(800_000_000);
    // Research $12–15M remains research evidence text only.
    expect(grand.research.estimatedValueText).toContain("$12–15M");
  });
});
