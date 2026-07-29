# Plan 002: Add indexer characterization tests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f1f5337..HEAD -- apps/api/src/indexer/ apps/api/src/db/schema/chain-events.ts apps/api/src/payouts/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (but recommended after 001)
- **Category**: tests
- **Planned at**: commit `f1f5337`, 2026-07-29
- **Issue**: —

## Why this matters

The indexer (P3-01/02/03) has 6 source files and zero tests. It listens to
the TON chain, writes to the DB, updates holdings and earnings — all without
a single automated safety net. Before any functional changes (plan 003), we
need characterization tests that lock down current behavior. These tests
prevent regressions when fixing the `sharesOwned` overwrite bug and adding
audit events.

Existing test patterns in this repo use in-memory stores (e.g.
`createMemoryEarningsStore`, `createMemoryPayoutTickStore`). The indexer
stores already have in-memory variants: `cursor-store.ts`, `event-store.ts`,
`ton-client.ts`. Tests should use those.

## Current state

- `apps/api/src/indexer/` directory:
  - `cursor-store.ts` — `createDbCursorStore` + `createMemoryCursorStore`
  - `event-store.ts` — `createDbEventStore` + `createMemoryEventStore` (already has `_events` array)
  - `ton-client.ts` — `TonClient` interface with `fetchJettonTransfers` and `fetchDistributionClaims` (no in-memory mock yet)
  - `jetton-handler.ts` — `handleJettonTransfer(deps, eventId)`
  - `distribution-handler.ts` — `handleDistributionClaim(deps, eventId)`
  - `indexer-worker.ts` — `startIndexer(deps, pollMs)`, `pollChain`, `processEvents`

- No test files exist in the directory:
  ```
  Get-ChildItem apps/api/src/indexer/*.test.* → empty
  ```

- Existing test patterns to follow:
  - `apps/api/src/payouts/tick-payout.test.ts` — uses in-memory stores, Vitest, short focused tests
  - `apps/api/src/routes/buys.test.ts` — integration-level tests with `app.request()`

- `event-store.ts` exposes `createMemoryEventStore` with `_events` array:
  ```typescript
  // In-memory store already exists with _events array property
  const events = createMemoryEventStore(seed?);
  events._events  // array of stored events
  ```

- `ton-client.ts` has no in-memory mock — a `createFakeTonClient` test helper
  must be created.

Convention to match: test file alongside source (`__tests__/` in Mini App, or
`.test.ts` sibling in API). The API uses `.test.ts` sibling (see
`tick-payout.test.ts` next to `tick-payout.ts`).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npm run typecheck:api` | exit 0 |
| Tests | `npx vitest run apps/api/src/indexer/` | all pass |
| Lint | `npm run lint` | exit 0 |
| All tests | `npm run test:api` | all pass |

## Scope

**In scope** (the only files you should create/modify):
- `apps/api/src/indexer/ton-client.ts` — add `createFakeTonClient` export (test helper)
- `apps/api/src/indexer/cursor-store.test.ts` — create (characterize cursor store)
- `apps/api/src/indexer/event-store.test.ts` — create (characterize event store)
- `apps/api/src/indexer/jetton-handler.test.ts` — create (characterize jetton handler)
- `apps/api/src/indexer/distribution-handler.test.ts` — create (characterize dist handler)
- `apps/api/src/indexer/indexer-worker.test.ts` — create (characterize worker cycle)

**Out of scope** (do NOT touch, even though they look related):
- `apps/api/src/indexer/jetton-handler.ts` — no functional changes (covered by plan 003)
- `apps/api/src/indexer/distribution-handler.ts` — no functional changes
- `apps/api/src/indexer/indexer-worker.ts` — no functional changes
- `apps/api/src/indexer/cursor-store.ts` — no functional changes
- `apps/api/src/indexer/event-store.ts` — no functional changes
- Any file outside `apps/api/src/indexer/`

## Steps

### Step 1: Add `createFakeTonClient` to ton-client.ts

Edit `apps/api/src/indexer/ton-client.ts`:

Add a factory that returns a `TonClient` with configurable canned responses:

```typescript
export function createFakeTonClient(opts: {
  jettonTransfers?: Array<{ tx_hash: string; block_lt: string; logical_time?: string; from: string; to: string; amount: string; jetton_master?: string }>;
  distributionClaims?: Array<{ tx_hash: string; block_lt: string; logical_time?: string; claimer: string; amount_nano: string; property_id: string; week_of: string }>;
  nextJettonCursor?: string | null;
  nextDistCursor?: string | null;
}): TonClient {
  return {
    async fetchJettonTransfers(_masterAddress, _cursor) {
      return {
        events: opts.jettonTransfers ?? [],
        nextCursor: opts.nextJettonCursor ?? null,
      };
    },
    async fetchDistributionClaims(_distAddress, _cursor) {
      return {
        events: opts.distributionClaims ?? [],
        nextCursor: opts.nextDistCursor ?? null,
      };
    },
  };
}
```

Preserve the existing `TonClient` interface type — do not modify it.

**Verify**: `npm run typecheck:api` → exit 0.

### Step 2: Create cursor-store.test.ts

Create `apps/api/src/indexer/cursor-store.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { createMemoryCursorStore } from "./cursor-store.js";

