import { describe, expect, it } from "vitest";
import {
  toNanoSafe,
  fromNanoRound,
  nanoToUsd,
  usdToNanoEstimate,
} from "@/lib/ton/nano";

describe("nanoTON helpers", () => {
  it("toNanoSafe parses decimal TON strings to bigint nanoTON", () => {
    expect(toNanoSafe("0.01")).toBe(10_000_000n);
    expect(toNanoSafe("1")).toBe(1_000_000_000n);
    expect(toNanoSafe("2.5")).toBe(2_500_000_000n);
  });

  it("toNanoSafe returns 0n for garbage / empty", () => {
    expect(toNanoSafe("not a number")).toBe(0n);
    expect(toNanoSafe("")).toBe(0n);
  });

  it("fromNanoRound rounds to 4 decimals by default, preserves exactness", () => {
    expect(fromNanoRound(123_456_789n)).toBe("0.1235");
    expect(fromNanoRound(1_000_000_000n)).toBe("1.0000");
  });

  it("fromNanoRound respects a custom decimal count", () => {
    expect(fromNanoRound(123_456_789n, 2)).toBe("0.12");
  });

  it("nanoToUsd converts nanoTON to USD cents using a price (USD per TON)", () => {
    // 2 TON at $5.00 = $10.00 → 1000 cents
    expect(nanoToUsd(2_000_000_000n, 5)).toBe(1000);
    // zero price → 0
    expect(nanoToUsd(1_000_000_000n, 0)).toBe(0);
  });

  it("usdToNanoEstimate returns bigint nanoTON estimate for USD cents at a price", () => {
    // $10.00 (1000 cents) at $5.00/TON = 2 TON = 2_000_000_000 nano
    expect(usdToNanoEstimate(1000, 5)).toBe(2_000_000_000n);
    expect(usdToNanoEstimate(0, 5)).toBe(0n);
    expect(usdToNanoEstimate(1000, 0)).toBe(0n);
  });
});