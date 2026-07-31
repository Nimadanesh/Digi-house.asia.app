ALTER TABLE "buy_intents" ADD COLUMN "currency" text DEFAULT 'TON' NOT NULL;
--> statement-breakpoint
ALTER TABLE "buy_intents" ADD COLUMN "expected_jetton_amount" text;
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "currency" text DEFAULT 'TON' NOT NULL;
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "token_amount" bigint;
