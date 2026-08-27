// File responsibility: withdrawal installments persistence (locked model). Each
// withdrawal has exactly 4 weekly installments; statuses pending → due (worker tick,
// when due_at passes and the parent is approved) → paid (admin fulfillment, guarded
// single-statement UPDATE so a double mark can never double-pay an installment).
import { and, desc, eq, inArray, lte } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { withdrawalInstallments } from "../db/schema/withdrawal-installments.js";
import { withdrawals } from "../db/schema/withdrawals.js";

export type InstallmentStatus = "pending" | "due" | "paid";

export type WithdrawalInstallmentRecord = {
  id: string;
  withdrawalId: string;
  /** 1..4. */
  seq: number;
  amountUsd: number;
  status: InstallmentStatus;
  dueAt: Date;
  paidAt: Date | null;
  txHash: string | null;
  createdAt: Date;
};

export type NewInstallmentInput = {
  id: string;
  withdrawalId: string;
  seq: number;
  amountUsd: number;
  dueAt: Date;
};

export type WithdrawalInstallmentStore = {
  insertMany(rows: NewInstallmentInput[]): Promise<WithdrawalInstallmentRecord[]>;
  listByWithdrawal(withdrawalId: string): Promise<WithdrawalInstallmentRecord[]>;
  /** Installments for many withdrawals (admin queue, user list) — newest request first. */
  listByWithdrawals(withdrawalIds: string[]): Promise<WithdrawalInstallmentRecord[]>;
  /** pending | due → paid with the admin fulfillment tx hash; null when the transition is not allowed. */
  markInstallmentPaid(id: string, txHash: string, paidAt?: Date): Promise<WithdrawalInstallmentRecord | null>;
  /**
   * Worker tick: pending → due for installments past their due date whose withdrawal
   * is approved. Idempotent — due installments are never touched again.
   */
  markDue(now: Date): Promise<number>;
};

function mapRow(row: {
  id: string;
  withdrawalId: string;
  seq: number;
  amountUsd: number | string;
  status: string;
  dueAt: Date;
  paidAt: Date | null;
  txHash: string | null;
  createdAt: Date;
}): WithdrawalInstallmentRecord {
  return {
    id: row.id,
    withdrawalId: row.withdrawalId,
    seq: Number(row.seq),
    amountUsd: Number(row.amountUsd),
    status: row.status as InstallmentStatus,
    dueAt: row.dueAt,
    paidAt: row.paidAt,
    txHash: row.txHash,
    createdAt: row.createdAt,
  };
}

export function createDbInstallmentStore(db: Db): WithdrawalInstallmentStore {
  return {
    async insertMany(inputs) {
      if (inputs.length === 0) return [];
      const now = new Date();
      const rows = await db
        .insert(withdrawalInstallments)
        .values(
          inputs.map((i) => ({
            id: i.id,
            withdrawalId: i.withdrawalId,
            seq: i.seq,
            amountUsd: i.amountUsd,
            status: "pending",
            dueAt: i.dueAt,
            paidAt: null,
            txHash: null,
            createdAt: now,
          })),
        )
        .returning();
      return rows.map(mapRow);
    },

    async listByWithdrawal(withdrawalId) {
      const rows = await db
        .select()
        .from(withdrawalInstallments)
        .where(eq(withdrawalInstallments.withdrawalId, withdrawalId))
        .orderBy(withdrawalInstallments.seq);
      return rows.map(mapRow);
    },

    async listByWithdrawals(withdrawalIds) {
      if (withdrawalIds.length === 0) return [];
      const rows = await db
        .select()
        .from(withdrawalInstallments)
        .where(inArray(withdrawalInstallments.withdrawalId, withdrawalIds))
        .orderBy(desc(withdrawalInstallments.createdAt), withdrawalInstallments.seq);
      return rows.map(mapRow);
    },

    async markInstallmentPaid(id, txHash, paidAt = new Date()) {
      const rows = await db
        .update(withdrawalInstallments)
        .set({ status: "paid", paidAt, txHash })
        .where(
          and(
            eq(withdrawalInstallments.id, id),
            inArray(withdrawalInstallments.status, ["pending", "due"]),
          ),
        )
        .returning();
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async markDue(now) {
      const approvedIds = db
        .select({ id: withdrawals.id })
        .from(withdrawals)
        .where(eq(withdrawals.status, "approved"));
      const rows = await db
        .update(withdrawalInstallments)
        .set({ status: "due" })
        .where(
          and(
            eq(withdrawalInstallments.status, "pending"),
            lte(withdrawalInstallments.dueAt, now),
            inArray(withdrawalInstallments.withdrawalId, approvedIds),
          ),
        )
        .returning();
      return rows.length;
    },
  };
}

/** In-memory store for unit tests (no Postgres). Mirrors DB guard semantics. */
export function createMemoryInstallmentStore(
  seed: WithdrawalInstallmentRecord[] = [],
): WithdrawalInstallmentStore & { _rows: WithdrawalInstallmentRecord[] } {
  const rows = seed.map((r) => ({ ...r }));
  return {
    _rows: rows,
    async insertMany(inputs) {
      const now = new Date();
      const created = inputs.map((i) => {
        const record: WithdrawalInstallmentRecord = {
          id: i.id,
          withdrawalId: i.withdrawalId,
          seq: i.seq,
          amountUsd: i.amountUsd,
          status: "pending",
          dueAt: i.dueAt,
          paidAt: null,
          txHash: null,
          createdAt: now,
        };
        rows.push(record);
        return { ...record };
      });
      return created;
    },
    async listByWithdrawal(withdrawalId) {
      return rows
        .filter((r) => r.withdrawalId === withdrawalId)
        .sort((a, b) => a.seq - b.seq)
        .map((r) => ({ ...r }));
    },
    async listByWithdrawals(withdrawalIds) {
      return rows
        .filter((r) => withdrawalIds.includes(r.withdrawalId))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.seq - b.seq)
        .map((r) => ({ ...r }));
    },
    async markInstallmentPaid(id, txHash, paidAt = new Date()) {
      const r = rows.find((x) => x.id === id);
      if (!r || (r.status !== "pending" && r.status !== "due")) return null;
      r.status = "paid";
      r.paidAt = paidAt;
      r.txHash = txHash;
      return { ...r };
    },
    async markDue(now) {
      let count = 0;
      for (const r of rows) {
        if (r.status === "pending" && r.dueAt.getTime() <= now.getTime()) {
          r.status = "due";
          count++;
        }
      }
      return count;
    },
  };
}
