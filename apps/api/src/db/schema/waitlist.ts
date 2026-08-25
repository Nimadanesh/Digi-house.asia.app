import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * A6: marketing-site waitlist signups. No notifications are sent yet (U3).
 * Idempotent on email — re-POSTing the same address updates nothing visible.
 */
export const waitlist = pgTable(
  "waitlist",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    telegram: text("telegram"),
    propertyId: text("property_id"),
    utm: text("utm"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check("waitlist_email_shape", sql`${t.email} LIKE '%_@%._%'`),
    index("waitlist_created_at_idx").on(t.createdAt),
  ],
);

export type WaitlistRow = typeof waitlist.$inferSelect;
export type NewWaitlistRow = typeof waitlist.$inferInsert;
