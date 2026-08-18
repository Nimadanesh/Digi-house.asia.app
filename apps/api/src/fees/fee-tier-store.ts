import { asc } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { feeTiers } from "../db/schema/fee-tiers.js";

export type FeeTierRecord = {
  id: number;
  /** Inclusive lower bound, integer cents. */
  minAmountUsd: number;
  /** Inclusive upper bound, integer cents; NULL = unbounded. */
  maxAmountUsd: number | null;
  buyPrimaryBps: number;
  buySecondaryBps: number;
  sellSecondaryBps: number;
};

/**
 * Product fee schedule (PRODUCT-PLAN §0.5). Mirrors migration 0019's seed;
 * the DB copy is the runtime source of truth, this is the fallback/default.
 */
export const DEFAULT_FEE_TIERS: FeeTierRecord[] = [
  { id: 1, minAmountUsd: 8_000, maxAmountUsd: 50_000, buyPrimaryBps: 300, buySecondaryBps: 90, sellSecondaryBps: 90 },
  { id: 2, minAmountUsd: 50_000, maxAmountUsd: 200_000, buyPrimaryBps: 250, buySecondaryBps: 80, sellSecondaryBps: 80 },
  { id: 3, minAmountUsd: 200_000, maxAmountUsd: 1_000_000, buyPrimaryBps: 200, buySecondaryBps: 70, sellSecondaryBps: 70 },
  { id: 4, minAmountUsd: 1_000_000, maxAmountUsd: 5_000_000, buyPrimaryBps: 150, buySecondaryBps: 60, sellSecondaryBps: 60 },
  { id: 5, minAmountUsd: 5_000_000, maxAmountUsd: 20_000_000, buyPrimaryBps: 100, buySecondaryBps: 50, sellSecondaryBps: 50 },
  { id: 6, minAmountUsd: 20_000_000, maxAmountUsd: 50_000_000, buyPrimaryBps: 80, buySecondaryBps: 40, sellSecondaryBps: 40 },
  { id: 7, minAmountUsd: 50_000_000, maxAmountUsd: 100_000_000, buyPrimaryBps: 60, buySecondaryBps: 30, sellSecondaryBps: 30 },
  { id: 8, minAmountUsd: 100_000_000, maxAmountUsd: 999_999_999, buyPrimaryBps: 40, buySecondaryBps: 20, sellSecondaryBps: 20 },
  { id: 9, minAmountUsd: 1_000_000_000, maxAmountUsd: null, buyPrimaryBps: 1, buySecondaryBps: 10, sellSecondaryBps: 10 },
];

export type FeeTierStore = {
  /** All tiers ordered by ascending lower bound. */
  listAll(): Promise<FeeTierRecord[]>;
};

function mapRow(r: {
  id: number;
  minAmountUsd: number | bigint;
  maxAmountUsd: number | bigint | null;
  buyPrimaryBps: number;
  buySecondaryBps: number;
  sellSecondaryBps: number;
}): FeeTierRecord {
  return {
    id: r.id,
    minAmountUsd: Number(r.minAmountUsd),
    maxAmountUsd: r.maxAmountUsd == null ? null : Number(r.maxAmountUsd),
    buyPrimaryBps: r.buyPrimaryBps,
    buySecondaryBps: r.buySecondaryBps,
    sellSecondaryBps: r.sellSecondaryBps,
  };
}

export function createDbFeeTierStore(db: Db): FeeTierStore {
  return {
    async listAll() {
      const rows = await db.select().from(feeTiers).orderBy(asc(feeTiers.minAmountUsd));
      if (rows.length === 0) return [...DEFAULT_FEE_TIERS];
      return rows.map(mapRow);
    },
  };
}

/** In-memory store for unit tests (no Postgres). */
export function createMemoryFeeTierStore(
  tiers: FeeTierRecord[] = DEFAULT_FEE_TIERS,
): FeeTierStore & { _tiers: FeeTierRecord[] } {
  const _tiers = tiers.map((t) => ({ ...t }));
  return {
    _tiers,
    async listAll() {
      return [..._tiers].sort((a, b) => a.minAmountUsd - b.minAmountUsd);
    },
  };
}
