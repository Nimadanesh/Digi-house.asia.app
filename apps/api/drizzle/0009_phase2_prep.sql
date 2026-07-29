ALTER TABLE "holdings" ADD COLUMN "jetton_wallet_address" text;--> statement-breakpoint
ALTER TABLE "holdings" ADD COLUMN "jetton_balance" bigint DEFAULT 0;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "jetton_decimals" integer DEFAULT 9;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "tokenization_status" text DEFAULT 'pending';--> statement-breakpoint
CREATE INDEX "earnings_entries_distribution_id_idx" ON "earnings_entries" USING btree ("distribution_id");