# Plan 012: Compare the admin API secret in constant time

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 4c887c9..HEAD -- apps/api/src/admin`
> If the file changed since this plan was written, compare the "Current
> state" excerpt against the live code; on a mismatch, treat it as a STOP
> condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `4c887c9`, 2026-08-12

## Why this matters

The admin middleware authenticates via `X-Admin-Key` compared with the shared
`ADMIN_API_SECRET` using a plain `!==`. Because the comparison short-circuits
on the first differing byte, an attacker who can time many requests (admin
routes have no rate limiter) can, over enough samples, recover the secret
byte-by-byte via a timing side channel. Full admin access (property
create/update/pause, signed-URL issuance) follows from that one secret.

Constant-time comparison removes the oracle. This is a small hardening and the
secret should be rotated once as part of landing the change (the value is set
via `ADMIN_API_SECRET` in the environment — do not print or commit it).

## Current state

`apps/api/src/admin/admin-middleware.ts:7-18`:

```ts
export function requireAdminSecret(adminSecret: string): MiddlewareHandler {
  return async (c, next) => {
    const key = c.req.header("x-admin-key");
    if (!key || key !== adminSecret) {
      return c.json(
        { code: "unauthorized", message: "Invalid or missing admin key" },
        401,
      );
    }
    await next();
  };
}
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npm run typecheck:api`  | exit 0              |
| API tests | `npm run test:api`       | exit 0              |

## Scope

**In scope**:
- `apps/api/src/admin/admin-middleware.ts`
- `apps/api/src/admin/admin-middleware.test.ts` (create — check whether a
  test file already exists; if not, create at this path)

**Out of scope** (do NOT touch):
- `apps/api/src/routes/admin.ts` and the admin routes' use of the middleware.
- `.env.example` / `env.ts` — the secret name stays `ADMIN_API_SECRET`.
- Frontend code.

## Git workflow

- Branch: `advisor/012-admin-secret-constant-time`
- Single commit: `fix(api): constant-time admin secret comparison`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Constant-time compare

Use Node's `crypto` (`import { timingSafeEqual } from "node:crypto"`). Because
`timingSafeEqual` throws on length mismatch, guard lengths first so a wrong-length
key still returns 401 quickly:

```ts
import { timingSafeEqual, createHash } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a).digest();
  const bh = createHash("sha256").update(b).digest();
  return timingSafeEqual(ah, bh);
}
```

Hashing both sides to a fixed length before `timingSafeEqual` removes the
length oracle and avoids the throw-on-mismatch pitfall. Replace the `key !== adminSecret`
check in `requireAdminSecret` with `!safeEqual(key, adminSecret)`.

**Verify**: `npm run typecheck:api` exits 0.

### Step 2: Test the middleware (new or existing test file)

Create `apps/api/src/admin/admin-middleware.test.ts` if it does not exist, and
add (following the pattern of existing API unit tests — use `Hono`'s
`app.request`):

1. `401` when `x-admin-key` is missing.
2. `401` when the key is wrong (different value, including a different length).
3. Passes through (`next` called → 200) when the key matches.
4. Across a loop, right and wrong keys return the expected statuses (a coarse
   smoke of correctness; not a timing assertion).

**Verify**: `npm run test:api -- --run admin-middleware` exits 0 and reports the new tests.

## Done criteria

ALL must hold:

- [ ] `npm run typecheck:api` exits 0
- [ ] `npm run test:api` exits 0
- [ ] `admin-middleware.test.ts` exists with the four cases above passing
- [ ] `admin-middleware.ts` no longer contains `!== adminSecret` (grep returns no match for `key !== adminSecret`)
- [ ] No files outside the Scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `requireAdminSecret`'s signature or call shape differs from the excerpt.
- The middleware is already constant-time (then this plan is a no-op — mark it REJECTED with that reason and stop).

## Maintenance notes

- Lane note: the admin secret should be **rotated** once in the deployed
  environment after this lands (value not in this repo). Reference
  `docs/ops/secrets-rotation-drill.md` for the procedure.
- If admin routes ever gain rate limiting, this hardening complements it —
  the timing oracle is the remaining risk today.