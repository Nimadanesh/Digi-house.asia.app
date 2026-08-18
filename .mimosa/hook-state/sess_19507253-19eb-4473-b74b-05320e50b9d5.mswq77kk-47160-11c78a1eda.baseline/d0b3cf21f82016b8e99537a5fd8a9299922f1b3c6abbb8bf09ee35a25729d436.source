import { describe, expect, it } from "vitest";
import { DEFAULT_FEE_TIERS } from "./fee-tier-store.js";
import { resolveFee, SELL_INSTANT_BPS } from "./resolve-fee.js";

const T = DEFAULT_FEE_TIERS;

describe("resolveFee — tier selection (inclusive bounds)", () => {
  it("picks the 80–500$ tier at both boundaries", () => {
    expect(resolveFee(T, 8_000, "buy_primary")?.tierId).toBe(1);
    expect(resolveFee(T, 50_000, "buy_primary")?.tierId).toBe(1);
  });

  it("moves to the next tier above the boundary", () => {
    expect(resolveFee(T, 50_001, "buy_primary")?.tierId).toBe(2);
    expect(resolveFee(T, 200_000, "buy_primary")?.tierId).toBe(2);
    expect(resolveFee(T, 200_001, "buy_primary")?.tierId).toBe(3);
  });

  it("matches the unbounded top tier at and above 10,000,000$", () => {
    expect(resolveFee(T, 1_000_000_000, "buy_primary")?.tierId).toBe(9);
    expect(resolveFee(T, 99_999_999_999, "buy_primary")?.tierId).toBe(9);
  });

  it("returns null below the 80$ floor", () => {
    expect(resolveFee(T, 7_999, "buy_primary")).toBeNull();
    expect(resolveFee(T, 0, "buy_secondary")).toBeNull();
    expect(resolveFee(T, -5, "sell_secondary")).toBeNull();
  });

  it("returns null on non-integer cents", () => {
    expect(resolveFee(T, 100.5, "buy_primary")).toBeNull();
  });
});

describe("resolveFee — per-op rates", () => {
  it("buy_primary: 3% in tier 1, 0.01% in tier 9", () => {
    expect(resolveFee(T, 10_000, "buy_primary")).toMatchObject({
      bps: 300,
      feeUsd: 300,
      totalUsd: 10_300,
      netUsd: 9_700,
    });
    // 10,000,000$ = 1_000_000_000 cents → 1 bp → 100,000 cents = 1,000$
    expect(resolveFee(T, 1_000_000_000, "buy_primary")).toMatchObject({
      bps: 1,
      feeUsd: 100_000,
    });
  });

  it("buy_secondary and sell_secondary share the tier rate", () => {
    expect(resolveFee(T, 10_000, "buy_secondary")?.bps).toBe(90);
    expect(resolveFee(T, 10_000, "sell_secondary")?.bps).toBe(90);
    expect(resolveFee(T, 10_000, "sell_secondary")).toMatchObject({
      netUsd: 9_910,
      totalUsd: 10_090,
    });
  });
});

describe("resolveFee — instant sell is flat 7%", () => {
  it("ignores tiers entirely", () => {
    const small = resolveFee(T, 10_000, "sell_instant");
    const huge = resolveFee(T, 2_000_000_000, "sell_instant");
    expect(small).toMatchObject({
      tierId: null,
      bps: SELL_INSTANT_BPS,
      feeUsd: 700,
      netUsd: 9_300,
    });
    expect(huge?.bps).toBe(SELL_INSTANT_BPS);
  });

  it("applies even below the 80$ tier floor", () => {
    const tiny = resolveFee(T, 1_000, "sell_instant");
    expect(tiny).toMatchObject({ bps: 700, feeUsd: 70, netUsd: 930 });
  });
});

describe("resolveFee — rounding", () => {
  it("floors sub-cent fees", () => {
    // tier 9 buy_secondary: 10 bps on 1,000,000,019 cents → 1,000,000.19 → 1,000,000
    const q = resolveFee(T, 1_000_000_019, "buy_secondary");
    expect(q?.feeUsd).toBe(1_000_000);
  });
});
