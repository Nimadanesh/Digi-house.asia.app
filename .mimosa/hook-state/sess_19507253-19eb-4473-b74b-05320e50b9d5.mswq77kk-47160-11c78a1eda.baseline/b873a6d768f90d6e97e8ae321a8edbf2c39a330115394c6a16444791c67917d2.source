/**
 * Users table — PK is Telegram user id (string).
 * recovery_code: human-held account id (DH-XXXX-XXXX); unique; shown only to owner.
 * profile_completed_at: set when light profile setup finishes.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    displayName: text("display_name").notNull(),
    username: text("username"),
    photoUrl: text("photo_url"),
    role: text("role").notNull().default("investor"),
    walletAddress: text("wallet_address"),
    phone: text("phone"),
    recoveryCode: text("recovery_code"),
    recoveryCodeCreatedAt: timestamp("recovery_code_created_at", {
      withTimezone: true,
    }),
    profileCompletedAt: timestamp("profile_completed_at", {
      withTimezone: true,
    }),
    onboarded: boolean("onboarded").notNull().default(false),
    useTelegramTheme: boolean("use_telegram_theme").notNull().default(false),
    referredByUserId: text("referred_by_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("users_wallet_address_idx").on(t.walletAddress),
    uniqueIndex("users_recovery_code_uidx").on(t.recoveryCode),
    check("users_role_check", sql`${t.role} IN ('investor', 'owner')`),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
