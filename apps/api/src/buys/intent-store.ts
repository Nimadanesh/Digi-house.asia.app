import { and, eq, gt } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { buyIntents } from "../db/schema/buy-intents.js";

export type BuyIntentStatus =
  | "pending"
  | "confirmed"
  | "settled"
  | "expired"
  | "cancelled";

export type BuyCurrency = "TON" | "USDT";

export type BuyIntentRecord = {
  id: string;
  userId: string;
  propertyId: string;
  quantity: number;
  priceUsdPerShare: number;
  totalUsd: number;
  /** Primary-market commission (FractionalLuxe revenue), integer cents; null pre-0028. */
  feeUsd: number | null;
  status: BuyIntentStatus;
  boc: string | null;
  /** Receive address returned by prepare (admin TON wallet / admin USDT wallet). */
  destinationAddress: string | null;
  /** The connected wallet that prepared the intent — the only acceptable payer at verify time. */
  paidByWallet: string | null;
  /** Payment rail chosen at prepare. */
  currency: BuyCurrency;
  /** Payable nanoTON returned by prepare (decimal string); null for USDT intents. */
  expectedNanoTon: string | null;
  /** Payable Jetton amount in base units (decimal string); null for TON intents. */
  expectedJettonAmount: string | null;
  /** Wallet-signed message hash recorded at confirm, verified before settlement. */
  txHash: string | null;
  expiresAt: Date;
  confirmedAt: Date | null;
  settledAt: Date | null;
  createdAt: Date;
};

export type MarkSettledResult =
  | { ok: true; intent: BuyIntentRecord }
  | {
      ok: false;
      reason: "not_found" | "not_owned" | "not_confirmed" | "already_settled";
    };

export type IntentStore = {
  create(input: {
    id: string;
    userId: string;
    propertyId: string;
    quantity: number;
    priceUsdPerShare: number;
    totalUsd: number;
    feeUsd?: number | null;
    destinationAddress: string;
    paidByWallet?: string | null;
    currency?: BuyCurrency;
    expectedNanoTon?: string | null;
    expectedJettonAmount?: string | null;
    expiresAt: Date;
  }): Promise<BuyIntentRecord>;
  getById(id: string): Promise<BuyIntentRecord | null>;
  /** Return the intent that consumed a txHash (null when unused) — the tx-hash replay guard. */
  findByTxHash(txHash: string): Promise<BuyIntentRecord | null>;
  /**
   * Atomically claim a pending, non-expired intent for userId.
   * Sets status=confirmed, optional boc + txHash, confirmed_at.
   */
  markConfirmedIfPending(
    id: string,
    userId: string,
    now: Date,
    payment?: { boc?: string | null; txHash?: string | null },
  ): Promise<
    | { ok: true; intent: BuyIntentRecord }
    | {
        ok: false;
        reason: "not_found" | "not_owned" | "not_pending" | "expired";
      }
  >;
  /**
   * Atomically claim a confirmed intent for userId as settled (status=settled, settled_at=now).
   * Double-settlement guard: only confirmed → settled once.
   */
  markSettled(id: string, userId: string, now: Date): Promise<MarkSettledResult>;
};

function mapStatus(s: string): BuyIntentStatus {
  if (
    s === "pending" ||
    s === "confirmed" ||
    s === "settled" ||
    s === "expired" ||
    s === "cancelled"
  ) {
    return s;
  }
  return "cancelled";
}

function mapCurrency(s: string | null): BuyCurrency {
  return s === "USDT" ? "USDT" : "TON";
}

