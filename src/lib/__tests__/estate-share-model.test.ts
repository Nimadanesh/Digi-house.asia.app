// Tests for the canonical Share Model (Phase 9 Slice C).
// Covers: derived structure, buy/sell totals, gain/loss, remaining ownership, supply
// projection, data-driven market states, no-invention secondary pricing, optional
// economics-snapshot attribution, determinism, immutability, and invalid-input handling.

import { describe, expect, it } from "vitest";

import {
  attributeBaselineOwnerProfit,
  attributeOwnerProfitToShares,
  deriveShareState,
  estateShareOverview,
  gainLossVsAcquisition,
  lowestActiveAskUsd,
  ownershipForShares,
  ownershipPerShare,
  primaryPurchaseTotalUsd,
  primarySupplyAfterPurchase,
  referenceAssetValuePerShare,
  remainingOwnershipAfterSale,
  secondaryMarketPrice,
  secondarySaleTotalUsd,
  validateEstateShareConfig,
} from "../estate-share-model";
import { computeBaselineEstateEconomics, computeEstateEconomics } from "../economics/estate-economics";
import { GRAND_2_BDM_OCEAN_POOL_VILLA } from "../economics/estates/grand-2-bdm-ocean-pool-villa";
import type {
  Estate,
  EstateEconomics,
  EstateScenario,
} from "@/types/estate";
import type {
  EstateSecondaryListing,
  EstateShareConfig,
  EstateUserPosition,
} from "@/types/estate-share";

// ---------------------------------------------------------------------------
// Fixtures — TEST CONFIGURATION ONLY (no production share supply invented)
// ---------------------------------------------------------------------------

/** Labeled test configuration — values are NOT production offering terms. */
const TEST_CONFIG: EstateShareConfig = {
  estateId: "estate-test",
  currency: "USD",
  estateValue: { value: 800_000_000, provenance: "estimated" }, // $8M (Grand 2 BDM valuation as fixture)
  totalShares: 8_000,
  primarySharePrice: 100_000, // $1,000.00
  primarySharesAvailable: 5_000,
};

const TEST_POSITION: EstateUserPosition = {
  sharesOwned: 100,
  acquisitionPricePerShareUsd: 100_000, // $1,000.00 — bought at primary
};

const LISTING_A: EstateSecondaryListing = {
  id: "listing-a",
  sellerRef: "seller-a",
  pricePerShareUsd: 110_000, // $1,100
  quantity: 40,
  status: "active",
};

function makeListings(...overrides: Partial<EstateSecondaryListing>[]): EstateSecondaryListing[] {
  if (overrides.length === 0) return [];
  return overrides.map((o, i) => ({
    id: `listing-${i + 1}`,
    sellerRef: `seller-${i + 1}`,
    pricePerShareUsd: 100_000,
    quantity: 10,
    status: "active" as const,
    ...o,
  }));
}

// ---------------------------------------------------------------------------
// 1. Derived structure
// ---------------------------------------------------------------------------

