# Sprint D — Testing + Robustness (judge-safety) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the judge-safety gap: the 44 existing tests are pure-logic only — no UI/honesty render tests exist, and `vitest.config.ts` actively excludes React component tests (`include: ["src/**/*.test.ts"]` misses `.test.tsx`). Sprint D installs the missing test infra, adds RTL render tests covering the MVP honesty contract (Paid pill + simulated badge, Pending-vs-Paid disclosure text, PAYOUT_DISCLAIMER dual-screen, Portfolio paid-green / pending-neutral coloring, PnL up/down tint) and key component behaviors (OrderBook 3 columns + best-row `bg-accent`, FundingBar `scaleX` transform, EmptyState 120px glyph, Toggle `role=switch`), then adds page integration tests for the Sprint C screens (Earnings / Portfolio / Settings) with mocked hooks, and ships a written visual-QA + real-Telegram-polish checklist.

**Architecture:** Task 1 is infra (vitest config `.test.tsx` glob + jest-dom setup file) — a prerequisite for all other tasks and TDD-light (a sanity test exercises the harness). Tasks 2–4 are pure-test additions (no production-code changes except optional small real-TG polish in Task 5), each shipping a `.test.tsx` file under `src/**/*.test.tsx`. The component tests (Tasks 2–3) target **presentational** components with props in / DOM out — no hook mocks required. The page integration tests (Task 4) mock the sanctioned hooks (`useEarnings`, `useMarketplace`, `usePortfolio`, `useTonConnect`) via `vi.mock` so the pages render in jsdom without TanStack Query providers or Telegram/TonConnect contexts. Task 5 is a markdown checklist doc (visual QA per viewport + real-Telegram smoke) plus one small concrete real-TG polish: explicitly set `MainButton` `color`/`textColor` to the brand tokens so the Buy confirm button renders Telegram blue inside real Telegram (currently only `text`/`isEnabled` are set, leaving TG's default).

**Tech Stack:** Vitest 4 (`globals: false` → tests import `describe/it/expect` explicitly), `@testing-library/react@16` (React 19 compatible), `@testing-library/jest-dom@7` (DOM matchers via setup file), `jsdom@29`. RTL render + `screen` + `within` + `getByText`/`getByRole` queries. `vi.mock` for hook mocks. No new runtime dependencies — everything is already in `devDependencies` (`package.json` lines 65-77).

## Global Constraints (from the approved spec — copy-and-abide verbatim values)

- **TypeScript strict, no `any`.** Money = integer minor units (cents); TON = nanoTON (bigint). Use `format.*` helpers.
- **Strict file ownership (`telegram-ton-ownership`):** test files are NOT components — they may import `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `react`, any `@/components/**`, `@/hooks/**`, `@/lib/**`, `@/stores/**`, `@/types/**`, `lucide-react`. Tests may `vi.mock` any `@/hooks/**` or `@/components/wallet/**`. The ONLY production-code change this sprint is `vitest.config.ts` (Task 1) + the `MainButton` setParams tweak (Task 5). No component/page structural changes.
- **MVP payout honesty (non-negotiable):** the tests ASSERT the honesty contract — do not weaken it.
  - `PAYOUT_DISCLAIMER` = `"simulated weekly payout · on-chain verifiable post-MVP"` (from `@/lib/constants`).
  - `StatusPill` with `simulated` prop renders BOTH the finance-colored pill AND the muted `"simulated"` capsule.
  - A `paid` EarningsEntry renders the `"Paid"` success pill + the `simulated` badge + (on expand) the `"Simulated payout · tx hash is a placeholder"` line.
  - A `pending` EarningsEntry renders the `"Pending"` warning pill with NO `simulated` badge.
  - Portfolio: `totalEarningsUsd` is GREEN (`text-success`) — honest because it's the PAID sum. `weeklyProjectedUsd` is NEUTRAL (`text-foreground`) — pending, never green.
  - PnL: `--success` (up) / `--danger` (down) with ArrowUp/ArrowDown.
  - Buy success toast text stays `"Buy confirmed (simulated)"`; synthetic `txHash` stays `"simulated:<uuid>"`. Not touched.
- **Native-Telegram fidelity (per DESIGN_SYSTEM):** the tests assert the class strings the design system mandates (`bg-accent`, `text-success`, `text-foreground`, `size-[120px]`, `role="switch"`, `tracking-[-0.02em]`, etc.). If a future refactor drifts, the tests catch it.
- **Verification gates after every task:** `npm test` green (all tests pass — including the new ones, plus the existing 44); `npm run check` (lint + typecheck + build) green; commit one per task (`test(sprint-d): ...` for Tasks 1–4, `fix(phase3-sprint-d): ...` for Task 5).
- **Scratch hygiene:** `.superpowers/` is gitignored. Subagents must only `git add` the files they explicitly touch — never `.superpowers/`.

**Written against commit:** `00ccee1` (main, post Sprint C merge).

---

## File Structure (decomposition — locked here)

| File | Responsibility | Task |
|---|---|---|
| `vitest.config.ts` (modify) | Add `.test.tsx` to the glob + wire `setupFiles` | 1 |
| `src/test-setup.ts` (new) | jest-dom matchers + RTL cleanup (auto via `globals: false` → explicit imports still needed in tests, but the matchers register globally here) | 1 |
| `src/test/__sanity__/sanity.test.tsx` (new) | Harness sanity: RTL renders a trivial `<div>`, jest-dom matcher works. Deleted or kept — keeper (cheap regression on the harness itself) | 1 |
| `src/components/common/StatusPill.test.tsx` (new) | Honesty: `simulated` badge present/absent by prop; variant classes | 2 |
| `src/components/earnings/EarningsEntryRow.test.tsx` (new) | Honesty: Paid pill + simulated badge + disclosure "Simulated payout" line; Pending pill, no badge, no txHash line | 2 |
| `src/components/portfolio/MyPositionBlock.test.tsx` (new) | Honesty: PnL up → `text-success` + ArrowUp + `+`; PnL down → `text-danger` + ArrowDown + `−` (U+2212) | 2 |
| `src/components/property/OrderBook.test.tsx` (new) | 3 columns (Price / Qty / Cumulative); best row `bg-accent`; Bids `text-success` / Asks `text-danger` | 3 |
| `src/components/property/FundingBar.test.tsx` (new) | Fill `transform: scaleX(...)` inline style + `transform-origin: left` | 3 |
| `src/components/common/EmptyState.test.tsx` (new) | `Building2` 120px glyph present; H2 headline `text-[0.9375rem] font-semibold` | 3 |
| `src/components/common/Toggle.test.tsx` (new) | `role="switch"` + `aria-checked`; click flips `onChange` value | 3 |
| `src/components/wallet/WalletBadge.test.tsx` (new) | Renders nothing when disconnected (mock `useTonConnect`) | 3 |
| `src/app/(app)/earnings/page.test.tsx` (new) | PAYOUT_DISCLAIMER renders once; loaded state renders the hero projected amount; empty state shows "No earnings yet" | 4 |
| `src/app/(app)/portfolio/page.test.tsx` (new) | Loaded: "Total earnings" row green (`text-success`), "Next payout" row neutral (`text-foreground`) — honesty; empty state "No holdings yet"; loading skeleton present | 4 |
| `src/app/(app)/settings/page.test.tsx` (new) | PAYOUT_DISCLAIMER renders once; theme toggle present with `role="switch"`; `useTelegramTheme` flips on click (mocked store) | 4 |
| `src/app/(app)/property/[id]/page.tsx` (modify) | MainButton `setParams` passes explicit `color`/`textColor` brand tokens | 5 |
| `docs/qa/visual-qa-checklist.md` (new) | 360/390/480px viewport checks per screen + real-Telegram smoke steps | 5 |

**Dependency graph:** Task 1 (infra) is a hard prerequisite for Tasks 2–4 (none of those tests run without the `.test.tsx` glob + setup file). Tasks 2, 3, 4 are independent of each other (disjoint test files + `vi.mock` targets) but Task 4's page tests rely on the harness from Task 1 only. Task 5 is independent (production polish + doc). **Recommended order: 1 → 2 → 3 → 4 → 5** (infra → cheapest pure tests → presentational render tests → page integration → doc + polish).

---

## Task 1: Test infra — vitest `.test.tsx` glob + jest-dom setup

**Files:**
- Modify: `vitest.config.ts`
- Create: `src/test-setup.ts`
- Create: `src/test/__sanity__/sanity.test.tsx`

**Interfaces:**
- Produces: `vitest.config.ts` now globs `src/**/*.test.{ts,tsx}` and wires `test.setupFiles = ["./src/test-setup.ts"]`. `src/test-setup.ts` imports `@testing-library/jest-dom/vitest` to register DOM matchers. The sanity test proves RTL can render + a jest-dom matcher works.

- [ ] **Step 1: Rewrite `vitest.config.ts`**

The current file (verbatim):
```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "jsdom", include: ["src/**/*.test.ts"], globals: false },
});
```

Replace the ENTIRE file with:
```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test-setup.ts"],
    globals: false,
  },
});
```

(Two changes: `include` now globs both `.ts` and `.test.tsx`; `setupFiles` wires the jest-dom setup. `globals: false` is preserved — tests must import `describe/it/expect` from `vitest` explicitly per the existing pattern.)

- [ ] **Step 2: Create `src/test-setup.ts`**

```ts
// File responsibility: vitest global setup — registers @testing-library/jest-dom DOM matchers
// (toBeInTheDocument, toHaveAttribute, toHaveClass, toHaveStyle, etc.) for every test file.
// Run once per test file via vitest `setupFiles`. No test logic lives here.
import "@testing-library/jest-dom/vitest";
```

(`@testing-library/jest-dom@7` ships a `/vitest` entry that registers matchers on the vitest `expect`. The matchers become available in every `.test.tsx` without a per-file import.)

- [ ] **Step 3: Write the sanity test — `src/test/__sanity__/sanity.test.tsx`**

This is the RED phase: write it, run it, confirm the harness works (RTL renders + jest-dom matcher resolves). It's a keeper (regression on the harness itself).

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Minimal render to prove RTL + jsdom + jest-dom are wired. If this breaks, the whole
// component-test harness is broken — fix before any other test file.
function Clickable({ label }: { label: string }) {
  return <button type="button">{label}</button>;
}

describe("test harness sanity", () => {
  it("renders a button and resolves a jest-dom matcher", () => {
    render(<Clickable label="tap me" />);
    expect(screen.getByRole("button", { name: "tap me" })).toBeInTheDocument();
  });
});
```

