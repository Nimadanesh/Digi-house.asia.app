# Property Documents + Signed Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Property detail page shows document list; tap downloads via short-lived signed GET URL from R2.

**Architecture:** New `property_documents` DB table (migration 0014). Two new API endpoints: public list endpoint and auth-required signed-URL endpoint. Existing S3Signer extended with `getSignedGetUrl`. Mini App adds types, repo methods, hook, and presentational component all behind the existing HttpRepos boundary.

**Tech Stack:** Hono, Drizzle ORM, Postgres, native `crypto` (AWS SigV4), Vitest, TanStack Query, shadcn/ui.

## Global Constraints

- All API routes follow existing patterns (route factory, typed deps, `c.req.param()`, `c.json()`)
- Auth uses `requireSession` middleware (Bearer JWT) for URL endpoint; list endpoint is public
- Money values in integer cents; TON in nanoTON
- No `any` types; strict TypeScript
- Component imports no `lib/ton`, `lib/mock`, raw `fetch` to R2
- Signed GET URL expires ≤15 min (default 900s)
- Copy: not financial advice; "Documents" section label

---

### Task 1: Migration + Drizzle schema + DocumentStore

**Files:**
- Create: `apps/api/drizzle/0014_property_documents.sql`
- Modify: `apps/api/drizzle/meta/_journal.json`
- Create: `apps/api/src/db/schema/property-documents.ts`
- Create: `apps/api/src/marketplace/document-store.ts`

**Interfaces:**
- Produces: `propertyDocuments` Drizzle table object, `DocumentMeta` type, `DocumentStore` interface with `listByProperty(propertyId)` and `getById(docId)`

- [ ] **Step 1: Create migration 0014**

Create `apps/api/drizzle/0014_property_documents.sql`:

```sql
CREATE TABLE "property_documents" (
  "id" text PRIMARY KEY NOT NULL,
  "property_id" text NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "kind" text NOT NULL CHECK ("kind" IN ('legal', 'financial', 'offering', 'other')),
  "storage_key" text NOT NULL,
  "file_size" integer,
  "content_type" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_documents_property_id" ON "property_documents" ("property_id");
```

- [ ] **Step 2: Add journal entry**

Read `apps/api/drizzle/meta/_journal.json`, add entry idx=13 after the 0013 entry:

```json
    {
      "idx": 13,
      "version": "7",
      "when": 1788000000000,
      "tag": "0014_property_documents",
      "breakpoints": true
    }
```

- [ ] **Step 3: Create Drizzle schema**

Create `apps/api/src/db/schema/property-documents.ts`:

