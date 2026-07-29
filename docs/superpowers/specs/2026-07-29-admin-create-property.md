# P4-02: Admin Create Property + R2 Media Upload

## One-liner

Ops can create a property and upload media to R2 via admin API. No Mini App owner UI.

## Authorization

Reuses P4-03 `requireAdminSecret` middleware (`X-Admin-Key` header matching `ADMIN_API_SECRET`). User JWTs are rejected — admin middleware runs before route handler. Routes only mounted when `ADMIN_API_SECRET` is set (`app.ts`).

## 1. Status: add `"draft"`

Migration `0013` alters the CHECK constraint on `properties.status`:

```sql
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
ALTER TABLE properties ADD CONSTRAINT properties_status_check
  CHECK (status IN ('draft', 'funding', 'funded', 'resale'));
```

**`PropertyStatus`** in `map-listing.ts` becomes `"draft" | "funding" | "funded" | "resale"`.

**Marketplace list filter** (`property-store.ts:list()`) excludes `"draft"` by default — only returns when status filter explicitly passed.

## 2. Endpoints (added to `routes/admin.ts`)

### POST /v1/admin/properties — Create

```
X-Admin-Key: <secret>
Content-Type: application/json

{
  "title": "string",
  "location": "string",
  "description": "string",
  "images": ["url1", "url2"],       // optional, pre-existing URLs
  "totalShares": 10000,
  "sharePriceUsd": 250000,           // cents
  "annualRentUsd": 1200000,          // cents
  "ownerWalletAddress": "UQ...",     // TON address
  "meta": {
    "sizeSqm": 85,
    "yearBuilt": 2019,
    "propertyType": "apartment",
    "rentalStatus": "occupied",
    "leaseUntil": "2027-06-30",
    "activeTenant": "Tenant Name",
    "tokenizationDocUrl": null
  }
}
```

- `id` auto-generated as `prop-{slugified-title}-{short-uuid}`.
- `status` defaults to `"draft"`.
- `sharesSold` defaults to `0`.
- `tokenizationStatus` defaults to `"pending"`.
- `rentalHistory` defaults to `[]`.
- Returns `201 { ok: true, property: ListingPublic }`.
- Writes audit `action: "admin.create"`, `actorType: "admin"`.

### PATCH /v1/admin/properties/:id — Update

```
{
  "status": "funding",
  "images": ["...existing...", "https://media.example.com/uploads/new.jpg"]
}
```

- Merges fields onto existing row.
- Validates status is in allowed set if provided.
- Returns `200 { ok: true, property: ListingPublic }`.
- Writes audit `action: "admin.update"` with payload diff.

### POST /v1/admin/properties/:id/media/sign — Presigned URL

```
{ "filename": "living-room.jpg", "contentType": "image/jpeg" }
```

Returns:

```json
{
  "signedUrl": "https://account.r2.cloudflarestorage.com/bucket/uploads/uuid-living-room.jpg?X-Amz-Signature=...",
  "publicUrl": "https://media.digihouse.app/uploads/uuid-living-room.jpg",
  "key": "uploads/uuid-living-room.jpg"
}
```

- Object key: `uploads/{uuid}-{sanitized-filename}`.
- Signed URL TTL: 3600 seconds.
- No R2 call in unit tests — mock `S3Signer` returning fixed URLs.
- Returns `501` if R2 env vars are unset.

## 3. R2 signing: `src/lib/s3-sign.ts`

Class `S3Signer` — AWS Signature V4 using native `crypto.createHmac`. Zero SDK dependency.

```ts
type S3SignerConfig = {
  accountId: string;        // Cloudflare R2 account ID
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;    // e.g. https://media.digihouse.app
};

class S3Signer {
  constructor(config: S3SignerConfig);
  getSignedPutUrl(key: string, contentType: string, ttlMs?: number): {
    signedUrl: string;
    publicUrl: string;
  };
}
```

Env vars (all optional; sign endpoint 501 if missing):

| Var | Example |
|-----|---------|
| `R2_ACCOUNT_ID` | `abc123` |
| `R2_ACCESS_KEY_ID` | `...` |
| `R2_SECRET_ACCESS_KEY` | `...` |
| `R2_BUCKET` | `digihouse-media` |
| `R2_PUBLIC_BASE_URL` | `https://media.digihouse.app` |

## 4. PropertyStore changes

Add two methods to interface + both implementations:

```ts
create(input: NewPropertyRow): Promise<ListingPublic>;
update(id: string, patch: Partial<NewPropertyRow>): Promise<ListingPublic | null>;
```

**DB implementation** uses `db.insert(properties).values(input).returning()` and `db.update(properties).set(patch).where(eq(id)).returning()`.

**Memory implementation** pushes to `_rows` or mutates in place.

## 5. Audit actions

Add to `AUDIT_ACTIONS`:

```ts
"admin.create",
"admin.update",
```

## 6. Files changed

| File | Change |
|------|--------|
| `apps/api/drizzle/0013_admin_draft_status.sql` | NEW — ALTER CONSTRAINT |
| `apps/api/drizzle/meta/_journal.json` | Add entry |
| `apps/api/src/db/schema/properties.ts` | Add `"draft"` to status type |
| `apps/api/src/marketplace/map-listing.ts` | Add `"draft"` to `PropertyStatus`; no other change needed |
| `apps/api/src/marketplace/property-store.ts` | Add `create()`, `update()`. List filter skips `"draft"` unless explicitly requested. |
| `apps/api/src/lib/s3-sign.ts` | NEW — S3Signer |
| `apps/api/src/routes/admin.ts` | Add 3 endpoints; add `s3Signer?` to deps |
| `apps/api/src/app.ts` | Create S3Signer from env; wire into admin deps |
| `apps/api/src/env.ts` | Add R2 env vars |
| `apps/api/src/audit/audit-actions.ts` | Add `"admin.create"`, `"admin.update"` |
| `apps/api/src/routes/admin.test.ts` | NEW — tests for all 3 endpoints |
| `docs/runbooks/admin-create-property.md` | NEW — curl examples |

## 7. AC checklist

- [x] User session CANNOT call admin routes (P4-03 middleware)
- [x] Property appears in marketplace only when status `published/funding` (draft excluded by list filter)
- [x] Media upload is signed URL pattern (API never streams files)
- [x] Audit event on create and update
- [x] Ownership: no UI→R2 from Mini App (API-only env vars)
