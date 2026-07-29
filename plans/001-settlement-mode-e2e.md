# Plan 001: Wire SETTLEMENT_MODE end-to-end (P3-10)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f1f5337..HEAD -- src/lib/env.ts src/lib/settlement/ apps/api/src/env.ts apps/api/src/routes/ apps/api/src/app.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security (honesty contract compliance)
- **Planned at**: commit `f1f5337`, 2026-07-29
- **Issue**: —

## Why this matters

ADR-001 §4 requires three hard gates before hiding the "simulated" badge on an
earnings entry:
1. `SETTLEMENT_MODE=onchain`
2. Real `txHash` (does not start with `simulated:`)
3. Explorer URL buildable for the configured network

Today only gates 2 and 3 are implemented (`src/lib/settlement/honesty.ts`).
Gate 1 is missing because `NEXT_PUBLIC_SETTLEMENT_MODE` is not declared in the
Mini App env and `shouldShowSimulatedBadge` doesn't check it. On production
onchain mode, simulated badges would stay on forever — a trust/honesty contract
violation.

The API declares `SETTLEMENT_MODE` as optional (`apps/api/src/env.ts:20`) and
exposes it on `/healthz` (`apps/api/src/app.ts:109-110`) but **no route reads
it to gate behavior**. This plan wires mode from env to API routes to Mini App
badge helpers, closing the P3-10 gap.

## Current state

- `src/lib/env.ts` — Mini App env reader has no `SETTLEMENT_MODE`:
  ```typescript
  // Line 16-33 — no mention of SETTLEMENT_MODE
  export const env = {
    network: readNetwork(),
    dataSource: readString("DATA_SOURCE", "mock") as "mock" | "api",
    // ...no settlementMode
  };
  ```

- `src/lib/settlement/honesty.ts` — `shouldShowSimulatedBadge` checks only
  txHash + status + network, not SETTLEMENT_MODE:
  ```typescript
  // Line 36-45
  export function shouldShowSimulatedBadge(txHash, status, network): boolean {
    if (status !== "paid") return false;
    if (!txHash) return true;
    if (isRealTxHash(txHash) && canShowExplorerLink(txHash, network)) return false;
    return true;  // Returns true even when SETTLEMENT_MODE=onchain
  }
  ```

- `apps/api/src/env.ts` — `SETTLEMENT_MODE` declared optional, never read in routes:
  ```typescript
  // Line 20
  SETTLEMENT_MODE: z.enum(["mock", "hybrid", "onchain"]).optional(),
  ```

- `apps/api/src/routes/buys.ts` — no mode check anywhere; prepare and confirm
  behave identically regardless of `SETTLEMENT_MODE` (always hybrid).

Conventions to match:
- Env vars follow existing pattern in `src/lib/env.ts`: `readString()` helper,
  camelCase export on `env` object.
- Honesty helpers are pure functions with no React — keep them that way.
- API routes use `requireSession` + manual body parsing pattern (or Zod if
  already adopted for this route).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Lint | `npm run lint` | exit 0, no errors |
| Typecheck | `npm run typecheck` | exit 0 |
| Tests | `npx vitest run` | all pass |
| API tests | `npm run test:api` | all pass |
| Build | `npm run build` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `src/lib/env.ts` — add `settlementMode` property (client-side, from `NEXT_PUBLIC_SETTLEMENT_MODE`)
- `src/lib/settlement/honesty.ts` — add `settlementMode` parameter to `shouldShowSimulatedBadge`; update logic per ADR-001 §4
- `src/lib/settlement/__tests__/honesty.test.ts` — add test cases for mode-gated behavior
- `src/components/earnings/EarningsEntryRow.tsx` — pass mode into `shouldShowSimulatedBadge`
- `src/components/earnings/EarningsEntryRow.test.tsx` — update test calls
- `src/app/(app)/earnings/page.test.tsx` — update test mock env if needed
- `apps/api/src/env.ts` — make `SETTLEMENT_MODE` required (default `mock`), not optional
- `apps/api/src/routes/buys.ts` — read mode, block `prepare`/`confirm` when mode is `mock` (force API + DB path only in hybrid/onchain)
- `docs/adr/ADR-001-settlement-modes.md` — add a note confirming implementation matches spec (2–3 line update)

**Out of scope** (do NOT touch, even though they look related):
- `apps/api/src/indexer/` — indexer shouldn't gate on mode; covered by plan 003
- `apps/api/src/payouts/` — payout worker similarly not mode-gated
- `docs/ops/env-matrix.md` — already documents the mode variable
- Creating a new settlement policy module (direction D1 — future refactor)
- `NEXT_PUBLIC_*` in `.env.local.example` — update separately if needed

