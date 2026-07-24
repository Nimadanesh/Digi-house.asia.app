# Phase 2 Parallel Foundation Subset — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the runnable, native-Telegram foundation shell (Telegram SDK wiring + mock data layer + AppShell + 4 tabs + 6 placeholder pages) that completes ROADMAP Phase 2's exit gate — without touching the merged `lib/ton/**` and without building any finished feature screen.

**Architecture:** A single client provider tree composes **TelegramProvider → TonConnectUIProvider → QueryClientProvider**. Components consume only three hook families (`useTelegram`, `useTonConnect` [already built], TanStack Query data hooks); mock repos hide behind `lib/api/**` interfaces plus a single `getRepo()` injection point (one-folder swap for the real backend). Honesty: `mock/earnings.ts`'s `tickPayout()` flips `pending → paid` and stamps `makeSyntheticTxHash()` → `"simulated:<id>"`; the Earnings placeholder page shows the canonical disclaimer and the simulated badge on the Paid pill.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict (5.6, no `any`), Tailwind v4 (oklch tokens in `src/app/globals.css`), `@telegram-apps/sdk-react@3.3.9` (3.x signal-based — `init()` + `useSignal()`), `@tonconnect/ui-react@3` (unchanged), TanStack Query v5, Zustand v5 (`persist` + `createJSONStorage`), lucide-react@1.6.1 (stroke-1.75).

## Global Constraints (from the spec — copy-and-abide verbatim values)
- **TypeScript strict, no `any`** (tsconfig on). Money = integer minor units (cents); TON = nanoTON (bigint per TonConnect API).
- **File ownership:** one responsibility per file; ≤350 lines soft / ≤500 hard. Components never import `lib/ton/**`, `lib/mock/**`, `lib/api/**`, `lib/telegram/**`, or `@tonconnect/*`; they go through hooks.
- **MVP payout honesty:** canonical disclaimer text is exactly `"simulated weekly payout · on-chain verifiable post-MVP"` (lives once, in `lib/constants.ts`); paid pill carries a muted `"simulated"` badge; `txHash` on mock paid entries is `"simulated:<uuid>"` — never claim on-chain settlement / "in your wallet" / "verifiable now".
- **Native-Telegram tokens:** `bg-card rounded-[12px]` no-shadow blocks; inset-left-16 hairlines; `--font-sans` system stack; `.tnum` on every money/share/TON/ratio figure; max-w-480; safe-area via `env(safe-area-inset-*)`. One accent (`--primary`); `--success`/`--danger` reserved for finance up/down + paid/pending.
- **Test gate:** `npm run check` (lint + typecheck + build) AND `/design-review` both green before phase close. `npm test` stays green throughout.
- **Decided trade-off from TECH_STACK Decisions log:** `@telegram-apps/sdk-react@3.3.9` is signal-based — `init()` returns a cleanup fn; components (`themeParams`, `backButton`, `mainButton`, `viewport`, `hapticFeedback`, `miniApp`, `closingBehavior`) are singleton namespaces read via the React binding `useSignal()`. The old hook names (`useThemeParams` etc.) do NOT exist.
- **Testnet:** `NEXT_PUBLIC_TON_NETWORK=testnet` (env already wired); never flip to mainnet inside this plan.
- **Commits:** one per task; commit message format `feat(shell): ...` / `feat(mock): ...` etc.

---

## File Structure (decomposition decisions — locked here)

| File | Responsibility | Source |
|---|---|---|
| `src/app/layout.tsx` | RootLayout: system-font tokens, metadata, theme color | Modify (drop Geist) |
| `src/app/page.tsx` | redirect `/` → `/home` | Modify |
| `src/app/providers.tsx` | Compose Telegram → TonConnect → QueryClient providers | Modify |
| `src/app/(app)/layout.tsx` | Wrap AppShell | Create |
| `src/app/(app)/home/page.tsx` | placeholder (skeleton + empty) | Create |
| `src/app/(app)/marketplace/page.tsx` | placeholder | Create |
| `src/app/(app)/property/[id]/page.tsx` | placeholder | Create |
| `src/app/(app)/earnings/page.tsx` | placeholder + simulated disclaimer | Create |
| `src/app/(app)/portfolio/page.tsx` | placeholder | Create |
| `src/app/(app)/settings/page.tsx` | placeholder (no tab) | Create |
| `src/lib/format.ts` | `usd ton shortAddr pct weekLabel weeklyRent projectedYield` | Create |
| `src/lib/constants.ts` | `ROUTES`, `TABS`, `PAYOUT_DISCLAIMER`, `DEFAULTS` | Create |
| `src/lib/telegram/TelegramProvider.tsx` | `init()` + `miniApp.ready()` + viewport/closingBehavior mount + header/bg color | Create |
| `src/lib/telegram/theme-mapper.ts` | map live themeParams → `tg-*` CSS vars | Create |
| `src/lib/telegram/haptics.ts` | wrap haptic signals + no-op fallbacks | Create |
| `src/lib/telegram/signals.ts` | thin re-export of signals used | Create |
| `src/lib/telegram/index.ts` | barrel | Create |
| `src/lib/query/client.ts` | `makeQueryClient()` + default options | Create |
| `src/lib/api/repos.ts` | `MarketplaceRepo`, `OrderBookRepo`, `PortfolioRepo`, `EarningsRepo`, `TxRepo` interfaces | Create |
| `src/lib/api/getRepo.ts` | Injection point → returns mock set | Create |
| `src/lib/mock/sleep.ts` | `sleep(ms)` | Create |
| `src/lib/mock/seed.ts` | deterministic data generator (all mock invariants) | Create |
| `src/lib/mock/marketplace.ts` `orderbook.ts` `portfolio.ts` `earnings.ts` `transaction.ts` | one `Mock*Repo` per file | Create |
| `src/lib/mock/index.ts` | barrel composing the mock set | Create |
| `src/hooks/useTelegram.ts` `useTheme.ts` `useMarketplace.ts` `usePortfolio.ts` `useEarnings.ts` `useOrderBook.ts` + `index.ts` | one consumer facade per file | Create |
| `src/stores/settings.store.ts` `ui.store.ts` | (persisted `role|onboarded|useTelegramTheme`) + (ephemeral tab/sheet/selected property) | Create |
| `src/types/{user,property,order,position,earnings,transaction,telegram,index}.ts` | mirror DATA_MODELS.md | Create |
| `src/components/layout/AppShell.tsx` `Header.tsx` `BottomTabBar.tsx` `MainButtonBridge.tsx` | one native chrome piece per file | Create |
| `src/components/common/{Block,Row,Skeleton,EmptyState,StatusPill}.tsx` | DESIGN_SYSTEM primitives | Create |
| `src/lib/format.test.ts` (TDD companion to Task 1) | pure-helper unit tests | Create |
| `docs/superpowers/specs/...` and `docs/superpowers/plans/...` (this plan) | spec + plan, already committed | — |

---

### Task 1: Drop Geist + add `constants.ts` and `format.ts` (TDD)

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/lib/constants.ts`, `src/lib/format.ts`, `src/lib/format.test.ts`

**Interfaces:**
- Consumes: `@/types/units` (`Usd`, `NanoTon`, `Shares` from the TON foundation — already merged)
- Produces:
  - `ROUTES` (`{ home, marketplace, property, earnings, portfolio, settings }`), `TABS` (array of 4 `{href,label,icon:LucideIcon}`), `PAYOUT_DISCLAIMER = "simulated weekly payout · on-chain verifiable post-MVP"`, `DEFAULTS.payoutTickMs = 60_000`
  - `format.usd(minor): string`, `format.ton(nano): string`, `format.shortAddr(a, {prefix,suffix}), `format.pct(ratio)`, `format.weekLabel(iso)`, `format.weeklyRent(annualRentUsd)`, `format.projectedYield(weeklyRentUsd, sharesOwned, totalShares)`

