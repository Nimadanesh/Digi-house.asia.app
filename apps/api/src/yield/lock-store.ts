import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import {
  shareLocks,
  type LockStatus,
  type PayoutPeriod,
  type ShareLockRow,
} from "../db/schema/share-locks.js";

export type ShareLockRecord = {
  id: string;
  userId: string;
  propertyId: string;
  shares: number;
  principalUsd: number;
  payoutPeriod: PayoutPeriod;
  /** Percent with two decimals, e.g. 6.25. */
  monthlyRate: number;
  status: LockStatus;
  lockedAt: Date;
  unlockRequestedAt: Date | null;
  maturedAt: Date | null;
  nextPayoutAt: Date;
  paidThroughDay: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ShareLockStore = {
  create(input: {
    id: string;
    userId: string;
    propertyId: string;
    shares: number;
    principalUsd: number;
    payoutPeriod: PayoutPeriod;
    monthlyRate: number;
    nextPayoutAt: Date;
    now?: Date;
  }): Promise<ShareLockRecord>;
  get(id: string): Promise<ShareLockRecord | null>;
  listByUser(userId: string): Promise<ShareLockRecord[]>;
  /** All non-terminal locks (engine input). Optional userId scopes the run (PE-04). */
  listActive(userId?: string): Promise<ShareLockRecord[]>;
  /** Non-matured locks whose payout window is due or that requested unlock. Optional userId (PE-04). */
  listDueForPayout(now: Date, userId?: string): Promise<ShareLockRecord[]>;
  /** unlock_requested locks past the 2–3 day maturation window. */
  listDueForMaturation(now: Date, maturationMs: number): Promise<ShareLockRecord[]>;
  /** locked → unlock_requested (atomic claim; null when not applicable). */
  markUnlockRequested(id: string, now: Date): Promise<ShareLockRecord | null>;
  /** unlock_requested → matured (atomic claim; null when not applicable). */
  markMatured(id: string, now: Date): Promise<ShareLockRecord | null>;
  /** Advance the payout cursor after a settled payment. */
  updatePayoutCursor(
    id: string,
    next: { paidThroughDay: string; nextPayoutAt: Date },
  ): Promise<ShareLockRecord | null>;
  /** Sum of shares in non-terminal locks for a holding (locked + unlock_requested). */
  sumActiveLockedShares(userId: string, propertyId: string): Promise<number>;
};

function mapRow(r: ShareLockRow): ShareLockRecord {
  return {
    id: r.id,
    userId: r.userId,
    propertyId: r.propertyId,
    shares: r.shares,
    principalUsd: Number(r.principalUsd),
    payoutPeriod: r.payoutPeriod,
    monthlyRate: Number(r.monthlyRate),
    status: r.status,
    lockedAt: r.lockedAt,
    unlockRequestedAt: r.unlockRequestedAt,
    maturedAt: r.maturedAt,
    nextPayoutAt: r.nextPayoutAt,
    paidThroughDay: r.paidThroughDay,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export function createDbShareLockStore(db: Db): ShareLockStore {
  return {
    async create(input) {
      const now = input.now ?? new Date();
      const rows = await db
        .insert(shareLocks)
        .values({
          id: input.id,
          userId: input.userId,
          propertyId: input.propertyId,
          shares: input.shares,
          principalUsd: input.principalUsd,
          payoutPeriod: input.payoutPeriod,
          monthlyRate: input.monthlyRate.toFixed(2),
          status: "locked",
          lockedAt: now,
          nextPayoutAt: input.nextPayoutAt,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const row = rows[0];
      if (!row) throw new Error("insert share_lock returned no row");
      return mapRow(row);
    },

    async get(id) {
      const rows = await db
        .select()
        .from(shareLocks)
        .where(eq(shareLocks.id, id))
        .limit(1);
      return rows[0] ? mapRow(rows[0]) : null;
    },

    async listByUser(userId) {
      const rows = await db
        .select()
        .from(shareLocks)
        .where(eq(shareLocks.userId, userId))
        .orderBy(asc(shareLocks.createdAt));
      return rows.map(mapRow);
    },

    async listActive(userId) {
      const rows = await db
        .select()
        .from(shareLocks)
        .where(
          and(
            ne(shareLocks.status, "matured"),
            userId ? eq(shareLocks.userId, userId) : undefined,
          ),
        );
      return rows.map(mapRow);
    },

    async listDueForPayout(now, userId) {
      const rows = await db
        .select()
        .from(shareLocks)
        .where(
          and(
            ne(shareLocks.status, "matured"),
            sql`(${shareLocks.nextPayoutAt} <= ${now} OR ${shareLocks.status} = 'unlock_requested')`,
            userId ? eq(shareLocks.userId, userId) : undefined,
          ),
        );
      return rows.map(mapRow);
    },

    async listDueForMaturation(now, maturationMs) {
      const rows = await db
        .select()
        .from(shareLocks)
        .where(
          and(
            eq(shareLocks.status, "unlock_requested"),
            sql`${shareLocks.unlockRequestedAt} + ${sql.raw(`interval '${Math.round(maturationMs / 1000)} seconds'`)} <= ${now}`,
          ),
        );
      return rows.map(mapRow);
    },

    async markUnlockRequested(id, now) {
      const rows = await db
        .update(shareLocks)
        .set({ status: "unlock_requested", unlockRequestedAt: now, updatedAt: now })
        .where(and(eq(shareLocks.id, id), eq(shareLocks.status, "locked")))
        .returning();
      return rows[0] ? mapRow(rows[0]) : null;
    },

    async markMatured(id, now) {
      const rows = await db
        .update(shareLocks)
        .set({ status: "matured", maturedAt: now, updatedAt: now })
        .where(and(eq(shareLocks.id, id), eq(shareLocks.status, "unlock_requested")))
        .returning();
      return rows[0] ? mapRow(rows[0]) : null;
    },

    async updatePayoutCursor(id, next) {
      const rows = await db
        .update(shareLocks)
        .set({
          paidThroughDay: next.paidThroughDay,
          nextPayoutAt: next.nextPayoutAt,
          updatedAt: new Date(),
        })
        .where(eq(shareLocks.id, id))
        .returning();
      return rows[0] ? mapRow(rows[0]) : null;
    },

    async sumActiveLockedShares(userId, propertyId) {
      const rows = await db
        .select({ total: sql<string>`coalesce(sum(${shareLocks.shares}), 0)` })
        .from(shareLocks)
        .where(
          and(
            eq(shareLocks.userId, userId),
            eq(shareLocks.propertyId, propertyId),
            inArray(shareLocks.status, ["locked", "unlock_requested"]),
          ),
        );
      return Number(rows[0]?.total ?? 0);
    },
  };
}

/** In-memory store for unit tests (no Postgres). */
export function createMemoryShareLockStore(): ShareLockStore & {
  _rows: Map<string, ShareLockRecord>;
} {
  const _rows = new Map<string, ShareLockRecord>();
  const copy = (r: ShareLockRecord) => ({ ...r });

  return {
    _rows,

    async create(input) {
      const now = input.now ?? new Date();
      const rec: ShareLockRecord = {
        id: input.id,
        userId: input.userId,
        propertyId: input.propertyId,
        shares: input.shares,
        principalUsd: input.principalUsd,
        payoutPeriod: input.payoutPeriod,
        monthlyRate: input.monthlyRate,
        status: "locked",
        lockedAt: now,
        unlockRequestedAt: null,
        maturedAt: null,
        nextPayoutAt: input.nextPayoutAt,
        paidThroughDay: null,
        createdAt: now,
        updatedAt: now,
      };
      _rows.set(rec.id, rec);
      return copy(rec);
    },

    async get(id) {
      const row = _rows.get(id);
      return row ? copy(row) : null;
    },

    async listByUser(userId) {
      return [..._rows.values()]
        .filter((r) => r.userId === userId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map(copy);
    },

    async listActive(userId) {
      return [..._rows.values()]
        .filter((r) => r.status !== "matured" && (!userId || r.userId === userId))
        .map(copy);
    },

    async listDueForPayout(now, userId) {
      return [..._rows.values()]
        .filter(
          (r) =>
            r.status !== "matured" &&
            (r.nextPayoutAt.getTime() <= now.getTime() ||
              r.status === "unlock_requested") &&
            (!userId || r.userId === userId),
        )
        .map(copy);
    },

    async listDueForMaturation(now, maturationMs) {
      return [..._rows.values()]
        .filter(
          (r) =>
            r.status === "unlock_requested" &&
            r.unlockRequestedAt!.getTime() + maturationMs <= now.getTime(),
        )
        .map(copy);
    },

    async markUnlockRequested(id, now) {
      const row = _rows.get(id);
      if (!row || row.status !== "locked") return null;
      row.status = "unlock_requested";
      row.unlockRequestedAt = now;
      row.updatedAt = now;
      return copy(row);
    },

    async markMatured(id, now) {
      const row = _rows.get(id);
      if (!row || row.status !== "unlock_requested") return null;
      row.status = "matured";
      row.maturedAt = now;
      row.updatedAt = now;
      return copy(row);
    },

    async updatePayoutCursor(id, next) {
      const row = _rows.get(id);
      if (!row) return null;
      row.paidThroughDay = next.paidThroughDay;
      row.nextPayoutAt = next.nextPayoutAt;
      row.updatedAt = new Date();
      return copy(row);
    },

    async sumActiveLockedShares(userId, propertyId) {
      return [..._rows.values()]
        .filter(
          (r) =>
            r.userId === userId &&
            r.propertyId === propertyId &&
            (r.status === "locked" || r.status === "unlock_requested"),
        )
        .reduce((s, r) => s + r.shares, 0);
    },
  };
}
