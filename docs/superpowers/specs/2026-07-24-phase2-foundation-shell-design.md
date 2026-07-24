# Phase 2 Parallel Foundation Subset — Design

> Spec for the *parallel* Phase 2 foundation subset: the Telegram-SDK + mock-data + AppShell
> piece that completes ROADMAP Phase 2's exit gate. Stacks on top of the already-merged
> **TON foundation** (commits `a2c7986`..`84aacd3`) — does NOT touch `lib/ton/**`.
>
> Status: **Approved** on 2026-07-24 (4 bottom tabs: Home / Marketplace / Earnings / Portfolio;
> Settings deferred). Written against `HEAD = f29570d`.
>
> Terminal learnings of the prior Phase 2 audit that motivate this spec:
> - Native-Telegram chrome (header / bottom tabs / MainButton / grouped blocks) and the
>   Telegram SDK wiring did not exist. BUILDING Phase 3 screens without them = rework.
> - The "System font over Geist" decision (TECH_STACK Decisions log) was still un-applied.

## 1. Goal

Deliver a runnable, native-Telegram shell that boots inside Telegram, exposes the 4-tab
bottom-bar + Telegram header + MainButton + haptics + safe-area + live-theme-option, lets
all six routes render skeleton/empty states, and makes mock weekly-earnings data queryable
from the repo layer through hooks — **with no finished feature screens.** That satisfies
ROADMAP Phase 2 exit criteria.

## 2. Non-goals

- No finished feature screens (Property browsing, Buy, Earnings timeline detail, etc.) —
  Phase 3.
- No real wallet actions beyond what the TON foundation already wires. No on-chain calls.
- No Settings tab. Settings screen = placeholder only; tab-bar entry deferred.
- No persisted mock data in production storage — in-memory mocks + TanStack Query cache.

## 3. Architecture

Vertical slice on top of the TON foundation. A single client provider tree composes
**TelegramProvider → TonConnectUIProvider → QueryClientProvider**. Components consume three
hook families only: `useTelegram` (SDK surface), `useTonConnect` (already built), and the
TanStack Query data hooks (`useMarketplace`, `usePortfolio`, `useEarnings`, `useOrderBook`).
Mock repositories sit behind `lib/api/**` interfaces and a single `getRepo()` injection
point — the documented swap-in for the real TON/backend (one-folder change, hooks unchanged).

**Dependency direction (single, unchanged, enforced by the `telegram-ton-ownership` skill):**
UI → hooks → (api | ton | telegram) → types. No layer imports a higher one. Components never
import `lib/ton` / `lib/mock` / `lib/telegram` / `@tonconnect/*` directly.

**MVP payout honesty (non-negotiable):** the mock `EarningsRepo.tickPayout()` flips
`pending → paid` on a `NEXT_PUBLIC_PAYOUT_TICK_MS` cadence and stamps a synthetic
`"simulated:<id>"` `txHash` (already established by the TON foundation's
`makeSyntheticTxHash`). The Earnings placeholder page ships the canonical disclaimer
**"simulated weekly payout · on-chain verifiable post-MVP"** and the Paid pill is paired
with a small **"simulated"** badge (muted capsule, not a second finance color) — per
DESIGN_SYSTEM §"MVP payout honesty".

## 4. Tech-stack choices (faithful to TECH_STACK.md)

| Concern | Choice | Rationale |
|---|---|---|
| Telegram SDK | `@telegram-apps/sdk-react@3.3.9` + `@telegram-apps/sdk` 3.x signal-based (installed) | Use `init()` once + `useSignal()` for reactive reads of singleton components `themeParams`, `backButton`, `mainButton`, `viewport`, `hapticFeedback`, `miniApp`, `closingBehavior`. Decisions-log correction applied. |
| Theme | Static DigiHouse palette (default) + optional live Telegram themeParams via `bindThemeParamsCssVars` | DESIGN_SYSTEM: live theme applies only when `settings.useTelegramTheme === true`; default OFF, our static palette already mirrors Telegram's values. |
| Server cache | TanStack Query v5; `staleTime: 30s` marketplace, `0` portfolio/earnings | TECH_STACK mandate. Mock-first architecture leans on Query's cache contract. |
| Local UI state | Zustand v5 with `persist` for `role|onboarded|useTelegramTheme` only | `settings.store.ts` (persisted) + `ui.store.ts` (ephemeral). Minimal — no God store. |
| Routing | Next 16 App Router route group `(app)/` + 6 pages | Already documented structure; file-based routing per TECH_STACK. |
| Base UI | shadcn's `components/ui/button.tsx` unchanged (Phase 3 restyles). NEW `components/common/{Block,Row,Skeleton,EmptyState,StatusPill}.tsx` ⊥ DESIGN_SYSTEM §"Grouped Block". | Flat owned primitives. |
| Fonts | System stack via `--font-sans` token (already in `globals.css`); remove Geist/Geist_Mono from `layout.tsx` | "System font over Geist" decision. |