(No `userEvent` needed for the sanity test — `getByRole` + `toBeInTheDocument` proves both RTL and jest-dom are wired. `@testing-library/user-event` is NOT installed in this repo; all click tests in Tasks 2–3 use `fireEvent` from `@testing-library/react` instead. If the harness is broken, this sanity test fails first with a clear message.)

- [ ] **Step 4: Run the new sanity test in isolation + the full suite**

```bash
npm test -- src/test/__sanity__/sanity.test.tsx
```
Expected: PASS — 1/1. (Confirms: `.test.tsx` glob picks it up, jsdom env loads, setup file registers matchers, RTL renders.)

```bash
npm test
```
Expected: PASS — 45/45 (the existing 44 + the 1 sanity). Output pristine.

- [ ] **Step 5: Run check**

```bash
npm run check
```
Expected: lint + typecheck + build green. (typecheck covers the new `.test.tsx` + `test-setup.ts`; build unaffected.)

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/test-setup.ts src/test/__sanity__/sanity.test.tsx
git commit -m "test(sprint-d): vitest .test.tsx glob + jest-dom setup + harness sanity test"
```

---

## Task 2: Honesty-contract presentational tests (StatusPill, EarningsEntryRow, MyPositionBlock)

**Files:**
- Create: `src/components/common/StatusPill.test.tsx`
- Create: `src/components/earnings/EarningsEntryRow.test.tsx`
- Create: `src/components/portfolio/MyPositionBlock.test.tsx`

**Interfaces:**
- Consumes: `StatusPill` (props `label`, `variant`, `simulated?`), `EarningsEntryRow` (props `entry: EarningsEntry`, `propertyName`, `weeklyRentPoolUsd`), `MyPositionBlock` (props `holding: Holding`, `propertyName`). All pure presentational — no hook mocks required.
- Produces: 3 test files proving the honesty contract holds on the components that carry it. No production-code changes.

- [ ] **Step 1: `src/components/common/StatusPill.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusPill } from "@/components/common/StatusPill";

