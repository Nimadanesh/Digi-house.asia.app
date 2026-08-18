import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * USDT payout requests (PE-02). amount_usd = integer cents, debited from the
 * withdrawable balance atomically at request time. Status flow:
 * requested → approved → paid (manual admin fulfillment), or rejected (refunded).
 */
export const withdrawals = pgTable(
  "withdrawals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    amountUsd: bigint("amount_usd", { mode: "number" }).notNull(),
    /** Address snapshot at request time (the user's withdrawal address). */
    address: text("address").notNull(),
    status: text("status").notNull(),
    txHash: text("tx_hash"),
    /** Ledger `transactions` row id (kind 'withdraw'), for the PE-09 history view. */
    transactionId: text("transaction_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "withdrawals_user_id_fk",
    }).onDelete("cascade"),
    check("withdrawals_amount_pos_check", sql`${t.amountUsd} > 0`),
    check(
      "withdrawals_status_check",
      sql`${t.status} IN ('requested', 'approved', 'rejected', 'paid')`,
    ),
    index("withdrawals_user_created_idx").on(t.userId, t.createdAt),
  ],
);

export type WithdrawalRow = typeof withdrawals.$inferSelect;
export type NewWithdrawalRow = typeof withdrawals.$inferInsert;
