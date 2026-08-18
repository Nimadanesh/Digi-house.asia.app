import { describe, expect, it } from "vitest";
import {
  clampDayChangeRatio,
  projectedYieldUsd,
  weeklyRentUsd,
} from "./math.js";

describe("weeklyRentUsd", () => {
  it("floors annual cents / 52", () => {
    expect(weeklyRentUsd(5_200_00)).toBe(100_00);
    expect(weeklyRentUsd(1_040_000)).toBe(Math.floor(1_040_000 / 52));
    expect(weeklyRentUsd(1_300_000)).toBe(Math.floor(1_300_000 / 52));
  });

  it("floors remainder", () => {
    expect(weeklyRentUsd(100)).toBe(1);
    expect(weeklyRentUsd(51)).toBe(0);
  });
});

describe("projectedYieldUsd", () => {
  it("floors weekly * shares / totalShares", () => {
    const weekly = Math.floor(1_040_000 / 52);
    expect(projectedYieldUsd(weekly, 160, 800)).toBe(
      Math.floor((weekly * 160) / 800),
    );
  });

  it("returns 0 when totalShares is 0", () => {
    expect(projectedYieldUsd(10_000, 100, 0)).toBe(0);
  });

  it("returns 0 when shares owned is 0", () => {
    expect(projectedYieldUsd(10_000, 0, 1000)).toBe(0);
  });
});

describe("clampDayChangeRatio", () => {
  it("returns 0 when invested is 0", () => {
    expect(clampDayChangeRatio(0, 0)).toBe(0);
    expect(clampDayChangeRatio(1000, 0)).toBe(0);
  });

  it("applies 0.15 factor and clamps to [-0.05, 0.08]", () => {
    // gain: (110 - 100) / 100 * 0.15 = 0.015
    expect(clampDayChangeRatio(110, 100)).toBeCloseTo(0.015, 10);
    // huge gain would be 0.15 → clamp 0.08
    expect(clampDayChangeRatio(200, 100)).toBe(0.08);
    // huge loss: -0.15 → clamp -0.05
    expect(clampDayChangeRatio(0, 100)).toBe(-0.05);
  });
});
