import { desc, eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { instantSells } from "../db/schema/instant-sells.js";

export type InstantSellRecord = {
  id: string;
  userId: string;
  propertyId: string;
  shares: number;
  sharePriceUsd: number;
  grossUsd: number;
  feeUsd: number;
  netUsd: number;
  status: "settled";
  transactionId: string | null;
  createdAt: Date;
};

export type InstantSellStore = {
  insert(input: {
    id: string;
    userId: string;
    propertyId: string;
    shares: number;
    sharePriceUsd: number;
    grossUsd: number;
    feeUsd: number;
    netUsd: number;
    transactionId: string;
  }): Promise<InstantSellRecord>;
  listByUserId(
    userId: string,
    opts?: { limit?: number },
  ): Promise<InstantSellRecord[]>;
};

function mapRow(r: typeof instantSells.$inferSelect): InstantSellRecord {
  return {
    id: r.id,
    userId: r.userId,
    propertyId: r.propertyId,
    shares: r.shares,
    sharePriceUsd: Number(r.sharePriceUsd),
    grossUsd: Number(r.grossUsd),
    feeUsd: Number(r.feeUsd),
    netUsd: Number(r.netUsd),
    status: r.status,
    transactionId: r.transactionId,
    createdAt: r.createdAt,
  };
}

export function createDbInstantSellStore(db: Db): InstantSellStore {
  return {
    async insert(input) {
      const rows = await db
        .insert(instantSells)
        .values({
          id: input.id,
          userId: input.userId,
          propertyId: input.propertyId,
          shares: input.shares,
          sharePriceUsd: input.sharePriceUsd,
          grossUsd: input.grossUsd,
          feeUsd: input.feeUsd,
          netUsd: input.netUsd,
          status: "settled",
          transactionId: input.transactionId,
          createdAt: new Date(),
        })
        .returning();
      const row = rows[0];
      if (!row) throw new Error("insert instant_sell returned no row");
      return mapRow(row);
    },

    async listByUserId(userId, opts = {}) {
      const limit = Math.min(opts.limit ?? 50, 100);
      const rows = await db
        .select()
        .from(instantSells)
        .where(eq(instantSells.userId, userId))
        .orderBy(desc(instantSells.createdAt))
        .limit(limit);
      return rows.map(mapRow);
    },
  };
}

/** In-memory store for unit tests (no Postgres). */
export function createMemoryInstantSellStore(): InstantSellStore & {
  _rows: InstantSellRecord[];
} {
  const _rows: InstantSellRecord[] = [];
  return {
    _rows,
    async insert(input) {
      const rec: InstantSellRecord = {
        ...input,
        status: "settled",
        createdAt: new Date(),
      };
      _rows.push(rec);
      return { ...rec };
    },
    async listByUserId(userId, opts = {}) {
      const limit = Math.min(opts.limit ?? 50, 100);
      return _rows
        .filter((r) => r.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)
        .map((r) => ({ ...r }));
    },
  };
}
