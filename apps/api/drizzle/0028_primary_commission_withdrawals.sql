-- FractionalLuxe financial model alignment (approved 2026-08-26):
-- * buy_intents.fee_usd — primary-market commission. The buyer pays principal + commission;
--   the commission is FractionalLuxe revenue and is recorded separately on the ledger
--   (transactions.fee_usd) at settlement.
-- * withdrawals.fee_usd — 1% withdrawal fee charged at request time
--   (net = gross − fee; the fee is FractionalLuxe revenue).
-- * withdrawal_installments — the net amount is paid in exactly 4 weekly installments;
--   installments always sum exactly to the net amount.
ALTER TABLE "buy_intents" ADD COLUMN IF NOT EXISTS "fee_usd" bigint;
--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN IF NOT EXISTS "fee_usd" bigint NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_fee_usd_nonneg_check" CHECK ("fee_usd" >= 0);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "withdrawal_installments" (
  "id" text PRIMARY KEY,
  "withdrawal_id" text NOT NULL,
  "seq" integer NOT NULL,
  "amount_usd" bigint NOT NULL,
  "status" text NOT NULL,
  "due_at" timestamptz NOT NULL,
  "paid_at" timestamptz,
  "tx_hash" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "withdrawal_installments_seq_range_check" CHECK ("seq" IN (1, 2, 3, 4)),
  CONSTRAINT "withdrawal_installments_amount_nonneg_check" CHECK ("amount_usd" >= 0),
  CONSTRAINT "withdrawal_installments_status_check" CHECK ("status" IN ('pending', 'due', 'paid')),
  CONSTRAINT "withdrawal_installments_withdrawal_id_fk" FOREIGN KEY ("withdrawal_id") REFERENCES "withdrawals"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "withdrawal_installments_withdrawal_idx" ON "withdrawal_installments" ("withdrawal_id", "seq");
