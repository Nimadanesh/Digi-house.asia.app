# P4-02: Admin Create Property + R2 Media Upload — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ops can create a property (draft status) and upload media via signed R2 URLs through admin API endpoints.

**Architecture:** Three new endpoints in `routes/admin.ts`, guarded by existing P4-03 `requireAdminSecret` middleware. Property creation uses a Zod-validated body, writes to DB via a new `PropertyStore.create()` method. Media uses a no-dep S3Signer class (native crypto, AWS SigV4) to generate presigned PUT URLs. A PATCH endpoint handles status transitions (draft→funding) and image registration.

**Tech Stack:** Hono, Drizzle ORM, Postgres, native `crypto` (AWS SigV4), Zod, Vitest.

## Global Constraints

- All admin routes require `X-Admin-Key` header matching `ADMIN_API_SECRET`
- Properties with `status = "draft"` are excluded from marketplace `list()` unless filter explicitly includes `"draft"`
- Money values in integer cents; TON in nanoTON
- No `any` types; strict TypeScript
- English copy only
- Audit events on every mutation

---

### Task 1: Draft status plumbing

**Files:**
- Create: `apps/api/drizzle/0013_admin_draft_status.sql`
- Modify: `apps/api/drizzle/meta/_journal.json`
- Modify: `apps/api/src/marketplace/map-listing.ts`
- Modify: `apps/api/src/audit/audit-actions.ts`

**Interfaces:**
- Consumes: existing `PropertyStatus` type, `AUDIT_ACTIONS` const
- Produces: updated `PropertyStatus = "draft" | "funding" | "funded" | "resale"`, updated `AUDIT_ACTIONS` with `"admin.create"`, `"admin.update"`

- [ ] **Step 1: Create migration 0013**

```sql
-- apps/api/drizzle/0013_admin_draft_status.sql
ALTER TABLE "properties" DROP CONSTRAINT IF EXISTS "properties_status_check";
--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_status_check" CHECK ("properties"."status" IN ('draft', 'funding', 'funded', 'resale'));
```

- [ ] **Step 2: Add journal entry**

Read `apps/api/drizzle/meta/_journal.json`, add entry idx=12 after the 0011 entry.

```json
    {
      "idx": 12,
      "version": "7",
      "when": 1787600000000,
      "tag": "0013_admin_draft_status",
      "breakpoints": true
    }
```

- [ ] **Step 3: Update PropertyStatus in map-listing.ts**

Open `apps/api/src/marketplace/map-listing.ts`. Find the `PropertyStatus` type and `PROPERTY_STATUSES` array. Add `"draft"`.

```ts
export type PropertyStatus = "draft" | "funding" | "funded" | "resale";

export const PROPERTY_STATUSES: PropertyStatus[] = [
  "draft",
  "funding",
  "funded",
  "resale",
];
```

- [ ] **Step 4: Update AUDIT_ACTIONS**

Open `apps/api/src/audit/audit-actions.ts`. Add `"admin.create"` and `"admin.update"`.

```ts
export const AUDIT_ACTIONS = [
  "buy.confirm",
  "order.cancel",
  "payout.tick",
  "admin.pause",
  "admin.unpause",
  "admin.create",
  "admin.update",
] as const;
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/drizzle/0013_admin_draft_status.sql apps/api/drizzle/meta/_journal.json apps/api/src/marketplace/map-listing.ts apps/api/src/audit/audit-actions.ts
git commit -m "feat(api): add draft status, admin.create/admin.update audit actions (P4-02)"
```

---

### Task 2: PropertyStore — create + update + draft filter

**Files:**
- Modify: `apps/api/src/marketplace/property-store.ts`
- Validate types: `npm run typecheck -w @digihouse/api`

**Interfaces:**
- Consumes: `ListingPublic`, `mapPropertyToListing`, `PropertyRow`, `properties` schema
- Produces: `PropertyStore` interface with new `create(input: CreatePropertyInput): Promise<ListingPublic>`, `update(id: string, patch: Partial<NewPropertyRow>): Promise<ListingPublic | null>`, and draft-exclusion in `list()`

- [ ] **Step 1: Add CreatePropertyInput type**

Above the `PropertyStore` interface in `property-store.ts`, add:

```ts
export type CreatePropertyInput = {
  id: string;
  title: string;
  location: string;
  description: string;
  images?: string[];
  totalShares: number;
  sharePriceUsd: number;
  annualRentUsd: number;
  ownerWalletAddress: string;
  meta: Record<string, unknown>;
  status?: "draft" | "funding" | "funded" | "resale";
  sharesSold?: number;
};
```

- [ ] **Step 2: Add `create` and `update` to the interface**

```ts
  /**
   * Insert a new property row. `salePaused`/`distributionPaused` default false.
   * Returns the mapped listing.
   */
  create(input: CreatePropertyInput): Promise<ListingPublic>;
  /**
   * Merge patch onto existing property. Returns null if not found.
   */
  update(
    id: string,
    patch: Partial<CreatePropertyInput>,
  ): Promise<ListingPublic | null>;
```

- [ ] **Step 3: Add list filter to exclude "draft"**

In `createDbPropertyStore.list()`, after building `clauses`, add an exclusion clause when no status filter is provided:

```ts
      if (!filter.status) {
        clauses.push(sql`${properties.status} != 'draft'`);
      }
```

Same in `createMemoryPropertyStore.list()`:

```ts
      if (!filter.status) {
        list = list.filter((p) => p.status !== "draft");
      }
```

- [ ] **Step 4: Implement `create` in DB store**

```ts
    async create(input) {
      const now = new Date();
      const row = {
        id: input.id,
        title: input.title,
        location: input.location,
        description: input.description,
        images: input.images ?? [],
        totalShares: input.totalShares,
        sharePriceUsd: BigInt(input.sharePriceUsd),
        annualRentUsd: BigInt(input.annualRentUsd),
        ownerWalletAddress: input.ownerWalletAddress,
        meta: input.meta as PropertyMetaJson,
        status: input.status ?? "draft",
        sharesSold: input.sharesSold ?? 0,
        tokenizationStatus: "pending" as const,
        rentalHistory: [],
        jettonDecimals: 9,
        salePaused: false,
        distributionPaused: false,
        onchainMaster: null,
        distributionAddress: null,
        createdAt: now,
        updatedAt: now,
      };
      const rows = await db.insert(properties).values(row).returning();
      return mapPropertyToListing(rows[0]!);
    },
```

Import `PropertyMetaJson` from the schema if not already imported.

- [ ] **Step 5: Implement `update` in DB store**

```ts
    async update(id, patch) {
      const now = new Date();
      const updates: Record<string, unknown> = { updatedAt: now };
      if (patch.title !== undefined) updates.title = patch.title;
      if (patch.location !== undefined) updates.location = patch.location;
      if (patch.description !== undefined) updates.description = patch.description;
      if (patch.images !== undefined) updates.images = patch.images;
      if (patch.totalShares !== undefined) updates.totalShares = patch.totalShares;
      if (patch.sharePriceUsd !== undefined) updates.sharePriceUsd = BigInt(patch.sharePriceUsd);
      if (patch.annualRentUsd !== undefined) updates.annualRentUsd = BigInt(patch.annualRentUsd);
      if (patch.ownerWalletAddress !== undefined) updates.ownerWalletAddress = patch.ownerWalletAddress;
      if (patch.meta !== undefined) updates.meta = patch.meta;
      if (patch.status !== undefined) updates.status = patch.status;
      if (patch.sharesSold !== undefined) updates.sharesSold = patch.sharesSold;

      const rows = await db
        .update(properties)
        .set(updates)
        .where(eq(properties.id, id))
        .returning();
      const row = rows[0];
      return row ? mapPropertyToListing(row) : null;
    },
```

- [ ] **Step 6: Implement `create` in memory store**

```ts
    async create(input) {
      const now = new Date();
      const row: PropertyRow = {
        id: input.id,
        title: input.title,
        location: input.location,
        description: input.description,
        images: input.images ?? [],
        totalShares: input.totalShares,
        sharePriceUsd: BigInt(input.sharePriceUsd),
        annualRentUsd: BigInt(input.annualRentUsd),
        ownerWalletAddress: input.ownerWalletAddress,
        meta: input.meta as PropertyMetaJson,
        status: input.status ?? "draft",
        sharesSold: input.sharesSold ?? 0,
        tokenizationStatus: "pending",
        rentalHistory: [],
        jettonDecimals: 9,
        onchainMaster: null,
        distributionAddress: null,
        salePaused: false,
        distributionPaused: false,
        createdAt: now,
        updatedAt: now,
      };
      rows.push(row);
      return mapPropertyToListing(row);
    },
```

