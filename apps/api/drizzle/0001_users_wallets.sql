CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"username" text,
	"photo_url" text,
	"role" text DEFAULT 'investor' NOT NULL,
	"wallet_address" text,
	"onboarded" boolean DEFAULT false NOT NULL,
	"use_telegram_theme" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_role_check" CHECK ("role" IN ('investor', 'owner'))
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"address" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "users_wallet_address_idx" ON "users" USING btree ("wallet_address");
--> statement-breakpoint
CREATE UNIQUE INDEX "wallets_address_uidx" ON "wallets" USING btree ("address");
--> statement-breakpoint
CREATE INDEX "wallets_user_id_idx" ON "wallets" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "wallets_one_primary_per_user_uidx" ON "wallets" USING btree ("user_id") WHERE "is_primary" = true;
