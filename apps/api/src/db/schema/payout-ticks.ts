import { foreignKey, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { rentalDistributions } from "./rental-distributions.js";

/**
 * Idempotency ledger for hybrid tickPayout (ADR-003).
 * PK idempotency_key = `${propertyId}#${weekOf}` — one successful tick per week/property.
 * No on-chain transfer; hybrid ledger only (ADR-001).
 */
export const payoutTicks = pgTable(
  "payout_ticks",
  {
    idempotencyKey: text("idempotency_key").primaryKey(),
    distributionId: text("distribution_id").notNull(),
    paidEntries: integer("paid_entries").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.distributionId],
      foreignColumns: [rentalDistributions.id],
      name: "payout_ticks_distribution_id_fk",
    }).onDelete("cascade"),
  ],
);

export type PayoutTickRow = typeof payoutTicks.$inferSelect;
export type NewPayoutTickRow = typeof payoutTicks.$inferInsert;
