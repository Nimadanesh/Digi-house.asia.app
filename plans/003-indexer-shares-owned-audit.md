# Plan 003: Fix indexer sharesOwned overwrite + add audit events

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f1f5337..HEAD -- apps/api/src/indexer/jetton-handler.ts apps/api/src/indexer/distribution-handler.ts apps/api/src/audit/audit-actions.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (characterization tests from plan 002 must be in place first)
- **Depends on**: plan 002 (indexer characterization tests)
- **Category**: correctness + security
- **Planned at**: commit `f1f5337`, 2026-07-29
- **Issue**: —

## Why this matters

Two bugs in the indexer:

1. **sharesOwned overwrite** (`jetton-handler.ts:77-89`): The indexer currently
   sets `holdings.sharesOwned = Number(nanoAmount / 1e9)` from the on-chain
   jetton balance. In hybrid mode (ADR-001: "Postgres holdings projection is
   authoritative"), the indexer should only update `jettonBalance` — `sharesOwned`
   is managed by the buy/confirm handler. When onchain mode ships and
   `jettonWalletAddress` is populated, this will silently overwrite user holdings
   with chain data, potentially zeroing them out during race conditions.

2. **Missing audit events**: `audit-actions.ts` defines `buy.confirm`,
   `order.cancel`, `payout.tick` but no `indexer.*` actions. Money-movement
   events (holding value changes, earnings payment confirmation) from the
   indexer are invisible in the audit log. This breaks audit-based monitoring
   and reconciliation.

## Current state

- `apps/api/src/indexer/jetton-handler.ts:77-89`:
  ```typescript
  if (holderRow.length > 0) {
    await deps.db
      .update(holdings)
      .set({
        jettonBalance: Number(nanoAmount),
        sharesOwned: Number(nanoAmount / BigInt(10 ** 9)),  // BUG: overwrites sharesOwned
        updatedAt: new Date(),
      })
      .where(/*...*/);
    result.handled = 1;
  }
  ```

- `apps/api/src/indexer/distribution-handler.ts:103-114`:
  ```typescript
  await deps.db
    .update(earningsEntries)
    .set({ status: "paid", txHash })
    .where(/*...*/);
  // No audit event written
  ```

- `apps/api/src/audit/audit-actions.ts` — defined actions are `buy.confirm`,
  `order.cancel`, `payout.tick`. No indexer actions.

Convention to match: audit events use `writeAuditEvent(store, {...})` with
`action`, `actorType`, `resourceType`, `resourceId`, `summary`, `payload`.
See `routes/buys.ts:305-323` for the pattern.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npm run typecheck:api` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| API tests | `npm run test:api` | all pass |

## Scope

**In scope**:
- `apps/api/src/indexer/jetton-handler.ts` — remove `sharesOwned` from the update set
- `apps/api/src/indexer/distribution-handler.ts` — add audit event write after successful paid flip
- `apps/api/src/audit/audit-actions.ts` — add `indexer.holding_sync` and `indexer.distribution_claim` actions
- `apps/api/src/indexer/jetton-handler.test.ts` — update test expectations for the fix (created by plan 002)
- `apps/api/src/indexer/distribution-handler.test.ts` — add audit event assertion (created by plan 002)

**Out of scope**:
- `apps/api/src/indexer/indexer-worker.ts` — no changes needed
- `apps/api/src/indexer/cursor-store.ts` — no changes
- `apps/api/src/indexer/event-store.ts` — no changes
- Creating holdings for new holders — deferred (the indexer currently skips when no holding exists; creating holdings from chain events is a separate feature for P3-06 reconciliation)

## Steps

### Step 1: Remove sharesOwned from jetton handler update

Edit `apps/api/src/indexer/jetton-handler.ts`:

Change the update at lines 77-89. Remove `sharesOwned` from the `.set()` call:

```typescript
if (holderRow.length > 0) {
  await deps.db
    .update(holdings)
    .set({
      jettonBalance: Number(nanoAmount),
      // sharesOwned intentionally NOT updated — ADR-001: off-chain authoritative in hybrid mode.
      // Reconciliation job (P3-06) or onchain mode policy will re-enable with safeguards.
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(holdings.propertyId, propertyId),
        eq(holdings.jettonWalletAddress, toAddress),
      ),
    );
  result.handled = 1;
}
```

**Verify**: `npm run typecheck:api` → exit 0.

### Step 2: Add audit actions

Edit `apps/api/src/audit/audit-actions.ts`:

Add two new entries to the `AUDIT_ACTIONS` array (or wherever actions are defined):

```typescript
"indexer.holding_sync",
"indexer.distribution_claim",
```

If the file uses a TypeScript type or union, add these to the union. If it's
an object constant, preserve the existing pattern exactly.

**Verify**: `npm run typecheck:api` → exit 0.

### Step 3: Add audit event to distribution handler

Edit `apps/api/src/indexer/distribution-handler.ts`:

The handler already receives a `{ db, log }` deps object. Add an optional
`audit` field to `DistributionHandlerDeps`:

```typescript
export type DistributionHandlerDeps = {
  db: Db;
  log: Logger;
  audit?: AuditStore | null;
};
```

Import `writeAuditEvent` from `../audit/write-audit.js`.

After the successful `UPDATE` at lines 103-114, write an audit event:

```typescript
if (deps.audit) {
  await writeAuditEvent(deps.audit, {
    action: "indexer.distribution_claim",
    actorType: "system",
    actorUserId: null,
    actorLabel: "indexer",
    resourceType: "earnings_entry",
    resourceId: entry.id,
    summary: `Indexer marked earnings ${entry.id} as paid (distribution ${distributionId})`,
    payload: {
      eventId,
      distributionId,
      txHash,
      userId,
    },
    requestId: null,
  });
}
```

**Verify**: `npm run typecheck:api` → exit 0.

### Step 4: Update jetton-handler test expectations

Edit `apps/api/src/indexer/jetton-handler.test.ts` (created by plan 002):

Find the test "happy path updates holding" (or whatever name plan 002 gave it).
Change the assertion:
- Before fix: `expect(updated.sharesOwned).toBe(5)` — now remove this assertion
- After fix: `expect(updated.sharesOwned).toBe(oldSharesOwned)` — confirm sharesOwned unchanged
- Always: `expect(updated.jettonBalance).toBe(5000000000)` — jettonBalance still updated

**Verify**: `npx vitest run apps/api/src/indexer/jetton-handler.test.ts` → all pass.

### Step 5: Update distribution-handler test for audit events

Edit `apps/api/src/indexer/distribution-handler.test.ts` (created by plan 002):

In the happy-path test, after calling the handler, verify that an audit event
was written:
```typescript
// Assuming deps has an audit store with _events array
const auditEvents = deps.audit._events.filter(
  (e) => e.action === "indexer.distribution_claim",
);
expect(auditEvents).toHaveLength(1);
expect(auditEvents[0]!.resourceId).toBe("earn-1");
```

**Verify**: `npx vitest run apps/api/src/indexer/distribution-handler.test.ts` → all pass.

### Step 6: Run full test suite

**Verify**: `npm run test:api` → all tests pass.

## Test plan

- Update existing indexer tests (from plan 002) to reflect the fix:
  - `jetton-handler.test.ts`: confirm `sharesOwned` unchanged after handler runs
  - `distribution-handler.test.ts`: confirm audit event written after successful claim
- No new test files needed; update the ones plan 002 created.

## Done criteria

- [ ] `npm run typecheck:api` → exit 0
- [ ] `npm run lint` → exit 0
- [ ] `npm run test:api` → all tests pass
- [ ] `grep -c "sharesOwned" apps/api/src/indexer/jetton-handler.ts` → 0 matches in `.set()` block (line ~79 area)
- [ ] `grep -c "indexer.holding_sync\|indexer.distribution_claim" apps/api/src/audit/audit-actions.ts` → ≥2
- [ ] `grep -c "audit.*writeAuditEvent" apps/api/src/indexer/distribution-handler.ts` → ≥1
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The `HolderHandlerDeps` type doesn't accept an optional audit store
  (report the current type definition so we can adjust).
- The audit actions file doesn't use a union type/constant (report the format).
- Plan 002 hasn't been executed yet — tests don't exist to update.

## Maintenance notes

- When P3-06 (reconciliation) is implemented, the indexer may need to update
  `sharesOwned` as part of chain-ledger reconciliation. At that point, add a
  `mode` parameter to the handler and only overwrite `sharesOwned` when
  `mode === "onchain"`.
- The audit actions `indexer.holding_sync` is exported but not yet used in
  jetton-handler (no audit event for jetton balance updates). This is
  intentional — jetton balance updates are routine (every transfer), and
  auditing every one would be noisy. Only audit earnings-level state changes.
  If monitoring needs it later, wire it in.