- [ ] **Step 1: Write the failing test** — `src/lib/format.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  usd, ton, shortAddr, pct, weekLabel, weeklyRent, projectedYield,
} from "@/lib/format";

describe("format", () => {
  it("usd formats cents to $X.XX with tabular-nums-aligned precision", () => {
    expect(usd(12500)).toBe("$125.00");
    expect(usd(0)).toBe("$0.00");
    expect(usd(5)).toBe("$0.05");
  });

  it("ton formats nanoTON as decimal TON, 2–4 fractional digits", () => {
    expect(ton(1_000_000_000n)).toBe("1.00 TON");
    expect(ton(10_500_000n)).toBe("0.0105 TON");
    expect(ton(0n)).toBe("0.00 TON");
  });

  it("shortAddr truncates long addresses and preserves short ones", () => {
    expect(shortAddr("EQARULx2r6JmOuMoQn7jVr8m9Rrjv0s4kq5t8s7q5t8s4kq5")).toBe("EQAR…4kq5");
    expect(shortAddr("EQAB")).toBe("EQAB");
  });

  it("pct renders a 0..1 ratio with 1 decimal under 10% else 0", () => {
    expect(pct(0.005)).toBe("0.5%");
    expect(pct(0.5)).toBe("50%");
    expect(pct(1)).toBe("100%");
  });

  it("weekLabel renders 'Mon D' from an ISO Monday", () => {
    expect(weekLabel("2026-07-20")).toBe("Jul 20");
  });

  it("weeklyRent floors annual rent / 52 to integer cents", () => {
    expect(weeklyRent(52_0000)).toBe(1_0000);     // $5,200 / 52 = $100.00 -> 10000 cents
    expect(weeklyRent(52_0001)).toBe(1_0000);     // floor
  });

  it("projectedYield floors weekly × share ratio to cents", () => {
    // weekly 10000 cents * 5 shares / 1000 total = 50 cents
    expect(projectedYield(10_000, 5, 1000)).toBe(50);
    expect(projectedYield(10_000, 0, 1000)).toBe(0);
    expect(projectedYield(10_000, 5, 0)).toBe(0);   // totalShares=0 guard
  });
});
```

- [ ] **Step 2: Run, verify it fails**

```bash
npm test -- src/lib/format.test.ts
```
Expected: FAIL — "Cannot find module '@/lib/format'".

- [ ] **Step 3: Drop Geist and add `constants.ts`** — `src/lib/constants.ts`:

```ts
// File responsibility: literals only — routes, tab list, disclaimer text, defaults.
import { Home, Store, Wallet, PieChart } from "lucide-react";

export const ROUTES = {
  home: "/home",
  marketplace: "/marketplace",
  property: (id: string) => `/property/${id}`,
  earnings: "/earnings",
  portfolio: "/portfolio",
  settings: "/settings",
} as const;

export interface TabDef { href: string; label: string; icon: typeof Home }

export const TABS: readonly TabDef[] = [
  { href: ROUTES.home,        label: "Home",        icon: Home },
  { href: ROUTES.marketplace, label: "Marketplace", icon: Store },
  { href: ROUTES.earnings,   label: "Earnings",    icon: Wallet },
  { href: ROUTES.portfolio,  label: "Portfolio",   icon: PieChart },
] as const;

export const PAYOUT_DISCLAIMER = "simulated weekly payout · on-chain verifiable post-MVP";

export const DEFAULTS = { payoutTickMs: 60_000 } as const;
```

- [ ] **Step 4: Add `format.ts`** — `src/lib/format.ts`:

```ts
// File responsibility: pure display formatters for money/TON/addresses/dates. No React, no DOM, no network.
// Money in = integer minor units (cents). TON in = nanoTON (bigint).

export function usd(minor: number): string {
  return `$${(minor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function ton(nano: bigint): string {
  const n = Number(nano) / 1e9;
  const fixed = n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  return `${fixed} TON`;
}

export function shortAddr(a: string, opts: { prefix?: number; suffix?: number } = {}): string {
  if (!a) return "";
  const prefix = opts.prefix ?? 4;
  const suffix = opts.suffix ?? 4;
  if (a.length <= prefix + suffix + 1) return a;
  return `${a.slice(0, prefix)}…${a.slice(-suffix)}`;
}

export function pct(ratio: number): string {
  return `${(ratio * 100).toFixed(ratio < 0.1 ? 1 : 0)}%`;
}

export function weekLabel(isoMonday: string): string {
  return new Date(isoMonday).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** floor(annualRentUsdCents / 52) — integer minor units. */
export function weeklyRent(annualRentUsdCents: number): number {
  return Math.floor(annualRentUsdCents / 52);
}

/** floor(weeklyRentUsdCents * sharesOwned / totalShares) — integer minor units. 0 when totalShares=0. */
export function projectedYield(weeklyRentUsdCents: number, sharesOwned: number, totalShares: number): number {
  return totalShares > 0 ? Math.floor(weeklyRentUsdCents * (sharesOwned / totalShares)) : 0;
}
```

- [ ] **Step 5: Drop Geist from `layout.tsx`** — `src/app/layout.tsx` becomes:

```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DigiHouse — Fractional Property on TON",
  description: "Buy, sell, and earn weekly rental yield from fractionalized real estate on the TON blockchain.",
  applicationName: "DigiHouse",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#17212b",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full bg-background text-foreground font-sans">{children}</body>
    </html>
  );
}
```
(The system stack is wired via `--font-sans` in `globals.css`.)

- [ ] **Step 6: Run tests + typecheck**

```bash
npm test -- src/lib/format.test.ts
```
Expected: 7 passed.
```bash
npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/format.ts src/lib/format.test.ts src/lib/constants.ts src/app/layout.tsx
git commit -m "feat(shell): drop Geist; add format helpers (TDD) + constants"
```

---

### Task 2: Types mirror (DATA_MODELS.md)

**Files:** Create the 7 type files + barrel under `src/types/`.

**Interfaces:**
- Consumes: `@/types/units` (`Usd`, `NanoTon`, `Shares`), `@/types/ton` (`SendTxResult`) from prior work
- Produces: `UserProfile`, `Property`, `Listing`, `Order`, `OrderBookState`, `Holding`, `PortfolioSummary`, `EarningsEntry`, `EarningsSummary`, `RentalDistribution`, `Transaction`, `TelegramThemeParams`. Every later task imports these from `@/types`.

- [ ] **Step 1: Write the type files** — `src/types/user.ts`:

```ts
export type UserRole = "investor" | "owner";

export interface UserProfile {
  id: string;
  displayName: string;
  username?: string;
  photoUrl?: string;
  role: UserRole;
  walletAddress: string | null;
  onboarded: boolean;
  useTelegramTheme: boolean;
  createdAt: string;
}
```

`src/types/property.ts`:
```ts
export type PropertyStatus = "funding" | "funded" | "resale";

export interface Property {
  id: string;
  title: string;
  location: string;
  description: string;
  images: string[];
  totalShares: number;
  sharePriceUsd: number;   // minor units
  status: PropertyStatus;
  ownerWalletAddress: string;
  annualRentUsd: number;   // minor units
  createdAt: string;
}

export interface Listing extends Property {
  sharesSold: number;
  sharesRemaining: number;
  fundingProgressRatio: number; // 0..1
}
```

`src/types/order.ts`:
```ts
export type OrderSide = "buy" | "sell";
export type OrderStatus = "open" | "filled" | "cancelled" | "rejected";

export interface Order {
  id: string;
  propertyId: string;
  makerAddress: string;
  side: OrderSide;
  priceUsd: number;   // minor units per share
  quantity: number;
  filledQuantity: number;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderBookLevel {
  priceUsd: number;
  quantity: number;
  cumulative: number;
}

export interface OrderBookState {
  propertyId: string;
  bids: OrderBookLevel[];   // DESC by price
  asks: OrderBookLevel[];   // ASC by price
  bestBidUsd?: number;
  bestAskUsd?: number;
  lastTradeUsd?: number;
}
```

`src/types/position.ts`:
```ts
import type { Order } from "./order";

export interface Holding {
  propertyId: string;
  sharesOwned: number;
  avgCostUsd: number;             // minor units per share (avg)
  currentValueUsd: number;       // minor units total market value
  pendingWeekEarningsUsd: number; // minor units, next distribution
  shareRatio: number;             // 0..1
}

export interface PortfolioSummary {
  totalValueUsd: number;
  totalInvestedUsd: number;
  totalEarningsUsd: number;
  weeklyProjectedUsd: number;
  holdings: Holding[];
  openOrders: Order[];
}
```

`src/types/earnings.ts`:
```ts
export type EarningsStatus = "paid" | "pending";

export interface EarningsEntry {
  id: string;
  userId: string;
  propertyId: string;
  weekOf: string;              // ISO Monday
  amountUsd: number;           // minor units paid this week
  tonAmount: number;           // nanoTON
  shareRatio: number;          // 0..1
  status: EarningsStatus;
  txHash?: string;             // "simulated:<uuid>" in MVP
}

export interface EarningsSummary {
  allTimeUsd: number;
  thisWeekProjectedUsd: number;
  projectedNextWeekUsd: number;
  entries: EarningsEntry[];
}

export interface RentalDistribution {
  id: string;
  propertyId: string;
  weekOf: string;
  rentPoolUsd: number;
  rentPoolNanoTon: number;
  payoutDay: string;
  status: "scheduled" | "distributing" | "completed";
  totalShares: number;
  createdAt: string;
}
```

`src/types/transaction.ts`:
```ts
export type TxKind = "buy" | "sell" | "earnings" | "withdraw";
export type TxStatus = "pending" | "success" | "failed";

export interface Transaction {
  id: string;
  kind: TxKind;
  propertyId?: string;
  userId: string;
  shares?: number;
  amountUsd: number;   // minor units
  tonAmount?: number;  // nanoTON
  status: TxStatus;
  txHash?: string;
  error?: string;
  createdAt: string;
}
```

`src/types/telegram.ts`:
```ts
export interface TelegramThemeParams {
  bg_color?: string; text_color?: string; hint_color?: string;
  button_color?: string; button_text_color?: string;
  secondary_bg_color?: string; section_bg_color?: string;
  section_header_text_color?: string; subtitle_text_color?: string;
  accent_text_color?: string; destructive_text_color?: string;
  header_background_color?: string; link_color?: string;
}

export type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
export type HapticNotification = "error" | "success" | "warning";
```

`src/types/index.ts`:
```ts
export * from "./user";
export * from "./property";
export * from "./order";
export * from "./position";
export * from "./earnings";
export * from "./transaction";
export * from "./telegram";
export * from "./units";
```

- [ ] **Step 2: typecheck**

```bash
npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/user.ts src/types/property.ts src/types/order.ts src/types/position.ts src/types/earnings.ts src/types/transaction.ts src/types/telegram.ts src/types/index.ts
git commit -m "feat(types): mirror DATA_MODELS domain types"
```

---

### Task 3: Stores (Zustand)

**Files:**
- Create: `src/stores/settings.store.ts`, `src/stores/ui.store.ts`

**Interfaces:**
- Consumes: `@/types/user` (`UserRole`)
- Produces: `useSettingsStore` (`{ role, setRole, onboarded, setOnboarded, useTelegramTheme, setUseTelegramTheme }`, persisted); `useUiStore` (`{ activeTab, setActiveTab, selectedPropertyId, setSelectedPropertyId, sheetOpen, setSheetOpen, payoutCursor, setPayoutCursor }`, ephemeral)

- [ ] **Step 1: `settings.store.ts`** (persisted):

```ts
"use client";
// File responsibility: persisted user settings slice (role/onboarded/telegram-theme). Minimal.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserRole } from "@/types/user";

interface SettingsState {
  role: UserRole | null;
  onboarded: boolean;
  useTelegramTheme: boolean;   // default false -> DigiHouse static palette
  setRole: (r: UserRole) => void;
  setOnboarded: (v: boolean) => void;
  setUseTelegramTheme: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      role: null,
      onboarded: false,
      useTelegramTheme: false,
      setRole: (role) => set({ role }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setUseTelegramTheme: (useTelegramTheme) => set({ useTelegramTheme }),
    }),
    {
      name: "digihouse-settings",
      storage: createJSONStorage(() => (typeof localStorage !== "undefined" ? localStorage : (undefined as unknown as Storage))),
      partialize: (s) => ({ role: s.role, onboarded: s.onboarded, useTelegramTheme: s.useTelegramTheme }),
    },
  ),
);
```

- [ ] **Step 2: `ui.store.ts`** (ephemeral):

```ts
"use client";
// File responsibility: ephemeral UI slice — active tab, selected property, sheet flags, payout cursor.
import { create } from "zustand";

