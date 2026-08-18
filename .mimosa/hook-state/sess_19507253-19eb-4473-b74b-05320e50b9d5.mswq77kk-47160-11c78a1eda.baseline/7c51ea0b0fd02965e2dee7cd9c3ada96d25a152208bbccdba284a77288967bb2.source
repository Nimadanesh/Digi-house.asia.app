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
 * Instant sells (PRODUCT-PLAN §0.3): while a property is in its primary offering the
 * platform is the only buyer — shares are bought back at list price − 7% and return
 * to the primary supply. Settled immediately (off-chain ledger credit).
 */
export const instantSells = pgTable(
  "instant_sells",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    propertyId: text("property_id").notNull(),
    shares: integer("shares").notNull(),
    /** Snapshot of list price at settlement, integer cents. */
    sharePriceUsd: bigint("share_price_usd", { mode: "number" }).notNull(),
    grossUsd: bigint("gross_usd", { mode: "number" }).notNull(),
    feeUsd: bigint("fee_usd", { mode: "number" }).notNull(),
    netUsd: bigint("net_usd", { mode: "number" }).notNull(),
    status: text("status").$type<"settled">().notNull(),
    transactionId: text("transaction_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "instant_sells_user_id_users_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.propertyId],
      foreignColumns: [properties.id],
      name: "instant_sells_property_id_properties_id_fk",
    }).onDelete("cascade"),
    check("instant_sells_shares_pos_check", sql`${t.shares} > 0`),
    check(
      "instant_sells_nonneg_check",
      sql`${t.grossUsd} >= 0 AND ${t.feeUsd} >= 0 AND ${t.netUsd} >= 0`,
    ),
    index("instant_sells_user_idx").on(t.userId, t.createdAt),
  ],
);

export type InstantSellRow = typeof instantSells.$inferSelect;
export type NewInstantSellRow = typeof instantSells.$inferInsert;
