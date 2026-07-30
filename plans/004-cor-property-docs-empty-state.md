# Plan 004: Fix PropertyDocumentsList empty-state dead code

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 260ef3c..HEAD -- src/components/documents/PropertyDocumentsList.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S (1 line removed)
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `260ef3c`, 2026-07-30
- **Issue**: (none)
- **Status**: **DONE** — commit `d2728f0`, 2026-07-30

## Why this matters

The component has an early-return guard at line 34 that returns `null` when `documents.length === 0 && !error`. Lower down at lines 75–79, there is JSX that renders "No documents yet" for the same condition. The early return makes the empty-state UI unreachable dead code. Removing the early return lets the proper empty state show, so users see "No documents yet" instead of a blank section when a property has no documents.

## Current state

- `src/components/documents/PropertyDocumentsList.tsx` — full file (83 lines). The relevant excerpt:

```tsx
export function PropertyDocumentsList({
  documents,
  onDownload,
  downloadingId,
  error,
}: PropertyDocumentsListProps) {
  // Line 34 — early return prevents empty state from ever rendering
  if (documents.length === 0 && !error) {
    return null;
  }

  return (
    <section>
      <h2 className="...">Documents</h2>
      <Block>
        {error && ( ... )}
        {documents.map((doc) => ( ... ))}
        {/* Lines 75-79 — dead code: unreachable when documents is empty */}
        {documents.length === 0 && !error && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No documents yet
          </div>
        )}
      </Block>
    </section>
  );
}
```

The early return at line 34 checks the exact same condition as the intended empty-state at lines 75-79 — they are mutually exclusive due to the return.

## Commands you will need

| Purpose          | Command                              | Expected on success             |
|------------------|--------------------------------------|---------------------------------|
| Typecheck        | `npm run typecheck`                  | exit 0, no errors               |
| Tests (frontend) | `npm run test` (root)                | exit 0, all pass                |
| Lint             | `npm run lint`                       | exit 0                          |

## Scope

**In scope** (the only file you should modify):
- `src/components/documents/PropertyDocumentsList.tsx` — remove line 34–36 (the early return guard)

**Out of scope** (do NOT touch):
- Any test files — removing dead code shouldn't break tests, but fix tests if they relied on `null` return
- Any other component or file

## Git workflow

- Branch: `advisor/004-cor-property-docs-empty-state`
- Commit message: `fix: show "No documents yet" empty state in PropertyDocumentsList`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Remove the early return guard

Edit `src/components/documents/PropertyDocumentsList.tsx` at line 34. Remove these three lines:

```tsx
  if (documents.length === 0 && !error) {
    return null;
  }
```

The component will now fall through to the return statement, which already handles:
- `error && !documents` → shows error message
- `documents.length > 0` → shows document list
- `documents.length === 0 && !error` → shows "No documents yet" from the JSX at lines 75-79 (which is now live code)

**Verify**: `npm run typecheck` → exit 0, no errors.

### Step 2: Run tests

`npm run test` → exit 0, all tests pass. If any test depended on the `null` return (e.g., asserting that the component renders nothing when empty), fix that test to assert the "No documents yet" text instead.

**Verify**: exit 0, all pass.

## Test plan

- Existing tests for `PropertyDocumentsList` (if any) should be checked. If a test asserts `container.innerHTML` is empty when `documents=[]`, update it to assert presence of "No documents yet" text.
- Verification: `npm run test` exit 0.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run typecheck` exits 0
- [ ] `npm run test` exits 0
- [ ] `grep "if (documents.length === 0 && !error)" src/components/documents/PropertyDocumentsList.tsx` returns nothing
- [ ] `grep "No documents yet" src/components/documents/PropertyDocumentsList.tsx` returns the JSX line
- [ ] No files outside the in-scope list are modified (`git status`)

## STOP conditions

Stop and report back (do not improvise) if:

- The file at `src/components/documents/PropertyDocumentsList.tsx` has changed structurally since `260ef3c` and the line numbers/excerpts don't match.
- Removing the early return breaks the error state rendering (when `error` is set but `documents` is empty).
- A verification command fails twice after a reasonable fix attempt.

## Maintenance notes

- This bug was introduced by a refactor that added the early return as a micro-optimization, forgetting the empty-state JSX below. The empty-state JSX is now the sole handler for the zero-documents case.
