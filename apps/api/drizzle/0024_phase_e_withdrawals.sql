-- PRODUCT-PLAN Phase E (PE-01) — USDT withdrawal address:
-- * users.withdrawal_address: USDT-TON payout destination set from Settings.
-- * users.withdrawal_address_verified: resets to false on every change; admin
--   verification ships with the PE-03 admin withdrawal queue.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "withdrawal_address" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "withdrawal_address_verified" boolean NOT NULL DEFAULT false;
