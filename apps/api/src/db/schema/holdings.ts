import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { properties } from "./properties.js";
import { users } from "./users.js";

/**
 * User share holdings — composite PK (user_id, property_id).
 * Money: avg_cost_usd = integer cents per share.
 * Derived fields (share_ratio, current_value, pending earnings) are NOT stored.
 */
export const holdings = pgTable(
  "holdings",
  {
    userId: text("user_id").notNull(),
    propertyId: text("property_id").notNull(),
    sharesOwned: integer("shares_owned").notNull(),
    avgCostUsd: bigint("avg_cost_usd", { mode: "number" }).notNull(),
    jettonWalletAddress: text("jetton_wallet_address"),
    jettonBalance: bigint("jetton_balance", { mode: "number" }).default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.propertyId] }),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "holdings_user_id_users_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.propertyId],
      foreignColumns: [properties.id],
      name: "holdings_property_id_properties_id_fk",
    }).onDelete("cascade"),
    check("holdings_shares_owned_pos", sql`${t.sharesOwned} > 0`),
    index("holdings_user_id_idx").on(t.userId),
  ],
);

export type HoldingRow = typeof holdings.$inferSelect;
export type NewHoldingRow = typeof holdings.$inferInsert;