describe("cursor-store (characterization)", () => {
  it("getOrInit returns default cursor for unknown contract+type", async () => {
    const store = createMemoryCursorStore();
    const c = await store.getOrInit("EQD...", "jetton_transfer");
    expect(c.contractAddress).toBe("EQD...");
    expect(c.eventType).toBe("jetton_transfer");
    expect(c.cursor).toBe(0);
  });

  it("getOrInit returns existing cursor on second call", async () => {
    const store = createMemoryCursorStore();
    const c1 = await store.getOrInit("EQD...", "jetton_transfer");
    expect(c1.cursor).toBe(0);
    const c2 = await store.getOrInit("EQD...", "jetton_transfer");
    expect(c2.cursor).toBe(0);
  });

  it("advance updates cursor and metadata", async () => {
    const store = createMemoryCursorStore();
    await store.getOrInit("EQD...", "jetton_transfer");
    await store.advance("EQD...", "jetton_transfer", 42, 100, "txabc");
    const c = await store.getOrInit("EQD...", "jetton_transfer");
    expect(c.cursor).toBe(42);
    expect(c.lastSeenLt).toBe(100);
    expect(c.lastTxHash).toBe("txabc");
  });
});
```

**Verify**: `npx vitest run apps/api/src/indexer/cursor-store.test.ts` → 3 tests pass.

### Step 3: Create event-store.test.ts

Create `apps/api/src/indexer/event-store.test.ts`.

Test these behaviors:
- `tryInsert` with new eventId → `"inserted"`
- `tryInsert` with duplicate eventId → `"skipped"` (or `"duplicate"` per implementation)
- `claimBatch` returns up to N events ordered by block_lt
- `markDone` changes status
- `markFailed` increments retryCount
- `markDead` sets status to `"dead"` after max retries
- Events with different eventTypes are tracked separately

**Verify**: `npx vitest run apps/api/src/indexer/event-store.test.ts` → all pass.

### Step 4: Create jetton-handler.test.ts

Create `apps/api/src/indexer/jetton-handler.test.ts`.

This is the most important test file. It must cover:
1. **Happy path**: event for known property + exiting holding → updates sharesOwned (captures current behavior, even if wrong per F4)
2. **Unknown property**: event for contractAddress not in DB → skipped (0 handled)
3. **Missing event**: eventId not in event store → skipped
4. **Missing toAddress/amount**: event with null fields → skipped
5. **No holding row**: event for address with no holding → skipped (NOTE: document this as the current behavior — holding must exist first)

Use `createMemoryEventStore`, `createMemoryCursorStore`, and `createFakeTonClient`.

The test should simulate the full path: TonClient returns events → event-store inserts them → handler processes them.

Since jetton-handler takes a `Db` (Postgres), not an in-memory store, the test
needs a lightweight in-memory DB. Follow the pattern from the existing
`tick-payout.test.ts` which uses `createMemoryEarningsStore` etc. — the
jetton handler takes a `{ db, log }` deps object.

**Key insight**: the jetton handler uses `deps.db` directly (Drizzle queries).
To test it without Postgres, you need an in-memory implementation of the DB
interface. Check if one already exists — if not, create a minimal one in the
test file that stores rows in arrays (same pattern as
`createMemoryEarningsStore`).

The handler only queries three tables:
- `chainEvents` (read by eventId)
- `properties` (lookup by `onchainMaster`)
- `holdings` (read by propertyId+walletAddress, update jettonBalance+sharesOwned)

Model after the store pattern in `earnings/earnings-store.ts` (in-memory + DB implementations).

**Verify**: `npx vitest run apps/api/src/indexer/jetton-handler.test.ts` → all pass, covering 5+ scenarios.

### Step 5: Create distribution-handler.test.ts

Create `apps/api/src/indexer/distribution-handler.test.ts`.

Cover:
1. **Happy path**: known distribution + pending earnings entry → sets paid+txHash
2. **Unknown property**: distribution contract not in DB → skipped
3. **Missing userId/distributionId** in rawData → skipped
4. **Already paid entry**: entry already paid → skipped (idempotent)
5. **Simulated txHash**: event.txHash starts with `simulated:` → skipped
6. **No matching distribution**: distributionId not found → skipped
7. **No matching earnings entry**: no entry for userId+distributionId → skipped

Same test approach as Step 4 — use in-memory stores for DB tables.

**Verify**: `npx vitest run apps/api/src/indexer/distribution-handler.test.ts` → all pass.

### Step 6: Create indexer-worker.test.ts

Create `apps/api/src/indexer/indexer-worker.test.ts`.

This tests the orchestration layer:
1. `startIndexer` polls and process events on tick
2. `pollChain` iterates properties with onchainMaster/distributionAddress
3. Worker handle `stop()` works
4. Error in `pollChain` doesn't crash the loop (logged and continues)

Use `createFakeTonClient` and in-memory stores. Set `pollMs` very short for tests
and use `setTimeout` / `Promise` to await at least one tick.

Test the `processEvents` function directly:
- Creates events in event store
- Calls `processEvents` via dependency injection
- Checks that events are marked done/failed/dead based on handler result

**Verify**: `npx vitest run apps/api/src/indexer/indexer-worker.test.ts` → all pass.

### Step 7: Run full test suite

**Verify**: `npm run test:api` → all pass (existing 101 tests + new indexer tests).

## Test plan

| Test file | Tests | Focus |
|-----------|-------|-------|
| `cursor-store.test.ts` | 3 | getOrInit, advance, idempotency |
| `event-store.test.ts` | 6 | tryInsert, dedup, claimBatch, markDone/Failed/Dead |
| `jetton-handler.test.ts` | 5 | happy, unknown property, missing event, missing fields, no holding |
| `distribution-handler.test.ts` | 7 | happy, unknown property, missing rawData, idempotent, simulated txHash |
| `indexer-worker.test.ts` | 4 | start/stop, poll iterates, processEvents orchestration, error resilience |

Follow the structure of `tick-payout.test.ts` — one `describe` block per function,
short focused tests with clear names.

## Done criteria

- [ ] `npm run typecheck:api` → exit 0
- [ ] `npm run test:api` → all existing tests + 25+ new indexer tests pass
- [ ] `npx vitest run apps/api/src/indexer/` → all pass
- [ ] All 6 indexer source files have corresponding test files
- [ ] `createFakeTonClient` export exists in `ton-client.ts`
- [ ] No files outside `apps/api/src/indexer/` are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The in-memory DB abstraction for jetton-handler tests is too complex to
  create alongside the test file (if so, consider creating a shared
  `__test-utils__/indexer-db.ts` helper and note it as a scope change).
- `createFakeTonClient` would require modifying the `TonClient` interface
  (report the current interface shape).
- Any test requires Postgres or network access to pass.

## Maintenance notes

- These tests are characterization tests — they capture behavior as-is.
  When plan 003 changes `jetton-handler.ts`, the test for "updates sharesOwned"
  must be changed to "updates jettonBalance only" and a new test added.
- Add new tests alongside new indexer features (e.g. reconciliation).
- The `createFakeTonClient` helper can be reused by plan 003's test additions.
