// File responsibility: tests for the canonical fee-tier lookup shared by UI
// previews (the tier table itself is the model; the server stays authoritative).
import { describe, expect, it } from "vitest";
import { findFeeTier } from "@/types/fees";
import { DEFAULT_FEE_TIERS } from "@/lib/mock/fees";

describe("findFeeTier", () => {
  it("finds the tier covering the amount (inclusive bounds)", () => {
    expect(findFeeTier(DEFAULT_FEE_TIERS, 8_000)?.id).toBe(1);
    expect(findFeeTier(DEFAULT_FEE_TIERS, 50_000)?.id).toBe(1);
    expect(findFeeTier(DEFAULT_FEE_TIERS, 50_001)?.id).toBe(2);
    expect(findFeeTier(DEFAULT_FEE_TIERS, 1_000_000_000)?.id).toBe(9);
  });

  it("returns null when no tier covers the amount (never invented)", () => {
    expect(findFeeTier(DEFAULT_FEE_TIERS, 0)).toBeNull();
    expect(findFeeTier(DEFAULT_FEE_TIERS, 7_999)).toBeNull();
    expect(findFeeTier([], 12_000)).toBeNull();
  });
});