describe("StatusPill — MVP honesty contract", () => {
  it("a Paid pill with simulated renders BOTH the Paid pill and the muted 'simulated' capsule", () => {
    render(<StatusPill label="Paid" variant="success" simulated />);
    // The finance-colored pill:
    const paid = screen.getByText("Paid");
    expect(paid).toHaveClass("text-success", "bg-success/12");
    // The muted sibling simulated badge (never finance-colored):
    const sim = screen.getByText("simulated");
    expect(sim).toHaveClass("text-muted-foreground", "bg-muted");
    expect(sim).not.toHaveClass("text-success");
    expect(sim).not.toHaveClass("text-danger");
  });

  it("a Pending pill renders 'Pending' with the warning variant and NO 'simulated' badge", () => {
    render(<StatusPill label="Pending" variant="warning" />);
    const pending = screen.getByText("Pending");
    expect(pending).toHaveClass("text-warning", "bg-warning/12");
    expect(screen.queryByText("simulated")).not.toBeInTheDocument();
  });

  it("a danger pill renders the danger variant", () => {
    render(<StatusPill label="Closed" variant="danger" />);
    expect(screen.getByText("Closed")).toHaveClass("text-danger", "bg-danger/10");
  });
});
```

(Covers: the MVP honesty rule "every Paid pill carries the muted simulated sibling, never finance-colored" + the semantic color contract per variant. `toHaveClass` checks the class is present; `not.toBeInTheDocument` confirms absence.)

- [ ] **Step 2: `src/components/earnings/EarningsEntryRow.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EarningsEntryRow } from "@/components/earnings/EarningsEntryRow";
import type { EarningsEntry } from "@/types/earnings";

const paidEntry: EarningsEntry = {
  id: "e1",
  userId: "u1",
  propertyId: "p1",
  weekOf: "2026-07-20T00:00:00Z",
  amountUsd: 1500, // $15.00
  tonAmount: 7_500_000, // 0.0075 TON
  shareRatio: 0.075,
  status: "paid",
  txHash: "simulated:abc-def-12345",
};

const pendingEntry: EarningsEntry = {
  ...paidEntry,
  id: "e2",
  status: "pending",
  txHash: undefined,
};

describe("EarningsEntryRow — MVP honesty contract", () => {
  it("a paid entry renders the 'Paid' success pill + muted 'simulated' badge", () => {
    render(<EarningsEntryRow entry={paidEntry} propertyName="Bayside Marina Penthouse" weeklyRentPoolUsd={20000} />);
    expect(screen.getByText("Paid")).toHaveClass("text-success");
    expect(screen.getByText("simulated")).toHaveClass("text-muted-foreground");
  });

  it("a paid entry, expanded, shows the 'Simulated payout · tx hash is a placeholder' line", () => {
    render(<EarningsEntryRow entry={paidEntry} propertyName="Bayside" weeklyRentPoolUsd={20000} />);
    fireEvent.click(screen.getByRole("button"));
    // The disclosure line (R-6.6 honesty disclosure):
    expect(screen.getByText(/Simulated payout · tx hash is a placeholder/)).toBeInTheDocument();
    // The txHash is shown as a prefix slice:
    expect(screen.getByText(/\(simulated:abc-def-12345…\)/)).toBeInTheDocument();
  });

  it("a pending entry renders the 'Pending' warning pill and NO 'simulated' badge", () => {
    render(<EarningsEntryRow entry={pendingEntry} propertyName="Alfama Terrace" weeklyRentPoolUsd={25000} />);
    expect(screen.getByText("Pending")).toHaveClass("text-warning");
    expect(screen.queryByText("simulated")).not.toBeInTheDocument();
    expect(screen.queryByText("Paid")).not.toBeInTheDocument();
  });

  it("a pending entry, expanded, does NOT show the simulated-txHash line", () => {
    render(<EarningsEntryRow entry={pendingEntry} propertyName="Alfama" weeklyRentPoolUsd={25000} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText(/Simulated payout/)).not.toBeInTheDocument();
  });

  it("a paid entry shows the amount in tabular-nums (tnum class)", () => {
    render(<EarningsEntryRow entry={paidEntry} propertyName="Bayside" weeklyRentPoolUsd={20000} />);
    const amount = screen.getByText("$15.00");
    expect(amount).toHaveClass("tnum");
  });
});
```

(Covers: Paid vs Pending pill honesty, the `simulated` badge presence/absence, the proportional-math disclosure R-6.6 line + txHash slice format, `tnum` on money figures. NOTE: `@testing-library/user-event` is NOT installed in this repo (verified: `npm ls @testing-library/user-event` → empty) — use `fireEvent` from `@testing-library/react` instead for all click interactions. `fireEvent.click(el)` is synchronous and adequate for these expand/click tests. `usd(1500)` = `"$15.00"` per `format.ts:5-8`.)

- [ ] **Step 3: `src/components/portfolio/MyPositionBlock.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyPositionBlock } from "@/components/portfolio/MyPositionBlock";
import type { Holding } from "@/types/position";

const upHolding: Holding = {
  propertyId: "p1",
  sharesOwned: 60,
  avgCostUsd: 25000, // $250.00/share
  currentValueUsd: 60 * 26000, // $15,600.00 total (appreciated)
  pendingWeekEarningsUsd: 1500,
  shareRatio: 0.075,
};

const downHolding: Holding = {
  propertyId: "p2",
  sharesOwned: 75,
  avgCostUsd: 10000, // $100.00/share
  currentValueUsd: 75 * 9500, // $7,125.00 total (depreciated)
  pendingWeekEarningsUsd: 1875,
  shareRatio: 0.075,
};

