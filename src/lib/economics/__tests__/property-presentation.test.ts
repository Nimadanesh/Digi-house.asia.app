// Phase 9 Slice 2 — single canonical financial presentation layer.
//
// RED tests (written before the module exists): cards and detail pages must
// consume ONE presentation path for monthly income and current price, across
// all 24 villas, with legitimate UNKNOWN preserved (never 0, never invented).
import { describe, it, expect } from "vitest";
import { PROPERTIES } from "@/lib/mock/seed/properties";
import { seed } from "@/lib/mock/seed";
import { toCanonicalListing } from "@/lib/mock/canonical-listing";
import { toMarketplaceEstate } from "@/lib/economics/marketplace-view-model";
import { getFinancialModelV1 } from "@/lib/economics/estates/financial-model-v1-inputs";
import { getCurrentSharePrice } from "@/lib/property-price";
import {
  getPresentedMonthlyIncome,
  presentPositionMonthlyIncome,
  getPresentedCurrentPrice,
  getPresentedPrimaryPrice,
  presentedIncomeUnknownCaption,
} from "@/lib/economics/property-presentation";

const listings = PROPERTIES.map(toCanonicalListing);

function v1Monthly(id: string): number | null {
  return getFinancialModelV1(id)?.perShare.monthlyCents ?? null;
}

describe("property presentation — single monthly-income path (V1)", () => {
  it("presents the V1 per-share monthly figure for a computable villa (Grand)", () => {
    expect(getPresentedMonthlyIncome("prop-marina-vista-4b")).toEqual({
      cents: 1629,
      currency: "USD",
      unknownKind: null,
    });
  });

  it("returns null — never 0, never invented — for every V1-unknown villa", () => {
    const unknown = listings.filter((l) => v1Monthly(l.id) == null);
    // 5 EUR mixed-currency + 10 unknown owner-tax (Slice 1 audit).
    expect(unknown).toHaveLength(15);
    for (const l of unknown) {
      expect(getPresentedMonthlyIncome(l.id).cents, l.id).toBeNull();
    }
  });

  it("presents income for exactly the 9 V1-computable villas, matching V1", () => {
    const known = listings.filter((l) => v1Monthly(l.id) != null);
    expect(known).toHaveLength(9);
    for (const l of known) {
      expect(getPresentedMonthlyIncome(l.id).cents, l.id).toBe(v1Monthly(l.id));
    }
  });

  it("scales position income as shares × per-share, null when unknown", () => {
    expect(presentPositionMonthlyIncome("prop-marina-vista-4b", 10)).toBe(16_290);
    expect(presentPositionMonthlyIncome("prop-marina-vista-4b", 1)).toBe(1629);
    expect(presentPositionMonthlyIncome("prop-brooklyn-brownstone-flat", 10)).toBeNull();
  });
});

describe("property presentation — unknown reasons (Slice 3)", () => {
  it("classifies all 15 unknown villas: 5 EUR mixed-currency, 10 unknown owner-tax", () => {
    const kinds = new Map(
      listings
        .filter((l) => v1Monthly(l.id) == null)
        .map((l) => [l.id, getPresentedMonthlyIncome(l.id).unknownKind]),
    );
    expect(kinds.size).toBe(15);
    expect(
      listings
        .filter((l) => getFinancialModelV1(l.id)?.currency === "EUR")
        .map((l) => kinds.get(l.id)),
    ).toEqual(["eur_mixed_currency", "eur_mixed_currency", "eur_mixed_currency", "eur_mixed_currency", "eur_mixed_currency"]);
    for (const l of listings) {
      if (v1Monthly(l.id) == null && getFinancialModelV1(l.id)?.currency !== "EUR") {
        expect(kinds.get(l.id), l.id).toBe("unknown_owner_tax");
      } else if (v1Monthly(l.id) != null) {
        expect(getPresentedMonthlyIncome(l.id).unknownKind, l.id).toBeNull();
      }
    }
  });

  it("every unknown villa carries the engine's stated reason (surfaced on the Income tab)", () => {
    for (const l of listings.filter((x) => v1Monthly(x.id) == null)) {
      expect(getFinancialModelV1(l.id)?.perShare.unknownReason, l.id).toBeTruthy();
    }
  });

  it("short human-readable captions exist for both unknown kinds (never blank)", () => {
    expect(presentedIncomeUnknownCaption("eur_mixed_currency")).toMatch(/EUR/);
    expect(presentedIncomeUnknownCaption("unknown_owner_tax")).toMatch(/tax/i);
    expect(presentedIncomeUnknownCaption(null)).toBeNull();
  });
});

describe("property presentation — card/detail parity for all 24 villas", () => {
  it("card income equals the presented (V1) income figure-or-pending for every villa", () => {
    for (const l of listings) {
      const card = toMarketplaceEstate(l);
      expect(card.presentedMonthlyIncomeCents, `${l.id} card`).toBe(
        getPresentedMonthlyIncome(l.id).cents,
      );
    }
  });

  it("card price equals the live-book detail price for every villa", () => {
    for (const l of listings) {
      const book = seed.orderBooks.find((b) => b.propertyId === l.id);
      const detailPrice = getCurrentSharePrice(l, { bestAskUsd: book?.bestAskUsd });
      const card = toMarketplaceEstate(l);
      expect(card.currentPriceUsd, `${l.id} card-vs-detail`).toBe(detailPrice);
      expect(getPresentedCurrentPrice(l), `${l.id} presentation`).toBe(detailPrice);
    }
  });
});

describe("property presentation — approved single paths (characterization pins)", () => {
  it("primary share price is $100 for every villa", () => {
    expect(getPresentedPrimaryPrice()).toBe(10_000);
    for (const l of listings) {
      expect(l.sharePriceUsd, l.id).toBe(10_000);
    }
  });

  it("supply is valuation ÷ $100 and progress is sold ÷ total for every villa", () => {
    for (const l of listings) {
      expect(l.totalShares, `${l.id} supply`).toBe(l.totalValueUsd / 10_000);
      expect(l.fundingProgressRatio, `${l.id} progress`).toBeCloseTo(
        l.totalShares > 0 ? l.sharesSold / l.totalShares : 0,
        12,
      );
      expect(l.sharesRemaining, `${l.id} remaining`).toBe(
        Math.max(0, l.totalShares - l.sharesSold),
      );
    }
  });
});
