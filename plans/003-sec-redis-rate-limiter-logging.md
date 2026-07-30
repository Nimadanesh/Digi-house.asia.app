# Plan 003: Add logging and fail-closed behavior to Redis rate limiter

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 260ef3c..HEAD -- apps/api/src/lib/rate-limit-redis.ts apps/api/src/lib/rate-limit-redis.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `260ef3c`, 2026-07-30
- **Issue**: (none)
- **Status**: **DONE** — commit `97d2eb9`, 2026-07-30

## Why this matters

The Redis token-bucket rate limiter (`createRedisTokenBucket`) has an empty `catch` block that silently swallows all Redis errors — network failures, timeouts, Lua script errors, connection drops. When Redis is unreachable, every request passes through un-throttled (fail-open) with zero observability. Operations has no way to detect that rate limiting is broken. At minimum, errors must be logged; ideally, rate limiting should fail-closed (deny the request) during Redis outages to prevent abuse.

## Current state

- `apps/api/src/lib/rate-limit-redis.ts` — the entire module. The `createRedisTokenBucket` function (line 60) accepts `opts` with `redis`, `max`, `windowMs`, and `key`. The catch block at lines 88–91:

```ts
} catch {
  // Redis failure — fall open to avoid blocking orders
  // (log would be nice, but we don't have logger here)
}
```

- The function signature (`line 64`) does not accept a logger.
- The call site in `apps/api/src/routes/orders.ts:65-76` constructs the rate limiter:

```ts
const orderRateLimit =
    deps.rateLimiter ??
    slidingWindowRateLimit({
      windowMs: 60_000,
      max: 30,
      key: (c) => c.get("userId") as string,
    });
```

The Redis rate limiter is injected from `apps/api/src/app.ts` where it receives a `redis` client but no logger.

- The repo uses pino logging (`Logger` type from pino). See `apps/api/src/app.ts` for how the logger is threaded through — `log: Logger` is part of `CreateAppOptions`.

- There is no test file for `rate-limit-redis.ts`.

## Commands you will need

| Purpose          | Command                              | Expected on success             |
|------------------|--------------------------------------|---------------------------------|
| API tests        | `npm run test -w @digihouse/api`     | exit 0, all pass                |
| Typecheck        | `npm run typecheck -w @digihouse/api`| exit 0, no errors               |
| Lint             | `npm run lint` (repo root)           | exit 0                          |

## Scope

**In scope** (the only files you should modify):
- `apps/api/src/lib/rate-limit-redis.ts` — add logger param and logging; change to fail-closed
- `apps/api/src/lib/rate-limit-redis.test.ts` — create with 2 tests (basic deny-on-error behavior)

The call site in `apps/api/src/app.ts` that creates the Redis rate limiter — update to pass the logger.

**Out of scope** (do NOT touch):
- The in-memory rate limiter (`apps/api/src/lib/rate-limit.ts`) — separate concern, already has its own fail-closed behavior.
- The order route (`apps/api/src/routes/orders.ts`) — no changes needed.
- Any other file.

## Git workflow

- Branch: `advisor/003-sec-redis-rate-limiter-logging`
- Commit 1: `fix(api): add logging and fail-closed to Redis rate limiter`
- Commit 2: `test(api): add Redis rate limiter error-handling tests`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add `log` parameter to `createRedisTokenBucket` opts

The `Logger` type is imported from `pino`. Check the import style in the codebase (`apps/api/src/app.ts` imports `import type { Logger } from "pino"`).

Edit the `opts` type and function signature:

**Current** (line 60):
```ts
export function createRedisTokenBucket(opts: {
  redis: Redis;
  max: number;
  windowMs: number;
  key: (c: Context) => string;
}): MiddlewareHandler {
```

**New** — add `log: Logger` to the opts object:

```ts
import type { Logger } from "pino";

export function createRedisTokenBucket(opts: {
  redis: Redis;
  max: number;
  windowMs: number;
  key: (c: Context) => string;
  log: Logger;
}): MiddlewareHandler {
```

Then destructure `log` along with the others at line 66:
```ts
const { redis, max, windowMs, key, log } = opts;
```

**Verify**: `npm run typecheck -w @digihouse/api` → exit 0, no errors (the call site in `app.ts` will now fail — expected, fixed in step 2).

### Step 2: Update the catch block to log and fail-closed

Replace lines 88–91:

```ts
} catch {
  // Redis failure — fall open to avoid blocking orders
  // (log would be nice, but we don't have logger here)
}
```

with:

```ts
} catch (err) {
  log.error({ err, key: k }, "Redis rate limit check failed — denying request");
  return c.json(
    { code: "rate_limit_error", message: "Rate limit check failed" },
    500,
  );
}
```

