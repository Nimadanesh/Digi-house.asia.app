import { desc, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { trades } from "../db/schema/trades.js";

export type TradeRecord = {
  id: string;
  propertyId: string;
  priceUsd: number;
  quantity: number;
  buyerUserId: string;
  sellerUserId: string;
  buyFeeUsd: number;
  sellFeeUsd: number;
  makerOrderId: string;
  takerOrderId: string;
  fillSeq: number;
  createdAt: Date;
};

export type TradeStore = {
  /** Insert a fill; the (taker, maker, seq) unique key makes replays throw. */
  insert(input: Omit<TradeRecord, "createdAt"> & { createdAt?: Date }): Promise<TradeRecord>;
  listByProperty(propertyId: string, opts?: { limit?: number }): Promise<TradeRecord[]>;
  listByUserId(userId: string, opts?: { limit?: number }): Promise<TradeRecord[]>;
  /** Latest executed price for a property (null before the first trade). */
  lastPriceUsd(propertyId: string): Promise<number | null>;
};

function mapRow(r: typeof trades.$inferSelect): TradeRecord {
  return {
    id: r.id,
    propertyId: r.propertyId,
    priceUsd: Number(r.priceUsd),
    quantity: r.quantity,
    buyerUserId: r.buyerUserId,
    sellerUserId: r.sellerUserId,
    buyFeeUsd: Number(r.buyFeeUsd),
    sellFeeUsd: Number(r.sellFeeUsd),
    makerOrderId: r.makerOrderId,
    takerOrderId: r.takerOrderId,
    fillSeq: r.fillSeq,
    createdAt: r.createdAt,
  };
}

export function createDbTradeStore(db: Db): TradeStore {
  return {
    async insert(input) {
      const rows = await db
        .insert(trades)
        .values({
          id: input.id,
          propertyId: input.propertyId,
          priceUsd: input.priceUsd,
          quantity: input.quantity,
          buyerUserId: input.buyerUserId,
          sellerUserId: input.sellerUserId,
          buyFeeUsd: input.buyFeeUsd,
          sellFeeUsd: input.sellFeeUsd,
          makerOrderId: input.makerOrderId,
          takerOrderId: input.takerOrderId,
          fillSeq: input.fillSeq,
          createdAt: input.createdAt ?? new Date(),
        })
        .returning();
      const row = rows[0];
      if (!row) throw new Error("insert trade returned no row");
      return mapRow(row);
    },

    async listByProperty(propertyId, opts = {}) {
      const limit = Math.min(opts.limit ?? 50, 100);
      const rows = await db
        .select()
        .from(trades)
        .where(eq(trades.propertyId, propertyId))
        .orderBy(desc(trades.createdAt))
        .limit(limit);
      return rows.map(mapRow);
    },

    async listByUserId(userId, opts = {}) {
      const limit = Math.min(opts.limit ?? 50, 100);
      const rows = await db
        .select()
        .from(trades)
        .where(
          sql`${trades.buyerUserId} = ${userId} OR ${trades.sellerUserId} = ${userId}`,
        )
        .orderBy(desc(trades.createdAt))
        .limit(limit);
      return rows.map(mapRow);
    },

    async lastPriceUsd(propertyId) {
      const rows = await db
        .select({ price: trades.priceUsd })
        .from(trades)
        .where(eq(trades.propertyId, propertyId))
        .orderBy(desc(trades.createdAt))
        .limit(1);
      return rows[0] ? Number(rows[0].price) : null;
    },
  };
}

/** In-memory store for unit tests (no Postgres). */
export function createMemoryTradeStore(): TradeStore & {
  _rows: TradeRecord[];
} {
  const _rows: TradeRecord[] = [];
  const key = (t: { takerOrderId: string; makerOrderId: string; fillSeq: number }) =>
    `${t.takerOrderId}|${t.makerOrderId}|${t.fillSeq}`;
  return {
    _rows,
    async insert(input) {
      const rec: TradeRecord = {
        ...input,
        createdAt: input.createdAt ?? new Date(),
      };
      if (_rows.some((r) => key(r) === key(rec))) {
        throw new Error("duplicate trade key");
      }
      _rows.push(rec);
      return { ...rec };
    },
    async listByProperty(propertyId, opts = {}) {
      const limit = Math.min(opts.limit ?? 50, 100);
      return _rows
        .filter((r) => r.propertyId === propertyId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)
        .map((r) => ({ ...r }));
    },
    async listByUserId(userId, opts = {}) {
      const limit = Math.min(opts.limit ?? 50, 100);
      return _rows
        .filter((r) => r.buyerUserId === userId || r.sellerUserId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)
        .map((r) => ({ ...r }));
    },
    async lastPriceUsd(propertyId) {
      const list = _rows
        .filter((r) => r.propertyId === propertyId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return list[0]?.priceUsd ?? null;
    },
  };
}