describe("derived structure", () => {
  it("ownershipPerShare = 1 / totalShares", () => {
    expect(ownershipPerShare(8_000)).toBe(0.000125);
  });

  it("ownershipPerShare is null for zero/invalid totalShares (no divide-by-zero)", () => {
    expect(ownershipPerShare(0)).toBeNull();
    expect(ownershipPerShare(-5)).toBeNull();
    expect(ownershipPerShare(2.5)).toBeNull();
  });

  it("referenceAssetValuePerShare = estateValue / totalShares (rounded half-up)", () => {
    expect(referenceAssetValuePerShare(TEST_CONFIG.estateValue, 8_000)).toEqual({
      value: 100_000, // 8,000,000.00 / 8,000 = 1,000.00
      provenance: "calculated",
    });
  });

  it("referenceAssetValuePerShare is UNKNOWN (null) when estate value is missing", () => {
    expect(referenceAssetValuePerShare(null, 8_000)).toBeNull();
  });

  it("referenceAssetValuePerShare is null when totalShares invalid", () => {
    expect(referenceAssetValuePerShare(TEST_CONFIG.estateValue, 0)).toBeNull();
  });

  it("ownership for N shares", () => {
    expect(ownershipForShares(80, 8_000)).toBeCloseTo(0.01, 12); // 1%
    expect(ownershipForShares(0, 8_000)).toBe(0);
  });

  it("ownershipForShares throws on invalid totalShares", () => {
    expect(() => ownershipForShares(1, 0)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// 2. Primary purchase totals
// ---------------------------------------------------------------------------

describe("primary purchase total", () => {
  it("zero shares → 0", () => {
    expect(primaryPurchaseTotalUsd(0, TEST_CONFIG.primarySharePrice)).toBe(0);
  });

  it("one share → the share price", () => {
    expect(primaryPurchaseTotalUsd(1, TEST_CONFIG.primarySharePrice)).toBe(100_000);
  });

  it("many shares → shares × price (integer cents)", () => {
    expect(primaryPurchaseTotalUsd(37, TEST_CONFIG.primarySharePrice)).toBe(3_700_000);
    expect(Number.isInteger(primaryPurchaseTotalUsd(37, TEST_CONFIG.primarySharePrice))).toBe(true);
  });

  it("missing price → explicit failure (no guessed total)", () => {
    expect(() => primaryPurchaseTotalUsd(5, null)).toThrow(/not configured/);
  });

  it("negative shares → explicit failure", () => {
    expect(() => primaryPurchaseTotalUsd(-1, TEST_CONFIG.primarySharePrice)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// 3. Secondary sale totals + gain/loss
// ---------------------------------------------------------------------------

describe("secondary sale + gain/loss vs acquisition", () => {
  it("sale total = shares × price", () => {
    expect(secondarySaleTotalUsd(40, 110_000)).toBe(4_400_000);
  });

  it("gain when selling above acquisition", () => {
    const r = gainLossVsAcquisition(10, 110_000, 100_000);
    expect(r).toEqual({
      saleTotalUsd: 1_100_000,
      acquisitionCostUsd: 1_000_000,
      gainLossUsd: 100_000, // +$1,000.00
      direction: "gain",
    });
  });

  it("loss when selling below acquisition", () => {
    const r = gainLossVsAcquisition(10, 90_000, 100_000);
    expect(r.gainLossUsd).toBe(-100_000);
    expect(r.direction).toBe("loss");
  });

  it("break-even at acquisition price", () => {
    const r = gainLossVsAcquisition(10, 100_000, 100_000);
    expect(r.gainLossUsd).toBe(0);
    expect(r.direction).toBe("breakEven");
  });

  it("unknown acquisition price → explicit failure (no invented basis)", () => {
    expect(() => gainLossVsAcquisition(10, 110_000, null)).toThrow(/unknown/);
  });
});

// ---------------------------------------------------------------------------
// 4. Remaining ownership after sale
// ---------------------------------------------------------------------------

describe("remaining ownership after sale", () => {
  it("pure projection of remaining shares + fraction", () => {
    const r = remainingOwnershipAfterSale(100, 40, 8_000);
    expect(r.sharesRemaining).toBe(60);
    expect(r.ownershipRemainingRatio).toBeCloseTo(0.0075, 12); // 0.75%
  });

  it("selling everything → zero remaining", () => {
    const r = remainingOwnershipAfterSale(100, 100, 8_000);
    expect(r.sharesRemaining).toBe(0);
    expect(r.ownershipRemainingRatio).toBe(0);
  });

  it("selling zero → explicit no-op result", () => {
    const r = remainingOwnershipAfterSale(100, 0, 8_000);
    expect(r.sharesRemaining).toBe(100);
    expect(r.ownershipRemainingRatio).toBeCloseTo(0.0125, 12);
  });

  it("oversell → explicit rejection", () => {
    expect(() => remainingOwnershipAfterSale(100, 101, 8_000)).toThrow(/cannot sell/);
  });
});

// ---------------------------------------------------------------------------
// 5. Primary supply projection
// ---------------------------------------------------------------------------

describe("primary supply after purchase", () => {
  it("reduces supply and reports acquired ownership", () => {
    const r = primarySupplyAfterPurchase(TEST_CONFIG, 10);
    expect(r.primarySharesRemaining).toBe(4_990);
    expect(r.ownershipAcquiredRatio).toBeCloseTo(0.00125, 12);
  });

  it("buying the full remaining supply is valid", () => {
    const r = primarySupplyAfterPurchase(TEST_CONFIG, 5_000);
    expect(r.primarySharesRemaining).toBe(0);
  });

  it("overbuy → explicit rejection (no silent cap)", () => {
    expect(() => primarySupplyAfterPurchase(TEST_CONFIG, 5_001)).toThrow(/only 5000/);
  });

  it("negative quantity → explicit rejection", () => {
    expect(() => primarySupplyAfterPurchase(TEST_CONFIG, -1)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// 6. Config validation
// ---------------------------------------------------------------------------

describe("config validation", () => {
  it("valid config passes", () => {
    expect(hasNoIssues(validateEstateShareConfig(TEST_CONFIG))).toBe(true);
  });

  it("totalShares = 0 → invalid", () => {
    const issues = validateEstateShareConfig({ ...TEST_CONFIG, totalShares: 0 });
    expect(issues.invalidTotalShares).toBe(true);
  });

  it("negative available supply → invalid", () => {
    const issues = validateEstateShareConfig({ ...TEST_CONFIG, primarySharesAvailable: -1 });
    expect(issues.negativePrimarySharesAvailable).toBe(true);
  });

  it("negative price → invalid", () => {
    const issues = validateEstateShareConfig({ ...TEST_CONFIG, primarySharePrice: -1 });
    expect(issues.negativePrimarySharePrice).toBe(true);
  });
});

function hasNoIssues(issues: ReturnType<typeof validateEstateShareConfig>): boolean {
  return !issues.invalidTotalShares &&
    !issues.negativePrimarySharesAvailable &&
    !issues.negativePrimarySharePrice &&
    !issues.negativeNearlySoldOutThreshold;
}

// ---------------------------------------------------------------------------
// 7. Market / purchase states (data-driven)
// ---------------------------------------------------------------------------

describe("market states", () => {
  it("primary available", () => {
    const s = deriveShareState(TEST_CONFIG, TEST_POSITION, []);
    expect(s.market).toBe("primaryAvailable");
    expect(s.nearlySoldOutKnown).toBe(false);
  });

  it("nearly sold out ONLY when the threshold is configured (no magic numbers)", () => {
    const gated: EstateShareConfig = { ...TEST_CONFIG, primarySharesAvailable: 50, nearlySoldOutThreshold: 100 };
    expect(deriveShareState(gated, TEST_POSITION, []).market).toBe("primaryNearlySoldOut");

    // Same 50 remaining without a threshold → honest "primaryAvailable", flagged not-known.
    const ungated: EstateShareConfig = { ...TEST_CONFIG, primarySharesAvailable: 50 };
    const s = deriveShareState(ungated, TEST_POSITION, []);
    expect(s.market).toBe("primaryAvailable");
    expect(s.nearlySoldOutKnown).toBe(false);
  });

  it("primary sold out — a primary-market fact, independent of secondary", () => {
    const soldOut: EstateShareConfig = { ...TEST_CONFIG, primarySharesAvailable: 0 };
    const s = deriveShareState(soldOut, TEST_POSITION, [LISTING_A]);
    expect(s.primarySoldOut).toBe(true);
    expect(s.primarySupplyState).toBe("soldOut");
    // Still sold out even though secondary exists (flag-level truth).
  });

  it("sold out + active secondary → secondaryAvailable (secondary path, no primary invention)", () => {
    const soldOut: EstateShareConfig = { ...TEST_CONFIG, primarySharesAvailable: 0 };
    const s = deriveShareState(soldOut, TEST_POSITION, [LISTING_A]);
    expect(s.market).toBe("secondaryAvailable");
    expect(s.secondaryAvailableListings).toBe(1);
  });

  it("sold out + no secondary → noSharesAvailable flag with the honest sold-out label", () => {
    const soldOut: EstateShareConfig = { ...TEST_CONFIG, primarySharesAvailable: 0 };
    const s = deriveShareState(soldOut, TEST_POSITION, []);
    expect(s.noSharesAvailable).toBe(true);
    expect(s.market).toBe("primarySoldOut");
  });

  it("cancelled / zero-quantity listings do not count as availability", () => {
    const soldOut: EstateShareConfig = { ...TEST_CONFIG, primarySharesAvailable: 0 };
    const listings = makeListings(
      { status: "cancelled" },
      { quantity: 0 },
    );
    const s = deriveShareState(soldOut, TEST_POSITION, listings);
    expect(s.noSharesAvailable).toBe(true);
    expect(s.secondaryAvailable).toBe(false);
    expect(s.secondaryAvailableListings).toBe(0);
  });

  it("user ownership flags: owns → may sell; does not own → may not", () => {
    expect(deriveShareState(TEST_CONFIG, TEST_POSITION, []).userMaySell).toBe(true);
    expect(deriveShareState(TEST_CONFIG, { sharesOwned: 0, acquisitionPricePerShareUsd: null }, []).userOwnsShares).toBe(false);
    expect(deriveShareState(TEST_CONFIG, { sharesOwned: 0, acquisitionPricePerShareUsd: null }, []).userMaySell).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 8. Secondary pricing — no invention
// ---------------------------------------------------------------------------

describe("secondary market price (no invention)", () => {
  it("no listings → absent", () => {
    expect(secondaryMarketPrice(null, [])).toBeNull();
    expect(lowestActiveAskUsd([])).toBeNull();
  });

  it("exactly one active listing → that ask, observed", () => {
    expect(secondaryMarketPrice(null, [LISTING_A])).toEqual({
      value: 110_000,
      provenance: "observed",
    });
  });

  it("multiple active listings → price UNKNOWN (aggregation rule undefined); lowest ask exposed as a fact", () => {
    const listings = makeListings(
      { pricePerShareUsd: 120_000 },
      { pricePerShareUsd: 105_000 },
    );
    expect(secondaryMarketPrice(null, listings)).toBeNull();
    expect(lowestActiveAskUsd(listings)).toBe(105_000);
  });

  it("configured market mark wins and preserves provenance", () => {
    const mark = { value: 108_000, provenance: "estimated" as const };
    expect(secondaryMarketPrice(mark, [LISTING_A])).toEqual(mark);
  });

  it("non-active listings are ignored", () => {
    expect(secondaryMarketPrice(null, makeListings({ status: "filled" }))).toBeNull();
  });

  it("three price concepts stay distinct in the overview (fixture where all differ)", () => {
    const overview = estateShareOverview(TEST_CONFIG, TEST_POSITION, [LISTING_A]);
    expect(overview.config.primarySharePrice).toBe(100_000); // primary
    expect(overview.structure.referenceAssetValuePerShare!.value).toBe(100_000); // reference — distinct concept, coincidentally equal here
    expect(overview.secondaryMarketPrice!.value).toBe(110_000); // secondary

    const distinct: EstateShareConfig = { ...TEST_CONFIG, estateValue: { value: 900_000_000, provenance: "estimated" } };
    const o2 = estateShareOverview(distinct, TEST_POSITION, [LISTING_A]);
    expect(o2.config.primarySharePrice).toBe(100_000);
    expect(o2.structure.referenceAssetValuePerShare!.value).toBe(112_500); // 9,000,000 / 8,000
    expect(o2.secondaryMarketPrice!.value).toBe(110_000);
    expect(
      new Set([
        o2.config.primarySharePrice,
        o2.structure.referenceAssetValuePerShare!.value,
        o2.secondaryMarketPrice!.value,
      ]).size,
    ).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 9. Optional economics snapshot attribution (no formula forks)
// ---------------------------------------------------------------------------

describe("economics snapshot attribution", () => {
  it("owner profit attributed = snapshot ownerProfit × ownership fraction (via EconomicModel)", () => {
    const snapshot = computeBaselineEstateEconomics(GRAND_2_BDM_OCEAN_POOL_VILLA);
    // Baseline seed has unknown guests → netProfitKnown false → attribution must be null.
    expect(snapshot.profit.netProfitKnown).toBe(false);
    expect(attributeOwnerProfitToShares(snapshot, 0.01)).toBeNull();
  });

  it("attribution computes when the snapshot is fully known", () => {
    const known: Pick<EstateEconomics, "profit"> = {
      profit: {
        totalCostsUsd: 0,
        netProfitUsd: 1_000_000,
        ownerProfitUsd: 400_000,
        operatorProfitUsd: 600_000,
        netProfitKnown: true,
      },
    };
    expect(attributeOwnerProfitToShares(known, 0.01)).toBe(4_000); // 1% × $400k
  });

  it("attributeBaselineOwnerProfit delegates to the canonical EconomicModel (single source)", () => {
    // guests unknown → null (never fabricated)
    expect(attributeBaselineOwnerProfit(GRAND_2_BDM_OCEAN_POOL_VILLA, 80, 8_000)).toBeNull();
  });

  it("a guest-count scenario snapshot produces deterministic attribution", () => {
    const estate: Estate = GRAND_2_BDM_OCEAN_POOL_VILLA;
    const scenario: EstateScenario = { ...estate.baselineScenario, averageOccupiedGuests: 4 };
    const snapshot = computeEstateEconomics(estate, scenario);
    expect(attributeOwnerProfitToShares(snapshot, 0.000125)).toBe(
      Math.round(snapshot.profit.ownerProfitUsd * 0.000125),
    );
  });
});

// ---------------------------------------------------------------------------
// 10. Determinism + immutability
// ---------------------------------------------------------------------------

describe("determinism and immutability", () => {
  it("identical inputs → identical results", () => {
    const a = estateShareOverview(TEST_CONFIG, TEST_POSITION, [LISTING_A]);
    const b = estateShareOverview(TEST_CONFIG, TEST_POSITION, [LISTING_A]);
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("evaluation does not mutate config, position, or listings", () => {
    const config: EstateShareConfig = { ...TEST_CONFIG };
    const position: EstateUserPosition = { ...TEST_POSITION };
    const listings: EstateSecondaryListing[] = [LISTING_A];
    const configSnapshot = JSON.stringify(config);
    const positionSnapshot = JSON.stringify(position);
    const listingsSnapshot = JSON.stringify(listings);

    estateShareOverview(config, position, listings);
    primarySupplyAfterPurchase(config, 10);
    remainingOwnershipAfterSale(position.sharesOwned, 10, config.totalShares);
    gainLossVsAcquisition(10, 110_000, position.acquisitionPricePerShareUsd);

    expect(JSON.stringify(config)).toBe(configSnapshot);
    expect(JSON.stringify(position)).toBe(positionSnapshot);
    expect(JSON.stringify(listings)).toBe(listingsSnapshot);
  });
});
