// File responsibility: tests for the Slice H sell view-model (calculations,
// validation, listing state machine). Pure — no React, no network.
import { describe, expect, it } from "vitest";
import {
  hasSellIssues,
  previewSellQuote,
  priceGuidance,
  resolveSellListingStatus,
  selectMarketReference,
  validateSellSelection,
} from "@/lib/sell-quote";
import { DEFAULT_FEE_TIERS } from "@/lib/mock/fees";
import type { Order } from "@/types/order";

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "ord-1",
    propertyId: "test-x",
    makerAddress: "EQtest",
    side: "sell",
    priceUsd: 12_000,
    quantity: 10,
    filledQuantity: 0,
    status: "open",
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("previewSellQuote — calculations", () => {
  const base = {
    acquisitionPricePerShareUsd: 10_000, // $100.00 cost
    sharesOwned: 160,
    totalShares: 2_500,
    feeTiers: DEFAULT_FEE_TIERS,
  };

  it("computes gross, cost, gain, remaining shares + ownership", () => {
    // 10 shares @ $120 vs $100 cost → gross $1,200, cost $1,000, gain +$200.
    const q = previewSellQuote({ quantity: 10, pricePerShareUsd: 12_000, ...base });
    expect(q.grossUsd).toBe(120_000);
    expect(q.acquisitionCostUsd).toBe(100_000);
    expect(q.gainLossUsd).toBe(20_000);
    expect(q.direction).toBe("gain");
    expect(q.sharesRemaining).toBe(150);
    expect(q.remainingOwnershipRatio).toBeCloseTo(150 / 2_500, 12);
    expect(q.ownershipSoldRatio).toBeCloseTo(10 / 2_500, 12);
  });

  it("loss when the proposed price is below acquisition", () => {
    const q = previewSellQuote({ quantity: 10, pricePerShareUsd: 9_000, ...base });
    expect(q.gainLossUsd).toBe(-10_000);
    expect(q.direction).toBe("loss");
  });

  it("break-even at the acquisition price", () => {
    const q = previewSellQuote({ quantity: 10, pricePerShareUsd: 10_000, ...base });
    expect(q.gainLossUsd).toBe(0);
    expect(q.direction).toBe("breakEven");
  });

  it("partial sale keeps the remaining position", () => {
    const q = previewSellQuote({ quantity: 60, pricePerShareUsd: 12_000, ...base });
    expect(q.sharesRemaining).toBe(100);
    expect(q.remainingOwnershipRatio).toBeCloseTo(0.04, 12);
  });

  it("full sale leaves zero shares and zero ownership", () => {
    const q = previewSellQuote({ quantity: 160, pricePerShareUsd: 12_000, ...base });
    expect(q.sharesRemaining).toBe(0);
    expect(q.remainingOwnershipRatio).toBe(0);
  });

  it("previews the tiered sell_secondary fee and net proceeds (gross − fee)", () => {
    // 10 × $120 = $1,200 gross → tier 2 (50,000–200,000¢) sell 0.80% → $9.60 fee.
    const q = previewSellQuote({ quantity: 10, pricePerShareUsd: 12_000, ...base });
    expect(q.feeUsd).toBe(960);
    expect(q.feeRateBps).toBe(80);
    expect(q.netProceedsUsd).toBe(120_000 - 960);
  });

  it("unknown fee tier → fee, rate and net stay unknown (never invented)", () => {
    const q = previewSellQuote({
      quantity: 10,
      pricePerShareUsd: 12_000,
      ...base,
      feeTiers: [],
    });
    expect(q.feeUsd).toBeNull();
    expect(q.feeRateBps).toBeNull();
    expect(q.netProceedsUsd).toBeNull();
    // Gross/gain still preview (fee independence).
    expect(q.grossUsd).toBe(120_000);
    expect(q.direction).toBe("gain");
  });

  it("unknown acquisition basis → cost/gain stay unknown (never guessed)", () => {
    const q = previewSellQuote({
      quantity: 10,
      pricePerShareUsd: 12_000,
      ...base,
      acquisitionPricePerShareUsd: null,
    });
    expect(q.acquisitionCostUsd).toBeNull();
    expect(q.gainLossUsd).toBeNull();
    expect(q.direction).toBeNull();
    expect(q.grossUsd).toBe(120_000);
  });

  it("oversell throws (explicit rejection, no silent cap)", () => {
    expect(() =>
      previewSellQuote({ quantity: 161, pricePerShareUsd: 12_000, ...base }),
    ).toThrow(/cannot sell/);
  });
});

