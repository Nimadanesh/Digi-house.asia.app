# Plan 014: Compute real lifetime earnings in the API portfolio summary

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 4c887c9..HEAD -- apps/api/src/portfolio apps/api/src/routes/portfolio.ts apps/api/src/earnings`
> If any of these changed since this plan was written, compare the "Current
> state" excerpts against the live code; on a mismatch, treat it as a STOP
> condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `4c887c9`, 2026-08-12

## Why this matters

The API's `/v1/portfolio` returns `totalEarningsUsd: 0` — a hardcoded
constant — while the mock repo computes a real number (sum of the user's
`paid` earnings entries). With `NEXT_PUBLIC_DATA_SOURCE=api`, the Home
"Total Earnings Received" figure and the Portfolio lifetime earnings render
**$0.00** even after the user has received paid payouts. That number — "how
much have I earned" — is the headline this product exists to show, and the
mock/API implementations have silently drifted.

After this plan, `totalEarningsUsd` is derived from the earnings ledger on the
API path, matching mock behavior.

## Current state

- `apps/api/src/portfolio/map-portfolio.ts:86` — inside `buildPortfolioSummary`:
  ```ts
  return {
    totalValueUsd,
    totalInvestedUsd,
    totalEarningsUsd: 0,          // ← hardcoded
    weeklyProjectedUsd,
    dayChangeRatio: clampDayChangeRatio(totalValueUsd, totalInvestedUsd),
    holdings: out,
    openOrders,
  };
  ```
- `apps/api/src/routes/portfolio.ts:45-53` — builds the summary and returns it;
  `PortfolioRouteDeps` (lines 14-20) has no earnings store today.
- Reference behavior in the mock:
  `src/lib/mock/seed/index.ts:41` — `totalEarningsUsd = EARNINGS_ENTRIES.filter(e => e.status === "paid").reduce(sum of amountUsd)`.
- The earnings store already exposes the data needed:
  `apps/api/src/earnings/earnings-store.ts:11` — `listEntriesByUserId(userId)` returns
  `{ status, amountUsd, ... }[]`. Add a small aggregator, do not call the network.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npm run typecheck:api`  | exit 0              |
| API tests | `npm run test:api`       | exit 0              |

## Scope

**In scope**:
- `apps/api/src/earnings/earnings-store.ts` — add a counted sum helper to the
  `EarningsStore` interface + both implementations (DB and memory)
- `apps/api/src/routes/portfolio.ts` — accept an `EarningsStore` dep, compute
  the sum, pass it into `buildPortfolioSummary`
- `apps/api/src/portfolio/map-portfolio.ts` — `buildPortfolioSummary` takes an
  optional `totalEarningsUsd` parameter instead of hardcoding 0
- `apps/api/src/routes/portfolio.test.ts` and `apps/api/src/portfolio/map-portfolio.test.ts` — update the assertions that pin `0`
- The wiring site (`apps/api/src/index.ts`) that constructs `PortfolioRouteDeps`

**Out of scope** (do NOT touch):
- `src/lib/mock/**` — mirror behavior stays as-is; the plan is to bring the API up to it.
- Earnings **frontend** pages.
- `listEntriesByUserId` semantics (keep it returning all entries, newest first).

## Git workflow

- Branch: `advisor/014-api-total-earnings-parity`
- Single commit: `fix(api): derive totalEarningsUsd from paid earnings entries`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a `sumPaidUsd(userId)` method to `EarningsStore`

In `apps/api/src/earnings/earnings-store.ts`:

1. Add to the `EarningsStore` interface (after `listEntriesByUserId`):
   ```ts
   /** Sum of `amountUsd` for the user's `paid` entries (integer USD cents). */
   sumPaidUsd(userId: string): Promise<number>;
   ```
2. Implement in `createDbEarningsStore` using a summed select:
   ```ts
   async sumPaidUsd(userId) {
     const rows = await db
       .select({ total: sql<number>`coalesce(sum(${earningsEntries.amountUsd}), 0)` })
       .from(earningsEntries)
       .where(and(eq(earningsEntries.userId, userId), eq(earningsEntries.status, "paid")));
     return Number(rows[0]?.total ?? 0);
   }
   ```
   (import `sql` from `drizzle-orm`; `earningsEntries.amountUsd` is a bigint —
   `coalesce(sum(...),0)` returns a numeric string, so `Number(...)`).
