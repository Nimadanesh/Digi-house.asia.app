-- PRODUCT-PLAN — whole-property value (user pricing model: total value vs offered shares).
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "total_value_usd" bigint NOT NULL DEFAULT 0;
--> statement-breakpoint
-- Backfill: existing rows default to the offered amount (shares × price) until admin sets a real valuation.
UPDATE "properties" SET "total_value_usd" = "share_price_usd" * "total_shares" WHERE "total_value_usd" = 0;
