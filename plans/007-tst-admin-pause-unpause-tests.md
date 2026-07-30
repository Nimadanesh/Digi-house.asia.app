# Plan 007: Add tests for admin pause/unpause endpoints

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 260ef3c..HEAD -- apps/api/src/routes/admin.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (but logically depends on COR-01's schema fix if the admin test creates draft properties)
- **Category**: tests
- **Planned at**: commit `260ef3c`, 2026-07-30
- **Issue**: (none)
- **Status**: **DONE** — commit `60fb84d`, 2026-07-30

## Why this matters

The `POST /v1/admin/properties/:id/pause` and `POST /v1/admin/properties/:id/unpause` endpoints are data-mutation paths — they modify `salePaused`/`distributionPaused` flags in the database and write audit events. They have zero test coverage. A regression in pause/unpause logic (wrong flag values, scope mapping errors, or audit event shape changes) would go undetected until a production admin uses the feature.

## Current state

- `apps/api/src/routes/admin.ts` — pause route at lines 26-81, unpause route at lines 83-138.
- `apps/api/src/routes/admin.test.ts` — existing tests cover auth, create, patch, media/sign, and draft exclusion. No pause/unpause tests exist. See the describe blocks at lines 42, 62, 130, 183, 274.
- The test infrastructure uses `createMemoryPropertyStore` with seed data from `SEED_PROPERTIES`. Pause/unpause is tested by creating a property (POST), then calling pause/unpause with a scope.

- The admin route returns `{ ok: true, property: <updated listing> }` on success, and 404 for unknown properties.
- Audit events are written with action `"admin.pause"` or `"admin.unpause"`.

## Commands you will need

| Purpose          | Command                              | Expected on success             |
|------------------|--------------------------------------|---------------------------------|
| API tests        | `npm run test -w @digihouse/api`     | exit 0, all pass                |
| Test filter      | `npm run test -w @digihouse/api -- admin.test` | exit 0, admin tests pass |
| Typecheck        | `npm run typecheck -w @digihouse/api`| exit 0, no errors               |
| Lint             | `npm run lint` (repo root)           | exit 0                          |

## Scope

**In scope** (the only file you should modify):
- `apps/api/src/routes/admin.test.ts` — add 3 new test cases (plus supporting helper if needed)

**Out of scope** (do NOT touch):
- `apps/api/src/routes/admin.ts` — no code changes needed
- Any other file

## Git workflow

- Branch: `advisor/007-tst-admin-pause-unpause-tests`
- Commit message: `test(api): add pause/unpause endpoint tests`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a describe block for pause/unpause

Insert a new describe block in `apps/api/src/routes/admin.test.ts` after the existing `describe("POST /v1/admin/properties/:id/media/sign", ...)` block (after line 272) and before `describe("draft exclusion from marketplace", ...)` (line 274).

Add these three test cases:

```ts
describe("POST /v1/admin/properties/:id/pause", () => {
  it("pauses sale scope", async () => {
    const deps = makeDeps();
    const app = new Hono().route("/", createAdminRoutes(deps));
    // Create a property first
    const createRes = await app.request("/v1/admin/properties", {
      method: "POST",
      headers: { "x-admin-key": ADMIN_SECRET, "content-type": "application/json" },
      body: JSON.stringify({
        title: "Pause Test", location: "City", description: "desc",
        totalShares: 1000, sharePriceUsd: 10000, annualRentUsd: 50000,
        ownerWalletAddress: "UQFFF", meta: {},
      }),
    });
    const created = ((await createRes.json()) as { property: { id: string } }).property;

    const res = await app.request(`/v1/admin/properties/${created.id}/pause`, {
      method: "POST",
      headers: { "x-admin-key": ADMIN_SECRET, "content-type": "application/json" },
      body: JSON.stringify({ scope: "sale" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; property: { salePaused: boolean; distributionPaused: boolean } };
    expect(body.ok).toBe(true);
    expect(body.property.salePaused).toBe(true);
    expect(body.property.distributionPaused).toBe(false);
  });

  it("returns 404 for unknown property", async () => {
    const app = new Hono().route("/", createAdminRoutes(makeDeps()));
    const res = await app.request("/v1/admin/properties/nonexistent/pause", {
      method: "POST",
      headers: { "x-admin-key": ADMIN_SECRET, "content-type": "application/json" },
      body: JSON.stringify({ scope: "sale" }),
    });
    expect(res.status).toBe(404);
  });

  it("writes audit event on pause", async () => {
    const audit = createMemoryAuditStore();
    const deps = makeDeps({ audit });
    const app = new Hono().route("/", createAdminRoutes(deps));
    const createRes = await app.request("/v1/admin/properties", {
      method: "POST",
      headers: { "x-admin-key": ADMIN_SECRET, "content-type": "application/json" },
      body: JSON.stringify({
        title: "Audit Pause", location: "City", description: "desc",
        totalShares: 1000, sharePriceUsd: 10000, annualRentUsd: 50000,
        ownerWalletAddress: "UQGGG", meta: {},
      }),
    });
    const created = ((await createRes.json()) as { property: { id: string } }).property;

    await app.request(`/v1/admin/properties/${created.id}/pause`, {
      method: "POST",
      headers: { "x-admin-key": ADMIN_SECRET, "content-type": "application/json" },
      body: JSON.stringify({ scope: "all" }),
    });
    const pauseAudits = audit._rows.filter((r: { action: string }) => r.action === "admin.pause");
    expect(pauseAudits.length).toBe(1);
    expect(pauseAudits[0].resourceId).toBe(created.id);
  });
});

describe("POST /v1/admin/properties/:id/unpause", () => {
  it("unpauses distribution scope", async () => {
    const deps = makeDeps();
    const app = new Hono().route("/", createAdminRoutes(deps));
    const createRes = await app.request("/v1/admin/properties", {
      method: "POST",
      headers: { "x-admin-key": ADMIN_SECRET, "content-type": "application/json" },
      body: JSON.stringify({
        title: "Unpause Test", location: "City", description: "desc",
        totalShares: 1000, sharePriceUsd: 10000, annualRentUsd: 50000,
        ownerWalletAddress: "UQHHH", meta: {},
      }),
    });
    const created = ((await createRes.json()) as { property: { id: string } }).property;

    // First pause both
    await app.request(`/v1/admin/properties/${created.id}/pause`, {
      method: "POST",
      headers: { "x-admin-key": ADMIN_SECRET, "content-type": "application/json" },
      body: JSON.stringify({ scope: "all" }),
    });
    // Then unpause distribution only
    const res = await app.request(`/v1/admin/properties/${created.id}/unpause`, {
      method: "POST",
      headers: { "x-admin-key": ADMIN_SECRET, "content-type": "application/json" },
      body: JSON.stringify({ scope: "distribution" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; property: { salePaused: boolean; distributionPaused: boolean } };
    expect(body.ok).toBe(true);
    expect(body.property.salePaused).toBe(true);  // still paused
    expect(body.property.distributionPaused).toBe(false); // unpaused
  });
});
```

**Do not add any comments**. Match the existing test style: use `ADMIN_SECRET` constant, `makeDeps()`, `createMemoryAuditStore()` for audit checks.

**Verify**: `npm run typecheck -w @digihouse/api` → exit 0, no errors.

### Step 2: Run tests

`npm run test -w @digihouse/api` → exit 0, all tests pass including the 5 new tests (3 pause + 1 unpause + 1 audit sub-test).

**Verify**: exit 0. Confirm with `npm run test -w @digihouse/api -- admin.test` to see the test names.

## Test plan

| Test case | What it verifies |
|-----------|-----------------|
| pauses sale scope | pause scope="sale" sets `salePaused=true`, leaves `distributionPaused=false` |
| returns 404 for unknown property | pause on nonexistent id returns 404 |
| writes audit event on pause | audit store gets an `admin.pause` event with correct `resourceId` |
| unpauses distribution scope | unpause scope="distribution" sets `distributionPaused=false`, leaves `salePaused=true` |

Verification: `npm run test -w @digihouse/api` exit 0.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run typecheck -w @digihouse/api` exits 0
- [ ] `npm run test -w @digihouse/api` exits 0; new tests exist and pass
- [ ] `grep -c "describe.*pause\|describe.*unpause" apps/api/src/routes/admin.test.ts` returns at least 2 (pause describe + unpause describe)
- [ ] `grep -c "admin.pause" apps/api/src/routes/admin.test.ts` returns at least 1 (audit event assertion)
- [ ] No files outside the in-scope list are modified (`git status`)

## STOP conditions

Stop and report back (do not improvise) if:

- The test file at `apps/api/src/routes/admin.test.ts` has changed structurally since `260ef3c` (e.g., `makeDeps` renamed, `ADMIN_SECRET` constant changed).
- The create-property flow in the test helper returns a different shape (e.g., `property.id` vs nested).
- A verification command fails twice after a reasonable fix attempt.
- The test requires mocking `deps.properties.setPauseFlags` — the in-memory store already implements this method, so no mocking is needed.

## Maintenance notes

- If new pause scopes are added, update `VALID_SCOPES` validation and add corresponding test cases.
- The audit event assertion pattern is already established in "writes audit event" test in the create-property describe block (line 105-128).
