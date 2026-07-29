import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * App users — PK is Telegram user id (string).
 * `wallet_address` is denormalized primary/display wallet (DATA_MODELS UserProfile).
 * Canonical bind history / multi-wallet lives in `wallets` (source of truth for addresses).
 */
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    displayName: text("display_name").notNull(),
    username: text("username"),
    photoUrl: text("photo_url"),
    role: text("role").notNull().default("investor"),
    walletAddress: text("wallet_address"),
    onboarded: boolean("onboarded").notNull().default(false),
    useTelegramTheme: boolean("use_telegram_theme").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("users_wallet_address_idx").on(t.walletAddress),
    check("users_role_check", sql`${t.role} IN ('investor', 'owner')`),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
