# Plan 001: Prevent CSV formula injection in portfolio export

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 260ef3c..HEAD -- apps/api/src/routes/portfolio.ts`
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
- **Status**: **DONE** — commit `9286095`, 2026-07-30

## Why this matters

CSV cells starting with `=`, `+`, `-`, or `@` are interpreted as formulas by Excel, Google Sheets, and LibreOffice Calc. A malicious or unexpected value like `=HYPERLINK(...)` or `=CMD(...)` in a property name or ID could execute when the user opens the exported CSV. While the data is user-specific (own portfolio), defense-in-depth means we must sanitize all text fields before writing them to a CSV. Fixing this in the single `csvEscape` function protects every CSV field at once.

## Current state

- `apps/api/src/routes/portfolio.ts` — portfolio JSON route (`GET /v1/portfolio`) and CSV export (`GET /v1/portfolio/export.csv`). The CSV route is at lines 61–116.
- `apps/api/src/routes/portfolio.ts:121-126` — existing `csvEscape` function handles commas, double-quotes, and newlines but NOT formula-injection characters:

```ts
function csvEscape(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
```

A value such as `=SUM(A1:A10)` passes through unquoted and unescaped — Excel/Sheets will execute it.

The repo conventions: TypeScript strict, named exports, no `any`. API code uses Hono. Tests live alongside the route file as `*.test.ts`.

## Commands you will need

| Purpose          | Command                              | Expected on success             |
|------------------|--------------------------------------|---------------------------------|
| API tests        | `npm run test -w @digihouse/api`     | exit 0, all tests pass          |
| Typecheck        | `npm run typecheck -w @digihouse/api`| exit 0, no errors               |
| Lint             | `npm run lint` (from repo root)      | exit 0                          |

## Scope

**In scope** (the only files you should modify):
- `apps/api/src/routes/portfolio.ts` — the `csvEscape` function (and only this function)

**Out of scope** (do NOT touch):
- The JSON `GET /v1/portfolio` route — not CSV output, no formula risk
- Any other file in the codebase
- Adding a dependency (no library needed — the fix is 2–4 lines)

## Git workflow

- Branch: `advisor/001-sec-csv-formula-injection`
- Commit per logical unit; message style: `fix(api): prevent CSV formula injection on export`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Update `csvEscape` to sanitize formula-injection characters

Edit `apps/api/src/routes/portfolio.ts` at the `csvEscape` function (lines 121–126).

Change the function to detect values starting with `=`, `+`, `-`, `@` and escape them by prefixing with a single-quote. The canonical CSV defense is: if the first character is one of those four, emit `"'<value>"`. Because the value is already in a quoted field if it contains commas/quotes/newlines, handle the safe case too.

Replace the body with:

```ts
function csvEscape(v: string): string {
  // Prevent CSV formula injection: fields starting with = + - @ are
  // interpreted as formulas by Excel/Sheets. Prefix with a single-quote
  // to force literal display. Apply before quoting so the quote character
  // is captured inside CSV's own quoting rules.
  if (/^[=+\-@]/.test(v)) {
    v = "'" + v;
  }
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
```

**Do not add any comment** — the code is self-explanatory.

**Verify**: `npm run typecheck -w @digihouse/api` → exit 0, no errors.

### Step 2: Run tests to confirm no regression

`npm run test -w @digihouse/api` → exit 0, all tests pass.

**Verify**: exit 0.

## Test plan

- No new tests needed for this plan — the existing CSV test coverage in `portfolio.test.ts` (the route-level test) already exercises the CSV endpoint through the mock store. The sanitization is applied to every field uniformly, so existing tests implicitly validate the output structure.
- Verification: `npm run test -w @digihouse/api` exit 0.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run typecheck -w @digihouse/api` exits 0
- [ ] `npm run test -w @digihouse/api` exits 0
- [ ] `grep -n "csvEscape" apps/api/src/routes/portfolio.ts` shows the function with `test` for `^[=+\-@]`
- [ ] No files outside the in-scope list are modified (`git status`)

## STOP conditions

Stop and report back (do not improvise) if:

- The code at `apps/api/src/routes/portfolio.ts:121-126` doesn't match the excerpt above (the codebase has drifted).
- A verification command fails twice after a reasonable fix attempt.
- The fix requires touching an out-of-scope file.
- The existing tests do not cover the CSV endpoint (check `apps/api/src/routes/portfolio.test.ts` for a test hitting `/v1/portfolio/export.csv` — if missing, report it as a discovery, not a blocker).

## Maintenance notes

- The `csvEscape` function is the single CSV-sanitization point for this endpoint. If CSV export is added elsewhere, use the same function.
- The injected `'` prefix is invisible in most CSV viewers (it's consumed as a literal-escape, not displayed). In Excel, the cell will display the full value including the leading single-quote if the column is text-formatted; this is standard behavior and acceptable.
