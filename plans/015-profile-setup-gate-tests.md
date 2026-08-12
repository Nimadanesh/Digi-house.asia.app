# Plan 015: Add tests for the profile-setup gate and form (onboarding → profile-setup → home)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 4c887c9..HEAD -- src/components/profile src/components/onboarding src/app/"(app)"/profile-setup src/hooks/useUpdateProfile.ts src/hooks/useRecoveryCode.ts`
> If any of these changed since this plan was written, compare the "Current
> state" excerpts against the live code; on a mismatch, treat it as a STOP
> condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `4c887c9`, 2026-08-12

## Why this matters

The first-run flow that every new user walks — `/onboarding` → `/profile-setup`
→ `/home` — is driven by two route gates (`OnboardingGate`, `ProfileGate`) and
a form (`ProfileSetupForm`) backed by `useUpdateProfile`. The onboarding leg
has tests (`OnboardingGate.test.tsx`, `onboarding/page.test.tsx`), but the
**profile leg has zero**: no test mentions `ProfileSetupForm`, `ProfileGate`,
`useUpdateProfile`, or `/profile-setup`. The state transition this flow
depends on — "profile not completed → form blocks the app tabs; complete →
straight to Home" — is protected by nothing. A regression here silently locks
new users out of the app or lets incomplete profiles into the tabs.

After this plan, the gate redirect logic, the form's validation/save wiring,
and the "profile completed → home" transition are pinned by unit tests.

## Current state

- `src/components/profile/ProfileGate.tsx` — the whole file (~67 lines). Key
  logic: `needsProfile = authReady && user != null && user.onboarded === true && user.profileCompleted === false;`
  then in a `useEffect`: if `needsProfile` and `!ALLOWED.has(pathname)` →
  `router.replace(ROUTES.profileSetup)`; if `user?.profileCompleted === true && user?.onboarded === true` and
  on `/profile-setup` → `router.replace(ROUTES.home)`.
- `src/components/profile/ProfileSetupForm.tsx` — controlled inputs
  `displayName` and `phone`, a `savedCode` checkbox, and `onSubmit` which
  validates via `normalizeDisplayNameInput`/`normalizePhoneInput`
  (`src/lib/profile.ts`), requires `savedCode`, then
  `await updateProfile({ displayName, phone, completeProfile: true })` and
  `router.replace(ROUTES.home)`.
- `src/hooks/useUpdateProfile.ts` — `updateProfile` returns a Promise; in
  `mock` data-source mode it mutates the zustand auth store
  (`setUser({ ...cur, profileCompleted: true })`); on error it sets `error`
  and throws.
- Test style to copy: `src/components/onboarding/OnboardingGate.test.tsx`
  (module-level `vi.mock` of `next/navigation`, `@/stores/settings.store`,
  `@/stores/ui.store`; mutable `pathname`/`onboarded` variables; `waitFor` +
  `expect(replace).toHaveBeenCalledWith(...)`). The global setup
  (`src/test-setup.ts`) already mocks `next-intl` translations against the
  English catalog and `@telegram-apps/sdk-react`, so components resolve their
  `t("...")` calls without extra wiring.

## Commands you will need

| Purpose   | Command               | Expected on success |
|-----------|-----------------------|---------------------|
| Typecheck | `npm run typecheck`   | exit 0, no errors   |
| Tests     | `npm test -- src/components/profile src/app/“(app)”/profile-setup` (quote the path) | new test files pass |
| Lint      | `npm run lint`        | exit 0              |

## Scope

**In scope** (create):
- `src/components/profile/ProfileGate.test.tsx`
- `src/components/profile/ProfileSetupForm.test.tsx`
- `src/hooks/useUpdateProfile.test.ts`

**In scope** (only if a test uncovers a real bug you are confident about — otherwise do NOT change):
- none expected; this plan is tests-only.

**Out of scope** (do NOT touch):
- `src/components/onboarding/**` and `src/app/(app)/onboarding/**` — already covered.
- `src/lib/profile.ts`, `src/hooks/useUpdateProfile.ts`, `ProfileGate.tsx`,
  `ProfileSetupForm.tsx` — production code (unless a bug is confirmed; then STOP and report instead of fixing).
- `apps/api/**`.

## Git workflow

- Branch: `advisor/015-profile-setup-gate-tests`
- One commit: `test: cover profile-setup gate + form + useUpdateProfile`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Test `ProfileGate`

Create `src/components/profile/ProfileGate.test.tsx`, modeled on
`src/components/onboarding/OnboardingGate.test.tsx`:

- Mock `next/navigation` (`usePathname`, `useRouter` with a captured `replace`).
- Mock `@/stores/auth.store` so the test can control `user` (mutable variable).
- Mock `@/hooks/useApiAuth` to return `{ status: "authenticated" }` (or control
  via a mutable variable), and mock `@/lib/env` to `{ dataSource: "mock" }`.
