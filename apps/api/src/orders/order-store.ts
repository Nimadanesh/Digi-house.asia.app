import { and, desc, eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { orders } from "../db/schema/orders.js";
import type {
  OrderRecord,
  OrderSide,
  OrderStatus,
} from "./map-order.js";

export type { OrderRecord, OrderSide, OrderStatus };

export type OrderStore = {
  listOpenByPropertyId(propertyId: string): Promise<OrderRecord[]>;
  listOpenByUserId(userId: string): Promise<OrderRecord[]>;
  getById(id: string): Promise<OrderRecord | null>;
  insert(input: {
    id: string;
    userId: string;
    propertyId: string;
    makerAddress: string;
    side: OrderSide;
    priceUsd: number;
    quantity: number;
  }): Promise<OrderRecord>;
  cancelIfOpen(
    id: string,
    userId: string,
  ): Promise<
    | { ok: true; record: OrderRecord }
    | { ok: false; reason: "not_found" | "forbidden" | "not_open" }
  >;
};

function mapRow(r: {
  id: string;
  userId: string;
  propertyId: string;
  makerAddress: string;
  side: string;
  priceUsd: number;
  quantity: number;
  filledQuantity: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): OrderRecord {
  return {
    id: r.id,
    userId: r.userId,
    propertyId: r.propertyId,
    makerAddress: r.makerAddress,
    side: r.side === "sell" ? "sell" : "buy",
    priceUsd: Number(r.priceUsd),
    quantity: r.quantity,
    filledQuantity: r.filledQuantity,
    status: normalizeStatus(r.status),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function normalizeStatus(s: string): OrderStatus {
  if (
    s === "open" ||
    s === "filled" ||
    s === "cancelled" ||
    s === "rejected"
  ) {
    return s;
  }
  return "cancelled";
}

export function createDbOrderStore(db: Db): OrderStore {
  return {
    async listOpenByPropertyId(propertyId) {
      const rows = await db
        .select()
        .from(orders)
        .where(
          and(eq(orders.propertyId, propertyId), eq(orders.status, "open")),
        );
      return rows.map(mapRow);
    },

    async listOpenByUserId(userId) {
      const rows = await db
        .select()
        .from(orders)
        .where(and(eq(orders.userId, userId), eq(orders.status, "open")))
        .orderBy(desc(orders.createdAt));
      return rows.map(mapRow);
    },

    async getById(id) {
      const rows = await db
        .select()
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async insert(input) {
      const now = new Date();
      const rows = await db
        .insert(orders)
        .values({
          id: input.id,
          userId: input.userId,
          propertyId: input.propertyId,
          makerAddress: input.makerAddress,
          side: input.side,
          priceUsd: input.priceUsd,
          quantity: input.quantity,
          filledQuantity: 0,
          status: "open",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const row = rows[0];
      if (!row) throw new Error("insert order returned no row");
      return mapRow(row);
    },

    async cancelIfOpen(id, userId) {
      const now = new Date();
      const updated = await db
        .update(orders)
        .set({ status: "cancelled", updatedAt: now })
        .where(
          and(
            eq(orders.id, id),
            eq(orders.userId, userId),
            eq(orders.status, "open"),
          ),
        )
        .returning();
      if (updated.length > 0) {
        return { ok: true, record: mapRow(updated[0]!) };
      }
      const existing = await this.getById(id);
      if (!existing) return { ok: false, reason: "not_found" };
      if (existing.userId !== userId) {
        return { ok: false, reason: "forbidden" };
      }
      return { ok: false, reason: "not_open" };
    },
  };
}

/** In-memory store for unit tests (no Postgres). */
export function createMemoryOrderStore(
  seed: OrderRecord[] = [],
): OrderStore & { _rows: OrderRecord[] } {
  const rows = seed.map((r) => ({ ...r }));

  return {
    _rows: rows,

    async listOpenByPropertyId(propertyId) {
      return rows
        .filter((r) => r.propertyId === propertyId && r.status === "open")
        .map((r) => ({ ...r }));
    },

    async listOpenByUserId(userId) {
      return rows
        .filter((r) => r.userId === userId && r.status === "open")
        .map((r) => ({ ...r }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    async getById(id) {
      const row = rows.find((r) => r.id === id);
      return row ? { ...row } : null;
    },

    async insert(input) {
      const now = new Date();
      const record: OrderRecord = {
        id: input.id,
        userId: input.userId,
        propertyId: input.propertyId,
        makerAddress: input.makerAddress,
        side: input.side,
        priceUsd: input.priceUsd,
        quantity: input.quantity,
        filledQuantity: 0,
        status: "open",
        createdAt: now,
        updatedAt: now,
      };
      rows.push(record);
      return { ...record };
    },

    async cancelIfOpen(id, userId) {
      const idx = rows.findIndex((r) => r.id === id);
      if (idx < 0) return { ok: false, reason: "not_found" };
      const existing = rows[idx]!;
      if (existing.userId !== userId) {
        return { ok: false, reason: "forbidden" };
      }
      if (existing.status !== "open") {
        return { ok: false, reason: "not_open" };
      }
      const updated: OrderRecord = {
        ...existing,
        status: "cancelled" as OrderStatus,
        updatedAt: new Date(),
      };
      rows[idx] = updated;
      return { ok: true, record: { ...updated } };
    },
  };
}
