CREATE TABLE "rental_distributions" (
	"id" text PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"week_of" date NOT NULL,
	"rent_pool_usd" bigint NOT NULL,
	"rent_pool_nano_ton" bigint NOT NULL,
	"payout_day" date NOT NULL,
	"status" text NOT NULL,
	"total_shares" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rental_distributions_status_check" CHECK ("status" IN ('scheduled', 'distributing', 'completed')),
	CONSTRAINT "rental_distributions_total_shares_pos" CHECK ("total_shares" > 0)
);
--> statement-breakpoint
CREATE TABLE "earnings_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"property_id" text NOT NULL,
	"distribution_id" text NOT NULL,
	"week_of" date NOT NULL,
	"amount_usd" bigint NOT NULL,
	"ton_amount" bigint NOT NULL,
	"share_ratio" double precision NOT NULL,
	"status" text NOT NULL,
	"tx_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "earnings_entries_status_check" CHECK ("status" IN ('paid', 'pending'))
);
--> statement-breakpoint
ALTER TABLE "rental_distributions" ADD CONSTRAINT "rental_distributions_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "earnings_entries" ADD CONSTRAINT "earnings_entries_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "earnings_entries" ADD CONSTRAINT "earnings_entries_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "earnings_entries" ADD CONSTRAINT "earnings_entries_distribution_id_fk" FOREIGN KEY ("distribution_id") REFERENCES "public"."rental_distributions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "rental_distributions_property_id_idx" ON "rental_distributions" USING btree ("property_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "rental_distributions_property_week_uidx" ON "rental_distributions" USING btree ("property_id","week_of");
--> statement-breakpoint
CREATE UNIQUE INDEX "earnings_entries_user_distribution_uidx" ON "earnings_entries" USING btree ("user_id","distribution_id");
--> statement-breakpoint
CREATE INDEX "earnings_entries_user_id_idx" ON "earnings_entries" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "earnings_entries_user_week_idx" ON "earnings_entries" USING btree ("user_id","week_of");
