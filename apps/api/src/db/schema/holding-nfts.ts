import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { properties } from "./properties.js";
import { users } from "./users.js";

/**
 * Collectible Position NFTs — display-only receipts of a user's holdings.
 * The DB `holdings` table remains the 100% source of truth for ownership,
 * yield, trades, balances, accounting and settlement. The NFT contains NO
 * financial logic and its mint/transfer is an asynchronous secondary operation
 * that must never roll back or block a successful purchase.
 * 1 holding -> max 1 NFT (UNIQUE holding_key + UNIQUE(user_id, property_id)).
 */
export const holdingNfts = pgTable(
  "holding_nfts",
  {
    id: text("id").primaryKey(),
    /** Composite holding identity `${userId}:${propertyId}` — the 1:1 enforcement key. */
    holdingKey: text("holding_key").notNull(),
    userId: text("user_id").notNull(),
    propertyId: text("property_id").notNull(),
    /** Delivery wallet snapshot at request time (the wallet verified with the payment). */
    walletAddress: text("wallet_address").notNull(),
    /** TON NFT collection address (configured minter collection). */
    collectionAddress: text("collection_address"),
    /** NFT item index within the collection. */
    nftItemId: integer("nft_item_id"),
    /** Minted NFT item address (user-friendly form). */
    nftAddress: text("nft_address"),
    status: text("status").notNull(),
    /** Stable off-chain metadata URL served by the API. */
    metadataUrl: text("metadata_url"),
    mintTxHash: text("mint_tx_hash"),
    transferTxHash: text("transfer_tx_hash"),
    /** Number of mint/transfer attempts so far (for retry visibility). */
    attempts: integer("attempts").notNull().default(0),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "holding_nfts_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.propertyId],
      foreignColumns: [properties.id],
      name: "holding_nfts_property_id_fk",
    }).onDelete("cascade"),
    check(
      "holding_nfts_status_check",
      sql`${t.status} IN ('pending', 'minting', 'minted', 'transferring', 'delivered', 'failed')`,
    ),
    uniqueIndex("holding_nfts_holding_key_uidx").on(t.holdingKey),
    uniqueIndex("holding_nfts_user_property_uidx").on(t.userId, t.propertyId),
    index("holding_nfts_status_idx").on(t.status, t.createdAt),
    index("holding_nfts_user_idx").on(t.userId, t.createdAt),
  ],
);

export type HoldingNftRow = typeof holdingNfts.$inferSelect;
export type NewHoldingNftRow = typeof holdingNfts.$inferInsert;