describe("validateSellSelection — validation", () => {
  it("valid selection passes", () => {
    const issues = validateSellSelection({ quantity: 5, pricePerShareUsd: 12_000, freeShares: 10 });
    expect(hasSellIssues(issues)).toBe(false);
  });

  it("missing position when nothing is sellable", () => {
    const issues = validateSellSelection({ quantity: 1, pricePerShareUsd: 12_000, freeShares: 0 });
    expect(issues.missingPosition).toBe(true);
    expect(hasSellIssues(issues)).toBe(true);
  });

  it("quantity greater than owned (free) is rejected", () => {
    const issues = validateSellSelection({ quantity: 11, pricePerShareUsd: 12_000, freeShares: 10 });
    expect(issues.exceedsSellable).toBe(true);
    expect(hasSellIssues(issues)).toBe(true);
  });

  it("zero and fractional quantities are invalid", () => {
    expect(validateSellSelection({ quantity: 0, pricePerShareUsd: 12_000, freeShares: 10 }).invalidQuantity).toBe(true);
    expect(validateSellSelection({ quantity: 1.5, pricePerShareUsd: 12_000, freeShares: 10 }).invalidQuantity).toBe(true);
  });

  it("zero price is flagged explicitly (and invalid)", () => {
    const issues = validateSellSelection({ quantity: 1, pricePerShareUsd: 0, freeShares: 10 });
    expect(issues.zeroPrice).toBe(true);
    expect(issues.invalidPrice).toBe(true);
    expect(hasSellIssues(issues)).toBe(true);
  });

  it("negative price is invalid", () => {
    const issues = validateSellSelection({ quantity: 1, pricePerShareUsd: -100, freeShares: 10 });
    expect(issues.invalidPrice).toBe(true);
  });
});

describe("selectMarketReference — sell-side comparison source", () => {
  it("prefers the best offer (live buyer demand)", () => {
    expect(selectMarketReference(11_800, 12_000)).toBe(11_800);
  });

  it("falls back to the last price when no offer exists", () => {
    expect(selectMarketReference(null, 12_000)).toBe(12_000);
    expect(selectMarketReference(undefined, 12_000)).toBe(12_000);
  });

  it("is null when nothing reliable exists (guidance stays silent)", () => {
    expect(selectMarketReference(null, null)).toBeNull();
    expect(selectMarketReference(undefined, undefined)).toBeNull();
  });
});

describe("priceGuidance — ±5% quiet band in integer math", () => {
  const ref = 11_800; // $118.00
  it("flags materially higher prices", () => {
    expect(priceGuidance(13_000, ref)).toBe("above");
  });

  it("flags lower prices", () => {
    expect(priceGuidance(10_000, ref)).toBe("below");
  });

  it("stays quiet inside the band (no rounding-noise warnings)", () => {
    expect(priceGuidance(12_000, ref)).toBeNull();
    expect(priceGuidance(11_800, ref)).toBeNull();
  });

  it("stays quiet without a reference", () => {
    expect(priceGuidance(10_000, null)).toBeNull();
  });
});

describe("resolveSellListingStatus — state machine", () => {
  const bookWithBids = { bids: [{ priceUsd: 11_800, quantity: 5, cumulative: 5 }], bestBidUsd: 11_800 };
  const emptyBook = { bids: [], bestBidUsd: undefined as unknown as number };

  it("queued while the primary offering is open", () => {
    expect(resolveSellListingStatus(order({ status: "queued" }), bookWithBids)).toBe("queued");
  });

  it("active when live with buyer demand and no fill yet", () => {
    expect(resolveSellListingStatus(order({ status: "open" }), bookWithBids)).toBe("active");
  });

  it("pending liquidity when the book is unknown (never claim no-buyer)", () => {
    expect(resolveSellListingStatus(order({ status: "open" }), null)).toBe("pendingLiquidity");
    expect(resolveSellListingStatus(order({ status: "open" }), undefined)).toBe("pendingLiquidity");
  });

  it("no liquidity when the live book has no bids", () => {
    expect(resolveSellListingStatus(order({ status: "open" }), emptyBook)).toBe("noLiquidity");
  });

  it("partial fill is distinct from filled", () => {
    expect(
      resolveSellListingStatus(order({ status: "open", filledQuantity: 4 }), bookWithBids),
    ).toBe("partiallyFilled");
  });

  it("filled only on full execution (status or quantity)", () => {
    expect(resolveSellListingStatus(order({ status: "filled" }), bookWithBids)).toBe("filled");
    expect(
      resolveSellListingStatus(order({ status: "open", quantity: 10, filledQuantity: 10 }), bookWithBids),
    ).toBe("filled");
  });

  it("cancelled stays cancelled", () => {
    expect(resolveSellListingStatus(order({ status: "cancelled" }), bookWithBids)).toBe("cancelled");
  });

  it("active (open, unmatched) is never reported as sold", () => {
    const s = resolveSellListingStatus(order({ status: "open" }), bookWithBids);
    expect(s).not.toBe("filled");
  });
});
