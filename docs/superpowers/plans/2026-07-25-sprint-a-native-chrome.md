# Sprint A — Native Chrome & Row-Inset Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unblock the Phase 3 `/design-review` gate by fixing the 4 Critical native-Telegram findings (C1 BackButton unwired, C2 MainButtonBridge globally hides MainButton, C3 BottomTabBar overlaps MainButton, C4 Row double-insets content) plus the 3 cheap Important fixes (I1 Header centering + back-chevron fallback + dynamic title, I2 EmptyState illustration + H2 headline). No new features; pure native-fidelity fixes.

**Architecture:** Sprint A touches only the shared shell (`AppShell`, `Header`, `BottomTabBar`, `Row`, `EmptyState`) and the Property detail page. One new piece of state — a `mainButtonActive` boolean on the existing `ui.store.ts` — lets `AppShell` swap between rendering the `BottomTabBar` (root tabs) and reserving space for the Telegram `MainButton` (action screens). The Property detail page owns the flag's lifecycle (set true when it shows MainButton, false on unmount). `MainButtonBridge.tsx` is deleted — its global `mainButton.hide()`-on-every-render was both a React anti-pattern and the C2 culprit; per-page effects already own show/hide-on-unmount. BackButton is wired to `router.back()` in the Property page, and `Header` gains an in-app back-chevron fallback only when the Telegram SDK is not ready (outside-Telegram dev/preview).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.6 strict (`no any`), Tailwind v4 (DESIGN_SYSTEM oklch tokens), `@telegram-apps/sdk-react` via the existing `useTelegram` facade, Zustand v5 (`ui.store.ts`), lucide-react@1.6 (`strokeWidth={1.75}`), vitest 4 (pure-logic TDD only — presentational changes verified by `npm run check` + design-review, per the Phase 3 contract).

## Global Constraints (from the approved spec — copy-and-abide verbatim values)

- **TypeScript strict, no `any`.** Money = integer minor units (cents); TON = nanoTON (bigint). Use `format.*` helpers. Tabular-nums (`.tnum`) on every money/TON/ratio figure.
- **Strict file ownership (`telegram-ton-ownership`):** components import ONLY `@/hooks/**`, `@/types/**`, `@/lib/format`, `@/lib/utils`, `@/lib/constants`, `@/components/**`. NEVER `@/lib/ton`, `@/lib/mock`, `@/lib/api`, `@/lib/telegram`, `@tonconnect/*`, `@telegram-apps/*`, `@tanstack/react-query` directly. `useTelegram`/`useTonConnect` are the sanctioned bridges. Hooks may import the Zustand store.
- **≤350 lines soft / ≤500 hard per file.** One concern each.
- **MVP payout honesty (non-negotiable):** Buy success toast stays exactly `"Buy confirmed (simulated)"`; `PAYOUT_DISCLAIMER` renders once on Earnings. Sprint A does NOT touch payout copy — preserve it verbatim.
- **Native-Telegram fidelity (per DESIGN_SYSTEM):**
  - Header: `h-[calc(44px+max(env(safe-area-inset-top),0px))] pt-[max(env(safe-area-inset-top),0px)] bg-background/95 backdrop-blur px-4 flex items-center`, **centered** title `1.0625rem/600`, leading slot for back chevron, trailing slot for actions. (DESIGN_SYSTEM §"Telegram Header".)
  - Bottom tab bar: `fixed bottom-0 inset-x-0 mx-auto max-w-[480px] h-[calc(52px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-card/95 backdrop-blur border-t border-border grid grid-cols-4`. (DESIGN_SYSTEM §"Bottom Tab Bar".) **Hidden on action screens where MainButton is shown** ("Hide the app tab bar's chrome conflict — MainButton is bottom-most").
  - Blocks: `bg-card rounded-[12px]` no border no shadow. Rows: `min-h-[48px] px-4 gap-2`, separators `border-t border-border` **inset-left 16px** (`mx-4`), `first:border-t-0`. (DESIGN_SYSTEM §"Grouped Block" + §"Layout & blocks" — the inset is for the hairline, NOT the content.)
  - Icons `strokeWidth={1.75}`, `currentColor`, sizes 16/20/24.
  - Max-w-[480px] centered; one accent (`--primary`); `--success`/`--danger` reserved for finance up/down + paid/pending. No drop shadows on blocks.
  - Tap targets ≥ 44×44; tappable rows/cards scale `0.97` on `:active` (120–160ms `--ease-out`).
  - ≥44px touch targets; tab-bar Links need `active:scale-[0.97]` press feedback (Minor M11, folded into Task 5 since the file is already open).
