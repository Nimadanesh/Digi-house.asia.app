import { describe, expect, it } from "vitest";
import {
  cellDelayMs,
  maxRadialDelayMs,
  radialDelayMs,
} from "@/lib/flipwave/flipwave-math";

describe("radialDelayMs", () => {
  it("is 0 at the grid center and grows outward", () => {
    expect(radialDelayMs(10, 6)).toBe(0);
    const near = radialDelayMs(10, 7);
    const far = radialDelayMs(0, 6);
    expect(far).toBeGreaterThan(near);
  });

  it("keeps the biggest delay inside ~700ms so the wave feels alive", () => {
    expect(maxRadialDelayMs()).toBeGreaterThanOrEqual(600);
    expect(maxRadialDelayMs()).toBeLessThanOrEqual(700);
  });
});

describe("cellDelayMs", () => {
  it("'house' uses the radial ripple", () => {
    expect(cellDelayMs(10, 6, "house")).toBe(0);
    expect(cellDelayMs(0, 6, "house")).toBe(radialDelayMs(0, 6));
    // Symmetric pairs about the centre column share a delay.
    expect(cellDelayMs(8, 6, "house")).toBe(cellDelayMs(12, 6, "house"));
    expect(cellDelayMs(6, 4, "house")).toBe(cellDelayMs(14, 8, "house"));
  });

  it("'bars' and 'dollar' ripple bottom→top (bottom row starts first)", () => {
    for (const variant of ["bars", "dollar"] as const) {
      expect(cellDelayMs(0, 12, variant)).toBe(0);
      expect(cellDelayMs(0, 0, variant)).toBeGreaterThan(cellDelayMs(0, 6, variant));
      expect(cellDelayMs(0, 6, variant)).toBeGreaterThan(cellDelayMs(0, 12, variant));
    }
  });

  it("'dollar' launches faster than 'bars' accumulates", () => {
    expect(cellDelayMs(0, 0, "dollar")).toBeLessThan(cellDelayMs(0, 0, "bars"));
  });
});
