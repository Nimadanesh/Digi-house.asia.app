# Plan 010: Gate the money/auth test suites and API typecheck in CI

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 4c887c9..HEAD -- .github/workflows/ci.yml package.json`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against the live file before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `4c887c9`, 2026-08-12

## Why this matters

CI currently runs only `lint`, `typecheck`, and `build`. Two things regress
silently because of it:

1. The `apps/api` workspace is **excluded** from the root `tsconfig.json`, so
   the root `tsc --noEmit` never compiles it — a type error in the money/payout
   API still turns CI green.
2. The vitest suites — frontend (`npm test`) and API (`npm run test:api`),
   which cover buy settlement, auth/JWT, and payout logic — are never run by
   CI at all.

After this plan, a merged PR has provably type-checked and test-passed the API
and frontend. This is the verification baseline every other plan's "done
criteria" depends on.

## Current state

- `.github/workflows/ci.yml` — the only job (`quality`) runs:
  ```yaml
  - run: npm run lint
  - run: npm run typecheck
  - run: npm run build
  ```
  (steps at `ci.yml:29-36`). No test step, no API typecheck.
- `tsconfig.json` — `"exclude": ["node_modules", "apps", "packages"]`
  (line 44), so `npm run typecheck` (root `tsc --noEmit`, `package.json:44`)
  skips `apps/*` and `packages/*`.
- `package.json` — scripts that exist but are not wired into `check` or CI:
  - `"typecheck:api": "npm run typecheck -w @digihouse/api"` (`package.json:45`)
  - `"typecheck:shared": "npm run typecheck -w @digihouse/shared"` (`:46`)
  - `"test": "vitest run"` (`:48`), `"test:api": "npm run test -w @digihouse/api"` (`:58`)
  - `"check": "npm run lint && npm run typecheck && npm run build"` (`:47`) — testless.
- The API tests use in-memory stores and never require Postgres/Redis
  (verified: `apps/api/src/buys/settle-verified-buy.test.ts` uses
  `createMemory*Store`). They run headless under `npm run test:api`.

## Commands you will need

| Purpose   | Command               | Expected on success |
|-----------|-----------------------|---------------------|
| Lint      | `npm run lint`        | exit 0              |
| Root TS   | `npm run typecheck`   | exit 0, no errors   |
| API TS    | `npm run typecheck:api` | exit 0, no errors |
| Shared TS | `npm run typecheck:shared` | exit 0, no errors |
| Frontend tests | `npm test`      | exit 0              |
| API tests | `npm run test:api`    | exit 0              |
| Build     | `npm run build`       | exit 0              |

## Scope

**In scope** (the only files to modify):
- `.github/workflows/ci.yml`
- `package.json` (only the `check` script; do not touch dependency versions)

**Out of scope** (do NOT touch):
- `apps/api/**`, `packages/**` source — no code changes in this plan.
- `tsconfig.json` — the per-workspace typecheck scripts exist already; wiring
  them is enough. Do NOT delete the `exclude` line.
- `playwright.config.ts` and `e2e/**` — the E2E job is a separate plan (019).

## Git workflow

- Branch: `advisor/010-ci-test-and-typecheck-gate`
- One commit per logical change (CI workflow, then package.json `check`).
- Message style matches `git log` (lowercase imperative, e.g. `ci: run unit + api tests and api typecheck`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the missing quality-gate steps to CI

In `.github/workflows/ci.yml`, inside the existing `quality` job, *after* the
existing `- run: npm run build` step, add:

```yaml
      - name: API Type check
        run: npm run typecheck:api

      - name: Shared Type check
        run: npm run typecheck:shared

      - name: Frontend unit tests
        run: npm test

      - name: API unit tests
        run: npm run test:api
```

**Verify**: `node -e "const fs=require('fs');const c=fs.readFileSync('.github/workflows/ci.yml','utf8');['typecheck:api','typecheck:shared','npm test','npm run test:api'].forEach(k=>{if(!c.includes(k))throw new Error('missing '+k)});console.log('ci.yml has all four steps')"` prints `ci.yml has all four steps`.

### Step 2: Fold API + shared typecheck into `npm run check`

In `package.json:47`, change:

```json
"check": "npm run lint && npm run typecheck && npm run build",
```

to:

```json
"check": "npm run lint && npm run typecheck && npm run typecheck:api && npm run typecheck:shared && npm run build",
```

Do **not** add `npm test` to `check` — tests belong in CI, and a demographic
run of `check` should stay fast.

**Verify**: `npm run check` exits 0 (this compiles lint + typecheck + API + shared + build). It may take a few minutes.

## Test plan

No new test files. This plan's "test" is the CI gate itself:
- Run every command in the Commands table locally once and confirm exit 0.
- Confirm `npm run check` now includes API and shared typecheck (Step 2 verify).

## Done criteria

ALL must hold:

- [ ] `npm run check` exits 0
- [ ] `npm run test` exits 0
- [ ] `npm run test:api` exits 0
- [ ] `npm run typecheck:api` exits 0
- [ ] `.github/workflows/ci.yml` contains all four added steps (Step 1 verify passes)
- [ ] `package.json` `check` script includes `typecheck:api` and `typecheck:shared`
- [ ] No files outside `.github/workflows/ci.yml` and `package.json` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `npm run test` or `npm run test:api` fails — the suites were expected to be
  green locally; a failure here means drift or a genuinely broken test, and it
  must be investigated before this plan can be called done.
- The CI YAML at "Current state" no longer matches this excerpt.
- Adding the steps appears to require a Postgres/Redis dependency you can't
  start (it should not — the suites are in-memory).

## Maintenance notes

- When a new workspace or package is added, the `typecheck:<name>` script and
  the CI step must be added too — the root typecheck will still exclude it.
- `npm audit` (read in check mode) will still flag known advisories; those are
  handled by plans 013, 016, 017, 018.