interface UiState {
  activeTab: string;
  selectedPropertyId: string | null;
  sheetOpen: boolean;
  payoutCursor: number;     // epoch ms last tickPayout
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

- [ ] **Step 3: typecheck + build (next handles SSR safely; verify no overlay crash)**

```bash
npm run typecheck && npm run build
```
Expected: 0 errors; build green.

- [ ] **Step 4: Commit**

```bash
git add src/stores/settings.store.ts src/stores/ui.store.ts
git commit -m "feat(stores): persisted settings store + ephemeral UI store (Zustand)"
```

---

### Task 4: Telegram SDK layer (`lib/telegram/**`)

**Files:**
- Create: `src/lib/telegram/signals.ts`, `haptics.ts`, `theme-mapper.ts`, `TelegramProvider.tsx`, `index.ts`
- Create: `src/hooks/useTelegram.ts`

**Interfaces:**
- Consumes: `@telegram-apps/sdk` singleton namespaces (`init`, `miniApp`, `viewport`, `backButton`, `mainButton`, `hapticFeedback`, `themeParams`, `closingBehavior`); `@telegram-apps/sdk-react` `useSignal`
- Produces: `<TelegramProvider>`; `useTelegram()` → `{ viewport: {width,height,stableHeight,safeAreaInsets}, backButton: {show,hide,onClick,offClick}, mainButton: {setParams,hide,onClick,offClick,state}, haptics: {impact,notification,selection}, themeParams, isDark, ready }`

- [ ] **Step 1: `signals.ts`** (thin re-exports used signals — keeps imports in hooks tiny):

```ts
// File responsibility: thin re-export of the signals this app reads. No logic.
export {
  init,
  backButton,
  mainButton,
  hapticFeedback,
  themeParams,
  viewport,
  miniApp,
  closingBehavior,
} from "@telegram-apps/sdk";
export type { SafeAreaInsets, ThemeParams } from "@telegram-apps/sdk";
```

- [ ] **Step 2: `haptics.ts`** (wraps signals + no-op fallbacks for unsupported/reduced-motion):

```ts
"use client";
// File responsibility: safe haptic wrappers. No-op if unsupported or reduced-motion.
import { hapticFeedback } from "./signals";

function reducedMotion(): boolean {
  return typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export const haptics = {
  impact(style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") {
    if (reducedMotion()) return;
    try { hapticFeedback.impactOccurred(style as never); } catch { /* unsupported */ }
  },
  notification(type: "error" | "success" | "warning") {
    if (reducedMotion()) return;
    try { hapticFeedback.notificationOccurred(type as never); } catch { /* unsupported */ }
  },
  selection() {
    if (reducedMotion()) return;
    try { hapticFeedback.selectionChanged(); } catch { /* unsupported */ }
  },
};
```

- [ ] **Step 3: `theme-mapper.ts`** (map live themeParams → `tg-*` CSS vars when useTelegramTheme enabled):

```ts
"use client";
// File responsibility: map Telegram themeParams to CSS custom properties on :root.
import type { ThemeParams } from "./signals";

// Telegram themeParams key -> our css var name
const MAP: Record<keyof ThemeParams, string> = {
  backgroundColor: "--tg-bg-color",
  textColor: "--tg-text-color",
  hintColor: "--tg-hint-color",
  buttonColor: "--tg-button-color",
  buttonTextColor: "--tg-button-text-color",
  secondaryBackgroundColor: "--tg-secondary-bg-color",
  sectionBgColor: "--tg-section-bg-color",
  sectionHeaderTextColor: "--tg-section-header-text-color",
  subtitleTextColor: "--tg-subtitle-text-color",
  accentTextColor: "--tg-accent-text-color",
  destructiveTextColor: "--tg-destructive-text-color",
  headerBackgroundColor: "--tg-header-bg-color",
  linkColor: "--tg-link-color",
  bottomBarBgColor: "--tg-bottom-bar-bg-color",
  sectionSeparatorColor: "--tg-section-separator-color",
} as Record<keyof ThemeParams, string>;

export function applyTelegramThemeParams(params: ThemeParams): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(params) as [keyof ThemeParams, string | undefined][]) {
    if (v) root.style.setProperty(MAP[k] ?? `--tg-${String(k)}`, v);
  }
}
```

- [ ] **Step 4: `TelegramProvider.tsx`** (the side-effect owner):

```tsx
"use client";
// File responsibility: initialize the Telegram SDK, expand viewport, set header/bg color, signal ready.
// React components consume `useTelegram()` — never this provider directly for state.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSignal } from "@telegram-apps/sdk-react";
import { init, miniApp, viewport, closingBehavior, backButton, mainButton, themeParams } from "./signals";
import { applyTelegramThemeParams } from "./theme-mapper";

interface TelegramContextValue { ready: boolean; isDark: boolean }
const TelegramContext = createContext<TelegramContextValue>({ ready: false, isDark: true });

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const isDark = useSignal(themeParams.isDark);

  useEffect(() => {
    const cleanup = init({ acceptCustomStyles: true });
    try { miniApp.ready(); } catch { /* not in Telegram yet */ }
    try { void miniApp.setHeaderColor("#17212b"); } catch { /* ignore */ }
    try { void miniApp.setBackgroundColor("#17212b"); } catch { /* ignore */ }
    try { void viewport.mount(); } catch { /* ignore */ }
    try { void viewport.expand(); } catch { /* ignore */ }
    try { closingBehavior.mount(); } catch { /* ignore */ }
    backButton.mount(); mainButton.mount();
    setReady(true);
    return () => { try { cleanup(); } catch { /* ignore */ } };
  }, []);

  const value = useMemo<TelegramContextValue>(() => ({ ready, isDark }), [ready, isDark]);
  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}

// Live theme binding helper used by useTheme (when settings.useTelegramTheme === true).
export function bindLiveThemeVars(): void {
  try { themeParams.bindCssVars(); } catch { /* ignore */ }
  applyTelegramThemeParams(themeParams.state() as Parameters<typeof applyTelegramThemeParams>[0]);
}

export function useTelegramReady(): boolean {
  return useContext(TelegramContext).ready;
}
```

- [ ] **Step 5: `useTelegram.ts`** (consumer facade):

```ts
"use client";
// File responsibility: the ONLY Telegram SDK surface components/hooks may call.
// Returns reactive viewport + safe-area insets (via useSignal), BackButton/MainButton API,
// haptics, and theme params. Components never import @telegram-apps/* directly.
import { useCallback } from "react";
import { useSignal } from "@telegram-apps/sdk-react";
import { viewport, backButton, mainButton, themeParams, type SafeAreaInsets } from "@/lib/telegram/signals";
import { haptics } from "@/lib/telegram/haptics";
import { useTelegramReady } from "@/lib/telegram/TelegramProvider";

export interface TelegramSurface {
  ready: boolean;
  isDark: boolean;
  viewport: { width: number; height: number; stableHeight: number; isExpanded: boolean };
  safeAreaInsets: SafeAreaInsets;
  backButton: { show: () => void; hide: () => void; onClick: (fn: () => void) => () => void };
  mainButton: { setParams: (p: { text?: string; color?: string; textColor?: string; isEnabled?: boolean }) => void; hide: () => void; onClick: (fn: () => void) => () => void };
  haptics: typeof haptics;
  themeParams: ReturnType<typeof themeParams.state>;
}

export function useTelegram(): TelegramSurface {
  const ready = useTelegramReady();
  const isDark = useSignal(themeParams.isDark);
  const width = useSignal(viewport.width);
  const height = useSignal(viewport.height);
  const stableHeight = useSignal(viewport.stableHeight);
  const isExpanded = useSignal(viewport.isExpanded);
  const safeAreaInsets = useSignal(viewport.safeAreaInsets);
  const themeParamsValue = useSignal(themeParams.state);

  const onClickBack = useCallback((fn: () => void) => {
    backButton.onClick(fn);
    return () => backButton.offClick(fn);
  }, []);
  const onClickMain = useCallback((fn: () => void) => {
    mainButton.onClick(fn);
    return () => mainButton.offClick(fn);
  }, []);

  return {
    ready, isDark,
    viewport: { width, height, stableHeight, isExpanded },
    safeAreaInsets,
    backButton: { show: backButton.show, hide: backButton.hide, onClick: onClickBack },
    mainButton: { setParams: (p) => mainButton.setParams(p as never), hide: mainButton.hide, onClick: onClickMain },
    haptics,
    themeParams: themeParamsValue,
  };
}
```

- [ ] **Step 6: `lib/telegram/index.ts` barrel**:

```ts
export { TelegramProvider, useTelegramReady, bindLiveThemeVars } from "./TelegramProvider";
export { haptics } from "./haptics";
export { applyTelegramThemeParams } from "./theme-mapper";
export { useTelegram, type TelegramSurface } from "@/hooks/useTelegram";
```

- [ ] **Step 7: typecheck + build**

```bash
npm run typecheck && npm run build
```
Expected: 0 errors. (If `setHeaderColor`/`setBackgroundColor` overload names differ, fix the call sites — the SDK DTS exports `setMiniAppHeaderColor` on the namespace, but `miniApp.setHeaderColor` is the re-exported alias.)

- [ ] **Step 8: Commit**

```bash
git add src/lib/telegram/ src/hooks/useTelegram.ts
git commit -m "feat(telegram): TelegramProvider + useTelegram facade (3.x signal-based SDK)"
```

---

### Task 5: API repo interfaces (`lib/api/repos.ts`)

**Files:**
- Create: `src/lib/api/repos.ts`

**Interfaces:**
- Consumes: `@/types/{property,order,position,earnings,transaction}`
- Produces: `MarketplaceRepo`, `OrderBookRepo`, `PortfolioRepo`, `EarningsRepo`, `TxRepo` interfaces

- [ ] **Step 1: Write the interfaces** — `src/lib/api/repos.ts`:

```ts
// File responsibility: repository CONTRACTS. The mock implements these; the real TON/backend swaps in by
// changing lib/api/getRepo.ts. Hooks depend on these interfaces — never on the mock impl.
import type { Listing, PropertyStatus } from "@/types/property";
import type { OrderBookState, Order, OrderSide } from "@/types/order";
import type { PortfolioSummary } from "@/types/position";
import type { EarningsSummary } from "@/types/earnings";
import type { Transaction } from "@/types/transaction";

export interface MarketplaceRepo {
  list(filter?: { status?: PropertyStatus; query?: string }): Promise<Listing[]>;
  get(propertyId: string): Promise<Listing>;
}

export interface OrderBookRepo {
  get(propertyId: string): Promise<OrderBookState>;
  placeOrder(input: { propertyId: string; side: OrderSide; priceUsd: number; quantity: number }): Promise<Order>;
  cancelOrder(orderId: string): Promise<void>;
}

export interface PortfolioRepo {
  summary(): Promise<PortfolioSummary>;
}

export interface EarningsRepo {
  summary(): Promise<EarningsSummary>;
  tickPayout(): Promise<{ distributionId: string; paidEntries: number }>;
}

export interface TxRepo {
  buy(input: { propertyId: string; quantity: number; priceUsdPerShare: number }): Promise<Transaction>;
}

export interface Repos {
  marketplace: MarketplaceRepo;
  orderBook: OrderBookRepo;
  portfolio: PortfolioRepo;
  earnings: EarningsRepo;
  tx: TxRepo;
}
```

- [ ] **Step 2: typecheck**

```bash
npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/repos.ts
git commit -m "feat(api): repository interfaces (MarketplaceRepo, OrderBookRepo, PortfolioRepo, EarningsRepo, TxRepo)"
```

---

### Task 6: Mock layer (`lib/mock/**`)

**Files:**
- Create: `src/lib/mock/sleep.ts`, `seed.ts`, `marketplace.ts`, `orderbook.ts`, `portfolio.ts`, `earnings.ts`, `transaction.ts`, `index.ts`, `src/lib/api/getRepo.ts`

**Interfaces:**
- Consumes: `@/lib/api/repos` + DATA_MODELS mock seed invariants
- Produces: `getRepo(): Repos` returning the mock set; `MockEarningsRepo.tickPayout()` stamps `makeSyntheticTxHash()`

- [ ] **Step 1: `sleep.ts`**:

```ts
// File responsibility: shared latency helper to mimic mobile-network delays.
export function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }
export const jitter = (lo = 250, hi = 700) => Math.floor(lo + Math.random() * (hi - lo));
```

- [ ] **Step 2: `seed.ts`** — deterministic fixtures. Generate 6 properties (2 funding / 2 funded / 2 resale), one investor with 2 holdings, ≥4 weekly EarningsEntry rows mixing paid/pending spanning ≥4 weeks, ≥1 RentalDistribution per owned property per seeded week, ≥1 open order, one failed + one pending Transaction. Use `makeSyntheticTxHash()` from `@/lib/ton/sendTx` for every paid `txHash` (honesty). The file may approach 250 lines — that is the seed generator's single concern. Export `seed` as the frozen source-of-truth object. Skeleton (executor fills the 6 properties' literal data — real values, not placeholders; e.g. property titles like "Marina Vista Apt 4B", locations like "Dubai Marina, UAE"):

