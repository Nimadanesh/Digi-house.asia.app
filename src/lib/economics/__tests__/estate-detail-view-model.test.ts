// Tests for the Slice E view-model: THE wiring contract between the Estate Detail UI
// and the canonical engines (EconomicModel / ScenarioEngine / ShareModel).
// The UI must consume these outputs only — no tax/net/share formula may be
// re-derived in a component (asserted structurally by keeping engine imports out of
// components/**; asserted behaviorally here through exact canonical values).

import { describe, expect, it } from "vitest";

import type { Listing } from "@/types/property";
import type { OrderBookLevel } from "@/types/order";
import { PROPERTIES } from "@/lib/mock/seed/properties";
import {
  buildEstateDetailViewModel,
  resolveCanonicalEstateForListing,
  selectScenarioEconomics,
} from "../estate-detail-view-model";
import { GRAND_2_BDM_OCEAN_POOL_VILLA } from "../estates/grand-2-bdm-ocean-pool-villa";

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "test-villa",
    title: "Test Villa",
    location: "Test Coast",
    description: "A test villa.",
    images: ["/images/test-01.jpg"],
    totalShares: 1000,
    sharePriceUsd: 12500,
    status: "funding",
    ownerWalletAddress: "EQTest",
    annualRentUsd: 520000,
    createdAt: "2026-01-12T09:00:00Z",
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
      tokenizationDocUrl: "#tokenization-demo",
    },
    rentalHistory: [],
    ...overrides,
  };
}

function ask(priceUsd: number, quantity: number): OrderBookLevel {
  return { priceUsd, quantity, cumulative: quantity };
}

// Canonical Grand 2 BDM baseline: ADR $73,500 × 273.75 nights = $20,120,625.
const GRAND_BASELINE_GROSS_CENTS = 2_012_062_500;

describe("resolveCanonicalEstateForListing", () => {
  it("resolves the Grand 2 BDM canonical estate for its fixture listing", () => {
    expect(resolveCanonicalEstateForListing("re-128862")).toBe(
      GRAND_2_BDM_OCEAN_POOL_VILLA,
    );
  });

  it("returns null when no canonical estate is configured (never invents one)", () => {
    expect(resolveCanonicalEstateForListing("re-126855")).toBeNull();
    expect(resolveCanonicalEstateForListing("no-such-id")).toBeNull();
  });
});