describe("MyPositionBlock — PnL honesty contract", () => {
  it("an appreciated holding renders PnL in --success with ArrowUp and a '+' prefix", () => {
    render(<MyPositionBlock holding={upHolding} propertyName="Bayside Marina Penthouse" />);
    // PnL = currentValueUsd - avgCostUsd*shares = 60*26000 - 60*25000 = 60000 cents = $600.00
    const pnl = screen.getByText(/\$600\.00/);
    expect(pnl).toHaveClass("text-success");
    expect(pnl).toHaveClass("tnum");
    // The arrow glyph renders with the success tint (ARIA-hidden, so check by svg role + class on the span)
    const pnlSpan = pnl.closest("span");
    expect(pnlSpan?.textContent).toMatch(/^\+\$600\.00$/);
  });

  it("a depreciated holding renders PnL in --danger with ArrowDown and a '\u2212' (U+2212 MINUS) prefix", () => {
    render(<MyPositionBlock holding={downHolding} propertyName="Alfama Terrace" />);
    // PnL = 75*9500 - 75*10000 = -37500 cents = -$375.00
    const pnl = screen.getByText(/\$375\.00/);
    expect(pnl).toHaveClass("text-danger");
    expect(pnl).toHaveClass("tnum");
    const pnlSpan = pnl.closest("span");
    // U+2212 MINUS SIGN, NOT a hyphen-minus:
    expect(pnlSpan?.textContent).toMatch(/^\u2212\$375\.00$/);
  });

  it("renders the property name as a bold header row", () => {
    render(<MyPositionBlock holding={upHolding} propertyName="Bayside Marina Penthouse" />);
    const name = screen.getByText("Bayside Marina Penthouse");
    expect(name).toHaveClass("font-semibold", "text-foreground");
  });

  it("renders Shares owned / Avg cost / Current value rows with tabular-nums on every figure", () => {
    render(<MyPositionBlock holding={upHolding} propertyName="Bayside" />);
    // sharesOwned = 60
    const shares = screen.getByText("60");
    expect(shares).toHaveClass("tnum");
    // avgCostUsd = 25000 cents = $250.00
    const avgCost = screen.getByText("$250.00");
    expect(avgCost).toHaveClass("tnum");
    // currentValueUsd = 60*26000 = 1,560,000 cents = $15,600.00
    const currentValue = screen.getByText("$15,600.00");
    expect(currentValue).toHaveClass("tnum");
  });
});
```

(Covers: PnL up/down tint + sign prefix + the U+2212-minus-sign honesty contract — a hyphen would be a defect. `tnum` on every figure. The `closest("span")` traverses to the wrapping PnL span whose `textContent` is `+$600.00` / `−$375.00`. `usd(60000)` = `"$600.00"`, `usd(1560000)` = `"$15,600.00"` per the `toLocaleString` formatter in `format.ts:5-8`.)

- [ ] **Step 4: Run new tests + full suite + check + commit**

```bash
npm test -- src/components/common/StatusPill.test.tsx src/components/earnings/EarningsEntryRow.test.tsx src/components/portfolio/MyPositionBlock.test.tsx
```
Expected: all PASS. If the EarningsEntryRow test fails on `userEvent` import → stop, swap to `fireEvent` per the Step-2 pre-flight note, re-run.

```bash
npm test
npm run check
git add src/components/common/StatusPill.test.tsx src/components/earnings/EarningsEntryRow.test.tsx src/components/portfolio/MyPositionBlock.test.tsx
git commit -m "test(sprint-d): honesty contract — StatusPill simulated badge, EarningsEntryRow Paid/Pending disclosure, MyPositionBlock PnL up/down"
```
Expected: full suite green (45 + new), check green.

---

## Task 3: Component render tests (OrderBook, FundingBar, EmptyState, Toggle, WalletBadge)

**Files:**
- Create: `src/components/property/OrderBook.test.tsx`
- Create: `src/components/property/FundingBar.test.tsx`
- Create: `src/components/common/EmptyState.test.tsx`
- Create: `src/components/common/Toggle.test.tsx`
- Create: `src/components/wallet/WalletBadge.test.tsx`

**Interfaces:**
- `OrderBook` takes `state: OrderBookState` — pure presentational. `FundingBar` takes `progress`/`funded` — pure. `EmptyState` takes `title`/`message`/`action?`/`className?` — pure. `Toggle` takes `on`/`onChange`/`aria-label` — pure controlled. `WalletBadge` reads `useTonConnect()` internally — mock `useTonConnect` via `vi.mock`.

- [ ] **Step 1: `src/components/property/OrderBook.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderBook } from "@/components/property/OrderBook";
import type { OrderBookState } from "@/types/order";

const state: OrderBookState = {
  propertyId: "p1",
  bids: [
    { priceUsd: 24500, quantity: 12, cumulative: 12 },
    { priceUsd: 24000, quantity: 5, cumulative: 17 },
  ],
  asks: [
    { priceUsd: 25800, quantity: 8, cumulative: 8 },
    { priceUsd: 26200, quantity: 3, cumulative: 11 },
  ],
  bestBidUsd: 24500,
  bestAskUsd: 25800,
  lastTradeUsd: 25100,
};

describe("OrderBook — DESIGN_SYSTEM §'Order book'", () => {
  it("renders the 'Order book' section label header", () => {
    render(<OrderBook state={state} />);
    expect(screen.getByText("Order book")).toBeInTheDocument();
  });

  it("renders 'Bids' and 'Asks' column headers", () => {
    render(<OrderBook state={state} />);
    expect(screen.getByText("Bids")).toBeInTheDocument();
    expect(screen.getByText("Asks")).toBeInTheDocument();
  });

  it("renders Price, Qty, AND Cumulative values for each level", () => {
    render(<OrderBook state={state} />);
    // best bid: $245.00, qty 12, cumulative 12
    expect(screen.getByText("$245.00")).toBeInTheDocument();
    expect(screen.getAllByText("12").length).toBeGreaterThanOrEqual(2); // qty + cumulative (both 12)
    // second bid: $240.00, qty 5, cumulative 17
    expect(screen.getByText("$240.00")).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
    // best ask: $258.00, qty 8, cumulative 8
    expect(screen.getByText("$258.00")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument(); // second ask cumulative
  });

  it("the best BID row is tinted --success (text-success) and carries bg-accent", () => {
    const { container } = render(<OrderBook state={state} />);
    // The best bid price ($245.00) sits in a text-success span:
    const bestBidPrice = screen.getByText("$245.00");
    expect(bestBidPrice).toHaveClass("text-success");
    // The row wrapping it has bg-accent:
    const row = bestBidPrice.closest("div");
    expect(row?.className).toMatch(/bg-accent(?!\/)/); // bg-accent but NOT bg-accent/40
  });

  it("the best ASK row is tinted --danger (text-danger) and carries bg-accent", () => {
    render(<OrderBook state={state} />);
    const bestAskPrice = screen.getByText("$258.00");
    expect(bestAskPrice).toHaveClass("text-danger");
    const row = bestAskPrice.closest("div");
    expect(row?.className).toMatch(/bg-accent(?!\/)/);
  });

  it("an empty order book renders the em-dash placeholder for each side", () => {
    render(<OrderBook state={{ propertyId: "p2", bids: [], asks: [] }} />);
    expect(screen.getAllByText("—").length).toBe(2);
  });
});
```

(Covers: 3-column render incl Cumulative (Sprint B I4), best-row `bg-accent` not `/40`, Bids `text-success`/Asks `text-danger`, empty-state em-dash. The regex `/bg-accent(?!\/)/` asserts `bg-accent` is present and NOT followed by `/` — catches a regression to `bg-accent/40`.)

- [ ] **Step 2: `src/components/property/FundingBar.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FundingBar } from "@/components/property/FundingBar";