```ts
// File responsibility: generate the deterministic mock seed (every UI state reachable).
import type { Listing, Property, PropertyStatus } from "@/types/property";
import type { Order, OrderBookState } from "@/types/order";
import type { Holding, PortfolioSummary } from "@/types/position";
import type { EarningsEntry, EarningsSummary, RentalDistribution } from "@/types/earnings";
import type { Transaction } from "@/types/transaction";
import type { UserProfile } from "@/types/user";
import { makeSyntheticTxHash } from "@/lib/ton/sendTx";

const now = Date.parse("2026-07-24T12:00:00Z");
const iso = (d: Date) => d.toISOString();

const PROPERTIES: Listing[] = [
  // 2 funding, 2 funded, 2 resale — fill literal id/title/location/description/images/totalShares/
  // sharePriceUsd/status/ownerWalletAddress(= "0:" + 64 hex)/annualRentUsd/createdAt + sharesSold/
  // sharesRemaining/fundingProgressRatio. All annualRentUsd non-zero.
];

const USER: UserProfile = { /* id, displayName="Aria Demo", role="investor", walletAddress=null or friendly, onboarded=true, useTelegramTheme=false, createdAt=iso */ } as UserProfile;

const HOLDINGS: Holding[] = [ /* 2 entries referencing PROPERTIES ids */ ];

// Build 4+ weekly EarningsEntry rows spanning 4+ weeks; "paid" rows use makeSyntheticTxHash().
const EARNINGS_ENTRIES: EarningsEntry[] = [];

const DISTRIBUTIONS: RentalDistribution[] = [];

const OPEN_ORDERS: Order[] = [ /* >=1 */ ];
const ORDER_BOOKS: OrderBookState[] = PROPERTIES.map(p => ({ propertyId: p.id, bids: [], asks: [], bestBidUsd: undefined, bestAskUsd: undefined, lastTradeUsd: undefined }));

const TRANSACTIONS: Transaction[] = [
  // >=1 failed + >=1 pending + >=1 success
];

export interface Seed {
  user: UserProfile;
  properties: Listing[];
  holdings: Holding[];
  earnings: EarningsEntry[];
  distributions: RentalDistribution[];
  openOrders: Order[];
  orderBooks: OrderBookState[];
  transactions: Transaction[];
}

export const seed: Seed = Object.freeze({
  user: USER, properties: PROPERTIES, holdings: HOLDINGS, earnings: EARNINGS_ENTRIES,
  distributions: DISTRIBUTIONS, openOrders: OPEN_ORDERS, orderBooks: ORDER_BOOKS, transactions: TRANSACTIONS,
});

export const seedPortfolioSummary = (): PortfolioSummary => ({ /* sum holdings, allTime, weeklyProjected */ }) as PortfolioSummary;
export const seedEarningsSummary = (): EarningsSummary => ({
  allTimeUsd: EARNINGS_ENTRIES.filter(e => e.status === "paid").reduce((s, e) => s + e.amountUsd, 0),
  thisWeekProjectedUsd: 0, // computed from pending entries for current week
  projectedNextWeekUsd: 0,
  entries: [...EARNINGS_ENTRIES].sort((a, b) => b.weekOf.localeCompare(a.weekOf)),
});
```
(The executor must complete the six properties' literal data and the seed-summariser helpers. Real values, not "TODO". Non-zero annualRent throughout. ≥4 weeks of earnings. One paid entry uses `makeSyntheticTxHash()`.)

- [ ] **Step 3: Five mock repo files** — one per interface, all with `await sleep(jitter())`:

`src/lib/mock/marketplace.ts`:
```ts
import type { MarketplaceRepo } from "@/lib/api/repos";
import type { Listing, PropertyStatus } from "@/types/property";
import { seed } from "./seed";
import { sleep, jitter } from "./sleep";

export function MockMarketplaceRepo(): MarketplaceRepo {
  return {
    async list(filter?: { status?: PropertyStatus; query?: string }) {
      await sleep(jitter());
      let r = [...seed.properties];
      if (filter?.status) r = r.filter(p => p.status === filter.status);
      if (filter?.query) { const q = filter.query.toLowerCase(); r = r.filter(p => p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)); }
      return r;
    },
    async get(propertyId: string) { await sleep(jitter()); const p = seed.properties.find(x => x.id === propertyId); if (!p) throw new Error("property not found"); return p; },
  };
}
```

`src/lib/mock/orderbook.ts`:
```ts
import type { OrderBookRepo } from "@/lib/api/repos";
import type { Order, OrderBookState, OrderSide } from "@/types/order";
import { seed } from "./seed";
import { sleep, jitter } from "./sleep";

export function MockOrderBookRepo(): OrderBookRepo {
  return {
    async get(propertyId: string) { await sleep(jitter()); return seed.orderBooks.find(b => b.propertyId === propertyId) ?? { propertyId, bids: [], asks: [] }; },
    async placeOrder(input: { propertyId: string; side: OrderSide; priceUsd: number; quantity: number }) {
      await sleep(jitter());
      const o: Order = { id: `ord-${Date.now()}`, propertyId: input.propertyId, makerAddress: seed.user.walletAddress ?? "", side: input.side, priceUsd: input.priceUsd, quantity: input.quantity, filledQuantity: 0, status: "open", createdAt: new Date().toISOString() };
      return o;
    },
    async cancelOrder(_orderId: string) { await sleep(jitter()); },
  };
}
```

`src/lib/mock/portfolio.ts`:
```ts
import type { PortfolioRepo } from "@/lib/api/repos";
import type { PortfolioSummary } from "@/types/position";
import { seed, seedPortfolioSummary } from "./seed";
import { sleep, jitter } from "./sleep";

export function MockPortfolioRepo(): PortfolioRepo {
  return {
    async summary(): Promise<PortfolioSummary> {
      await sleep(jitter());
      return seedPortfolioSummary();
    },
  };
}
// (suppress unused import lint where applicable)
void seed;
```

`src/lib/mock/earnings.ts` — includes the synthetic-txHash `tickPayout()`:
```ts
import type { EarningsRepo } from "@/lib/api/repos";
import type { EarningsSummary } from "@/types/earnings";
import { seed, seedEarningsSummary } from "./seed";
import { sleep, jitter } from "./sleep";
import { makeSyntheticTxHash } from "@/lib/ton/sendTx";

export function MockEarningsRepo(): EarningsRepo {
  let entries = [...seed.earnings];
  return {
    async summary(): Promise<EarningsSummary> {
      await sleep(jitter());
      const paid = entries.filter(e => e.status === "paid");
      const pendingThisWeek = entries.filter(e => e.status === "pending");
      return {
        allTimeUsd: paid.reduce((s, e) => s + e.amountUsd, 0),
        thisWeekProjectedUsd: pendingThisWeek.reduce((s, e) => s + e.amountUsd, 0),
        projectedNextWeekUsd: pendingThisWeek.reduce((s, e) => s + e.amountUsd, 0),
        entries: [...entries].sort((a, b) => b.weekOf.localeCompare(a.weekOf)),
      };
    },
    async tickPayout(): Promise<{ distributionId: string; paidEntries: number }> {
      await sleep(jitter());
      let paid = 0;
      entries = entries.map(e => {
        if (e.status === "pending") { paid++; return { ...e, status: "paid" as const, txHash: makeSyntheticTxHash() }; }
        return e;
      });
      return { distributionId: `dist-${Date.now()}`, paidEntries: paid };
    },
  };
}
```

`src/lib/mock/transaction.ts`:
```ts
import type { TxRepo } from "@/lib/api/repos";
import type { Transaction } from "@/types/transaction";
import { seed } from "./seed";
import { sleep, jitter } from "./sleep";
import { makeSyntheticTxHash } from "@/lib/ton/sendTx";

export function MockTxRepo(): TxRepo {
  return {
    async buy(input: { propertyId: string; quantity: number; priceUsdPerShare: number }) {
      await sleep(jitter());
      const tx: Transaction = {
        id: `tx-${Date.now()}`, kind: "buy", propertyId: input.propertyId, userId: seed.user.id,
        shares: input.quantity, amountUsd: input.quantity * input.priceUsdPerShare,
        status: "success", txHash: makeSyntheticTxHash(), createdAt: new Date().toISOString(),
      };
      return tx;
    },
  };
}
```

`src/lib/mock/index.ts` barrel:
```ts
export { MockMarketplaceRepo } from "./marketplace";
export { MockOrderBookRepo } from "./orderbook";
export { MockPortfolioRepo } from "./portfolio";
export { MockEarningsRepo } from "./earnings";
export { MockTxRepo } from "./transaction";
export { seed } from "./seed";
```

- [ ] **Step 4: `getRepo.ts`** — `src/lib/api/getRepo.ts`:

```ts
// File responsibility: injection point. Phase 6+ replaces this body with the real TON/backend repos.
import type { Repos } from "./repos";
import { MockMarketplaceRepo, MockOrderBookRepo, MockPortfolioRepo, MockEarningsRepo, MockTxRepo } from "@/lib/mock";

let cached: Repos | null = null;
export function getRepo(): Repos {
  if (cached) return cached;
  cached = {
    marketplace: MockMarketplaceRepo(),
    orderBook: MockOrderBookRepo(),
    portfolio: MockPortfolioRepo(),
    earnings: MockEarningsRepo(),
    tx: MockTxRepo(),
  };
  return cached;
}
```

- [ ] **Step 5: typecheck + build**

```bash
npm run typecheck && npm run build
```
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/mock/ src/lib/api/getRepo.ts
git commit -m "feat(mock): mock data layer with synthetic-txHash tickPayout; getRepo injection point"
```

---

### Task 7: Query client + data hooks

**Files:**
- Create: `src/lib/query/client.ts`, `src/hooks/{useMarketplace,usePortfolio,useEarnings,useOrderBook}.ts`, `src/hooks/index.ts`

**Interfaces:**
- Consumes: `@tanstack/react-query` (`QueryClient`), `useQuery`; `getRepo`, env.payoutTickMs
- Produces: `makeQueryClient()`; `useMarketplace(filter?)`, `usePortfolio()`, `useEarnings()` (with `tickPayout` interval), `useOrderBook(propertyId)`

- [ ] **Step 1: `query/client.ts`**:

```ts
// File responsibility: one QueryClient instance + default options. Used by the provider in Task 11.
import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,    // marketplace default; portfolio/earnings hooks override to 0
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
```

- [ ] **Step 2: `useMarketplace.ts`**:

```ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";
import type { PropertyStatus } from "@/types/property";

export function useMarketplace(filter?: { status?: PropertyStatus; query?: string }) {
  return useQuery({
    queryKey: ["marketplace", filter ?? null],
    queryFn: () => getRepo().marketplace.list(filter),
    staleTime: 30_000,
  });
}
```

- [ ] **Step 3: `usePortfolio.ts`**:

```ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";

export function usePortfolio() {
  return useQuery({ queryKey: ["portfolio"], queryFn: () => getRepo().portfolio.summary(), staleTime: 0 });
}
```

- [ ] **Step 4: `useEarnings.ts`** — runs `tickPayout` on the configured cadence + invalidates:

```ts
"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getRepo } from "@/lib/api/getRepo";
import { env } from "@/lib/env";

export function useEarnings() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["earnings"],
    queryFn: () => getRepo().earnings.summary(),
    staleTime: 0,
  });
  useEffect(() => {
    const id = setInterval(async () => {
      const r = await getRepo().earnings.tickPayout();
      if (r.paidEntries > 0) qc.invalidateQueries({ queryKey: ["earnings"] });
    }, env.payoutTickMs);
    return () => clearInterval(id);
  }, [qc]);
  return query;
}
```

- [ ] **Step 5: `useOrderBook.ts`**:

```ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/api/getRepo";

