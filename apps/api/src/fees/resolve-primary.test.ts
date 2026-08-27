import { describe, expect, it } from "vitest";
import { DEFAULT_FEE_TIERS } from "./fee-tier-store.js";
import { resolvePrimaryCommission } from "./resolve-primary.js";

describe("resolvePrimaryCommission — tier fallback (no Commission Card)", () => {
  it("applies the buy_primary tier rate to the principal", () => {
    // $400 principal → tier 1 (300 bps) → $12 fee, $412 payable.
    const r = resolvePrimaryCommission({
      propertyCardBps: null,
      tiers: DEFAULT_FEE_TIERS,
      principalUsd: 40_000,
    });
    expect(r).toMatchObject({
      bps: 300,
      feeUsd: 1_200,
      principalUsd: 40_000,
      totalPayableUsd: 41_200,
      source: "tier",
    });
  });

  it("3% at the lowest tier, 0.01% at the top tier", () => {
    const low = resolvePrimaryCommission({
      propertyCardBps: null,
      tiers: DEFAULT_FEE_TIERS,
      principalUsd: 8_000, // $80 floor → tier 1
    });
    expect(low?.bps).toBe(300);
    expect(low?.feeUsd).toBe(240);

    const high = resolvePrimaryCommission({
      propertyCardBps: null,
      tiers: DEFAULT_FEE_TIERS,
      principalUsd: 1_000_000_000, // ≥ $10M → tier 9
    });
    expect(high?.bps).toBe(1);
    expect(high?.feeUsd).toBe(100_000);
  });

  it("floor-rounds the fee in cents", () => {
    // $123.45 → 12_345¢ × 300/10_000 = 370.35 → floor 370.
    const r = resolvePrimaryCommission({
      propertyCardBps: null,
      tiers: DEFAULT_FEE_TIERS,
      principalUsd: 12_345,
    });
    expect(r?.feeUsd).toBe(370);
    expect(r?.totalPayableUsd).toBe(12_715);
  });

  it("returns null when no tier covers the amount (never charges $0 silently)", () => {
    const r = resolvePrimaryCommission({
      propertyCardBps: null,
      tiers: DEFAULT_FEE_TIERS,
      principalUsd: 7_999, // below the $80 floor
    });
    expect(r).toBeNull();
  });
});

describe("resolvePrimaryCommission — Commission Card override", () => {
  it("the card rate wins over the tier table", () => {
    // Card says 250 bps; the tier table would say 300 at this amount.
    const r = resolvePrimaryCommission({
      propertyCardBps: 250,
      tiers: DEFAULT_FEE_TIERS,
      principalUsd: 40_000,
    });
    expect(r).toMatchObject({
      bps: 250,
      feeUsd: 1_000,
      totalPayableUsd: 41_000,
      source: "card",
    });
  });

  it("a 0.01% card rate applies even below the tier floor (card has no $80 floor)", () => {
    // $100 principal × 1 bps = 1¢; the tier table would refuse this size, the card does not.
    const r = resolvePrimaryCommission({
      propertyCardBps: 1,
      tiers: DEFAULT_FEE_TIERS,
      principalUsd: 10_000,
    });
    expect(r).toMatchObject({ bps: 1, feeUsd: 1, source: "card" });
  });

  it("a 0 bps card charges no commission", () => {
    const r = resolvePrimaryCommission({
      propertyCardBps: 0,
      tiers: DEFAULT_FEE_TIERS,
      principalUsd: 8_000,
    });
    expect(r).toMatchObject({ bps: 0, feeUsd: 0, totalPayableUsd: 8_000 });
  });
});