## 5. Folder structure (ownership-justified — one concern per file)

```
src/
  app/
    layout.tsx                         # RootLayout: system-font tokens, metadata, theme color (MODIFY: drop Geist)
    page.tsx                           # redirect -> /home (小)
    providers.tsx                      # MODIFY: TelegramProvider -> TonConnectUIProvider -> QueryClientProvider
    (app)/
      layout.tsx                       # wraps AppShell, owns route group
      home/page.tsx                    # placeholder: balance block + next-payout callout skeletons
      marketplace/page.tsx             # placeholder: PropertyCard list skeleton + empty
      property/[id]/page.tsx           # placeholder: detail skeleton
      earnings/page.tsx                # placeholder: timeline skeleton + simulated disclaimer header
      portfolio/page.tsx               # placeholder: holdings list skeleton + empty
      settings/page.tsx                # placeholder: role / telegram-theme toggle skeleton (no tab)
  lib/
    format.ts                          # usd, ton, shortAddr, pct, weekLabel, weeklyRent, projectedYield
    constants.ts                       # ROUTES, TABS, PAYOUT_DISCLAIMER_TEXT, DEFAULTS
    telegram/
      TelegramProvider.tsx             # init() + miniApp.ready() + viewport.mount() + closingBehavior.mount(); setHeader/Background color
      theme-mapper.ts                  # mapTelegramThemeParamsToCssVars(): writes tg-* css vars from signals
      haptics.ts                       # wrap haptic signals + no-op fallbacks (reduced-motion / unsupported)
      signals.ts                       # thin re-exports of the signals we read (avoids import churn in hooks)
      index.ts                         # barrel
    query/
      client.ts                        # makeQueryClient() + defaultOptions; one instance via Provider
    api/
      repos.ts                         # INTERFACES only: MarketplaceRepo, OrderBookRepo, PortfolioRepo, EarningsRepo, TxRepo
      getRepo.ts                       # injection point returning the mock impl
    mock/
      sleep.ts                         # shared latency helper (250–700ms)
      seed.ts                          # >=6 properties, 1 investor, holdings, >=4 earnings, >=1 open order, failed/pending tx
      marketplace.ts                   # MockMarketplaceRepo
      orderbook.ts                     # MockOrderBookRepo
      portfolio.ts                     # MockPortfolioRepo
      earnings.ts                      # MockEarningsRepo + tickPayout() (synthetic "simulated:<id>" txHash)
      transaction.ts                   # MockTxRepo
      index.ts                         # barrel so getRepo() composes the mock set
  hooks/
    useTelegram.ts                     # facade: themeParams, safe-area, backButton, mainButton, haptics
    useTheme.ts                        # applies DigiHouse static OR live Telegram theme based on settings
    useMarketplace.ts                  # useQuery(MarketplaceRepo.list)
    usePortfolio.ts                    # useQuery(PortfolioRepo.summary)
    useEarnings.ts                     # useQuery(EarningsRepo.summary) + tickPayout interval
    useOrderBook.ts                    # useQuery(OrderBookRepo.get)
    index.ts                             # barrel
  stores/
    settings.store.ts                  # role, onboarded, useTelegramTheme (persisted)
    ui.store.ts                         # active tab, selected property id, sheet flags, payout cursor
  types/
    user.ts, property.ts, order.ts, position.ts, earnings.ts, transaction.ts, telegram.ts
    index.ts                             # barrel
  components/
    layout/
      AppShell.tsx                     # layout grid, max-w-480, safe-area
      Header.tsx                       # Telegram title bar slot
      BottomTabBar.tsx                 # 4 tabs: Home / Marketplace / Earnings / Portfolio
      MainButtonBridge.tsx              # owns MainButton show/hide/set text per route
    common/
      Block.tsx                         # bg-card rounded-[12px] no-shadow grouped block
      Row.tsx                           # min-h-[48px] px-4 row, inset-left hairline separator
      Skeleton.tsx                      # bg-surface-2 rounded-[6px] matching the final shape
      EmptyState.tsx                    # centered illustration + headline + muted sentence + CTA
      StatusPill.tsx                    # capsule pill (success/warning/danger) + "simulated" badge variant
```

