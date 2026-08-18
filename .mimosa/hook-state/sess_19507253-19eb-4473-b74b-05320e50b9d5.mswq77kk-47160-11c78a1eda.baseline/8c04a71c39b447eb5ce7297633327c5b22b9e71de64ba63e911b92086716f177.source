import { describe, expect, it } from "vitest";
import {
  isAllowed,
  parseAllowlist,
  LAUNCH_NOT_ALLOWLISTED,
} from "./allowlist.js";

describe("parseAllowlist", () => {
  it("returns empty set for undefined", () => {
    const s = parseAllowlist(undefined);
    expect(s.size).toBe(0);
  });

  it("returns empty set for empty string", () => {
    const s = parseAllowlist("");
    expect(s.size).toBe(0);
  });

  it("returns empty set for whitespace-only", () => {
    const s = parseAllowlist("  , , ");
    expect(s.size).toBe(0);
  });

  it("parses single address", () => {
    const s = parseAllowlist("EQD1234abc");
    expect(s.size).toBe(1);
    expect(s.has("eqd1234abc")).toBe(true);
  });

  it("parses multiple comma-separated addresses", () => {
    const s = parseAllowlist("  EQD123 , EQC456  , eqd789  ");
    expect(s.size).toBe(3);
    expect(s.has("eqd123")).toBe(true);
    expect(s.has("eqc456")).toBe(true);
    expect(s.has("eqd789")).toBe(true);
  });

  it("normalizes to lowercase", () => {
    const s = parseAllowlist("EQC000000000000000000000000000000000000000000000");
    expect(s.has("eqc000000000000000000000000000000000000000000000")).toBe(true);
    expect(s.has("EQC000000000000000000000000000000000000000000000")).toBe(false);
  });
});

describe("isAllowed", () => {
  const allowlist = new Set(["eqd123", "eqc456"]);

  it("open mode returns true regardless", () => {
    expect(isAllowed("", allowlist, "open")).toBe(true);
    expect(isAllowed("eqd123", allowlist, "open")).toBe(true);
    expect(isAllowed("unknown", allowlist, "open")).toBe(true);
  });

  it("allowlist mode: address in set returns true", () => {
    expect(isAllowed("eqd123", allowlist, "allowlist")).toBe(true);
    expect(isAllowed("EQC456", allowlist, "allowlist")).toBe(true);
  });

  it("allowlist mode: address not in set returns false", () => {
    expect(isAllowed("unknown", allowlist, "allowlist")).toBe(false);
  });

  it("empty string returns false in allowlist mode", () => {
    expect(isAllowed("", allowlist, "allowlist")).toBe(false);
  });

  it("empty allowlist + allowlist mode denies everything (fail closed)", () => {
    const empty = new Set<string>();
    expect(isAllowed("eqd123", empty, "allowlist")).toBe(false);
    expect(isAllowed("anyone", empty, "allowlist")).toBe(false);
    expect(isAllowed("", empty, "allowlist")).toBe(false);
  });

  it("case insensitive matching", () => {
    expect(isAllowed("EQD123", allowlist, "allowlist")).toBe(true);
    expect(isAllowed("eqc456", allowlist, "allowlist")).toBe(true);
  });

  it("whitespace trimmed around input", () => {
    expect(isAllowed("  eqd123  ", allowlist, "allowlist")).toBe(true);
  });
});

describe("LAUNCH_NOT_ALLOWLISTED constant", () => {
  it("equals expected error code string", () => {
    expect(LAUNCH_NOT_ALLOWLISTED).toBe("launch_not_allowlisted");
  });
});