## Steps

### Step 1: Add `settlementMode` to Mini App env

Edit `src/lib/env.ts`:
- Add `readSettlementMode()` function that reads `NEXT_PUBLIC_SETTLEMENT_MODE`
  with default `"mock"` and validates it's one of `"mock"`, `"hybrid"`, `"onchain"`.
- Add `settlementMode` field to the `env` object.
- Export `SettlementMode` type alongside existing `TonNetwork`.

```typescript
export type SettlementMode = "mock" | "hybrid" | "onchain";

function readSettlementMode(): SettlementMode {
  const v = readString("SETTLEMENT_MODE", "mock");
  if (v === "hybrid") return "hybrid";
  if (v === "onchain") return "onchain";
  return "mock";
}

export const env = {
  // ...existing fields...
  settlementMode: readSettlementMode(),
} as const;
```

**Verify**: `npm run typecheck` → exit 0; `npm run test -- src/lib/env.test.ts` (if exists) or manual check.

### Step 2: Update honesty helpers to accept mode

Edit `src/lib/settlement/honesty.ts`:
- Add `import type { SettlementMode } from "@/lib/env";`
- Change `shouldShowSimulatedBadge` signature to accept `mode: SettlementMode`
  as the last parameter.
- Add gate 1: if `mode !== "onchain"`, return `true` (show badge) early:
  ```typescript
  export function shouldShowSimulatedBadge(
    txHash: string | undefined | null,
    status: string,
    network: TonNetwork,
    mode: SettlementMode,
  ): boolean {
    if (status !== "paid") return false;
    if (mode !== "onchain") return true;   // ADR-001 §4 gate 1
    if (!txHash) return true;
    if (isRealTxHash(txHash) && canShowExplorerLink(txHash, network)) return false;
    return true;
  }
  ```

**Verify**: `npm run typecheck` → exit 0.

### Step 3: Update honesty test file

Edit `src/lib/settlement/__tests__/honesty.test.ts`:
- Add import for `SettlementMode` if needed (the test imports the function directly).
- Update the `shouldShowSimulatedBadge` sub-describe to add mode parameter to
  every call. Add new test cases:

  | Test | Mode | txHash | Status | Expected |
  |------|------|--------|--------|----------|
  | paid with real hash, mode=onchain | onchain | realhash | paid | false (no badge) |
  | paid with real hash, mode=hybrid | hybrid | realhash | paid | true (badge — mode check fails) |
  | paid with real hash, mode=mock | mock | realhash | paid | true (badge — mode check fails) |
  | paid with simulated hash, mode=onchain | onchain | simulated:x | paid | true (still simulated) |
  | paid with undefined hash, mode=onchain | onchain | undefined | paid | true |

```typescript
it("paid with real hash and mode=onchain: no badge", () => {
  expect(shouldShowSimulatedBadge("realhash", "paid", "testnet", "onchain")).toBe(false);
});

it("paid with real hash but mode=hybrid: badge shown", () => {
  expect(shouldShowSimulatedBadge("realhash", "paid", "testnet", "hybrid")).toBe(true);
});

it("paid with real hash but mode=mock: badge shown", () => {
  expect(shouldShowSimulatedBadge("realhash", "paid", "testnet", "mock")).toBe(true);
});
```

**Verify**: `npx vitest run src/lib/settlement/` → 20+ tests pass (existing 17 + new).

### Step 4: Wire mode through EarningsEntryRow

Edit `src/components/earnings/EarningsEntryRow.tsx`:
- The `env` object already imported at top.
- Change the `showSimulated` computation:
  ```typescript
  const showSimulated = shouldShowSimulatedBadge(
    entry.txHash, entry.status, network, env.settlementMode,
  );
  ```

Edit `src/components/earnings/EarningsEntryRow.test.tsx`:
- Update the `vi.mock("../lib/env")` call to include `settlementMode: "mock"` (the
  default for tests).
- All existing tests should still pass because `mode=mock` preserves the existing
  behavior (badge always shown when paid with simulated/undefined hash).

**Verify**: `npx vitest run src/components/earnings/` → all pass.

### Step 5: Update earnings page test

Edit `src/app/(app)/earnings/page.test.tsx`:
- Update the env mock at the top of the file (already mocked `env` with `network: "testnet"`)
  to also include `settlementMode: "mock"`.
- No test logic changes needed — `mode=mock` preserves existing behavior.

**Verify**: `npx vitest run "src/app/(app)/earnings/"` → all pass.

### Step 6: Make SETTLEMENT_MODE required in API env

