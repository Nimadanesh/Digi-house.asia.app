-- PRODUCT-PLAN Phase D — secondary market:
-- * orders.escrowed_usd: buy orders hold (notional + buy fee) aside from the investing balance;
--   refunded on cancel / partial completion.
-- * orders.is_house_account: platform-seeded liquidity orders (never self-matched, PD-03).
-- * trades: the fill ledger of the matching engine (PD-02/PD-04).
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "escrowed_usd" bigint NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "is_house_account" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trades" (
  "id" text PRIMARY KEY,
  "property_id" text NOT NULL,
  "price_usd" bigint NOT NULL,
  "quantity" integer NOT NULL,
  "buyer_user_id" text NOT NULL,
  "seller_user_id" text NOT NULL,
  "buy_fee_usd" bigint NOT NULL DEFAULT 0,
  "sell_fee_usd" bigint NOT NULL DEFAULT 0,
  "maker_order_id" text NOT NULL,
  "taker_order_id" text NOT NULL,
  "fill_seq" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "trades_quantity_pos_check" CHECK ("quantity" > 0),
  CONSTRAINT "trades_price_pos_check" CHECK ("price_usd" > 0),
  CONSTRAINT "trades_fees_nonneg_check" CHECK ("buy_fee_usd" >= 0 AND "sell_fee_usd" >= 0),
  CONSTRAINT "trades_no_self_trade_check" CHECK ("buyer_user_id" != "seller_user_id"),
  CONSTRAINT "trades_pair_seq_uidx" UNIQUE ("taker_order_id", "maker_order_id", "fill_seq")
);
--> statement-breakpoint
ALTER TABLE "trades" DROP CONSTRAINT IF EXISTS "trades_property_id_properties_id_fk";
--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "trades" DROP CONSTRAINT IF EXISTS "trades_buyer_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_buyer_user_id_users_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "trades" DROP CONSTRAINT IF EXISTS "trades_seller_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_seller_user_id_users_id_fk" FOREIGN KEY ("seller_user_id") REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trades_property_created_idx" ON "trades" ("property_id", "created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trades_buyer_idx" ON "trades" ("buyer_user_id", "created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trades_seller_idx" ON "trades" ("seller_user_id", "created_at" DESC);
