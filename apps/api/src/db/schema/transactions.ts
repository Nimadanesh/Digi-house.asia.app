import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { buyIntents } from "./buy-intents.js";
import { properties } from "./properties.js";
import { users } from "./users.js";

/**
 * Ledger of user money movements. Hybrid buy: tx_hash = "simulated:…".
 * buy_intent_id UNIQUE enforces single settle per intent.
 */
export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull(),
    propertyId: text("property_id"),
    shares: integer("shares"),
    amountUsd: bigint("amount_usd", { mode: "number" }).notNull(),
    tonAmount: bigint("ton_amount", { mode: "number" }),
    status: text("status").notNull(),
    txHash: text("tx_hash"),
    error: text("error"),
    buyIntentId: text("buy_intent_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "transactions_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.propertyId],
      foreignColumns: [properties.id],
      name: "transactions_property_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [t.buyIntentId],
      foreignColumns: [buyIntents.id],
      name: "transactions_buy_intent_id_fk",
    }).onDelete("set null"),
    check(
      "transactions_kind_check",
      sql`${t.kind} IN ('buy', 'sell', 'earnings', 'withdraw')`,
    ),
    check(
      "transactions_status_check",
      sql`${t.status} IN ('pending', 'success', 'failed')`,
    ),
    uniqueIndex("transactions_buy_intent_id_uidx").on(t.buyIntentId),
  ],
);

export type TransactionRow = typeof transactions.$inferSelect;
export type NewTransactionRow = typeof transactions.$inferInsert;