Edit `apps/api/src/env.ts`:
- Change `SETTLEMENT_MODE` from optional to required with default `"mock"`:
  ```typescript
  SETTLEMENT_MODE: z.enum(["mock", "hybrid", "onchain"]).default("mock"),
  ```
- Add to the transform output if not already present.
- Update all test calls to `testEnv()` to include `SETTLEMENT_MODE: "mock"` (they
  currently pass `undefined` which will break without the default).

**Verify**: `npm run test:api` → all 101 tests pass.

### Step 7: Gate buy endpoints on mode

Edit `apps/api/src/routes/buys.ts`:
- Add a `settlementMode` parameter to `BuyRouteDeps`.
- In `prepare`, reject with 400 when mode is `mock`:
  ```typescript
  // Before intent creation, after rate limit
  if (deps.settlementMode === "mock") {
    return c.json(
      { code: "settlement_mode_blocked", message: "Buys not available in mock mode" },
      400,
    );
  }
  ```
- Same check in `confirm`.

Edit `apps/api/src/app.ts` where `createBuyRoutes` is called:
- Pass `env.SETTLEMENT_MODE ?? "mock"` as the `settlementMode` dep.

**Verify**: `npm run test:api` → existing buy tests still pass (they set `SETTLEMENT_MODE: "mock"` → buys blocked). Wait — need to check: the existing test `"happy path funding property"` calls prepare and expects 200. With `SETTLEMENT_MODE=mock`, prepare returns 400 now. This means the test needs to override `SETTLEMENT_MODE` to `"hybrid"` for buy tests.

Update `apps/api/src/routes/buys.test.ts`:
- In `testEnv()` at line 48, change `SETTLEMENT_MODE: undefined` to `SETTLEMENT_MODE: "mock"`.
- In `makeApp()` at line 105, pass `env: testEnv({ SETTLEMENT_MODE: "hybrid", ...opts })` so
  buy tests run in hybrid mode.
- Add a new test block `"when SETTLEMENT_MODE=mock"`:
  - `prepare returns 400 with code settlement_mode_blocked`
  - `confirm returns 400 with code settlement_mode_blocked`

**Verify**: `npm run test:api` → all tests pass.

### Step 8: Update ADR doc

Edit `docs/adr/ADR-001-settlement-modes.md`:
- Add a one-line note under §4 or §8:
  ```
  Implemented: SETTLEMENT_MODE wired to Mini App env + honesty helpers (P3-10).
  Three-gate check live in shouldShowSimulatedBadge().
  ```

**Verify**: no command needed — mark step.

## Test plan

- **New tests in `honesty.test.ts`**: 5 new `shouldShowSimulatedBadge` cases
  covering mode=mock, mode=hybrid, mode=onchain with real/simulated/undefined hash.
- **New test in `buys.test.ts`**: verify mock mode blocks prepare/confirm.
- **Existing tests must still pass**: all 101 API tests + all Mini App tests.
- Model the new honesty test cases after the existing ones in
  `src/lib/settlement/__tests__/honesty.test.ts`.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run typecheck` → exit 0
- [ ] `npm run lint` → exit 0 (pre-existing warnings OK)
- [ ] `npm run test:api` → 101+ tests pass
- [ ] `npx vitest run src/lib/settlement/` → 22+ tests pass (17 existing + 5 new)
- [ ] `npx vitest run src/components/earnings/` and `"src/app/(app)/earnings/"` → all pass
- [ ] `npm run build` → exit 0
- [ ] `grep -c "settlementMode" src/lib/env.ts` → ≥1 match
- [ ] `grep -c "mode.*onchain" src/lib/settlement/honesty.ts` → ≥1 match (gate 1 check)
- [ ] `grep -c "settlement_mode_blocked" apps/api/src/routes/buys.ts` → ≥1 match (mock block)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts
  (the codebase has drifted since this plan was written).
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.
- You discover that `SETTLEMENT_MODE` in the API is already used in routes
  (drift from the audit; report current usage).
- Existing API buy tests can't be adjusted to pass with `mock` mode blocking
  buys — the test infrascture might need a bigger change.

## Maintenance notes

- When the Mini App adds a `/v1/config` endpoint in the future, prefer reading
  `SETTLEMENT_MODE` from the API response rather than `NEXT_PUBLIC_*` env.
- The three-gate logic in `shouldShowSimulatedBadge` is the source of truth for
  badge visibility. Any future badge rule changes happen here, not in individual
  components.
- If `SETTLEMENT_MODE` gains a fourth value (e.g. `"audit"`), update Zod enums
  in both `env.ts` files and the type export.
