import type { Db } from "../db/client.js";
import { transactions } from "../db/schema/transactions.js";

export type TxKind = "buy" | "sell" | "earnings" | "withdraw";
export type TxStatus = "pending" | "success" | "failed";

export type TransactionRecord = {
  id: string;
  userId: string;
  kind: TxKind;
  propertyId: string | null;
  shares: number | null;
  amountUsd: number;
  tonAmount: number | null;
  status: TxStatus;
  txHash: string | null;
  error: string | null;
  buyIntentId: string | null;
  createdAt: Date;
};

export type TransactionPublic = {
  id: string;
  kind: TxKind;
  propertyId?: string;
  userId: string;
  shares?: number;
  amountUsd: number;
  tonAmount?: number;
  status: TxStatus;
  txHash?: string;
  error?: string;
  createdAt: string;
};

export type TxStore = {
  insert(input: {
    id: string;
    userId: string;
    kind: TxKind;
    propertyId?: string | null;
    shares?: number | null;
    amountUsd: number;
    tonAmount?: number | null;
    status: TxStatus;
    txHash?: string | null;
    error?: string | null;
    buyIntentId?: string | null;
  }): Promise<TransactionRecord>;
};

export function mapTransactionPublic(r: TransactionRecord): TransactionPublic {
  const out: TransactionPublic = {
    id: r.id,
    kind: r.kind,
    userId: r.userId,
    amountUsd: r.amountUsd,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
  if (r.propertyId) out.propertyId = r.propertyId;
  if (r.shares != null) out.shares = r.shares;
  if (r.tonAmount != null) out.tonAmount = r.tonAmount;
  if (r.txHash) out.txHash = r.txHash;
  if (r.error) out.error = r.error;
  return out;
}

function mapKind(s: string): TxKind {
  if (s === "buy" || s === "sell" || s === "earnings" || s === "withdraw") {
    return s;
  }
  return "buy";
}

function mapStatus(s: string): TxStatus {
  if (s === "pending" || s === "success" || s === "failed") return s;
  return "failed";
}

export function createDbTxStore(db: Db): TxStore {
  return {
    async insert(input) {
      const now = new Date();
      const rows = await db
        .insert(transactions)
        .values({
          id: input.id,
          userId: input.userId,
          kind: input.kind,
          propertyId: input.propertyId ?? null,
          shares: input.shares ?? null,
          amountUsd: input.amountUsd,
          tonAmount: input.tonAmount ?? null,
          status: input.status,
          txHash: input.txHash ?? null,
          error: input.error ?? null,
          buyIntentId: input.buyIntentId ?? null,
          createdAt: now,
        })
        .returning();
      const row = rows[0];
      if (!row) throw new Error("insert transaction returned no row");
      return {
        id: row.id,
        userId: row.userId,
        kind: mapKind(row.kind),
        propertyId: row.propertyId,
        shares: row.shares,
        amountUsd: Number(row.amountUsd),
        tonAmount: row.tonAmount != null ? Number(row.tonAmount) : null,
        status: mapStatus(row.status),
        txHash: row.txHash,
        error: row.error,
        buyIntentId: row.buyIntentId,
        createdAt: row.createdAt,
      };
    },
  };
}

export function createMemoryTxStore(
  seed: TransactionRecord[] = [],
): TxStore & { _rows: TransactionRecord[] } {
  const rows = seed.map((r) => ({ ...r }));
  return {
    _rows: rows,
    async insert(input) {
      if (
        input.buyIntentId &&
        rows.some((r) => r.buyIntentId === input.buyIntentId)
      ) {
        throw new Error("duplicate buy_intent_id");
      }
      const record: TransactionRecord = {
        id: input.id,
        userId: input.userId,
        kind: input.kind,
        propertyId: input.propertyId ?? null,
        shares: input.shares ?? null,
        amountUsd: input.amountUsd,
        tonAmount: input.tonAmount ?? null,
        status: input.status,
        txHash: input.txHash ?? null,
        error: input.error ?? null,
        buyIntentId: input.buyIntentId ?? null,
        createdAt: new Date(),
      };
      rows.push(record);
      return { ...record };
    },
  };
}
