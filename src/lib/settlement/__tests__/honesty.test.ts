import { describe, it, expect } from "vitest";
import {
  isRealTxHash,
  buildExplorerTxUrl,
  canShowExplorerLink,
  shouldShowSimulatedBadge,
} from "@/lib/settlement/honesty";

describe("honesty gates (ADR-001 §4)", () => {
  describe("isRealTxHash", () => {
    it("returns false for undefined", () => {
      expect(isRealTxHash(undefined)).toBe(false);
    });

    it("returns false for null", () => {
      expect(isRealTxHash(null)).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isRealTxHash("")).toBe(false);
    });

    it("returns false for simulated: prefix hash", () => {
      expect(isRealTxHash("simulated:abc-123")).toBe(false);
    });

    it("returns true for a real tx hash", () => {
      expect(isRealTxHash("a1b2c3d4e5f678901234567890abcdef")).toBe(true);
    });

    it("returns true for a real hash that happens to contain 'simulated'", () => {
      expect(isRealTxHash("simulated-real-tx-hash")).toBe(true);
    });
  });

  describe("buildExplorerTxUrl", () => {
    it("returns null for simulated: hash", () => {
      expect(buildExplorerTxUrl("simulated:xyz", "testnet")).toBeNull();
    });

    it("returns testnet Tonviewer URL for real hash on testnet", () => {
      const hash = "a1b2c3d4e5f678901234567890abcdef";
      expect(buildExplorerTxUrl(hash, "testnet")).toBe(
        `https://testnet.tonviewer.com/transaction/${hash}`,
      );
    });

    it("returns mainnet Tonviewer URL for real hash on mainnet", () => {
      const hash = "a1b2c3d4e5f678901234567890abcdef";
      expect(buildExplorerTxUrl(hash, "mainnet")).toBe(
        `https://tonviewer.com/transaction/${hash}`,
      );
    });
  });

  describe("canShowExplorerLink", () => {
    it("returns false for undefined", () => {
      expect(canShowExplorerLink(undefined, "testnet")).toBe(false);
    });

    it("returns false for simulated: hash", () => {
      expect(canShowExplorerLink("simulated:abc", "testnet")).toBe(false);
    });

    it("returns true for real hash on testnet", () => {
      expect(canShowExplorerLink("realhash123", "testnet")).toBe(true);
    });
  });

  describe("shouldShowSimulatedBadge", () => {
    const testnet: Parameters<typeof shouldShowSimulatedBadge>[2] = "testnet";

    it("returns false for pending entry (no badge needed)", () => {
      expect(shouldShowSimulatedBadge(undefined, "pending", testnet)).toBe(false);
    });

    it("returns false for pending with a txHash (weird edge)", () => {
      expect(shouldShowSimulatedBadge("simulated:x", "pending", testnet)).toBe(false);
    });

    it("returns true for paid with simulated: hash", () => {
      expect(shouldShowSimulatedBadge("simulated:abc", "paid", testnet)).toBe(true);
    });

    it("returns true for paid with undefined hash", () => {
      expect(shouldShowSimulatedBadge(undefined, "paid", testnet)).toBe(true);
    });

    it("returns false for paid with real hash (no badge needed)", () => {
      expect(shouldShowSimulatedBadge("realhash123", "paid", testnet)).toBe(false);
    });
  });
});