describe("FundingBar — DESIGN_SYSTEM §'Funding / progress bar'", () => {
  it("animates via transform: scaleX() with transform-origin: left (never width)", () => {
    const { container } = render(<FundingBar progress={0.5} />);
    const fill = container.querySelector(".funding-bar-fill") as HTMLElement;
    expect(fill).not.toBeNull();
    const style = fill.style;
    // transform: scaleX(0.5) — the spec mandates scaleX, never width animation
    expect(style.transform).toBe("scalex(0.5)");
    expect(style.transformOrigin).toBe("left");
    // transition uses the easing token, not a literal cubic-bezier
    expect(style.transition).toContain("var(--ease-tg-out)");
    expect(style.transition).not.toMatch(/cubic-bezier/);
  });

  it("funded=true fills with --success (bg-success), else --primary (bg-primary)", () => {
    const { container, rerender } = render(<FundingBar progress={1} funded />);
    let fill = container.querySelector(".funding-bar-fill") as HTMLElement;
    expect(fill.className).toContain("bg-success");
    rerender(<FundingBar progress={0.5} funded={false} />);
    fill = container.querySelector(".funding-bar-fill") as HTMLElement;
    expect(fill.className).toContain("bg-primary");
  });

  it("clamps progress to [0, 1] (negative -> 0, >1 -> 1)", () => {
    const { container, rerender } = render(<FundingBar progress={-0.5} />);
    let fill = container.querySelector(".funding-bar-fill") as HTMLElement;
    expect(fill.style.transform).toBe("scalex(0)");
    rerender(<FundingBar progress={1.5} />);
    fill = container.querySelector(".funding-bar-fill") as HTMLElement;
    expect(fill.style.transform).toBe("scalex(1)");
  });
});
```

(Covers: Sprint A C2 `scaleX` + `transformOrigin: left` + the Sprint B M9 `var(--ease-tg-out)` token transition, `funded` → `bg-success`, clamping. jsdom normalizes `scaleX(0.5)` to lowercase `scalex(0.5)` — assert the lowercased form.)

- [ ] **Step 3: `src/components/common/EmptyState.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/common/EmptyState";

describe("EmptyState — DESIGN_SYSTEM §'Empty state'", () => {
  it("renders the 120px Building2 line illustration with muted color", () => {
    const { container } = render(<EmptyState title="No holdings" message="msg" />);
    // lucide renders an <svg> with a `lucide-building-2` class component name:
    const svg = container.querySelector('svg[class*="lucide-building-2"]') ?? container.querySelector("svg");
    expect(svg).not.toBeNull();
    // size 120 (lucide sets width/height attributes):
    expect(svg?.getAttribute("width")).toBe("120");
    expect(svg?.getAttribute("height")).toBe("120");
    // the svg carries the muted-foreground text color:
    expect(svg?.className).toMatch(/text-muted-foreground/);
    // aria-hidden (decorative):
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders the H2 headline with the spec'd size (text-[0.9375rem] font-semibold)", () => {
    render(<EmptyState title="No earnings yet" message="msg" />);
    const headline = screen.getByRole("heading", { level: 2 });
    expect(headline).toHaveTextContent("No earnings yet");
    expect(headline).toHaveClass("font-semibold");
    expect(headline.className).toMatch(/text-\[0\.9375rem\]/);
  });

  it("renders the muted message sentence", () => {
    render(<EmptyState title="t" message="Own a slice of a property to see your position here." />);
    expect(screen.getByText("Own a slice of a property to see your position here.")).toHaveClass("text-muted-foreground");
  });

  it("renders the primary action when provided", () => {
    render(
      <EmptyState
        title="t"
        message="m"
        action={<a href="/marketplace" className="bg-primary text-primary-foreground">Explore</a>}
      />,
    );
    const action = screen.getByRole("link", { name: "Explore" });
    expect(action).toHaveClass("bg-primary", "text-primary-foreground");
  });
});
```

(Covers: Sprint A I2 — 120px `Building2` glyph + H2 headline `0.9375rem/600` + muted message + primary action. lucide icons set both width/height attributes to the size prop; querying by `svg[class*="lucide-building-2"]` is the robust selector — if it fails, fall back to `container.querySelector("svg")` per the `??` fallback.)

- [ ] **Step 4: `src/components/common/Toggle.test.tsx`**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Toggle } from "@/components/common/Toggle";

describe("Toggle — accessible iOS-style switch", () => {
  it("has role=switch and reflects on/off via aria-checked", () => {
    const onChange = vi.fn();
    const { rerender } = render(<Toggle on={false} onChange={onChange} aria-label="Use Telegram theme" />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(sw).toHaveAccessibleName("Use Telegram theme");
    rerender(<Toggle on={true} onChange={onChange} aria-label="Use Telegram theme" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("on background is --primary (bg-primary), off is --surface-2 (bg-surface-2)", () => {
    const { rerender } = render(<Toggle on={true} onChange={() => {}} aria-label="t" />);
    expect(screen.getByRole("switch").className).toContain("bg-primary");
    rerender(<Toggle on={false} onChange={() => {}} aria-label="t" />);
    expect(screen.getByRole("switch").className).toContain("bg-surface-2");
  });

  it("a click calls onChange with the flipped value", () => {
    const onChange = vi.fn();
    render(<Toggle on={false} onChange={onChange} aria-label="t" />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
```

(Covers: Sprint C Task 3 — `role="switch"` + `aria-checked` + `aria-label` forwarded, `bg-primary`/`bg-surface-2`, click flips. NOTE: `@testing-library/user-event` is NOT installed — use `fireEvent` from `@testing-library/react` for the click.)

- [ ] **Step 5: `src/components/wallet/WalletBadge.test.tsx`**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock useTonConnect before importing WalletBadge (hoisted by vi.mock).
vi.mock("@/hooks/useTonConnect", () => ({
  useTonConnect: () => ({
    connected: false,
    address: null,
    short: "",
    network: "testnet",
    openModal: vi.fn(),
  }),
}));

import { WalletBadge } from "@/components/wallet/WalletBadge";

describe("WalletBadge — disconnected state", () => {
  it("renders nothing when the wallet is disconnected", () => {
    const { container } = render(<WalletBadge />);
    expect(container.firstChild).toBeNull();
  });
});
```

(Covers: WalletBadge returns `null` when disconnected — easy-to-break contract. `vi.mock` hoists above the import per vitest's mock hoisting rules; the mock returns a disconnected surface. The "renders nothing" assertion uses `container.firstChild === null` which is the canonical RTL pattern for a component that returns `null`.)

- [ ] **Step 6: Run new tests + full suite + check + commit**

```bash
npm test -- src/components/property/OrderBook.test.tsx src/components/property/FundingBar.test.tsx src/components/common/EmptyState.test.tsx src/components/common/Toggle.test.tsx src/components/wallet/WalletBadge.test.tsx
npm test
npm run check
git add src/components/property/OrderBook.test.tsx src/components/property/FundingBar.test.tsx src/components/common/EmptyState.test.tsx src/components/common/Toggle.test.tsx src/components/wallet/WalletBadge.test.tsx
git commit -m "test(sprint-d): component render tests — OrderBook 3-cols, FundingBar scaleX, EmptyState glyph, Toggle a11y, WalletBadge disconnected"
```
Expected: all green.

---

## Task 4: Page integration tests — Earnings / Portfolio / Settings (mocked hooks)

**Files:**
- Create: `src/app/(app)/earnings/page.test.tsx`
- Create: `src/app/(app)/portfolio/page.test.tsx`
- Create: `src/app/(app)/settings/page.test.tsx`

**Interfaces:**
- Each page test `vi.mock`s the hooks the page imports (see the recon'd import lists above) and renders the page with RTL. The mock factories return `{ data, isLoading, isError, refetch }` shaped to drive each branch (loaded/loading/error/empty). For Settings, also mock `@/hooks/useTonConnect`.

- [ ] **Step 1: `src/app/(app)/earnings/page.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";

