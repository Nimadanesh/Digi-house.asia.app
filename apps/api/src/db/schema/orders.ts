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
 * Secondary-market limit orders (off-chain book first).
 * price_usd = integer cents per share. quantity/filled = integers.
 * Authz key = user_id (never maker_address alone).
 */
export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    propertyId: text("property_id").notNull(),
    makerAddress: text("maker_address").notNull(),
    side: text("side").notNull(),
    priceUsd: bigint("price_usd", { mode: "number" }).notNull(),
    quantity: integer("quantity").notNull(),
    filledQuantity: integer("filled_quantity").notNull().default(0),
    status: text("status").notNull(),
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
      name: "orders_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.propertyId],
      foreignColumns: [properties.id],
      name: "orders_property_id_fk",
    }).onDelete("cascade"),
    check("orders_side_check", sql`${t.side} IN ('buy', 'sell')`),
    check(
      "orders_status_check",
      sql`${t.status} IN ('open', 'filled', 'cancelled', 'rejected')`,
    ),
    check("orders_price_pos", sql`${t.priceUsd} > 0`),
    check("orders_quantity_pos", sql`${t.quantity} > 0`),
    check("orders_filled_nonneg", sql`${t.filledQuantity} >= 0`),
    index("orders_property_status_idx").on(t.propertyId, t.status),
    index("orders_user_status_idx").on(t.userId, t.status),
    index("orders_user_id_idx").on(t.userId),
  ],
);

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