export function useOrderBook(propertyId: string | null) {
  return useQuery({
    queryKey: ["orderBook", propertyId],
    queryFn: () => getRepo().orderBook.get(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: 30_000,
  });
}
```

- [ ] **Step 6: `hooks/index.ts` barrel**:

```ts
export { useTelegram, type TelegramSurface } from "./useTelegram";
export { useTonConnect } from "./useTonConnect";
export { useMarketplace } from "./useMarketplace";
export { usePortfolio } from "./usePortfolio";
export { useEarnings } from "./useEarnings";
export { useOrderBook } from "./useOrderBook";
```

- [ ] **Step 7: typecheck + build**

```bash
npm run typecheck && npm run build
```
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/query/client.ts src/hooks/useMarketplace.ts src/hooks/usePortfolio.ts src/hooks/useEarnings.ts src/hooks/useOrderBook.ts src/hooks/index.ts
git commit -m "feat(query): TanStack Query client + data hooks (useMarketplace/Portfolio/Earnings/OrderBook)"
```

---

### Task 8: Common native-Telegram components (`components/common/**`)

**Files:**
- Create: `src/components/common/{Block,Row,Skeleton,EmptyState,StatusPill}.tsx`

**Interfaces:**
- Consumes: `cn`, lucide icons (EmptyState), `PAYOUT_DISCLAIMER` (Earnings page uses StatusPill+badge later — no import here)
- Produces: `Block`, `Row`, `Skeleton`, `EmptyState`, `StatusPill` (props include `variant: "success"|"warning"|"danger"`, `simulated?: boolean`)

- [ ] **Step 1: `Block.tsx`** — `bg-card rounded-[12px]` no-shadow:

```tsx
import { cn } from "@/lib/utils";

export function Block({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("bg-card rounded-[12px]", className)}>{children}</div>;
}
```

- [ ] **Step 2: `Row.tsx`** — 48px min, inset-left hairline:

```tsx
import { cn } from "@/lib/utils";

export function Row({ className, children, inset = true }: { className?: string; children: React.ReactNode; inset?: boolean }) {
  return (
    <div className={cn("flex min-h-[48px] items-center gap-2 px-4", inset && "border-t border-border mx-4 first:border-t-0 first:mx-0 first:px-4", className)}>
      {children}
    </div>
  );
}
```
Wait — first-row should not have a top border. Simpler implementation:
```tsx
import { cn } from "@/lib/utils";

export function Row({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex min-h-[48px] items-center gap-2 px-4 border-t border-border mx-4 first:border-t-0 first:mx-0", className)}>{children}</div>;
}
```
(Use the simpler one; it honors DESIGN_SYSTEM's "inset-left 16px" rule via `mx-4` on non-first rows.)

- [ ] **Step 3: `Skeleton.tsx`**:

```tsx
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-surface-2 rounded-[6px] animate-pulse", className)} aria-hidden />;
}
```

- [ ] **Step 4: `EmptyState.tsx`**:

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

- [ ] **Step 5: `StatusPill.tsx`** — with `simulated` badge variant:

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

- [ ] **Step 6: typecheck + build + quick lint**

```bash
npm run check
```
Expected: green.

- [ ] **Step 7: Commit**

```bash
git add src/components/common/
git commit -m "feat(common): Block/Row/Skeleton/EmptyState/StatusPill native-Telegram primitives"
```

---

### Task 9: AppShell + 4-tab BottomTabBar + MainButtonBridge + Header

**Files:**
- Create: `src/components/layout/{AppShell,Header,BottomTabBar,MainButtonBridge}.tsx`

**Interfaces:**
- Consumes: `TABS`, `ROUTES` from `@/lib/constants`; `useTelegram` for haptics/BackButton/MainButton; `usePathname` for active route; `useUiStore`
- Produces: `<AppShell>` (composes Header + content + BottomTabBar + MainButtonBridge inside a max-w-480 safe-area grid)

- [ ] **Step 1: `Header.tsx`**:

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
    <header className={cn("h-[44px] shrink-0 bg-background/95 backdrop-blur px-4 flex items-center", "pt-[max(env(safe-area-inset-top),0px)]")}>
      <span className="text-[1.0625rem] font-semibold text-foreground">{title}</span>
    </header>
  );
}
```

- [ ] **Step 2: `BottomTabBar.tsx`** — 4 tabs per the spec:

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABS } from "@/lib/constants";
import { useTelegram } from "@/hooks/useTelegram";
import { cn } from "@/lib/utils";

export function BottomTabBar() {
  const pathname = usePathname();
  const { haptics } = useTelegram();
  return (
    <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] h-[52px] pb-[env(safe-area-inset-bottom)] bg-card/95 backdrop-blur border-t border-border grid grid-cols-4">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={() => haptics.selection()}
            className={cn("flex flex-col items-center justify-center gap-1", active ? "text-primary" : "text-muted-foreground")}
          >
            <Icon size={24} strokeWidth={1.75} />
            <span className="text-[10px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: `MainButtonBridge.tsx`**:

```tsx
"use client";
import { usePathname } from "next/navigation";
import { useTelegram } from "@/hooks/useTelegram";