describe("economics wiring (Grand 2 BDM)", () => {
  const grand = makeListing({ id: "re-128862" });

  it("exposes baseline economics with the exact canonical gross", () => {
    const vm = buildEstateDetailViewModel(grand);
    expect(vm.economicsAvailable).toBe(true);
    expect(vm.baseline).not.toBeNull();
    expect(vm.baseline!.economics.revenue.grossAnnualRevenueUsd).toBe(GRAND_BASELINE_GROSS_CENTS);
    expect(vm.baseline!.kind).toBe("baseline");
  });

  it("exposes approved descriptive, size and nightly-display fields", () => {
    const vm = buildEstateDetailViewModel(makeListing({ id: "re-128862" }));
    expect(vm.aboutText).toContain("Overwater luxury villa");
    expect(vm.sizeText).toContain("382 m² total");
    expect(vm.nightlyDisplayText).toBe("$67,655–$76,458");
  });

  it("leaves descriptive fields null without a canonical record (never fixture copy)", () => {
    const vm = buildEstateDetailViewModel(makeListing());
    expect(vm.aboutText).toBeNull();
    expect(vm.sizeText).toBeNull();
    expect(vm.nightlyDisplayText).toBeNull();
  });

  it("resolves all 24 canonical records with identity, value, copy, size and rate", () => {
    expect(PROPERTIES).toHaveLength(24);
    for (const p of PROPERTIES) {
      const vm = buildEstateDetailViewModel(p);
      expect(vm.valuation?.value, `${p.id} valuation`).not.toBeNull();
      expect(vm.valuation?.provenance, `${p.id} provenance`).toBe("estimated");
      expect(vm.aboutText, `${p.id} about`).not.toBeNull();
      expect(vm.nightlyDisplayText, `${p.id} nightly`).not.toBeNull();
    }
  });

  it("exposes the canonical nightly range (no legacy display laundering)", () => {
    const vm = buildEstateDetailViewModel(grand);
    expect(vm.nightlyRangeCents).toEqual({ min: 6_700_000, max: 8_000_000 });
  });

  it("exposes the occupancy envelope bounds (never collapsed to a midpoint)", () => {
    const vm = buildEstateDetailViewModel(grand);
    expect(vm.envelope).not.toBeNull();
    const lower = vm.envelope!.lower.economics.revenue.grossAnnualRevenueUsd;
    const base = vm.baseline!.economics.revenue.grossAnnualRevenueUsd;
    const upper = vm.envelope!.upper.economics.revenue.grossAnnualRevenueUsd;
    expect(lower).toBeLessThan(base);
    expect(upper).toBeGreaterThan(base);
    expect(vm.envelope!.lower.resolution.occupancyRate.value).toBe(0.6);
    expect(vm.envelope!.upper.resolution.occupancyRate.value).toBe(0.9);
  });

  it("keeps all six cost lines with the green tax honestly unknown (guests pending)", () => {
    const vm = buildEstateDetailViewModel(grand);
    const ids = vm.baseline!.economics.costs.map((c) => c.id);
    expect(ids).toEqual([
      "tourismTax",
      "serviceCharge",
      "agencyRentalOta",
      "operatorOperating",
      "greenTax",
      "repairInsuranceMaintenance",
    ]);
    const green = vm.baseline!.economics.costs.find((c) => c.id === "greenTax")!;
    expect(green.unknown).toBe(true);
    // Missing guests → net profit is NOT a fact.
    expect(vm.baseline!.economics.profit.netProfitKnown).toBe(false);
  });

  it("keeps agencyRentalOtaCost and travelAgencyShare as separate lines", () => {
    const vm = buildEstateDetailViewModel(grand);
    const agencyCost = vm.baseline!.economics.costs.find((c) => c.id === "agencyRentalOta")!;
    expect(agencyCost.amountUsd).toBeGreaterThan(0);
    expect(vm.baseline!.economics.travelAgencyShareUsd).toBeGreaterThan(0);
    expect(vm.baseline!.economics.travelAgencyShareUsd).toBe(agencyCost.amountUsd);
  });

  it("reports unknown profit honestly: zeroed amounts + non-reconciling flags", () => {
    const vm = buildEstateDetailViewModel(grand);
    const { profit, reconciliation } = vm.baseline!.economics;
    // Green tax unknown → net profit is NOT a fact: amounts zeroed by the engine…
    expect(profit.netProfitKnown).toBe(false);
    expect(profit.netProfitUsd).toBe(0);
    expect(profit.ownerProfitUsd).toBe(0);
    expect(profit.operatorProfitUsd).toBe(0);
    // …and the artifact truthfully reports non-reconciliation (never faked green).
    expect(reconciliation.netProfitReconciles).toBe(false);
    expect(reconciliation.allocationReconciles).toBe(true);
  });

  it("never mutates the canonical estate", () => {
    const before = JSON.stringify(GRAND_2_BDM_OCEAN_POOL_VILLA);
    buildEstateDetailViewModel(grand, { sharesOwned: 5 });
    expect(JSON.stringify(GRAND_2_BDM_OCEAN_POOL_VILLA)).toBe(before);
  });
});

describe("selectScenarioEconomics", () => {
  const grand = makeListing({ id: "re-128862" });

  it("selects the configured baseline for base", () => {
    const selected = selectScenarioEconomics(buildEstateDetailViewModel(grand), "base")!;
    expect(selected.bound).toBe("base");
    expect(selected.result.kind).toBe("baseline");
    expect(selected.occupancyValue).toBe(0.75);
    expect(selected.adrProvenance).toBe("estimated");
  });

  it("selects explicit envelope bounds (never averaged)", () => {
    const vm = buildEstateDetailViewModel(grand);
    const lower = selectScenarioEconomics(vm, "lower")!;
    const upper = selectScenarioEconomics(vm, "upper")!;
    expect(lower.result.kind).toBe("envelopeBound");
    expect(lower.occupancyValue).toBe(0.6);
    expect(upper.occupancyValue).toBe(0.9);
    expect(lower.occupancyProvenance).toBe("estimated");
  });

  it("returns null without a canonical estate", () => {
    const vm = buildEstateDetailViewModel(makeListing());
    expect(selectScenarioEconomics(vm, "base")).toBeNull();
    expect(selectScenarioEconomics(vm, "lower")).toBeNull();
  });
});

