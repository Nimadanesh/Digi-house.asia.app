# Plan 005: Fix false "Copied!" feedback when clipboard write fails

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 260ef3c..HEAD -- src/components/settings/SettingsSheet.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S (1 line moved)
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `260ef3c`, 2026-07-30
- **Issue**: (none)
- **Status**: **DONE** — commit `ab27767`, 2026-07-30

## Why this matters

The "Invite friends" button in Settings shows "Copied!" after clicking, regardless of whether `navigator.clipboard.writeText` succeeded. In privacy-restricted contexts (HTTP, certain browsers, or when the clipboard API is blocked), `writeText` throws — but the `setCopied(true)` call sits outside the try block, so the user sees a "Copied!" success state for an action that silently failed. This is misleading and erodes trust.

## Current state

- `src/components/settings/SettingsSheet.tsx` — the `onInviteFriends` function at lines 103-114:

```tsx
async function onInviteFriends() {
    haptics.selection();
    if (!env.botUsername || !user) return;
    const link = `https://t.me/${env.botUsername}?startapp=ref_${user.id}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // fallback for privacy-restricted contexts — silently ignore
    }
    setCopied(true);          // <-- BUG: runs even when writeText threw
    setTimeout(() => setCopied(false), 2000);
  }
```

The `setCopied(true)` at line 112 is outside the try block, so it always executes. The fix is to move it inside `try`.

## Commands you will need

| Purpose          | Command                              | Expected on success             |
|------------------|--------------------------------------|---------------------------------|
| Typecheck        | `npm run typecheck`                  | exit 0, no errors               |
| Tests            | `npm run test` (root)                | exit 0, all pass                |
| Lint             | `npm run lint`                       | exit 0                          |

## Scope

**In scope** (the only file you should modify):
- `src/components/settings/SettingsSheet.tsx` — move `setCopied(true)` inside the try block

**Out of scope** (do NOT touch):
- Extracting a shared `useCopyToClipboard` hook — that would be a larger refactor outside this bugfix
- Any other file

## Git workflow

- Branch: `advisor/005-cor-copy-clipboard-false-positive`
- Commit message: `fix: only show "Copied!" when clipboard write succeeds`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Move `setCopied(true)` inside the try block

Edit `src/components/settings/SettingsSheet.tsx`. In the `onInviteFriends` function, move `setCopied(true)` from line 112 to immediately after `await navigator.clipboard.writeText(link)` (inside try, before the catch):

```tsx
async function onInviteFriends() {
    haptics.selection();
    if (!env.botUsername || !user) return;
    const link = `https://t.me/${env.botUsername}?startapp=ref_${user.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for privacy-restricted contexts — silently ignore
    }
  }
```

**Do not add any comments**.

**Verify**: `npm run typecheck` → exit 0, no errors.

### Step 2: Run tests

`npm run test` → exit 0.

**Verify**: exit 0.

## Test plan

- No new tests — the existing SettingsSheet tests (if any) should still pass.
- The fix is too simple to warrant a dedicated test (moving one line inside a try block), but if a test exists that simulates clipboard failure and asserts "Copied!" is NOT shown, it would now pass correctly.
- Verification: `npm run test` exit 0.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run typecheck` exits 0
- [ ] `npm run test` exits 0
- [ ] `grep -A 10 "async function onInviteFriends" src/components/settings/SettingsSheet.tsx` shows `setCopied(true)` inside the try block (before catch)
- [ ] No files outside the in-scope list are modified (`git status`)

## STOP conditions

Stop and report back (do not improvise) if:

- The `onInviteFriends` function has been refactored or renamed since `260ef3c`.
- A verification command fails twice after a reasonable fix attempt.

## Maintenance notes

- The broader `SettingsSheet.tsx` file (288 lines) is approaching the 350-line soft limit but is not actionable here.
- If clipboard access becomes a more common pattern, consider extracting a shared `useCopyToClipboard` hook with proper error handling + haptic feedback.