// Phase 2 shell: no screen carries a primary action yet (Buy/Place Order arrive in Phase 3).
// Hide MainButton on all routes. The bridge exists so Phase 3 just swaps in per-route setParams().
export function MainButtonBridge() {
  const { mainButton } = useTelegram();
  usePathname(); // re-render on route change
  mainButton.hide();
  return null;
}
```

- [ ] **Step 4: `AppShell.tsx`**:

```tsx
"use client";
import { Header } from "./Header";
import { BottomTabBar } from "./BottomTabBar";
import { MainButtonBridge } from "./MainButtonBridge";

export function AppShell({ children }: { children: React.ReactNode }) {
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

- [ ] **Step 5: typecheck**

```bash
npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/
git commit -m "feat(layout): AppShell + Header + 4-tab BottomTabBar + MainButtonBridge"
```

---

### Task 10: `(app)` route group + 6 placeholder pages; `/` redirect

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/app/(app)/home/page.tsx`, `src/app/(app)/marketplace/page.tsx`, `src/app/(app)/property/[id]/page.tsx`, `src/app/(app)/earnings/page.tsx`, `src/app/(app)/portfolio/page.tsx`, `src/app/(app)/settings/page.tsx`
- Modify: `src/app/page.tsx` (redirect `/` → `/home`)

**Interfaces:**
- Consumes: `AppShell`, common components, `useMarketplace/usePortfolio/useEarnings/useOrderBook`, `PAYOUT_DISCLAIMER`, `redirect` from `next/navigation`
- Produces: a bootable shell with 6 scaffolded routes rendering skeletons/empty states (no finished features)

- [ ] **Step 1: `(app)/layout.tsx`**:

```tsx
import { AppShell } from "@/components/layout/AppShell";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 2: All 6 placeholder pages render `Skeleton`/`EmptyState` only**. e.g. `home/page.tsx`:

```tsx
"use client";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";

export default function HomePage() {
  return (
    <div className="mt-3 space-y-3">
      <Block className="p-4"><Skeleton className="h-4 w-24" /><Skeleton className="mt-2 h-8 w-40" /></Block>
      <Block className="p-4"><Skeleton className="h-4 w-20" /><Skeleton className="mt-2 h-6 w-32" /></Block>
    </div>
  );
}
```

`marketplace/page.tsx`:
```tsx
"use client";
import { EmptyState } from "@/components/common/EmptyState";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";

export default function MarketplacePage() {
  return (
    <div className="mt-3 space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Block key={i} className="p-4 space-y-3">
          <Skeleton className="h-32 w-full rounded-[12px]" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </Block>
      ))}
      <EmptyState title="No properties yet" message="Fetching the marketplace…" />
    </div>
  );
}
```

`property/[id]/page.tsx`:
```tsx
"use client";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";

export default function PropertyDetailPage() {
  return (
    <div className="mt-3 space-y-3">
      <Skeleton className="h-48 w-full rounded-[12px]" />
      <Block className="p-4 space-y-2"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-full" /></Block>
      <Block className="p-4 space-y-2"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-3/4" /></Block>
    </div>
  );
}
```

`earnings/page.tsx` — includes the canonical disclaimer:
```tsx
"use client";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";
import { PAYOUT_DISCLAIMER } from "@/lib/constants";

export default function EarningsPage() {
  return (
    <div className="mt-3 space-y-3">
      <p className="px-1 text-xs text-muted-foreground">{PAYOUT_DISCLAIMER}</p>
      <Block className="p-4 space-y-2"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/2" /></Block>
      {Array.from({ length: 3 }).map((_, i) => (
        <Block key={i} className="p-4 flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </Block>
      ))}
    </div>
  );
}
```

`portfolio/page.tsx`:
```tsx
"use client";
import { EmptyState } from "@/components/common/EmptyState";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";

export default function PortfolioPage() {
  return (
    <div className="mt-3 space-y-3">
      <Block className="p-4 space-y-2"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-8 w-2/3" /></Block>
      <EmptyState title="No holdings yet" message="Buy a slice from the Marketplace to start earning weekly rent." />
    </div>
  );
}
```

`settings/page.tsx`:
```tsx
"use client";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";

export default function SettingsPage() {
  return (
    <div className="mt-3 space-y-3">
      <Block className="p-4 space-y-2"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-2/3" /></Block>
      <Block className="p-4 space-y-2"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-4 w-3/4" /></Block>
    </div>
  );
}
```

- [ ] **Step 3: Replace root `src/app/page.tsx`** with a redirect:

```tsx
import { redirect } from "next/navigation";
export default function RootPage() { redirect("/home"); }
```

- [ ] **Step 4: typecheck + build**

```bash
npm run check
```
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/" src/app/page.tsx
git commit -m "feat(shell): (app) route group + 6 placeholder pages; root redirect / -> /home"
```

---

### Task 11: Wire the provider tree (Telegram + TonConnect + Query)

**Files:**
- Modify: `src/app/providers.tsx`

**Interfaces:**
- Consumes: `TelegramProvider`, `makeQueryClient`, existing TonConnect provider
- Produces: `<Providers>` composes the three; `QueryClientProvider` instance lives in a small client wrapper so `useState` runs once

- [ ] **Step 1: Update `providers.tsx`**:

```tsx
"use client";
// File responsibility: compose the client provider tree (thin). Order: Telegram -> TonConnect -> Query.
// TelegramProvider must be outermost so TonConnect-restore/UI can read viewport+safe-area via useTelegram.
import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Subscribe, THEME } from "@tonconnect/ui-react";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { resolveManifestUrl } from "@/lib/ton/manifest";
import { makeQueryClient } from "@/lib/query/client";
import { TelegramProvider } from "@/lib/telegram";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  return (
    <TelegramProvider>
      <TonConnectUIProvider manifestUrl={resolveManifestUrl()} restoreConnection uiPreferences={{ theme: THEME.DARK }}>
        <QueryClientProvider client={client}>
          {children}
        </QueryClientProvider>
      </TonConnectUIProvider>
    </TelegramProvider>
  );
}
void Subscribe;
```
(See Type consistency note: keep only `TonConnectUIProvider` import if `Subscribe`/`THEME` aren't used; the executor should drop the `Subscribe` import and `void Subscribe` line — shown to guard against accidentally re-importing a default that's not needed.)

- [ ] **Step 2: full check**

```bash
npm run check && npm test
```
Expected: green + 27+ tests passing.

- [ ] **Step 3: Commit**

```bash
git add src/app/providers.tsx
git commit -m "feat(providers): wire Telegram -> TonConnect -> Query provider tree"
```

---

### Task 12: `useTheme` hook (static vs live theme merge)

**Files:**
- Create: `src/hooks/useTheme.ts`

**Interfaces:**
- Consumes: `useSettingsStore` (`useTelegramTheme`), `bindLiveThemeVars` from `lib/telegram`
- Produces: `useTheme()` effect: when `useTelegramTheme` flips true, calls `bindLiveThemeVars()`; when false, removes the `tg-*` CSS vars (root(style).removeProperty for each key)

- [ ] **Step 1: Write the hook**:

```ts
"use client";
// File responsibility: apply DigiHouse static (default) or live Telegram theme based on settings store.
import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settings.store";
import { bindLiveThemeVars } from "@/lib/telegram";

