// Slice F: Marketplace view model — Canonical Estate Data → View Model → UI.
// The marketplace must consume the canonical layer, never hardcode property
// info in components, never duplicate the dataset, never leak legacy values.
import { describe, expect, it } from "vitest";

import { PROPERTIES } from "@/lib/mock/seed/properties";
import {
  CANONICAL_MARKETPLACE_ESTATES,
  getCanonicalEstate,
} from "@/lib/economics/estates/canonical-24";
import {
  isCanonicalMarketplaceId,
  toMarketplaceEstate,
  toMarketplaceEstates,
} from "@/lib/economics/marketplace-view-model";

const LEGACY_82M_CENTS = 8_200_000_000;

function fixture(id: string) {
  const f = PROPERTIES.find((p) => p.id === id);
  if (!f) throw new Error(`missing fixture ${id}`);
  return f;
}

describe("marketplace view model — canonical identity", () => {
  it("maps Grand 2 BDM to its canonical Rental Escapes identity (not fixture shorthand)", () => {
    const vm = toMarketplaceEstate(fixture("prop-marina-vista-4b"));
    const canonical = getCanonicalEstate("prop-marina-vista-4b")!;
    expect(vm.id).toBe("prop-marina-vista-4b");
    expect(vm.name).toBe(canonical.name.value);
    expect(vm.name).toContain("Grand 2 BDM");
    expect(vm.location).toBe(canonical.location.value);
    expect(vm.images).toEqual(canonical.images.urls);
    expect(vm.rentalEscapesListingId).toBe("128862");
    expect(vm.rentalEscapesSourceUrl).toContain("128862");
  });

  it("preserves nightly rate semantics verbatim from the canonical layer", () => {
    const grand = toMarketplaceEstate(fixture("prop-marina-vista-4b"));
    expect(grand.nightlyDisplay).toBe("$67,655–$76,458");
    expect(grand.nightlyRateType).toBe("RANGE");

    const dolce = toMarketplaceEstate(fixture("prop-miami-beach-condo"));
    expect(dolce.nightlyRateType).toBe("DYNAMIC");
    expect(dolce.nightlyDisplay).toContain("DYNAMIC");

    const trajan = toMarketplaceEstate(fixture("prop-berlin-mitte-apartment"));
    expect(trajan.nightlyRateType).toBe("STARTING_FROM");
  });

  it("exposes the approved ESTIMATED Estate Value for all 24 (never legacy)", () => {
    const vms = toMarketplaceEstates(PROPERTIES);
    expect(vms).toHaveLength(24);
    for (const vm of vms) {
      expect(vm.estateValue).not.toBeNull();
      expect(vm.estateValue!.provenance).toBe("estimated");
      expect(vm.estateValue!.value).toBeGreaterThan(0);
      expect(vm.estateValue!.value).not.toBe(LEGACY_82M_CENTS);
    }
    const grand = vms.find((v) => v.id === "prop-marina-vista-4b")!;
    expect(grand.estateValue!.value).toBe(800_000_000);
  });

  it("carries trading params by reference from the listing (no invented funding)", () => {
    const vm = toMarketplaceEstate(fixture("prop-marina-vista-4b"));
    const f = fixture("prop-marina-vista-4b");
    expect(vm.status).toBe(f.status);
    expect(vm.sharePriceUsd).toBe(f.sharePriceUsd);
    expect(vm.totalShares).toBe(f.totalShares);
    expect(vm.sharesRemaining).toBe(f.sharesRemaining);
    expect(vm.fundingProgressRatio).toBe(f.fundingProgressRatio);
  });

  it("falls back to listing identity for unknown (non-canonical) ids — never crashes routing", () => {
    const fallback = toMarketplaceEstate({
      ...fixture("prop-marina-vista-4b"),
      id: "prop-unknown-test",
      title: "Fallback Villa",
      location: "Nowhere",
    });
    expect(fallback.id).toBe("prop-unknown-test");
    expect(fallback.name).toBe("Fallback Villa");
    expect(fallback.location).toBe("Nowhere");
    expect(fallback.rentalEscapesListingId).toBeNull();
    expect(fallback.estateValue).toBeNull();
  });

  it("covers exactly the 24 canonical ids with no duplicates", () => {
    const vms = toMarketplaceEstates(PROPERTIES);
    const ids = vms.map((v) => v.id);
    expect(new Set(ids).size).toBe(24);
    const canonicalIds = new Set(CANONICAL_MARKETPLACE_ESTATES.map((e) => e.propertyId));
    for (const id of ids) {
      expect(canonicalIds.has(id)).toBe(true);
    }
    expect(isCanonicalMarketplaceId("prop-marina-vista-4b")).toBe(true);
    expect(isCanonicalMarketplaceId("prop-does-not-exist")).toBe(false);
  });

  it("PROMPT 03: carries canonical property type, description, valuation display and growth", () => {
    const grand = toMarketplaceEstate(fixture("prop-marina-vista-4b"));
    // Source-supported type — never the legacy fixture type.
    expect(grand.propertyType).toBe("Overwater Villa");
    expect(grand.description).toContain("overwater villa");
    expect(grand.valuationDisplay).toEqual({
      kind: "range",
      min: 800_000_000,
      max: 1_000_000_000,
      provenance: "estimated",
    });
    expect(grand.growthPotential?.potentialValue).toBe(1_800_000_000);
    expect(grand.growthPotential?.potentialPct).toBeNull();

    const aerial = toMarketplaceEstate(fixture("prop-soho-loft-studio"));
    expect(aerial.propertyType).toBe("Private Island Estate");
    expect(aerial.valuationDisplay).toEqual({
      kind: "single",
      value: 2_000_000_000,
      provenance: "estimated",
    });
    expect(aerial.growthPotential?.potentialPct).toBe(32);

    // All 24 resolve canonical facts (legacy "Apartment"/"Studio" nowhere).
    for (const vm of toMarketplaceEstates(PROPERTIES)) {
      expect(vm.propertyType, `${vm.id} type`).not.toBeNull();
      expect(["Apartment", "Studio", "Flat", "Loft", "Condo", "Penthouse"]).not.toContain(
        vm.propertyType,
      );
      expect(vm.growthPotential, `${vm.id} growth`).not.toBeNull();
    }
  });
});