// Mock the hooks BEFORE importing the page (vi.mock hoists).
vi.mock("@/hooks/useEarnings", () => ({
  useEarnings: vi.fn(),
}));
vi.mock("@/hooks/useMarketplace", () => ({
  useMarketplace: vi.fn(() => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() })),
}));

import { useEarnings } from "@/hooks/useEarnings";
import EarningsPage from "@/app/(app)/earnings/page";
import type { EarningsSummary } from "@/types/earnings";

const loadedSummary: EarningsSummary = {
  allTimeUsd: 12_000,
  thisWeekProjectedUsd: 3_375,
  projectedNextWeekUsd: 3_375,
  entries: [
    {
      id: "e1",
      userId: "u1",
      propertyId: "prop-bayside-marina-penthouse",
      weekOf: "2026-07-20T00:00:00Z",
      amountUsd: 1_500,
      tonAmount: 7_500_000,
      shareRatio: 0.075,
      status: "paid",
      txHash: "simulated:abc",
    },
  ],
};

describe("Earnings page — honesty contract + states", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the PAYOUT_DISCLAIMER exactly once (MVP honesty contract)", () => {
    vi.mocked(useEarnings).mockReturnValue({ data: loadedSummary, isLoading: false, isError: false, refetch: vi.fn() } as never);
    render(<EarningsPage />);
    expect(screen.getAllByText("simulated weekly payout · on-chain verifiable post-MVP").length).toBe(1);
  });

  it("loaded: renders the hero this-week projected amount in tabular-nums", () => {
    vi.mocked(useEarnings).mockReturnValue({ data: loadedSummary, isLoading: false, isError: false, refetch: vi.fn() } as never);
    render(<EarningsPage />);
    expect(screen.getByText("$33.75")).toHaveClass("tnum");
  });

  it("loading: renders skeleton placeholders (no spinner replacing the list)", () => {
    vi.mocked(useEarnings).mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() } as never);
    const { container } = render(<EarningsPage />);
    // Skeletons use the animate-pulse bg-surface-2 divs (no text content to query — query by class):
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("empty: renders the EmptyState with 'No earnings yet'", () => {
    vi.mocked(useEarnings).mockReturnValue({ data: { ...loadedSummary, entries: [] }, isLoading: false, isError: false, refetch: vi.fn() } as never);
    render(<EarningsPage />);
    expect(screen.getByText("No earnings yet")).toBeInTheDocument();
  });

  it("error: renders the Retry button", () => {
    vi.mocked(useEarnings).mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() } as never);
    render(<EarningsPage />);
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
```

(Covers: the dual-screen honesty contract (disclaimer renders ONCE on Earnings), the hero projected amount renders + `tnum`, all 4 states. The `vi.mock` factory returns deterministic shapes; `vi.mocked(useEarnings).mockReturnValue(...)` per test picks the branch. `as never` bypasses the strict return-type mismatch — vitest's `vi.fn()` typing doesn't match the QueryObserverResult; this is the sanctioned workaround.)

- [ ] **Step 2: `src/app/(app)/portfolio/page.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/hooks/usePortfolio", () => ({ usePortfolio: vi.fn() }));
vi.mock("@/hooks/useMarketplace", () => ({
  useMarketplace: vi.fn(() => ({
    data: [
      { id: "prop-bayside-marina-penthouse", title: "Bayside Marina Penthouse" },
      { id: "prop-alfama-terrace-flat", title: "Alfama Terrace" },
    ],
    isLoading: false, isError: false, refetch: vi.fn(),
  })),
}));

import { usePortfolio } from "@/hooks/usePortfolio";
import PortfolioPage from "@/app/(app)/portfolio/page";
import type { PortfolioSummary } from "@/types/position";

const loaded: PortfolioSummary = {
  totalValueUsd: 2_347_500, // 60*26000 + 75*10500
  totalInvestedUsd: 2_250_000, // 60*25000 + 75*10000
  totalEarningsUsd: 9_000, // paid sum (seed)
  weeklyProjectedUsd: 3_375,
  holdings: [
    { propertyId: "prop-bayside-marina-penthouse", sharesOwned: 60, avgCostUsd: 25000, currentValueUsd: 60 * 26000, pendingWeekEarningsUsd: 1500, shareRatio: 0.075 },
  ],
  openOrders: [],
};

describe("Portfolio page — honesty contract (paid green / pending neutral)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loaded: 'Total earnings' row value is tinted --success (paid = honest green)", () => {
    vi.mocked(usePortfolio).mockReturnValue({ data: loaded, isLoading: false, isError: false, refetch: vi.fn() } as never);
    render(<PortfolioPage />);
    const earningsValue = screen.getByText("$90.00"); // 9000 cents
    expect(earningsValue).toHaveClass("text-success");
    expect(earningsValue).toHaveClass("tnum");
  });

  it("loaded: 'Next payout' row value is NEUTRAL --foreground (pending, NOT green) — honesty", () => {
    vi.mocked(usePortfolio).mockReturnValue({ data: loaded, isLoading: false, isError: false, refetch: vi.fn() } as never);
    render(<PortfolioPage />);
    const nextPayout = screen.getByText("$33.75"); // 3375 cents
    expect(nextPayout).toHaveClass("text-foreground");
    expect(nextPayout).not.toHaveClass("text-success");
    expect(nextPayout).toHaveClass("tnum");
  });

  it("loaded: does NOT render the PAYOUT_DISCLAIMER (only Earnings + Settings carry it)", () => {
    vi.mocked(usePortfolio).mockReturnValue({ data: loaded, isLoading: false, isError: false, refetch: vi.fn() } as never);
    render(<PortfolioPage />);
    expect(screen.queryByText("simulated weekly payout · on-chain verifiable post-MVP")).not.toBeInTheDocument();
  });

  it("loading: renders skeleton placeholders", () => {
    vi.mocked(usePortfolio).mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() } as never);
    const { container } = render(<PortfolioPage />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("empty (no holdings): renders 'No holdings yet' + the Explore Marketplace CTA", () => {
    vi.mocked(usePortfolio).mockReturnValue({ data: { ...loaded, holdings: [] }, isLoading: false, isError: false, refetch: vi.fn() } as never);
    render(<PortfolioPage />);
    expect(screen.getByText("No holdings yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore Marketplace" })).toBeInTheDocument();
  });

  it("error: renders the Retry button", () => {
    vi.mocked(usePortfolio).mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() } as never);
    render(<PortfolioPage />);
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
```

(Covers: the honest coloring contract — `totalEarnings` green (paid), `weeklyProjected` neutral (pending), `PAYOUT_DISCLAIMER` NOT on Portfolio, all 4 states. This is the highest-judge-value test in Sprint D: if a future refactor flips the pending payout to green (implying "landed"), this test catches it red.)

- [ ] **Step 3: `src/app/(app)/settings/page.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/hooks/useTonConnect", () => ({
  useTonConnect: () => ({
    connected: false,
    address: null,
    short: "",
    network: "testnet",
    openModal: vi.fn(),
  }),
}));

