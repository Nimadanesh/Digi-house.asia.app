import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * Append-only audit log (INSERT only). No secrets/tokens in payload.
 * Actor: user (session) or system (tickPayout worker).
 */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    action: text("action").notNull(),
    actorType: text("actor_type").notNull(),
    actorUserId: text("actor_user_id"),
    actorLabel: text("actor_label"),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    summary: text("summary").notNull(),
    payloadHash: text("payload_hash").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    requestId: text("request_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.actorUserId],
      foreignColumns: [users.id],
      name: "audit_events_actor_user_id_fk",
    }).onDelete("set null"),
    check(
      "audit_events_actor_type_check",
      sql`${t.actorType} IN ('user', 'system')`,
    ),
    index("audit_events_created_at_idx").on(t.createdAt),
    index("audit_events_actor_user_id_idx").on(t.actorUserId),
    index("audit_events_action_created_idx").on(t.action, t.createdAt),
    index("audit_events_resource_idx").on(t.resourceType, t.resourceId),
  ],
);

export type AuditEventRow = typeof auditEvents.$inferSelect;
export type NewAuditEventRow = typeof auditEvents.$inferInsert;