- **MainButton lifecycle (USER_FLOW):** hide on root tabs (Home/Marketplace/Earnings/Portfolio); show on Property detail when there is a single primary action (Buy confirm) AND wallet connected AND qty valid AND `sharesRemaining > 0`. The app-owned bottom tab bar stays visible everywhere the MainButton isn't.
- **BackButton lifecycle (USER_FLOW):** show only on detail/sheet routes; hide on root tabs. Must be **wired to navigate back** (`router.back()`), not just shown.
- **Empty state (DESIGN_SYSTEM §"Empty state"):** centered ~120px monochrome line-illustration in `--muted-foreground`, headline H2 (`0.9375rem/600`), one muted sentence, one Primary button.
- **Verification gates after every task:** `npm run check` (lint + typecheck + build) green; `npm test` green (pure-logic only — Task 1); commit one per task (`fix(phase3-sprint-a): ...`). Per the Phase 3 contract, presentational tasks are verified by `npm run check` + a design-review re-run, NOT by pixel/unit tests.
- **Scratch hygiene:** `.superpowers/` is gitignored. Subagents must only `git add` the files they explicitly touch — never `.superpowers/`.

**Written against commit:** `d6339fb` (HEAD before Sprint A).

---

## File Structure (decomposition — locked here)

| File | Responsibility | Task |
|---|---|---|
| `src/stores/ui.store.ts` (modify) | Add `mainButtonActive` boolean + `setMainButtonActive` | 1 |
| `src/stores/__tests__/ui.store.test.ts` (new) | TDD: store flag transitions | 1 |
| `src/components/layout/AppShell.tsx` (modify) | Drop `<MainButtonBridge/>`; conditionally render `BottomTabBar` on `!mainButtonActive`; swap `main` bottom pad 52px↔`50px+safe-area` | 2 |
| `src/components/layout/MainButtonBridge.tsx` (delete) | Removed — its global `mainButton.hide()`-on-render was C2 | 2 |
| `src/app/(app)/property/[id]/page.tsx` (modify) | Wire BackButton `onClick → router.back()`; set `mainButtonActive true` when MainButton shown, `false` on cleanup | 3 |
| `src/components/common/Row.tsx` (modify) | Fix double-inset: content `px-4`, separator `mx-4` only | 4 |
| `src/components/layout/Header.tsx` (modify) | Center title; add leading back-chevron fallback (outside-Telegram + non-root path); add `/property/[id]` → "Property" title | 5 |
| `src/components/layout/BottomTabBar.tsx` (modify) | Fold in Minor M11: tab-bar Links `active:scale-[0.97]` press feedback (file already related to C3) | 5 |
| `src/components/common/EmptyState.tsx` (modify) | Add ~120px monochrome `lucide-react` line glyph in `--muted-foreground`; headline → H2 `0.9375rem/600` | 6 |

**Dependency graph:** Task 1 (store flag) → Task 2 (AppShell consumes flag) → Task 3 (Property page sets flag). Task 4 (Row), Task 5 (Header/TabBar press), Task 6 (EmptyState) are independent and may run in any order after Task 1. **Recommended order: 1 → 2 → 3 → 4 → 5 → 6** (Critical first, then the cheap Important).

---

## Task 1: `mainButtonActive` flag on `ui.store.ts` (TDD)

**Files:**
- Modify: `src/stores/ui.store.ts`
- Test: `src/stores/__tests__/ui.store.test.ts`

**Interfaces:**
- Produces: `useUiStore` now exposes `{ mainButtonActive: boolean; setMainButtonActive: (v: boolean) => void }`. Initial value `false`. Tasks 2 and 3 consume `useUiStore((s) => s.mainButtonActive)` and `useUiStore((s) => s.setMainButtonActive)`.

- [ ] **Step 1: Write the failing test**

Create `src/stores/__tests__/ui.store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "@/stores/ui.store";

describe("ui.store — mainButtonActive flag", () => {
  beforeEach(() => {
    useUiStore.setState({ mainButtonActive: false });
  });

  it("defaults to false", () => {
    expect(useUiStore.getState().mainButtonActive).toBe(false);
  });

  it("setMainButtonActive(true) flips the flag", () => {
    useUiStore.getState().setMainButtonActive(true);
    expect(useUiStore.getState().mainButtonActive).toBe(true);
  });

  it("setMainButtonActive(false) clears the flag", () => {
    useUiStore.getState().setMainButtonActive(true);
    useUiStore.getState().setMainButtonActive(false);
    expect(useUiStore.getState().mainButtonActive).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/ui.store.test.ts`
