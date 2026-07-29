import { and, eq, gt } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { buyIntents } from "../db/schema/buy-intents.js";

export type BuyIntentStatus =
  | "pending"
  | "confirmed"
  | "expired"
  | "cancelled";

export type BuyIntentRecord = {
  id: string;
  userId: string;
  propertyId: string;
  quantity: number;
  priceUsdPerShare: number;
  totalUsd: number;
  status: BuyIntentStatus;
  boc: string | null;
  expiresAt: Date;
  confirmedAt: Date | null;
  createdAt: Date;
};

export type IntentStore = {
  create(input: {
    id: string;
    userId: string;
    propertyId: string;
    quantity: number;
    priceUsdPerShare: number;
    totalUsd: number;
    expiresAt: Date;
  }): Promise<BuyIntentRecord>;
  getById(id: string): Promise<BuyIntentRecord | null>;
  /**
   * Atomically claim a pending, non-expired intent for userId.
   * Sets status=confirmed, optional boc, confirmed_at.
   */
  markConfirmedIfPending(
    id: string,
    userId: string,
    now: Date,
    boc?: string | null,
  ): Promise<
    | { ok: true; intent: BuyIntentRecord }
    | {
        ok: false;
        reason: "not_found" | "not_owned" | "not_pending" | "expired";
      }
  >;
};

function mapStatus(s: string): BuyIntentStatus {
  if (
    s === "pending" ||
    s === "confirmed" ||
    s === "expired" ||
    s === "cancelled"
  ) {
    return s;
  }
  return "cancelled";
}

function mapRow(r: {
  id: string;
  userId: string;
  propertyId: string;
  quantity: number;
  priceUsdPerShare: number;
  totalUsd: number;
  status: string;
  boc: string | null;
  expiresAt: Date;
  confirmedAt: Date | null;
  createdAt: Date;
}): BuyIntentRecord {
  return {
    id: r.id,
    userId: r.userId,
    propertyId: r.propertyId,
    quantity: r.quantity,
    priceUsdPerShare: Number(r.priceUsdPerShare),
    totalUsd: Number(r.totalUsd),
    status: mapStatus(r.status),
    boc: r.boc,
    expiresAt: r.expiresAt,
    confirmedAt: r.confirmedAt,
    createdAt: r.createdAt,
  };
}

export function createDbIntentStore(db: Db): IntentStore {
  return {
    async create(input) {
      const now = new Date();
      const rows = await db
        .insert(buyIntents)
        .values({
          id: input.id,
          userId: input.userId,
          propertyId: input.propertyId,
          quantity: input.quantity,
          priceUsdPerShare: input.priceUsdPerShare,
          totalUsd: input.totalUsd,
          status: "pending",
          boc: null,
          expiresAt: input.expiresAt,
          confirmedAt: null,
          createdAt: now,
        })
        .returning();
      const row = rows[0];
      if (!row) throw new Error("insert buy_intent returned no row");
      return mapRow(row);
    },

    async getById(id) {
      const rows = await db
        .select()
        .from(buyIntents)
        .where(eq(buyIntents.id, id))
        .limit(1);
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async markConfirmedIfPending(id, userId, now, boc) {
      const existing = await this.getById(id);
      if (!existing) return { ok: false, reason: "not_found" };
      if (existing.userId !== userId) return { ok: false, reason: "not_owned" };
      if (existing.status !== "pending") {
        return { ok: false, reason: "not_pending" };
      }
      if (existing.expiresAt.getTime() <= now.getTime()) {
        await db
          .update(buyIntents)
          .set({ status: "expired" })
          .where(
            and(eq(buyIntents.id, id), eq(buyIntents.status, "pending")),
          );
        return { ok: false, reason: "expired" };
      }

      const rows = await db
        .update(buyIntents)
        .set({
          status: "confirmed",
          confirmedAt: now,
          boc: boc ?? null,
        })
        .where(
          and(
            eq(buyIntents.id, id),
            eq(buyIntents.userId, userId),
            eq(buyIntents.status, "pending"),
            gt(buyIntents.expiresAt, now),
          ),
        )
        .returning();
      const row = rows[0];
      if (!row) {
        const again = await this.getById(id);
        if (!again || again.userId !== userId) {
          return { ok: false, reason: "not_found" };
        }
        if (again.status !== "pending") {
          return { ok: false, reason: "not_pending" };
        }
        return { ok: false, reason: "expired" };
      }
      return { ok: true, intent: mapRow(row) };
    },
  };
}

/** In-memory store for unit tests. */
export function createMemoryIntentStore(
  seed: BuyIntentRecord[] = [],
): IntentStore & { _rows: BuyIntentRecord[] } {
  const rows = seed.map((r) => ({ ...r }));

  return {
    _rows: rows,

    async create(input) {
      const now = new Date();
      const record: BuyIntentRecord = {
        id: input.id,
        userId: input.userId,
        propertyId: input.propertyId,
        quantity: input.quantity,
        priceUsdPerShare: input.priceUsdPerShare,
        totalUsd: input.totalUsd,
        status: "pending",
        boc: null,
        expiresAt: input.expiresAt,
        confirmedAt: null,
        createdAt: now,
      };
      rows.push(record);
      return { ...record };
    },

    async getById(id) {
      const row = rows.find((r) => r.id === id);
      return row ? { ...row } : null;
    },

    async markConfirmedIfPending(id, userId, now, boc) {
      const idx = rows.findIndex((r) => r.id === id);
      if (idx < 0) return { ok: false, reason: "not_found" };
      const existing = rows[idx]!;
      if (existing.userId !== userId) return { ok: false, reason: "not_owned" };
      if (existing.status !== "pending") {
        return { ok: false, reason: "not_pending" };
      }
      if (existing.expiresAt.getTime() <= now.getTime()) {
        rows[idx] = { ...existing, status: "expired" };
        return { ok: false, reason: "expired" };
      }
      const updated: BuyIntentRecord = {
        ...existing,
        status: "confirmed",
        confirmedAt: now,
        boc: boc ?? null,
      };
      rows[idx] = updated;
      return { ok: true, intent: { ...updated } };
    },
  };
}
