# Plan 002: Fix admin property creation crash from `draft` status not in DB CHECK constraint

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 260ef3c..HEAD -- apps/api/src/db/schema/properties.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `260ef3c`, 2026-07-30
- **Issue**: (none)
- **Status**: **DONE** — commit `ea85d7b`, 2026-07-30

## Why this matters

Admin property creation via `POST /v1/admin/properties` sends `status: "draft"` when no explicit status is provided (the common case — admin creates a draft, then publishes later with PATCH). The Drizzle schema file's CHECK constraint only allows `'funding'`, `'funded'`, `'resale'` — `'draft'` is missing. This means the INSERT against a real PostgreSQL database fails with a constraint violation, blocking property creation entirely. The existing tests pass because the in-memory store doesn't enforce CHECK constraints, hiding the bug. The migration `0013_admin_draft_status.sql` already exists to add `draft` to the constraint, but the Drizzle schema file was never updated to match — generating a new migration would regenerate the drop/add pair.

## Current state

- `apps/api/src/db/schema/properties.ts:67-72` — CHECK constraint in the Drizzle schema source of truth:

```ts
(t) => [
    check(
      "properties_status_check",
      sql`${t.status} IN ('funding', 'funded', 'resale')`,
    ),
```

- `apps/api/drizzle/0013_admin_draft_status.sql` — already-generated migration that adds `draft` to the constraint (it drops the old and re-creates with `'draft', 'funding', 'funded', 'resale'`). This migration exists but the Drizzle schema file never got updated to reflect the change.
- `apps/api/src/routes/admin.ts:148-194` — admin create route: validates input, then at line 193 defaults status to `"draft"` when not explicitly one of `funding`/`funded`/`resale`.
- `apps/api/src/marketplace/property-store.ts:161` — `createDbPropertyStore` also defaults to `"draft"`: `status: input.status ?? "draft"`.
- `apps/api/src/routes/admin.test.ts:63-89` — test "creates a property with status draft" passes because `createMemoryPropertyStore` doesn't enforce CHECK constraints.
- The `CreatePropertyInput` type (`property-store.ts:28`) correctly lists `"draft"` as a valid status value.

The fix is to update the schema file's CHECK constraint to include `'draft'`, so it matches the already-applied migration `0013` and future `drizzle-kit generate` runs won't produce drift.

## Commands you will need

| Purpose          | Command                              | Expected on success             |
|------------------|--------------------------------------|---------------------------------|
| API tests        | `npm run test -w @digihouse/api`     | exit 0, all pass                |
| Typecheck        | `npm run typecheck -w @digihouse/api`| exit 0, no errors               |
| Lint             | `npm run lint` (repo root)           | exit 0                          |

## Scope

**In scope** (the only files you should modify):
- `apps/api/src/db/schema/properties.ts` — update the CHECK constraint SQL

**Out of scope** (do NOT touch):
- The migration file `0013_admin_draft_status.sql` — already correct
- Admin route logic or tests — the behavior is correct; only the schema constraint is wrong
- Any other file

## Git workflow

- Branch: `advisor/002-cor-admin-create-draft-status`
- Commit message: `fix(db): add 'draft' to properties status CHECK constraint`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Update the CHECK constraint in the schema file

Edit `apps/api/src/db/schema/properties.ts` — at line 71, change:

```ts
sql`${t.status} IN ('funding', 'funded', 'resale')`,
```

to:

```ts
sql`${t.status} IN ('draft', 'funding', 'funded', 'resale')`,
```

**Verify**: `npm run typecheck -w @digihouse/api` → exit 0, no errors.

### Step 2: Verify tests still pass

`npm run test -w @digihouse/api` → exit 0, all tests pass.

The existing test "creates a property with status draft" (`admin.test.ts:63`) specifically asserts that a created property has `status: "draft"` — this confirms the fix is correct.

**Verify**: exit 0, including the admin test case at line 88 asserting `body.property.status === "draft"`.

## Test plan

- The existing admin.test.ts already covers the draft-creation path (lines 63-89). No new tests needed.
- Verification: `npm run test -w @digihouse/api` exit 0.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run typecheck -w @digihouse/api` exits 0
- [ ] `npm run test -w @digihouse/api` exits 0
- [ ] `grep "IN ('draft', 'funding', 'funded', 'resale')" apps/api/src/db/schema/properties.ts` returns the updated line
- [ ] `grep "IN ('funding', 'funded', 'resale')" apps/api/src/db/schema/properties.ts` returns nothing
- [ ] No files outside the in-scope list are modified (`git status`)

## STOP conditions

Stop and report back (do not improvise) if:

- The drift check shows the schema file changed since `260ef3c`.
- `npm run test -w @digihouse/api` fails (other than pre-existing failures unrelated to this change — check whether the admin "draft" test specifically fails).
- The fix requires touching anything outside `apps/api/src/db/schema/properties.ts`.

## Maintenance notes

- The `CreatePropertyInput` type already includes `"draft"` as a valid status; this fix only aligns the schema constraint.
- If future statuses are added, always update both the schema CHECK constraint and the migration.