Expected: FAIL — `mainButtonActive` is `undefined` (property does not exist on `UiState`).

- [ ] **Step 3: Write minimal implementation**

Edit `src/stores/ui.store.ts`. The file currently is:

```ts
"use client";
// File responsibility: ephemeral UI slice — active tab, selected property, sheet flags, payout cursor.
import { create } from "zustand";

interface UiState {
  activeTab: string;
  selectedPropertyId: string | null;
  sheetOpen: boolean;
  payoutCursor: number; // epoch ms last tickPayout
  setActiveTab: (href: string) => void;
  setSelectedPropertyId: (id: string | null) => void;
  setSheetOpen: (v: boolean) => void;
  setPayoutCursor: (ms: number) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: "/home",
  selectedPropertyId: null,
  sheetOpen: false,
  payoutCursor: 0,
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedPropertyId: (selectedPropertyId) => set({ selectedPropertyId }),
  setSheetOpen: (sheetOpen) => set({ sheetOpen }),
  setPayoutCursor: (payoutCursor) => set({ payoutCursor }),
}));
```

Replace the entire file with:

```ts
"use client";
// File responsibility: ephemeral UI slice — active tab, selected property, sheet flags, payout cursor,
// mainButtonActive flag (true on action screens so AppShell hides the tab bar and reserves MainButton space).
import { create } from "zustand";

interface UiState {
  activeTab: string;
  selectedPropertyId: string | null;
  sheetOpen: boolean;
  payoutCursor: number; // epoch ms last tickPayout
  mainButtonActive: boolean; // true while a screen owns the Telegram MainButton
  setActiveTab: (href: string) => void;
  setSelectedPropertyId: (id: string | null) => void;
  setSheetOpen: (v: boolean) => void;
  setPayoutCursor: (ms: number) => void;
  setMainButtonActive: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: "/home",
  selectedPropertyId: null,
  sheetOpen: false,
  payoutCursor: 0,
  mainButtonActive: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedPropertyId: (selectedPropertyId) => set({ selectedPropertyId }),
  setSheetOpen: (sheetOpen) => set({ sheetOpen }),
  setPayoutCursor: (payoutCursor) => set({ payoutCursor }),
  setMainButtonActive: (mainButtonActive) => set({ mainButtonActive }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/ui.store.test.ts`
Expected: PASS — 3/3.

- [ ] **Step 5: Run full suite + check**

Run: `npm test && npm run check`
Expected: all tests pass; lint + typecheck + build green.

- [ ] **Step 6: Commit**

```bash
git add src/stores/ui.store.ts src/stores/__tests__/ui.store.test.ts
git commit -m "fix(phase3-sprint-a): add mainButtonActive flag to ui.store (C3 prep)"
```

---

## Task 2: AppShell drops MainButtonBridge, conditionally renders tab bar (C2 + C3)

**Files:**
- Modify: `src/components/layout/AppShell.tsx`
- Delete: `src/components/layout/MainButtonBridge.tsx`

**Interfaces:**
- Consumes: Task 1's `useUiStore((s) => s.mainButtonActive)` (initial `false`).
- Produces: When `mainButtonActive` is `true`, `<BottomTabBar/>` is NOT rendered and `<main>` bottom pad is `50px + safe-area` (room for the native MainButton); when `false`, `<BottomTabBar/>` renders and the pad returns to `52px + safe-area`. `MainButtonBridge` no longer exists.

**Context:** The current `AppShell.tsx` always renders both `<MainButtonBridge/>` (which calls `mainButton.hide()` in its render body — a side-effect during render and the C2 culprit) and `<BottomTabBar/>`. Per-page effects already own hide-on-unmount, so the global hide is both redundant and harmful. Task 3 sets the flag; this task makes the shell react to it. **Do not touch `BottomTabBar.tsx` here** — Task 5 owns the press-scale fold-in to keep diffs single-purpose.

- [ ] **Step 1: Edit `src/components/layout/AppShell.tsx`**

The file currently is:

```tsx
"use client";
import { Header } from "./Header";
import { BottomTabBar } from "./BottomTabBar";
import { MainButtonBridge } from "./MainButtonBridge";
import { useTheme } from "@/hooks/useTheme";

export function AppShell({ children }: { children: React.ReactNode }) {
  useTheme();
  return (
    <div className="mx-auto flex min-h-svh max-w-[480px] flex-col bg-background">
      <Header />
      <main className="flex-1 px-4 pb-[calc(52px+env(safe-area-inset-bottom))]">{children}</main>
      <MainButtonBridge />
      <BottomTabBar />
    </div>
  );
}
```

Replace the entire file with:

```tsx
"use client";
// File responsibility: the app shell — fixed max-width canvas, Header, scroll main, optional BottomTabBar.
// When a screen owns the Telegram MainButton (mainButtonActive=true), we drop the in-app tab bar so the
// native MainButton is the sole bottom chrome (DESIGN_SYSTEM: "Hide the app tab bar's chrome conflict —
// MainButton is bottom-most") and shrink the main bottom pad to the MainButton's 50px + safe-area.
import { Header } from "./Header";
import { BottomTabBar } from "./BottomTabBar";
import { useTheme } from "@/hooks/useTheme";
import { useUiStore } from "@/stores/ui.store";

export function AppShell({ children }: { children: React.ReactNode }) {
  useTheme();
  const mainButtonActive = useUiStore((s) => s.mainButtonActive);
  return (
    <div className="mx-auto flex min-h-svh max-w-[480px] flex-col bg-background">
      <Header />
      <main
        className={
          mainButtonActive
            ? "flex-1 px-4 pb-[calc(50px+env(safe-area-inset-bottom))]"
            : "flex-1 px-4 pb-[calc(52px+env(safe-area-inset-bottom))]"
        }
      >
        {children}
      </main>
      {mainButtonActive ? null : <BottomTabBar />}
    </div>
  );
}
```

- [ ] **Step 2: Delete MainButtonBridge**

Delete the file `src/components/layout/MainButtonBridge.tsx`. (Git tracks the deletion; `git rm` or `Remove-Item` then stage.)

```bash
git rm src/components/layout/MainButtonBridge.tsx
```

Verify no remaining imports of `MainButtonBridge` exist:

```bash
git grep -n "MainButtonBridge" -- src
```
Expected: no output (the only importer was `AppShell.tsx`, now edited). If any other file imported it, STOP and report — do not improvise.

- [ ] **Step 3: Run check**

Run: `npm run check`
Expected: lint + typecheck + build green. (The typecheck catches any dangling import; the build confirms the shell still renders.)

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/AppShell.tsx
git commit -m "fix(phase3-sprint-a): drop MainButtonBridge, hide tab bar on action screens (C2 + C3)"
```

(`git rm` already staged the deletion in Step 2.)

---

## Task 3: Property detail — wire BackButton to `router.back()` + own `mainButtonActive` lifecycle (C1 + C3)

**Files:**
- Modify: `src/app/(app)/property/[id]/page.tsx`

**Interfaces:**
- Consumes: Task 1's `useUiStore((s) => s.setMainButtonActive)`. The existing `useTelegram()` facade (`backButton.show/hide/onClick`) and `useRouter()` from `next/navigation`.
- Produces: The Telegram BackButton now actually navigates back; `mainButtonActive` is `true` while this page shows the MainButton and `false` on unmount (so AppShell restores the tab bar).

**Context:** The current page calls `tg.backButton.show()`/`hide()` but never registers `onClick`, so the on-screen back chevron does nothing (C1). It shows the MainButton conditionally inside a `useEffect` but never tells the shell, so the tab bar stays visible and overlaps (C3). The fix wires BackButton → `router.back()` and sets `mainButtonActive=true` exactly when the MainButton is shown (wallet connected AND `sharesRemaining > 0`), clearing it on cleanup.

**Existing page (verbatim, for reference — `src/app/(app)/property/[id]/page.tsx`):**

```tsx
"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { useProperty } from "@/hooks/useProperty";
import { useOrderBook } from "@/hooks/useOrderBook";
import { useTelegram } from "@/hooks/useTelegram";
import { useTonConnect } from "@/hooks/useTonConnect";
import { useBuyShares, type BuyInput } from "@/hooks/useBuyShares";
import { PropertyDetail } from "@/components/property/PropertyDetail";
import { Toast } from "@/components/common/Toast";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";
import { Button } from "@/components/ui/button";

