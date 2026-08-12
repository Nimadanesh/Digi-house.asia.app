# Plan 019: Make Playwright E2E self-contained and web-first

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 4c887c9..HEAD -- playwright.config.ts e2e`
> If these changed, compare the "Current state" excerpts against the live
> code; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/018 (so E2E runs against the post-bump Next) — soft; can run after 018
- **Category**: tests
- **Planned at**: commit `4c887c9`, 2026-08-12

## Why this matters

The Playwright suite exists but effectively runs nowhere deterministic:

1. `playwright.config.ts` has **no `webServer`** — `npm run test:e2e` requires a
   manually-started `npm run dev` on `:3000`; CI has no e2e job at all.
2. Four specs assert with fixed `waitForTimeout(...)` sleeps instead of
   Playwright's auto-waiting web-first assertions — slow and flaky
   (`retries: 1` in the config masks the flake rather than fixing it).

After this plan, `npm run test:e2e` boots its own dev server, the specs wait on
locator visibility instead of wall-clock sleeps, and CI optionally gains an
e2e job. Deterministic, reproducible smoke coverage of the 6 screens.

## Current state

- `playwright.config.ts` (full file is small) — `defineConfig` with
  `testDir: "./e2e/tests"`, `retries: 1`, `use.baseURL` from
  `process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"`, `project`
  `chromium` with `channel: "chrome"`, and **no `webServer` key**.
- Sleeps to replace:
  - `e2e/tests/portfolio.spec.ts:8,19,33` — `waitForTimeout(2000/3000)`
  - `e2e/tests/marketplace.spec.ts:17` — `waitForTimeout(2000)`
  - `e2e/tests/earnings-honesty.spec.ts:18,27,44` — `waitForTimeout(...)`
- Pattern to follow for web-first assertions: `await expect(page.getByTestId("portfolio-value-card")).toBeVisible();`
  (already used in the spec files for the *final* assertions — the sleeps are the odd ones out).
- The app needs onboarding to complete before Home; the specs already handle
  first-run setup (read `e2e/tests/smoke-shell.spec.ts` to copy the established
  onboarding/seed approach before changing anything).

## Commands you will need

| Purpose   | Command               | Expected on success |
|-----------|-----------------------|---------------------|
| Typecheck | `npm run typecheck`   | exit 0              |
| Lint      | `npm run lint`        | exit 0              |
| E2E       | `npm run test:e2e`    | exit 0 (with webServer, no manual server) |

> E2E needs browsers installed (`npx playwright install chromium` once). It does
> NOT need Postgres/Redis — the app defaults to `NEXT_PUBLIC_DATA_SOURCE=mock`.

## Scope

**In scope**:
- `playwright.config.ts`
- `e2e/tests/portfolio.spec.ts`, `e2e/tests/marketplace.spec.ts`, `e2e/tests/earnings-honesty.spec.ts`
- (any other `e2e/tests/*.spec.ts` that uses `waitForTimeout` — grep before assuming)

**Out of scope** (do NOT touch):
- The app source (`src/**`), API, or onboarding flow logic — specs must adapt to the app, not the reverse.
- `package.json` test scripts (they already exist; `test:e2e` and `test:e2e:ui`).
- `.github/workflows/ci.yml` — adding an e2e CI job is a deliberate follow-up
  (see Maintenance); this plan is config + spec hygiene only.

## Git workflow

- Branch: `advisor/019-e2e-web-first`
- Two commits: (1) `test(e2e): add webServer and replace timeout sleeps with web-first waits`; (2) any spec-level fixes the new strictness exposes.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a `webServer` to the Playwright config

In `playwright.config.ts`, add:

```ts
webServer: {
  command: "npm run dev",
  url: "http://localhost:3000",
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
},
```

Keep the existing `use.baseURL` (it matches). Do not change ports, workers, or
`retries` in this plan.

**Verify**: `npx playwright test --list` prints the spec list with no config error.

### Step 2: Replace `waitForTimeout` sleeps with web-first waits

Grep `e2e/tests/**/*.spec.ts` for `waitForTimeout`. For each occurrence, replace
the pattern `await page.waitForTimeout(N)` (or `page.waitForTimeout`) with an
explicit wait on the element the sleep was papering over. When the sleep guards
a navigation/data load, prefer:

```ts
await expect(page.getByTestId("portfolio-value-card")).toBeVisible();
```

using `expect` from `@playwright/test` (already imported). If a sleep guards
something with no locator yet, add a meaningful `data-testid` assertion on the
nearest stable element — do NOT add arbitrary sleeps.

**Verify**: `grep -rn "waitForTimeout" e2e/tests/` returns no matches.

### Step 3: Run the suite with no manual server

Stop any manually-running dev server, then:

**Verify**: `npm run test:e2e` boots the webServer and all specs pass (exit 0), twice in a row (to catch residual flake).

## Test plan

No new test files. The plan converts existing flaky assertions into reliable
web-first ones. If a spec still flakes under `webServer` (e.g. it depended on
the manual-server warm state), fix the *assertion* per Step 2 guidance — if the
fix requires changing app behavior, STOP and report.

## Done criteria

ALL must hold:

- [ ] `playwright.config.ts` has a `webServer` key with `command: "npm run dev"`
- [ ] `grep -rn "waitForTimeout" e2e/tests/` returns no matches
- [ ] `npm run test:e2e` exits 0 twice without a manually-started server
- [ ] `npm run typecheck` and `npm run lint` exit 0
- [ ] No files outside `playwright.config.ts` and `e2e/**` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- A spec's flake can only be fixed by changing app behavior or test-data seed —
  that's a separate decision, not part of this plan.
- `webServer` with `npm run dev` exceeds the 120s timeout in CI-like conditions
  (report; a `next build && next start` webServer variant may be the answer).
- Any in-scope file content differs from the excerpts above.

## Maintenance notes

- The natural follow-up (explicitly deferred): add an `e2e` job to CI that
  installs Chromium and runs `npm run test:e2e` with `CI=true`, after plan 010
  has proven the rest of the gate is green.
- When adding new specs, follow the web-first convention here; the
  `retries: 1` in the config is a safety net, not a substitute for good waits.