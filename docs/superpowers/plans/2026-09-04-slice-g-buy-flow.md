# Slice G Buy Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Estate → qty → summary → confirm → success buy flow fully explicit, honest, localized, and tested, without changing any business, settlement, or engine logic.

**Architecture:** Presentational/UI-layer only. A tiny pure helper (`previewBuyQuote`) becomes the single total computation shared by the sheet and the MainButton label; all copy moves to `property.*` i18n keys (en + 11 EN-mirrored locales); edge states get unit tests driving captured MainButton/BackButton handlers; Playwright covers the browser-reachable path (qty/terms/secondary/cancel/RTL).

**Tech Stack:** Next.js 16 + React 19 + TypeScript strict, Tailwind v4, next-intl (12 locales), TanStack Query, Vitest + Testing Library, Playwright (480×840), existing `Sheet`/`Disclosure`/`Block`/`Row` primitives only.

**Spec:** Slice G brief in the task thread (14 sections + Definition of Done). Prior audit: `BuySheet` qty/summary/success + `LimitBuySheet` + `IncomeCalculator` + `useBuyShares` + mock/API settlement mapped 2026-09-04; purchase engines, fee tiers, and the no-plan-presets state are correct and untouched.

## Global Constraints

- TypeScript strict, no `any`; money is integer minor units (cents), TON is nanoTON; format only via `src/lib/format.ts`.
- NEVER modify payment/settlement/TON logic (`useBuyShares`, `mock/transaction`, `apps/api`, engines, fee tiers, yield math).
- No new dependencies. No secrets. No fabricated data, scarcity, or returns; UNKNOWN stays UNKNOWN; projected stays projected.
- Reuse existing primitives/components/copy keys; match established code style (2-space, Tailwind only, `data-testid` on new interactive elements).
- MainButton owns primary-sheet actions by design — no in-sheet CTAs added.
- `npm run check` (lint + typecheck + build) green before done; full unit suite green.

---

### Task 1: i18n keys (en + 11 locales)

**Files:**
- Modify: `messages/en.json` (property section, after `buyOwnerStayPending`)
- Modify: `messages/{ar,de,es,fa,fr,hi,id,pt,ru,tr,zh}.json` (same location, EN-mirrored values, translators follow-up)

**Interfaces:** Produces `property.*` keys consumed by Tasks 2–5.

New keys (exact en values; `{tokens}` verbatim):

```json
"buySummaryTitle": "Order summary",
"buySummaryProperty": "Property",
"buySummaryLocation": "Location",
"buySummaryQuantity": "Quantity",
"buySummaryPayWith": "Pay with",
"buySummaryFees": "Fees",
"buyOwnership": "Ownership",
"buySummaryCommissionNote": "Total includes the primary-market commission. No other fees.",
"buySummaryConfirmingWallet": "Confirming in your wallet…",
"buySummaryConfirmingChain": "Confirming on blockchain…",
"buyAssumptionsTitle": "Assumptions",
"buyAssumptionRate": "Projection assumes a {rate}% monthly rental rate.",
"confirmPayTotal": "Confirm & Pay — {total}",
"confirmingPending": "Confirming…",
"buySuccessTitle": "Congratulations!",
"buySuccessMessage": "You now own {qty} {unit} of {title}",
"buySuccessNextPayout": "Next payout {date}",
"buySuccessLockNudge": "Lock your new shares in the Yield section to start earning.",
"buySuccessViewPortfolio": "View Portfolio",
"buySuccessShare": "Share",
"buySuccessEverySunday": "Every Sunday"
```

Reused (no new keys): `pricePerShareLabel`, `totalLabel`, `estWeeklyYield`, `buyOwnerStay`, `buyOwnerStayPending`, `buyShareOfEstate`, `buyFirstNote`, `onLockedSharesNote`, `invPlansNote`, `shareWord`, `sharesWord`.

