# Plan 006: Extract shared portfolio data-fetch helper to eliminate CSV math duplication

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 260ef3c..HEAD -- apps/api/src/routes/portfolio.ts apps/api/src`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `260ef3c`, 2026-07-30
- **Issue**: (none)
- **Status**: **DONE** — commit `f0da373`, 2026-07-30

## Why this matters

The JSON portfolio endpoint (`GET /v1/portfolio`) and the CSV export endpoint (`GET /v1/portfolio/export.csv`) in `portfolio.ts` each independently fetch holdings, fetch properties by IDs, build a property map, and iterate over rows computing `currentValueUsd`, `pendingWeekEarningsUsd`, and `shareRatio` — using the same `weeklyRentUsd` and `projectedYieldUsd` helpers. The CSV route duplicates ~30 lines of logic from the JSON route. This is a maintenance hazard: any change to the portfolio math or data shape must be made in two places. Extracting a shared data-fetch helper eliminates the duplication and makes future changes safer.

## Current state

- `apps/api/src/routes/portfolio.ts` — both routes in one file (126 lines total). The duplication pattern:

**JSON route (lines 29–58):**
```ts
const userId = c.get("userId");
const rows = await deps.holdings.listByUserId(userId);
const uniqueIds = [...new Set(rows.map((r) => r.propertyId))];
const listings = await deps.properties.getByIds(uniqueIds);
const propertiesById = new Map<string, PropertyMark>();
for (const [id, listing] of listings) {
  propertiesById.set(id, { totalShares: listing.totalShares, sharePriceUsd: listing.sharePriceUsd, annualRentUsd: listing.annualRentUsd });
}
// ... uses buildPortfolioSummary
```

**CSV route (lines 64–108):**
```ts
const userId = c.get("userId");
const rows = await deps.holdings.listByUserId(userId);
const uniqueIds = [...new Set(rows.map((r) => r.propertyId))];
const listings = await deps.properties.getByIds(uniqueIds);
const propertiesById = new Map<string, PropertyMark>();
const nameById = new Map<string, string>();
for (const [id, listing] of listings) {
  propertiesById.set(id, { ... });
  nameById.set(id, listing.title);
}
// ... inline math for currentValueUsd, weekly, pendingWeekEarningsUsd, shareRatio
```

- `apps/api/src/portfolio/math.ts` — shared math helpers (`weeklyRentUsd`, `projectedYieldUsd`) already exist and are used by both `map-portfolio.ts` and the CSV route.
- `apps/api/src/portfolio/map-portfolio.ts` — `buildPortfolioSummary` function that the JSON route calls. It computes `currentValueUsd`, `pendingWeekEarningsUsd`, `shareRatio` for each holding, and aggregates totals.

## Commands you will need

| Purpose          | Command                              | Expected on success             |
|------------------|--------------------------------------|---------------------------------|
| API tests        | `npm run test -w @digihouse/api`     | exit 0, all pass                |
| Typecheck        | `npm run typecheck -w @digihouse/api`| exit 0, no errors               |
| Test filter      | `npm run test -w @digihouse/api -- portfolio` | exit 0, portfolio tests pass |

## Scope

**In scope** (the only files you should modify):
- `apps/api/src/routes/portfolio.ts` — refactor both routes to share data fetching
- `apps/api/src/portfolio/` — if a new shared module is needed (e.g., `fetch-portfolio-data.ts`)

**Out of scope** (do NOT touch):
- The `buildPortfolioSummary` function (already correct)
- Any frontend code
- Tests — existing tests should pass without changes (the public API response shape is identical)

## Git workflow

- Branch: `advisor/006-cor-csv-math-duplication`
- Commit 1: `refactor(api): extract shared portfolio data-fetch helper`
- Commit 2: `refactor(api): use shared helper in CSV export route`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Extract a `FetchPortfolioData` type and helper function

Create a new file `apps/api/src/portfolio/fetch-portfolio-data.ts`. Alternatively, add the helper to the existing `map-portfolio.ts` (since it's closely related). Choose the option that minimizes changes — adding to `map-portfolio.ts` avoids a new file.

If adding to `map-portfolio.ts`, at the end of the file (before any exports if needed), add:

```ts
export type PortfolioHoldingRow = {
  propertyId: string;
  title: string;
  sharesOwned: number;
  avgCostUsd: number;
  totalShares: number;
  sharePriceUsd: number;
  annualRentUsd: number;
  currentValueUsd: number;
  pendingWeekEarningsUsd: number;
  shareRatio: number;
};

export type FetchPortfolioDataDeps = {
  holdings: { listByUserId(userId: string): Promise<Array<{ propertyId: string; sharesOwned: number; avgCostUsd: number }>> };
  properties: { getByIds(ids: string[]): Promise<Map<string, { totalShares: number; sharePriceUsd: number; annualRentUsd: number; title: string }>> };
};

