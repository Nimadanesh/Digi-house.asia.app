CREATE TABLE "properties" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"location" text NOT NULL,
	"description" text NOT NULL,
	"images" jsonb NOT NULL,
	"total_shares" integer NOT NULL,
	"share_price_usd" bigint NOT NULL,
	"status" text NOT NULL,
	"owner_wallet_address" text NOT NULL,
	"annual_rent_usd" bigint NOT NULL,
	"shares_sold" integer DEFAULT 0 NOT NULL,
	"meta" jsonb NOT NULL,
	"rental_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"onchain_master" text,
	"distribution_address" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "properties_status_check" CHECK ("status" IN ('funding', 'funded', 'resale')),
	CONSTRAINT "properties_total_shares_pos" CHECK ("total_shares" > 0),
	CONSTRAINT "properties_shares_sold_nonneg" CHECK ("shares_sold" >= 0)
);
--> statement-breakpoint
CREATE INDEX "properties_status_idx" ON "properties" USING btree ("status");
