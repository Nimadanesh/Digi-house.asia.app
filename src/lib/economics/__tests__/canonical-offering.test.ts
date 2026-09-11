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
    const offering = getCanonicalOffering("prop-marina-vista-4b");
    expect(offering).not.toBeNull();
    expect(offering!.valuationCents).toBe(800_000_000);
    expect(offering!.totalShares).toBe(80_000);
    expect(offering!.basePriceUsd).toBe(10_000);
    expect(offering!.provenance).toBe("estimated");
  });

  it("covers all 24 canonical properties with valuation ÷ $100 supply", () => {
    const ids = [
      "prop-marina-vista-4b", "prop-soho-loft-studio", "prop-bayside-marina-penthouse",
      "prop-alfama-terrace-flat", "prop-tbilisi-riverhouse-loft", "prop-canggu-surf-villa",
      "prop-tokyo-shibuya-studio", "prop-brooklyn-brownstone-flat", "prop-berlin-mitte-apartment",
      "prop-barcelona-eixample-flat", "prop-london-camden-loft", "prop-sydney-harbour-apartment",
      "prop-toronto-condo", "prop-melbourne-loft", "prop-miami-beach-condo",
      "prop-istanbul-bosphorus-flat", "prop-mexico-city-penthouse", "prop-kyoto-machiya",
      "prop-cape-town-villa", "prop-bangkok-sukhumvit-condo", "prop-amsterdam-canal-house",
      "prop-buenos-aires-recoleta-flat", "prop-seoul-gangnam-studio", "prop-nyc-chelsea-loft",
    ];
    for (const id of ids) {
      const offering = getCanonicalOffering(id);
      expect(offering, id).not.toBeNull();
      expect(offering!.totalShares, id).toBe(offering!.valuationCents / 10_000);
      expect(offering!.basePriceUsd, id).toBe(10_000);
    }
  });

  it("returns null for unknown ids (honest fallback, never fixture supply)", () => {
    expect(getCanonicalOffering("prop-unknown")).toBeNull();
  });
});
