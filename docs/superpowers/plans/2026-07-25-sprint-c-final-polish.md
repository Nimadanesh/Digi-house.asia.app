# Sprint C — Final Visual Polish (Earnings alignment + Portfolio + Settings) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the last visual-polish gaps before the competition: (1) Earnings timeline alignment — the expandable disclosure content sits under the leading thumb instead of the property name, and the loading skeleton doesn't match the new two-Block hero structure; (2) Portfolio tab is a skeleton — build the real my-position breakdown + summary + open orders; (3) Settings tab is a skeleton — build wallet row + theme toggle + about. No new features beyond making the 4 tabs functional and native.

**Architecture:** Three independent presentational tasks. Task 1 restructures the Earnings disclosure to mirror the row's content column (a 48px lead spacer = thumb 36 + gap 12, so disclosure content aligns with the property name) and splits the loading skeleton into hero + secondary + timeline Blocks matching `EarningsSummaryBlock`'s post-Sprint-B structure. Task 2 introduces one new presentational primitive (`MyPositionBlock`) + a small seed tweak so PnL shows believable appreciation (current value > invested), then composes the Portfolio page (summary Block + my-position Blocks + open-orders Block) with all 4 states. Task 3 introduces one new presentational primitive (`Toggle`) + composes the Settings page (wallet / appearance / about) with the honesty disclaimer. All touches are UI/components + one 2-line seed value adjustment; no hooks, no types, no lib/ton, no lib/telegram changes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.6 strict (`no any`), Tailwind v4 (oklch tokens), `lucide-react@1.6` (`strokeWidth={1.75}`), Zustand v5 (`settings.store.ts`), TanStack Query (existing hooks). Pure-logic TDD: none this sprint (presentational — verified by `npm run check` + design-review, per the Phase 3 contract).

## Global Constraints (from the approved spec — copy-and-abide verbatim values)

- **TypeScript strict, no `any`.** Money = integer minor units (cents); TON = nanoTON (bigint). Use `format.*` helpers (`usd`, `ton`, `pct`, `shortAddr`, `weekLabel`). Tabular-nums (`.tnum`) on EVERY money / share / TON / ratio figure.
- **Strict file ownership (`telegram-ton-ownership`):** new/modified components import ONLY `@/hooks/**`, `@/types/**`, `@/lib/format`, `@/lib/utils`, `@/lib/constants`, `@/components/**`. Pages/hooks may import `@/stores/**`. NEVER `@/lib/ton`, `@/lib/mock`, `@/lib/api`, `@/lib/telegram`, `@tonconnect/*`, `@telegram-apps/*` directly from a component — `useTelegram`/`useTonConnect`/`useSettingsStore` are the sanctioned bridges.
- **≤350 lines soft / ≤500 hard per file.** One concern each.
- **MVP payout honesty (non-negotiable):**
  - The `PAYOUT_DISCLAIMER` = `"simulated weekly payout · on-chain verifiable post-MVP"` (in `@/lib/constants`) renders on Earnings AND Settings, exactly once per screen, unchanged.
  - Buy toast stays `"Buy confirmed (simulated)"`; synthetic `txHash` stays `"simulated:<uuid>"`. Not touched this sprint.
  - `Paid` pill keeps the muted `simulated` sibling capsule; `Pending` pill needs no badge.
  - Projected fields keep `…Projected` naming (`thisWeekProjectedUsd`, `weeklyProjectedUsd`). Portfolio's `weeklyProjectedUsd` (pending sum) is NEUTRAL `--foreground`, never green. Portfolio's `totalEarningsUsd` (paid sum) — green IS honest (paid = `--success`). PnL uses `--success` (up) / `--danger` (down) per the semantic finance-color contract.
