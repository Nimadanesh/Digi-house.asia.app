# Plan 011: Make buy settlement transactional and share-count atomic

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 4c887c9..HEAD -- apps/api/src/buys apps/api/src/portfolio src/lib/mock/seed`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/010-ci-test-and-typecheck-gate.md (its CI-gated `npm run test:api` is the safety net for this refactor)
- **Category**: bug
- **Planned at**: commit `4c887c9`, 2026-08-12

## Why this matters

`settleVerifiedBuy` is the single place a verified on-chain payment becomes
shares. Today the writes are not atomic:

1. The intent is marked `settled` **first** (the double-settlement guard), then
   `shares_sold` is incremented, the holding is upserted, and the success
   transaction is inserted — four separate statements with no transaction.
   If any later write throws or the process dies after `markSettled`, the
   intent is permanently `settled`, the idempotent retry short-circuits on
   `already_settled`, and the user has paid but owns no shares — unrecoverable
   without manual DB surgery.
2. The holding "upsert" is a read-then-write: `get()` then `upsert()` with an
   absolute `sharesOwned`. Two settlements for the same `(userId, propertyId)`
   racing both read `0`, both write `0+qty`, and one purchase silently loses
   its shares.

After this plan, settlement is all-or-nothing (single DB transaction) and the
share count is incremented atomically by the database. Money taken always
results in shares, exactly once.

## Current state

- `apps/api/src/buys/settle-verified-buy.ts:21-79` — `settleVerifiedBuy`:
  ```ts
  const claimed = await deps.intents.markSettled(input.intent.id, input.intent.userId, new Date()); // :29
  if (!claimed.ok) { /* already_settled short-circuit */ }
  const incremented = await deps.properties.tryIncrementSharesSold(input.intent.propertyId, input.intent.quantity); // :37
  if (!incremented) throw new Error("settle failed: no remaining shares ..."); // :42
  const holding = await deps.holdings.get(userId, propertyId); // :45  ← read
  const oldShares = holding?.sharesOwned ?? 0;
  const oldAvg = holding?.avgCostUsd ?? 0;
  const newShares = oldShares + quantity;
  await deps.holdings.upsert({ userId, propertyId, sharesOwned: newShares, avgCostUsd: nextAvgCostUsd(oldShares, oldAvg, quantity, priceUsdPerShare) }); // :49-54  ← write
  await deps.transactions.insert({ id: `tx_${intent.id}`, ... status: "success", buyIntentId: intent.id }); // :63-76
  ```
- `apps/api/src/portfolio/holding-store.ts:65-88` — the DB `upsert` writes the
  caller-computed absolute value:
  ```ts
  .onConflictDoUpdate({
    target: [holdings.userId, holdings.propertyId],
    set: { sharesOwned: input.sharesOwned, avgCostUsd: input.avgCostUsd, updatedAt: now },
  })
  ```
- `apps/api/src/routes/buys.ts:728-741` — the route calls `settleVerifiedBuy`
  with the shared, already-constructed DB stores (`deps.intents`,
  `deps.properties`, `deps.holdings`, `deps.transactions`), and on any throw
  returns 409 (lines 742-754).
- Store factories each take a drizzle client — `apps/api/src/index.ts:34-39`
  constructs the shared stores, and per-store factories exist:
  `createDbIntentStore(db)` (`intent-store.ts:148`), `createDbTxStore(db)`
  (`tx-store.ts:145`), `createDbPropertyStore(db)` (`property-store.ts:56`),
  `createDbHoldingStore(db)` (`holding-store.ts:40`). Each also has a
  `createMemory*Store()` twin used by tests.
- `apps/api/src/db/client.ts:17` — `Drizzle` client from
  `drizzle-orm/postgres-js`. Postgres-js Drizzle supports
  `db.transaction(async (tx) => { ... })`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npm run typecheck:api`  | exit 0              |
| API tests | `npm run test:api`       | exit 0              |
| Full check| `npm run check`          | exit 0              |

## Scope

