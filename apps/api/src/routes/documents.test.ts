import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { createDocumentRoutes, type DocumentRouteDeps } from "./documents.js";
import { createMemoryDocumentStore, type DocumentRecord } from "../marketplace/document-store.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { S3Signer } from "../lib/s3-sign.js";
import { signSessionToken } from "../auth/session.js";

const SESSION = { secret: "test-session-secret-32-chars-min!!", ttlSeconds: 3600 };

const s3Signer = new S3Signer({
  accountId: "test", accessKeyId: "test", secretAccessKey: "test",
  bucket: "test", publicBaseUrl: "https://media.example.com",
});

const SEED: DocumentRecord[] = [
  {
    id: "doc-1", propertyId: "prop-abc", title: "Test Doc", kind: "offering",
    storageKey: "documents/prop-abc/test.pdf", fileSize: 1000, contentType: "application/pdf",
    createdAt: new Date("2026-01-01").toISOString(),
  },
  {
    id: "doc-2", propertyId: "prop-abc", title: "Finance", kind: "financial",
    storageKey: "documents/prop-abc/fin.pdf", fileSize: 2000, contentType: "application/pdf",
    createdAt: new Date("2026-01-02").toISOString(),
  },
];

function seedUser(id: string, displayName: string) {
  return {
    id,
    displayName,
    username: null,
    photoUrl: null,
    role: "investor" as const,
    walletAddress: null,
    onboarded: false,
    useTelegramTheme: false,
    referredByUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeDeps(over: Partial<DocumentRouteDeps> = {}): DocumentRouteDeps {
  return {
    documents: createMemoryDocumentStore(SEED),
    s3Signer,
    session: SESSION,
    users: createMemoryUserStore([
      seedUser("user-a", "Alice"),
    ]),
    ...over,
  };
}

describe("document routes", () => {
  describe("GET /v1/properties/:id/documents", () => {
    it("returns document list", async () => {
      const app = new Hono().route("/", createDocumentRoutes(makeDeps()));
      const res = await app.request("/v1/properties/prop-abc/documents");
      expect(res.status).toBe(200);
      const body = (await res.json()) as { documents: Array<{ id: string; title: string; kind: string }> };
      expect(body.documents).toHaveLength(2);
      expect(body.documents[0]!.title).toBe("Test Doc");
      expect(body.documents[0]!.kind).toBe("offering");
    });

    it("returns empty array for unknown property", async () => {
      const app = new Hono().route("/", createDocumentRoutes(makeDeps()));
      const res = await app.request("/v1/properties/unknown/documents");
      expect(res.status).toBe(200);
      const body = (await res.json()) as { documents: unknown[] };
      expect(body.documents).toEqual([]);
    });
  });

  describe("GET /v1/properties/:id/documents/:docId/url", () => {
    it("returns signed URL + expiresAt", async () => {
      const app = new Hono().route("/", createDocumentRoutes(makeDeps()));
      const { token } = await signSessionToken("user-a", SESSION);
      const res = await app.request("/v1/properties/prop-abc/documents/doc-1/url", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { url: string; expiresAt: string };
      expect(body.url).toContain("X-Amz-Signature=");
      expect(body.expiresAt).toBeTruthy();
      expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it("returns 401 without auth", async () => {
      const app = new Hono().route("/", createDocumentRoutes(makeDeps()));
      const res = await app.request("/v1/properties/prop-abc/documents/doc-1/url");
      expect(res.status).toBe(401);
    });

    it("returns 404 for unknown doc", async () => {
      const app = new Hono().route("/", createDocumentRoutes(makeDeps()));
      const { token } = await signSessionToken("user-a", SESSION);
      const res = await app.request("/v1/properties/prop-abc/documents/unknown/url", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(404);
    });

    it("returns 404 for doc from wrong property", async () => {
      const app = new Hono().route("/", createDocumentRoutes(makeDeps()));
      const { token } = await signSessionToken("user-a", SESSION);
      const res = await app.request("/v1/properties/wrong-prop/documents/doc-1/url", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(404);
    });

    it("returns 501 when s3Signer is null", async () => {
      const app = new Hono().route("/", createDocumentRoutes(makeDeps({ s3Signer: null })));
      const { token } = await signSessionToken("user-a", SESSION);
      const res = await app.request("/v1/properties/prop-abc/documents/doc-1/url", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(501);
    });
  });
});
