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

  app.post("/v1/admin/properties", async (c) => {
    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ code: "validation_error", message: "Invalid JSON body" }, 400);
    }

    const { title, location, description, totalShares, sharePriceUsd, annualRentUsd, ownerWalletAddress, meta, images, status } = body as Record<string, unknown>;

    if (!title || typeof title !== "string" || !title.trim()) {
      return c.json({ code: "validation_error", message: "title is required" }, 400);
    }
    if (!location || typeof location !== "string" || !location.trim()) {
      return c.json({ code: "validation_error", message: "location is required" }, 400);
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      return c.json({ code: "validation_error", message: "description is required" }, 400);
    }
    if (typeof totalShares !== "number" || totalShares <= 0 || !Number.isInteger(totalShares)) {
      return c.json({ code: "validation_error", message: "totalShares must be a positive integer" }, 400);
    }
    if (typeof sharePriceUsd !== "number" || sharePriceUsd <= 0 || !Number.isInteger(sharePriceUsd)) {
      return c.json({ code: "validation_error", message: "sharePriceUsd must be a positive integer (cents)" }, 400);
    }
    if (typeof annualRentUsd !== "number" || annualRentUsd <= 0 || !Number.isInteger(annualRentUsd)) {
      return c.json({ code: "validation_error", message: "annualRentUsd must be a positive integer (cents)" }, 400);
    }
    if (!ownerWalletAddress || typeof ownerWalletAddress !== "string" || !ownerWalletAddress.trim()) {
      return c.json({ code: "validation_error", message: "ownerWalletAddress is required" }, 400);
    }
    if (!meta || typeof meta !== "object") {
      return c.json({ code: "validation_error", message: "meta is required" }, 400);
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const shortId = crypto.randomUUID().slice(0, 8);
    const propertyId = `prop-${slug}-${shortId}`;

    const created = await deps.properties.create({
      id: propertyId,
      title: title.trim(),
      location: location.trim(),
      description: description.trim(),
      images: Array.isArray(images) ? images.map(String) : [],
      totalShares,
      sharePriceUsd,
      annualRentUsd,
      ownerWalletAddress: ownerWalletAddress.trim(),
      meta: meta as Record<string, unknown>,
      status: status === "funding" || status === "funded" || status === "resale" ? status : "draft",
    });

    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "admin.create",
        actorType: "admin",
        actorUserId: null,
        actorLabel: "admin",
        resourceType: "property",
        resourceId: propertyId,
        summary: `Created property ${title}`,
        payload: { propertyId, title, status: created.status },
      });
    }

    return c.json({ ok: true, property: created }, 201);
  });

  app.patch("/v1/admin/properties/:id", async (c) => {
    const id = c.req.param("id");
    if (!id?.trim()) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    const existing = await deps.properties.getById(id);
    if (!existing) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ code: "validation_error", message: "Invalid JSON body" }, 400);
    }

    const patch: Record<string, unknown> = {};
    const allowedFields = ["title", "location", "description", "images", "totalShares", "sharePriceUsd", "annualRentUsd", "ownerWalletAddress", "meta", "status", "sharesSold"] as const;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "status") {
          const s = String(body[field]);
          if (!["draft", "funding", "funded", "resale"].includes(s)) {
            return c.json({ code: "validation_error", message: `Invalid status "${s}"` }, 400);
          }
          patch[field] = s;
        } else {
          patch[field] = body[field];
        }
      }
    }

    if (Object.keys(patch).length === 0) {
      return c.json({ code: "validation_error", message: "No fields to update" }, 400);
    }

    const updated = await deps.properties.update(id, patch as unknown as Parameters<PropertyStore["update"]>[1]);

    if (deps.audit && updated) {
      await writeAuditEvent(deps.audit, {
        action: "admin.update",
        actorType: "admin",
        actorUserId: null,
        actorLabel: "admin",
        resourceType: "property",
        resourceId: id,
        summary: `Updated property ${id}`,
        payload: { propertyId: id, patch },
      });
    }

    return c.json({ ok: true, property: updated });
  });

  app.post("/v1/admin/properties/:id/media/sign", async (c) => {
    const id = c.req.param("id");
    if (!id?.trim()) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    const existing = await deps.properties.getById(id);
    if (!existing) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    if (!deps.s3Signer) {
      return c.json(
        { code: "not_configured", message: "R2 media upload is not configured" },
        501,
      );
    }

    let body: { filename?: string; contentType?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ code: "validation_error", message: "Invalid JSON body" }, 400);
    }

    const filename = body?.filename;
    const contentType = body?.contentType;
    if (!filename || typeof filename !== "string" || !filename.trim()) {
      return c.json({ code: "validation_error", message: "filename is required" }, 400);
    }
    if (!contentType || typeof contentType !== "string" || !contentType.trim()) {
      return c.json({ code: "validation_error", message: "contentType is required" }, 400);
    }

    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `uploads/${crypto.randomUUID()}-${sanitized}`;
    const { signedUrl, publicUrl } = deps.s3Signer.getSignedPutUrl(key, contentType);

    return c.json({ signedUrl, publicUrl, key });
  });

  return app;
}
