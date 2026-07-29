import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { payoutTicks } from "../db/schema/payout-ticks.js";

export type PayoutTickStore = {
  /**
   * Insert idempotency row. Returns "duplicate" if key already exists
   * (second tick is a no-op).
   */
  tryInsert(input: {
    idempotencyKey: string;
    distributionId: string;
    paidEntries: number;
  }): Promise<"inserted" | "duplicate">;
  hasKey(idempotencyKey: string): Promise<boolean>;
};

/** Idempotency key = `${propertyId}#${weekOf}` (ADR-003 double-tick). */
export function payoutIdempotencyKey(
  propertyId: string,
  weekOf: string,
): string {
  const day =
    weekOf.length >= 10 && weekOf[4] === "-"
      ? weekOf.slice(0, 10)
      : weekOf;
  return `${propertyId}#${day}`;
}

export function createDbPayoutTickStore(db: Db): PayoutTickStore {
  return {
    async tryInsert(input) {
      try {
        await db.insert(payoutTicks).values({
          idempotencyKey: input.idempotencyKey,
          distributionId: input.distributionId,
          paidEntries: input.paidEntries,
          createdAt: new Date(),
        });
        return "inserted";
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("unique") ||
          msg.includes("duplicate") ||
          msg.includes("payout_ticks_pkey")
        ) {
          return "duplicate";
        }
        throw err;
      }
    },

    async hasKey(idempotencyKey) {
      const rows = await db
        .select({ k: payoutTicks.idempotencyKey })
        .from(payoutTicks)
        .where(eq(payoutTicks.idempotencyKey, idempotencyKey))
        .limit(1);
      return rows.length > 0;
    },
  };
}

export function createMemoryPayoutTickStore(): PayoutTickStore & {
  _keys: Set<string>;
} {
  const keys = new Set<string>();
  return {
    _keys: keys,
    async tryInsert(input) {
      if (keys.has(input.idempotencyKey)) return "duplicate";
      keys.add(input.idempotencyKey);
      return "inserted";
    },
    async hasKey(idempotencyKey) {
      return keys.has(idempotencyKey);
    },
  };
}
