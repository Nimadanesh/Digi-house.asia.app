import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  integer,
  pgTable,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Per-transaction fee schedule (PRODUCT-PLAN §0.5).
 * Tier is chosen by the transaction amount (integer cents); rates are basis points.
 * max_amount_usd NULL = unbounded top tier. Instant sell is a flat 7% (constant in
 * resolve-fee.ts), never tiered. Seeded by migration 0019; editable by admin later.
 */
export const feeTiers = pgTable(
  "fee_tiers",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    minAmountUsd: bigint("min_amount_usd", { mode: "number" }).notNull(),
    maxAmountUsd: bigint("max_amount_usd", { mode: "number" }),
    buyPrimaryBps: integer("buy_primary_bps").notNull(),
    buySecondaryBps: integer("buy_secondary_bps").notNull(),
    sellSecondaryBps: integer("sell_secondary_bps").notNull(),
  },
  (t) => [
    check("fee_tiers_min_nonneg_check", sql`${t.minAmountUsd} >= 0`),
    check(
      "fee_tiers_max_gt_min_check",
      sql`${t.maxAmountUsd} IS NULL OR ${t.maxAmountUsd} > ${t.minAmountUsd}`,
    ),
    check(
      "fee_tiers_bps_range_check",
      sql`${t.buyPrimaryBps} BETWEEN 0 AND 10000 AND ${t.buySecondaryBps} BETWEEN 0 AND 10000 AND ${t.sellSecondaryBps} BETWEEN 0 AND 10000`,
    ),
    uniqueIndex("fee_tiers_min_uidx").on(t.minAmountUsd),
  ],
);

export type FeeTierRow = typeof feeTiers.$inferSelect;
export type NewFeeTierRow = typeof feeTiers.$inferInsert;