- [ ] **Step 1: Add the 21 keys to `messages/en.json`**
- [ ] **Step 2: Mirror EN values into the other 11 locales at the same location**
- [ ] **Step 3: Validate JSON parses (python json.load over messages/*.json)**
- [ ] **Step 4: Run buy unit tests — existing English assertions must still pass unchanged**

### Task 2: BuySummaryStep — i18n + ownership/location/assumptions + shared totals

**Files:**
- Modify: `src/components/property/buy/BuySummaryStep.tsx`
- Test: `src/components/property/buy/BuyFlow.test.tsx` (extend)

**Interfaces:**
- Consumes: `previewBuyQuote` from Task 6, `useFees`, keys from Task 1.

Exact changes (labels/styles/layout untouched otherwise):
- Replace hardcoded labels with `t("buySummaryTitle|buySummaryProperty|buySummaryQuantity|buySummaryPayWith|buySummaryFees")`; `pricePerShareLabel`, `totalLabel`, `estWeeklyYield`, `buyOwnerStay*` reused as-is.
- After the Property row add Location row: label `t("buySummaryLocation")`, value `listing.location` (same truncate classes as title).
- After the Quantity row add Ownership row: label `t("buyOwnership")`, value `t("buyShareOfEstate", { qty, pct: sharePct })` with `sharePct = pct(qty / listing.totalShares)` (`pct` from `@/lib/format`; `qty/totalShares`, guard `totalShares > 0` else render `t("buyOwnerStayPending")`? No — totalShares is always ≥1 in practice; still guard: if `listing.totalShares <= 0`, show pending label. Keep the guard one line.)
- Replace footnote with `t("buySummaryCommissionNote")`; pending copy with the two confirming keys; keep `buy-summary-error` behavior identical.
- Replace the 3-line total math with `previewBuyQuote(qty, unitPrice, fees.data ?? [])` (identical outputs; existing `$1,281.25` tests prove it).
- Append Assumptions `Disclosure` (controlled `useState(false)`, `toggleTestId="buy-assumptions-toggle"`, `contentTestId="buy-assumptions-content"`, title `t("buyAssumptionsTitle")`): rows `t("buyAssumptionRate", { rate: listing.monthlyYieldRate })`, `t("buyFirstNote")`, `t("onLockedSharesNote")`, `t("invPlansNote")` — text-xs muted, no new math, no invented inputs.

- [ ] **Step 1: Write failing tests** — summary shows Location row; Ownership row `N shares · P% of the estate`; assumptions toggle reveals rate/lock/weekly-rule/no-plan lines; all summary labels resolve (no raw keys: assert `screen.queryByText("buySummaryTitle")` null).
- [ ] **Step 2: Run — FAIL (keys missing in component, no Disclosure yet)**
- [ ] **Step 3: Implement minimal changes above**
- [ ] **Step 4: Run — PASS, existing `$1,281.25` fee/total tests unchanged**
- [ ] **Step 5: Commit** — NO (repo rule: never commit unless asked; skip all commit steps in this plan)

### Task 3: BuyQtyStep lock-to-earn footnote (reuse)

**Files:**
- Modify: `src/components/property/buy/BuyQtyStep.tsx`
- Test: `src/components/property/buy/BuyFlow.test.tsx` (extend)

- [ ] **Step 1: Failing test** — qty step shows `buyFirstNote` text (`Buy shares first, then lock them…`, testid `buy-lock-note`).
- [ ] **Step 2: Run — FAIL**
- [ ] **Step 3: Add muted footnote after the paid-in note reusing `t("buyFirstNote")`** (same `text-[0.6875rem] text-muted-foreground` style family)
- [ ] **Step 4: Run — PASS**

### Task 4: BuySuccessStep i18n (no visual change)

**Files:**
- Modify: `src/components/property/buy/BuySuccessStep.tsx`
- Test: extend `BuyFlow.test.tsx` success test (assert no raw keys; keep existing English assertions byte-identical).

Replace: title → `buySuccessTitle`; message → `buySuccessMessage` with `{qty, unit: t(qty===1?"shareWord":"sharesWord"), title: propertyTitle}`; next payout → `buySuccessNextPayout` (`{date: nextPay}` where `nextPay = nowMs != null ? payoutCountdown(nowMs) : t("buySuccessEverySunday")`); lock nudge → `buySuccessLockNudge`; buttons → `buySuccessViewPortfolio` / `buySuccessShare`. Logic, classes, share() behavior untouched.

- [ ] **Step 1: Failing tests** — success copy resolves via catalog (assert rendered text equals en values AND `queryByText("buySuccessTitle")` is null).
- [ ] **Step 2: Run — FAIL**
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run — PASS**

### Task 5: MainButton fee-inclusive confirm total + i18n

**Files:**
- Modify: `src/app/(app)/property/[id]/page.tsx` (summary branch only)
- Test: extend `src/app/(app)/property/[id]/page.test.tsx`

Current: `Confirm & Pay — ${usd(qty*sharePriceUsd)}` (ex-fees, hardcoded). New: `const quote = previewBuyQuote(qty, listing.sharePriceUsd, feesQuery.data ?? [])` where `const feesQuery = useFees()` (mocked in tests as `{data: []}`); label `pending ? t("confirmingPending") : t("confirmPayTotal", { total: usd(quote.totalPayableUsd) })`. Nothing else in the effect changes.

- [ ] **Step 1: Failing test** — with default mocked fees (`[]` → fee 0) label reads `Confirm & Pay — $1,250.00` for qty 10 @ $125 (same as before, now via key); plus a tiered-fees case asserting the label includes the fee (override the `useFees` mock per-test to return tier data matching `DEFAULT_FEE_TIERS` shape? Simpler: assert `previewBuyQuote` math at unit level in Task 6 and assert the label calls it with `{total: usd(quote)}` — do BOTH: label test with `[]` fees + helper tests with tiers).
- [ ] **Step 2: Run — FAIL**
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run — PASS**

### Task 6: Shared `previewBuyQuote` helper + tests

**Files:**
- Create: `src/lib/buy-quote.ts`
- Test: `src/lib/buy-quote.test.ts` (new)

```typescript
import { previewFeeUsd, type FeeTier } from "@/types/fees";

export interface BuyQuote { totalUsd: number; feesUsd: number; totalPayableUsd: number; }

/** Single total computation for the primary buy flow (sheet + MainButton label).
 *  Integer cents throughout; unknown fee tier previews $0 (server is authoritative). */
export function previewBuyQuote(qty: number, unitPriceUsd: number, feeTiers: FeeTier[]): BuyQuote {
  const totalUsd = qty * unitPriceUsd;
  const feesUsd = previewFeeUsd(feeTiers, totalUsd, "buy_primary") ?? 0;
  return { totalUsd, feesUsd, totalPayableUsd: totalUsd + feesUsd };
}
```

Tests: 10 × $125 = principal 125000, fee 3125 (2.5% tier — import `DEFAULT_FEE_TIERS` from `@/lib/mock/fees`? Layer check: `src/lib/buy-quote.ts` importing `src/lib/mock/*` in a TEST is fine (test-only import, not production). Production file imports only `@/types/fees` (leaf types). Assert total 125000/3125/128125; empty tiers → fee 0; qty 0 → zeros; matches `BuyFlow` `$1,281.25` case shape.

- [ ] **Step 1: Write `buy-quote.test.ts` — FAIL (module missing)**
- [ ] **Step 2: Run — FAIL with "Failed to resolve import"**
- [ ] **Step 3: Create `buy-quote.ts`**
- [ ] **Step 4: Run — PASS**
- [ ] **Step 5: Rewire page (Task 5) + summary (Task 2) to it; existing value tests prove identical outputs**

### Task 7: Edge-state unit tests

**Files:**
- Extend: `src/app/(app)/property/[id]/page.test.tsx`, `src/hooks/useBuyShares.test.ts`, `src/components/property/buy/BuyFlow.test.tsx`, `src/components/property/LimitBuySheet.test.tsx`
- Infra touch (additive only): convert `useTonConnect` mock to `vi.fn` with connected:true default; export a `UsdtUnavailableError` replica from the `useBuyShares` mock factory; add `pushToast: vi.fn()` to the `useUiStore` mock; capture `backHandler` like `mainHandler`.

Cases (each its own `it`):
- page: invalid qty → Continue `isEnabled:false` (drive via listing with `sharesRemaining: 1`? qty starts 10 → clamped to 1 on open… instead assert `quantityInvalid` appears when clamp can't satisfy? Clamping makes invalid unreachable via UI — test documents this: render `BuyQtyStep` directly with `qty={999}` + real listing (sharesRemaining 360) → `quantityInvalid` "between 1 and 360" visible (BuyFlow.test).
- page: USDT-unavailable → `mutateAsync.mockRejectedValueOnce(new MockUsdtUnavailableError())` → currency resets to TON, `usdtAvailable` false note shown, `buy-summary-error` text shown.
- page: failure `ok:false` → error text + `buy-summary-error`; throw `"wallet rejected the transaction"` → same surface.
- page: disconnected wallet → open sheet → MainButton `setParams` with `Connect wallet`.
- page: BackButton handler on summary step returns to qty step (capture `backHandler`, invoke at summary).
- page: MainButton label on summary equals fee-inclusive total (Task 5, default `[]` fees → $1,250.00).
- hook: USDT + `payment_method_unavailable` ApiError → `UsdtUnavailableError`; other codes rethrow; `!sendResult.ok` → throw wallet-rejected message; phases idle→sending→verifying→idle (mock getRepo/ton per existing test setup in that file — read it first).
- LimitBuySheet: price input `0` → confirm disabled; existing insufficient-funds display kept.

- [ ] Steps per case: failing test → run FAIL → minimal implementation (tests only; no production change expected except Task 5 wiring) → run PASS.

### Task 8: E2E `e2e/tests/buy-flow.spec.ts` (LTR + RTL) + screenshots

**Files:**
- Create: `e2e/tests/buy-flow.spec.ts`
- Screenshots: `screenshots/slice-g/buy-qty.png`, `buy-qty-fa.png`, `limit-buy.png`, `buy-terms.png` (open each in visual QA).

Preconditions: dev server on :3000 (mock data). Seed facts to confirm at runtime (read `src/lib/mock/seed/*` + orderbook seed for a resale property WITH seed asks; Grand 2 BDM funding for primary). Helpers: `skipOnboarding` (copy pattern from `marketplace.spec.ts`); fa locale via localStorage `digihouse-settings` (copy pattern from `estate-rtl.spec.ts`).

Cases:
- LTR primary (Grand 2 BDM): hero CTA opens sheet → qty title/stake/available/total visible → Max sets qty → currency USDT shows `USDT` suffix → Escape closes sheet (cancel path, sheet gone).
- LTR calculator entry: Income tab → `calc-buy` click → sheet opens (pre-seeded).
- LTR secondary (resale property with seed asks): hero/limit sheet opens → price defaults to best ask → set qty 2 → fee + escrow visible → Place buy order → success toast visible.
- RTL fa: sheet opens → Persian title visible → no `data-testid` regressions → no horizontal overflow (`scrollWidth <= clientWidth + 1`) → screenshot.
- No-raw-keys: assert absence of the new key names as literal text on the sheet.
- Screenshots at each stage; open them all in visual QA.

Hard limit (document, do not hack): summary/confirmation/purchase execution is Telegram-MainButton-driven and unreachable in desktop Chromium — covered by page unit tests driving captured handlers instead.

- [ ] Write spec → run → iterate to green (max 3 attempts per case, then isolate per debugging skill).
- [ ] Open every screenshot; fix only real defects.

### Task 9: Gates + report + program log

- [ ] Full unit suite green.
- [ ] `npm run check` exit 0.
- [ ] Visual QA: open all screenshots from Task 8 + re-open prior marketplace/property shots if touched (untouched — skip).
- [ ] Scope audit: `git status` + per-file diff review; every changed line traces to §1–13.
- [ ] Append dated Progress Log entry to `FRACTIONALLUXE-PROGRAM.md` (allowed edit; no restructuring, no commits).
- [ ] Final report: flow implemented, architecture/data flow, reused purchase logic, exact assumptions, unknown/pending behavior, tests, E2E, visual QA, remaining blockers (plan presets, balance pre-check, calculator coefficients, MainButton-driven steps in e2e).

## Self-Review

- Spec coverage: §1 entries (hero/sticky/calculator/MainButton — existing, e2e-proven) ✓ T8; §2 selection (qty/currency/shares/capital/price/ownership/source — existing + ownership row) ✓ T2; §3 summary (name/location/shares/ownership/source/price/fees/total) ✓ T2+T5; projected outcome (weekly projection exists; plan outputs N/A — honest note) ✓ T2; §4 assumptions (rate/lock/weekly-rule/no-plan Disclosure) ✓ T2; §5 plans (zero exist — invPlansNote reused, no invention) ✓ T2; §6 confirmation (complete pre-purchase state) ✓ T2+T5; §7 CTA (existing labels, fee-inclusive total, no scarcity — audited, none found) ✓ T5; §8 reuse (zero engine/settlement changes) ✓ all; §9 integrity (shared helper, no legacy — grep `82_000_000` in touched files) ✓ T6+T9; §10 design system/i18n/RTL ✓ T1–T5+T8; §11 edge states ✓ T7 (+documented no-balance-source limit); §12 property matrix (Grand + Trajan STARTING_FROM + Dolce DYNAMIC/unknown + Pearls high-value + resale secondary) ✓ T7+T8; §13 tests ✓ T6–T8; §14 visual QA ✓ T8–T9.
- No placeholders: all keys/values/selectors/commands specified above.
- Type consistency: `previewBuyQuote(qty: number, unitPriceUsd: number, feeTiers: FeeTier[])` used identically in page + summary; `BuyQuote` fields `{totalUsd, feesUsd, totalPayableUsd}`.
