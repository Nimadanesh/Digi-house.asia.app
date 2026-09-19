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
  v1ScenarioPerShareCents,
} from "@/lib/economics/property-presentation";

const listings = PROPERTIES.map(toCanonicalListing);

// The presented figure is the BASE scenario per-share monthly (PO decision
// 2026-09-13: the presented Monthly Income must equal the Base scenario card).
function v1Monthly(id: string): number | null {
  const v1 = getFinancialModelV1(id);
  if (!v1) return null;
  return v1ScenarioPerShareCents(v1.base, v1.totalShares).monthlyCents;
}

describe("property presentation — single monthly-income path (V1)", () => {
  it("presents the V1 per-share monthly figure for a computable villa (Grand)", () => {
    expect(getPresentedMonthlyIncome("re-128862")).toEqual({
      cents: 1625,
      currency: "USD",
      unknownKind: null,
    });
  });

  it("returns no pending villa — Option 1 FX converts all 5 EUR villas to USD (0 unknown)", () => {
    const unknown = listings.filter((l) => v1Monthly(l.id) == null);
    // Option 1 product decision (APPROVED_EUR_USD_RATE = 1.20): the former 5 EUR
    // mixed-currency villas now evaluate the full chain in USD. Zero pending.
    expect(unknown).toHaveLength(0);
  });

  it("presents income for all 24 V1-computable villas, matching V1", () => {
    const known = listings.filter((l) => v1Monthly(l.id) != null);
    expect(known).toHaveLength(24);
    for (const l of known) {
      expect(getPresentedMonthlyIncome(l.id).cents, l.id).toBe(v1Monthly(l.id));
    }
  });

  it("scales position income as shares × per-share (EUR villas now compute in USD)", () => {
    expect(presentPositionMonthlyIncome("re-128862", 10)).toBe(16_250);
    expect(presentPositionMonthlyIncome("re-128862", 1)).toBe(1625);
    // Villa du Cap (former EUR mixed-currency) now converts via the approved
    // 1.20 rate — no longer unknown.
    expect(presentPositionMonthlyIncome("re-123861", 10)).not.toBeNull();
    expect(presentPositionMonthlyIncome("re-123861", 10)).toBe(
      (getPresentedMonthlyIncome("re-123861").cents ?? 0) * 10,
    );
  });
});

describe("property presentation — unknown reasons (Slice 3, Option 1 FX)", () => {
  it("no villa is unknown: all 24 present USD income with null unknownKind", () => {
    const kinds = new Map(
      listings
        .filter((l) => v1Monthly(l.id) == null)
        .map((l) => [l.id, getPresentedMonthlyIncome(l.id).unknownKind]),
    );
    expect(kinds.size).toBe(0);
    for (const l of listings) {
      expect(v1Monthly(l.id), l.id).not.toBeNull();
      expect(getPresentedMonthlyIncome(l.id).unknownKind, l.id).toBeNull();
      expect(getPresentedMonthlyIncome(l.id).currency, l.id).toBe("USD");
    }
  });

  it("every villa carries a known per-share figure (no unknownReason)", () => {
    for (const l of listings) {
      expect(getFinancialModelV1(l.id)?.perShare.unknownReason, l.id).toBeNull();
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
