import { describe, expect, it } from "vitest";
import { Address } from "@ton/core";
import {
  parseAddress,
  isValidAddress,
  toUserFriendly,
  toRaw,
  shortAddress,
  addressKind,
} from "@/lib/ton/address";

// Deterministic valid fixture: workchain 0, all-zero hash — parses cleanly, no live wallet needed.
const RAW_ZERO = "0:0000000000000000000000000000000000000000000000000000000000000000";
const FIXTURE_ADDR = Address.parseRaw(RAW_ZERO);
const BNC = FIXTURE_ADDR.toString({ bounceable: true, urlSafe: true, testOnly: false });
const NON_BNC = FIXTURE_ADDR.toString({ bounceable: false, urlSafe: true, testOnly: false });

describe("address utils", () => {
  it("isValidAddress rejects garbage and empty, accepts a raw address", () => {
    expect(isValidAddress("not an address")).toBe(false);
    expect(isValidAddress("")).toBe(false);
    expect(isValidAddress(RAW_ZERO)).toBe(true);
  });

  it("parseAddress returns an Address with workchain 0 for the raw fixture, null for garbage", () => {
    const a = parseAddress(RAW_ZERO);
    expect(a).not.toBeNull();
    expect(a?.workChain).toBe(0);
    expect(parseAddress("garbage")).toBeNull();
  });

  it("toUserFriendly emits a bounceable url-safe string by default", () => {
    const u = toUserFriendly(RAW_ZERO);
    expect(u.startsWith("E")).toBe(true); // bounceable urlSafe mainnet prefix
    expect(u.length).toBeGreaterThan(0);
  });

  it("toRaw round-trips a friendly address back to raw form", () => {
    expect(toRaw(BNC)).toBe(RAW_ZERO);
  });

  it("shortAddress truncates long addresses to prefix…suffix and preserves short ones", () => {
    const short = shortAddress(BNC);
    expect(short.length).toBeLessThan(BNC.length);
    expect(short).toContain("…");
    expect(shortAddress("EQAB")).toBe("EQAB"); // shorter than prefix+suffix+1 → unchanged
  });

  it("addressKind classifies bounceable vs non-bounceable vs invalid", () => {
    expect(addressKind("garbage")).toBe("invalid");
    expect(addressKind(BNC)).toBe("bounceable");
    expect(addressKind(NON_BNC)).toBe("nonBounceable");
  });
});