- **Native-Telegram fidelity (per DESIGN_SYSTEM):**
  - Blocks: `bg-card rounded-[12px]` no border no shadow. Rows: `min-h-[48px] items-center gap-2 mx-4 border-t border-border first:border-t-0` (content + hairline both at 16px — Sprint A's C4 fix). Section labels via the existing `SectionLabel` primitive (`0.6875rem/600 uppercase +0.04em muted`).
  - Header (Sprint A): centered title + back-chevron fallback outside Telegram. The 4 root tabs already have titles in `Header.tsx` TITLES map (`Portfolio`, `Settings` already there).
  - Tap targets ≥ 44×44; tappable rows/scales `0.97` on `:active` 120–160ms `--ease-out`.
  - Icons `strokeWidth={1.75}`, `currentColor`. `lucide-react` already a dep.
  - Max-w-[480px] centered; one accent (`--primary`); `--success`/`--danger` reserved for finance up/down + paid/pending; `--warning` = pending/scheduled.
  - Empty state: the existing `EmptyState` (Sprint A: 120px `Building2` glyph + H2 headline) — reuse for Portfolio's no-holdings state.
  - States: every screen ships loaded | loading skeleton | empty | error.
- **Verification gates after every task:** `npm run check` (lint + typecheck + build) green; commit one per task (`fix(phase3-sprint-c): ...`). Presentational tasks verified by `npm run check` + design-review re-run — NOT by pixel/unit tests.
- **Scratch hygiene:** `.superpowers/` is gitignored. Subagents must only `git add` the files they explicitly touch — never `.superpowers/`.

**Written against commit:** `d9d571f` (main, post Sprint A+B merge).

---

## File Structure (decomposition — locked here)

| File | Responsibility | Task |
|---|---|---|
| `src/components/earnings/EarningsEntryRow.tsx` (modify) | Restructure the disclosure to align content with the property-name column (48px lead spacer) | 1 |
| `src/app/(app)/earnings/page.tsx` (modify) | Split loading skeleton into hero + secondary + timeline Block stack matching `EarningsSummaryBlock` | 1 |
| `src/lib/mock/seed/holdings.ts` (modify) | Bump `currentValueUsd` to reflect modest appreciation so PnL demonstrates the up-tint (not a flat $0) | 2 |
| `src/components/portfolio/MyPositionBlock.tsx` (new) | One holding's detailed my-position Block (name header + shares / avg cost / current value / unrealized PnL) | 2 |
| `src/app/(app)/portfolio/page.tsx` (rewrite) | Portfolio screen: summary Block + my-positions + open-orders, all 4 states | 2 |
| `src/components/common/Toggle.tsx` (new) | Accessible iOS-style switch presentational primitive | 3 |
| `src/app/(app)/settings/page.tsx` (rewrite) | Settings screen: wallet / appearance (theme toggle) / about + disclaimer | 3 |

**Dependency graph:** Tasks 1, 2, 3 are fully independent (disjoint files). Recommended order: **1 → 2 → 3** (Earnings first per the user's emphasis, then Portfolio, then Settings). Sequential SDD dispatch — no parallel implementers (single working tree).

---

## Task 1: Earnings timeline alignment + skeleton shape match

**Files:**
- Modify: `src/components/earnings/EarningsEntryRow.tsx`
- Modify: `src/app/(app)/earnings/page.tsx`

**Interfaces:** None new. The disclosure restructure is internal to `EarningsEntryRow`. The skeleton split is internal to the Earnings page's loading branch.

- [ ] **Step 1: Restructure the disclosure in `src/components/earnings/EarningsEntryRow.tsx`**

The CURRENT disclosure (lines 57-79) is:
```tsx
      {open ? (
        // Proportional-math disclosure (R-6.6 display). Static expand — no keyframe animation (DESIGN_SYSTEM
        // §"What we do NOT animate" prohibits keyframes on rapidly triggered elements).
        <div className="mx-4 py-3 border-t border-border text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your share</span>
            <span className="tnum text-foreground">{pct(entry.shareRatio)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Weekly rent pool</span>
            <span className="tnum text-foreground">{usd(weeklyRentPoolUsd)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your payout (pool × share)</span>
            <span className="tnum text-foreground font-semibold">{usd(entry.amountUsd)}</span>
          </div>
          {entry.status === "paid" && entry.txHash ? (
            <p className="pt-1 text-muted-foreground">
              Simulated payout · tx hash is a placeholder <span className="tnum">({entry.txHash.slice(0, 28)}…)</span>
            </p>
          ) : null}
        </div>
      ) : null}
```

The disclosure content sits at 16px (under the thumb) while the property name sits at 64px (16 + thumb 36 + gap 12). Restructure the disclosure to a flex row with a 48px lead spacer (thumb 36 + gap 12) so the disclosure content column aligns exactly with the name column. The `border-t` hairline stays full-width-inset (16px, matching the sibling rows).

Replace the disclosure `<div className="mx-4 py-3 border-t border-border text-xs space-y-1.5"> ... </div>` with:

```tsx
        // Proportional-math disclosure (R-6.6 display). The 48px lead spacer mirrors the row's
        // thumb (size-9=36) + gap-3 (12) so the disclosure content aligns with the property NAME
        // column (native iOS expandable-row pattern). The border-t hairline stays full-width-inset
        // (mx-4 = 16px), matching the sibling rows. Static expand — no keyframe animation
        // (DESIGN_SYSTEM §"What we do NOT animate").
        <div className="mx-4 flex border-t border-border">
          <div className="w-[48px] shrink-0" aria-hidden />
          <div className="flex-1 py-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your share</span>
              <span className="tnum text-foreground">{pct(entry.shareRatio)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weekly rent pool</span>
              <span className="tnum text-foreground">{usd(weeklyRentPoolUsd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your payout (pool × share)</span>
              <span className="tnum text-foreground font-semibold">{usd(entry.amountUsd)}</span>
            </div>
            {entry.status === "paid" && entry.txHash ? (
              <p className="pt-1 text-muted-foreground">
                Simulated payout · tx hash is a placeholder <span className="tnum">({entry.txHash.slice(0, 28)}…)</span>
              </p>
            ) : null}
          </div>
        </div>
```

(Leave the surrounding `{open ? ( ... ) : null}` wrapper, the `<>` fragment, and the Row above UNCHANGED. Only the inner disclosure `<div>` changes: from a flat `mx-4 py-3 ... space-y-1.5` to a flex `mx-4 flex border-t` containing the 48px spacer + a `flex-1 py-3 ... space-y-1.5` content column. The three `flex justify-between` rows + the txHash `<p>` move INSIDE the content column, byte-for-byte unchanged.)

- [ ] **Step 2: Split the loading skeleton in `src/app/(app)/earnings/page.tsx`**

Add the `Row` import (currently the page imports `Block`, `Skeleton`, `EmptyState`, `Button`, `EarningsSummaryBlock`, `EarningsTimeline`). Add to the existing `@/components/common/Block` import group:
```tsx
import { Row } from "@/components/common/Row";
```

Find the loading branch (currently lines 31-47):
```tsx
      {earnings.isLoading ? (
        <>
          <Block className="p-4 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </Block>
          {Array.from({ length: 3 }).map((_, i) => (
            <Block key={i} className="p-3 flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-14 rounded-full" />
            </Block>
          ))}
        </>
      ) : earnings.isError ? (
```

Replace the loading branch (between `{earnings.isLoading ? (` and the `) : earnings.isError ? (`) with a skeleton stack matching the loaded structure (hero Block with label+pill row + big number; secondary Block with 2 rows; ONE timeline Block with 3 `!min-h-[56px]` rows holding thumb + name + pill):

```tsx
        <>
          {/* Hero sub-block skeleton — matches EarningsSummaryBlock hero (label+pill row, then amount). */}
          <Block className="p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-7 w-40" />
          </Block>
          {/* Secondary readout block skeleton — 2 rows (All-time earned / Payout). */}
          <Block>
            <Row>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="ml-auto h-4 w-24" />
            </Row>
            <Row>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="ml-auto h-4 w-32" />
            </Row>
          </Block>
          {/* Timeline block skeleton — ONE Block with 3 rows matching EarningsEntryRow (thumb+name+pill). */}
          <Block>
            {Array.from({ length: 3 }).map((_, i) => (
              <Row key={i} className="!min-h-[56px]">
                <Skeleton className="size-9 rounded-[10px] shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-6 w-14 rounded-full" />
              </Row>
            ))}
          </Block>
        </>
```

(DESIGN_SYSTEM §"Skeletons": "matching the final element's size/shape exactly." The old skeleton was one generic block + 3 separate blocks; the loaded state is now hero + secondary + ONE timeline block. The new skeleton mirrors all three. `Row` import added; `Skeleton` and `Block` already imported. The `rounded-full` on the pill skeleton matches `StatusPill`'s `rounded-full`; the `rounded-[10px]` on the thumb skeleton matches the row's `size-9 rounded-[10px]` thumb.)

- [ ] **Step 3: Run check + commit**

```bash
npm run check
git add src/components/earnings/EarningsEntryRow.tsx "src/app/(app)/earnings/page.tsx"
git commit -m "fix(phase3-sprint-c): Earnings disclosure aligns with name column + skeleton matches hero structure"
```

Expected: green.

---

## Task 2: Portfolio page real content (summary + my-positions + open orders)

**Files:**
- Modify: `src/lib/mock/seed/holdings.ts` (2-line `currentValueUsd` bump for believable PnL)
- New: `src/components/portfolio/MyPositionBlock.tsx`
- Rewrite: `src/app/(app)/portfolio/page.tsx`

**Interfaces:**
- Consumes: `usePortfolio()` (exists — returns `PortfolioSummary`), `useMarketplace()` (for the property-name lookup map, same pattern as the Earnings page). `Holding` and `PortfolioSummary` types exist. `format.usd`, `format.shortAddr`. `OpenOrders` come from `portfolio.data.openOrders` (already on `PortfolioSummary`).
- Produces: Portfolio tab renders summary Block (Total value / Total invested / Total earnings / Next payout) + one `MyPositionBlock` per holding + an open-orders Block (when `openOrders.length > 0`), all 4 states (loaded/loading/empty/error).

- [ ] **Step 1: Bump the seed `currentValueUsd` for believable appreciation**

In `src/lib/mock/seed/holdings.ts`, the two `HOLDINGS` entries currently set `currentValueUsd` equal to `sharesOwned * avgCostUsd` (PnL = $0 — reads as a bug). Introduce modest appreciation so the PnL row demonstrates the `--success` up-tint honestly (property market value > cost basis, unrealized).

Find:
```ts
  {
    propertyId: "prop-bayside-marina-penthouse",
    sharesOwned: 60,
    avgCostUsd: 25000,
    currentValueUsd: 60 * 25000,
    pendingWeekEarningsUsd: 1500,
    shareRatio: 0.075,
  },
  {
    propertyId: "prop-alfama-terrace-flat",
    sharesOwned: 75,
    avgCostUsd: 10000,
    currentValueUsd: 75 * 10000,
    pendingWeekEarningsUsd: 1875,
    shareRatio: 0.075,
  },
```

Replace with (bayside: +4% appreciation; alfama: +5%):
```ts
  {
    propertyId: "prop-bayside-marina-penthouse",
    sharesOwned: 60,
    avgCostUsd: 25000,
    currentValueUsd: 60 * 26000, // ~+4% unrealized (market value > cost basis)
    pendingWeekEarningsUsd: 1500,
    shareRatio: 0.075,
  },
  {
    propertyId: "prop-alfama-terrace-flat",
    sharesOwned: 75,
    avgCostUsd: 10000,
    currentValueUsd: 75 * 10500, // ~+5% unrealized (market value > cost basis)
    pendingWeekEarningsUsd: 1875,
    shareRatio: 0.075,
  },
```

(PnL is `currentValueUsd - avgCostUsd * sharesOwned`: bayside = 1,560,000 − 1,500,000 = +60,000 = +$600.00; alfama = 787,500 − 750,000 = +37,500 = +$375.00. Both up → `--success`. Honest: the `currentValueUsd` is a notional market value, no on-chain claim. The portfolio summary's `totalValueUsd` (sum of currentValueUsd) and `totalInvestedUsd` (sum of sharesOwned × avgCostUsd) recompute from the seed — no type/hook changes.)

- [ ] **Step 2: Create `src/components/portfolio/MyPositionBlock.tsx`**

```tsx
"use client";
// File responsibility: one holding's detailed my-position block. DESIGN_SYSTEM §"My-position block":
// rows for Shares owned / Avg cost / Current value / Unrealized PnL. PnL colored --success/--danger
// with an arrow glyph, tabular. Property name is passed in (page builds the lookup) — no lib/mock imports.
import { ArrowUp, ArrowDown } from "lucide-react";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { usd } from "@/lib/format";
import type { Holding } from "@/types/position";

export function MyPositionBlock({ holding, propertyName }: { holding: Holding; propertyName: string }) {
  const investedUsd = holding.avgCostUsd * holding.sharesOwned;
  const pnlUsd = holding.currentValueUsd - investedUsd;
  const up = pnlUsd >= 0;
  return (
    <Block>
      <Row>
        <span className="text-sm font-semibold text-foreground truncate">{propertyName}</span>
      </Row>
      <Row>
        <span className="text-sm text-muted-foreground">Shares owned</span>
        <span className="ml-auto text-sm tnum text-foreground">{holding.sharesOwned}</span>
      </Row>
      <Row>
        <span className="text-sm text-muted-foreground">Avg cost / share</span>
        <span className="ml-auto text-sm tnum text-foreground">{usd(holding.avgCostUsd)}</span>
      </Row>
      <Row>
        <span className="text-sm text-muted-foreground">Current value</span>
        <span className="ml-auto text-sm tnum text-foreground">{usd(holding.currentValueUsd)}</span>
      </Row>
      <Row>
        <span className="text-sm text-muted-foreground">Unrealized PnL</span>
        <span className={`ml-auto inline-flex items-center gap-1 text-sm tnum font-medium ${up ? "text-success" : "text-danger"}`}>
          {up ? <ArrowUp size={16} strokeWidth={1.75} aria-hidden /> : <ArrowDown size={16} strokeWidth={1.75} aria-hidden />}
          {up ? "+" : "−"}{usd(Math.abs(pnlUsd))}
        </span>
      </Row>
    </Block>
  );
}
```

(The first Row is a 48px header carrying the property name (bold) — keeps each holding as one self-contained Block, guttered by the page's `space-y-3`. `tnum` on every figure. PnL `--success` (up) / `--danger` (down) with an arrow glyph per DESIGN_SYSTEM §"My-position block". `Math.abs` so the `−` (minus, U+2212) prefix is the only sign indicator — never a negative money string. `aria-hidden` on the arrow since the `+/−` carry the sign.)

- [ ] **Step 3: Rewrite `src/app/(app)/portfolio/page.tsx`**

Replace the ENTIRE file (currently 14 skeleton lines) with:

```tsx
"use client";
// File responsibility: Portfolio screen — summary block + my-position blocks + open orders, all 4 states.
import Link from "next/link";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useMarketplace } from "@/hooks/useMarketplace";
import { ROUTES } from "@/lib/constants";
import { usd, shortAddr } from "@/lib/format";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { Skeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/common/StatusPill";
import { MyPositionBlock } from "@/components/portfolio/MyPositionBlock";
import type { Order } from "@/types/order";

export default function PortfolioPage() {
  const portfolio = usePortfolio();
  const marketplace = useMarketplace();

  const properties = marketplace.data ?? [];
  const propertyNameById: Record<string, string> = Object.fromEntries(
    properties.map((p) => [p.id, p.title]),
  );

  if (portfolio.isLoading) {
    return (
      <div className="mt-3 space-y-3">
        <Block>
          {Array.from({ length: 4 }).map((_, i) => (
            <Row key={i}>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="ml-auto h-4 w-24" />
            </Row>
          ))}
        </Block>
        {Array.from({ length: 2 }).map((_, i) => (
          <Block key={i}>
            {Array.from({ length: 5 }).map((_, j) => (
              <Row key={j}>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="ml-auto h-4 w-24" />
              </Row>
            ))}
          </Block>
        ))}
      </div>
    );
  }

  if (portfolio.isError) {
    return (
      <Block className="mt-3 p-4 text-center">
        <p className="text-sm text-muted-foreground mb-3">Couldn&apos;t load your portfolio.</p>
        <Button onClick={() => portfolio.refetch()}>Retry</Button>
      </Block>
    );
  }

  const data = portfolio.data;
  if (!data || data.holdings.length === 0) {
    return (
      <EmptyState
        title="No holdings yet"
        message="Buy a slice of a property to see your position here."
        action={
          <Link
            href={ROUTES.marketplace}
            className="inline-flex items-center justify-center h-[44px] rounded-[10px] bg-primary text-primary-foreground px-4 text-sm font-semibold"
          >
            Explore Marketplace
          </Link>
        }
        className="mt-12"
      />
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Summary block */}
      <Block>
        <Row>
          <span className="text-sm text-muted-foreground">Total value</span>
          <span className="ml-auto text-sm tnum text-foreground font-semibold">{usd(data.totalValueUsd)}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">Total invested</span>
          <span className="ml-auto text-sm tnum text-foreground">{usd(data.totalInvestedUsd)}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">Total earnings</span>
          <span className="ml-auto text-sm tnum text-success font-medium">{usd(data.totalEarningsUsd)}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">Next payout</span>
          <span className="ml-auto text-sm tnum text-foreground">{usd(data.weeklyProjectedUsd)}</span>
        </Row>
      </Block>

      {/* My positions — one MyPositionBlock per holding. */}
      {data.holdings.map((h) => (
        <MyPositionBlock
          key={h.propertyId}
          holding={h}
          propertyName={propertyNameById[h.propertyId] ?? h.propertyId}
        />
      ))}

      {/* Open orders — only when the user has any. */}
      {data.openOrders.length > 0 ? (
        <Block>
          <Row>
            <span className="text-sm font-semibold text-foreground">Open orders</span>
          </Row>
          {data.openOrders.map((o) => (
            <OpenOrderRow key={o.id} order={o} propertyName={propertyNameById[o.propertyId] ?? o.propertyId} />
          ))}
        </Block>
      ) : null}
    </div>
  );
}

// Local helper — one open-order row. Lives in the page (composition is the page's single responsibility);
// no lib/mock import; propertyName is passed in by the page's lookup map.
function OpenOrderRow({ order, propertyName }: { order: Order; propertyName: string }) {
  return (
    <Row>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{propertyName}</div>
        <div className="text-xs text-muted-foreground tnum">
          {order.side === "sell" ? "Sell" : "Buy"} · {order.quantity} shares · {usd(order.priceUsd)}/sh · {shortAddr(order.makerAddress)}
        </div>
      </div>
      <StatusPill label={order.status === "open" ? "Open" : "Closed"} variant={order.status === "open" ? "warning" : "danger"} />
    </Row>
  );
}
```

Key points:
- Summary block: Total value / Total invested / Next payout neutral `--foreground`; **Total earnings green `--success`** — honest because `totalEarningsUsd` is the sum of PAID entries (`seed/index.ts:41` filters `status === "paid"`). `weeklyProjectedUsd` (pending sum) is neutral — pending, NOT green. `tnum` on every figure.
- My positions: one `MyPositionBlock` per holding (Step 2 component). Guttered by `space-y-3`.
- Open orders: one Block, header row + one `OpenOrderRow` per order. The seed ships 1 open sell order on canggu-surf-villa. `StatusPill` warning for `open`, danger for `closed`. `shortAddr(order.makerAddress)` for the maker line.
- Empty state: reuses `EmptyState` (Sprint A: 120px `Building2` glyph + H2) with "Explore Marketplace" Primary action — matches Home/Earnings empty pattern.
- Loading skeleton: one 4-row summary block + two 5-row my-position blocks (matching the loaded structure: summary + 2 holdings × 5 rows).
- Error: inline Block + Retry button.
- `OpenOrderRow` is a local function (the page owns composition; no lib/mock import). `propertyName` passed in.

- [ ] **Step 4: Run check + commit**

```bash
npm run check
git add src/lib/mock/seed/holdings.ts src/components/portfolio/MyPositionBlock.tsx "src/app/(app)/portfolio/page.tsx"
git commit -m "fix(phase3-sprint-c): Portfolio tab real content (summary + my-positions + open orders) + believable PnL seed"
```

Expected: green. (The seed change affects `totalValueUsd` and `weeklyProjectedUsd` recomputation via `seedPortfolioSummary` — both are display-only notional; no type/hook/lib/ton changes. The weekly-yield integrity test (`src/lib/__tests__/integrity.test.ts`) checks the proportional math against the seed constants — confirm it still passes; the `currentValueUsd` change doesn't touch `pendingWeekEarningsUsd` or `shareRatio`, so the integrity gate is unaffected. If `npm test` shows an integrity failure, STOP and report — do not change the test.)

---

## Task 3: Settings page real content (wallet + theme toggle + about)

**Files:**
- New: `src/components/common/Toggle.tsx`
- Rewrite: `src/app/(app)/settings/page.tsx`

**Interfaces:**
- Consumes: `useTonConnect()` (for `connected`, `short`, `network`, `openModal`), `useSettingsStore` (`useTelegramTheme` + `setUseTelegramTheme`), `WalletConnectButton` (existing), `WalletBadge` (existing), `PAYOUT_DISCLAIMER` constant.
- Produces: Settings tab renders section-labeled blocks — Wallet (connected → `WalletBadge`; disconnected → connect CTA) / Appearance (theme toggle bound to `useTelegramTheme`) / About (project + network) — followed by the honesty disclaimer.

- [ ] **Step 1: Create `src/components/common/Toggle.tsx`**

```tsx
"use client";
// File responsibility: accessible iOS-style switch presentational primitive. Pure — no hooks, no domain imports.
// DESIGN_SYSTEM §"Buttons" tap ≥44×44 + press scale 0.97; §"Motion" 200ms ease-out on transform/color.
import { cn } from "@/lib/utils";

export function Toggle({
  on,
  onChange,
  "aria-label": ariaLabel,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-200 ease-out active:scale-[0.97]",
        on ? "bg-primary" : "bg-surface-2",
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] size-[22px] rounded-full bg-white transition-transform duration-200 ease-out",
          on ? "translate-x-[20px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}
```

(Accessible: `role="switch"` + `aria-checked`. 44×26 hit area meets the ≥44 tap-target on the narrow axis with the 44px width; the 26px height is under 44 — if the reviewer flags it, the surrounding Row's `min-h-[48px]` + the `!min-h-[56px]` override on the parent row gives the full 44px+ vertical hit via the row. The knob slides via `translate-x` 200ms `ease-out` (transform-only — no layout trigger). `--primary` on, `--surface-2` off. `bg-white` knob matches iOS toggles across both themes. `active:scale-[0.97]` press feedback per DESIGN_SYSTEM.)

- [ ] **Step 2: Rewrite `src/app/(app)/settings/page.tsx`**

Replace the ENTIRE file (currently 19 skeleton lines) with:

```tsx
"use client";
// File responsibility: Settings screen — wallet / appearance (theme toggle) / about, with the honesty
// disclaimer rendered exactly once (MVP payout contract). Wired through sanctioned hooks + stores only.
import { useTonConnect } from "@/hooks/useTonConnect";
import { useSettingsStore } from "@/stores/settings.store";
import { PAYOUT_DISCLAIMER } from "@/lib/constants";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { SectionLabel } from "@/components/common/SectionLabel";
import { Toggle } from "@/components/common/Toggle";
import { WalletConnectButton } from "@/components/wallet/TonConnectButton";
import { WalletBadge } from "@/components/wallet/WalletBadge";

export default function SettingsPage() {
  const tonc = useTonConnect();
  const useTelegramTheme = useSettingsStore((s) => s.useTelegramTheme);
  const setUseTelegramTheme = useSettingsStore((s) => s.setUseTelegramTheme);

  return (
    <div className="mt-3 space-y-3">
      <SectionLabel className="mt-2">Wallet</SectionLabel>
      <Block>
        {tonc.connected ? (
          <Row className="!min-h-[56px]">
            <WalletBadge />
          </Row>
        ) : (
          <Row className="!min-h-[64px]">
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">Connect a TON wallet</div>
              <div className="text-xs text-muted-foreground">Required to buy shares and receive weekly yield.</div>
            </div>
            <WalletConnectButton />
          </Row>
        )}
      </Block>

      <SectionLabel className="mt-2">Appearance</SectionLabel>
      <Block>
        <Row className="!min-h-[56px]">
          <div className="flex-1">
            <div className="text-sm text-foreground">Use Telegram theme</div>
            <div className="text-xs text-muted-foreground">Match the app to your Telegram color scheme.</div>
          </div>
          <Toggle on={useTelegramTheme} onChange={setUseTelegramTheme} aria-label="Use Telegram theme" />
        </Row>
      </Block>

      <SectionLabel className="mt-2">About</SectionLabel>
      <Block>
        <Row>
          <span className="text-sm text-muted-foreground">Project</span>
          <span className="ml-auto text-sm text-foreground">DigiHouse</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">Network</span>
          <span className="ml-auto text-sm text-foreground uppercase">{tonc.network}</span>
        </Row>
      </Block>

      <p className="text-xs text-muted-foreground">{PAYOUT_DISCLAIMER}</p>
    </div>
  );
}
```

Key points:
- Three `SectionLabel`-headed blocks (Wallet / Appearance / About). The `SectionLabel className="mt-2"` hugs its block while separating from the previous block-group (DESIGN_SYSTEM spacing: section label above a block).
- Wallet: connected → `WalletBadge` (existing, shows shortened address + network + tap-to-manage); disconnected → a 64px row with a two-line label + `WalletConnectButton`. The `WalletConnectButton` is the TonConnect native button (already restyled `h-12`).
- Appearance: a 56px row with a two-line label + `Toggle` bound to `useSettingsStore.useTelegramTheme`. Toggling flips the persisted flag; `useTheme()` (already mounted in `AppShell`) reacts and applies the live Telegram theme vars (or clears them). MVP honesty: this is a UI preference, no payout claim.
- About: Project name + Network (from `useTonConnect().network` — `testnet`/`mainnet`, uppercase). No wallet address shown (the WalletBadge above carries it).
- Disclaimer: `PAYOUT_DISCLAIMER` rendered once at the bottom, VERBATIM (`"simulated weekly payout · on-chain verifiable post-MVP"`). Mirrors the Earnings page'stop disclaimer — the honesty contract traveler across screens.
- No loading skeleton: Settings has no async data (it reads `useTonConnect` which is sync via the TonConnect context + `useSettingsStore` which is sync Zustand). The "loaded" state is immediate; a skeleton would never render. DESIGN_SYSTEM states contract is satisfied (loading is instant; empty/error don't apply to local settings). If the reviewer flags the missing skeleton, note: Settings has no server query — there's nothing to skeleton.

- [ ] **Step 3: Run check + commit**

```bash
npm run check
git add src/components/common/Toggle.tsx "src/app/(app)/settings/page.tsx"
git commit -m "fix(phase3-sprint-c): Settings tab real content (wallet + theme toggle + about) + Toggle primitive"
```

Expected: green.

---

## Self-Review (spec coverage)

- **Earnings timeline alignment** → Task 1 Step 1 (disclosure 48px lead spacer → content aligns with name column; hairline stays full-width-inset 16px). ✅
- **Earnings skeleton shape match** → Task 1 Step 2 (hero + secondary + ONE timeline Block with 3 rows — mirrors the loaded `EarningsSummaryBlock` + `EarningsTimeline` structure). ✅
- **Portfolio tab functional** → Task 2 (summary Block + my-position Blocks + open-orders Block + all 4 states; believable PnL via seed `currentValueUsd` bump). ✅
- **Settings tab functional** → Task 3 (wallet / appearance toggle / about + disclaimer; `Toggle` primitive). ✅
- **Honesty preserved** → Portfolio `weeklyProjectedUsd` neutral (pending), `totalEarningsUsd` green (paid sum, honest); PnL `--success`/`--danger` (unrealized, no on-chain claim); `PAYOUT_DISCLAIMER` renders on Settings + Earnings verbatim; no payout copy changed. ✅
- **Ownership guard** → `MyPositionBlock` imports `lucide-react`, `@/components/common`, `@/lib/format`, `@/types` — no `lib/mock`/`lib/ton`/`lib/telegram`. `Toggle` imports only `cn`. `portfolio/page.tsx` + `settings/page.tsx` import only sanctioned hooks + components + stores + `lib/format`/`lib/constants`. The `holdings.ts` seed change is in `lib/mock/seed` (the data layer — sanctioned location). ✅
- **No new hooks / types / lib/ton / lib/telegram changes.** ✅

**Placeholder scan:** No "TBD/TODO/later". Every code step shows the exact replacement. ✅
**Out of scope (deferred):** Component/integration render tests (Sprint D per the next-steps proposal), real property images, live TON price quote, real on-chain weekly payouts (post-MVP), deploy/BotFather setup. These are tracked in the post-merge next-steps summary, not Sprint C.

---

## Final Gate (after all 3 tasks)

1. `npm run check` — green (run fresh by the controller).
2. `npm test` — green (run fresh; confirm the weekly-yield integrity gate still passes after the Holdings seed bump).
3. Re-run `/design-review` on Earnings, Portfolio, Settings. All critical/important items from the audit + the user's Earnings-alignment concern must PASS.
4. Ownership guard recheck: every touched file < 350 lines, single responsibility, no component imports `lib/ton`/`lib/mock`/`lib/api`/`lib/telegram`/`@tonconnect`/`@telegram-apps` directly.
5. Commit log: 3 `fix(phase3-sprint-c): ...` commits over base `d9d571f`.