- Import the real `ProfileGate` component and render it inside a wrapper we
  can path-shift.

Assert cases:
1. `user = { onboarded: true, profileCompleted: false }`, `pathname = "/home"` → `replace` called with `/profile-setup`.
2. Same user but `pathname = "/profile-setup"` → children render, `replace` NOT called.
3. `user = { onboarded: true, profileCompleted: true }`, `pathname = "/home"` → children render, no redirect.
4. `user = { onboarded: true, profileCompleted: true }`, `pathname = "/profile-setup"` → `replace` called with `/home`.
5. `user = { onboarded: false, profileCompleted: false }`, `pathname = "/home"` → no redirect (onboarding not done yet — OnboardingGate owns that).

**Verify**: `npm test -- src/components/profile/ProfileGate.test.tsx` passes all cases.

### Step 2: Test `ProfileSetupForm`

Create `src/components/profile/ProfileSetupForm.test.tsx`. Mock or provide:
- real `useAuthStore` (zustand — set initial user via `useAuthStore.setState`)
  or mock it per Gate pattern;
- mock `@/hooks/useUpdateProfile` to return a controllable `updateProfile`
  stub, or let it run against the real zustand store (works: in-memory user);
- mock `@/hooks/useRecoveryCode` → `{ code: "DH-TEST-SEED", loading: false, error: null, refresh: vi.fn() }` (mirror `SettingsSheet.test.tsx:40-47`);
- mock `@/hooks/useRequestTelegramContact` → `{ available: false, requesting: false, requestPhone: vi.fn() }`;
- mock `@/hooks/useTelegramUser` → `{ firstName: "Demo", photoUrl: undefined, isDemo: true }`;
- capture `router.replace`.

Assert:
1. Name prefilled from the session user's `displayName`.
2. Empty name submit shows the validation error (`data-testid="profile-error"`) and does NOT call `updateProfile`.
3. Valid name + unchecked `savedCode` shows the save-code error.
4. Valid name + checked `savedCode` → `updateProfile` called with `{ completeProfile: true }` and `replace` called with `/home`.
5. Recovery code is visible (mocked `DH-TEST-SEED`); the code field is masked by default (`••••••••`) and the eye toggle reveals it (follow the toggle semantics in `ProfileSetupForm.tsx`).

**Verify**: `npm test -- src/components/profile/ProfileSetupForm.test.tsx` passes.

### Step 3: Test `useUpdateProfile`

Create `src/hooks/useUpdateProfile.test.ts`. Use `renderHook` (from
`@testing-library/react`) with `useAuthStore.setState({ user: { onboarded: false, profileCompleted: false, ... } })` seeded, mock `@/lib/env` to `{ dataSource: "mock" }` and `@/hooks/useApiAuth` to a stub `{ establishSession: vi.fn() }`.

Assert:
1. `updateProfile({ displayName: "New Name", completeProfile: true })` returns the updated user and the zustand store user now has `profileCompleted === true` and the new display name.
2. `updateProfile` with no session user rejects and sets `pending === false`.

**Verify**: `npm test -- src/hooks/useUpdateProfile.test.ts` passes.

### Step 4: Full gate

**Verify**: `npm run typecheck` → exit 0; `npm run lint` → exit 0; `npm test` → all pass (existing + new).

## Test plan

All tests are written in Steps 1-3. Follow the mocking style of
`src/components/onboarding/OnboardingGate.test.tsx` and
`src/components/settings/SettingsSheet.test.tsx`.

## Done criteria

ALL must hold:

- [ ] `src/components/profile/ProfileGate.test.tsx` exists with the 5 cases above passing
- [ ] `src/components/profile/ProfileSetupForm.test.tsx` exists with the 5 cases above passing
- [ ] `src/hooks/useUpdateProfile.test.ts` exists with both cases passing
- [ ] `npm run typecheck`, `npm run lint`, `npm test` all exit 0
- [ ] No production source files modified (`git status` — only new test files + lockfile/none)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- A test you write reveals a genuine bug in `ProfileGate`/`ProfileSetupForm`/`useUpdateProfile`
  (behavior contradicts the "Current state" / this plan's expectations). Do NOT fix the production
  code — report the bug; the plan can be amended after a decision.
- The mocked hooks (`useRequestTelegramContact`, `useRecoveryCode`) are missing exports the component
  requires beyond what "Current state" shows — report and adjust mocks, don't change the component.
- Any in-scope production file content differs from the excerpts above.

## Maintenance notes

- When onboarding/profile behavior changes (e.g. new validation rules in
  `src/lib/profile.ts`), these tests are the net for the first-run flow —
  update the form test's validation cases in lock-step.
- The gate tests encode the ordering rule (onboarded BEFORE profileCompleted);
  any re-ordering of the gates must update cases 1 and 5 here too.