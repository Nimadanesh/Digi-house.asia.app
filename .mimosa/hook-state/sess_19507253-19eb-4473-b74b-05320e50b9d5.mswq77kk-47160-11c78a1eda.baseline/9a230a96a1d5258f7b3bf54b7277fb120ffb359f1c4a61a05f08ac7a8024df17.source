import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const chainEvents = pgTable(
  "chain_events",
  {
    eventId: text("event_id").primaryKey(),
    contractAddress: text("contract_address").notNull(),
    eventType: text("event_type").notNull(),
    blockLt: bigint("block_lt", { mode: "number" }).notNull(),
    txHash: text("tx_hash").notNull(),
    logicalTime: bigint("logical_time", { mode: "number" }),
    fromAddress: text("from_address"),
    toAddress: text("to_address"),
    amount: text("amount"),
    rawData: jsonb("raw_data").$type<Record<string, unknown>>(),
    status: text("status").notNull().default("new"),
    retryCount: integer("retry_count").notNull().default(0),
    error: text("error"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "chain_events_event_type_check",
      sql`${t.eventType} IN ('jetton_transfer', 'distribution_claim', 'distribution_funded', 'unknown')`,
    ),
    check(
      "chain_events_status_check",
      sql`${t.status} IN ('new', 'processing', 'done', 'failed', 'dead')`,
    ),
    index("chain_events_status_idx").on(t.status),
    index("chain_events_contract_type_idx").on(t.contractAddress, t.eventType),
    index("chain_events_tx_hash_idx").on(t.txHash),
  ],
);

export const indexerCursors = pgTable(
  "indexer_cursors",
  {
    contractAddress: text("contract_address").primaryKey(),
    eventType: text("event_type").notNull(),
    cursor: bigint("cursor", { mode: "number" }).notNull().default(0),
    lastSeenLt: bigint("last_seen_lt", { mode: "number" }),
    lastTxHash: text("last_tx_hash"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "indexer_cursors_event_type_check",
      sql`${t.eventType} IN ('jetton_transfer', 'distribution_claim', 'distribution_funded')`,
    ),
  ],
);

export type ChainEventRow = typeof chainEvents.$inferSelect;
export type NewChainEventRow = typeof chainEvents.$inferInsert;
export type IndexerCursorRow = typeof indexerCursors.$inferSelect;
export type NewIndexerCursorRow = typeof indexerCursors.$inferInsert;
