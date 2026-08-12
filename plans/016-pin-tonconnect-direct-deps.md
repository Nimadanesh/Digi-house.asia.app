# Plan 016: Declare `@tonconnect/ui` and `@tonconnect/sdk` as direct dependencies

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
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (run before 017/018 so the audit baseline is stable)
- **Category**: deps
- **Planned at**: commit `4c887c9`, 2026-08-12

## Why this matters

`src/lib/ton/sendTx.ts` and `src/lib/ton/__tests__/sendTx.test.ts` import
types from `@tonconnect/ui` and `@tonconnect/sdk`, but neither package is a
direct dependency — they only resolve because npm hoists them as transitive
deps of `@tonconnect/ui-react`. A future npm/pnpm resolution change or a
`@tonconnect/ui-react` upgrade that stops hoisting the pair will break a cold
`npm ci` build with a module-not-found error for no code change. Declaring
what the code actually imports at the versions the lockfile already resolves
makes the install deterministic.

## Current state

- `package.json` — no `@tonconnect/ui` or `@tonconnect/sdk`; only
  `"@tonconnect/ui-react": "^3.0.0"` (line 74).
- `src/lib/ton/sendTx.ts:6` — `import type { TonConnectUI } from "@tonconnect/ui";`
- `src/lib/ton/sendTx.ts:12` — `} from "@tonconnect/sdk";`
- `src/lib/ton/__tests__/sendTx.test.ts:3` — `import type { TonConnectUI } from "@tonconnect/ui";`
- Resolved transitive versions (from `npm ls` at the time of this plan):
  `@tonconnect/ui@3.0.0` and `@tonconnect/sdk@4.0.0`, both under
  `@tonconnect/ui-react@3.0.0`.

## Commands you will need

| Purpose   | Command                | Expected on success |
|-----------|------------------------|---------------------|
| Add deps  | `npm install @tonconnect/ui@^3.0.0 @tonconnect/sdk@^4.0.0` | exit 0, lockfile updated |
| Typecheck | `npm run typecheck`    | exit 0              |
| Lint      | `npm run lint`         | exit 0              |
| Frontend tests | `npm test`    | exit 0              |
| Build     | `npm run build`        | exit 0              |

## Scope

**In scope**:
- `package.json`
- `package-lock.json`

**Out of scope** (do NOT touch):
- `src/lib/ton/sendTx.ts`, its test, or any other source — no code change.
- The `TonConnectUIProvider` setup in `src/app/providers.tsx`.
- `ton`/`@ton/ton`/`@ton/crypto` — plan 013.

## Git workflow

- Branch: `advisor/016-pin-tonconnect-direct-deps`
- Single commit: `chore(deps): declare @tonconnect/ui + @tonconnect/sdk as direct deps`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add both packages to root `dependencies`

Run from the repo root:
`npm install @tonconnect/ui@^3.0.0 @tonconnect/sdk@^4.0.0`

If the network is unavailable, fall back to editing `package.json` manually —
add both to `dependencies`, then `npm install` when possible.

**Verify**: `node -e "const p=require('./package.json');['@tonconnect/ui','@tonconnect/sdk'].forEach(k=>{if(!p.dependencies[k])throw new Error(k+' missing')});console.log('declared ok')"` prints `declared ok`.

### Step 2: Verify nothing regressed

**Verify**:
- `npm run typecheck` → exit 0
- `npm run lint` → exit 0
- `npm test` → exit 0
- `npm run build` → exit 0

## Test plan

No new tests — the existing suite (which imports `sendTx.test.ts`, the file
consuming these types) is the regression net.

## Done criteria

ALL must hold:

- [ ] `package.json` `dependencies` lists both `@tonconnect/ui` and `@tonconnect/sdk`
- [ ] `package-lock.json` updated and consistent (`npm ls @tonconnect/ui @tonconnect/sdk` shows no `extraneous`)
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all exit 0
- [ ] No files outside `package.json`/`package-lock.json` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `npm install` resolves the pair to a version that no longer provides the
  `TonConnectUI`/`SendTransactionRequest` names the imports use — then the
  version pin must be discussed, not guessed.
- Another import site for these packages exists beyond `sendTx.ts` and its test.

## Maintenance notes

- Keep `@tonconnect/ui` and `@tonconnect/sdk` version-aligned with
  `@tonconnect/ui-react` (the UI package declares its compatible SDK range);
  when upgrading `ui-react`, re-check these two.
- This removes the "works today, breaks on cold install" failure class from
  the TonConnect boundary.