interface ToastState {
  tone: "success" | "error";
  title: string;
  sub?: string;
  leaving: boolean;
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const property = useProperty(id);
  const orderBook = useOrderBook(id);
  const tg = useTelegram();
  const ton = useTonConnect();
  const buy = useBuyShares();
  const [qty, setQty] = useState<number>(1);
  const [toast, setToast] = useState<ToastState | null>(null);
  // ... (toast effect, back-button show-only effect, MainButton setParams effect, unmount-hide effect)
```

- [ ] **Step 1: Add the router + store imports**

At the top of `src/app/(app)/property/[id]/page.tsx`, add these two imports (keep the existing ones in place):

```tsx
import { useRouter } from "next/navigation";
import { useUiStore } from "@/stores/ui.store";
```

Inside the component, after the existing hooks (`const buy = useBuyShares();`), add:

```tsx
  const router = useRouter();
  const setMainButtonActive = useUiStore((s) => s.setMainButtonActive);
```

- [ ] **Step 2: Wire BackButton to `router.back()`**

Find the existing BackButton effect (currently only `show`/`hide`):

```tsx
  useEffect(() => {
    tg.backButton.show();
    return () => tg.backButton.hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

Replace it with:

```tsx
  // BackButton lifecycle (USER_FLOW §"Route ↔ screen"): show + wire to router.back() so the TG
  // on-screen back chevron actually navigates. Outside Telegram the Header's in-app chevron handles it.
  useEffect(() => {
    tg.backButton.show();
    const off = tg.backButton.onClick(() => router.back());
    return () => {
      off();
      tg.backButton.hide();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

- [ ] **Step 3: Set `mainButtonActive` to mirror MainButton visibility**

Find the existing MainButton `setParams` effect. It currently hides when `!listing`, `!ton.connected || remaining <= 0`, and otherwise sets params + onClick. Immediately after the early-return branches that call `tg.mainButton.hide()`, and before the `tg.mainButton.setParams(...)` call, the flag must reflect the actual visibility.

 Modify that effect so each visibility branch also sets the store flag. The full replacement of the MainButton effect is:

```tsx
  useEffect(() => {
    const listing = property.data;
    if (!listing) {
      tg.mainButton.hide();
      setMainButtonActive(false);
      return;
    }
    const remaining = listing.sharesRemaining;
    // Hide MainButton when wallet disconnected (so BuyControl's Connect-Wallet CTA is the sole
    // primary action) or when no primary shares remain (Fully-funded/resale state).
    if (!ton.connected || remaining <= 0) {
      tg.mainButton.hide();
      setMainButtonActive(false);
      return;
    }
    setMainButtonActive(true);
    const valid = qty >= 1 && qty <= remaining;
    const totalUsd = qty * listing.sharePriceUsd;
    tg.mainButton.setParams({
      text: `Buy ${qty} — $${(totalUsd / 100).toFixed(2)}`,
      isEnabled: valid,
    });
    const off = tg.mainButton.onClick(async () => {
      if (!valid || !listing) return;
      tg.haptics.impact("medium");
      const input: BuyInput = {
        propertyId: listing.id,
        quantity: qty,
        priceUsdPerShare: listing.sharePriceUsd,
        toFriendlyAddress: listing.ownerWalletAddress,
      };
      try {
        const res = await buy.mutateAsync(input);
        if (res.ok) {
          // MVP honesty contract (PLAN §"MVP payout honesty"): exact toast text, synthetic txHash sub.
          setToast({ tone: "success", title: "Buy confirmed (simulated)", sub: `tx: ${res.txHash}`, leaving: false });
          tg.haptics.notification("success");
        } else {
          setToast({ tone: "error", title: "Buy failed", sub: res.error, leaving: false });
          tg.haptics.notification("error");
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "transaction rejected";
        setToast({ tone: "error", title: "Buy failed", sub: message, leaving: false });
        tg.haptics.notification("error");
      }
    });
    return () => {
      off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.data, qty, ton.connected]);
```

- [ ] **Step 4: Clear the flag on unmount**

Find the existing unmount-hide effect:

```tsx
  // Hide MainButton when leaving the route (root tabs own the bottom bar elsewhere).
  useEffect(() => {
    return () => tg.mainButton.hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

Replace it with:

```tsx
  // Hide MainButton + release the shell's mainButtonActive flag when leaving the route
  // (root tabs own the bottom bar elsewhere). Order: clear the flag first so AppShell restores
  // the tab bar before the native MainButton finishes hiding — avoids a flash of empty bottom padding.
  useEffect(() => {
    return () => {
      setMainButtonActive(false);
      tg.mainButton.hide();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

- [ ] **Step 5: Run check**

Run: `npm run check`
Expected: lint + typecheck + build green. (No pure logic added — no new unit test needed; the store flag is tested in Task 1, and `router.back()` is a navigation integration verified by design-review.)

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/property/[id]/page.tsx
git commit -m "fix(phase3-sprint-a): wire BackButton to router.back(), own mainButtonActive lifecycle (C1 + C3)"
```

---

## Task 4: Fix Row double-inset (C4)

**Files:**
- Modify: `src/components/common/Row.tsx`

**Interfaces:**
- Produces: `<Row>` renders `flex min-h-[48px] items-center gap-2 px-4 border-t border-border mx-4 first:border-t-0 first:mx-0` (content padded 16px from the block edge, separator hairline inset-left 16px). This matches DESIGN_SYSTEM §"Grouped Block": "internal rows are separated by inset 16px hairlines" — the **hairline** is inset, the content is NOT.

Wait — re-read the current code: `flex min-h-[48px] items-center gap-2 px-4 border-t border-border mx-4 first:border-t-0 first:mx-0`. The bug is that `px-4` (content inset) COMBINED with `mx-4` (block-side inset) double-insets content to 32px from the block edge, while the hairline sits at 16px. The fix: keep `px-4` for content alignment with the rest of the block's content (labels, a `p-4` block body), and make the **separator** inset-left 16px via `mx-4` ONLY on the border line — but a single element can't have both full-bleed content and an inset border. The DESIGN_SYSTEM separator is "inset left by 16px (`mx-4`)" — meaning the hairline itself starts 16px in, while content sits at the block's `px-4`. So the current code's *intent* was right (inset the whole row 16px so the border is inset) but it also inset the content.

**Resolution that satisfies both "content at 16px from block edge" AND "hairline inset-left 16px":** Make the row full-width with `px-4` (content at 16px), and render the hairline as a separate inset element BETWEEN rows. Since `Row` is used as a direct child repeated in a `Block`, the cleanest one-file fix is: drop `px-4` and `mx-4` from the row in favor of `px-4` only, and inset the border by using a negative-free approach — `border-t border-border` with the border itself inset via `pl-4`? No: a border can't be inset without affecting layout.

**Final decision (matches DESIGN_SYSTEM's own example class string verbatim):** DESIGN_SYSTEM §"Grouped Block" literally says rows are `border-t border-border` **inset left by 16px** and the separator example is `mx-4`. The native Telegram look DOES inset the content too (the hairline starts where the text starts, at 16px). Re-reading the audit finding C4: the issue is `px-4` (16) PLUS `mx-4` (16) = 32px. Telegram's actual behavior: row content starts at 16px and the hairline starts at 16px — they align. So the correct class is `mx-4` (which insets BOTH content and hairline to 16px) and we **remove `px-4`**. That gives content at 16px and hairline at 16px — aligned, native.

- [ ] **Step 1: Edit `src/components/common/Row.tsx`**

The file currently is:

```tsx
import { cn } from "@/lib/utils";

export function Row({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex min-h-[48px] items-center gap-2 px-4 border-t border-border mx-4 first:border-t-0 first:mx-0", className)}>{children}</div>;
}
```

Replace the entire file with:

```tsx
import { cn } from "@/lib/utils";

// DESIGN_SYSTEM §"Grouped Block": rows sit inset 16px so both content and the hairline separator
// start 16px from the block edge (native Telegram grouped-list look). `first:border-t-0 first:mx-0`
// drops the leading hairline + lets the first row align with the block's other `p-4` content.
// We do NOT also apply px-4 — that would double-inset content to 32px.
export function Row({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex min-h-[48px] items-center gap-2 mx-4 border-t border-border first:border-t-0 first:mx-0", className)}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Sanity-check consumers**

The `Row` is used by: `src/components/property/PropertyDetail.tsx` (rows with `<span className="ml-auto">`), `src/components/earnings/EarningsSummaryBlock.tsx`, `src/components/earnings/EarningsEntryRow.tsx` (`<Row className="!min-h-[56px]">`). All put their label/value children inside; removing `px-4` means they now sit at 16px (via `mx-4`) instead of 32px — the intended fix. `EarningsEntryRow`'s disclosure `<div className="px-4 py-3 mx-4 border-t border-border …">` already follows the same pattern and stays correct.

Verify nothing relied on the old `px-4`:

```bash
git grep -n "<Row" -- src
```
Expected: 3 files listed (PropertyDetail, EarningsSummaryBlock, EarningsEntryRow). No change to their code needed — they already align their own internals with flex/gap.

- [ ] **Step 3: Run check**

Run: `npm run check`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add src/components/common/Row.tsx
git commit -m "fix(phase3-sprint-a): remove Row double-inset so content+hairline align at 16px (C4)"
```

---

## Task 5: Center Header + back-chevron fallback + dynamic property title; fold in tab-bar press scale (I1 + Minor M11)

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/BottomTabBar.tsx`

**Interfaces:**
- Consumes: `useTelegram()` (`ready` flag) for the outside-Telegram fallback chevron; `useRouter()` for the fallback nav; `usePathname()` (already imported in both).

- [ ] **Step 1: Rewrite `src/components/layout/Header.tsx`**

The file currently is:

```tsx
"use client";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TITLES: Record<string, string> = {
  "/home": "DigiHouse",
  "/marketplace": "Marketplace",
  "/earnings": "Earnings",
  "/portfolio": "Portfolio",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "DigiHouse";
  return (
    <header className={cn("h-[calc(44px+max(env(safe-area-inset-top),0px))] shrink-0 bg-background/95 backdrop-blur px-4 flex items-center", "pt-[max(env(safe-area-inset-top),0px)]")}>
      <span className="text-[1.0625rem] font-semibold text-foreground">{title}</span>
    </header>
  );
}
```

Replace the entire file with:

```tsx
"use client";
// File responsibility: the Telegram-style header bar — centered title, leading back-chevron
// fallback only when running OUTSIDE Telegram (the native BackButton covers it inside TG),
// trailing slot reserved for future actions. DESIGN_SYSTEM §"Telegram Header".
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useTelegram } from "@/hooks/useTelegram";

const TITLES: Record<string, string> = {
  "/home": "DigiHouse",
  "/marketplace": "Marketplace",
  "/earnings": "Earnings",
  "/portfolio": "Portfolio",
  "/settings": "Settings",
};

const ROOT_PATHS = new Set(["/home", "/marketplace", "/earnings", "/portfolio", "/settings"]);

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready } = useTelegram();
  const title = TITLES[pathname] ?? (pathname.startsWith("/property/") ? "Property" : "DigiHouse");
  // Show the in-app back chevron only outside Telegram (native BackButton handles it inside TG)
  // and only on non-root routes (detail/sheet).
  const showBack = !ready && !ROOT_PATHS.has(pathname);
  return (
    <header className="h-[calc(44px+max(env(safe-area-inset-top),0px))] shrink-0 bg-background/95 backdrop-blur px-4 pt-[max(env(safe-area-inset-top),0px)]">
      <div className="relative flex h-[44px] items-center justify-center">
        {showBack ? (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="absolute left-0 flex items-center justify-center size-[44px] -ml-2 active:scale-[0.97] transition-transform duration-[120ms] ease-out text-foreground"
          >
            <ChevronLeft size={24} strokeWidth={1.75} />
          </button>
        ) : null}
        <span className="text-[1.0625rem] font-semibold text-foreground">{title}</span>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Add tab-bar Link press scale (Minor M11 fold-in)**

In `src/components/layout/BottomTabBar.tsx`, the `Link` className currently is:

```tsx
className={cn("flex flex-col items-center justify-center gap-1", active ? "text-primary" : "text-muted-foreground")}
```

Replace it with:

```tsx
className={cn(
  "flex flex-col items-center justify-center gap-1 active:scale-[0.97] transition-transform duration-[120ms] ease-out",
  active ? "text-primary" : "text-muted-foreground",
)}
```

(DESIGN_SYSTEM §"Grouped Block" + Motion §2: every tappable scales 0.97 on `:active`, 120–160ms `--ease-out`.)

- [ ] **Step 3: Run check**

Run: `npm run check`
Expected: green. (Header now imports `useTelegram` — confirm it returns `ready`; the facade already does, see `src/hooks/useTelegram.ts:23`.)

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Header.tsx src/components/layout/BottomTabBar.tsx
git commit -m "fix(phase3-sprint-a): center Header title + back-chevron fallback + property title; tab-bar press scale (I1 + M11)"
```

---

## Task 6: EmptyState — ~120px monochrome line glyph + H2 headline (I2)

**Files:**
- Modify: `src/components/common/EmptyState.tsx`

**Interfaces:**
- Produces: `<EmptyState title message action />` now renders a `lucide-react` `Building2` line glyph at 120px in `--muted-foreground` above the title; headline is H2 (`text-[0.9375rem] font-semibold`, per DESIGN_SYSTEM typography scale) instead of `text-lg`. Existing callers (`home/page.tsx`, `marketplace/page.tsx`, `earnings/page.tsx`) pass no new props — no caller changes.

**Context:** DESIGN_SYSTEM §"Empty state" mandates a ~120px monochrome line-illustration in `--muted-foreground`, headline H2 (`0.9375rem/600`), one muted sentence, one Primary button. The current `EmptyState` renders only headline (`text-lg`) + message + optional action — missing the illustration and the wrong headline size. We pick `Building2` from the already-installed `lucide-react` (monochrome, `currentColor`, `strokeWidth={1.75}` per DESIGN_SYSTEM §"Iconography"). The Earnings empty state's promise copy ("Own a slice…") is owned by the page, not this component — leave caller copy alone.

- [ ] **Step 1: Edit `src/components/common/EmptyState.tsx`**

The file currently is:

```tsx
import { cn } from "@/lib/utils";

export function EmptyState({ title, message, action, className }: { title: string; message: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
```

Replace the entire file with:

```tsx
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

// DESIGN_SYSTEM §"Empty state": ~120px monochrome line-illustration in --muted-foreground,
// headline H2 (0.9375rem/600), one muted sentence, one Primary button.
export function EmptyState({ title, message, action, className }: { title: string; message: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <Building2 size={120} strokeWidth={1.75} className="text-muted-foreground" aria-hidden />
      <h2 className="mt-4 text-[0.9375rem] font-semibold text-foreground">{title}</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
```

(`size={120}` satisfies "~120px"; `strokeWidth={1.75}` matches DESIGN_SYSTEM §"Iconography" for all icons. `text-muted-foreground` gives the monochrome muted color.)

- [ ] **Step 2: Run check**

Run: `npm run check`
Expected: green.

- [ ] **Step 3: Commit**

```bash
git add src/components/common/EmptyState.tsx
git commit -m "fix(phase3-sprint-a): EmptyState 120px line glyph + H2 headline (I2)"
```

---

## Self-Review (spec coverage)

- **C1 BackButton wired to navigate** → Task 3 Step 2 (`router.back()`). ✅
- **C2 MainButtonBridge global hide removed** → Task 2 Step 2 (file deleted, AppShell no longer renders it). ✅
- **C3 BottomTabBar hidden on action screens** → Task 1 (flag) + Task 2 (AppShell conditional render + pad swap) + Task 3 (flag lifecycle). ✅
- **C4 Row double-inset** → Task 4 (drop `px-4`, keep `mx-4`). ✅
- **I1 Header centering + back-chevron fallback + dynamic property title** → Task 5 Step 1 (`justify-center`, leading chevron when `!ready` non-root, `/property/` → "Property"). ✅
- **I2 EmptyState illustration + H2** → Task 6 (`Building2` 120px, `text-[0.9375rem]/600`). ✅
- **M11 tab-bar press scale (folded in, file adjacent)** → Task 5 Step 2. ✅

**Placeholder scan:** No "TBD/TODO/later". Every code step shows the exact replacement. ✅
**Type consistency:** `useUiStore` shape in Task 1 matches consumers in Tasks 2 & 3 (`mainButtonActive`, `setMainButtonActive`). ✅
**Out of scope (deferred to Sprint B):** I3 Earnings hero promotion, I4 OrderBook cumulative+hairlines, M1–M10 typography/motion/semantic-color polish. These are tracked in the audit findings table and will be planned separately — not blocked by Sprint A.

---

## Final Gate (after all 6 tasks)

1. `npm test && npm run check` — both green.
2. Re-run `/design-review` on Home, Marketplace, Property detail, Buy flow, Earnings. C1–C4 + I1 + I2 items must now PASS.
3. Ownership guard recheck: every touched file < 350 lines (all are well under), single responsibility, no component imports `lib/ton`/`lib/mock`/`lib/api`/`lib/telegram`/`@tonconnect`/`@telegram-apps` directly (`Header` imports `useTelegram` — the sanctioned hook, fine).
4. Commit log shows 6 `fix(phase3-sprint-a): ...` commits over base `d6339fb`.