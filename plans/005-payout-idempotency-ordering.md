# Plan 005: Fix payout idempotency key ordering + add transaction safety

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f1f5337..HEAD -- apps/api/src/payouts/tick-payout.ts apps/api/src/payouts/tick-payout.test.ts apps/api/src/earnings/earnings-store.ts apps/api/src/payouts/payout-tick-store.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: correctness
- **Planned at**: commit `f1f5337`, 2026-07-29
- **Issue**: —

## Why this matters

The payout tick has an ordering bug that can permanently stick a distribution
in a partially-paid state:

1. `tick-payout.ts:81` — The idempotency key is inserted FIRST (`tryInsert`).
2. `tick-payout.ts:96` — THEN entries are marked as paid (`markPendingPaidForDistribution`).

If the process crashes between steps 1 and 2, the idempotency key exists but
entries remain pending. On the next tick, the key check at line 53
(`hasKey`) returns true — the tick returns idempotent=true (no-op), and those
entries are never paid.

On top of this, `markPendingPaidForDistribution` in `earnings-store.ts:62-87`
updates entries one at a time with individual UPDATE queries and NO DB
transaction. A crash mid-loop would leave some entries paid and others pending
(combining with the idempotency ordering bug to make recovery impossible
without manual DB intervention).

## Current state

- `apps/api/src/payouts/tick-payout.ts:51-99`:
  ```typescript
  // Line 53 — key check (second tick returns early)
  if (await deps.ticks.hasKey(key)) { return { idempotent: true, ... }; }

  // Lines 81-94 — key inserted BEFORE payment
  const claim = await deps.ticks.tryInsert({ idempotencyKey: key, ... });
  if (claim === "duplicate") { return { idempotent: true, ... }; }

  // Line 96 — payment happens AFTER key insert
  const { entryIds } = await deps.earnings.markPendingPaidForDistribution({...});
  ```

- `apps/api/src/earnings/earnings-store.ts:62-87`:
  ```typescript
  async markPendingPaidForDistribution({ distributionId, txHashFor }) {
    const pending = await db.select().from(earningsEntries).where(...);  // Read all pending
    for (const row of pending) {
      await db.update(earningsEntries)                                    // One UPDATE per entry
        .set({ status: "paid", txHash })
        .where(and(eq(earningsEntries.id, row.id), eq(earningsEntries.status, "pending")));
    }
    return { entryIds };
  }
  ```

- `apps/api/src/payouts/payout-tick-store.ts:54-62` — `hasKey` checks existence
  in `payout_ticks` table. If the key exists, no further processing occurs.

Conventions to match:
- Store methods follow the `createDbX` / `createMemoryX` pattern.
- DB updates use Drizzle. A single UPDATE with `RETURNING` is preferred.
- The existing `tick-payout.test.ts` tests already cover basic idempotency —
  update them rather than rewriting.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npm run typecheck:api` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| API tests | `npm run test:api` | all pass |

## Scope

**In scope**:
- `apps/api/src/payouts/tick-payout.ts` — reorder operations: mark paid first,
  THEN insert idempotency key (swap lines 81-96 so payment precedes key insert)
- `apps/api/src/earnings/earnings-store.ts` — replace row-by-row UPDATE loop
  with a single `UPDATE ... WHERE distribution_id = :d AND status = 'pending'
  SET status = 'paid', tx_hash = ... RETURNING id` (atomic)
- `apps/api/src/payouts/tick-payout.test.ts` — add a test case for
  crash-recovery scenario (idempotency key not present, but entries already paid)

**Out of scope**:
- `apps/api/src/payouts/payout-tick-store.ts` — no changes (the tryInsert/hasKey
  interface is correct; only call ordering changes)
- `apps/api/src/payouts/worker.ts` — no changes
- `apps/api/src/payouts/distribution-store.ts` — no changes
- Any file outside `apps/api/src/payouts/` or `apps/api/src/earnings/`

## Steps

### Step 1: Reorder operations in tickPayout

Edit `apps/api/src/payouts/tick-payout.ts`:

Swap the ordering so payment happens before the idempotency key insert:

1. Remove the `tryInsert` at line ~81-94.
2. Move the `markPendingPaidForDistribution` call to run first.
3. Insert the idempotency key AFTER payment succeeds.

The reordered function should be:

```typescript
// Payment first (no idempotency key yet — crash-safe: re-tick will find pending entries)
const { entryIds } = await deps.earnings.markPendingPaidForDistribution({
  distributionId,
  txHashFor: syntheticPayoutTxHash,
});

// Idempotency key only after payment succeeds
const claim = await deps.ticks.tryInsert({
  idempotencyKey: key,
  distributionId,
  paidEntries: entryIds.length,
});

