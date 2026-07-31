ALTER TABLE "buy_intents" ADD COLUMN "paid_by_wallet" text;
--> statement-breakpoint
CREATE UNIQUE INDEX "buy_intents_tx_hash_uidx" ON "buy_intents" ("tx_hash") WHERE "tx_hash" IS NOT NULL;
