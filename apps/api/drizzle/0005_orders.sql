CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"property_id" text NOT NULL,
	"maker_address" text NOT NULL,
	"side" text NOT NULL,
	"price_usd" bigint NOT NULL,
	"quantity" integer NOT NULL,
	"filled_quantity" integer DEFAULT 0 NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_side_check" CHECK ("side" IN ('buy', 'sell')),
	CONSTRAINT "orders_status_check" CHECK ("status" IN ('open', 'filled', 'cancelled', 'rejected')),
	CONSTRAINT "orders_price_pos" CHECK ("price_usd" > 0),
	CONSTRAINT "orders_quantity_pos" CHECK ("quantity" > 0),
	CONSTRAINT "orders_filled_nonneg" CHECK ("filled_quantity" >= 0)
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "orders_property_status_idx" ON "orders" USING btree ("property_id","status");
--> statement-breakpoint
CREATE INDEX "orders_user_status_idx" ON "orders" USING btree ("user_id","status");
--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");
