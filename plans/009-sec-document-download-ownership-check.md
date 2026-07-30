# Plan 009: Require shareholding to download document URLs

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat c2ab4b3..HEAD -- apps/api/src/routes/documents.ts apps/api/src/routes/documents.test.ts apps/api/src/app.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `c2ab4b3`, 2026-07-30
- **Issue**: (none)

## Why this matters

The document-download URL endpoint (`GET /v1/properties/:id/documents/:docId/url`)
requires authentication (session) but does **not** verify that the authenticated
user actually holds shares in the property. This means any authenticated user —
even one with zero investment — can obtain a signed download URL for any
property's documents (offering memoranda, financial statements, etc.). These
documents may contain sensitive financial information that should only be
accessible to shareholders of that specific property.

## Current state

- `apps/api/src/routes/documents.ts:8-13` — `DocumentRouteDeps` has no `holdings` field.
- `apps/api/src/routes/documents.ts:29-54` — The `/url` handler checks `requireSession` only, then returns the signed URL unconditionally.
- `apps/api/src/portfolio/holding-store.ts:16` — `HoldingStore.get(userId, propertyId)` returns `HoldingRowInput | null`. Available in-memory and DB implementations.
- `apps/api/src/app.ts:56` — `holdings` already destructured from `CreateAppOptions` (defaults to `null`).
- `apps/api/src/app.ts:147-157` — Document routes created without `holdings`.
- `apps/api/src/routes/documents.test.ts:45-55` — `makeDeps` creates deps without `holdings`.
- `apps/api/src/routes/documents.test.ts:78-90` — Download URL test uses `user-a` with no holdings seed, would fail after the check is added.

## Commands you will need

| Purpose          | Command                              | Expected on success             |
|------------------|--------------------------------------|---------------------------------|
| API tests        | `npm run test -w @digihouse/api`     | exit 0, all pass                |
| Typecheck        | `npm run typecheck -w @digihouse/api`| same pre-existing errors only   |
| Lint             | `npm run lint` (repo root)           | exit 0                          |
| Build            | `npm run build` (repo root)          | exit 0                          |

## Scope

**In scope** (the only files you should modify):
- `apps/api/src/routes/documents.ts` — add `holdings` to deps, add shareholding check in `/url` handler
- `apps/api/src/routes/documents.test.ts` — add `holdings` to `makeDeps`, seed holding for `user-a` in `prop-abc`, add test for non-holder 403
- `apps/api/src/routes/app.ts` — pass `holdings` when creating document routes

**Out of scope** (do NOT touch):
- Any other route or handler
- The document list endpoint (`GET /v1/properties/:id/documents`) — document metadata (title, kind) is intentionally public for discovery
- Frontend types or hooks
- The `holding-store.ts` implementation

## Git workflow

- Branch: `advisor/009-sec-document-download-ownership-check`
- Commit 1: `fix(api): add shareholding check to document download URL endpoint`
- Commit 2: `test(api): add holdings seed and non-holder 403 test for document download`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add `holdings` to `DocumentRouteDeps`

Edit `apps/api/src/routes/documents.ts` at line 8. Add the import at line 6:

```ts
import type { HoldingStore } from "../portfolio/holding-store.js";
```

Update the type (lines 8-13):

```ts
export type DocumentRouteDeps = {
  documents: DocumentStore;
  s3Signer: S3Signer | null;
  session: SessionConfig;
  users: UserStore;
  holdings: HoldingStore | null;
};
```

**Do not add any comments**.

**Verify**: `npm run typecheck -w @digihouse/api` → same pre-existing errors only.

### Step 2: Add shareholding check in the `/url` handler

Edit `apps/api/src/routes/documents.ts` at line 44 (after the s3Signer null check, before getting the signed URL). Add:

```ts
      const userId = c.get("userId");

      if (deps.holdings) {
        const holding = await deps.holdings.get(userId, id);
        if (!holding) {
          return c.json(
            { code: "forbidden", message: "You do not hold shares in this property" },
            403,
          );
        }
      }
```

The final handler should look like:

```ts
      if (!deps.s3Signer) {
        return c.json(
          { code: "not_configured", message: "Document download is not configured" },
          501,
        );
      }

      const userId = c.get("userId");

      if (deps.holdings) {
        const holding = await deps.holdings.get(userId, id);
        if (!holding) {
          return c.json(
            { code: "forbidden", message: "You do not hold shares in this property" },
            403,
          );
        }
      }

      const { signedUrl } = deps.s3Signer.getSignedGetUrl(doc.storageKey);
```

**Do not add any comments**.

**Verify**: `npm run typecheck -w @digihouse/api` → same pre-existing errors only.

### Step 3: Pass `holdings` when creating document routes in `app.ts`

Edit `apps/api/src/app.ts` at line 147-157. Change:

```ts
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

to:

```ts
  if (documents && session && users) {
    app.route(
      "/",
      createDocumentRoutes({
        documents,
        session,
        users: users!,
        s3Signer,
        holdings,
      }),
    );
  }
