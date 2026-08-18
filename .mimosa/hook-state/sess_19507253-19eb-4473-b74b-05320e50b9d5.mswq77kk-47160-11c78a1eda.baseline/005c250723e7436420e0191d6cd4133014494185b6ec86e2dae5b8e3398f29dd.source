import { and, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { earningsEntries } from "../db/schema/earnings-entries.js";
import type { EarningsEntryInput } from "./map-earnings.js";

export type EarningsEntryRowInput = EarningsEntryInput & {
  distributionId: string;
};

export type EarningsStore = {
  listEntriesByUserId(userId: string): Promise<EarningsEntryInput[]>;
  /**
   * Flip pending→paid for a distribution. Does not change amounts.
   * Returns ids that were pending and are now paid.
   */
  markPendingPaidForDistribution(input: {
    distributionId: string;
    txHashFor: (entryId: string) => string;
  }): Promise<{ entryIds: string[] }>;
  countPendingByDistribution(distributionId: string): Promise<number>;
  /** Fetch a single entry by id (used by notify). */
  getEntry(entryId: string): Promise<EarningsEntryInput | null>;
  /** Check if an entry has been notified (notified_at != null). */
  wasNotified(entryId: string): Promise<boolean>;
  /** Mark an entry as notified (set notified_at). */
  markNotified(entryId: string): Promise<void>;
};

function mapStatus(s: string): "paid" | "pending" {
  return s === "paid" ? "paid" : "pending";
}

function toPublic(r: EarningsEntryRowInput): EarningsEntryInput {
  return {
    id: r.id,
    userId: r.userId,
    propertyId: r.propertyId,
    weekOf: r.weekOf,
    amountUsd: r.amountUsd,
    tonAmount: r.tonAmount,
    shareRatio: r.shareRatio,
    status: r.status,
    txHash: r.txHash,
  };
}

function toPublicFromDb(
  r: typeof earningsEntries.$inferSelect,
): EarningsEntryInput {
  return {
    id: r.id,
    userId: r.userId,
    propertyId: r.propertyId,
    weekOf: r.weekOf,
    amountUsd: Number(r.amountUsd),
    tonAmount: Number(r.tonAmount),
    shareRatio: r.shareRatio,
    status: mapStatus(r.status),
    txHash: r.txHash ?? null,
  };
}

export function createDbEarningsStore(db: Db): EarningsStore {
  return {
    async listEntriesByUserId(userId) {
      const rows = await db
        .select()
        .from(earningsEntries)
        .where(eq(earningsEntries.userId, userId))
        .orderBy(desc(earningsEntries.weekOf));
      return rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        propertyId: r.propertyId,
        weekOf: r.weekOf,
        amountUsd: Number(r.amountUsd),
        tonAmount: Number(r.tonAmount),
        shareRatio: r.shareRatio,
        status: mapStatus(r.status),
        txHash: r.txHash ?? null,
      }));
    },

    async markPendingPaidForDistribution({ distributionId, txHashFor }) {
      const pending = await db
        .select()
        .from(earningsEntries)
        .where(
          and(
            eq(earningsEntries.distributionId, distributionId),
            eq(earningsEntries.status, "pending"),
          ),
        );
      const entryIds: string[] = [];
      for (const row of pending) {
        const txHash = txHashFor(row.id);
        await db
          .update(earningsEntries)
          .set({ status: "paid", txHash })
          .where(
            and(
              eq(earningsEntries.id, row.id),
              eq(earningsEntries.status, "pending"),
            ),
          );
        entryIds.push(row.id);
      }
      return { entryIds };
    },

    async countPendingByDistribution(distributionId) {
      const rows = await db
        .select({ id: earningsEntries.id })
        .from(earningsEntries)
        .where(
          and(
            eq(earningsEntries.distributionId, distributionId),
            eq(earningsEntries.status, "pending"),
          ),
        );
      return rows.length;
    },

    async getEntry(entryId) {
      const rows = await db
        .select()
        .from(earningsEntries)
        .where(eq(earningsEntries.id, entryId))
        .limit(1);
      const row = rows[0];
      return row ? toPublicFromDb(row) : null;
    },

    async wasNotified(entryId) {
      const rows = await db
        .select({ notifiedAt: earningsEntries.notifiedAt })
        .from(earningsEntries)
        .where(eq(earningsEntries.id, entryId))
        .limit(1);
      return rows.length > 0 && rows[0]!.notifiedAt !== null;
    },

    async markNotified(entryId) {
      await db
        .update(earningsEntries)
        .set({ notifiedAt: new Date() })
        .where(
          and(
            eq(earningsEntries.id, entryId),
            isNull(earningsEntries.notifiedAt),
          ),
        );
    },
  };
}

/** In-memory store for unit tests (no Postgres). */
export function createMemoryEarningsStore(
  seed: EarningsEntryRowInput[] = [],
): EarningsStore & { _rows: EarningsEntryRowInput[] } {
  const rows = seed.map((r) => ({ ...r }));
  const notified = new Set<string>();
  return {
    _rows: rows,

    async listEntriesByUserId(userId) {
      return rows
        .filter((r) => r.userId === userId)
        .map((r) => toPublic(r))
        .sort((a, b) => {
          const wa =
            typeof a.weekOf === "string"
              ? a.weekOf
              : a.weekOf.toISOString();
          const wb =
            typeof b.weekOf === "string"
              ? b.weekOf
              : b.weekOf.toISOString();
          return wb.localeCompare(wa);
        });
    },

    async markPendingPaidForDistribution({ distributionId, txHashFor }) {
      const entryIds: string[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]!;
        if (r.distributionId !== distributionId || r.status !== "pending") {
          continue;
        }
        const txHash = txHashFor(r.id);
        rows[i] = { ...r, status: "paid", txHash };
        entryIds.push(r.id);
      }
      return { entryIds };
    },

    async countPendingByDistribution(distributionId) {
      return rows.filter(
        (r) => r.distributionId === distributionId && r.status === "pending",
      ).length;
    },

    async getEntry(entryId) {
      const r = rows.find((e) => e.id === entryId);
      return r ? toPublic(r) : null;
    },

    async wasNotified(entryId) {
      return notified.has(entryId);
    },

    async markNotified(entryId) {
      notified.add(entryId);
    },
  };
}
