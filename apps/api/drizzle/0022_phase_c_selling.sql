-- PRODUCT-PLAN Phase C — selling (§0.3):
-- * orders gain a 'queued' status: custom-price sell orders on a funding property wait
--   until the primary sells out, then flip atomically to 'open' (Order Activation Trigger).
-- * instant_sells: platform buy-back ledger for the funding phase (price − 7%).
-- * transactions.fee_usd: explicit commission column (§0.5 transparency).
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_status_check";
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_status_check" CHECK ("status" IN ('open', 'queued', 'filled', 'cancelled', 'rejected'));
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "fee_usd" bigint;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "instant_sells" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL,
  "property_id" text NOT NULL,
  "shares" integer NOT NULL,
  "share_price_usd" bigint NOT NULL,
  "gross_usd" bigint NOT NULL,
  "fee_usd" bigint NOT NULL,
  "net_usd" bigint NOT NULL,
  "status" text NOT NULL,
  "transaction_id" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "instant_sells_shares_pos_check" CHECK ("shares" > 0),
  CONSTRAINT "instant_sells_nonneg_check" CHECK ("gross_usd" >= 0 AND "fee_usd" >= 0 AND "net_usd" >= 0),
  CONSTRAINT "instant_sells_status_check" CHECK ("status" IN ('settled'))
);
--> statement-breakpoint
ALTER TABLE "instant_sells" DROP CONSTRAINT IF EXISTS "instant_sells_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "instant_sells" ADD CONSTRAINT "instant_sells_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "instant_sells" DROP CONSTRAINT IF EXISTS "instant_sells_property_id_properties_id_fk";
--> statement-breakpoint
ALTER TABLE "instant_sells" ADD CONSTRAINT "instant_sells_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "instant_sells_user_idx" ON "instant_sells" ("user_id", "created_at");