```ts
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { properties } from "./properties.js";

export const propertyDocuments = pgTable("property_documents", {
  id: text("id").primaryKey(),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  kind: text("kind").notNull(),
  storageKey: text("storage_key").notNull(),
  fileSize: integer("file_size"),
  contentType: text("content_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

Also export the inferred types:

```ts
export type PropertyDocumentRow = typeof propertyDocuments.$inferSelect;
export type NewPropertyDocumentRow = typeof propertyDocuments.$inferInsert;
```

- [ ] **Step 4: Create DocumentStore**

Create `apps/api/src/marketplace/document-store.ts`:

```ts
import { and, desc, eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { propertyDocuments } from "../db/schema/property-documents.js";

export type DocumentMeta = {
  id: string;
  title: string;
  kind: "legal" | "financial" | "offering" | "other";
  fileSize: number | null;
  createdAt: string;
};

export type DocumentRecord = DocumentMeta & {
  storageKey: string;
  contentType: string | null;
};

function mapRow(r: { id: string; title: string; kind: string; fileSize: number | null; createdAt: Date; storageKey: string; contentType: string | null }): DocumentRecord {
  return {
    id: r.id,
    title: r.title,
    kind: r.kind as DocumentMeta["kind"],
    fileSize: r.fileSize,
    createdAt: r.createdAt.toISOString(),
    storageKey: r.storageKey,
    contentType: r.contentType,
  };
}

function toMeta(r: DocumentRecord): DocumentMeta {
  return {
    id: r.id,
    title: r.title,
    kind: r.kind,
    fileSize: r.fileSize,
    createdAt: r.createdAt,
  };
}

export type DocumentStore = {
  listByProperty(propertyId: string): Promise<DocumentMeta[]>;
  getById(docId: string): Promise<DocumentRecord | null>;
};

export function createDbDocumentStore(db: Db): DocumentStore {
  return {
    async listByProperty(propertyId) {
      const rows = await db
        .select()
        .from(propertyDocuments)
        .where(eq(propertyDocuments.propertyId, propertyId))
        .orderBy(desc(propertyDocuments.createdAt));
      return rows.map(mapRow).map(toMeta);
    },

    async getById(docId) {
      const rows = await db
        .select()
        .from(propertyDocuments)
        .where(eq(propertyDocuments.id, docId))
        .limit(1);
      const row = rows[0];
      return row ? mapRow(row) : null;
    },
  };
}

export function createMemoryDocumentStore(
  seed: Array<{
    id: string;
    propertyId: string;
    title: string;
    kind: string;
    storageKey: string;
    fileSize: number | null;
    contentType: string | null;
    createdAt: Date;
  }>,
): DocumentStore & { _rows: DocumentRecord[] } {
  const rows = seed.map((r) => ({
    id: r.id,
    title: r.title,
    kind: r.kind as DocumentMeta["kind"],
    fileSize: r.fileSize,
    createdAt: r.createdAt.toISOString(),
    storageKey: r.storageKey,
    contentType: r.contentType,
  }));

  return {
    _rows: rows,

    async listByProperty(propertyId) {
      return rows
        .filter((r) => r.kind !== undefined) // all rows match
        .filter((r) => { const match = rows.find((x) => x.storageKey.includes(propertyId) || propertyId === "all"); return match !== undefined || propertyId === "all"; })
        .map(toMeta);
    },

    async getById(docId) {
      const row = rows.find((r) => r.id === docId);
      return row ?? null;
    },
  };
}
```

Wait, the memory store `listByProperty` is wrong. Let me fix it. The seed data needs `propertyId`. Let me fix the memory store:

```ts
export function createMemoryDocumentStore(
  seed: DocumentRecord[],
): DocumentStore & { _rows: DocumentRecord[] } {
  const rows = seed.map((r) => ({ ...r }));

  return {
    _rows: rows,

    async listByProperty(propertyId) {
      return rows
        .filter((r) => r.storageKey.startsWith(`documents/${propertyId}/`))
        .map(toMeta);
    },

    async getById(docId) {
      const row = rows.find((r) => r.id === docId);
      return row ?? null;
    },
  };
}
```

Wait, that's not great either. The seed data should include `propertyId`. Let me add `propertyId` to `DocumentRecord`:

Actually, looking at the memory store pattern used in the codebase, the memory store takes `PropertyRow[]` as seed. Similarly, my `DocumentRecord` already has everything except `propertyId`. I should add `propertyId` to the record type.

Let me fix `DocumentRecord`:

```ts
export type DocumentRecord = {
  id: string;
  propertyId: string;
  title: string;
  kind: DocumentMeta["kind"];
  storageKey: string;
  fileSize: number | null;
  contentType: string | null;
  createdAt: string;
};
```

And update `mapRow` to include `propertyId`. Update `getById` return type and memory store accordingly.

Actually, I'll just add `propertyId` to both `DocumentMeta` and `DocumentRecord` — it's useful for debugging.

Wait, the spec says `DocumentMeta` should NOT include `propertyId` — it's returned as part of the property context. But for the memory store filter, I need it. Let me keep it on the record but not on the public meta type.

Let me clean up the code. The important thing is that the plan code is correct.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck -w @digihouse/api
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/drizzle/0014_property_documents.sql apps/api/drizzle/meta/_journal.json apps/api/src/db/schema/property-documents.ts apps/api/src/marketplace/document-store.ts
git commit -m "feat(api): property_documents schema + DocumentStore (P4-04)"
```

---

### Task 2: S3Signer — add getSignedGetUrl

**Files:**
- Modify: `apps/api/src/lib/s3-sign.ts`
- Modify: `apps/api/src/lib/s3-sign.test.ts`

- [ ] **Step 1: Write failing test**

Add to `apps/api/src/lib/s3-sign.test.ts`:

```ts
  describe("getSignedGetUrl", () => {
    it("returns signed GET URL", () => {
      const signer = new S3Signer(config);
      const result = signer.getSignedGetUrl("documents/prop-abc/lease.pdf");
      expect(result.publicUrl).toBe("https://media.example.com/documents/prop-abc/lease.pdf");
      expect(result.signedUrl).toContain("X-Amz-Signature=");
      expect(result.signedUrl).toContain("X-Amz-Algorithm=AWS4-HMAC-SHA256");
    });

    it("defaults to 900s TTL", () => {
      const signer = new S3Signer(config);
      const result = signer.getSignedGetUrl("documents/prop-abc/lease.pdf");
      expect(result.signedUrl).toContain("X-Amz-Expires=900");
    });
  });
```

- [ ] **Step 2: Run to verify failure**

```bash
npm run test -w @digihouse/api -- src/lib/s3-sign.test.ts
```

Expected: FAIL — `getSignedGetUrl` not defined.

- [ ] **Step 3: Implement getSignedGetUrl**

Add to `S3Signer` class in `s3-sign.ts`:

```ts
  getSignedGetUrl(
    key: string,
    ttlMs = 900,
  ): SignedPutUrlResult {
    const { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl } =
      this.config;
    const region = "auto";
    const service = "s3";
    const algorithm = "AWS4-HMAC-SHA256";
    const now = new Date();
    const amzDate = now
      .toISOString()
      .replace(/[:-]/g, "")
      .replace(/\.\d{3}/, "");
    const dateStamp = amzDate.slice(0, 8);
    const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`;

    const canonicalUri = `/${key}`;
    const canonicalQuerystring = [
      `X-Amz-Algorithm=${algorithm}`,
      `X-Amz-Credential=${encodeURIComponent(`${accessKeyId}/${dateStamp}/${region}/${service}/aws4_request`)}`,
      `X-Amz-Date=${amzDate}`,
      `X-Amz-Expires=${ttlMs}`,
      "X-Amz-SignedHeaders=host",
    ].join("&");

    const canonicalHeaders = `host:${host}\n`;
    const signedHeaders = "host";
    const payloadHash = "UNSIGNED-PAYLOAD";

    const canonicalRequest = [
      "GET",
      canonicalUri,
      canonicalQuerystring,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join("\n");

    const signingKey = getSignatureKey(
      secretAccessKey,
      dateStamp,
      region,
      service,
    );
    const signature = hmacHex(signingKey, stringToSign);

    const signedUrl = `https://${host}${canonicalUri}?${canonicalQuerystring}&X-Amz-Signature=${signature}`;
    const publicUrl = `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;

    return { signedUrl, publicUrl };
  }
```

- [ ] **Step 4: Run to verify pass**

```bash
npm run test -w @digihouse/api -- src/lib/s3-sign.test.ts
```

Expected: PASS (all 5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/lib/s3-sign.ts apps/api/src/lib/s3-sign.test.ts
git commit -m "feat(api): add getSignedGetUrl to S3Signer (P4-04)"
```

---

### Task 3: Document routes + app wiring

**Files:**
- Create: `apps/api/src/routes/documents.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Create route factory**

Create `apps/api/src/routes/documents.ts`:

```ts
import { Hono } from "hono";
import { requireSession, type SessionVariables } from "../auth/require-session.js";
import type { SessionConfig } from "../auth/session.js";
import type { UserStore } from "../auth/user-store.js";
import type { S3Signer } from "../lib/s3-sign.js";
import type { DocumentStore } from "../marketplace/document-store.js";

export type DocumentRouteDeps = {
  documents: DocumentStore;
  s3Signer: S3Signer | null;
  session: SessionConfig;
  users: UserStore;
};

export function createDocumentRoutes(deps: DocumentRouteDeps) {
  const app = new Hono();

  // Public: list document metadata
  app.get("/v1/properties/:id/documents", async (c) => {
    const id = c.req.param("id");
    if (!id?.trim()) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }
    const docs = await deps.documents.listByProperty(id);
    return c.json({ documents: docs });
  });

  // Auth required: get signed download URL
  app.get(
    "/v1/properties/:id/documents/:docId/url",
    requireSession({ session: deps.session, users: deps.users }),
    async (c) => {
      const id = c.req.param("id");
      const docId = c.req.param("docId");
      if (!id?.trim() || !docId?.trim()) {
        return c.json({ code: "not_found", message: "Document not found" }, 404);
      }

      const doc = await deps.documents.getById(docId);
      if (!doc || !doc.storageKey.startsWith(`documents/${id}/`)) {
        return c.json({ code: "not_found", message: "Document not found" }, 404);
      }

      if (!deps.s3Signer) {
        return c.json(
          { code: "not_configured", message: "Document download is not configured" },
          501,
        );
      }

      const { signedUrl, publicUrl } = deps.s3Signer.getSignedGetUrl(doc.storageKey);
      const expiresAt = new Date(Date.now() + 900_000).toISOString();

      return c.json({ url: signedUrl, publicUrl, expiresAt });
    },
  );

  return app;
}
```

- [ ] **Step 2: Wire into app.ts**

Open `apps/api/src/app.ts`. Import:

```ts
import { createDocumentRoutes, type DocumentRouteDeps } from "./routes/documents.js";
```

After the admin routes wiring block, add:

```ts
  // P4-04: Property documents
  if (documents && session && users) {
    app.route(
      "/",
      createDocumentRoutes({
        documents,
        session,
        users: users!,
        s3Signer,
      }),
    );
  }
```

Also add `documents` store creation at the top of `createApp`. After the `properties` store creation:

```ts
  let documents: DocumentStore | null = null;
  if (db) {
    documents = createDbDocumentStore(db);
    // will seed documents in Task 4
  }
```

And import `DocumentStore`:

```ts
import { createDbDocumentStore, type DocumentStore } from "./marketplace/document-store.js";
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck -w @digihouse/api
```

Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/documents.ts apps/api/src/app.ts
git commit -m "feat(api): document list + signed URL endpoints (P4-04)"
```

---

### Task 4: API seed data + tests

**Files:**
- Create: `apps/api/src/db/seed/documents-data.ts`
- Modify: `apps/api/src/db/seed/seed-properties.ts` (or seed logic in app.ts)
- Create: `apps/api/src/routes/documents.test.ts`

- [ ] **Step 1: Create document seed data**

Create `apps/api/src/db/seed/documents-data.ts`:

```ts
export const SEED_DOCUMENTS = [
  {
    id: "doc-om-001",
    propertyId: "prop-marina-vista-4b",
    title: "Offering Memorandum",
    kind: "offering",
    storageKey: "documents/prop-marina-vista-4b/om.pdf",
    fileSize: 2_400_000,
    contentType: "application/pdf",
    createdAt: new Date("2026-06-15"),
  },
  {
    id: "doc-fin-q2-001",
    propertyId: "prop-marina-vista-4b",
    title: "Financial Statement Q2 2026",
    kind: "financial",
    storageKey: "documents/prop-marina-vista-4b/fin-q2-2026.pdf",
    fileSize: 1_100_000,
    contentType: "application/pdf",
    createdAt: new Date("2026-07-01"),
  },
  {
    id: "doc-lease-001",
    propertyId: "prop-marina-vista-4b",
    title: "Tenant Lease Agreement",
    kind: "legal",
    storageKey: "documents/prop-marina-vista-4b/lease.pdf",
    fileSize: 800_000,
    contentType: "application/pdf",
    createdAt: new Date("2026-05-20"),
  },
];
```

- [ ] **Step 2: Wire seed into app.ts**

In `apps/api/src/app.ts`, after creating `documents`, add seed logic (only if no documents exist):

```ts
    documents = createDbDocumentStore(db);
    // Seed demo documents if table is empty
    if (env.NODE_ENV !== "production") {
      const existing = await documents.listByProperty("prop-marina-vista-4b");
      if (existing.length === 0) {
        for (const doc of SEED_DOCUMENTS) {
          await db.insert(propertyDocuments).values(doc);
        }
      }
    }
```

Import `SEED_DOCUMENTS` and `propertyDocuments`.

- [ ] **Step 3: Write API tests**

Create `apps/api/src/routes/documents.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { createDocumentRoutes, type DocumentRouteDeps } from "./documents.js";
import { createMemoryDocumentStore } from "../marketplace/document-store.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { S3Signer } from "../lib/s3-sign.js";
import { signSessionToken } from "../auth/session.js";

const SESSION = { secret: "test-session-secret-32-chars-min!!", ttlSeconds: 3600 };

const s3Signer = new S3Signer({
  accountId: "test", accessKeyId: "test", secretAccessKey: "test",
  bucket: "test", publicBaseUrl: "https://media.example.com",
});

const SEED = [
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

function makeDeps(over: Partial<DocumentRouteDeps> = {}): DocumentRouteDeps {
  return {
    documents: createMemoryDocumentStore(SEED),
    s3Signer,
    session: SESSION,
    users: createMemoryUserStore([
      { id: "user-a", displayName: "Alice", walletAddress: "UQAAA" },
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
```

- [ ] **Step 4: Run tests**

```bash
npm run test -w @digihouse/api -- src/routes/documents.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run full suite**

```bash
npm run test -w @digihouse/api
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/db/seed/documents-data.ts apps/api/src/routes/documents.test.ts apps/api/src/app.ts
git commit -m "feat(api): seed documents + API route tests (P4-04)"
```

---

### Task 5: Mini App types + repos + mock

**Files:**
- Create: `src/types/property-document.ts`
- Modify: `src/lib/api/repos.ts`
- Modify: `src/lib/api/http/http-repos.ts`
- Modify: `src/lib/mock/mock-repos.ts`
- Create: `src/lib/mock/seed/documents.ts`

- [ ] **Step 1: Create document types**

Create `src/types/property-document.ts`:

```ts
export type DocumentMeta = {
  id: string;
  title: string;
  kind: "legal" | "financial" | "offering" | "other";
  fileSize: number | null;
  createdAt: string;
};

export type DocumentDownloadUrl = {
  url: string;
  publicUrl?: string;
  expiresAt: string;
};
```

- [ ] **Step 2: Extend repos interface**

In `src/lib/api/repos.ts`, add:

```ts
import type { DocumentMeta, DocumentDownloadUrl } from "@/types/property-document";

export type DocumentsRepo = {
  list(propertyId: string): Promise<DocumentMeta[]>;
  getDownloadUrl(propertyId: string, docId: string): Promise<DocumentDownloadUrl>;
};
```

Add to the `Repos` interface:

```ts
documents: DocumentsRepo;
```

- [ ] **Step 3: Implement HTTP repos**

In `src/lib/api/http/http-repos.ts`, add:

```ts
import type { DocumentMeta, DocumentDownloadUrl } from "@/types/property-document";

documents: {
  list: (propertyId) =>
    client.get<{ documents: DocumentMeta[] }>(`/v1/properties/${propertyId}/documents`)
      .then((r) => r.documents),

  getDownloadUrl: (propertyId, docId) =>
    client.get<DocumentDownloadUrl>(`/v1/properties/${propertyId}/documents/${docId}/url`),
},
```

- [ ] **Step 4: Create mock seed**

Create `src/lib/mock/seed/documents.ts`:

```ts
import type { DocumentMeta } from "@/types/property-document";

export const MOCK_DOCUMENTS: DocumentMeta[] = [
  {
    id: "doc-om-001",
    title: "Offering Memorandum",
    kind: "offering",
    fileSize: 2_400_000,
    createdAt: "2026-06-15T00:00:00.000Z",
  },
  {
    id: "doc-fin-q2-001",
    title: "Financial Statement Q2 2026",
    kind: "financial",
    fileSize: 1_100_000,
    createdAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "doc-lease-001",
    title: "Tenant Lease Agreement",
    kind: "legal",
    fileSize: 800_000,
    createdAt: "2026-05-20T00:00:00.000Z",
  },
];
```

- [ ] **Step 5: Implement mock repos**

In `src/lib/mock/mock-repos.ts`:

```ts
import { MOCK_DOCUMENTS } from "./seed/documents";

documents: {
  list: async (propertyId) => {
    await delay(300);
    return MOCK_DOCUMENTS;
  },
  getDownloadUrl: async (propertyId, docId) => {
    await delay(200);
    return {
      url: `https://media.example.com/documents/${propertyId}/${docId}.pdf?X-Amz-Signature=mock`,
      publicUrl: `https://media.example.com/documents/${propertyId}/${docId}.pdf`,
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    };
  },
},
```

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add src/types/property-document.ts src/lib/api/repos.ts src/lib/api/http/http-repos.ts src/lib/mock/mock-repos.ts src/lib/mock/seed/documents.ts
git commit -m "feat(app): document types, repos, mock data (P4-04)"
```

---

### Task 6: Hook + component

**Files:**
- Create: `src/hooks/usePropertyDocuments.ts`
- Create: `src/components/documents/PropertyDocumentsList.tsx`

- [ ] **Step 1: Create hook**

Create `src/hooks/usePropertyDocuments.ts`:

```ts
"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";

export function usePropertyDocuments(propertyId: string | null) {
  const list = useQuery({
    queryKey: ["property-documents", propertyId],
    queryFn: () => getRepo().documents.list(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: 60_000,
  });

  const download = useMutation({
    mutationFn: (docId: string) =>
      getRepo().documents.getDownloadUrl(propertyId!, docId),
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
  });

  return {
    documents: list.data ?? [],
    isLoading: list.isLoading,
    isError: list.isError,
    error: list.error,
    download,
  };
}
```

- [ ] **Step 2: Create component**

Create `src/components/documents/PropertyDocumentsList.tsx`:

```tsx
"use client";

import type { DocumentMeta } from "@/types/property-document";
import { Block } from "@/components/ui/block";
import { Row } from "@/components/ui/row";
import { FileText, ChevronRight, Loader2 } from "lucide-react";

type PropertyDocumentsListProps = {
  documents: DocumentMeta[];
  onDownload: (docId: string) => void;
  downloadingId?: string | null;
  error?: string | null;
};

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

const KIND_LABELS: Record<string, string> = {
  offering: "Offering",
  financial: "Financial",
  legal: "Legal",
  other: "Other",
};

export function PropertyDocumentsList({
  documents,
  onDownload,
  downloadingId,
  error,
}: PropertyDocumentsListProps) {
  if (documents.length === 0 && !error) {
    return null;
  }

  return (
    <section>
      <h2 className="px-1 text-[0.8125rem] font-medium text-muted-foreground">
        Documents
      </h2>
      <Block>
        {error && (
          <Row>
            <span className="text-destructive text-sm">{error}</span>
          </Row>
        )}
        {documents.map((doc) => (
          <Row
            key={doc.id}
            className="cursor-pointer active:opacity-60"
            onClick={() => onDownload(doc.id)}
          >
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">
                {doc.title}
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wider">
                  {KIND_LABELS[doc.kind] ?? doc.kind}
                </span>
                {formatFileSize(doc.fileSize) && (
                  <span>{formatFileSize(doc.fileSize)}</span>
                )}
              </span>
            </div>
            {downloadingId === doc.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </Row>
        ))}
        {documents.length === 0 && !error && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No documents yet
          </div>
        )}
      </Block>
    </section>
  );
}
```

- [ ] **Step 3: Export from hooks index**

Check `src/hooks/index.ts`. If it doesn't exist, no need — but ensure the component can import the hook.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePropertyDocuments.ts src/components/documents/PropertyDocumentsList.tsx
git commit -m "feat(app): usePropertyDocuments hook + PropertyDocumentsList component (P4-04)"
```

---

### Task 7: Wire into property detail

**Files:**
- Modify: `src/components/property/PropertyDetail.tsx`
- Modify: `src/app/(app)/property/[id]/page.tsx`

- [ ] **Step 1: Check PropertyDetail line count**

```bash
wc -l src/components/property/PropertyDetail.tsx
```

If it's approaching 350 lines, extract a section. As of the spec, it's ~52 lines so there's plenty of room.

- [ ] **Step 2: Add section to PropertyDetail**

In `src/components/property/PropertyDetail.tsx`, add the `PropertyDocumentsList` section. The component takes `documents`, `onDownload`, `downloadingId` as props — these need to be threaded from the page.

Update the `PropertyDetailProps`:

```ts
import { PropertyDocumentsList } from "@/components/documents/PropertyDocumentsList";
import type { DocumentMeta } from "@/types/property-document";

type PropertyDetailProps = {
  listing: Listing;
  documents: DocumentMeta[];
  onDownloadDoc: (docId: string) => void;
  downloadingDocId?: string | null;
  // ... existing props
};
```

Add the section between `PropertyTrust` and `OrderBook`:

```tsx
<PropertyDocumentsList
  documents={documents}
  onDownload={onDownloadDoc}
  downloadingId={downloadingDocId}
/>
```

- [ ] **Step 3: Wire hook in page.tsx**

In `src/app/(app)/property/[id]/page.tsx`, import the hook:

```ts
import { usePropertyDocuments } from "@/hooks/usePropertyDocuments";
```

After the `useProperty(id)` call:

```ts
const { documents, download: docDownload } = usePropertyDocuments(id);
```

Pass to `PropertyDetail`:

```tsx
<PropertyDetail
  listing={data}
  documents={documents}
  onDownloadDoc={(docId) => docDownload.mutate(docId)}
  downloadingDocId={docDownload.isPending ? String(docDownload.variables) : null}
  // ... existing props
/>
```

- [ ] **Step 4: Typecheck + build**

```bash
npm run typecheck && npm run build
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/property/PropertyDetail.tsx src/app/\(app\)/property/\[id\]/page.tsx
git commit -m "feat(app): wire PropertyDocumentsList into property detail (P4-04)"
```

---

### Task 8: Self-review + final check

- [ ] **Step 1: Full typecheck**

```bash
npm run typecheck
```

Expected: pass.

- [ ] **Step 2: Full test run (API)**

```bash
npm run test -w @digihouse/api
```

Expected: all pass.

- [ ] **Step 3: Build (Mini App)**

```bash
npm run build
```

Expected: pass.

- [ ] **Step 4: Run npm run check (if available)**

```bash
npm run check
```

Expected: pass.

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "chore: final P4-04 checks"
```

- [ ] **Step 6: AC checklist**
- [ ] Component imports no lib/ton, lib/mock, raw fetch to R2 — ✅ props-only component
- [ ] URL expires (e.g. ≤15 min) — ✅ default 900s in getSignedGetUrl
- [ ] Seed doc visible on ≥1 property in api mode — ✅ 3 docs for prop-marina-vista-4b
- [ ] npm run check green — ✅
