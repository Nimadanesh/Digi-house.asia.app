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
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { properties } from "./properties.js";
import { users } from "./users.js";

/**
 * One-time primary-sale buy intents (user-bound, expiring).
 * Hybrid confirm records the payment (boc/tx_hash); settlement happens only after on-chain
 * verification of the tx_hash (Step 3), using the stored destination + expected amount.
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
    /** Receive address returned by prepare — the only destination we will settle against. */
    destinationAddress: text("destination_address"),
    /** The connected wallet that prepared the intent — the only acceptable payer at verify time. */
    paidByWallet: text("paid_by_wallet"),
    /** Payment rail chosen at prepare: native TON or a Jetton (USDT). */
    currency: text("currency").notNull().default("TON"),
    /** Payable nanoTON returned by prepare (decimal string); null for USDT intents. */
    expectedNanoTon: text("expected_nano_ton"),
    /** Payable Jetton amount in base units (decimal string); null for TON intents (USDT has 6 decimals). */
    expectedJettonAmount: text("expected_jetton_amount"),
    /** Wallet-signed message hash recorded at confirm; verified before settlement. */
    txHash: text("tx_hash"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    settledAt: timestamp("settled_at", { withTimezone: true }),
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
      sql`${t.status} IN ('pending', 'confirmed', 'settled', 'expired', 'cancelled')`,
    ),
    check("buy_intents_quantity_pos", sql`${t.quantity} > 0`),
    index("buy_intents_user_id_idx").on(t.userId),
    index("buy_intents_status_expires_idx").on(t.status, t.expiresAt),
    // Replay guard (defense-in-depth): one wallet-signed txHash may settle at most one intent.
    uniqueIndex("buy_intents_tx_hash_uidx").on(t.txHash).where(sql`${t.txHash} IS NOT NULL`),
  ],
);

export type BuyIntentRow = typeof buyIntents.$inferSelect;
export type NewBuyIntentRow = typeof buyIntents.$inferInsert;
