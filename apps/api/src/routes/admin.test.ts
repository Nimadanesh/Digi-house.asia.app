import { describe, expect, it, beforeEach } from "vitest";
import { Hono } from "hono";
import type { Logger } from "pino";
import { createAdminRoutes, type AdminRouteDeps } from "./admin.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import { createMemoryAuditStore } from "../audit/audit-store.js";
import { S3Signer } from "../lib/s3-sign.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";

const ADMIN_SECRET = "test-admin-secret-32-chars-min!!";

const silentLog = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  fatal: () => {},
  trace: () => {},
  child: () => silentLog,
} as unknown as Logger;

const s3Signer = new S3Signer({
  accountId: "test",
  accessKeyId: "test",
  secretAccessKey: "test",
  bucket: "test",
  publicBaseUrl: "https://media.example.com",
});

function makeDeps(over: Partial<AdminRouteDeps> = {}): AdminRouteDeps {
  const seedRows = SEED_PROPERTIES.map(toPropertyInsert);
  return {
    adminSecret: ADMIN_SECRET,
    properties: createMemoryPropertyStore(seedRows),
    audit: createMemoryAuditStore(),
    s3Signer,
    ...over,
  };
}

describe("admin routes", () => {
  describe("auth", () => {
    it("returns 401 without x-admin-key", async () => {
      const app = new Hono().route("/", createAdminRoutes(makeDeps()));
      const res = await app.request("/v1/admin/properties", { method: "POST" });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.code).toBe("unauthorized");
    });

    it("returns 401 with wrong key", async () => {
      const app = new Hono().route("/", createAdminRoutes(makeDeps()));
      const res = await app.request("/v1/admin/properties", {
        method: "POST",
        headers: { "x-admin-key": "wrong" },
      });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /v1/admin/properties", () => {
    it("creates a property with status draft", async () => {
      const app = new Hono().route("/", createAdminRoutes(makeDeps()));
      const res = await app.request("/v1/admin/properties", {
        method: "POST",
        headers: {
          "x-admin-key": ADMIN_SECRET,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "New Test Property",
          location: "Test City",
          description: "A test property",
          totalShares: 10000,
          sharePriceUsd: 50000,
          annualRentUsd: 240000,
          ownerWalletAddress: "UQAAAA",
          meta: { propertyType: "apartment", sizeSqm: 80, yearBuilt: 2020 },
        }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.property.status).toBe("draft");
      expect(body.property.id).toMatch(/^prop-new-test-property-/);
    });

    it("returns 400 on missing required fields", async () => {
      const app = new Hono().route("/", createAdminRoutes(makeDeps()));
      const res = await app.request("/v1/admin/properties", {
        method: "POST",
        headers: {
          "x-admin-key": ADMIN_SECRET,
          "content-type": "application/json",
        },
        body: JSON.stringify({ title: "Incomplete" }),
      });
      expect(res.status).toBe(400);
    });

    it("writes audit event", async () => {
      const audit = createMemoryAuditStore();
      const app = new Hono().route("/", createAdminRoutes(makeDeps({ audit })));
      await app.request("/v1/admin/properties", {
        method: "POST",
        headers: {
          "x-admin-key": ADMIN_SECRET,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Audit Test",
          location: "City",
          description: "desc",
          totalShares: 1000,
          sharePriceUsd: 10000,
          annualRentUsd: 50000,
          ownerWalletAddress: "UQBBB",
          meta: {},
        }),
      });
      expect(audit._rows.length).toBe(1);
      expect(audit._rows[0]!.action).toBe("admin.create");
    });
  });

  describe("PATCH /v1/admin/properties/:id", () => {
    it("updates status from draft to funding", async () => {
      const deps = makeDeps();
      const app = new Hono().route("/", createAdminRoutes(deps));

      // Create a property
      const createRes = await app.request("/v1/admin/properties", {
        method: "POST",
        headers: {
          "x-admin-key": ADMIN_SECRET,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Publish Me",
          location: "City",
          description: "desc",
          totalShares: 1000,
          sharePriceUsd: 10000,
          annualRentUsd: 50000,
          ownerWalletAddress: "UQCCC",
          meta: {},
        }),
      });
      const created = (await createRes.json()).property;

      // Publish
      const patchRes = await app.request(`/v1/admin/properties/${created.id}`, {
        method: "PATCH",
        headers: {
          "x-admin-key": ADMIN_SECRET,
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "funding" }),
      });
      expect(patchRes.status).toBe(200);
      const patched = await patchRes.json();
      expect(patched.property.status).toBe("funding");
    });

    it("returns 404 for unknown id", async () => {
      const app = new Hono().route("/", createAdminRoutes(makeDeps()));
      const res = await app.request("/v1/admin/properties/nonexistent", {
        method: "PATCH",
        headers: {
          "x-admin-key": ADMIN_SECRET,
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "funding" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("POST /v1/admin/properties/:id/media/sign", () => {
    it("returns signedUrl and publicUrl", async () => {
      const deps = makeDeps();
      const app = new Hono().route("/", createAdminRoutes(deps));

      // Create property first
      const createRes = await app.request("/v1/admin/properties", {
        method: "POST",
        headers: {
          "x-admin-key": ADMIN_SECRET,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Media Test",
          location: "City",
          description: "desc",
          totalShares: 1000,
          sharePriceUsd: 10000,
          annualRentUsd: 50000,
          ownerWalletAddress: "UQDDD",
          meta: {},
        }),
      });
      const created = (await createRes.json()).property;

      const signRes = await app.request(
        `/v1/admin/properties/${created.id}/media/sign`,
        {
          method: "POST",
          headers: {
            "x-admin-key": ADMIN_SECRET,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            filename: "photo.jpg",
            contentType: "image/jpeg",
          }),
        },
      );
      expect(signRes.status).toBe(200);
      const body = await signRes.json();
      expect(body.signedUrl).toContain("X-Amz-Signature=");
      expect(body.publicUrl).toBe(
        `https://media.example.com/${body.key}`,
      );
      expect(body.key).toMatch(/^uploads\//);
    });

    it("returns 501 when s3Signer is null", async () => {
      const app = new Hono().route(
        "/",
        createAdminRoutes(makeDeps({ s3Signer: null })),
      );
      const res = await app.request(
        "/v1/admin/properties/prop-marina-vista-4b/media/sign",
        {
          method: "POST",
          headers: {
            "x-admin-key": ADMIN_SECRET,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            filename: "photo.jpg",
            contentType: "image/jpeg",
          }),
        },
      );
      expect(res.status).toBe(501);
    });

    it("returns 404 for unknown property", async () => {
      const app = new Hono().route("/", createAdminRoutes(makeDeps()));
      const res = await app.request(
        "/v1/admin/properties/nonexistent/media/sign",
        {
          method: "POST",
          headers: {
            "x-admin-key": ADMIN_SECRET,
            "content-type": "application/json",
          },
          body: JSON.stringify({ filename: "p.jpg", contentType: "image/jpeg" }),
        },
      );
      expect(res.status).toBe(404);
    });
  });

  describe("draft exclusion from marketplace", () => {
    it("draft properties are not in list results", async () => {
      const deps = makeDeps();
      // Create a draft property
      const created = await deps.properties.create({
        id: "prop-draft-test",
        title: "Draft Property",
        location: "Hidden",
        description: "Should not appear in marketplace",
        totalShares: 1000,
        sharePriceUsd: 10000,
        annualRentUsd: 50000,
        ownerWalletAddress: "UQEEE",
        meta: {},
        status: "draft",
      });

      const listings = await deps.properties.list();
      const draftIds = listings
        .filter((l) => l.status === "draft")
        .map((l) => l.id);
      expect(draftIds).not.toContain("prop-draft-test");
    });
  });
});