```

**Do not add any comments**.

**Verify**: `npm run typecheck -w @digihouse/api` → same pre-existing errors only.

### Step 4: Update `makeDeps` in `documents.test.ts`

Edit `apps/api/src/routes/documents.test.ts` at line 45. Import `HoldingStore`:

```ts
import { createMemoryDocumentStore, type DocumentRecord } from "../marketplace/document-store.js";
```

Add the import for `createMemoryHoldingStore` below it:

```ts
import { createMemoryHoldingStore } from "../portfolio/holding-store.js";
```

Update `makeDeps` at lines 45-55. Add `holdings`:

```ts
function makeDeps(over: Partial<DocumentRouteDeps> = {}): DocumentRouteDeps {
  return {
    documents: createMemoryDocumentStore(SEED),
    s3Signer,
    session: SESSION,
    users: createMemoryUserStore([
      seedUser("user-a", "Alice"),
    ]),
    holdings: createMemoryHoldingStore([
      { userId: "user-a", propertyId: "prop-abc", sharesOwned: 10, avgCostUsd: 10000, updatedAt: new Date() },
    ]),
    ...over,
  };
}
```

This seeds a holding for `user-a` in `prop-abc` so the existing "returns signed URL + expiresAt" test at line 78 still passes.

**Do not add any comments**.

**Verify**: `npm run test -w @digihouse/api` → exit 0, all tests pass.

### Step 5: Add test for non-holder 403

Edit `apps/api/src/routes/documents.test.ts` after line 114 (after the "returns 404 for doc from wrong property" test block). Add:

```ts
    it("returns 403 when user does not hold shares in the property", async () => {
      const app = new Hono().route("/", createDocumentRoutes(makeDeps()));
      const { token } = await signSessionToken("user-b", SESSION);
      const res = await app.request("/v1/properties/prop-abc/documents/doc-1/url", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(403);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe("forbidden");
    });
```

Note: `user-b` does not have a seeded holding in `prop-abc`, and is not even in the user store. But `requireSession` will reject user-b since it's not in the user store. To test a user who IS in the user store but has no holding, we need to either:
- Add `user-b` to the user store and NOT seed a holding for them.
- Use the `makeDeps` override mechanism.

The cleanest approach: add `user-b` to the user store seed and use `makeDeps` with an override that adds the user. But that's getting complex. Instead, let's override `holdings` to make a store that returns null for everyone. No — we need an authenticated user with no holding.

Simpler approach: make the test inject a second user into the user store:

```ts
    it("returns 403 when user does not hold shares in the property", async () => {
      const users = createMemoryUserStore([
        seedUser("user-a", "Alice"),
        seedUser("user-b", "Bob"),
      ]);
      const app = new Hono().route(
        "/",
        createDocumentRoutes(makeDeps({ users })),
      );
      const { token } = await signSessionToken("user-b", SESSION);
      const res = await app.request("/v1/properties/prop-abc/documents/doc-1/url", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(403);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe("forbidden");
    });
```

This is cleaner — `user-b` is authenticated (in the user store) but has no holding seeded (only `user-a` has one for `prop-abc`).

**Do not add any comments**.

**Verify**: `npm run test -w @digihouse/api` → exit 0, all tests pass.

### Step 6: Run full verification

```bash
npm run test -w @digihouse/api    # all pass (existing + new 403 test)
npm run lint                       # 0 errors
npm run build                      # compiled
```

**Verify**: All three commands exit 0.

## Test plan

- Existing "returns signed URL + expiresAt" test continues to pass because `user-a` is seeded with a holding in `prop-abc`.
- New test "returns 403 when user does not hold shares in the property" verifies the rejection path.
- Existing "returns 401 without auth" test is unaffected (403 is not returned for unauthenticated requests).
- When `holdings` is null (e.g. test servers without a holding store), the check is skipped, preserving backward compatibility.
- Verification: `npm run test -w @digihouse/api` exit 0.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run test -w @digihouse/api` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `grep "holdings" apps/api/src/routes/documents.ts` shows deps field + handler check
- [ ] `grep "holdings" apps/api/src/app.ts` shows it passed to `createDocumentRoutes`
- [ ] `grep "user-b" apps/api/src/routes/documents.test.ts` exists (non-holder test)
- [ ] `grep "403" apps/api/src/routes/documents.test.ts` exists (status check)
- [ ] `grep "holdings" apps/api/src/routes/documents.test.ts` shows `makeDeps` provides it
- [ ] No files outside the in-scope list are modified (`git status`)

## STOP conditions

Stop and report back (do not improvise) if:

- The drift check shows any in-scope file has changed since `c2ab4b3`.
- A verification command fails twice after a reasonable fix attempt.
- The `HoldingStore` import path differs from `../portfolio/holding-store.js` — check the actual path in the repo before importing.
- The `requireSession` middleware does not set `c.get("userId")` as expected.
