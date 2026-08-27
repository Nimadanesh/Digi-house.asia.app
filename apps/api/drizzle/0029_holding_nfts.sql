-- FractionalLuxe Collectible Position NFT (approved 2026-08-26):
-- The DB remains the 100% source of truth for ownership/yield/trades/balances.
-- The NFT is a display-only collectible receipt: 1 holding -> max 1 NFT.
-- Enforced by UNIQUE(holding_key) and UNIQUE(user_id, property_id).
-- The NFT carries NO financial logic; mint/transfer are asynchronous and must
-- never roll back or block the purchase (the buy settles independently).
CREATE TABLE IF NOT EXISTS "holding_nfts" (
  "id" text PRIMARY KEY,
  "holding_key" text NOT NULL,
  "user_id" text NOT NULL,
  "property_id" text NOT NULL,
  "wallet_address" text NOT NULL,
  "collection_address" text,
  "nft_item_id" integer,
  "nft_address" text,
  "status" text NOT NULL,
  "metadata_url" text,
  "mint_tx_hash" text,
  "transfer_tx_hash" text,
  "attempts" integer NOT NULL DEFAULT 0,
  "error_code" text,
  "error_message" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "holding_nfts_holding_key_uidx" UNIQUE ("holding_key"),
  CONSTRAINT "holding_nfts_user_property_uidx" UNIQUE ("user_id", "property_id"),
  CONSTRAINT "holding_nfts_status_check" CHECK ("status" IN ('pending', 'minting', 'minted', 'transferring', 'delivered', 'failed')),
  CONSTRAINT "holding_nfts_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "holding_nfts_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "holding_nfts_status_idx" ON "holding_nfts" ("status", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "holding_nfts_user_idx" ON "holding_nfts" ("user_id", "created_at");