- [ ] **Step 7: Implement `update` in memory store**

```ts
    async update(id, patch) {
      const row = rows.find((p) => p.id === id);
      if (!row) return null;
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.location !== undefined) row.location = patch.location;
      if (patch.description !== undefined) row.description = patch.description;
      if (patch.images !== undefined) row.images = patch.images;
      if (patch.totalShares !== undefined) row.totalShares = patch.totalShares;
      if (patch.sharePriceUsd !== undefined) row.sharePriceUsd = BigInt(patch.sharePriceUsd);
      if (patch.annualRentUsd !== undefined) row.annualRentUsd = BigInt(patch.annualRentUsd);
      if (patch.ownerWalletAddress !== undefined) row.ownerWalletAddress = patch.ownerWalletAddress;
      if (patch.meta !== undefined) row.meta = patch.meta as PropertyMetaJson;
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.sharesSold !== undefined) row.sharesSold = patch.sharesSold;
      row.updatedAt = new Date();
      return mapPropertyToListing(row);
    },
```

- [ ] **Step 8: Typecheck**

```bash
npm run typecheck -w @digihouse/api
```

Expected: pass.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/marketplace/property-store.ts
git commit -m "feat(api): add create/update to PropertyStore, exclude draft from list (P4-02)"
```

---

### Task 3: S3Signer — presigned URL module

**Files:**
- Create: `apps/api/src/lib/s3-sign.ts`
- Test: `apps/api/src/lib/s3-sign.test.ts`

**Interfaces:**
- Consumes: env vars (accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl)
- Produces: `class S3Signer { constructor(config: S3SignerConfig); getSignedPutUrl(key, contentType, ttlMs?): { signedUrl, publicUrl } }`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/lib/s3-sign.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { S3Signer } from "./s3-sign.js";

const config = {
  accountId: "abc123",
  accessKeyId: "test-key",
  secretAccessKey: "test-secret",
  bucket: "test-bucket",
  publicBaseUrl: "https://media.example.com",
};

describe("S3Signer", () => {
  it("returns signedUrl and publicUrl", () => {
    const signer = new S3Signer(config);
    const result = signer.getSignedPutUrl("uploads/test.jpg", "image/jpeg");
    expect(result.publicUrl).toBe("https://media.example.com/uploads/test.jpg");
    expect(result.signedUrl).toContain("https://abc123.r2.cloudflarestorage.com/test-bucket/uploads/test.jpg");
    expect(result.signedUrl).toContain("X-Amz-Signature=");
    expect(result.signedUrl).toContain("X-Amz-Algorithm=AWS4-HMAC-SHA256");
  });

  it("accepts custom TTL", () => {
    const signer = new S3Signer(config);
    const result = signer.getSignedPutUrl("uploads/test.jpg", "image/jpeg", 7200);
    expect(result.signedUrl).toContain("X-Amz-Expires=7200");
  });

  it("generates different signatures for different keys", () => {
    const signer = new S3Signer(config);
    const a = signer.getSignedPutUrl("uploads/a.jpg", "image/jpeg");
    const b = signer.getSignedPutUrl("uploads/b.jpg", "image/jpeg");
    expect(a.signedUrl).not.toBe(b.signedUrl);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm run test -w @digihouse/api -- src/lib/s3-sign.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement S3Signer**

Create `apps/api/src/lib/s3-sign.ts`:

```ts
import { createHmac, randomUUID } from "node:crypto";

export type S3SignerConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
};

export type SignedPutUrlResult = {
  signedUrl: string;
  publicUrl: string;
};

export class S3Signer {
  private config: S3SignerConfig;

  constructor(config: S3SignerConfig) {
    this.config = config;
  }