describe("economics absence (non-canonical listings)", () => {
  it("reports unavailable economics without inventing numbers", () => {
    const vm = buildEstateDetailViewModel(makeListing());
    expect(vm.estate).toBeNull();
    expect(vm.economicsAvailable).toBe(false);
    expect(vm.baseline).toBeNull();
    expect(vm.envelope).toBeNull();
    expect(vm.nightlyRangeCents).toBeNull();
  });
});

describe("pending cost structure (listings without engine economics)", () => {
  it("exposes all six cost lines as unknown from the shared rate table (never computed)", () => {
    const vm = buildEstateDetailViewModel(
      makeListing({ id: "re-126855" }),
    );
    expect(vm.baseline).toBeNull();
    expect(vm.pendingCosts).not.toBeNull();
    expect(vm.pendingCosts!.map((c) => c.id)).toEqual([
      "tourismTax",
      "serviceCharge",
      "agencyRentalOta",
      "operatorOperating",
      "greenTax",
      "repairInsuranceMaintenance",
    ]);
    for (const line of vm.pendingCosts!) {
      // Unknown inputs → unknown lines with zeroed amounts (engine convention).
      expect(line.unknown).toBe(true);
      expect(line.amountUsd).toBe(0);
    }
    // Rates are the shared product constants — identical bases, no fork.
    const byId = Object.fromEntries(vm.pendingCosts!.map((c) => [c.id, c]));
    expect(byId.tourismTax).toMatchObject({ basis: "grossAnnualRevenue", rate: 0.17 });
    expect(byId.serviceCharge).toMatchObject({ basis: "grossAnnualRevenue", rate: 0.1 });
    expect(byId.greenTax).toMatchObject({ basis: "guestNights", rate: 1200 });
    expect(byId.agencyRentalOta).toMatchObject({ basis: "grossAnnualRevenue", rate: 0.18 });
    expect(byId.operatorOperating).toMatchObject({ basis: "grossAnnualRevenue", rate: 0.125 });
    expect(byId.repairInsuranceMaintenance).toMatchObject({ basis: "propertyValue", rate: 0.015 });
  });

  it("is null for Grand 2 BDM (engine lines are used instead)", () => {
    const vm = buildEstateDetailViewModel(makeListing({ id: "re-128862" }));
    expect(vm.baseline).not.toBeNull();
    expect(vm.pendingCosts).toBeNull();
  });

  it("covers all 24 canonical estates without engine economics (no legacy figures)", () => {
    for (const p of PROPERTIES) {
      const vm = buildEstateDetailViewModel(p);
      expect(vm.valuation?.provenance, `${p.id} provenance`).toBe("estimated");
      expect(vm.nightlyDisplayText, `${p.id} nightly`).not.toBeNull();
      if (vm.baseline == null) {
        expect(vm.pendingCosts, `${p.id} pending costs`).not.toBeNull();
        expect(vm.pendingCosts, `${p.id} six lines`).toHaveLength(6);
        for (const line of vm.pendingCosts!) {
          expect(line.unknown, `${p.id}.${line.id} unknown`).toBe(true);
          expect(line.amountUsd, `${p.id}.${line.id} zeroed`).toBe(0);
        }
      }
    }
  });
});

