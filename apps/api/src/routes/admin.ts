import { Hono } from "hono";
import type { AuditStore } from "../audit/audit-store.js";
import { writeAuditEvent } from "../audit/write-audit.js";
import { requireAdminSecret } from "../admin/admin-middleware.js";
import type { PauseScope, PropertyStore } from "../marketplace/property-store.js";
import type { S3Signer } from "../lib/s3-sign.js";

const VALID_SCOPES: PauseScope[] = ["sale", "distribution", "all"];

function isPauseScope(v: unknown): v is PauseScope {
  return VALID_SCOPES.includes(v as PauseScope);
}

export type AdminRouteDeps = {
  adminSecret: string;
  properties: PropertyStore;
  audit?: AuditStore | null;
  s3Signer?: S3Signer | null;
};

export function createAdminRoutes(deps: AdminRouteDeps) {
  const app = new Hono();

  app.use("/v1/admin/*", requireAdminSecret(deps.adminSecret));

  app.post("/v1/admin/properties/:id/pause", async (c) => {
    const id = c.req.param("id");
    if (!id?.trim()) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    const listing = await deps.properties.getById(id);
    if (!listing) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    let body: { scope?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { code: "validation_error", message: "Invalid JSON body" },
        400,
      );
    }
    const scope = body?.scope;
    if (!isPauseScope(scope)) {
      return c.json(
        {
          code: "validation_error",
          message: "scope must be 'sale', 'distribution', or 'all'",
        },
        400,
      );
    }

    const flags: { salePaused?: boolean; distributionPaused?: boolean } = {};
    if (scope === "sale" || scope === "all") flags.salePaused = true;
    if (scope === "distribution" || scope === "all")
      flags.distributionPaused = true;

    const updated = await deps.properties.setPauseFlags(id, flags);
    if (!updated) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "admin.pause",
        actorType: "admin",
        actorUserId: null,
        actorLabel: "admin",
        resourceType: "property",
        resourceId: id,
        summary: `Paused ${scope} for property ${id}`,
        payload: { propertyId: id, scope, flags },
      });
    }

    return c.json({ ok: true, property: updated });
  });

  app.post("/v1/admin/properties/:id/unpause", async (c) => {
    const id = c.req.param("id");
    if (!id?.trim()) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    const listing = await deps.properties.getById(id);
    if (!listing) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    let body: { scope?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { code: "validation_error", message: "Invalid JSON body" },
        400,
      );
    }
    const scope = body?.scope;
    if (!isPauseScope(scope)) {
      return c.json(
        {
          code: "validation_error",
          message: "scope must be 'sale', 'distribution', or 'all'",
        },
        400,
      );
    }

    const flags: { salePaused?: boolean; distributionPaused?: boolean } = {};
    if (scope === "sale" || scope === "all") flags.salePaused = false;
    if (scope === "distribution" || scope === "all")
      flags.distributionPaused = false;

    const updated = await deps.properties.setPauseFlags(id, flags);
    if (!updated) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "admin.unpause",
        actorType: "admin",
        actorUserId: null,
        actorLabel: "admin",
        resourceType: "property",
        resourceId: id,
        summary: `Unpaused ${scope} for property ${id}`,
        payload: { propertyId: id, scope, flags },
      });
    }

    return c.json({ ok: true, property: updated });
  });

  return app;
}
