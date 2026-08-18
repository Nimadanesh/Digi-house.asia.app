import { eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { balances } from "../db/schema/balances.js";

export type BalanceRecord = {
  userId: string;
  investingUsd: number;
  withdrawableUsd: number;
  updatedAt: Date;
};

/** Thrown when a debit would push either balance below zero. */
export class InsufficientBalanceError extends Error {
  constructor(
    readonly userId: string,
    readonly which: "investing" | "withdrawable",
  ) {
    super(`insufficient ${which} balance for user ${userId}`);
    this.name = "InsufficientBalanceError";
  }
}

export type BalanceAdjustment = {
  investingDelta?: number;
  withdrawableDelta?: number;
};

export type BalanceStore = {
  get(userId: string): Promise<BalanceRecord | null>;
  /**
   * Atomically apply signed deltas to both balances. Single guarded UPDATE on
   * the DB (conditional, returns no row when a balance would go negative);
   * the caller is expected to have the ledger `transactions` write in the same
   * logical flow. Idempotence is the caller's concern (e.g. unique buy_intent_id).
   */
  adjust(userId: string, delta: BalanceAdjustment): Promise<BalanceRecord>;
};

function assertIntegerCents(delta: BalanceAdjustment) {
  for (const v of [delta.investingDelta, delta.withdrawableDelta]) {
    if (v != null && (!Number.isInteger(v) || v === 0)) {
      throw new Error("balance deltas must be non-zero integer cents");
    }
  }
}

export function createDbBalanceStore(db: Db): BalanceStore {
  return {
    async get(userId) {
      const rows = await db
        .select()
        .from(balances)
        .where(eq(balances.userId, userId))
        .limit(1);
      const row = rows[0];
      return row
        ? {
            userId: row.userId,
            investingUsd: Number(row.investingUsd),
            withdrawableUsd: Number(row.withdrawableUsd),
            updatedAt: row.updatedAt,
          }
        : null;
    },

    async adjust(userId, delta) {
      assertIntegerCents(delta);
      const inv = delta.investingDelta ?? 0;
      const wd = delta.withdrawableDelta ?? 0;
      // Ensure the row exists (zero balances), then move money in one guarded
      // statement — the WHERE clause is the overdraft protection.
      await db
        .insert(balances)
        .values({ userId })
        .onConflictDoNothing({ target: balances.userId });
      const rows = await db
        .update(balances)
        .set({
          investingUsd: sql`${balances.investingUsd} + ${inv}`,
          withdrawableUsd: sql`${balances.withdrawableUsd} + ${wd}`,
          updatedAt: new Date(),
        })
        .where(
          sql`${balances.userId} = ${userId} AND ${balances.investingUsd} + ${inv} >= 0 AND ${balances.withdrawableUsd} + ${wd} >= 0`,
        )
        .returning();
      const row = rows[0];
      if (!row) {
        throw new InsufficientBalanceError(
          userId,
          inv < 0 ? "investing" : "withdrawable",
        );
      }
      return {
        userId: row.userId,
        investingUsd: Number(row.investingUsd),
        withdrawableUsd: Number(row.withdrawableUsd),
        updatedAt: row.updatedAt,
      };
    },
  };
}

/** In-memory store for unit tests (no Postgres). Mirrors DB guard semantics. */
export function createMemoryBalanceStore(): BalanceStore & {
  _rows: Map<string, BalanceRecord>;
} {
  const _rows = new Map<string, BalanceRecord>();
  return {
    _rows,
    async get(userId) {
      const row = _rows.get(userId);
      return row ? { ...row } : null;
    },
    async adjust(userId, delta) {
      assertIntegerCents(delta);
      const row =
        _rows.get(userId) ??
        ({
          userId,
          investingUsd: 0,
          withdrawableUsd: 0,
          updatedAt: new Date(),
        } satisfies BalanceRecord);
      const inv = row.investingUsd + (delta.investingDelta ?? 0);
      const wd = row.withdrawableUsd + (delta.withdrawableDelta ?? 0);
      if (inv < 0) throw new InsufficientBalanceError(userId, "investing");
      if (wd < 0) throw new InsufficientBalanceError(userId, "withdrawable");
      const next: BalanceRecord = {
        userId,
        investingUsd: inv,
        withdrawableUsd: wd,
        updatedAt: new Date(),
      };
      _rows.set(userId, next);
      return { ...next };
    },
  };
}