describe("share wiring from listing facts (all 24 listings)", () => {
  it("funding listing → primaryAvailable with the listing price (never invented)", () => {
    const vm = buildEstateDetailViewModel(makeListing());
    expect(vm.share.state.market).toBe("primaryAvailable");
    expect(vm.share.config.primarySharePrice).toBe(12500);
    expect(vm.share.config.totalShares).toBe(1000);
    expect(vm.share.structure.ownershipPerShare).toBe(0.001);
  });

  it("resale listing with asks → secondaryAvailable with the lowest ask quoted", () => {
    const vm = buildEstateDetailViewModel(
      makeListing({ status: "resale", sharesRemaining: 0 }),
      { asks: [ask(13200, 18), ask(12900, 5)] },
    );
    expect(vm.share.state.market).toBe("secondaryAvailable");
    expect(vm.share.lowestActiveAskUsd).toBe(12900);
    // Multiple asks → no single market price (aggregation is undefined product).
    expect(vm.share.secondaryMarketPrice).toBeNull();
    // Primary is closed on secondary → no primary price (never collapsed).
    expect(vm.share.config.primarySharePrice).toBeNull();
  });

  it("resale listing without asks → primarySoldOut (nothing purchasable)", () => {
    const vm = buildEstateDetailViewModel(
      makeListing({ status: "resale", sharesRemaining: 0 }),
      { asks: [] },
    );
    expect(vm.share.state.market).toBe("primarySoldOut");
    expect(vm.share.state.noSharesAvailable).toBe(true);
  });

  it("sold-out primary without asks → primarySoldOut", () => {
    const vm = buildEstateDetailViewModel(
      makeListing({ status: "funding", sharesRemaining: 0 }),
      { asks: [] },
    );
    expect(vm.share.state.market).toBe("primarySoldOut");
  });

  it("reference value per share stays unknown only without a canonical record", () => {
    // test-villa has no canonical record → no valuation admitted (never
    // research text or legacy mock promoted).
    const vm = buildEstateDetailViewModel(makeListing());
    expect(vm.valuation).toBeNull();
    expect(vm.share.config.estateValue).toBeNull();
    expect(vm.share.structure.referenceAssetValuePerShare).toBeNull();
  });

  it("approved valuations flow into the share config for every canonical estate", () => {
    const vm = buildEstateDetailViewModel(
      makeListing({ id: "re-126855", totalShares: 1000 }),
    );
    expect(vm.valuation).toEqual({ value: 1_800_000_000, provenance: "estimated" });
    expect(vm.share.config.estateValue).toEqual({ value: 1_800_000_000, provenance: "estimated" });
    // 18,000,000 / 1000 = $18,000.00 per share reference (calculated, not a price).
    expect(vm.share.structure.referenceAssetValuePerShare).toEqual({
      value: 1_800_000,
      provenance: "calculated",
    });
  });

  it("Grand 2 BDM carries the $8M estimated reference (calculated, never a price)", () => {
    const vm = buildEstateDetailViewModel(makeListing({ id: "re-128862" }));
    expect(vm.share.config.estateValue).toEqual({ value: 800_000_000, provenance: "estimated" });
    expect(vm.share.structure.referenceAssetValuePerShare?.provenance).toBe("calculated");
  });
});

describe("rental escapes URL passthrough (Reserve Villa CTA)", () => {
  it("exposes the exact canonical listing URL for Grand 2 BDM", () => {
    const vm = buildEstateDetailViewModel(makeListing({ id: "re-128862" }));
    expect(vm.rentalEscapesUrl).toBe(
      "https://www.rentalescapes.com/rentals/luxury-villa-rentals-asia/maldives/bodufushi/joali-being/grand-2-bdm-ocean-pool-villa-128862",
    );
  });

  it("exposes exact canonical URLs across rate semantics (RANGE / STARTING_FROM / DYNAMIC)", () => {
    const aerial = buildEstateDetailViewModel(makeListing({ id: "re-126855" }));
    expect(aerial.rentalEscapesUrl).toContain("rentalescapes.com");
    expect(aerial.rentalEscapesUrl).toMatch(/-126855$/);
    const trajan = buildEstateDetailViewModel(makeListing({ id: "re-128529" }));
    expect(trajan.rentalEscapesUrl).toMatch(/-128529$/);
    const dolce = buildEstateDetailViewModel(makeListing({ id: "re-122903" }));
    expect(dolce.rentalEscapesUrl).toMatch(/-122903$/);
    const pearls = buildEstateDetailViewModel(makeListing({ id: "re-130397" }));
    expect(pearls.rentalEscapesUrl).toMatch(/-130397$/);
  });

  it("covers all 24 canonical estates with exact Rental Escapes URLs (no guessing)", () => {
    expect(PROPERTIES).toHaveLength(24);
    for (const p of PROPERTIES) {
      const vm = buildEstateDetailViewModel(p);
      expect(vm.rentalEscapesUrl, `${p.id} url present`).not.toBeNull();
      expect(vm.rentalEscapesUrl, `${p.id} official host`).toContain("https://www.rentalescapes.com/");
    }
  });

  it("is null without a canonical record (never a fabricated fallback URL)", () => {
    expect(buildEstateDetailViewModel(makeListing()).rentalEscapesUrl).toBeNull();
  });
});

