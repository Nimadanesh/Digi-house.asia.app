import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  doublePrecision,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { properties } from "./properties.js";
import { rentalDistributions } from "./rental-distributions.js";
import { users } from "./users.js";

/**
 * Per-user weekly earnings against a distribution.
 * amount_usd / ton_amount stored as integers (floor math at write time).
 * Paid hybrid/mock: tx_hash = "simulated:…"; pending: null.
 */
export const earningsEntries = pgTable(
  "earnings_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    propertyId: text("property_id").notNull(),
    distributionId: text("distribution_id").notNull(),
    weekOf: date("week_of", { mode: "string" }).notNull(),
    amountUsd: bigint("amount_usd", { mode: "number" }).notNull(),
    tonAmount: bigint("ton_amount", { mode: "number" }).notNull(),
    shareRatio: doublePrecision("share_ratio").notNull(),
    status: text("status").notNull(),
    txHash: text("tx_hash"),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "earnings_entries_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.propertyId],
      foreignColumns: [properties.id],
      name: "earnings_entries_property_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.distributionId],
      foreignColumns: [rentalDistributions.id],
      name: "earnings_entries_distribution_id_fk",
    }).onDelete("cascade"),
    check(
      "earnings_entries_status_check",
      sql`${t.status} IN ('paid', 'pending')`,
    ),
    uniqueIndex("earnings_entries_user_distribution_uidx").on(
      t.userId,
      t.distributionId,
    ),
    index("earnings_entries_user_id_idx").on(t.userId),
    index("earnings_entries_distribution_id_idx").on(t.distributionId),
    index("earnings_entries_user_week_idx").on(t.userId, t.weekOf),
  ],
);

export type EarningsEntryRow = typeof earningsEntries.$inferSelect;
export type NewEarningsEntryRow = typeof earningsEntries.$inferInsert;
