ALTER TABLE "properties" ADD COLUMN "sale_paused" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "distribution_paused" boolean DEFAULT false NOT NULL;
