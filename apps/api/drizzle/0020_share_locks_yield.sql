-- PRODUCT-PLAN Phase B — share locking & yield engine (§0.4).
-- share_locks: user locks shares to earn yield; accrual stops at unlock request; matures 2–3 days later.
CREATE TABLE IF NOT EXISTS "share_locks" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL,
  "property_id" text NOT NULL,
  "shares" integer NOT NULL,
  "principal_usd" bigint NOT NULL,
  "payout_period" text NOT NULL,
  "monthly_rate" numeric(4,2) NOT NULL,
  "status" text NOT NULL,
  "locked_at" timestamptz NOT NULL DEFAULT now(),
  "unlock_requested_at" timestamptz,
  "matured_at" timestamptz,
  "next_payout_at" timestamptz NOT NULL,
  "paid_through_day" date,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "share_locks_shares_pos_check" CHECK ("shares" > 0),
  CONSTRAINT "share_locks_principal_pos_check" CHECK ("principal_usd" > 0),
  CONSTRAINT "share_locks_payout_period_check" CHECK ("payout_period" IN ('monthly', 'weekly')),
  CONSTRAINT "share_locks_status_check" CHECK ("status" IN ('locked', 'unlock_requested', 'matured')),
  CONSTRAINT "share_locks_rate_range_check" CHECK ("monthly_rate" >= 4.5 AND "monthly_rate" <= 7.5)
);
--> statement-breakpoint
ALTER TABLE "share_locks" DROP CONSTRAINT IF EXISTS "share_locks_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "share_locks" ADD CONSTRAINT "share_locks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "share_locks" DROP CONSTRAINT IF EXISTS "share_locks_property_id_properties_id_fk";
--> statement-breakpoint
ALTER TABLE "share_locks" ADD CONSTRAINT "share_locks_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "share_locks_user_status_idx" ON "share_locks" ("user_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "share_locks_property_status_idx" ON "share_locks" ("property_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "share_locks_next_payout_idx" ON "share_locks" ("next_payout_at") WHERE "status" != 'matured';
--> statement-breakpoint
-- Daily yield accrual per lock (idempotent: one row per lock per UTC day).
CREATE TABLE IF NOT EXISTS "yield_accruals" (
  "id" text PRIMARY KEY,
  "lock_id" text NOT NULL,
  "user_id" text NOT NULL,
  "property_id" text NOT NULL,
  "day" date NOT NULL,
  "amount_usd" bigint NOT NULL,
  "monthly_rate" numeric(4,2) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "yield_accruals_amount_nonneg_check" CHECK ("amount_usd" >= 0),
  CONSTRAINT "yield_accruals_lock_day_uidx" UNIQUE ("lock_id", "day")
);
--> statement-breakpoint
ALTER TABLE "yield_accruals" DROP CONSTRAINT IF EXISTS "yield_accruals_lock_id_share_locks_id_fk";
--> statement-breakpoint
ALTER TABLE "yield_accruals" ADD CONSTRAINT "yield_accruals_lock_id_share_locks_id_fk" FOREIGN KEY ("lock_id") REFERENCES "share_locks"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "yield_accruals_user_day_idx" ON "yield_accruals" ("user_id", "day");
--> statement-breakpoint
-- Settled yield payouts (scheduled cycles + final payout on unlock request).
CREATE TABLE IF NOT EXISTS "yield_payments" (
  "id" text PRIMARY KEY,
  "lock_id" text NOT NULL,
  "user_id" text NOT NULL,
  "property_id" text NOT NULL,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "amount_usd" bigint NOT NULL,
  "kind" text NOT NULL,
  "status" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "yield_payments_amount_pos_check" CHECK ("amount_usd" > 0),
  CONSTRAINT "yield_payments_kind_check" CHECK ("kind" IN ('scheduled', 'final')),
  CONSTRAINT "yield_payments_status_check" CHECK ("status" IN ('paid', 'pending')),
  CONSTRAINT "yield_payments_period_uidx" UNIQUE ("lock_id", "period_start", "period_end")
);
--> statement-breakpoint
ALTER TABLE "yield_payments" DROP CONSTRAINT IF EXISTS "yield_payments_lock_id_share_locks_id_fk";
--> statement-breakpoint
ALTER TABLE "yield_payments" ADD CONSTRAINT "yield_payments_lock_id_share_locks_id_fk" FOREIGN KEY ("lock_id") REFERENCES "share_locks"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "yield_payments_user_idx" ON "yield_payments" ("user_id", "created_at");
