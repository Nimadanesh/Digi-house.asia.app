import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * TON wallets bound to a user (ROADMAP wallet bind / multi-wallet).
 * Never store private keys or mnemonics.
 * App should keep at most one `is_primary` per user; `users.wallet_address` mirrors primary.
 */
export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    address: text("address").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    label: text("label"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("wallets_address_uidx").on(t.address),
    index("wallets_user_id_idx").on(t.userId),
    uniqueIndex("wallets_one_primary_per_user_uidx")
      .on(t.userId)
      .where(sql`${t.isPrimary} = true`),
  ],
);

export type WalletRow = typeof wallets.$inferSelect;
export type NewWalletRow = typeof wallets.$inferInsert;