**~30 new files; largest foreseen ≤250 lines (`seed.ts`); next largest ~150
(`TelegramProvider`); most <100. Every file owns one concern. Components import only
`hooks/`, `types/`, `lib/format.ts`, `lib/utils.ts`, `lib/constants.ts`, and other
`components/`. No component may import `lib/ton`, `lib/mock`, `lib/api`, `lib/telegram`,
or `@tonconnect/*` directly.**

## 6. Execution order (8 reviewable increments)

1. **Fonts + layout baseline + pure helpers.** Drop Geist from `layout.tsx` (system stack
   already in `globals.css`). Keep the TonConnect provider already in `providers.tsx`. Add
   `lib/constants.ts` (routes, tabs, disclaimer text, defaults) and `lib/format.ts`
   (DATA_MODELS helpers: `usd`, `ton`, `shortAddr`, `pct`, `weekLabel`, `weeklyRent`,
   `projectedYield`) — both pure, unit-tested with vitest.
2. **Types mirror.** 7 leaf files in `src/types/` mirroring DATA_MODELS.md exactly
   (`user`, `property`, `order`, `position`, `earnings`, `transaction`, `telegram`),
   depending only on `types/units.ts` from the TON subset.
3. **Stores.** `settings.store.ts` (persisted `role|onboarded|useTelegramTheme` — default
   `useTelegramTheme=false`). `ui.store.ts` (ephemeral: `activeTab`, `selectedPropertyId`,
   sheet flags). Zustand v5 + `persist` + `createJSONStorage`. Minimal.
4. **Telegram SDK layer.** `TelegramProvider` (calls `init()` once, `miniApp.ready()`,
   `mountViewport()`, `mountClosingBehavior()`; `setMiniAppHeaderColor("#17212b")`,
   `setMiniAppBackgroundColor(...)`. Reads reactive values via `useSignal`).
   `theme-mapper.ts`, `haptics.ts`, `signals.ts`. `useTelegram` facade hook returns a
   typed object: `{ viewport, safeAreaInsets, backButton {show,hide,onClick}, mainButton
   {setParams, hide, onClick}, haptics {impact, notification, selection}, themeParams }`.
5. **Query client + mock data.** `query/client.ts` (`makeQueryClient()` + default
   `staleTime`s). `api/repos.ts` (5 interfaces per DATA_MODELS). `mock/seed.ts`
   (deterministic fixtures: ≥6 properties spanning funding/funded/resale; one investor
   with ≥2 holdings; ≥4 weekly `EarningsEntry`s across ≥4 weeks mixing paid/pending; ≥1
   `RentalDistribution` per owned property per seeded week; ≥1 open order; one failed +
   one pending `Transaction`). `mock/{marketplace,orderbook,portfolio,earnings,transaction}.ts`
   implement their repo interface with `await sleep(n)` delays. `mock/earnings.ts`
   includes `tickPayout()` that flips pending→paid and stamps
   `makeSyntheticTxHash()`. `api/getRepo.ts` returns the mock set. `useTheme` hook wires
   the static-vs-live theme merge from settings + `useTelegram`.
6. **Data hooks.** `useMarketplace`, `usePortfolio`, `useEarnings`, `useOrderBook`
   (TanStack Query wrappers, all fetch via `getRepo()`). `useEarnings` kicks the
   `tickPayout` interval using `env.payoutTickMs`; invalidates `summary` after each tick.
   `useTelegram` wires `BackButton.show()/hide()` and `MainButton.setParams()/hide()`
   per current route (route-driven via `usePathname`).
7. **Common components.** `Block`, `Row`, `Skeleton`, `EmptyState`, `StatusPill` — each
   uses DESIGN_SYSTEM tokens exactly (`bg-card rounded-[12px]` no-shadow; inset-left
   hairlines; `.tnum` for numbers; muted capsule pill; the "simulated" badge variant in
   `StatusPill`).
