// Final PO Decisions 1–2: one canonical share-supply system.
// Total shares = valuation ÷ $100; $100 base/share (primary offering).
import { describe, it, expect } from "vitest";
import {
  CANONICAL_BASE_PRICE_USD,
  getCanonicalOffering,
} from "@/lib/economics/canonical-offering";

describe("canonical offering (Final PO Decisions 1–2)", () => {
  it("prices the $100 base per share", () => {
    expect(CANONICAL_BASE_PRICE_USD).toBe(10_000);
  });

  it("Grand: $8,000,000 → 80,000 shares at $100", () => {
    const offering = getCanonicalOffering("re-128862");
    expect(offering).not.toBeNull();
    expect(offering!.valuationCents).toBe(800_000_000);
    expect(offering!.totalShares).toBe(80_000);
    expect(offering!.basePriceUsd).toBe(10_000);
    expect(offering!.provenance).toBe("estimated");
  });

  it("covers all 24 canonical properties with valuation ÷ $100 supply", () => {
    const ids = [
      "re-128862", "re-126855", "re-108924",
      "re-123861", "re-125643", "re-130393",
      "re-130901", "re-131293", "re-128529",
      "re-123320", "re-109098", "re-127825",
      "re-122422", "re-129548", "re-122903",
      "re-126870", "re-130397", "re-127483",
      "re-108856", "re-108860", "re-106441",
      "re-129549", "re-123919", "re-122113",
    ];
    for (const id of ids) {
      const offering = getCanonicalOffering(id);
      expect(offering, id).not.toBeNull();
      expect(offering!.totalShares, id).toBe(offering!.valuationCents / 10_000);
      expect(offering!.basePriceUsd, id).toBe(10_000);
    }
  });

  it("returns null for unknown ids (honest fallback, never fixture supply)", () => {
    expect(getCanonicalOffering("test-unknown")).toBeNull();
  });
});