This fails closed: on Redis error, the request gets a 500 response instead of passing through un-throttled.

**Verify**: `npm run typecheck -w @digihouse/api` → still type errors on call site — expected.

### Step 3: Update the call site in `apps/api/src/app.ts`

Find where `createRedisTokenBucket` is called. Search for `createRedisTokenBucket` or `rate-limit-redis` in `apps/api/src/app.ts`. Pass the app's `log` to it.

If the pattern is something like:
```ts
const rateLimiter = createRedisTokenBucket({ redis, max: 30, windowMs: 60_000, key: ... });
```

Change to:
```ts
const rateLimiter = createRedisTokenBucket({ redis, max: 30, windowMs: 60_000, key: ..., log });
```

(Where `log` is the `Logger` already available in that scope. Adjust field names to match the actual code.)

**Verify**: `npm run typecheck -w @digihouse/api` → exit 0, no errors.

### Step 4: Create test file `apps/api/src/lib/rate-limit-redis.test.ts`

Create a test file that verifies the error-handling behavior. Since we cannot rely on a real Redis in tests, we inject a fake Redis client whose `eval` method rejects.

Pattern to follow: use the existing `vitest` test style from `apps/api/src/routes/admin.test.ts` (imports from vitest, describe/it blocks).

```ts
import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { createRedisTokenBucket } from "./rate-limit-redis.js";

const noopLogger = {
  info: () => {},
  warn: () => {},
  error: vi.fn(),
  debug: () => {},
  fatal: () => {},
  trace: () => {},
  child: () => noopLogger,
} as any;

describe("createRedisTokenBucket", () => {
  it("returns 500 when Redis eval fails", async () => {
    const fakeRedis = {
      eval: vi.fn().mockRejectedValue(new Error("Redis connection lost")),
    } as any;

    const app = new Hono();
    app.use(
      "/test",
      createRedisTokenBucket({
        redis: fakeRedis,
        max: 10,
        windowMs: 60_000,
        key: () => "test-user",
        log: noopLogger,
      }),
    );
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(500);
    const body = await res.json() as any;
    expect(body.code).toBe("rate_limit_error");
  });

  it("logs the error when Redis eval fails", async () => {
    const fakeRedis = {
      eval: vi.fn().mockRejectedValue(new Error("timeout")),
    } as any;

    const app = new Hono();
    app.use(
      "/test",
      createRedisTokenBucket({
        redis: fakeRedis,
        max: 10,
        windowMs: 60_000,
        key: () => "test-user",
        log: noopLogger,
      }),
    );
    app.get("/test", (c) => c.json({ ok: true }));

    await app.request("/test");
    expect(noopLogger.error).toHaveBeenCalledTimes(1);
    expect(noopLogger.error.mock.calls[0][0]).toMatchObject({
      err: expect.any(Error),
    });
  });
});
```

**Do not add any comments**. Use the exact mock logger pattern from the codebase (see `admin.test.ts` for the `silentLog` pattern — but note the `mock` approach above is simpler for spying on calls). The `noopLogger` should be a `Logger`-compatible object.

**Verify**: `npm run test -w @digihouse/api` → exit 0, including the 2 new tests.

## Test plan

- New tests in `apps/api/src/lib/rate-limit-redis.test.ts`:
  - "returns 500 when Redis eval fails" — injects a mock Redis that rejects; asserts 500 response with `rate_limit_error` code.
  - "logs the error when Redis eval fails" — same mock Redis; asserts `log.error` was called.
- Pattern reference: `apps/api/src/routes/admin.test.ts` for how the test environment is set up (Hono app, route mounting).
- Verification: `npm run test -w @digihouse/api` exit 0, both new tests pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run typecheck -w @digihouse/api` exits 0
- [ ] `npm run test -w @digihouse/api` exits 0
- [ ] `grep "log.error" apps/api/src/lib/rate-limit-redis.ts` returns the logging line
- [ ] `grep "catch" apps/api/src/lib/rate-limit-redis.ts` no longer shows an empty catch block
- [ ] Test file exists at `apps/api/src/lib/rate-limit-redis.test.ts`
- [ ] No files outside the in-scope list are modified (`git status`)

## STOP conditions

Stop and report back (do not improvise) if:

- The call site in `app.ts` doesn't have access to a logger in the same scope — examine the surrounding code and report what is available.
- A step's verification fails twice after a reasonable fix attempt.
- The fix requires touching an out-of-scope file.

## Maintenance notes

- If the rate limiter is used in additional routes in the future, each call site must pass a `log` instance.
- The `fail-closed` approach (returning 500) is intentional: a broken rate limiter should not silently allow unlimited requests. If operations prefers fail-open during Redis blips, the catch block can be changed to log + continue — but that is a deliberate policy choice.
