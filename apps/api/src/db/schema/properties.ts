import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/** PropertyMeta JSON (mirrors Mini App PropertyMeta). */
export type PropertyMetaJson = {
  sizeSqm: number;
  yearBuilt: number;
  propertyType: string;
  rentalStatus: "rented" | "vacant";
  leaseUntil: string | null;
  activeTenant: boolean;
  tokenizationDocUrl: string;
};

export type RentalPaymentJson = {
  id: string;
  paidAt: string;
  status: "paid";
};

/**
 * Marketplace properties — text PK matches mock/demo ids.
 * Money: integer cents (bigint). Shares: integers.
 * onchain_master / distribution_address null until SETTLEMENT_MODE=onchain (ADR-002).
 */
export const properties = pgTable(
  "properties",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    location: text("location").notNull(),
    description: text("description").notNull(),
    images: jsonb("images").$type<string[]>().notNull(),
    totalShares: integer("total_shares").notNull(),
    sharePriceUsd: bigint("share_price_usd", { mode: "number" }).notNull(),
    jettonDecimals: integer("jetton_decimals").default(9),
    tokenizationStatus: text("tokenization_status")
      .$type<"pending" | "deployed" | "failed">()
      .default("pending"),
    status: text("status").notNull(),
    ownerWalletAddress: text("owner_wallet_address").notNull(),
    annualRentUsd: bigint("annual_rent_usd", { mode: "number" }).notNull(),
    sharesSold: integer("shares_sold").notNull().default(0),
    meta: jsonb("meta").$type<PropertyMetaJson>().notNull(),
    rentalHistory: jsonb("rental_history")
      .$type<RentalPaymentJson[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    onchainMaster: text("onchain_master"),
    distributionAddress: text("distribution_address"),
    salePaused: boolean("sale_paused").notNull().default(false),
    distributionPaused: boolean("distribution_paused").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "properties_status_check",
      sql`${t.status} IN ('funding', 'funded', 'resale')`,
    ),
    check("properties_total_shares_pos", sql`${t.totalShares} > 0`),
    check("properties_shares_sold_nonneg", sql`${t.sharesSold} >= 0`),
    index("properties_status_idx").on(t.status),
  ],
);

export type PropertyRow = typeof properties.$inferSelect;
export type NewPropertyRow = typeof properties.$inferInsert;
