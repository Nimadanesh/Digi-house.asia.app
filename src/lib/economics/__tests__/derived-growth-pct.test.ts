// TDD RED — per-villa derived growth % for ALL 24 villas (replaces the fixed
// D10 3–5% band on display surfaces). Formula: ((upper − current) / current)
// × 100, 1 decimal. Current = approved Current Estimated Value (lowest-valid
// value / band-low, untouched); upper = research estimates range high end.
import { describe, expect, it } from "vitest";
import { PROPERTIES } from "@/lib/mock/seed/properties";
import {
  GRAND_2_BDM_RUNTIME_ID,
  formatGrowthPct,
  getGrowthPotential,
  getValuationDisplay,
} from "../estates/growth-potential";
import { getEstate24ByRuntimeId } from "../estates/estate-24-data";

describe("derived growth % — per-villa (upper − current) / current", () => {
  it("Grand derives +125% from the $18M research upper vs the $8M current", () => {
    expect(getGrowthPotential(GRAND_2_BDM_RUNTIME_ID)!.potentialPct).toBe(125);
    expect(formatGrowthPct(125)).toBe("+125%");
  });

  it("every canonical villa carries a dynamic pct matching its own range", () => {
    expect(PROPERTIES).toHaveLength(24);
    for (const p of PROPERTIES) {
      const g = getGrowthPotential(p.id);
      expect(g, `${p.id} growth resolves`).not.toBeNull();
      expect(g!.potentialPct, `${p.id} pct dynamic`).not.toBeNull();
      // Independent recomputation: approved current display vs dataset range high.
      const display = getValuationDisplay(p.id);
      expect(display?.kind, `${p.id} current single`).toBe("single");
      const current = display != null && display.kind === "single" ? display.value : 0;
      const upper = Math.round(getEstate24ByRuntimeId(p.id)!.estimates.valueRange[1] * 100);
      const expected = Math.round(((upper - current) / current) * 1000) / 10;
      expect(g!.potentialPct, `${p.id} pct derived`).toBe(expected);
      expect(g!.potentialValue, `${p.id} potential is the range upper`).toBe(upper);
    }
  });
});
