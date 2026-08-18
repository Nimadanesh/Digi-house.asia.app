import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { properties } from "./properties.js";
import { users } from "./users.js";

export type LockStatus = "locked" | "unlock_requested" | "matured";
export type PayoutPeriod = "monthly" | "weekly";

/**
 * Share locks (PRODUCT-PLAN §0.4): locking shares entitles the user to yield from
 * day 1; accrual stops at unlock_requested_at; shares become sellable when the
 * lock matures (2–3 days after the request). monthly_rate + principal are
 * snapshots at lock time so later property edits never rewrite existing locks.
 */
export const shareLocks = pgTable(
  "share_locks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    propertyId: text("property_id").notNull(),
    shares: integer("shares").notNull(),
    /** shares × avg cost at lock time, integer cents. */
    principalUsd: bigint("principal_usd", { mode: "number" }).notNull(),
    payoutPeriod: text("payout_period").$type<PayoutPeriod>().notNull(),
    monthlyRate: numeric("monthly_rate", { precision: 4, scale: 2 }).notNull(),
    status: text("status").$type<LockStatus>().notNull(),
    lockedAt: timestamp("locked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    unlockRequestedAt: timestamp("unlock_requested_at", { withTimezone: true }),
    maturedAt: timestamp("matured_at", { withTimezone: true }),
    nextPayoutAt: timestamp("next_payout_at", { withTimezone: true }).notNull(),
    /** Last accrual day (UTC) whose amount has already been paid out. */
    paidThroughDay: date("paid_through_day", { mode: "string" }),
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
      name: "share_locks_user_id_users_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.propertyId],
      foreignColumns: [properties.id],
      name: "share_locks_property_id_properties_id_fk",
    }).onDelete("cascade"),
    check("share_locks_shares_pos_check", sql`${t.shares} > 0`),
    check("share_locks_principal_pos_check", sql`${t.principalUsd} > 0`),
    check(
      "share_locks_rate_range_check",
      sql`${t.monthlyRate} >= 4.5 AND ${t.monthlyRate} <= 7.5`,
    ),
    index("share_locks_user_status_idx").on(t.userId, t.status),
    index("share_locks_property_status_idx").on(t.propertyId, t.status),
  ],
);

/** Daily yield accrual per lock; unique (lock_id, day) makes the tick idempotent. */
export const yieldAccruals = pgTable(
  "yield_accruals",
  {
    id: text("id").primaryKey(),
    lockId: text("lock_id").notNull(),
    userId: text("user_id").notNull(),
    propertyId: text("property_id").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    amountUsd: bigint("amount_usd", { mode: "number" }).notNull(),
    monthlyRate: numeric("monthly_rate", { precision: 4, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.lockId],
      foreignColumns: [shareLocks.id],
      name: "yield_accruals_lock_id_share_locks_id_fk",
    }).onDelete("cascade"),
    check("yield_accruals_amount_nonneg_check", sql`${t.amountUsd} >= 0`),
    uniqueIndex("yield_accruals_lock_day_uidx").on(t.lockId, t.day),
    index("yield_accruals_user_day_idx").on(t.userId, t.day),
  ],
);

/** Settled yield payouts: scheduled cycles + the final payout on unlock request. */
export const yieldPayments = pgTable(
  "yield_payments",
  {
    id: text("id").primaryKey(),
    lockId: text("lock_id").notNull(),
    userId: text("user_id").notNull(),
    propertyId: text("property_id").notNull(),
    periodStart: date("period_start", { mode: "string" }).notNull(),
    periodEnd: date("period_end", { mode: "string" }).notNull(),
    amountUsd: bigint("amount_usd", { mode: "number" }).notNull(),
    kind: text("kind").$type<"scheduled" | "final">().notNull(),
    status: text("status").$type<"paid" | "pending">().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.lockId],
      foreignColumns: [shareLocks.id],
      name: "yield_payments_lock_id_share_locks_id_fk",
    }).onDelete("cascade"),
    check("yield_payments_amount_pos_check", sql`${t.amountUsd} > 0`),
    uniqueIndex("yield_payments_period_uidx").on(
      t.lockId,
      t.periodStart,
      t.periodEnd,
    ),
    index("yield_payments_user_idx").on(t.userId, t.createdAt),
  ],
);

export type ShareLockRow = typeof shareLocks.$inferSelect;
export type NewShareLockRow = typeof shareLocks.$inferInsert;
export type YieldAccrualRow = typeof yieldAccruals.$inferSelect;
export type NewYieldAccrualRow = typeof yieldAccruals.$inferInsert;
export type YieldPaymentRow = typeof yieldPayments.$inferSelect;
export type NewYieldPaymentRow = typeof yieldPayments.$inferInsert;
