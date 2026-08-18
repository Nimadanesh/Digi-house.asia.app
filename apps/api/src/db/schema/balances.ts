import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * Dual in-app money balances per user (PRODUCT-PLAN §0.6). Money: integer cents.
 * investing — proceeds of sales, spendable on new purchases.
 * withdrawable — yield credits and withdrawable funds (USDT-TON out).
 * Mutations must go through the atomic BalanceStore adjust(); never read-modify-write.
 */
export const balances = pgTable(
  "balances",
  {
    userId: text("user_id").notNull(),
    investingUsd: bigint("investing_usd", { mode: "number" })
      .notNull()
      .default(0),
    withdrawableUsd: bigint("withdrawable_usd", { mode: "number" })
      .notNull()
      .default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "balances_user_id_users_id_fk",
    }).onDelete("cascade"),
    check(
      "balances_nonneg_check",
      sql`${t.investingUsd} >= 0 AND ${t.withdrawableUsd} >= 0`,
    ),
  ],
);

export type BalanceRow = typeof balances.$inferSelect;
export type NewBalanceRow = typeof balances.$inferInsert;
