import { describe, expect, it } from "vitest";
import { GRID_COLS, GRID_ROWS } from "@/lib/flipwave/house-mask";
import { BARS_MASK, DOLLAR_MASK } from "@/lib/flipwave/slide-masks";

function lit(mask: readonly (readonly number[])[], col: number, row: number): boolean {
  return mask[row]?.[col] === 1;
}

describe("slide-masks", () => {
  it("are 21×13 like the loader grid", () => {
    for (const mask of [BARS_MASK, DOLLAR_MASK]) {
      expect(mask.length).toBe(GRID_ROWS);
      for (const row of mask) expect(row.length).toBe(GRID_COLS);
    }
  });

  it("BARS_MASK is a rising bar chart (taller bars toward the right)", () => {
    // Shortest bar: cols 6-7, only in the bottom rows.
    expect(lit(BARS_MASK, 6, 12)).toBe(true);
    expect(lit(BARS_MASK, 7, 8)).toBe(true);
    expect(lit(BARS_MASK, 7, 7)).toBe(false);
    // Tallest bar: cols 14-15 reach higher.
    expect(lit(BARS_MASK, 14, 4)).toBe(true);
    expect(lit(BARS_MASK, 14, 3)).toBe(false);
    // Empty gutter between bars.
    expect(lit(BARS_MASK, 8, 12)).toBe(false);
    expect(lit(BARS_MASK, 12, 12)).toBe(false);
  });

  it("DOLLAR_MASK is a clear dollar sign (S + vertical stem poking out top & bottom)", () => {
    // Stem pokes above the S top bar.
    expect(lit(DOLLAR_MASK, 10, 1)).toBe(true);
    expect(lit(DOLLAR_MASK, 10, 0)).toBe(false);
    // S top bar.
    expect(lit(DOLLAR_MASK, 7, 2)).toBe(true);
    expect(lit(DOLLAR_MASK, 13, 2)).toBe(true);
    expect(lit(DOLLAR_MASK, 6, 2)).toBe(false);
    // S left leg (top) + stem through the middle.
    expect(lit(DOLLAR_MASK, 6, 4)).toBe(true);
    expect(lit(DOLLAR_MASK, 7, 4)).toBe(true);
    expect(lit(DOLLAR_MASK, 5, 4)).toBe(false);
    expect(lit(DOLLAR_MASK, 10, 4)).toBe(true);
    // S mid bar.
    expect(lit(DOLLAR_MASK, 7, 6)).toBe(true);
    expect(lit(DOLLAR_MASK, 13, 6)).toBe(true);
    expect(lit(DOLLAR_MASK, 6, 6)).toBe(false);
    // S right leg (bottom) + stem.
    expect(lit(DOLLAR_MASK, 13, 8)).toBe(true);
    expect(lit(DOLLAR_MASK, 14, 8)).toBe(true);
    expect(lit(DOLLAR_MASK, 15, 8)).toBe(false);
    expect(lit(DOLLAR_MASK, 10, 8)).toBe(true);
    expect(lit(DOLLAR_MASK, 11, 8)).toBe(false);
    // S bottom bar.
    expect(lit(DOLLAR_MASK, 7, 10)).toBe(true);
    expect(lit(DOLLAR_MASK, 13, 10)).toBe(true);
    expect(lit(DOLLAR_MASK, 6, 10)).toBe(false);
    // Stem pokes below the S bottom bar.
    expect(lit(DOLLAR_MASK, 10, 11)).toBe(true);
    expect(lit(DOLLAR_MASK, 10, 12)).toBe(false);
  });

  it("keeps the dollar glyph inside the grid frame (empty border row/col)", () => {
    for (let c = 0; c < GRID_COLS; c++) {
      expect(lit(DOLLAR_MASK, c, 0)).toBe(false);
      expect(lit(DOLLAR_MASK, c, GRID_ROWS - 1)).toBe(false);
    }
    for (let r = 0; r < GRID_ROWS; r++) {
      expect(lit(DOLLAR_MASK, 0, r)).toBe(false);
      expect(lit(DOLLAR_MASK, GRID_COLS - 1, r)).toBe(false);
    }
  });
});
