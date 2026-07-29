CREATE TABLE "holdings" (
	"user_id" text NOT NULL,
	"property_id" text NOT NULL,
	"shares_owned" integer NOT NULL,
	"avg_cost_usd" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "holdings_user_id_property_id_pk" PRIMARY KEY("user_id","property_id"),
	CONSTRAINT "holdings_shares_owned_pos" CHECK ("shares_owned" > 0)
);
--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "holdings_user_id_idx" ON "holdings" USING btree ("user_id");
