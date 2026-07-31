ALTER TABLE "buy_intents" ADD COLUMN "destination_address" text;
--> statement-breakpoint
ALTER TABLE "buy_intents" ADD COLUMN "expected_nano_ton" text;
--> statement-breakpoint
ALTER TABLE "buy_intents" ADD COLUMN "tx_hash" text;
--> statement-breakpoint
ALTER TABLE "buy_intents" ADD COLUMN "settled_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "buy_intents" DROP CONSTRAINT "buy_intents_status_check";
--> statement-breakpoint
ALTER TABLE "buy_intents" ADD CONSTRAINT "buy_intents_status_check" CHECK ("status" IN ('pending', 'confirmed', 'settled', 'expired', 'cancelled'));