describe("CTA kinds follow ShareModel market states", () => {
  it("owner → manage regardless of market", () => {
    const vm = buildEstateDetailViewModel(makeListing(), { sharesOwned: 3 });
    expect(vm.share.state.userOwnsShares).toBe(true);
    expect(vm.ctaKind).toBe("manage");
  });

  it("funding with supply → buyPrimary", () => {
    expect(buildEstateDetailViewModel(makeListing()).ctaKind).toBe("buyPrimary");
  });

  it("resale with asks → buySecondary", () => {
    const vm = buildEstateDetailViewModel(
      makeListing({ status: "resale", sharesRemaining: 0 }),
      { asks: [ask(13200, 18)] },
    );
    expect(vm.ctaKind).toBe("buySecondary");
  });

  it("sold-out primary without asks → viewResale", () => {
    const vm = buildEstateDetailViewModel(
      makeListing({ status: "funding", sharesRemaining: 0 }),
      { asks: [] },
    );
    expect(vm.ctaKind).toBe("viewResale");
  });
});

describe("PROMPT 03: canonical property facts on the view model", () => {
  it("exposes the Estate24 record with canonical identity for Grand 2 BDM", () => {
    const vm = buildEstateDetailViewModel(makeListing({ id: "re-128862" }));
    expect(vm.estate24).not.toBeNull();
    expect(vm.estate24!.listingId).toBe("128862");
    expect(vm.identity).toEqual({
      name: "Grand 2 BDM Ocean Pool Villa (JOALI Being)",
      location: "Bodufushi, JOALI Being, Raa Atoll, Maldives",
      propertyType: "Overwater Villa",
      slug: "grand-2-bdm-ocean-pool-villa-joali-being",
      listingId: "128862",
      sourceUrl:
        "https://www.rentalescapes.com/rentals/luxury-villa-rentals-asia/maldives/bodufushi/joali-being/grand-2-bdm-ocean-pool-villa-128862",
    });
    expect(vm.propertyType).toBe("Overwater Villa");
    expect(vm.descriptionShort).toContain("overwater villa");
    expect(vm.descriptionFull).toContain("ocean villa");
  });

  it("shows Current Estimated Value as exactly $8M single with $18M growth (no percentage) for Grand", () => {
    const vm = buildEstateDetailViewModel(makeListing({ id: "re-128862" }));
    expect(vm.valuationDisplay).toEqual({
      kind: "single",
      value: 800_000_000,
      provenance: "estimated",
    });
    expect(vm.growthPotential?.potentialValue).toBe(1_800_000_000);
    expect(vm.growthPotential?.potentialPct).toBeNull();
    expect(vm.growthPotential?.provenance).toBe("estimated");
    // Share math keeps the approved $8M seed (never the $13.5M research central).
    expect(vm.valuation).toEqual({ value: 800_000_000, provenance: "estimated" });
  });

  it("derives growth potential with a percentage for single-value estates", () => {
    const vm = buildEstateDetailViewModel(
      makeListing({ id: "re-126855", totalShares: 1000 }),
    );
    expect(vm.identity?.name).toBe("The Aerial");
    expect(vm.propertyType).toBe("Private Island Estate");
    expect(vm.valuationDisplay).toEqual({
      kind: "single",
      value: 1_800_000_000,
      provenance: "estimated",
    });
    expect(vm.growthPotential?.potentialValue).toBe(2_640_000_000);
    expect(vm.growthPotential?.potentialPct).toBe(46.7);
  });

  it("resolves canonical identity for all 24 estates (never legacy fallback)", () => {
    expect(PROPERTIES).toHaveLength(24);
    for (const p of PROPERTIES) {
      const vm = buildEstateDetailViewModel(p);
      expect(vm.estate24, `${p.id} estate24`).not.toBeNull();
      expect(vm.identity?.name, `${p.id} name`).toBe(vm.estate24!.name);
      expect(vm.identity?.location, `${p.id} location`).toBe(vm.estate24!.location.full);
      expect(vm.identity?.sourceUrl, `${p.id} url`).toContain("rentalescapes.com");
      expect(vm.propertyType, `${p.id} type`).toBe(vm.estate24!.propertyType);
      expect(vm.valuationDisplay, `${p.id} valuation display`).not.toBeNull();
      expect(vm.growthPotential, `${p.id} growth`).not.toBeNull();
    }
  });

  it("leaves canonical facts null without a canonical record (never fixture copy)", () => {
    const vm = buildEstateDetailViewModel(makeListing());
    expect(vm.estate24).toBeNull();
    expect(vm.identity).toBeNull();
    expect(vm.propertyType).toBeNull();
    expect(vm.descriptionShort).toBeNull();
    expect(vm.descriptionFull).toBeNull();
    expect(vm.valuationDisplay).toBeNull();
    expect(vm.growthPotential).toBeNull();
  });
});