const TG_VARS: string[] = [
  "--tg-bg-color","--tg-text-color","--tg-hint-color","--tg-button-color","--tg-button-text-color",
  "--tg-secondary-bg-color","--tg-section-bg-color","--tg-section-header-text-color","--tg-subtitle-text-color",
  "--tg-accent-text-color","--tg-destructive-text-color","--tg-header-bg-color","--tg-link-color",
  "--tg-bottom-bar-bg-color","--tg-section-separator-color",
];

export function useTheme(): void {
  const useTelegramTheme = useSettingsStore((s) => s.useTelegramTheme);
  useEffect(() => {
    if (useTelegramTheme) bindLiveThemeVars();
    else if (typeof document !== "undefined") {
      const root = document.documentElement;
      TG_VARS.forEach((v) => root.style.removeProperty(v));
    }
  }, [useTelegramTheme]);
}
```

- [ ] **Step 2: Wire the hook into `AppShell`** (the shell is the right place — one mount, applies globally):

```tsx
// in src/components/layout/AppShell.tsx — add:
import { useTheme } from "@/hooks/useTheme";
// inside the component, first line:
useTheme();
```

- [ ] **Step 3: typecheck + build**

```bash
npm run check
```
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useTheme.ts src/components/layout/AppShell.tsx
git commit -m "feat(theme): useTheme hook — static palette default, opt-in live Telegram themeParams"
```

