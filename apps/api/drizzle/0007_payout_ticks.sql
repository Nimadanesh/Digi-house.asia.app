CREATE TABLE "payout_ticks" (
	"idempotency_key" text PRIMARY KEY NOT NULL,
	"distribution_id" text NOT NULL,
	"paid_entries" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payout_ticks" ADD CONSTRAINT "payout_ticks_distribution_id_fk" FOREIGN KEY ("distribution_id") REFERENCES "public"."rental_distributions"("id") ON DELETE cascade ON UPDATE no action;
