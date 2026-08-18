import { describe, expect, it } from "vitest";
import {
  DISC_COUNT,
  GRID_COLS,
  GRID_ROWS,
  HOUSE_MASK,
  isInHouse,
} from "@/lib/flipwave/house-mask";

describe("house-mask", () => {
  it("is 21×13 and matches DISC_COUNT", () => {
    expect(GRID_COLS).toBe(21);
    expect(GRID_ROWS).toBe(13);
    expect(HOUSE_MASK.length).toBe(GRID_ROWS);
    for (const row of HOUSE_MASK) {
      expect(row.length).toBe(GRID_COLS);
    }
    expect(DISC_COUNT).toBe(21 * 13);
  });

  it("has a roof peak, body and a door gap", () => {
    // Roof peak: center column of row 0 is inside.
    expect(isInHouse(10, 0)).toBe(true);
    // Body: near a body edge on the lower half is inside.
    expect(isInHouse(3, 12)).toBe(true);
    // Door: center-bottom is a 3-wide gap.
    expect(isInHouse(9, 10)).toBe(false);
    expect(isInHouse(10, 10)).toBe(false);
    expect(isInHouse(11, 10)).toBe(false);
    // Just beside the door is still house.
    expect(isInHouse(8, 10)).toBe(true);
    expect(isInHouse(12, 10)).toBe(true);
  });

  it("guards out-of-range lookups", () => {
    expect(isInHouse(-1, 0)).toBe(false);
    expect(isInHouse(0, -1)).toBe(false);
    expect(isInHouse(GRID_COLS, 0)).toBe(false);
    expect(isInHouse(0, GRID_ROWS)).toBe(false);
  });
});
