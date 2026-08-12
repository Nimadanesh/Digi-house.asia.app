# Plan 018: Bump `next` to 16.3.0 (and `eslint-config-next`) to clear framework advisories

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 4c887c9..HEAD -- package.json package-lock.json`
> If these changed, compare the "Current state" excerpt against the live
> `package.json`; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/013 and plans/016 (so the audit delta is provably from Next, not leftovers)
- **Category**: security
- **Planned at**: commit `4c887c9`, 2026-08-12

## Why this matters

`npm audit` reports a cluster of **high**-severity advisories against `next`
(Server Components DoS, Server Actions SSRF, App Router middle‑ware/segment‑prefetch
proxy bypasses, RSC cache‑poisoning) whose remediation is `next@>=16.3.0`. The repo
pins `next: "16.2.1"` (a fixed version, outside the safe range), so the app —
which uses App Router + Server Actions + Server Components per
`docs/research/TECH_STACK.md` — ships on a framework line that is known‑vulnerable
and one patch behind the fix. This plan is a deliberate, verified minor bump:
`16.2.1 → 16.3.0`, plus the matching `eslint-config-next`, with `npm run check`
and the E2E specs (via plan 019's webServer) as the safety net.

> Note on the sibling advisory: `@telegram-apps/sdk-react@3.x` flags a high via
> `valibot` (ReDoS on initData parsing). Its "fix" is a breaking downgrade to
> `@telegram-apps/sdk-react@2.x` — that conflicts with the current 3.x signal‑based
> integration (`TECH_STACK.md:40` already notes the `@tma.js/react` migration path).
> Do NOT run `npm audit fix --force`; that advisory is tracked as a separate decision.

## Current state

- `package.json:77` — `"next": "16.2.1"` (exact pin).
- `package.json:95` — `"eslint-config-next": "16.2.1"`.
- `package.json:79-80` — `"react": "19.2.4"`, `"react-dom": "19.2.4"` (leave as-is).
- AGENTS.md rule: this repo is on a different Next than training data — read
  `node_modules/next/dist/docs/` before changing framework behavior. A patch
  bump is expected to be behavior-preserving; the executor is still required to
  confirm the E2E specs pass.

## Commands you will need

| Purpose   | Command                | Expected on success |
|-----------|------------------------|---------------------|
| Bump      | `npm install next@16.3.0 eslint-config-next@16.3.0` | exit 0 |
| Lint      | `npm run lint`         | exit 0 |
| Typecheck | `npm run typecheck`    | exit 0              |
| Build     | `npm run build`        | exit 0              |
| E2E       | `npm run test:e2e`     | exit 0 (after plan 019's webServer lands, or with `npm run dev` running) |

> `test:e2e` needs a dev server on `:3000`; if not present, that check is
> deferred to plan 019 and you may note it in the commit message.

## Scope

**In scope**:
- `package.json` (only the two `next` pins)
- `package-lock.json`

**Out of scope** (do NOT touch):
- React/React-DOM versions (`19.2.4`).
- `@telegram-apps/sdk-react` — deliberately not downgraded (see Why).
- `next.config.ts`, `src/**`, `apps/**`, `e2e/**` — unless 16.3.0 emits a
  build error that names a config option; then report, don't silently change config.
- `@tonconnect/*`.

## Git workflow

- Branch: `advisor/018-next-bump`
- Single commit: `chore(deps): bump next + eslint-config-next to 16.3.0`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Bump both pinned packages

Run from the repo root:
`npm install next@16.3.0 eslint-config-next@16.3.0`

**Verify**: `node -e "const p=require('./package.json');['next','eslint-config-next'].forEach(k=>{if(p.dependencies[k]||p.devDependencies[k]){ } }); console.log('next =', (p.dependencies.next||p.devDependencies.next))"` shows `16.3.0`.

### Step 2: Run the quality gate

**Verify**:
- `npm run lint` → exit 0
- `npm run typecheck` → exit 0
- `npm run build` → exit 0
- `npm test` → exit 0

### Step 3: Confirm the audit delta and E2E

**Verify**:
- `npm audit --json (convert)` → no `next` entry under high/critical.
- `npm run test:e2e` → exit 0 if a dev server is available; otherwise note in the commit that E2E is re-verified by plan 019.

## Test plan

No new tests. Regressions from a framework patch bump are caught by
`npm run build` (compile-time) and `npm run test:e2e` (smoke of the 6 screens).
If any screen behaves differently after the bump, STOP and report — do not
"fix" the app to compensate.

## Done criteria

ALL must hold:

- [ ] `package.json` `next` and `eslint-config-next` are `16.3.0`
- [ ] `npm run check` exits 0
- [ ] `npm test` exits 0
- [ ] `npm audit` no longer lists `next` under high/critical
- [ ] No files outside `package.json`/`package-lock.json` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The build fails with errors that name `next.config.ts` options or App-Router
  behavior that changed meaning — that's framework-breaking change territory
  and needs a human decision.
- E2E screens visibly regress after the bump.
- Any in-scope file content differs from the excerpts above.

## Maintenance notes

- The `@telegram-apps/sdk-react` valibot/ReDoS advisory remains open; re-audit
  on the `@tma.js/react` migration decision instead of force-downgrading.
- After this bump, patch Next within 16.x when advisories publish — do not
  re-hard-pin to an older fixed version.