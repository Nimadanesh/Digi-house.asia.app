-- PRODUCT-PLAN Phase E (PE-02) — withdrawals:
-- * withdrawals: USDT payout requests. POST /v1/withdrawals debits the withdrawable
--   balance atomically at request time; status flow requested → approved → paid, or
--   rejected (withdrawable refunded). Fulfilled manually by admin (PE-03).
CREATE TABLE IF NOT EXISTS "withdrawals" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL,
  "amount_usd" bigint NOT NULL,
  "address" text NOT NULL,
  "status" text NOT NULL,
  "tx_hash" text,
  "transaction_id" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "withdrawals_amount_pos_check" CHECK ("amount_usd" > 0),
  CONSTRAINT "withdrawals_status_check" CHECK ("status" IN ('requested', 'approved', 'rejected', 'paid'))
);
--> statement-breakpoint
ALTER TABLE "withdrawals" DROP CONSTRAINT IF EXISTS "withdrawals_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "withdrawals_user_created_idx" ON "withdrawals" ("user_id", "created_at" DESC);
