# P4-04: In-App Documents List + Signed URL Download

## One-liner

Property detail shows document list; tap downloads via short-lived signed GET URL from R2.

## 1. Schema: `property_documents` table

Migration `0014`:

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
CREATE INDEX "idx_documents_property_id" ON "property_documents" ("property_id");
```

### Drizzle schema (`db/schema/property-documents.ts`)

```ts
export const propertyDocuments = pgTable("property_documents", {
  id: text("id").primaryKey(),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  kind: text("kind").notNull(),
  storageKey: text("storage_key").notNull(),
  fileSize: integer("file_size"),
  contentType: text("content_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

## 2. Document types

### API type (`DocumentMeta`)

```ts
type DocumentMeta = {
  id: string;
  title: string;
  kind: "legal" | "financial" | "offering" | "other";
  fileSize: number | null;
  createdAt: string; // ISO
};
```

### Mini App type (`src/types/property-document.ts`)

Mirrors `DocumentMeta`. Also:

```ts
type DocumentDownloadUrl = {
  url: string;
  expiresAt: string; // ISO
};
```

## 3. S3Signer: add `getSignedGetUrl`

New method on `S3Signer`:

```ts
getSignedGetUrl(key: string, ttlMs?: number): { signedUrl: string; publicUrl: string };
```

Same AWS SigV4, but:
- HTTP method is `GET` instead of `PUT`
- No `contentType` in signature (UNSIGNED-PAYLOAD)
- Default TTL: 900s (15 min)

## 4. API routes: `routes/documents.ts`

### DocumentStore interface

```ts
type DocumentStore = {
  listByProperty(propertyId: string): Promise<DocumentMeta[]>;
  getById(docId: string): Promise<DocumentMeta & { storageKey: string; contentType: string | null } | null>;
};
```

### GET /v1/properties/:id/documents

- Auth-optional (read metadata is public)
- Returns `{ documents: DocumentMeta[] }`
- Empty array if none found (not 404)

### GET /v1/properties/:id/documents/:docId/url

- **Auth required** (check for valid session token)
- Returns `{ url: string, expiresAt: string }`
- `url` is signed GET URL from S3Signer
- `expiresAt` = `new Date(Date.now() + ttlMs).toISOString()`
- Returns 404 if doc not found or doesn't belong to property
- Returns 401 if no valid session

### Route wiring in `app.ts`

```
- DocumentStore created from DB or memory
- Passed to createDocumentRoutes({ store, s3Signer })
- Mounted at /v1/properties/* — no extra auth middleware on list, URL endpoint checks session
```

## 5. Mini App data layer

### Repo interface extension

```ts
// in repos.ts
export type DocumentsRepo = {
  list(propertyId: string): Promise<DocumentMeta[]>;
  getDownloadUrl(propertyId: string, docId: string): Promise<DocumentDownloadUrl>;
};
```

### HTTP implementation

```ts
// http-repos.ts
documents: {
  list: (propertyId) => client.get(`/v1/properties/${propertyId}/documents`),
  getDownloadUrl: (propertyId, docId) =>
    client.get(`/v1/properties/${propertyId}/documents/${docId}/url`),
}
```

### Mock implementation

Stub returning seed documents + fake signed URL.

## 6. Hook: `usePropertyDocuments`

```ts
// src/hooks/usePropertyDocuments.ts
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

  return { documents: list.data ?? [], isLoading: list.isLoading, download, error: list.error };
}
```

## 7. Component: `PropertyDocumentsList`

Props-only presentational component:

```tsx
type PropertyDocumentsListProps = {
  documents: DocumentMeta[];
  onDownload: (docId: string) => void;
  downloadingId?: string | null;
  error?: string | null;
};
```

- Section header: "Documents"
- `Block` with `Row` per document
- Each row: file icon (📄), title, `kind` badge, file size
- Right chevron → triggers `onDownload(docId)`
- Loading: 3 skeleton rows
- Empty: "No documents yet" muted text
- Error: inline error with retry

## 8. Wire into property detail

In `PropertyDetail.tsx`, after `PropertyTrust`:

```tsx
<PropertyDocumentsList
  documents={documents}
  onDownload={(docId) => download.mutate(docId)}
  downloadingId={download.isPending ? String(download.variables) : null}
/>
```

In `page.tsx`, add alongside `useProperty`:

```tsx
const { documents, download } = usePropertyDocuments(id);
```

Ensure `PropertyDetail.tsx` stays under 350 lines.

## 9. Seed data

### API seed (DB)

For `prop-marina-vista-4b`:
| Title | Kind | File |
|-------|------|------|
| Offering Memorandum | offering | `documents/prop-marina-vista-4b/om.pdf` |
| Financial Statement Q2 2026 | financial | `documents/prop-marina-vista-4b/fin-q2-2026.pdf` |
| Tenant Lease Agreement | legal | `documents/prop-marina-vista-4b/lease.pdf` |

### Mini App mock seed

Same 3 docs in `src/lib/mock/seed/documents.ts`.

## 10. Tests

### API (`apps/api/src/routes/documents.test.ts`)
- `GET /v1/properties/:id/documents` returns list with metadata
- `GET /v1/properties/:id/documents` returns empty array for unknown property
- `GET /v1/properties/:id/documents/:docId/url` returns signed URL + expiresAt
- `GET …/url` returns 401 without session
- `GET …/url` returns 404 for unknown doc
- Signed URL contains `X-Amz-Signature=` and `X-Amz-Date=`

### Mini App
- Hook query key is `["property-documents", propertyId]`
- Repo methods return correct types

## 11. Ownership guard checklist

- [ ] Component imports no `lib/ton`, `lib/mock`, raw `fetch` to R2
- [ ] Data flows: page → hook → repo → HTTP client → API → R2 (via signed URL)
- [ ] Signed GET URL expires ≤15 min (default 900s)
- [ ] No R2 keys in Mini App bundle
- [ ] Copy is descriptive, not financial advice: "Documents" section label, individual titles like "Offering Memorandum"