export async function fetchPortfolioData(
  userId: string,
  deps: FetchPortfolioDataDeps,
): Promise<PortfolioHoldingRow[]> {
  const rows = await deps.holdings.listByUserId(userId);
  const uniqueIds = [...new Set(rows.map((r) => r.propertyId))];
  const listings = await deps.properties.getByIds(uniqueIds);

  const out: PortfolioHoldingRow[] = [];
  for (const r of rows) {
    const listing = listings.get(r.propertyId);
    if (!listing) continue;
    const weekly = weeklyRentUsd(listing.annualRentUsd);
    const currentValueUsd = r.sharesOwned * listing.sharePriceUsd;
    const pendingWeekEarningsUsd = projectedYieldUsd(weekly, r.sharesOwned, listing.totalShares);
    const shareRatio = listing.totalShares > 0 ? r.sharesOwned / listing.totalShares : 0;
    out.push({
      propertyId: r.propertyId,
      title: listing.title,
      sharesOwned: r.sharesOwned,
      avgCostUsd: r.avgCostUsd,
      totalShares: listing.totalShares,
      sharePriceUsd: listing.sharePriceUsd,
      annualRentUsd: listing.annualRentUsd,
      currentValueUsd,
      pendingWeekEarningsUsd,
      shareRatio,
    });
  }
  return out;
}
```

**Do not add any comments**.

**Verify**: `npm run typecheck -w @digihouse/api` → exit 0, no errors.

### Step 2: Refactor JSON route to use shared helper

In `apps/api/src/routes/portfolio.ts`, replace lines 29-57 with:

```ts
const userId = c.get("userId");
const held = await fetchPortfolioData(userId, deps);
const openOrderRows = deps.orders ? await deps.orders.listOpenByUserId(userId) : [];
const openOrders = openOrderRows.map(mapOrderRecord);
const summary = buildPortfolioSummary(
  held.map((r) => ({
    propertyId: r.propertyId,
    sharesOwned: r.sharesOwned,
    avgCostUsd: r.avgCostUsd,
  })),
  new Map(held.map((r) => [r.propertyId, { totalShares: r.totalShares, sharePriceUsd: r.sharePriceUsd, annualRentUsd: r.annualRentUsd }])),
  openOrders,
);
```

**Do not add any comments**.

**Verify**: `npm run typecheck -w @digihouse/api` → exit 0, no errors.

### Step 3: Refactor CSV route to use shared helper

In `apps/api/src/routes/portfolio.ts`, replace lines 64-108 with:

```ts
const userId = c.get("userId");
const held = await fetchPortfolioData(userId, deps);
const lines: string[] = [
  "propertyId,propertyName,shares,avgCostUsdCents,currentValueUsdCents,pendingWeekEarningsUsdCents,shareRatio",
];
for (const r of held) {
  lines.push(
    [
      csvEscape(r.propertyId),
      csvEscape(r.title),
      String(r.sharesOwned),
      String(r.avgCostUsd),
      String(r.currentValueUsd),
      String(r.pendingWeekEarningsUsd),
      r.shareRatio.toFixed(6),
    ].join(","),
  );
}
```

**Do not add any comments**.

**Verify**: `npm run typecheck -w @digihouse/api` → exit 0, no errors.

### Step 4: Run tests

`npm run test -w @digihouse/api` → exit 0, all pass. The portfolio tests should specifically pass.

**Verify**: exit 0.

## Test plan

- No new tests needed — the existing portfolio route tests cover both JSON and CSV endpoints through the mock store. The refactoring keeps the same external behavior (same response shapes, same CSV content).
- Verification: `npm run test -w @digihouse/api` exit 0.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run typecheck -w @digihouse/api` exits 0
- [ ] `npm run test -w @digihouse/api` exits 0
- [ ] `grep -c "holdings.listByUserId" apps/api/src/routes/portfolio.ts` is exactly 1 (was 2 before)
- [ ] `grep -c "getByIds" apps/api/src/routes/portfolio.ts` is exactly 1 (was 2 before)
- [ ] The CSV route no longer contains inline `weeklyRentUsd` / `projectedYieldUsd` calls — it delegates to `fetchPortfolioData`
- [ ] No files outside the in-scope list are modified (`git status`)

## STOP conditions

Stop and report back (do not improvise) if:

- The portfolio route file has changed significantly since `260ef3c` and the line numbers/excerpts don't match.
- The `buildPortfolioSummary` function signature has changed.
- A test fails — it might indicate a behavioral difference in how the shared helper computes values. Debug and fix before reporting.
- The fix requires touching an out-of-scope file.

## Maintenance notes

- The shared helper `fetchPortfolioData` now serves as the single source of truth for the holding+property data merge. Any new endpoint that needs portfolio data (e.g., a PDF export) should use this helper.
- The `PortfolioHoldingRow` type in `map-portfolio.ts` also serves as a shared type between the JSON and CSV routes.