import SettingsPage from "@/app/(app)/settings/page";
import { useSettingsStore } from "@/stores/settings.store";

describe("Settings page — honesty contract + theme toggle", () => {
  beforeEach(() => {
    // Reset the Zustand store between tests so useTelegramTheme starts deterministic:
    useSettingsStore.setState({ useTelegramTheme: false });
  });

  it("renders the PAYOUT_DISCLAIMER exactly once at the bottom (MVP honesty contract)", () => {
    render(<SettingsPage />);
    expect(screen.getAllByText("simulated weekly payout · on-chain verifiable post-MVP").length).toBe(1);
  });

  it("renders the three section labels: Wallet / Appearance / About", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Wallet")).toBeInTheDocument();
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
  });

  it("renders the theme Toggle with role=switch and the accessible name 'Use Telegram theme'", () => {
    render(<SettingsPage />);
    const sw = screen.getByRole("switch", { name: "Use Telegram theme" });
    expect(sw).toHaveAttribute("aria-checked", "false");
  });

  it("shows the wallet-connect affordance (not the badge) when disconnected", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Connect a TON wallet")).toBeInTheDocument();
  });
});
```

(Covers: Settings disclaimer renders ONCE, three SectionLabels, Toggle `role=switch` + accessible name, disconnected wallet row. The Zustand store is real (no mock) — `setState` resets it; the `useTheme()` hook in `AppShell` ISN'T mounted here (just the page), so the toggle doesn't actually apply theme vars in the test, which is fine — we're testing the PAGE, not the theme application.)

- [ ] **Step 4: Run new tests + full suite + check + commit**

```bash
npm test -- "src/app/(app)/earnings/page.test.tsx" "src/app/(app)/portfolio/page.test.tsx" "src/app/(app)/settings/page.test.tsx"
npm test
npm run check
git add "src/app/(app)/earnings/page.test.tsx" "src/app/(app)/portfolio/page.test.tsx" "src/app/(app)/settings/page.test.tsx"
git commit -m "test(sprint-d): page integration — Earnings disclaimer, Portfolio paid-green/pending-neutral, Settings toggle"
```
Expected: all green. (Quote the paths with parens on Windows. The `npm test --` glob with parens may need `--` + quoted globs — if the shell refuses the parens, run each file individually: `npm test -- src/app//earnings/page.test.tsx` etc. — the implementer should use whichever invocation works on Windows PowerShell.)

---

## Task 5: Real-Telegram polish — explicit MainButton brand colors + visual QA checklist

**Files:**
- Modify: `src/app/(app)/property/[id]/page.tsx` (MainButton `setParams` adds `color` + `textColor`)
- Create: `docs/qa/visual-qa-checklist.md`

**Interfaces:**
- The MainButton `setParams` call in the Property detail page's MainButton effect adds `color: "#3390ec"` (Telegram blue = `--primary`) and `textColor: "#ffffff"` (`--primary-foreground`). DESIGN_SYSTEM §"MainButton": "full-width bottom, h-[50px], --primary bg, --primary-foreground 600 text."

- [ ] **Step 1: Add explicit brand colors to MainButton `setParams`**

In `src/app/(app)/property/[id]/page.tsx`, find the `tg.mainButton.setParams({ ... })` call (the one setting `text` + `isEnabled`). It's inside the MainButton effect, currently:

```tsx
    tg.mainButton.setParams({
      text: `Buy ${qty} — $${(totalUsd / 100).toFixed(2)}`,
      isEnabled: valid,
    });
```

Replace with:

```tsx
    tg.mainButton.setParams({
      text: `Buy ${qty} — $${(totalUsd / 100).toFixed(2)}`,
      isEnabled: valid,
      color: "#3390ec",       // Telegram blue (--primary) — explicit in real TG so the Buy confirm matches brand.
      textColor: "#ffffff",  // --primary-foreground. Telegram renders this natively; explicit avoids TG-theme drift.
    });
```

(The hex values mirror `--primary` = `oklch(0.625 0.177 250)` = `#3390ec` and `--primary-foreground` = `#ffffff` per `docs/research/DESIGN_SYSTEM.md` §"Color Tokens (Dark)". Telegram's MainButton API takes hex strings, not CSS vars — explicit hex is the real-TG-polish fix. If the user has the live Telegram theme toggle ON, the MainButton still renders Telegram blue because the brand color is fixed by DigiHouse's design contract; this matches the DESIGN_SYSTEM "one accent" rule. Only this one `setParams` call changes — leave the surrounding `text`/`isEnabled`/`onClick` logic UNCHANGED. No toast text, no `txHash`, no buy body change — honesty contract preserved.)

- [ ] **Step 2: Run check + test**

