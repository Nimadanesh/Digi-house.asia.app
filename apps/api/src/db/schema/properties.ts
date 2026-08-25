import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
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
  /** Optional manifest projections (A3) — verbatim from portfolio-manifest.json. */
  projectedNetYieldPct?: number;
  avgNightlyRateUsd?: number;
  occupancyRatePct?: number;
  ownershipStructure?: string;
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
    /** Whole-property value in cents; offered = totalShares × sharePriceUsd. */
    totalValueUsd: bigint("total_value_usd", { mode: "number" })
      .notNull()
      .default(0),
    /** Monthly yield rate 4.50–7.50 (%) paid on locked shares (PRODUCT-PLAN §0.4). */
    monthlyYieldRate: numeric("monthly_yield_rate", {
      precision: 4,
      scale: 2,
    })
      .notNull()
      .default("5.50"),
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
      sql`${t.status} IN ('draft', 'funding', 'funded', 'resale')`,
    ),
    check("properties_total_shares_pos", sql`${t.totalShares} > 0`),
    check("properties_shares_sold_nonneg", sql`${t.sharesSold} >= 0`),
    check(
      "properties_yield_range_check",
      sql`${t.monthlyYieldRate} >= 4.5 AND ${t.monthlyYieldRate} <= 7.5`,
    ),
    index("properties_status_idx").on(t.status),
  ],
);

export type PropertyRow = typeof properties.$inferSelect;
export type NewPropertyRow = typeof properties.$inferInsert;
