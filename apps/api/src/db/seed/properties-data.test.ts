import { describe, expect, it } from "vitest";
import { toPropertyInsert } from "./map-property.js";
import { SEED_PROPERTIES } from "./properties-data.js";

describe("property seed data", () => {
  it("has ≥6 listings covering funding, funded, resale", () => {
    expect(SEED_PROPERTIES.length).toBeGreaterThanOrEqual(6);
    const statuses = new Set(SEED_PROPERTIES.map((p) => p.status));
    expect(statuses.has("funding")).toBe(true);
    expect(statuses.has("funded")).toBe(true);
    expect(statuses.has("resale")).toBe(true);
  });

  it("uses integer cents and shares; stable text ids", () => {
    for (const p of SEED_PROPERTIES) {
      expect(p.id.startsWith("prop-")).toBe(true);
      expect(Number.isInteger(p.sharePriceUsd)).toBe(true);
      expect(Number.isInteger(p.annualRentUsd)).toBe(true);
      expect(Number.isInteger(p.totalShares)).toBe(true);
      expect(Number.isInteger(p.sharesSold)).toBe(true);
      expect(p.sharesSold).toBeLessThanOrEqual(p.totalShares);
    }
  });

  it("maps to insert rows with null on-chain addresses", () => {
    const row = toPropertyInsert(SEED_PROPERTIES[0]!);
    expect(row.onchainMaster).toBeNull();
    expect(row.distributionAddress).toBeNull();
    expect(row.createdAt instanceof Date).toBe(true);
  });
});
