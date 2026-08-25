/**
 * Portfolio manifest seed source — the 24 FractionalLuxe properties exported
 * from the marketing site (repo-root portfolio-manifest.json).
 *
 * The propertyId contract: manifest `id` values are shared with the site.
 * Never rename, never invent new ids.
 *
 * Mapping decisions (A3, logged for founder review):
 * - id → properties.id (1:1 contract)
 * - pricePerShare (USD) → sharePriceUsd (cents, ×100)
 * - valuationUsd (USD) → totalValueUsd (cents, ×100)
 * - destination + area → location ("{area}, {destination}")
 * - gallery → images (1:1)
 * - title → title (1:1)
 * - status — not in manifest; deterministic by manifest index:
 *     i % 3 === 0 → "funding", 1 → "funded", 2 → "resale"
 * - sharesSold — deterministic per status (funding 40%, funded 100%, resale 60%)
 * - annualRentUsd = round(valuationUsd × projectedNetYield / 100) in cents
 * - description — app-only default, generated from manifest fields
 * - meta defaults for app-only fields (sizeSqm 0, yearBuilt 2020, rented);
 *   manifest projections carried verbatim in optional meta fields
 * - monthlyYieldRate — derived from default yearBuilt via the existing
 *   quality-driven rule in map-property.ts (stays within the 4.50–7.50 check)
 * - rentalHistory — empty (no fabricated rent payments)
 * - ownerWalletAddress — single dev placeholder (no wallet data in manifest)
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PropertyMetaJson } from "../schema/properties.js";
import type { SeedProperty } from "./properties-data.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type ManifestProperty = {
  id: string;
  title: string;
  destination: string;
  area: string;
  pricePerShare: number;
  totalShares: number;
  valuationUsd: number;
  projectedNetYield: number;
  avgNightlyRate: number;
  occupancyRate: number;
  propertyType: string;
  gallery: string[];
  legal: {
    ownershipStructure: string;
    leaseholdYears?: number;
  };
};

export const MANIFEST_DEV_OWNER_WALLET =
  "EQARULx2r6JmOuMoQn7jVr8m9Rrjv0s4kq5t8s7q5t8s4kq5";

export function loadManifest(): ManifestProperty[] {  const path = join(__dirname, "../../../../../portfolio-manifest.json");
  if (!existsSync(path)) {
    throw new Error(
      `portfolio-manifest.json not found at repo root (${path}) — cannot seed`,
    );
  }
  return JSON.parse(readFileSync(path, "utf8")) as ManifestProperty[];
}

export function validateManifest(items: ManifestProperty[]): void {
  if (!Array.isArray(items) || items.length !== 24) {
    throw new Error(`Manifest must contain exactly 24 properties, got ${items.length}`);
  }
  const seen = new Set<string>();
  for (const m of items) {
    if (seen.has(m.id)) throw new Error(`Duplicate manifest id: ${m.id}`);
    seen.add(m.id);
    if (!(m.pricePerShare > 0) || !(m.totalShares > 0)) {
      throw new Error(`Invalid price/shares for ${m.id}`);
    }
    if (!Array.isArray(m.gallery) || m.gallery.length === 0) {
      throw new Error(`Missing gallery for ${m.id}`);
    }
    if (!m.legal?.ownershipStructure) {
      throw new Error(`Missing legal.ownershipStructure for ${m.id}`);
    }
  }
}

function statusFor(index: number): SeedProperty["status"] {
  return index % 3 === 0 ? "funding" : index % 3 === 1 ? "funded" : "resale";
}

function sharesSoldFor(status: SeedProperty["status"], totalShares: number): number {
  if (status === "funded") return totalShares;
  const fraction = status === "resale" ? 0.6 : 0.4;
  return Math.floor(totalShares * fraction);
}

function descriptionFor(m: ManifestProperty): string {
  return (
    `${m.propertyType} in ${m.area}, ${m.destination}. ` +
    `${m.legal.ownershipStructure}. Projected net yield ${m.projectedNetYield}% p.a.`
  );
}

function metaFor(m: ManifestProperty): PropertyMetaJson {
  return {
    sizeSqm: 0,
    yearBuilt: 2020,
    propertyType: m.propertyType,
    rentalStatus: "rented",
    leaseUntil: null,
    activeTenant: false,
    tokenizationDocUrl: "#tokenization-demo",
    projectedNetYieldPct: m.projectedNetYield,
    avgNightlyRateUsd: m.avgNightlyRate,
    occupancyRatePct: m.occupancyRate,
    ownershipStructure: m.legal.ownershipStructure,
  };
}

/** Map one manifest entry to the existing SeedProperty shape (pure). */
export function manifestToSeedProperty(
  m: ManifestProperty,
  index: number,
  now = new Date(),
): SeedProperty {
  const status = statusFor(index);
  return {
    id: m.id,
    title: m.title,
    location: `${m.area}, ${m.destination}`,
    description: descriptionFor(m),
    images: [...m.gallery],
    totalShares: m.totalShares,
    sharePriceUsd: m.pricePerShare * 100,
    status,
    ownerWalletAddress: MANIFEST_DEV_OWNER_WALLET,
    annualRentUsd: Math.round((m.valuationUsd * m.projectedNetYield) / 100) * 100,
    totalValueUsd: m.valuationUsd * 100,
    sharesSold: sharesSoldFor(status, m.totalShares),
    meta: metaFor(m),
    rentalHistory: [],
    // Staggered so marketplace's created_at DESC keeps manifest order stable.
    createdAt: new Date(now.getTime() - index * 60_000).toISOString(),
  };
}

export function loadManifestSeedProperties(): SeedProperty[] {
  const manifest = loadManifest();
  validateManifest(manifest);
  return manifest.map((m, i) => manifestToSeedProperty(m, i));
}
