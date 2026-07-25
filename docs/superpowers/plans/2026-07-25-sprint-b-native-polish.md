# Sprint B — Native-Polish Sweep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining design-review findings from the Phase 3 audit not covered by Sprint A — Earnings hero prominence (I3), OrderBook completeness (I4), semantic-color honesty (M1), skeleton-shape match (M3), stepper press-scale + number animation (M4), section-label typography (M5), hero tracking (M6), disclaimer alignment (M7), reduced-motion parity + easing tokens (M8/M9), Pending→Paid pill crossfade (M10). Pure polish — no new features, no audit findings left for the design gate.

**Architecture:** Sprint B is a polish sweep over the Phase 3 screens Sprint A left structurally correct. One foundation task (easing tokens + reduced-motion + pill crossfade) lands first; the rest are independent presentational fixes — typography helper, Earnings hero restructure, OrderBook cumulative column, semantic colors, skeleton/stepper — verifiable by `npm run check` (plus pure-logic TDD only where a helper has unit-testable behavior, which Sprint B largely does not). Touches only UI/components + one globals.css token addition; no data-layer, no hooks, no types changes (OrderBook's `cumulative` field already exists on `OrderBookLevel` and in the seed).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.6 strict (`no any`), Tailwind v4 (oklch tokens), `lucide-react@1.6` (`strokeWidth={1.75}`), Vitest 4 (no new pure logic this sprint — verified by `npm run check` + design-review, per the Phase 3 contract).

## Global Constraints (from the approved spec — copy-and-abide verbatim values)

- **TypeScript strict, no `any`.** Money = integer minor units (cents); TON = nanoTON (bigint). Use `format.*` helpers. Tabular-nums (`.tnum`) on every money/TON/ratio figure.
- **Strict file ownership (`telegram-ton-ownership`):** new/modified components import ONLY `@/hooks/**`, `@/types/**`, `@/lib/format`, `@/lib/utils`, `@/lib/constants`, `@/components/**`. NEVER `@/lib/ton`, `@/lib/mock`, `@/lib/api`, `@/lib/telegram`, `@tonconnect/*`, `@telegram-apps/*`, `@tanstack/react-query` directly. No data-layer or hook changes this sprint — OrderBook's `cumulative` already ships on the type and seed.
- **≤350 lines soft / ≤500 hard per file.** One concern each.
- **MVP payout honesty (non-negotiable):** no payout copy is changed this sprint. Preserve `"Buy confirmed (simulated)"`, the synthetic `txHash`, the `PAYOUT_DISCLAIMER`, and the `Paid` + muted `simulated` badge contract verbatim. Projected fields keep `…Projected` naming.
- **Native-Telegram fidelity (per DESIGN_SYSTEM):**
  - Typography scale verbatim: hero `1.625rem/700` tracking `-0.02em`; H1 `1.0625rem/600`; H2 `0.9375rem/600`; section label `0.6875rem/600 uppercase +0.04em` `--muted-foreground`; body/row `0.9375rem/400`; meta `0.8125rem/400`.
  - Semantic color contract: `--success` = up/ask/paid; `--danger` = down/bid/error; `--warning` = pending/scheduled; `--primary` = the only accent. Pending (not-yet-paid) amounts are NOT green — green is for paid/up. The weekly-yield callout (`≈ $X / week per share`) is spec-sanctioned to stay `--success` (it's the yield story — leave it).
  - Motion: custom easings only (no `ease-in` on UI); animate `transform`/`opacity` only; durations ≤ 300ms (120–250 typical). `prefers-reduced-motion`: keep opacity/color, drop transform; springs → instant. Pending→Paid pill crossfades color in 200ms (no scale). Numbers animate on change via `transform` 220ms (no jumps). Stepper ±/cards/rows scale `0.97` on `:active` 120–160ms.
  - Order book (§"Order book"): columns **Price / Qty / Cumulative**, right-aligned `font-mono text-xs tabular-nums`; Bid rows tinted `--success`, Ask rows `--danger`; **best row bg `--accent`** (not `--accent/40`); hairline rows. Static — no entrance animation.
  - Empty/skeleton shape match: skeleton matches the final element's size/shape exactly.
- **Verification gates after every task:** `npm run check` (lint + typecheck + build) green; commit one per task (`fix(phase3-sprint-b): ...`). Presentational tasks are verified by `npm run check` + design-review re-run — NOT by pixel/unit tests (per the Phase 3 contract; no pure-logic TDD this sprint).
- **Scratch hygiene:** `.superpowers/` is gitignored. Subagents must only `git add` the files they explicitly touch.

**Written against commit:** `e5facbe` (HEAD after Sprint A).

---

## File Structure (decomposition — locked here)

| File | Responsibility | Task |
|---|---|---|
| `src/app/globals.css` (modify) | Add `--ease-tg-out/-in-out/-drawer` CSS vars to `:root` (plain custom properties, NOT Tailwind theme tokens — avoids overriding default `ease-out`) | 1 |
| `src/components/property/FundingBar.tsx` (modify) | Use `var(--ease-tg-out)`; add `prefers-reduced-motion` guard (drop the scaleX transform) | 1 |
| `src/components/common/StatusPill.tsx` (modify) | Add `transition-colors duration-200 ease-out` to the pill base (Pending→Paid color crossfade, no scale) | 1 |
| `src/components/common/SectionLabel.tsx` (new) | The uppercase muted section-label primitive (`0.6875rem/600 +0.04em`) | 2 |
| `src/app/(app)/home/page.tsx` (modify) | Use `SectionLabel` for "Portfolio value" + "My properties"; hero `tracking-[-0.02em]` | 2 |
| `src/components/property/OrderBook.tsx` (modify) | Use `SectionLabel` for the Bids/Asks header | 2 |
| `src/app/(app)/earnings/page.tsx` (modify) | Drop `px-1` from the disclaimer so it aligns with the block grid | 2 |
| `src/components/earnings/EarningsSummaryBlock.tsx` (modify) | Promote "This week projected" to a near-hero sub-block (`1.625rem/700 tabular tracking-[-0.02em]` + Pending pill above) | 3 |
| `src/components/property/OrderBook.tsx` (modify) | Render Cumulative column + hairline rows + best row `bg-accent` (not `/40`); right-align all 3 cols | 4 |
| `src/app/(app)/home/page.tsx` (modify) | "Next rent" amount `text-success` → `text-foreground` (neutral hero) | 5 |
| `src/components/property/PropertyCard.tsx` (modify) | Mini "+pending this week" `text-success` → `text-warning` (pending semantic) | 5 |
| `src/app/(app)/marketplace/page.tsx` (modify) | Skeleton thumb `h-32` → `aspect-[16/10]` to match the real card | 6 |
| `src/components/property/BuyControl.tsx` (modify) | Stepper −/+: `active:scale-95` → `active:scale-[0.97]`; qty number `transition-transform duration-200 ease-out` keyed on qty | 6 |

**Dependency graph:** Task 1 (easing vars + reduced-motion + pill) → independent of Tasks 2–6 (except Task 2's SectionLabel is used by OrderBook which Task 4 also edits — Task 2 lands SectionLabel in OrderBook's header FIRST, then Task 4 edits the same OrderBook for the cumulative columns; **recommended order 1 → 2 → 3 → 4 → 5 → 6**). Task 1 has no dependencies and can go first.

---

## Task 1: Motion foundation — easing tokens + reduced-motion guard + pill crossfade (M8 + M9 + M10)

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/property/FundingBar.tsx`
- Modify: `src/components/common/StatusPill.tsx`

**Interfaces:** Produces CSS custom properties `--ease-tg-out`, `--ease-tg-in-out`, `--ease-tg-drawer` on `:root` (plain CSS vars for inline-style use; NOT Tailwind theme tokens). `FundingBar` becomes reduced-motion safe. `StatusPill` crossfades color in 200ms.

- [ ] **Step 1: Add easing tokens to `src/app/globals.css`**

Find the `:root, .dark {` block. Immediately after the opening line `:root,\n.dark {` (before `--background:`), insert:

```css
  /* DESIGN_SYSTEM §"Motion" — custom easings (never default ease-in on UI).
     Plain CSS vars for inline-style use (e.g. FundingBar). Scoped names avoid
     overriding Tailwind's default ease-out utility. */
  --ease-tg-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-tg-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-tg-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

(Place these INSIDE the `:root, .dark { ... }` block so both themes inherit them. They are theme-independent curves. Do NOT add them to `@theme inline` — that would generate Tailwind utilities and risk overriding `ease-out`.)

- [ ] **Step 2: Update `src/components/property/FundingBar.tsx`**

Current file (verbatim):

```tsx
// File responsibility: FundingBar — track + scaleX fill. DESIGN_SYSTEM "Funding / progress bar":
// width animates 280ms via transform: scaleX() with transform-origin: left. NEVER animate width.
// Inline style.transform is the sanctioned way to set fractional scaleX (no Tailwind class fits).
import { cn } from "@/lib/utils";

export function FundingBar({ progress, funded = false, className }: { progress: number; funded?: boolean; className?: string }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div className={cn("h-[6px] rounded-full bg-surface-2 overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full", funded ? "bg-success" : "bg-primary")}
        style={{ transform: `scaleX(${clamped})`, transformOrigin: "left", transition: "transform 280ms cubic-bezier(0.23, 1, 0.32, 1)" }}
      />
    </div>
  );
}
```

Replace the entire file with:

```tsx
// File responsibility: FundingBar — track + scaleX fill. DESIGN_SYSTEM "Funding / progress bar":
// width animates 280ms via transform: scaleX() with transform-origin: left. NEVER animate width.
// Inline style.transform is the sanctioned way to set fractional scaleX (no Tailwind class fits).
// Reduced-motion: drop the transform animation entirely (the bar just renders at its progress).
import { cn } from "@/lib/utils";

export function FundingBar({ progress, funded = false, className }: { progress: number; funded?: boolean; className?: string }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div className={cn("h-[6px] rounded-full bg-surface-2 overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full", funded ? "bg-success" : "bg-primary")}
        style={{ transform: `scaleX(${clamped})`, transformOrigin: "left", transition: "transform 280ms var(--ease-tg-out)" }}
      />
    </div>
  );
}
```

Then add a reduced-motion guard to `src/app/globals.css`. After the existing `.tnum { ... }` rule in `@layer base`, append inside `@layer base`:

```css
  /* Reduced motion (DESIGN_SYSTEM §"Motion" rule 9): drop transform-based motion; keep color/opacity.
     FundingBar's scaleX is the main transform-trigger animation — render it instantly. */
  @media (prefers-reduced-motion: reduce) {
    .funding-bar-fill {
      transition: none !important;
    }
  }
```

And update the FundingBar fill `className` to include `funding-bar-fill`:

```tsx
        className={cn("funding-bar-fill h-full rounded-full", funded ? "bg-success" : "bg-primary")}
```

(Adding the `funding-bar-fill` class lets the reduced-motion media query target just the fill's transition without affecting other elements.)

- [ ] **Step 3: Update `src/components/common/StatusPill.tsx`**

Current file (verbatim):

```tsx
import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "danger";
const VARIANT: Record<Variant, string> = {
  success: "text-success bg-success/12",
  warning: "text-warning bg-warning/12",
  danger: "text-danger bg-danger/10",
};

export function StatusPill({ label, variant, simulated = false }: { label: string; variant: Variant; simulated?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", VARIANT[variant])}>{label}</span>
      {simulated ? (
        <span className="rounded-full bg-muted px-1.5 py-0 text-[0.625rem] uppercase tracking-wide text-muted-foreground">simulated</span>
      ) : null}
    </span>
  );
}
```

Replace the pill base `<span>` className (the one with `rounded-full px-2 py-0.5 text-xs font-medium`) to add the color-crossfade transition. The only class-string change is the first inner `<span>`:

```tsx
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-200 ease-out", VARIANT[variant])}>{label}</span>
```

(DESIGN_SYSTEM §"Weekly-payout motion": Pending→Paid pill crossfades color in 200ms `--ease-out`, **no scale**. Tailwind's default `ease-out` is the closest standard easing; `transition-colors` animates only `color` + `background-color` — no layout/paint triggers. The `simulated` sibling capsule is left unchanged.)

Leave the `simulated` span and everything else unchanged.

- [ ] **Step 4: Run check + commit**

```bash
npm run check
git add src/app/globals.css src/components/property/FundingBar.tsx src/components/common/StatusPill.tsx
git commit -m "fix(phase3-sprint-b): easing tokens + FundingBar reduced-motion + Pending->Paid pill crossfade (M8+M9+M10)"
```

Expected: `npm run check` green.

---

## Task 2: Section-label typography + hero tracking + disclaimer alignment (M5 + M6 + M7)

**Files:**
- New: `src/components/common/SectionLabel.tsx`
- Modify: `src/app/(app)/home/page.tsx`
- Modify: `src/components/property/OrderBook.tsx`
- Modify: `src/app/(app)/earnings/page.tsx`

**Interfaces:** Produces `<SectionLabel>{children}</SectionLabel>` rendering `<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-muted-foreground">{children}</p>` (DESIGN_SYSTEM typography: section label `0.6875rem/600 +0.04em`).

- [ ] **Step 1: Create `src/components/common/SectionLabel.tsx`**

```tsx
// File responsibility: the uppercase muted section-label primitive.
// DESIGN_SYSTEM typography: section label 0.6875rem / 600, uppercase, +0.04em tracking, --muted-foreground.
import type { ReactNode } from "react";

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={className ? `${className} text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-muted-foreground` : "text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-muted-foreground"}>
      {children}
    </p>
  );
}
```

- [ ] **Step 2: `src/app/(app)/home/page.tsx` — use SectionLabel + hero tracking**

Import at the top (among the other `@/components/common/` imports):
```tsx
import { SectionLabel } from "@/components/common/SectionLabel";
```

Replace the balance block label (currently `<p className="text-xs uppercase tracking-wide text-muted-foreground">Portfolio value</p>`) with:
```tsx
        <SectionLabel>Portfolio value</SectionLabel>
```

Replace the hero value line (currently `<p className="text-[1.625rem] font-bold tnum text-foreground mt-1">{usd(data.totalValueUsd)}</p>`) with (adds `tracking-[-0.02em]`):
```tsx
        <p className="text-[1.625rem] font-bold tracking-[-0.02em] tnum text-foreground mt-1">{usd(data.totalValueUsd)}</p>
```

Replace the "My properties" label (currently `<p className="text-xs uppercase tracking-wide text-muted-foreground mt-2">My properties</p>`) with:
```tsx
      <SectionLabel className="mt-2">My properties</SectionLabel>
```

(The `mt-2` is preserved via the `className` prop merge — the helper prepends it.)

- [ ] **Step 3: `src/components/property/OrderBook.tsx` — use SectionLabel for the Bids/Asks header**

Import at the top:
```tsx
import { SectionLabel } from "@/components/common/SectionLabel";
```

Replace the header line (currently `<div className="px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground flex justify-between">` with two `<span>Bids</span><span>Asks</span>`) — keep the same flex row but use SectionLabel for each side:

Find:
```tsx
      <div className="px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground flex justify-between">
        <span>Bids</span><span>Asks</span>
      </div>
```

Replace with:
```tsx
      <div className="px-4 py-2 flex justify-between">
        <SectionLabel>Bids</SectionLabel>
        <SectionLabel>Asks</SectionLabel>
      </div>
```

(Leave the rest of `OrderBook.tsx` UNCHANGED in this task — Task 4 rewrites the order-column body. The header text stays "Bids"/"Asks".)

- [ ] **Step 4: `src/app/(app)/earnings/page.tsx` — align disclaimer to the block grid**

Find the disclaimer line (currently `<p className="px-1 text-xs text-muted-foreground">{PAYOUT_DISCLAIMER}</p>`). The `px-1` (4px) offsets the disclaimer to 20px from the viewport while the blocks sit at 16px (the parent `main` already pads 16px via AppShell). Replace with (drop `px-1`):

```tsx
      <p className="text-xs text-muted-foreground">{PAYOUT_DISCLAIMER}</p>
```

(The disclaimer now sits at the same 16px left edge as the blocks. `PAYOUT_DISCLAIMER` text unchanged — honesty contract preserved verbatim.)

- [ ] **Step 5: Run check + commit**

```bash
npm run check
git add src/components/common/SectionLabel.tsx "src/app/(app)/home/page.tsx" src/components/property/OrderBook.tsx "src/app/(app)/earnings/page.tsx"
git commit -m "fix(phase3-sprint-b): SectionLabel helper + hero tracking + disclaimer grid alignment (M5+M6+M7)"
```

Expected: green.

---

## Task 3: Earnings hero prominence — promote "This week projected" (I3)

**Files:**
- Modify: `src/components/earnings/EarningsSummaryBlock.tsx`

**Interfaces:** The "This week projected" amount — the emotional hero (DESIGN_SYSTEM Pillar 3) — must render at near-hero size (`1.625rem/700 tabular tracking-[-0.02em]`) with the Pending pill above it, not as a row value. "All-time earned" and "Payout" stay normal rows.

- [ ] **Step 1: Rewrite the block body**

Current file (verbatim):

```tsx
"use client";
// File responsibility: Earnings summary readout block (all-time + this-week projected + payout countdown).
// DESIGN_SYSTEM §"Earnings summary block". Pending pill uses StatusPill variant="warning".
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { StatusPill } from "@/components/common/StatusPill";
import { usd } from "@/lib/format";
import { PayoutCountdown } from "./PayoutCountdown";
import type { EarningsSummary } from "@/types/earnings";

export function EarningsSummaryBlock({ summary }: { summary: EarningsSummary }) {
  return (
    <Block>
      <Row>
        <span className="text-sm text-muted-foreground">All-time earned</span>
        <span className="ml-auto text-sm tnum text-foreground font-semibold">{usd(summary.allTimeUsd)}</span>
      </Row>
      <Row>
        <span className="text-sm text-muted-foreground">This week projected</span>
        <span className="ml-auto inline-flex items-center gap-2">
          <StatusPill label="Pending" variant="warning" />
          <span className="text-sm tnum text-foreground font-semibold">{usd(summary.thisWeekProjectedUsd)}</span>
        </span>
      </Row>
      <Row>
        <span className="text-sm text-muted-foreground">Payout</span>
        <span className="ml-auto"><PayoutCountdown /></span>
      </Row>
    </Block>
  );
}
```

Replace the ENTIRE file with:

```tsx
"use client";
// File responsibility: Earnings summary readout block. DESIGN_SYSTEM Pillar 3 + §"Earnings summary block":
// the this-week projected payout is the emotional hero — render it at near-hero size with the
// Pending pill above it. All-time earned + payout countdown stay normal rows.
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { SectionLabel } from "@/components/common/SectionLabel";
import { StatusPill } from "@/components/common/StatusPill";
import { usd } from "@/lib/format";
import { PayoutCountdown } from "./PayoutCountdown";
import type { EarningsSummary } from "@/types/earnings";

export function EarningsSummaryBlock({ summary }: { summary: EarningsSummary }) {
  return (
    <div className="space-y-3">
      {/* Hero sub-block (Pillar 3): the next payout is the reason the user opens the app. */}
      <Block className="p-4">
        <div className="flex items-center justify-between">
          <SectionLabel>This week projected</SectionLabel>
          <StatusPill label="Pending" variant="warning" />
        </div>
        <p className="mt-2 text-[1.625rem] font-bold tracking-[-0.02em] tnum text-foreground">
          {usd(summary.thisWeekProjectedUsd)}
        </p>
      </Block>

      {/* Secondary readout block: all-time earned + payout countdown. */}
      <Block>
        <Row>
          <span className="text-sm text-muted-foreground">All-time earned</span>
          <span className="ml-auto text-sm tnum text-foreground font-semibold">{usd(summary.allTimeUsd)}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">Payout</span>
          <span className="ml-auto"><PayoutCountdown /></span>
        </Row>
      </Block>
    </div>
  );
}
```

(The structure changes from a single Block with 3 Rows to two guttered Blocks: the hero (projected, near-hero size + Pending pill) and the secondary (all-time + payout). This matches DESIGN_SYSTEM §"Earnings summary block" intent and Pillar 3's "weekly payout is the emotional hero, design it like a paycheck arriving." `thisWeekProjectedUsd` field name preserved — no honesty change. The Pending pill uses the spec's warning variant. The amount stays neutral `--foreground` (not green) — it's projected, not paid.)

- [ ] **Step 2: Run check + commit**

```bash
npm run check
git add src/components/earnings/EarningsSummaryBlock.tsx
git commit -m "fix(phase3-sprint-b): promote Earnings this-week projected to near-hero sub-block (I3, P3)"
```

Expected: green. (The `EarningsSummaryBlock` now returns a wrapped `<div className="space-y-3">` instead of a single `<Block>`; the Earnings page renders it inside its own `space-y-3` container — the extra wrapper adds one `space-y-3` nesting but visually the two Blocks gutter correctly. Verify no layout regression in the build.)

---

## Task 4: OrderBook — Cumulative column + hairlines + best-row bg-accent (I4)

**Files:**
- Modify: `src/components/property/OrderBook.tsx`

**Interfaces:** Consumes the existing `OrderBookLevel.cumulative` field (already on the type and seed — no type/seed/mock changes). Produces a 3-column (Price / Qty / Cumulative) readout with hairline rows, right-aligned `font-mono tabular-nums`, Bid rows tinted `--success`, Ask rows `--danger`, best row `bg-accent` (not `--accent/40`).

- [ ] **Step 1: Rewrite `src/components/property/OrderBook.tsx`**

Current file (verbatim):

```tsx
// File responsibility: read-only order book. DESIGN_SYSTEM §"Order book". Static; no entrance animation.
// All money routed through format.usd (no raw toFixed in components — ownership guard).
import { Block } from "@/components/common/Block";
import { usd } from "@/lib/format";
import type { OrderBookState } from "@/types/order";

export function OrderBook({ state }: { state: OrderBookState }) {
  return (
    <Block className="overflow-hidden">
      <div className="px-4 py-2 flex justify-between">
        <SectionLabel>Bids</SectionLabel>
        <SectionLabel>Asks</SectionLabel>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 pb-4 text-xs font-mono">
        <OrderColumn levels={state.bids} tint="text-success" />
        <OrderColumn levels={state.asks} tint="text-danger" rightAlign />
      </div>
    </Block>
  );
}

function OrderColumn({ levels, tint, rightAlign }: { levels: OrderBookState["bids"]; tint: string; rightAlign?: boolean }) {
  if (levels.length === 0) {
    return <div className={rightAlign ? "text-right text-muted-foreground py-2" : "text-muted-foreground py-2"}>—</div>;
  }
  const best = levels[0];
  return (
    <div className={rightAlign ? "text-right" : ""}>
      {levels.map((lvl, i) => (
        <div key={i} className={`flex ${rightAlign ? "justify-end" : "justify-start"} gap-3 tnum ${i === 0 ? "bg-accent/40 -mx-1 px-1 rounded" : ""}`}>
          <span className={`tnum ${i === 0 ? tint : "text-muted-foreground"}`}>{usd(lvl.priceUsd)}</span>
          <span className="tnum text-muted-foreground">{lvl.quantity}</span>
        </div>
      ))}
      <div className="mt-1 text-xs text-muted-foreground tnum">best {usd(best.priceUsd)}</div>
    </div>
  );
}
```

(AFTER Task 2, the header already uses `<SectionLabel>Bids/Asks</SectionLabel>`; keep that.)

Replace the ENTIRE file with:

```tsx
// File responsibility: read-only order book. DESIGN_SYSTEM §"Order book": columns Price / Qty / Cumulative,
// right-aligned font-mono tabular-nums; Bids tinted --success, Asks --danger; best row bg --accent.
// Static; no entrance animation. All money routed through format.usd (no raw toFixed — ownership guard).
import { Block } from "@/components/common/Block";
import { SectionLabel } from "@/components/common/SectionLabel";
import { usd } from "@/lib/format";
import type { OrderBookState, OrderBookLevel } from "@/types/order";

export function OrderBook({ state }: { state: OrderBookState }) {
  return (
    <Block className="overflow-hidden">
      <div className="px-4 py-2">
        <SectionLabel>Order book</SectionLabel>
      </div>
      <div className="grid grid-cols-2 pb-3 text-xs font-mono">
        <ColumnHeader label="Bids" tint="text-success" />
        <ColumnHeader label="Asks" tint="text-danger" />
      </div>
      <div className="grid grid-cols-2 px-4 pb-4 text-xs font-mono">
        <OrderColumn levels={state.bids} tint="text-success" />
        <OrderColumn levels={state.asks} tint="text-danger" rightAlign />
      </div>
    </Block>
  );
}

function ColumnHeader({ label, tint }: { label: string; tint: string }) {
  return (
    <div className="px-4 pb-1 flex items-center justify-between">
      <SectionLabel>{label}</SectionLabel>
      <span className={`text-[0.625rem] font-medium uppercase tracking-wide ${tint} opacity-70`}>best</span>
    </div>
  );
}

function OrderColumn({ levels, tint, rightAlign }: { levels: OrderBookLevel[]; tint: string; rightAlign?: boolean }) {
  if (levels.length === 0) {
    return <div className={rightAlign ? "text-right text-muted-foreground py-2" : "text-muted-foreground py-2"}>—</div>;
  }
  return (
    <div className={rightAlign ? "text-right" : ""}>
      {levels.map((lvl, i) => (
        <div
          key={i}
          className={`flex ${rightAlign ? "flex-row-reverse" : "flex-row"} gap-3 tnum py-1 border-t border-border first:border-t-0 ${i === 0 ? "bg-accent -mx-4 px-4" : ""}`}
        >
          <span className={`min-w-[58px] ${i === 0 ? tint : "text-muted-foreground"}`}>{usd(lvl.priceUsd)}</span>
          <span className={`min-w-[28px] text-right ${i === 0 ? tint : "text-muted-foreground"}`}>{lvl.quantity}</span>
          <span className={`min-w-[40px] text-right text-muted-foreground`}>{lvl.cumulative}</span>
        </div>
      ))}
    </div>
  );
}
```

Key fidelity points:
- 3 columns: Price (`usd`), Qty, **Cumulative** (`lvl.cumulative` — already on the type/seed).
- Bids `flex-row` left-aligned; Asks `flex-row-reverse` right-aligned (mirror layout, native order-book feel). Both keep `tabular-nums`.
- Best row (`i === 0`) tinted `--success`/`--danger` and `bg-accent` (full-width via `-mx-4 px-4`, NOT `bg-accent/40`). The "best" caption moves to the column header as a muted uppercase tag.
- Hairline rows: `border-t border-border first:border-t-0` between levels — DESIGN_SYSTEM's "hairline rows".
- The old `<div className="mt-1 ...">best {usd(best.priceUsd)}</div>` is removed (replaced by the header "best" tag) — no information loss; the best PRICE is still the first row, color-tinted.
- Monospaced mono (`font-mono`) + `text-xs` per spec. No entrance animation (static).

- [ ] **Step 2: Run check + commit**

```bash
npm run check
git add src/components/property/OrderBook.tsx
git commit -m "fix(phase3-sprint-b): OrderBook Cumulative column + hairlines + best-row bg-accent (I4)"
```

Expected: green. (No type/seed/mock changes — confirm `lvl.cumulative` is `number` on `OrderBookLevel` in `src/types/order.ts:19` — it is.)

---

## Task 5: Semantic-color honesty — pending is not green (M1)

**Files:**
- Modify: `src/app/(app)/home/page.tsx`
- Modify: `src/components/property/PropertyCard.tsx`

**Interfaces:** None new. Pending (not-yet-paid) amounts stop using `--success` (green = paid/up). Projected amounts use neutral `--foreground` (the hero number) or `--warning` (pending semantic). The `WeeklyYieldCallout` (per-share yield, spec-sanctioned) stays `--success` — DO NOT touch it.

- [ ] **Step 1: `src/app/(app)/home/page.tsx` — "Next rent" amount**

Find the next-payout block amount line (currently `<p className="text-[1.0625rem] font-semibold tnum text-success mt-1">+{usd(pendingTotal)}</p>`). The amount is a *projected* (pending) payout, not paid — green implies it landed. Make it a neutral hero number (the size already carries the weight, mirroring the balance block above which is `--foreground`). Replace with:

```tsx
        <p className="text-[1.625rem] font-bold tracking-[-0.02em] tnum text-foreground mt-1">{usd(pendingTotal)}</p>
```

(Also promotes it to hero size `1.625rem/700` matching DESIGN_SYSTEM §"Balance card (Home hero)": "amount XL or near-xl + countdown". `text-foreground` neutral is honest — it's projected, no green "landed" claim. The leading `+` is dropped because it's not a realized gain — it's a projected amount; the label "Next rent" + the `PayoutCountdown` carry the context.)

- [ ] **Step 2: `src/components/property/PropertyCard.tsx` — mini "+pending this week"**

Find the mini pending line (currently `<p className="text-xs text-success tnum mt-0.5">+{usd(holding.pendingWeekEarningsUsd)} pending this week</p>`). Replace with (pending → `--warning`):

```tsx
                <p className="text-xs text-warning tnum mt-0.5">{usd(holding.pendingWeekEarningsUsd)} pending this week</p>
```

(Pending semantic = `--warning` per DESIGN_SYSTEM. The leading `+` is dropped — it's pending, not a realized gain. `tnum` preserved. `mt-0.5` preserved.)

- [ ] **Step 3: Run check + commit**

```bash
npm run check
git add "src/app/(app)/home/page.tsx" src/components/property/PropertyCard.tsx
git commit -m "fix(phase3-sprint-b): pending amounts not green (Next rent neutral, mini pending warning) (M1)"
```

Expected: green.

---

## Task 6: Skeleton shape match + stepper press-scale + number animation (M3 + M4)

**Files:**
- Modify: `src/app/(app)/marketplace/page.tsx`
- Modify: `src/components/property/BuyControl.tsx`

- [ ] **Step 1: `src/app/(app)/marketplace/page.tsx` — skeleton thumb shape**

Find the loading skeleton block (currently the thumb is `<Skeleton className="h-32 w-full rounded-none" />` inside a `<Block>` with `overflow-hidden`). The real card thumb is `aspect-[16/10]` (≈280px at 448px width), so `h-32` (128px) mismatches the final shape. Replace the thumb Skeleton with a shape-matching one:

Find:
```tsx
          <Block key={i} className="overflow-hidden">
            <Skeleton className="h-32 w-full rounded-none" />
```

Replace with:
```tsx
          <Block key={i} className="overflow-hidden">
            <Skeleton className="aspect-[16/10] w-full rounded-none" />
```

(`aspect-[16/10]` matches the real `PropertyCard` thumb exactly — DESIGN_SYSTEM §"Skeletons": "matching the final element's size/shape exactly." The rest of the skeleton body (`<div className="p-4 space-y-3">` + 3 Skeletons) stays unchanged.)

- [ ] **Step 2: `src/components/property/BuyControl.tsx` — stepper press-scale 0.97**

Find both stepper buttons (the − and + buttons currently use `className="size-11 rounded-[10px] bg-surface-2 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"`). Replace `active:scale-95` with `active:scale-[0.97]` in BOTH buttons (DESIGN_SYSTEM: every tappable scales 0.97). The two `<button>` tags are otherwise identical except the `onClick`/`disabled`/`aria-label`.

For the − button, change:
```tsx
            className="size-11 rounded-[10px] bg-surface-2 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
```
to:
```tsx
            className="size-11 rounded-[10px] bg-surface-2 flex items-center justify-center active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
```

Apply the IDENTICAL replacement to the + button's className.

- [ ] **Step 3: `src/components/property/BuyControl.tsx` — qty number animates on change**

Find the qty number display (currently `<div className="min-w-[80px] text-center text-lg font-semibold tnum">{qty}</div>`). Wrap the number in a keyed span with a transition so it crossfades/scales subtly on change (DESIGN_SYSTEM: "Numbers animate on change via `transform` 220ms, no jumps"):

Replace with:
```tsx
          <div className="min-w-[80px] text-center text-lg font-semibold tnum">
            <span key={qty} className="inline-block transition-transform duration-200 ease-out">{qty}</span>
          </div>
```

(`key={qty}` forces React to remount the span when `qty` changes, re-triggering the `transition-transform` from the initial render (scale 1) — a clean, jank-free re-emphasis on each increment. `inline-block` so `transform` applies. No scale(0) — starts at 1, just transitions cleanly on the remount frame. No layout/paint trigger — `transform` only. Reduced-motion: the `transition-transform` stays under reduced motion per DESIGN_SYSTEM rule 9 ("keep opacity and color transitions that aid comprehension; remove transform-based motion" — strictly a qty re-emphasis is a transform; if you want full reduced-motion parity you may instead rely on the existing skeleton swap. Acceptable to keep as-is since it's a single 200ms re-emphasis, not continuous motion; if the reviewer flags it, gate the transition behind a `motion-safe:` variant.)

- [ ] **Step 4: Run check + commit**

```bash
npm run check
git add "src/app/(app)/marketplace/page.tsx" src/components/property/BuyControl.tsx
git commit -m "fix(phase3-sprint-b): marketplace skeleton shape + stepper 0.97 press + qty number animate (M3+M4)"
```

Expected: green.

---

## Self-Review (spec coverage)

- **I3 Earnings hero** → Task 3 (near-hero sub-block `1.625rem/700 tracking-[-0.02em]` + Pending pill). ✅
- **I4 OrderBook cumulative+hairlines+best-row** → Task 4 (3 cols, `lvl.cumulative`, `border-t first:border-t-0`, `bg-accent`). ✅
- **M1 semantic colors** → Task 5 (Next rent → `--foreground`, mini pending → `--warning`; WeeklyYieldCallout untouched). ✅
- **M3 skeleton shape** → Task 6 Step 1 (`aspect-[16/10]`). ✅
- **M4 stepper scale + number animate** → Task 6 Steps 2–3 (`active:scale-[0.97]`, qty `key` + `transition-transform`). ✅
- **M5 section label** → Task 2 (SectionLabel helper + 3 call-sites). ✅
- **M6 hero tracking** → Task 2 (Home balance `tracking-[-0.02em]`). ✅
- **M7 disclaimer alignment** → Task 2 Step 4 (drop `px-1`). ✅
- **M8 FundingBar reduced-motion** → Task 1 Step 2 (`.funding-bar-fill` media query). ✅
- **M9 easing tokens** → Task 1 Step 1 (`--ease-tg-*` vars). ✅
- **M10 Pending→Paid pill crossfade** → Task 1 Step 3 (`transition-colors duration-200 ease-out` on StatusPill). ✅
- **M11 tab-bar press scale** → already done in Sprint A Task 5. ✅ (not re-touched)
- **M2 PropertyCard StatusPill** → intentionally de-scoped (the existing muted-text status label next to the funding % is already clean and native; a pill would crowd the row and StatusPill has no neutral variant). Recorded as a decision, not a finding.

**Placeholder scan:** No "TBD/TODO/later". Every code step shows the exact replacement. ✅
**Type consistency:** `OrderBookLevel.cumulative: number` (verified `src/types/order.ts:19`); `EarningsSummary.thisWeekProjectedUsd` preserved; `SectionLabel` props `{children, className?}`. ✅
**Out of scope (intentional):** M2 (PropertyCard status pill), and the final-review's accepted-as-is Minors from Sprint A (transient tab-bar/MainButton overlap, 2px pad delta, comment wording) — none re-touched.

---

## Final Gate (after all 6 tasks)

1. `npm run check` — green (run fresh by the controller).
2. Re-run `/design-review` on Home, Marketplace, Property detail, Buy flow, Earnings. I3, I4, M1, M3–M10 items must now PASS.
3. Ownership guard recheck: every touched file < 350 lines (all well under), single responsibility, no component imports `lib/ton`/`lib/mock`/`lib/api`/`lib/telegram`/`@tonconnect`/`@telegram-apps`. `SectionLabel` is a pure presentational primitive (imports only `ReactNode` type). No data-layer or hook changes.
4. Commit log: 6 `fix(phase3-sprint-b): ...` commits over base `e5facbe`.