3. Implement in `createMemoryEarningsStore`:
   ```ts
   async sumPaidUsd(userId) {
     return rows.filter((r) => r.userId === userId && r.status === "paid").reduce((s, r) => s + Number(r.amountUsd), 0);
   }
   ```

**Verify**: `npm run typecheck:api` exits 0.

### Step 2: Thread the sum through portfolio

In `apps/api/src/portfolio/map-portfolio.ts`, change
`buildPortfolioSummary(holdings, propertiesById, openOrders = [])` to accept an
optional lifetimearnings value:

```ts
export function buildPortfolioSummary(
  holdings: HoldingInput[],
  propertiesById: Map<string, PropertyMark>,
  openOrders: OrderPublic[] = [],
  totalEarningsUsd = 0,
): PortfolioSummaryPublic
```

and use the parameter at the return site instead of the literal `0`.

In `apps/api/src/routes/portfolio.ts`:

1. Add `earnings?: EarningsStore | null;` to `PortfolioRouteDeps`.
2. In the `/v1/portfolio` handler, compute
   `const lifetimeEarnings = deps.earnings ? await deps.earnings.sumPaidUsd(userId) : 0;`
   and pass it as the 4th argument to `buildPortfolioSummary`.

In `apps/api/src/index.ts`, wire the existing `earnings` store
(`createDbEarningsStore`, already constructed per `index.ts:36`) into the
`PortfolioRouteDeps` argument at the `createPortfolioRoutes` call site (find it
near the other `create*Routes` calls in `index.ts`/`app.ts`).

**Verify**: `npm run typecheck:api` exits 0.

### Step 3: Update the tests that pin `0`

- `apps/api/src/portfolio/map-portfolio.test.ts:55` — `expect(s.totalEarningsUsd).toBe(0)`
  → keep a case with default (0) but add a case passing an explicit value:
  `buildPortfolioSummary([], new Map(), [], 12_000)` → `totalEarningsUsd === 12_000`.
- `apps/api/src/routes/portfolio.test.ts:171` — currently asserts `body.totalEarningsUsd` is `0`. This route test builds deps without an earnings store; keep `0` for the null-earnings path, and add (or extend) a case that injects a memory earnings store (`createMemoryEarningsStore`) with one `paid` entry of `4000` and asserts `totalEarningsUsd` is `4000`, plus one `pending` entry that is excluded.

**Verify**: `npm run test:api -- --run portfolio` exits 0.

## Test plan

Covered in Step 3 (new cases in `map-portfolio.test.ts` and `portfolio.test.ts`, using `createMemoryEarningsStore` from `apps/api/src/earnings/earnings-store.ts`).

## Done criteria

ALL must hold:

- [ ] `npm run typecheck:api` exits 0
- [ ] `npm run test:api` exits 0
- [ ] `map-portfolio.ts` no longer contains `totalEarningsUsd: 0` (grep returns no match in that file)
- [ ] `routes/portfolio.ts` passes `lifetimeEarnings` into `buildPortfolioSummary`
- [ ] New/extended tests assert non-zero lifetime earnings from a seeded paid entry and that pending entries are excluded
- [ ] No files outside the Scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `earningsEntries.amountUsd` is not a bigint/numeric column and the
  `sql`-based sum select fails to typecheck (use `listEntriesByUserId` +
  JS reduce instead — but keep `sumPaidUsd` on the interface so the seam is
  identical).
- The `createPortfolioRoutes` wiring site differs materially from the excerpt.
- `portfolio.test.ts` already constructs deps with an earnings store — then
  only extend assertions, don't duplicate the injection.

## Maintenance notes

- Keep `sumPaidUsd` in sync with mock arithmetic (`/src/lib/mock/seed/index.ts:41`):
  both must sum only `status === "paid"` entries in `amountUsd` cents.
- If earnings are ever paginated, `sumPaidUsd` must remain a DB aggregate, not
  a client-side sum over a page.