# Plan 013: Remove the dead TON dependencies (`ton`, `@ton/ton`, `@ton/crypto`)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 4c887c9..HEAD -- package.json package-lock.json`
> If these changed since this plan was written, compare the "Current state"
> excerpt against the live `package.json`; on a mismatch, treat it as a STOP
> condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (run before 017 and 018 so the audit baseline is clean)
- **Category**: deps
- **Planned at**: commit `4c887c9`, 2026-08-12

## Why this matters

Three TON packages are declared in the root `dependencies` but imported
nowhere in the repo (verified by repo-wide grep during the audit). Worst of
them is `ton` (^13.9.0): it is the pre-rename name of the same SDK as
`@ton/ton`, and its transitive dependency tree (which includes an old
`axios`) is the sole reason `npm audit` reports a **high** advisory that
touches this repo's install. Removing them:

- shrinks the lockfile and every `npm ci`,
- clears the `ton` audit high,
- removes the trap where a future dev imports `@ton/ton` thinking it's a
  second library, when the codebase standard is `@ton/core` only.

This is a `package.json`/lockfile-only change; no source is affected.

## Current state

`package.json` dependencies (lines 70-72, 83):

```json
"@ton/core": "^0.63.1",
"@ton/crypto": "^3.3.0",
"@ton/ton": "^16.3.0",
...
"ton": "^13.9.0",
```

Only `@ton/core` is actually imported (`src/lib/ton/nano.ts:3`,
`src/lib/ton/address.ts:3`, `src/lib/ton/sendTx.ts:7`,
`apps/api/src/routes/buys.ts:2`). `ton`, `@ton/ton`, and `@ton/crypto` have
zero import sites (`grep` for `from "@ton/ton"`, `from "@ton/crypto"`,
`from "ton"` returns nothing).

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Remove    | `npm uninstall ton @ton/ton @ton/crypto -w ""` or edit manifest + `npm install` | updates `package.json` + `package-lock.json`, exit 0 |
| Typecheck | `npm run typecheck`        | exit 0              |
| API TS    | `npm run typecheck:api`    | exit 0              |
| Lint      | `npm run lint`             | exit 0              |
| Frontend tests | `npm test`            | exit 0              |
| API tests | `npm run test:api`         | exit 0              |
| Audit     | `npm audit`                | no `ton`-attributable high advisory |

## Scope

**In scope**:
- `package.json`
- `package-lock.json`

**Out of scope** (do NOT touch):
- `@ton/core` — this is the one that is used; leave it.
- `src/**`, `apps/api/**`, `apps/**`, `packages/**` code.
- `@tonconnect/*` — that's plan 016's concern.
- Node engine/`engines` fields — plan 020 (dependency housekeeping follow-up), not here.

## Git workflow

- Branch: `advisor/013-remove-dead-ton-deps`
- Single commit: `chore(deps): remove unused ton/@ton/ton/@ton/crypto`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Remove the three packages

Run `npm uninstall ton @ton/ton @ton/crypto` from the repo root. If npm warns
about the `-w` flag semantics, run `npm uninstall ton @ton/ton @ton/crypto`
directly and confirm by inspecting `package.json` after — all three entries
must be gone from `dependencies`.

**Verify**: `node -e "const p=require('./package.json');['ton','@ton/ton','@ton/crypto'].forEach(k=>{if(k in p.dependencies)throw new Error(k+' still present')});console.log('removed ok')"` prints `removed ok`.

### Step 2: Confirm nothing else broke

**Verify**:
- `npm run lint` → exit 0
- `npm run typecheck` → exit 0
- `npm run typecheck:api` → exit 0
- `npm test` → exit 0
- `npm run test:api` → exit 0
- `grep -r "from \"ton\"" src apps packages e2e || echo "no ton imports"` → prints `no ton imports`

## Test plan

No new tests. The existing suites (frontend + API) are the regression net —
they must all pass with the packages gone.

## Done criteria

ALL must hold:

- [ ] `package.json` no longer lists `ton`, `@ton/ton`, or `@ton/crypto`
- [ ] `package-lock.json` updated (no refs to the three packages in the top-level deps)
- [ ] `npm run check` exits 0
- [ ] `npm test` and `npm run test:api` exit 0
- [ ] `npm audit` no longer reports a `ton`-attributable high advisory
- [ ] No files outside `package.json`/`package-lock.json` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any `npm run test*` or `npm run typecheck*` fails after removal — that
  would mean an import site exists that the audit grep missed; report it
  instead of re-adding the dep blindly.
- Another package at root (`packages/*` or `apps/*` package.json) imports one
  of the three — report it for a decision rather than removing across workspaces.

## Maintenance notes

- If real on-chain minting lands (Direction DIR-1), `@ton/ton`/`@ton/crypto`
  will be re-introduced deliberately with an ADR decision log entry — add it
  to the Decisions log in `docs/research/TECH_STACK.md` at that time.
- `@ton/core` remains the canonical import for Cell/address work.