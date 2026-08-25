import { describe, expect, it } from "vitest";
import { toPropertyInsert } from "./map-property.js";
import {
  loadManifest,
  loadManifestSeedProperties,
  manifestToSeedProperty,
  validateManifest,
} from "./manifest-data.js";

describe("manifest seed source (A3)", () => {
  const seeds = loadManifestSeedProperties();
  const manifest = loadManifest();

  it("loads exactly the 24 contract properties with unique ids", () => {
    expect(seeds).toHaveLength(24);
    expect(new Set(seeds.map((p) => p.id)).size).toBe(24);
  });

  it("preserves the propertyId / pricePerShare / totalShares contract", () => {
    const byId = new Map(seeds.map((p) => [p.id, p]));
    for (const m of manifest) {
      expect(byId.get(m.id)).toMatchObject({
        sharePriceUsd: m.pricePerShare * 100,
        totalShares: m.totalShares,
      });
    }
    // Spot checks against portfolio-manifest.json.
    expect(byId.get("bali-villa-seminyak-002")).toMatchObject({
      sharePriceUsd: 8200,
      totalShares: 10000,
    });
    expect(byId.get("dubai-villa-aurora-001")).toMatchObject({
      sharePriceUsd: 42000,
      totalShares: 10000,
    });
  });

  it("covers all marketplace statuses and non-negative sold counts", () => {
    const statuses = new Set(seeds.map((p) => p.status));
    expect(statuses).toEqual(new Set(["funding", "funded", "resale"]));
    for (const p of seeds) {
      expect(p.sharesSold).toBeGreaterThanOrEqual(0);
      expect(p.sharesSold).toBeLessThanOrEqual(p.totalShares);
    }
  });

  it("maps every manifest entry into a valid property insert row", () => {
    for (const s of seeds) {
      const row = toPropertyInsert(s);
      expect(row.id).toBe(s.id);
      expect(row.sharePriceUsd).toBeGreaterThan(0);
      expect(row.monthlyYieldRate).toMatch(/^\d\.\d{2}$/);
    }
  });

  it("mapping is pure for identical inputs (idempotent reseed)", () => {
    const now = new Date("2026-08-24T00:00:00Z");
    const m = manifest[0]!;
    expect(manifestToSeedProperty(m, 0, now)).toEqual(manifestToSeedProperty(m, 0, now));
  });

  it("rejects a broken manifest", () => {
    expect(() =>
      validateManifest([
        {
          id: "x",
          title: "X",
          destination: "Y",
          area: "Z",
          pricePerShare: 100,
          totalShares: 10,
          valuationUsd: 1000,
          projectedNetYield: 5,
          avgNightlyRate: 100,
          occupancyRate: 50,
          propertyType: "Villa",
          gallery: ["/a.webp"],
          legal: { ownershipStructure: "SPV" },
        },
      ]),
    ).toThrow(/exactly 24/);
  });
});
