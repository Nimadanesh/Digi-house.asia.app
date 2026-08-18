import { and, desc, eq, gt, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import {
  yieldAccruals,
  yieldPayments,
  type YieldPaymentRow,
} from "../db/schema/share-locks.js";

export type YieldAccrualInput = {
  id: string;
  lockId: string;
  userId: string;
  propertyId: string;
  day: string;
  amountUsd: number;
  monthlyRate: number;
};

export type YieldPaymentRecord = {
  id: string;
  lockId: string;
  userId: string;
  propertyId: string;
  periodStart: string;
  periodEnd: string;
  amountUsd: number;
  kind: "scheduled" | "final";
  status: "paid" | "pending";
  createdAt: Date;
};

export type YieldStore = {
  /** Insert day rows; conflicts (lock, day) are skipped. Returns rows actually inserted. */
  insertAccruals(rows: YieldAccrualInput[]): Promise<number>;
  /** Sum of accrued cents strictly after `afterDay` (null = all days). */
  sumAccruedAfter(lockId: string, afterDay: string | null): Promise<number>;
  /** Sum of accrued cents in (fromDay, toDay] — exclusive/inclusive day bounds. */
  sumAccruedRange(
    lockId: string,
    fromDay: string | null,
    toDay: string,
  ): Promise<number>;
  /** Latest accrual day for a lock (null when none). */
  maxAccrualDay(lockId: string): Promise<string | null>;
  /** Sum of this user's accruals in [fromDay, toDay] (inclusive). */
  sumAccruedBetween(userId: string, fromDay: string, toDay: string): Promise<number>;
  /** Insert a payment; returns null when the period was already settled (idempotent). */
  insertPayment(input: {
    id: string;
    lockId: string;
    userId: string;
    propertyId: string;
    periodStart: string;
    periodEnd: string;
    amountUsd: number;
    kind: "scheduled" | "final";
    status?: "paid" | "pending";
  }): Promise<YieldPaymentRecord | null>;
  listPaymentsByUser(userId: string, opts?: { limit?: number }): Promise<YieldPaymentRecord[]>;
};

function mapPayment(r: YieldPaymentRow): YieldPaymentRecord {
  return {
    id: r.id,
    lockId: r.lockId,
    userId: r.userId,
    propertyId: r.propertyId,
    periodStart: r.periodStart,
    periodEnd: r.periodEnd,
    amountUsd: Number(r.amountUsd),
    kind: r.kind,
    status: r.status,
    createdAt: r.createdAt,
  };
}

export function createDbYieldStore(db: Db): YieldStore {
  return {
    async insertAccruals(rows) {
      if (rows.length === 0) return 0;
      const inserted = await db
        .insert(yieldAccruals)
        .values(
          rows.map((r) => ({
            id: r.id,
            lockId: r.lockId,
            userId: r.userId,
            propertyId: r.propertyId,
            day: r.day,
            amountUsd: r.amountUsd,
            monthlyRate: r.monthlyRate.toFixed(2),
          })),
        )
        .onConflictDoNothing({
          target: [yieldAccruals.lockId, yieldAccruals.day],
        })
        .returning({ id: yieldAccruals.id });
      return inserted.length;
    },

    async sumAccruedAfter(lockId, afterDay) {
      const rows = await db
        .select({ total: sql<string>`coalesce(sum(${yieldAccruals.amountUsd}), 0)` })
        .from(yieldAccruals)
        .where(
          afterDay == null
            ? eq(yieldAccruals.lockId, lockId)
            : and(eq(yieldAccruals.lockId, lockId), gt(yieldAccruals.day, afterDay)),
        );
      return Number(rows[0]?.total ?? 0);
    },

    async sumAccruedRange(lockId, fromDay, toDay) {
      const rows = await db
        .select({ total: sql<string>`coalesce(sum(${yieldAccruals.amountUsd}), 0)` })
        .from(yieldAccruals)
        .where(
          and(
            eq(yieldAccruals.lockId, lockId),
            fromDay == null
              ? sql`${yieldAccruals.day} <= ${toDay}`
              : sql`${yieldAccruals.day} > ${fromDay} AND ${yieldAccruals.day} <= ${toDay}`,
          ),
        );
      return Number(rows[0]?.total ?? 0);
    },

    async maxAccrualDay(lockId) {
      const rows = await db
        .select({ day: yieldAccruals.day })
        .from(yieldAccruals)
        .where(eq(yieldAccruals.lockId, lockId))
        .orderBy(desc(yieldAccruals.day))
        .limit(1);
      return rows[0]?.day ?? null;
    },

    async sumAccruedBetween(userId, fromDay, toDay) {
      const rows = await db
        .select({ total: sql<string>`coalesce(sum(${yieldAccruals.amountUsd}), 0)` })
        .from(yieldAccruals)
        .where(
          and(
            eq(yieldAccruals.userId, userId),
            sql`${yieldAccruals.day} >= ${fromDay}`,
            sql`${yieldAccruals.day} <= ${toDay}`,
          ),
        );
      return Number(rows[0]?.total ?? 0);
    },

    async insertPayment(input) {
      const inserted = await db
        .insert(yieldPayments)
        .values({
          id: input.id,
          lockId: input.lockId,
          userId: input.userId,
          propertyId: input.propertyId,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          amountUsd: input.amountUsd,
          kind: input.kind,
          status: input.status ?? "paid",
        })
        .onConflictDoNothing({
          target: [yieldPayments.lockId, yieldPayments.periodStart, yieldPayments.periodEnd],
        })
        .returning();
      return inserted[0] ? mapPayment(inserted[0]) : null;
    },

    async listPaymentsByUser(userId, opts = {}) {
      const limit = Math.min(opts.limit ?? 50, 100);
      const rows = await db
        .select()
        .from(yieldPayments)
        .where(eq(yieldPayments.userId, userId))
        .orderBy(desc(yieldPayments.createdAt))
        .limit(limit);
      return rows.map(mapPayment);
    },
  };
}

/** In-memory store for unit tests (no Postgres). */
export function createMemoryYieldStore(): YieldStore & {
  _accruals: YieldAccrualInput[];
  _payments: YieldPaymentRecord[];
} {
  const _accruals: YieldAccrualInput[] = [];
  const _payments: YieldPaymentRecord[] = [];

  return {
    _accruals,
    _payments,

    async insertAccruals(rows) {
      let inserted = 0;
      for (const r of rows) {
        const exists = _accruals.some(
          (a) => a.lockId === r.lockId && a.day === r.day,
        );
        if (exists) continue;
        _accruals.push({ ...r });
        inserted++;
      }
      return inserted;
    },

    async sumAccruedAfter(lockId, afterDay) {
      return _accruals
        .filter(
          (a) => a.lockId === lockId && (afterDay == null || a.day > afterDay),
        )
        .reduce((s, a) => s + a.amountUsd, 0);
    },

    async sumAccruedRange(lockId, fromDay, toDay) {
      return _accruals
        .filter(
          (a) =>
            a.lockId === lockId &&
            a.day <= toDay &&
            (fromDay == null || a.day > fromDay),
        )
        .reduce((s, a) => s + a.amountUsd, 0);
    },

    async maxAccrualDay(lockId) {
      const days = _accruals.filter((a) => a.lockId === lockId).map((a) => a.day);
      return days.length ? days.sort().at(-1)! : null;
    },

    async sumAccruedBetween(userId, fromDay, toDay) {
      return _accruals
        .filter((a) => a.userId === userId && a.day >= fromDay && a.day <= toDay)
        .reduce((s, a) => s + a.amountUsd, 0);
    },

    async insertPayment(input) {
      const exists = _payments.some(
        (p) =>
          p.lockId === input.lockId &&
          p.periodStart === input.periodStart &&
          p.periodEnd === input.periodEnd,
      );
      if (exists) return null;
      const rec: YieldPaymentRecord = {
        id: input.id,
        lockId: input.lockId,
        userId: input.userId,
        propertyId: input.propertyId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        amountUsd: input.amountUsd,
        kind: input.kind,
        status: input.status ?? "paid",
        createdAt: new Date(),
      };
      _payments.push(rec);
      return { ...rec };
    },

    async listPaymentsByUser(userId, opts = {}) {
      const limit = Math.min(opts.limit ?? 50, 100);
      return _payments
        .filter((p) => p.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)
        .map((p) => ({ ...p }));
    },
  };
}