**In scope**:
- `apps/api/src/buys/settle-verified-buy.ts`
- `apps/api/src/buys/settle-verified-buy.test.ts`
- `apps/api/src/portfolio/holding-store.ts` (atomic upsert only)
- `apps/api/src/routes/buys.ts` (wire the transaction into the settle call)
- `apps/api/src/buys/intent-store.ts` and `apps/api/src/buys/tx-store.ts`
  (only if a tiny helper type is needed for the transaction binding — see Step 2)

**Out of scope** (do NOT touch):
- The on-chain verification logic (`verify-and-settle` before line 725 of `routes/buys.ts`).
- The order-book / marketplace routes.
- The mock frontend seed (`src/lib/mock`) — settlement is API-only.
- Changing the public response shapes of `/v1/buys/*`.

## Git workflow

- Branch: `advisor/011-settlement-transaction-and-atomic-holding`
- Two commits: (1) atomic holding upsert + tests; (2) transactional settlement + tests.
- Message style matches `git log` (lowercase imperative, e.g. `fix(api): make holding upsert additive`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the DB holding upsert additive (fixes the lost-update race)

In `apps/api/src/portfolio/holding-store.ts`, inside the `.onConflictDoUpdate`
callback, change the `set` so `sharesOwned` increments by the incoming delta
instead of overwriting with the caller's absolute value. Add a new field to the
upsert input, e.g. `sharesDelta` (number), and keep `avgCostUsd` computed by
the caller or — simpler and race-free — require the caller to pass `sharesDelta`
and reuse the caller's `sharesOwned` as the *target* only for the insert branch.

Concrete target shape (authoritative):

- `HoldingRowInput` stays as-is.
- The `upsert(input)` signature gains `sharesDelta: number` next to
  `sharesOwned: number`; the insert branch (`values`) uses `sharesOwned`
  (the current total), and the conflict branch uses
  `sql\`${holdings.sharesOwned} + ${input.sharesDelta}\`` for `sharesOwned`
  (import `sql` from `drizzle-orm`). `avgCostUsd` on conflict is the
  caller's `avgCostUsd` (weighted average — safe to overwrite with the new
  blended value) or use the same additive/CASE approach for a fully atomic
  avg-cost; the simplest atomic-and-correct option is:

```ts
import { sql } from "drizzle-orm";
// inside .onConflictDoUpdate set:
sharesOwned: sql`${holdings.sharesOwned} + ${input.sharesDelta}`,
avgCostUsd: input.avgCostUsd,
updatedAt: now,
```

- Mirror `sharesDelta` in `createMemoryHoldingStore` (additive on conflict so
  the memory twin exercises the same semantics).

**Verify**: `npm run test:api -- --run holding` exits 0.

### Step 2: Wrap the whole settlement in one DB transaction

The factories take a drizzle client, and drizzle transactions are
structurally the same query-builder type, so do the transaction by
re-deriving the four stores bound to `tx`:

- Add `import { createDbIntentStore } from "./intent-store.js";` (and the
  other three `createDb*Store` factories) **inside `routes/buys.ts`** — do not
  create new files.
- In `routes/buys.ts`, replace the `settleVerifiedBuy(depsStores, ...)` call
  (lines 728-741) with a transactional wrapper. If the buy route deps already
  carry a `db` (`Db`) reference, use it; otherwise add `db` to `BuyRouteDeps`
  and pass it from the wiring site (`apps/api/src/app.ts:266` area, where
  `createBuyRoutes` is called with stores built from the same `createDb(db)`).

Authoritative wrapper shape:

```ts
const settled = await (deps.db
  ? deps.db.transaction(async (tx) => {
      const txIntents = createDbIntentStore(tx as unknown as Db);
      const txProperties = createDbPropertyStore(tx as unknown as Db);
      const txHoldings = createDbHoldingStore(tx as unknown as Db);
      const txTransactions = createDbTxStore(tx as unknown as Db);
      return settleVerifiedBuy(
        { intents: txIntents, properties: txProperties, holdings: txHoldings, transactions: txTransactions },
        { intent, actualAmountNano: result.actualAmountNano, actualJettonAmount: result.actualJettonAmount },
      );
    })
  : settleVerifiedBuy(
      { intents: deps.intents, properties: deps.properties, holdings: deps.holdings, transactions: deps.transactions },
      { intent, actualAmountNano: result.actualAmountNano, actualJettonAmount: result.actualJettonAmount },
    ));
```