function mapRow(r: {
  id: string;
  userId: string;
  propertyId: string;
  quantity: number;
  priceUsdPerShare: number;
  totalUsd: number;
  feeUsd: number | null;
  status: string;
  boc: string | null;
  destinationAddress: string | null;
  paidByWallet: string | null;
  currency: string | null;
  expectedNanoTon: string | null;
  expectedJettonAmount: string | null;
  txHash: string | null;
  expiresAt: Date;
  confirmedAt: Date | null;
  settledAt: Date | null;
  createdAt: Date;
}): BuyIntentRecord {
  return {
    id: r.id,
    userId: r.userId,
    propertyId: r.propertyId,
    quantity: Number(r.quantity),
    priceUsdPerShare: Number(r.priceUsdPerShare),
    totalUsd: Number(r.totalUsd),
    feeUsd: r.feeUsd != null ? Number(r.feeUsd) : null,
    status: mapStatus(r.status),
    boc: r.boc,
    destinationAddress: r.destinationAddress,
    paidByWallet: r.paidByWallet,
    currency: mapCurrency(r.currency),
    expectedNanoTon: r.expectedNanoTon,
    expectedJettonAmount: r.expectedJettonAmount,
    txHash: r.txHash,
    expiresAt: r.expiresAt,
    confirmedAt: r.confirmedAt,
    settledAt: r.settledAt,
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
          feeUsd: input.feeUsd ?? null,
          status: "pending",
          boc: null,
          destinationAddress: input.destinationAddress,
          paidByWallet: input.paidByWallet ?? null,
          currency: input.currency ?? "TON",
          expectedNanoTon: input.expectedNanoTon ?? null,
          expectedJettonAmount: input.expectedJettonAmount ?? null,
          txHash: null,
          expiresAt: input.expiresAt,
          confirmedAt: null,
          settledAt: null,
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

    async findByTxHash(txHash) {
      const rows = await db
        .select()
        .from(buyIntents)
        .where(eq(buyIntents.txHash, txHash))
        .limit(1);
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async markConfirmedIfPending(id, userId, now, payment) {
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
          .where(and(eq(buyIntents.id, id), eq(buyIntents.status, "pending")));
        return { ok: false, reason: "expired" };
      }

      const rows = await db
        .update(buyIntents)
        .set({
          status: "confirmed",
          confirmedAt: now,
          boc: payment?.boc ?? null,
          txHash: payment?.txHash ?? null,
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

    async markSettled(id, userId, now) {
      const existing = await this.getById(id);
      if (!existing) return { ok: false, reason: "not_found" };
      if (existing.userId !== userId) return { ok: false, reason: "not_owned" };
      if (existing.status === "settled") {
        return { ok: false, reason: "already_settled" };
      }
      if (existing.status !== "confirmed") {
        return { ok: false, reason: "not_confirmed" };
      }

      const rows = await db
        .update(buyIntents)
        .set({ status: "settled", settledAt: now })
        .where(
          and(
            eq(buyIntents.id, id),
            eq(buyIntents.userId, userId),
            eq(buyIntents.status, "confirmed"),
          ),
        )
        .returning();
      const row = rows[0];
      if (!row) {
        const again = await this.getById(id);
        if (again?.status === "settled") {
          return { ok: false, reason: "already_settled" };
        }
        return { ok: false, reason: "not_confirmed" };
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
        feeUsd: input.feeUsd ?? null,
        status: "pending",
        boc: null,
        destinationAddress: input.destinationAddress,
        paidByWallet: input.paidByWallet ?? null,
        currency: input.currency ?? "TON",
        expectedNanoTon: input.expectedNanoTon ?? null,
        expectedJettonAmount: input.expectedJettonAmount ?? null,
        txHash: null,
        expiresAt: input.expiresAt,
        confirmedAt: null,
        settledAt: null,
        createdAt: now,
      };
      rows.push(record);
      return { ...record };
    },

    async getById(id) {
      const row = rows.find((r) => r.id === id);
      return row ? { ...row } : null;
    },

    async findByTxHash(txHash) {
      const row = rows.find((r) => r.txHash === txHash);
      return row ? { ...row } : null;
    },

    async markConfirmedIfPending(id, userId, now, payment) {
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
        boc: payment?.boc ?? null,
        txHash: payment?.txHash ?? null,
      };
      rows[idx] = updated;
      return { ok: true, intent: { ...updated } };
    },

    async markSettled(id, userId, now) {
      const idx = rows.findIndex((r) => r.id === id);
      if (idx < 0) return { ok: false, reason: "not_found" };
      const existing = rows[idx]!;
      if (existing.userId !== userId) return { ok: false, reason: "not_owned" };
      if (existing.status === "settled") {
        return { ok: false, reason: "already_settled" };
      }
      if (existing.status !== "confirmed") {
        return { ok: false, reason: "not_confirmed" };
      }
      const updated: BuyIntentRecord = {
        ...existing,
        status: "settled",
        settledAt: now,
      };
      rows[idx] = updated;
      return { ok: true, intent: { ...updated } };
    },
  };
}