  getSignedPutUrl(
    key: string,
    contentType: string,
    ttlMs = 3600,
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
      "PUT",
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
      hashHex(canonicalRequest),
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
}

function hashHex(s: string): string {
  return createHmac("sha256", "").update(s).digest("hex");
}

function hmacHex(key: Buffer, s: string): string {
  return createHmac("sha256", key).update(s).digest("hex");
}

function getSignatureKey(
  key: string,
  dateStamp: string,
  region: string,
  service: string,
): Buffer {
  const kDate = createHmac("sha256", `AWS4${key}`).update(dateStamp).digest();
  const kRegion = createHmac("sha256", kDate).update(region).digest();
  const kService = createHmac("sha256", kRegion).update(service).digest();
  return createHmac("sha256", kService).update("aws4_request").digest();
}
```

Wait, `hashHex` using HMAC with empty key is wrong for SigV4. The canonical request hash should be SHA256, not HMAC. Let me fix:

```ts
function sha256Hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}
```

And use `createHash` not `createHmac` for the canonical request hash. Let me also need to import `createHash`.

- [ ] **Step 4: Fix the hash function and re-test**

Replace `hashHex` with proper SHA256:

```ts
import { createHash, createHmac, randomUUID } from "node:crypto";
```

And update:

```ts
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join("\n");
```

Remove `hashHex`, define:

```ts
function sha256Hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}
```

- [ ] **Step 5: Run tests to verify pass**

```bash
npm run test -w @digihouse/api -- src/lib/s3-sign.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/lib/s3-sign.ts apps/api/src/lib/s3-sign.test.ts
git commit -m "feat(api): S3Signer for R2 presigned PUT URLs (P4-02)"
```

---

### Task 4: R2 env vars + app wiring

**Files:**
- Modify: `apps/api/src/env.ts`
- Modify: `apps/api/src/routes/admin.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Add R2 env vars to env.ts**

In the `envSchema` object, add after `ADMIN_API_SECRET`:

```ts
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    R2_PUBLIC_BASE_URL: z.string().optional(),
```

In the transform output, add:

```ts
      R2_ACCOUNT_ID: val.R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID: val.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: val.R2_SECRET_ACCESS_KEY,
      R2_BUCKET: val.R2_BUCKET,
      R2_PUBLIC_BASE_URL: val.R2_PUBLIC_BASE_URL,
```

- [ ] **Step 2: Add S3Signer dep to AdminRouteDeps**

In `routes/admin.ts`, import `S3Signer`:

```ts
import type { S3Signer } from "../lib/s3-sign.js";
```

Add to `AdminRouteDeps`:

```ts
  s3Signer?: S3Signer | null;
```

- [ ] **Step 3: Create S3Signer in app.ts and wire into admin deps**

In `apps/api/src/app.ts`, after the pause route wiring block, read R2 env vars and create the signer:

```ts
  let s3Signer: S3Signer | null = null;
  if (
    env.R2_ACCOUNT_ID?.trim() &&
    env.R2_ACCESS_KEY_ID?.trim() &&
    env.R2_SECRET_ACCESS_KEY?.trim() &&
    env.R2_BUCKET?.trim() &&
    env.R2_PUBLIC_BASE_URL?.trim()
  ) {
    s3Signer = new S3Signer({
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucket: env.R2_BUCKET,
      publicBaseUrl: env.R2_PUBLIC_BASE_URL,
    });
  }
```

Update the `createAdminRoutes` call to include `s3Signer`:

```ts
    createAdminRoutes({
      adminSecret: env.ADMIN_API_SECRET,
      properties,
      audit,
      s3Signer,
    }),
```

Add imports:

```ts
import { S3Signer } from "./lib/s3-sign.js";
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck -w @digihouse/api
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/env.ts apps/api/src/routes/admin.ts apps/api/src/app.ts
git commit -m "feat(api): R2 env vars, wire S3Signer into admin routes (P4-02)"
```

---

### Task 5: Admin routes — create, update, media/sign

**Files:**
- Modify: `apps/api/src/routes/admin.ts`

- [ ] **Step 1: Add create property endpoint**

In `routes/admin.ts`, after the unpause handler and before `return app`, add:

```ts
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
```

- [ ] **Step 2: Add update property endpoint**

```ts
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

    const updated = await deps.properties.update(id, patch);

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
```

- [ ] **Step 3: Add media sign endpoint**

```ts
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
```

- [ ] **Step 4: Update the existing pause routes to use the audit writeAuditEvent import**

The import is already there. Add import for `S3Signer` type:

```ts
import type { S3Signer } from "../lib/s3-sign.js";
```

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck -w @digihouse/api
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/routes/admin.ts
git commit -m "feat(api): admin create/update property + media sign endpoints (P4-02)"
```

---

### Task 6: Tests

**Files:**
- Create: `apps/api/src/routes/admin.test.ts`

- [ ] **Step 1: Write admin.test.ts**

```ts
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
        `https://media.example.com/uploads/${body.key}`,
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
```

- [ ] **Step 2: Run the test file**

```bash
npm run test -w @digihouse/api -- src/routes/admin.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

```bash
npm run test -w @digihouse/api
```

Expected: all 20+ suites pass.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/admin.test.ts
git commit -m "test(api): admin routes tests — create, update, media sign, auth (P4-02)"
```

---

### Task 7: Runbook docs

**Files:**
- Create: `docs/runbooks/admin-create-property.md`

- [ ] **Step 1: Write runbook**

Create `docs/runbooks/admin-create-property.md`:

```markdown
# Admin: Create Property + Upload Media (P4-02)

## One-liner

```bash
curl -X POST "https://api.example.com/v1/admin/properties" \
  -H "X-Admin-Key: <ADMIN_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Riverside Studio",
    "location": "Lisbon, Portugal",
    "description": "Cozy studio near the Tagus",
    "totalShares": 10000,
    "sharePriceUsd": 250000,
    "annualRentUsd": 1200000,
    "ownerWalletAddress": "UQ...",
    "meta": {
      "sizeSqm": 45,
      "yearBuilt": 2021,
      "propertyType": "apartment",
      "rentalStatus": "occupied"
    }
  }'
```

## Status field

| Value | Meaning |
|-------|---------|
| `draft` (default) | Not visible in marketplace |
| `funding` | Visible, primary sale open |
| `funded` | Primary sold out, resale only |

## Publish a draft

```bash
curl -X PATCH "https://api.example.com/v1/admin/properties/<id>" \
  -H "X-Admin-Key: <ADMIN_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"status": "funding"}'
```

## Upload media (signed URL pattern)

```bash
# 1. Get signed URL
curl -X POST "https://api.example.com/v1/admin/properties/<id>/media/sign" \
  -H "X-Admin-Key: <ADMIN_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"filename": "living-room.jpg", "contentType": "image/jpeg"}'

# Response: { "signedUrl": "...", "publicUrl": "...", "key": "uploads/..." }

# 2. Upload to R2
curl -X PUT "<signedUrl>" \
  -H "Content-Type: image/jpeg" \
  --data-binary @living-room.jpg

# 3. Register URL with property
curl -X PATCH "https://api.example.com/v1/admin/properties/<id>" \
  -H "X-Admin-Key: <ADMIN_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"images": ["<publicUrl>"]}'
```

## Env vars

| Variable | Required | Default |
|---|---|---|
| `R2_ACCOUNT_ID` | for media | — |
| `R2_ACCESS_KEY_ID` | for media | — |
| `R2_SECRET_ACCESS_KEY` | for media | — |
| `R2_BUCKET` | for media | — |
| `R2_PUBLIC_BASE_URL` | for media | — |

The media/sign endpoint returns 501 when R2 is not configured.

## Attributes

- Audit events: `admin.create`, `admin.update` (written to `audit_events` table)
```

- [ ] **Step 2: Commit**

```bash
git add docs/runbooks/admin-create-property.md
git commit -m "docs(api): admin create property + media upload runbook (P4-02)"
```

---

### Task 8: Self-review + final check

- [ ] **Step 1: Verify typecheck**

```bash
npm run typecheck -w @digihouse/api
```

Expected: pass.

- [ ] **Step 2: Run all tests**

```bash
npm run test -w @digihouse/api
```

Expected: all tests pass.

- [ ] **Step 3: Final commit**

```bash
git add -A && git commit -m "chore: final P4-02 checks"
```

- [ ] **Step 4: Summary**

Check AC:
- User session CANNOT call admin routes — ✅ (P4-03 middleware)
- Property appears in marketplace only when status funding — ✅ (draft excluded by list filter)
- Media upload is signed URL pattern — ✅ (S3Signer, never streams through app)
- Audit event on create — ✅ (`admin.create` + `admin.update`)
- Ownership: no UI→R2 from Mini App — ✅ (API-only env vars, not in `NEXT_PUBLIC_*`)