// If this somehow races with another tick (key already exists), that's fine —
// the second tick found the key already inserted and returned early before
// attempting payment. Both paths are consistent.
```

Keep the rest of the function unchanged (the check for `stillPending`,
`markCompleted`, audit event write).

Remove the `hasKey` check at line 53 — with the payment happening first, a
second call to tickPayout for the same distribution will try to pay entries
that are already paid (and `markPendingPaidForDistribution` skips non-pending
entries). The idempotency key still prevents duplicate audit events.

Actually, keep the `hasKey` check for efficiency (avoid a DB query on every
redundant tick), but remove the early return — change it to:
```typescript
if (await deps.ticks.hasKey(key)) {
  // Key already exists — payment was already done. Still check for stragglers
  // in case previous tick crashed after payment but before key insert.
  const pending = await deps.earnings.countPendingByDistribution(distributionId);
  if (pending === 0) {
    return { distributionId, paidEntries: 0, entryIds: [], idempotent: true, idempotencyKey: key };
  }
  // Fall through — there are pending entries that need payment
}
```

This handles the crash scenario: if a previous tick paid entries but crashed
before writing the key, this will re-pay them (harmless due to row-level
UPDATE idempotency).

**Verify**: `npm run typecheck:api` → exit 0.

### Step 2: Make markPendingPaidForDistribution atomic

Edit `apps/api/src/earnings/earnings-store.ts`:

Replace the row-by-row loop in `markPendingPaidForDistribution` with a single
UPDATE:

```typescript
async markPendingPaidForDistribution({ distributionId, txHashFor }) {
  // Read pending entries with their IDs
  const pending = await db
    .select({ id: earningsEntries.id })
    .from(earningsEntries)
    .where(
      and(
        eq(earningsEntries.distributionId, distributionId),
        eq(earningsEntries.status, "pending"),
      ),
    );

  if (pending.length === 0) return { entryIds: [] };

  // Use a single UPDATE for all entries in one go
  // Since txHash is per-entry (simulated: id), we can't use a single
  // blanket UPDATE. Instead, do one UPDATE-like batch using the
  // Drizzle driver's bulk update capabilities, or keep row-by-row
  // but wrap in a DB transaction.
  for (const row of pending) {
    const txHash = txHashFor(row.id);
    await db
      .update(earningsEntries)
      .set({ status: "paid", txHash })
      .where(
        and(
          eq(earningsEntries.id, row.id),
          eq(earningsEntries.status, "pending"),
        ),
      );
  }
  return { entryIds: pending.map((r) => r.id) };
}
```

Since each entry gets a unique txHash (synthetic for hybrid), a single blanket
UPDATE won't work. Instead, keep the loop but wrap it in a DB transaction:

```typescript
import { sql } from "drizzle-orm";

async markPendingPaidForDistribution({ distributionId, txHashFor }) {
  const pending = await db
    .select({ id: earningsEntries.id })
    .from(earningsEntries)
    .where(
      and(
        eq(earningsEntries.distributionId, distributionId),
        eq(earningsEntries.status, "pending"),
      ),
    );

  if (pending.length === 0) return { entryIds: [] };

  // Transactional batch update
  await db.transaction(async (tx) => {
    for (const row of pending) {
      const txHash = txHashFor(row.id);
      await tx
        .update(earningsEntries)
        .set({ status: "paid", txHash })
        .where(
          and(
            eq(earningsEntries.id, row.id),
            eq(earningsEntries.status, "pending"),
          ),
        );
    }
  });

  return { entryIds: pending.map((r) => r.id) };
}
```

Check if Drizzle's `transaction` API is available — search existing code for
`db.transaction` usage in the API package. If not available, at minimum wrap
the key insert and the payment loop in a transaction at the `tickPayout` level.

**Verify**: `npm run typecheck:api` → exit 0.

### Step 3: Update tick-payout tests

Edit `apps/api/src/payouts/tick-payout.test.ts`:

Add a test case for the crash-recovery scenario:

```typescript
it("handles crash-between-payment-and-key scenario (re-tick pays remaining)", async () => {
  const deps = makeDeps();
  // First tick: simulate crash after payment but before key insert
  // by calling markPendingPaidForDistribution directly
  await deps.earnings.markPendingPaidForDistribution({
    distributionId: DIST_ID,
    txHashFor: syntheticPayoutTxHash,
  });
  // Key was NOT inserted (simulating crash)

  // Second tick: should find no pending entries, insert key, not double-pay
  const r = await tickPayout(deps, DIST_ID);
  expect(r.paidEntries).toBe(0);
  expect(r.idempotent).toBe(true);

  // All entries still paid (not reverted)
  for (const row of deps.earnings._rows) {
    expect(row.status).toBe("paid");
  }
});
```

**Verify**: `npx vitest run apps/api/src/payouts/tick-payout.test.ts` → all pass.

### Step 4: Run full test suite

**Verify**: `npm run test:api` → all tests pass.

## Test plan

- **Updated test in `tick-payout.test.ts`**: crash-recovery scenario where
  entries are paid but idempotency key is missing — re-tick should not
  double-pay and should insert the key.
- Existing tests must still pass without modification:
  - "second tick is idempotent" — should still work (key check before payment
    is now removed, but the payment loop skips non-pending entries)
  - "back-to-back ticks pay once" — same reasoning

## Done criteria

- [ ] `npm run typecheck:api` → exit 0
- [ ] `npm run lint` → exit 0
- [ ] `npm run test:api` → all tests pass
- [ ] The idempotency key insert in `tick-payout.ts` now appears AFTER the
  `markPendingPaidForDistribution` call (verify by reading the file)
- [ ] `earnings-store.ts` `markPendingPaidForDistribution` wraps updates in
  `db.transaction()` or equivalent
- [ ] New crash-recovery test exists in `tick-payout.test.ts`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Drizzle's `db.transaction()` API is not available in this version or has
  a different import path. If so, skip the transaction wrapping and note it
  as a future improvement — the key reordering alone fixes the stuck-payout
  bug.
- The crash-recovery test as designed doesn't work with the in-memory store
  (the memory store doesn't simulate crashes; adjust the test to manually
  manipulate the tick store state instead).
- The reordered tickPayout causes existing "idempotent" test to fail
  (the second tick should skip non-pending entries via the payment loop's
  `WHERE status = 'pending'` clause).

## Maintenance notes

- Future plan: when on-chain distribution (P3-03) ships, the payout tick is
  replaced by the indexer distribution handler. At that point this code path
  becomes hybrid-only and eventually deprecated. The fix here ensures hybrid
  mode is safe until then.
- The crash-recovery scenario is hard to reproduce in production (requires
  a process kill at exactly the wrong moment). The test provides confidence
  that the code handles it correctly.