---

### Task 13: Final gate — `/design-review` + smoke confirmation

**Files:** None (verification only)

- [ ] **Step 1: Full test suite**

```bash
npm test
```
Expected: all green (8+ in format, prior ton tests still pass).

- [ ] **Step 2: Full check**

```bash
npm run check
```
Expected: lint + typecheck + build all green.

- [ ] **Step 3: `/design-review` on the empty shell** — run the `.opencode/commands/design-review.md` checklist mentally against each touched screen (Home, Marketplace, Property, Earnings, Portfolio, Settings). Confirm each bullet is PASS. The Earnings page must show `PAYOUT_DISCLAIMER` (honesty ✅). Bottom tab bar: 4 tabs only, hairline top, active=`--primary`, h-[52px], safe-area inset, no horizontal scroll at 360/480. Blocks `bg-card rounded-[12px]` no-shadow; rows inset-left hairline; system font; `.tnum` applied to all numbers (none in placeholders — N/A but tracked).

- [ ] **Step 4: Manual smoke** — `npm run build`, then preview via your HTTPS tunnel (`next dev --experimental-https` or `cloudflared/ngrok`) + Telegram `@BotFather` mini-app URL. Confirm:
  - app boots natively inside Telegram
  - 4-tab bottom bar renders, active tab highlighted Telegram blue
  - header shows screen title; safe-area insets applied top+bottom
  - no horizontal scroll at 360px
  - MainButton/BackButton hidden on root tabs (per MainButtonBridge)
  - `/` redirects to `/home`, `useEarnings` interval is running (the network tab will show no real requests because data is mocked, but the `tickPayout` setInterval fires)

- [ ] **Step 5: Ownership self-audit** (run manually against the `telegram-ton-ownership` skill):
  - [ ] No component imports `lib/ton` / `lib/mock` / `lib/api` / `lib/telegram` / `@tonconnect/*` directly (grep `src/components` + `src/app`).
  - [ ] Every `lib/telegram/*` file < 200 lines; one concern each.
  - [ ] Every mock file implements exactly one `Repo` interface.
  - [ ] `tickPayout()` stamps `makeSyntheticTxHash()` (synthetic `"simulated:<id>"`); no on-chain claim anywhere.
  - [ ] No `any`.
  - [ ] `PAYOUT_DISCLAIMER` rendered once on Earnings page.
  - [ ] `StatusPill` ships `simulated` badge slot (will be used in Phase 3).

- [ ] **Step 6: Commit any leftover + final phase-gate log**

```bash
# If clean, no commit needed. Otherwise:
git commit --allow-empty -m "chore(phase2): foundation subset complete — design-review PASS, npm run check green"
```

---

## Self-Review notes (post-write)

- **Spec coverage:**
  - Drop Geist → Task 1 ✓
  - `format.ts` with `weeklyRent`/`projectedYield` → Task 1 ✓
  - `constants.ts` incl. `PAYOUT_DISCLAIMER` → Task 1 ✓
  - Types mirror → Task 2 ✓
  - Stores (settings persisted, ui ephemeral) → Task 3 ✓
  - Telegram SDK (`TelegramProvider`, `useTelegram`, theme-mapper, haptics, signals) → Task 4 ✓
  - API repos interfaces → Task 5 ✓
  - Mock data layer + `getRepo` + `tickPayout` synthetic txHash → Task 6 ✓
  - Query client + 4 data hooks (`useMarketplace/Portfolio/Earnings/OrderBook`) → Task 7 ✓
  - Common components (Block/Row/Skeleton/EmptyState/StatusPill + simulated badge) → Task 8 ✓
  - AppShell + Header + BottomTabBar + MainButtonBridge → Task 9 ✓
  - 4-tab rule (Home/Marketplace/Earnings/Portfolio, no Settings tab) → Task 9 ✓
  - 6 placeholder pages + `/` → `/home` → Task 10 ✓
  - Provider tree composition → Task 11 ✓
  - `useTheme` static-vs-live → Task 12 ✓
  - `/design-review` + manual smoke + ownership audit → Task 13 ✓
- **Placeholder scan:** the `seed.ts` skeleton in Task 6 Step 2 carries inline `/* ... */` placeholders for the six literal properties — this is per spec (the seed generator's one concern is filling literal data). The executor MUST replace them with real, non-`TODO`, non-`TBD` literal data (titles/locations/numbers) before that task's commit. No other `TBD`/`FIXME` anywhere.
- **Type consistency:**
  - `BuyMessageInput`/`SendTxResult` (from `@/types/ton`, TON foundation) — unchanged, used by `useTonConnect` only. Mock layer doesn't touch them.
  - `TickPayoutResult` shape `{ distributionId, paidEntries }` — consistent between `repos.ts`/`earnings.ts`/`useEarnings.ts`.
  - `TelegramSurface` shape — Task 4 defines it, no other task uses its internals.
  - `TABS` — `home/marketplace/earnings/portfolio`; BottomTabBar (Task 9) consumes exactly those four. Settings deliberately excluded — consistent between `constants.ts` and the bar.
  - `PAYOUT_DISCLAIMER` constant string — Task 1 owns it; Earnings page (Task 10) imports it verbatim.
- **Dependency order:** Tasks 1–8 can mostly run in order; Task 7 depends on Task 6; Task 9 depends on Task 4; Task 10 on Task 9; Task 11 on Task 7 + TON-subset's manifest; Task 12 on Task 4. Task 13 is the gate.