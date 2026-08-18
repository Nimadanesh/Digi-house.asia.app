import { describe, expect, it } from "vitest";
import {
  generateRecoveryCode,
  isValidRecoveryCodeFormat,
  normalizeRecoveryCode,
} from "./recovery-code.js";

describe("recovery-code", () => {
  it("generates unique-looking DH-XXXX-XXXX codes", () => {
    const a = generateRecoveryCode();
    const b = generateRecoveryCode();
    expect(isValidRecoveryCodeFormat(a)).toBe(true);
    expect(isValidRecoveryCodeFormat(b)).toBe(true);
    expect(a).not.toBe(b);
  });

  it("normalizes spacing and case", () => {
    expect(normalizeRecoveryCode(" dh-ab12-cd34 ")).toBe("DH-AB12-CD34");
  });

  it("rejects invalid formats", () => {
    expect(isValidRecoveryCodeFormat("ABC")).toBe(false);
    expect(isValidRecoveryCodeFormat("DH-AB")).toBe(false);
    expect(isValidRecoveryCodeFormat("DH-ABCD-EFGH")).toBe(true);
    expect(isValidRecoveryCodeFormat("DH-A1B2-C3D4")).toBe(true); // hex backfill ok
  });
});
