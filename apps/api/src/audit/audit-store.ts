import { and, desc, eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { auditEvents } from "../db/schema/audit-events.js";
import type { AuditAction } from "./audit-actions.js";
import { hashAuditPayload } from "./hash-payload.js";

export type AuditEventInput = {
  action: AuditAction;
  actorType: "user" | "system";
  actorUserId?: string | null;
  actorLabel?: string | null;
  resourceType: string;
  resourceId: string;
  summary: string;
  payload?: Record<string, unknown>;
  requestId?: string | null;
};

export type AuditEventRecord = {
  id: string;
  action: string;
  actorType: "user" | "system";
  actorUserId: string | null;
  actorLabel: string | null;
  resourceType: string;
  resourceId: string;
  summary: string;
  payloadHash: string;
  payload: Record<string, unknown> | null;
  requestId: string | null;
  createdAt: Date;
};

export type AuditStore = {
  insert(input: AuditEventInput): Promise<{ id: string }>;
  listByAction(action: AuditAction): Promise<AuditEventRecord[]>;
  listByResource(
    resourceType: string,
    resourceId: string,
  ): Promise<AuditEventRecord[]>;
};

function mapRow(r: {
  id: string;
  action: string;
  actorType: string;
  actorUserId: string | null;
  actorLabel: string | null;
  resourceType: string;
  resourceId: string;
  summary: string;
  payloadHash: string;
  payload: unknown;
  requestId: string | null;
  createdAt: Date;
}): AuditEventRecord {
  return {
    id: r.id,
    action: r.action,
    actorType: r.actorType === "system" ? "system" : "user",
    actorUserId: r.actorUserId,
    actorLabel: r.actorLabel,
    resourceType: r.resourceType,
    resourceId: r.resourceId,
    summary: r.summary,
    payloadHash: r.payloadHash,
    payload:
      r.payload && typeof r.payload === "object" && !Array.isArray(r.payload)
        ? (r.payload as Record<string, unknown>)
        : null,
    requestId: r.requestId,
    createdAt: r.createdAt,
  };
}

function truncateSummary(s: string): string {
  return s.length <= 500 ? s : s.slice(0, 497) + "...";
}

export function createDbAuditStore(db: Db): AuditStore {
  return {
    async insert(input) {
      const id = `aud_${crypto.randomUUID()}`;
      const payload = input.payload ?? {};
      const payloadHash = hashAuditPayload(payload);
      await db.insert(auditEvents).values({
        id,
        action: input.action,
        actorType: input.actorType,
        actorUserId: input.actorUserId ?? null,
        actorLabel: input.actorLabel ?? null,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        summary: truncateSummary(input.summary),
        payloadHash,
        payload,
        requestId: input.requestId ?? null,
        createdAt: new Date(),
      });
      return { id };
    },

    async listByAction(action) {
      const rows = await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.action, action))
        .orderBy(desc(auditEvents.createdAt));
      return rows.map(mapRow);
    },

    async listByResource(resourceType, resourceId) {
      const rows = await db
        .select()
        .from(auditEvents)
        .where(
          and(
            eq(auditEvents.resourceType, resourceType),
            eq(auditEvents.resourceId, resourceId),
          ),
        )
        .orderBy(desc(auditEvents.createdAt));
      return rows.map(mapRow);
    },
  };
}

export function createMemoryAuditStore(): AuditStore & {
  _rows: AuditEventRecord[];
} {
  const rows: AuditEventRecord[] = [];
  return {
    _rows: rows,

    async insert(input) {
      const id = `aud_${crypto.randomUUID()}`;
      const payload = input.payload ?? {};
      const record: AuditEventRecord = {
        id,
        action: input.action,
        actorType: input.actorType,
        actorUserId: input.actorUserId ?? null,
        actorLabel: input.actorLabel ?? null,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        summary: truncateSummary(input.summary),
        payloadHash: hashAuditPayload(payload),
        payload,
        requestId: input.requestId ?? null,
        createdAt: new Date(),
      };
      rows.push(record);
      return { id };
    },

    async listByAction(action) {
      return rows
        .filter((r) => r.action === action)
        .map((r) => ({ ...r }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    async listByResource(resourceType, resourceId) {
      return rows
        .filter(
          (r) =>
            r.resourceType === resourceType && r.resourceId === resourceId,
        )
        .map((r) => ({ ...r }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
  };
}
