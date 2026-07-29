CREATE TABLE "buy_intents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"property_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"price_usd_per_share" bigint NOT NULL,
	"total_usd" bigint NOT NULL,
	"status" text NOT NULL,
	"boc" text,
	"expires_at" timestamp with time zone NOT NULL,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buy_intents_status_check" CHECK ("status" IN ('pending', 'confirmed', 'expired', 'cancelled')),
	CONSTRAINT "buy_intents_quantity_pos" CHECK ("quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"property_id" text,
	"shares" integer,
	"amount_usd" bigint NOT NULL,
	"ton_amount" bigint,
	"status" text NOT NULL,
	"tx_hash" text,
	"error" text,
	"buy_intent_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_kind_check" CHECK ("kind" IN ('buy', 'sell', 'earnings', 'withdraw')),
	CONSTRAINT "transactions_status_check" CHECK ("status" IN ('pending', 'success', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "buy_intents" ADD CONSTRAINT "buy_intents_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "buy_intents" ADD CONSTRAINT "buy_intents_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_buy_intent_id_fk" FOREIGN KEY ("buy_intent_id") REFERENCES "public"."buy_intents"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "buy_intents_user_id_idx" ON "buy_intents" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "buy_intents_status_expires_idx" ON "buy_intents" USING btree ("status","expires_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_buy_intent_id_uidx" ON "transactions" USING btree ("buy_intent_id");
