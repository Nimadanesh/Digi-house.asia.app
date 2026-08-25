// File responsibility: deterministic price/yield performance series for the property
// chart. Pure display-data generator — a seeded walk around the current anchor price;
// no payout math and no randomness at render time.
import type { Listing } from "@/types/property";
import { annualYieldRatio } from "@/lib/format";

export type PerfRange = "1M" | "6M" | "1Y" | "ALL";

export interface PerfPoint {
  /** ISO date of the week's end. */
  at: string;
  priceUsd: number;
  yieldRatio: number;
}

const RANGE_WEEKS: Record<PerfRange, number> = { "1M": 4, "6M": 26, "1Y": 52, ALL: 104 };

/** FNV-1a-ish string hash → 32-bit int (stable across renders/sessions). */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 PRNG → [0,1). Deterministic per seed. */
function prng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Weekly series ending exactly at `anchorUsd` (defaults to sharePriceUsd). Callers
 * must pass getCurrentSharePrice() so the chart can never disagree with the Hero,
 * Metrics and Calculator. Deterministic drift backwards from that single point.
 */
export function performanceSeries(
  listing: Listing,
  range: PerfRange,
  nowMs: number = Date.now(),
  /** Current-price source of truth (lib/property-price) — defaults to list price. */
  anchorUsd?: number,
): PerfPoint[] {
  const weeks = RANGE_WEEKS[range];
  const anchor = anchorUsd ?? listing.sharePriceUsd;
  const rand = prng(hashSeed(`${listing.id}:${range}`));

  // Backwards walk in relative terms (rel[0] = today), then rescale so the
  // final point == anchor.
  const rel: number[] = [1];
  for (let i = 1; i < weeks; i++) {
    const drift = (rand() - 0.5) * 0.02 + Math.sin(i / 7) * 0.004;
    rel.push(Math.max(0.6, rel[i - 1] / (1 + drift)));
  }
  const scale = anchor / rel[0];

  const points: PerfPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    // Pushed oldest → newest; a point `i` weeks ago maps to rel[i].
    const at = new Date(nowMs - i * 7 * 24 * 60 * 60 * 1000);
    const priceUsd = Math.round(rel[i] * scale);
    points.push({
      at: at.toISOString(),
      priceUsd,
      // Existing helper: annual rent ÷ implied total value at that week's price.
      yieldRatio: annualYieldRatio(listing.annualRentUsd, listing.totalShares * priceUsd),
    });
  }
  return points;
}
