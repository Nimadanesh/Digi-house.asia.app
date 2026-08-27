// File responsibility: withdrawals persistence (PE-02). Status transitions are guarded
// single-statement UPDATEs (return null when the current status doesn't allow the move)
// so a double approve/reject/paid race can never corrupt a record.
import { and, desc, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { withdrawals } from "../db/schema/withdrawals.js";

export type WithdrawalStatus = "requested" | "approved" | "rejected" | "paid";

export type WithdrawalRecord = {
  id: string;
  userId: string;
  /** Integer cents, debited from withdrawable at request time. */
  amountUsd: number;
  /** 1% withdrawal fee (FractionalLuxe revenue), integer cents. */
  feeUsd: number;
  /** Address snapshot at request time. */
  address: string;
  status: WithdrawalStatus;
  txHash: string | null;
  /** Ledger `transactions` row id (kind 'withdraw'). */
  transactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type WithdrawalStore = {
  insert(input: {
    id: string;
    userId: string;
    amountUsd: number;
    feeUsd?: number;
    address: string;
    status: WithdrawalStatus;
    transactionId?: string | null;
  }): Promise<WithdrawalRecord>;
  get(id: string): Promise<WithdrawalRecord | null>;
  listByUser(userId: string): Promise<WithdrawalRecord[]>;
  /** Admin queue (PE-03) — all requests, newest first, optionally filtered by status. */
  listAll(opts?: { status?: WithdrawalStatus }): Promise<WithdrawalRecord[]>;
  /** requested → approved. */
  markApproved(id: string): Promise<WithdrawalRecord | null>;
  /** approved (or requested) → paid, with the admin fulfillment tx hash. */
  markPaid(id: string, txHash: string): Promise<WithdrawalRecord | null>;
  /** requested | approved → rejected. Refund is the service's job (PE-02). */
  markRejected(id: string): Promise<WithdrawalRecord | null>;
};

function mapRow(row: {
  id: string;
  userId: string;
  amountUsd: number | string;
  feeUsd: number | string;
  address: string;
  status: string;
  txHash: string | null;
  transactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): WithdrawalRecord {
  return {
    id: row.id,
    userId: row.userId,
    amountUsd: Number(row.amountUsd),
    feeUsd: Number(row.feeUsd),
    address: row.address,
    status: row.status as WithdrawalStatus,
    txHash: row.txHash,
    transactionId: row.transactionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createDbWithdrawalStore(db: Db): WithdrawalStore {
  return {
    async insert(input) {
      const now = new Date();
      const rows = await db
        .insert(withdrawals)
        .values({
          id: input.id,
          userId: input.userId,
          amountUsd: input.amountUsd,
          feeUsd: input.feeUsd ?? 0,
          address: input.address,
          status: input.status,
          txHash: null,
          transactionId: input.transactionId ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      const row = rows[0];
      if (!row) throw new Error("insert withdrawal returned no row");
      return mapRow(row);
    },

    async get(id) {
      const rows = await db
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.id, id))
        .limit(1);
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async listByUser(userId) {
      const rows = await db
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.userId, userId))
        .orderBy(desc(withdrawals.createdAt));
      return rows.map(mapRow);
    },

    async listAll(opts = {}) {
      const rows = await db
        .select()
        .from(withdrawals)
        .where(opts.status ? eq(withdrawals.status, opts.status) : undefined)
        .orderBy(desc(withdrawals.createdAt));
      return rows.map(mapRow);
    },

    async markApproved(id) {
      const rows = await db
        .update(withdrawals)
        .set({ status: "approved", updatedAt: new Date() })
        .where(and(eq(withdrawals.id, id), sql`${withdrawals.status} = 'requested'`))
        .returning();
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async markPaid(id, txHash) {
      const rows = await db
        .update(withdrawals)
        .set({ status: "paid", txHash, updatedAt: new Date() })
        .where(
          and(
            eq(withdrawals.id, id),
            sql`${withdrawals.status} IN ('requested', 'approved')`,
          ),
        )
        .returning();
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async markRejected(id) {
      const rows = await db
        .update(withdrawals)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(
          and(
            eq(withdrawals.id, id),
            sql`${withdrawals.status} IN ('requested', 'approved')`,
          ),
        )
        .returning();
      const row = rows[0];
      return row ? mapRow(row) : null;
    },
  };
}

/** In-memory store for unit tests (no Postgres). Mirrors DB guard semantics. */
export function createMemoryWithdrawalStore(
  seed: WithdrawalRecord[] = [],
): WithdrawalStore & { _rows: WithdrawalRecord[] } {
  const rows = seed.map((r) => ({ ...r }));
  return {
    _rows: rows,
    async insert(input) {
      const now = new Date();
      const record: WithdrawalRecord = {
        id: input.id,
        userId: input.userId,
        amountUsd: input.amountUsd,
        feeUsd: input.feeUsd ?? 0,
        address: input.address,
        status: input.status,
        txHash: null,
        transactionId: input.transactionId ?? null,
        createdAt: now,
        updatedAt: now,
      };
      rows.push(record);
      return { ...record };
    },
    async get(id) {
      const r = rows.find((x) => x.id === id);
      return r ? { ...r } : null;
    },
    async listByUser(userId) {
      return rows
        .filter((r) => r.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((r) => ({ ...r }));
    },
    async listAll(opts = {}) {
      return rows
        .filter((r) => (opts.status ? r.status === opts.status : true))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((r) => ({ ...r }));
    },
    async markApproved(id) {
      const r = rows.find((x) => x.id === id);
      if (!r || r.status !== "requested") return null;
      r.status = "approved";
      r.updatedAt = new Date();
      return { ...r };
    },
    async markPaid(id, txHash) {
      const r = rows.find((x) => x.id === id);
      if (!r || (r.status !== "requested" && r.status !== "approved")) return null;
      r.status = "paid";
      r.txHash = txHash;
      r.updatedAt = new Date();
      return { ...r };
    },
    async markRejected(id) {
      const r = rows.find((x) => x.id === id);
      if (!r || (r.status !== "requested" && r.status !== "approved")) return null;
      r.status = "rejected";
      r.updatedAt = new Date();
      return { ...r };
    },
  };
}