8. **AppShell + routing + gate.** `AppShell` composes Header + BottomTabBar +
   MainButtonBridge + safe-area insets. `(app)/layout.tsx` wraps AppShell. 6 placeholder
   pages render `Skeleton`/`EmptyState` shapes with zero finished features; root `/`
   redirects to `/home`. Run `npm run check` + `/design-review` on the empty shell;
   both must be green.

## 7. Mock seed invariants (every UI state must render)

`seed.ts` produces deterministic data so every screen's loaded / loading / empty / error
state is reachable:
- ≥6 properties spanning `funding` + `funded` + `resale`, each with non-zero `annualRentUsd`
  and an order book.
- One logged-in investor (`UserProfile`) with ≥2 holdings.
- ≥4 weekly `EarningsEntry` rows mixing `paid` and `pending` spanning ≥4 weeks, with
  `txHash = "simulated:<id>"` on every `paid` row.
- ≥1 `RentalDistribution` per owned property per seeded week.
- ≥1 open `Order`.
- ≥1 failed and ≥1 pending `Transaction` (real on-chain TX is not simulated here — only
  the *state* and synthetic `txHash` placeholder).

## 8. Honesty contracts (non-negotiable)

- `mock/earnings.ts` `tickPayout()` flips `pending → paid` and stamps
  `makeSyntheticTxHash()` → `"simulated:<id>"` on every entry. No real on-chain hash anywhere.
- `constants.ts` owns the canonical disclaimer: `"simulated weekly payout · on-chain
  verifiable post-MVP"`. The Earnings placeholder page renders it once, muted.
- `StatusPill` ships a `simulatedBadge` prop: a `rounded-full px-1.5 py-0 text-[0.625rem]
  uppercase tracking-wide bg-muted text-muted-foreground` capsule placed immediately after
  a `paid` pill — never with success color.
- No screen claims on-chain settlement, "in your wallet", or "verifiable now" for MVP.

## 9. Ownership self-audit (applied to this spec)

| Plan item | Ownership check | Verdict |
|---|---|---|
| `providers.tsx` composes 3 providers | Single responsibility = provider tree. No logic. | PASS |
| `TelegramProvider` + `useTelegram` separation | Provider owns SDK side-effects/mount; hook owns consumer API. | PASS |
| `lib/telegram/**` imports only React (provider), `@telegram-apps/*`, types | No `lib/ton`/`lib/mock`/`lib/api`/component imports. | PASS |
| `lib/mock/**` one file per repo | Each implements exactly one `Repo` interface; barrel composes the set. | PASS |
| `seed.ts` allowed to grow to ~250 lines | Single concern = data generator; capped, no God file. | PASS |
| `format.ts` = pure display helpers | No React/DOM/network. | PASS |
| `lib/constants.ts` = literals only | Routes, tabs, disclaimer text, default timers. | PASS |
| Components import `hooks/`, `lib/format`, `lib/utils`, `lib/constants`, `types/`, `components/` only | No direct `lib/ton`/`lib/mock`/`lib/api`/`lib/telegram`/`@tonconnect`. | PASS |
| MVP payout honesty in Earnings placeholder + Paid pill simulated badge | Enforced in `constants.ts`, `StatusPill`, and the Earnings page. | PASS |
| Largest file ~250, rest <150, most <100 | All under the 350 soft / 500 hard line. | PASS |

No hard-rule violations.

## 10. Verification gates

- `npm run check` (lint + typecheck + build) — green.
- `/design-review` on the empty shell — PASS (every touched screen meets the
  DESIGN_SYSTEM checklist: identity/palette, layout/blocks, native chrome, typography/
  numbers, motion, states, honesty).
- Manual: open the app via a Telegram Mini App tunnel (HTTPS required for TonConnect),
  confirm 4-tab shell renders natively, no horizontal scroll at 360px, safe-area
  insets apply, MainButton/BackButton show/hide on the correct routes, mock data is
  queryable from the repo layer.
- `npm test` continues to pass; TDD continues for any pure helpers added in step 1
  (`format.ts`).

## 11. Out of scope — explicitly

- Any finished feature screen content (Property browsing, Buy flow, Earnings timeline
  detail, Sell sheet) — Phase 3.
- Real wallet TX beyond what the TON foundation already wires. No `@ton/ton`/`@ton/crypto`
  calls. No on-chain share minting.
- A 5th "Settings" tab. The Settings *page* exists as a placeholder reachable by URL
  (for the future); no tab-bar entry in the shell.
- Persisted mock storage; the mock lives in-memory and is regenerated each session.