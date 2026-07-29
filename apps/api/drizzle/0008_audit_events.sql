CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"actor_type" text NOT NULL,
	"actor_user_id" text,
	"actor_label" text,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"summary" text NOT NULL,
	"payload_hash" text NOT NULL,
	"payload" jsonb,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_events_actor_type_check" CHECK ("actor_type" IN ('user', 'system'))
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "audit_events_created_at_idx" ON "audit_events" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "audit_events_actor_user_id_idx" ON "audit_events" USING btree ("actor_user_id");
--> statement-breakpoint
CREATE INDEX "audit_events_action_created_idx" ON "audit_events" USING btree ("action","created_at");
--> statement-breakpoint
CREATE INDEX "audit_events_resource_idx" ON "audit_events" USING btree ("resource_type","resource_id");
