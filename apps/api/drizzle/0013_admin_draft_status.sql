ALTER TABLE "properties" DROP CONSTRAINT IF EXISTS "properties_status_check";
--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_status_check" CHECK ("properties"."status" IN ('draft', 'funding', 'funded', 'resale'));
