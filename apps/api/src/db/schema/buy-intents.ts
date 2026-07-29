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
import { properties } from "./properties.js";
import { users } from "./users.js";

/**
 * One-time primary-sale buy intents (user-bound, expiring).
 * Hybrid confirm settles holdings in Postgres without jetton mint (ADR-001).
 */
export const buyIntents = pgTable(
  "buy_intents",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    propertyId: text("property_id").notNull(),
    quantity: integer("quantity").notNull(),
    priceUsdPerShare: bigint("price_usd_per_share", { mode: "number" }).notNull(),
    totalUsd: bigint("total_usd", { mode: "number" }).notNull(),
    status: text("status").notNull(),
    boc: text("boc"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "buy_intents_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.propertyId],
      foreignColumns: [properties.id],
      name: "buy_intents_property_id_fk",
    }).onDelete("cascade"),
    check(
      "buy_intents_status_check",
      sql`${t.status} IN ('pending', 'confirmed', 'expired', 'cancelled')`,
    ),
    check("buy_intents_quantity_pos", sql`${t.quantity} > 0`),
    index("buy_intents_user_id_idx").on(t.userId),
    index("buy_intents_status_expires_idx").on(t.status, t.expiresAt),
  ],
);

export type BuyIntentRow = typeof buyIntents.$inferSelect;
export type NewBuyIntentRow = typeof buyIntents.$inferInsert;
