import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { properties } from "./properties.js";

/**
 * Weekly rental distribution schedule per property.
 * Money: rent_pool_usd = integer cents; rent_pool_nano_ton = integer nanoTON.
 * Worker (P1-13) advances status; this task is read + seed only.
 */
export const rentalDistributions = pgTable(
  "rental_distributions",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id").notNull(),
    weekOf: date("week_of", { mode: "string" }).notNull(),
    rentPoolUsd: bigint("rent_pool_usd", { mode: "number" }).notNull(),
    rentPoolNanoTon: bigint("rent_pool_nano_ton", { mode: "number" }).notNull(),
    payoutDay: date("payout_day", { mode: "string" }).notNull(),
    status: text("status").notNull(),
    totalShares: integer("total_shares").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.propertyId],
      foreignColumns: [properties.id],
      name: "rental_distributions_property_id_fk",
    }).onDelete("cascade"),
    check(
      "rental_distributions_status_check",
      sql`${t.status} IN ('scheduled', 'distributing', 'completed')`,
    ),
    check(
      "rental_distributions_total_shares_pos",
      sql`${t.totalShares} > 0`,
    ),
    index("rental_distributions_property_id_idx").on(t.propertyId),
    uniqueIndex("rental_distributions_property_week_uidx").on(
      t.propertyId,
      t.weekOf,
    ),
  ],
);

export type RentalDistributionRow = typeof rentalDistributions.$inferSelect;
export type NewRentalDistributionRow =
  typeof rentalDistributions.$inferInsert;
