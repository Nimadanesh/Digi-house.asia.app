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
  unique,
} from "drizzle-orm/pg-core";
import { properties } from "./properties.js";
import { users } from "./users.js";

/**
 * Trade fills produced by the matching engine (PRODUCT-PLAN §0.3 / PD-02).
 * One row per executed fill: shares move seller→buyer at the MAKER's price, the
 * buyer's fee comes from its order escrow, the seller receives notional − sell fee.
 * (taker_order_id, maker_order_id, fill_seq) UNIQUE makes replays impossible.
 */
export const trades = pgTable(
  "trades",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id").notNull(),
    priceUsd: bigint("price_usd", { mode: "number" }).notNull(),
    quantity: integer("quantity").notNull(),
    buyerUserId: text("buyer_user_id").notNull(),
    sellerUserId: text("seller_user_id").notNull(),
    buyFeeUsd: bigint("buy_fee_usd", { mode: "number" }).notNull().default(0),
    sellFeeUsd: bigint("sell_fee_usd", { mode: "number" }).notNull().default(0),
    makerOrderId: text("maker_order_id").notNull(),
    takerOrderId: text("taker_order_id").notNull(),
    fillSeq: integer("fill_seq").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.propertyId],
      foreignColumns: [properties.id],
      name: "trades_property_id_properties_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.buyerUserId],
      foreignColumns: [users.id],
      name: "trades_buyer_user_id_users_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.sellerUserId],
      foreignColumns: [users.id],
      name: "trades_seller_user_id_users_id_fk",
    }).onDelete("cascade"),
    check("trades_quantity_pos_check", sql`${t.quantity} > 0`),
    check("trades_price_pos_check", sql`${t.priceUsd} > 0`),
    check(
      "trades_no_self_trade_check",
      sql`${t.buyerUserId} != ${t.sellerUserId}`,
    ),
    unique("trades_pair_seq_uidx").on(
      t.takerOrderId,
      t.makerOrderId,
      t.fillSeq,
    ),
    index("trades_property_created_idx").on(t.propertyId, t.createdAt),
    index("trades_buyer_idx").on(t.buyerUserId, t.createdAt),
    index("trades_seller_idx").on(t.sellerUserId, t.createdAt),
  ],
);

export type TradeRow = typeof trades.$inferSelect;
export type NewTradeRow = typeof trades.$inferInsert;