`markSettled` stays inside the transaction (first write), so the
double-settlement guard still holds — the transaction makes the 409's
"already settled" state + share writes atomic. The `as unknown as Db` cast is
the single approved cast; do not introduce other casts.

Wire `db` through: confirm `app.ts` has a `Db` in scope, add `db?` to
`BuyRouteDeps` in `routes/buys.ts`, and set it at the `createBuyRoutes` call
site.

**Verify**: `npm run typecheck:api` exits 0; `npm run test:api` exits 0.

## Test plan

Add to `apps/api/src/buys/settle-verified-buy.test.ts` (model after the
existing `settles: bumps shares_sold, creates holding, inserts success tx`
test at lines 45-70). The memory stores are synchronous, so the transaction
path itself can't be unit-exercised — test the semantics that changed:

1. **Atomic-ish rollback via throw**: a store that throws in the middle
   (e.g. a `transactions`-insert failure) leaves `sharesSold` unchanged and
   the intent NOT settled, because the throw happens before `markSettled`
   under the claimed ordering? NO — verify the final ordering: the new code
   performs `markSettled` inside the transaction, so use a store stub that
   records call order and assert the write sequence is: markSettled →
   increment → holding upsert → tx insert, and that a forced failure in
   `tx.insert` makes the overall call reject AND that the memory stores'
   post-state is unmodified (the test must simulate a transaction by having
   the memory-store-twin settle run work in a copy — simplest: assert on the
   existing memory stores after a failed attempt that `sharesSold`,
   `holdings`, and intent `status` are unchanged, which a transactional DB
   would also guarantee).
2. **Additive holding**: settle the same `(userId, propertyId)` with two
   intents sequentially (second intent quantity 3) and assert
   `holdings.sharesOwned` is `8`, not `3` or `5` (this test already exists in
   spirit; add the two-intent sequential case to pin additive behavior).
3. **Holding delta unit test**: directly test `createMemoryHoldingStore`
   upsert with `sharesDelta` twice — first insert `{sharesOwned:5, delta:5}`,
   then `{sharesOwned:5, delta:3}` → result must be `8`.

**Verify**: `npm run test:api -- --run settle-verified-buy` passes, and the new tests are present.

## Done criteria

ALL must hold:

- [ ] `npm run typecheck:api` exits 0
- [ ] `npm run test:api` exits 0
- [ ] New tests in `settle-verified-buy.test.ts` assert: failed mid-settlement leaves all stores unchanged; two sequential settlements of the same holding sum correctly; memory holding upsert is additive.
- [ ] `holding-store.ts` DB `onConflictDoUpdate` sets `sharesOwned` via `sql\`... + ${sharesDelta}\`` (grep for `sharesDelta` returns matches in `holding-store.ts`)
- [ ] `routes/buys.ts` settle call is wrapped in `deps.db.transaction(...)` when `deps.db` is present
- [ ] No files outside the Scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `deps.db` is not reachable at the `createBuyRoutes` call site and adding it
  requires restructuring `app.ts` beyond adding one property.
- Drizzle's `db.transaction` typing does not accept the tx-bound store
  factories even with the single `as unknown as Db` cast (in that case the
  plan's transaction approach needs a different seam — report, don't invent).
- The memory-store tests force a different write ordering than described and
  Step 1's additive-upsert test can't be written as specified.
- Any in-scope file content differs from the "Current state" excerpts.

## Maintenance notes

- The `as unknown as Db` cast in the route is the only cast — a future
  drizzle upgrade that removes `db.transaction` typing would surface here.
- If batch/paginated settlement is ever added, the transaction must span the
  whole batch, not one intent at a time.
- Reviewers should confirm the 409 "contact support" path is still hit only
  on genuine failures, and that `markSettled`'s `already_settled` short-circuit
  inside the transaction still prevents double credit.