import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { withdrawals } from "./withdrawals.js";

/**
 * Exactly 4 weekly installments per withdrawal (FractionalLuxe locked model).
 * amount_usd = one installment of the net amount (gross − 1% fee); the four
 * installments always sum exactly to the net amount. Status flow:
 * pending → due (worker, when due_at passes) → paid (admin fulfillment, tx_hash).
 */
export const withdrawalInstallments = pgTable(
  "withdrawal_installments",
  {
    id: text("id").primaryKey(),
    withdrawalId: text("withdrawal_id").notNull(),
    /** 1..4 — the installment number within the withdrawal. */
    seq: integer("seq").notNull(),
    /** Integer cents. Zero allowed only for dust-sized nets (policy: exact sum). */
    amountUsd: bigint("amount_usd", { mode: "number" }).notNull(),
    status: text("status").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    txHash: text("tx_hash"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.withdrawalId],
      foreignColumns: [withdrawals.id],
      name: "withdrawal_installments_withdrawal_id_fk",
    }).onDelete("cascade"),
    check(
      "withdrawal_installments_seq_range_check",
      sql`${t.seq} IN (1, 2, 3, 4)`,
    ),
    check(
      "withdrawal_installments_amount_nonneg_check",
      sql`${t.amountUsd} >= 0`,
    ),
    check(
      "withdrawal_installments_status_check",
      sql`${t.status} IN ('pending', 'due', 'paid')`,
    ),
    index("withdrawal_installments_withdrawal_idx").on(t.withdrawalId, t.seq),
  ],
);

export type WithdrawalInstallmentRow = typeof withdrawalInstallments.$inferSelect;
export type NewWithdrawalInstallmentRow = typeof withdrawalInstallments.$inferInsert;