```bash
npm run check
npm test
```
Expected: green. (The page test for property detail ISN'T in Sprint D — the Property detail page test would require mocking `useTelegram` + `useTonConnect` + `useBuyShares` + `useProperty` + `useOrderBook`, which is heavier; it's deferred to a future sprint. The `npm test` confirms the MainButton color tweak doesn't break the existing 44 + new tests.)

- [ ] **Step 3: Create `docs/qa/visual-qa-checklist.md`**

```markdown
# DigiHouse — Visual QA Checklist (pre-competition)

> Run this checklist in the Telegram Beta WebApp iframe (or the `@BotFather` Preview Button) on an
> actual device/simulator before judging. The dev environment mocks the Telegram SDK — these items
> can only be verified in real Telegram.

## 1. Viewport sweep — no horizontal scroll, safe-area respected

For EACH of the 5 tabs + Property detail, resize the WebApp to 360 / 390 / 480 px widths and confirm:

- [ ] **No horizontal scroll** on any screen (use the WebApp width slider or device simulator).
- [ ] **Header**: bar height grows by the iOS safe-area inset; the centered title doesn't clip.
- [ ] **Bottom tab bar**: 4 labels visible, active tab = `--primary` (Telegram blue), inactive = muted gray.
- [ ] **Block gutters**: every `bg-card` block sits 16px (px-4) from the canvas edge on both sides.

### Per-screen
- [ ] **Home**: balance hero `1.625rem/700` + `tracking-[-0.02em]` reads crisp; "Next rent" hero is neutral (NOT green); my-properties mini-cards align thumb + name + pending (warning) text.
- [ ] **Marketplace**: skeleton thumb matches the real card `aspect-[16/10]` on first load; PropertyCard funding % row + FundingBar render; WeeklyYieldCallout reads `≈ $X.XX / week per share` in `--success`.
- [ ] **Property detail**: BackButton chevron appears in the TG header and navigates back; MainButton shows "Buy N — $X.XX" in Telegram blue (#3390ec) at the bottom; the app tab bar is HIDDEN while MainButton is shown; OrderBook renders 3 columns (Price/Qty/Cumulative) with the best bid `text-success` + `bg-accent` strip and best ask `text-danger` + `bg-accent`.
- [ ] **Earnings**: disclaimer renders at the top of the scroll area; hero "This week projected" `1.625rem/700` neutral `--foreground` with the Pending pill in `--warning`; a Paid entry shows the muted "simulated" badge; expanding an entry aligns the disclosure content under the property NAME (not the thumb); the disclosure "Simulated payout · tx hash is a placeholder" line renders.
- [ ] **Portfolio**: "Total earnings" value is GREEN (`--success`) — honest (paid sum); "Next payout" is neutral; my-position PnL shows ArrowUp + `+` in `--success` for an appreciated holding; open-orders block (if any) renders.
- [ ] **Settings**: disclaimer renders at the bottom; the theme Toggle has `role=switch` accessible name "Use Telegram theme"; toggling it (Appearance → ON) live-applies the Telegram color scheme (the app re-reads `themeParams`).

## 2. Real-Telegram behavior smoke

- [ ] **BackButton** on Property detail: tapping the on-screen TG back chevron returns to the previous tab/route (Sprint A C1 wired `router.back()`).
- [ ] **MainButton** on Property detail Buy screen: tapping "Buy N — $X.XX" triggers a TonConnect modal (testnet). Confirm the modal opens and, on confirm/reject, the toast renders ("Buy confirmed (simulated)" / "Buy failed"). Haptic fires on impact + notification.
- [ ] **Haptics**: tab switches fire `selectionChanged`; Buy confirm fires `impact("medium")` + `notification("success")` or `note("error")`.
- [ ] **Viewport expand**: the WebApp expands on mount (no scroll bounce on the bottom safe-area).
- [ ] **Theme**: with the Telegram theme toggle OFF, the app stays DigiHouse static dark; ON, the app re-themes to the user's Telegram palette.
- [ ] **Orientation change** (mobile): no layout collapse; the MainButton stays bottom-most; blocks re-gutter.

## 3. Known things to eyeball (unit tests can't catch these)

- [ ] **OrderBook best-row accent band**: the `bg-accent -mx-4 px-4` strip spans full-width inside the Block's `overflow-hidden` rounded corners — no horizontal overflow, the strip meets the center divider cleanly.
- [ ] **Earnings disclosure alignment**: the 48px lead spacer puts the disclosure content exactly under the property name; the hairline stays flush across the 16px inset.
- [ ] **FundingBar**: the scaleX fill animates 280ms left-to-right on first reveal; under `prefers-reduced-motion` it renders instantly (no animation).
- [ ] **Toast**: the Buy toast enters 200ms ease-out, exits 160ms (faster); top-center, `mt-[max(env(safe-area-inset-top),8px)]`; auto-dismisses in 3s.
- [ ] **Skeleton → content swap**: instant (no cross-fade on entire screens). The skeleton matches the final shape so nothing jumps.

## 4. Honest-copy spot-checks (re-verify nothing regressed)

- [ ] Earnings top: `"simulated weekly payout · on-chain verifiable post-MVP"` renders ONCE.
- [ ] Settings bottom: the same disclaimer renders ONCE.
- [ ] Portfolio: NO disclaimer (per design).
- [ ] Buy toast text: `"Buy confirmed (simulated)"` (never `"Buy confirmed"` alone — the `(simulated)` suffix is the honesty contract).
- [ ] Paid Earnings entry: `"Paid"` pill + muted `"simulated"` capsule; expanding shows `"Simulated payout · tx hash is a placeholder"`.
- [ ] No screen anywhere claims rent "landed in your wallet", is "on-chain", or is "verifiable now".
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/property/[id]/page.tsx" docs/qa/visual-qa-checklist.md
git commit -m "fix(phase3-sprint-d): explicit MainButton brand colors + visual QA checklist (real-Telegram polish)"
```
Expected: green.

---

## Self-Review (spec coverage)

- **Component/integration tests with RTL + jsdom (covering key screens and honesty contract)** → Tasks 1–4. Task 1 the harness; Task 2 honesty (StatusPill simulated, EarningsEntryRow Paid/Pending disclosure, MyPositionBlock PnL up/down); Task 3 presentational render (OrderBook 3-cols, FundingBar scaleX + easing token, EmptyState 120px, Toggle a11y, WalletBadge disconnected); Task 4 page integration (Earnings disclaimer once, Portfolio paid-green/pending-neutral honesty, Settings disclaimer + toggle). ✅
- **Visual QA notes for 360/390/480px viewports** → Task 5 Step 3 (`docs/qa/visual-qa-checklist.md` §1). ✅
- **Any remaining polish for real Telegram environment** → Task 5 Step 1 (MainButton explicit `color`/`textColor` brand tokens) + the checklist §2 (real-TG behavior smoke) + §3 (eyeball items). ✅

**Placeholder scan:** No "TBD/TODO/later". Every test step shows the exact test code. ✅
**Type consistency:** `EarningsSummary`/`EarningsEntry`/`PortfolioSummary`/`Holding`/`OrderBookState`/`Order` field names match the existing `src/types/**` definitions (verified in recon). `useTelegram`/`useTonConnect`/`useSettingsStore` mock shapes match the existing hook signatures. ✅
**Honesty preservation:** the tests ASSERT the honesty contract — they do not weaken it. The Task 5 MainButton color change touches only brand hexes, no payout copy. ✅
**Out of scope (deferred):** Property-detail page integration test (heavier hook-mock surface), Marketplace/Home page integration tests (presentational components + seed integrity already covered), E2E smoke (playwright not installed), visual regression snapshots. These are tracked as future work, not Sprint D finding.

---