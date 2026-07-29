CREATE TABLE "chain_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"contract_address" text NOT NULL,
	"event_type" text NOT NULL,
	"block_lt" bigint NOT NULL,
	"tx_hash" text NOT NULL,
	"logical_time" bigint,
	"from_address" text,
	"to_address" text,
	"amount" text,
	"raw_data" jsonb,
	"status" text DEFAULT 'new' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"error" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chain_events_event_type_check" CHECK ("event_type" IN ('jetton_transfer', 'distribution_claim', 'distribution_funded', 'unknown')),
	CONSTRAINT "chain_events_status_check" CHECK ("status" IN ('new', 'processing', 'done', 'failed', 'dead'))
);
--> statement-breakpoint
CREATE TABLE "indexer_cursors" (
	"contract_address" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"cursor" bigint DEFAULT 0 NOT NULL,
	"last_seen_lt" bigint,
	"last_tx_hash" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "indexer_cursors_event_type_check" CHECK ("event_type" IN ('jetton_transfer', 'distribution_claim', 'distribution_funded'))
);
--> statement-breakpoint
CREATE INDEX "chain_events_status_idx" ON "chain_events" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "chain_events_contract_type_idx" ON "chain_events" USING btree ("contract_address","event_type");
--> statement-breakpoint
CREATE INDEX "chain_events_tx_hash_idx" ON "chain_events" USING btree ("tx_hash");
