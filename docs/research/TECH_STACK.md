# TECH STACK — DigiHouse

> Exact stack, versions, and integration boundaries. Agents: read this *before* installing or wiring anything.
> Don't guess versions; prefer the installed version in `package.json`. Log every dependency change in the **Decisions log** at the bottom.
>
> **Three selection criteria, in order:** (1) **Telegram-native fidelity** — anything that fights the platform's look/feel is rejected even if technically faster; (2) **Fast MVP** — must let a small team ship a competition-ready demo in weeks, not months; (3) **Real TON swap-in** — the mock layer must be replaceable with on-chain calls without touching components.

## Runtime / Build
| Concern | Choice | Justification |
|---|---|---|
| Framework | **Next.js 16** (App Router), `output: "standalone"` | Best-in-class React framework; App Router gives per-route metadata + file-based routing for a 6-screen Mini App; `standalone` keeps Vercel deploy + future self-host option. Required by AGENTS.md as the in-repo Next (different from training data — read `node_modules/next/dist/docs/` before writing). |
| Language | **TypeScript** strict, `noEmit`, `noImplicitAny` | Finance app: a misplaced decimal is catastrophic. TS strict catches the unit-mixing bugs (cents vs nanoTON vs shares) at compile time. No `any` is a hard rule. |
| React | **19.2** | Server components by default; we opt into `"use client"` only for the interactive Mini App shell. 19's `use()` + actions simplify loading states, which matters for skeleton accuracy. |
| Styling | **Tailwind CSS v4** (PostCSS, oklch tokens) | Tailwind v4 ships oklch out of the box (matches our token system in [DESIGN_SYSTEM](./DESIGN_SYSTEM.md)); zero-config theme via `@theme`, faster builds, smallest viable CSS for a 480px mobile app. |
| UI primitives | **shadcn/ui** (base-nova style) + `lucide-react` | shadcn/ui = copy-in components we fully own and restyle to Telegram-native (no version-blackbox dependency). `lucide-react` matches the 1.75-stroke rounded Telegram-ish icon set we want. We rejected `@telegram-apps/telegram-ui` (React 18 only — see Decisions log). |
| Animation | **Framer Motion** + WAAPI + CSS transitions | Framer Motion for interruptible gestures (sheet drag, sheet) and predictable UI motion; raw CSS transitions for toasts/rapid UI per emil-design-eng; WAAPI for programmatic one-shot reveals. Springs with `{ duration: 0.5, bounce: 0.2 }` for sheets. |
| Node | 24 | `.nvmrc` = `24`; matches Vercel default runtime. |
| Deploy | **Vercel** + **Telegram Mini App** (BotFather) | Vercel for edge global CDN (Telegram users are global), zero-config Next deploy, instant preview URLs for BotFather staging. BotFather hosts the Mini App URL binding. |

## TON / Blockchain
| Concern | Package | Purpose |
|---|---|---|
| Wallet connect | `@tonconnect/ui-react` | `<TonConnectUIProvider>`, restore, button, send TX. TonConnect is the standard in the TON ecosystem, supports Tonkeeper/MyTonWallet, and crucially works inside a WebView (no extension model). |
| Cell / contract typing | `@ton/core` | Add when needed — build messages, parse jettons. Not required for MVP. |
| Crypto | `@ton/crypto` | Only if signature/key helpers are needed (not MVP). |

> **No on-chain property contract in MVP.** Listing/fractionalization is simulated by the mock repository. The only real on-chain touchpoint is **wallet connection** and a **"buy" transaction stub** (a minimal TON tx as proof of intent; real fraction minting is post-MVP). Never invent real smart-contract calls.

### TonConnect integration boundaries
- Wrap the app **once**: `<TonConnectUIProvider manifestUrl={...}>` in `src/app/providers.tsx`.
- Restore on mount (`restoreConnection`); don't flash a "Connect" button on reload.
- Send TX helper in `src/lib/ton/sendTx.ts` returning `{ ok, boc?, error? }`. **Components call through hooks (`useTonConnect`), never directly.**
- For MVP, "buy" sends a 0.01 TON test tx to the property's `ownerWalletAddress` (or a configurable relay in `.env.local`). Track result; do NOT mint real shares on-chain.
- Manifest at `public/seo/tonconnect-manifest.json`; `TONCONNECT_MANIFEST_URL` resolved to `${origin}` at runtime.

## Telegram Mini App
| Concern | Package | Notes |
|---|---|---|
| SDK | `@telegram-apps/sdk-react` | `init()` + `restoreInit()` in a client provider; `useLaunchParams`, theme params, viewport, `backButton`, `mainButton`, `hapticFeedback`. The maintained SDK for Telegram Mini App integration. |
| Validate | `@telegram-apps/sdk` is flagged deprecated in sub-deps | still works for MVP; acceptable. If it breaks, migrate to `@tma.js/react` (drop-in-ish) and **log it here.** |

### Telegram integration boundaries (native-first)
- Provider `src/lib/telegram/TelegramProvider.tsx` (`"use client"`): calls `init()`, reads theme params + safe-area insets, sets up `viewport.expand()`, exposes `useTelegram()`.
- **Theme:** apply CSS variables from theme params **only** when `UserProfile.useTelegramTheme === true` (default OFF; our static palette already mirrors Telegram's values). See [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) mapping table.
- **Header & `MainButton`:** use the SDK title bar + `mainButton` for screen-primary actions (Get Started, Buy confirm, Place Order). Show/hide `backButton` per [USER_FLOW](./USER_FLOW.md) back-stack rules.
- **Haptics:** expose `haptic.impactOccurred(id, style)` / `notificationOccurred(type)` / `selectionChanged()` through `useTelegram()`; no-ops when unsupported or reduced-motion.
- **Viewport:** `viewport.expand()` for full height; bind `closingConfirmation` during a pending TX to prevent accidental close.

## State
| Layer | Tool | Boundary |
|---|---|---|
| Server / async cache | **TanStack Query** | all listing/portfolio/earnings/order-book data. `src/lib/query/client.ts` + hooks in `src/hooks/*`. Default `staleTime: 30s` for marketplace; `0` for portfolio/earnings (always fresh). Optimistic update on buy/cancel. |
| Local UI state | **Zustand** | role, settings, sheet flags, selected property, **next payout countdown cursor**. `src/stores/*` — keep minimal. Persist only `role`, `onboarded`, `useTelegramTheme`. |
| Form state | React 19 native (`useState`) | add `valibot` only if validation grows; **log it** if added. |

> **Why TanStack Query + Zustand over a single Redux?** Two clear layers = less boilerplate, better dev ergonomics. Server cache (Query) and ephemeral UI (Zustand) have different invalidation lifecycles — conflating them is what makes Redux codebases rot. The mock-first architecture leans on Query's cache contract — when the real backend lands, the hooks stay, only the repo impl changes.

## Data layer & mocking (important for parallel agents)
- Define repository **interfaces** in `src/lib/api/*.ts` (`MarketplaceRepo`, `OrderBookRepo`, `PortfolioRepo`, `EarningsRepo`, `TxRepo`) — see contracts in [DATA_MODELS](./DATA_MODELS.md).
- Implement a **mock** backend in `src/lib/mock/*.ts` returning typed data with realistic delays (`await sleep(n)` — 250–700ms to mimic mobile latency).
- Single `getRepo()` injection point → real TON/backend swap-in is a one-folder change.
- Mock seed must cover every UI state (see [DATA_MODELS](./DATA_MODELS.md) "Mock seed invariants").
- **Weekly-yield simulation:** the mock `EarningsRepo.tickPayout()` flips `pending` → `paid` entries on a configurable cadence (default every 60s in dev so the demo shows the payoff live; real cadence is Sunday UTC). It stamps a synthetic `txHash` placeholder.

## Performance budget (R-9.13 enforcement)
- **First meaningful paint** on a cached Telegram cold start: **≤ 1.5s** on a mid-range phone (Pixel 5a / iPhone 11 class). Lighthouse Mobile target.
- **Bundle:** initial JS ≤ 250 KB gzipped; Framer Motion is tree-shaken per-import; Animations limited per DESIGN_SYSTEM motion budget.
- **No layout shift (CLS < 0.05):** skeletons match final shape; images have explicit `aspect-ratio`; tabular-nums everywhere.
- **No horizontal scroll** at any viewport ≤ 480px — audited in `/design-review`.
- **Reduced-motion** path: a complete, parallel experience without transform animations, auditable via `prefers-reduced-motion: reduce`.

## Project layout (target)
```
src/
  app/
    layout.tsx, page.tsx                 # redirect → /home or /onboarding
    providers.tsx                        # client: TonConnect + Telegram + QueryClient
    (app)/                               # authed shell with bottom tab bar
      layout.tsx (AppShell)
      home/page.tsx, marketplace/page.tsx, property/[id]/page.tsx,
      earnings/page.tsx, portfolio/page.tsx, settings/page.tsx
  components/
    ui/                                  # shadcn primitives (restyled native-Telegram)
    icons.tsx                            # brand/property custom SVGs
    layout/                              # AppShell, Header, BottomTabBar, MainButtonBridge
    property/                            # PropertyCard, PropertyDetail, OrderBook, BuyControl, SellSheet
    earnings/                           # EarningsTimeline, EarningsSummary, EarningsEntry
    wallet/                             # ConnectWallet, WalletBadge, DisconnectedState
    common/                             # Block, Row, StatusPill, Skeleton, EmptyState, ProgressBar, Sheet, Toast
  hooks/                                # useMarketplace, usePortfolio, useEarnings, useOrderBook, useTelegram, useTonConnect, useHaptics
  lib/
    utils.ts (cn), format.ts (usd/ton/shortAddr/pct/weekLabel/weeklyRent/projectedYield)
    query/client.ts, api/ (repo interfaces), mock/ (impl + seed), ton/ (sendTx, manifest), telegram/ (TelegramProvider, useTelegram)
  stores/                                # zustand stores
  types/                                 # mirrors DATA_MODELS.md
public/
  images/properties/*                    # mock property images
  seo/                                   # favicon, og, tonconnect-manifest.json
docs/research/                           # spec docs (source of truth)
```

## Tooling / quality gates (do not regress)
- `npm run lint` — ESLint flat config (Next + TS) → 0 errors.
- `npm run typecheck` — `tsc --noEmit` → 0 errors.
- `npm run build` — `next build` → success.
- `npm run check` — lint + typecheck + build. Run before declaring a phase done.
- A screen that passes `check` but fails a `/design-review` against [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) is **not done**.

## Environment & secrets
- `.env.local` only; never commit. Required keys:
  - `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` (auto-resolved to `${origin}` if unset).
  - `NEXT_PUBLIC_TON_NETWORK` (`testnet` in MVP; flip to `mainnet` post-MVP).
  - `NEXT_PUBLIC_PAYOUT_TICK_MS` (mock scheduler cadence; default `60000`).
- BotFather token kept out of the repo (configure Mini App URL via the live bot, not a baked-in secret).

## Internationalization
| Concern | Choice | Notes |
|---|---|---|
| Library | **`next-intl`** | App Router–friendly; client provider only (no `[locale]` URL segment — TMA start URLs stay stable). |
| Catalogs | `messages/{en,fa,ar,ru,de,tr}.json` | English is source of truth. Namespaced keys. |
| Detection | Telegram `language_code` → `detectLocaleFromCode`; optional user override in Settings | Persisted on `settings.store.locale` (`null` = Auto). |
| RTL | `fa`, `ar` via `document.documentElement.dir` + logical CSS | See `docs/i18n.md`. |

## Decisions log (append-only)
- **Dropped `@telegram-apps/telegram-ui`** — requires React 18; conflicts with React 19. We use shadcn + DESIGN_SYSTEM instead, restyled to native-Telegram. Strong preference for owned copy-in components over a pinned UI lib anyway (full control of native fidelity).
- **Kept `@telegram-apps/sdk-react`** even with the deprecation warning; acceptable for MVP; swap to `@tma.js/react` only if it breaks.
- **System font over Geist** — Telegram renders in the device native font; switched `--font-sans` to the system stack for native fidelity (see [DESIGN_SYSTEM](./DESIGN_SYSTEM.md)).
- **Flat, hairline design** — no drop shadows on blocks; color separation + hairlines only, to match Telegram (per DESIGN_SYSTEM).
- **`MainButton` for screen-primary actions** — not an in-page duplicate; only app tab bar on read screens.
- **Mock-first** — no real on-chain fraction contract in MVP; only the wallet + a minimal buy TON tx stub are real. Lets the weekly-yield loop ship demoable in weeks.
- **TanStack Query + Zustand (no Redux)** — clear boundary between server cache and local UI; lower boilerplate; better fits the mock-repo hook architecture.
- **Tailwind v4 over v3** — oklch and `@theme` first-class; smaller build; aligns with DESIGN_SYSTEM token system.
- **WAAPI + CSS transitions reserved for hot paths** — toasts/orders/list items animate via transitions so they stay smooth when the main thread is busy loading new screens (emil-design-eng principle: CSS animations beat JS under load).
- **`NEXT_PUBLIC_PAYOUT_TICK_MS` mock cadence** — short so the demo visibly "pays out" while a judge watches; real Sunday-UTC distribution is a future on-chain job.
- **Added `@ton/core@^0.63` (Phase 2 TON foundation)** — Address parse/validate/format + Cell/message builders. Small; required now for address utilities and the SC skeleton.
- **`@ton/crypto@^3.3` and `@ton/ton@^16.3` installed but deferred** — present on disk for future use; Phase 2 TON foundation does NOT call them (no client-side signing, no ADNL client — `@ton/ton`'s `TonClient` doesn't run cleanly inside the Telegram WebView). Kept for Phase 6+ real-contract work.
- **TonAPI HTTP over `@ton/ton` ADNL client** — ADNL doesn't run cleanly inside the Telegram WebView; a fetch-based HTTP client (TonAPI.io, testnet at `https://testnet.tonapi.io`) is lighter and WebView-safe. The `TonApiClient` interface is the swap-in point for the real backend.
- **Buy payment = real payable amount to an admin wallet (Step 2)** — `/v1/buys/prepare` returns the admin receive destination (`ADMIN_TON_WALLET_ADDRESS` > `TON_RELAY_ADDRESS` > listing owner) and the payable nanoTON (sharePrice × qty ÷ `TON_USD_PRICE_CENTS`, floor). `sendTx` derives a **real txHash** from the wallet-signed boc (`Cell.fromBase64(boc).hash()`); `"simulated:"` hashes exist only in the mock data path (`src/lib/mock`). `/v1/buys/confirm` records the payment (boc/txHash) but does NOT settle — holding/ledger updates are deferred until on-chain verification (post-MVP). USDT receive (`ADMIN_USDT_WALLET_ADDRESS`, `USDT_JETTON_MASTER_ADDRESS`) is reserved for Phase 5+ (ADR-005). Never claim on-chain settlement in MVP.
- **Reliable server-side verification before settling a buy (Step 3)** — `/v1/buys/prepare` persists the destination (`destination_address`) + expected nanoTON (`expected_nano_ton`); `/v1/buys/confirm` persists the wallet-signed `tx_hash`. New `POST /v1/buys/verify-and-settle` (Bearer) looks the tx up via TonAPI (`GET /v2/blockchain/messages/{hash}/transaction`) and settles **only** when it exists & succeeded, the recipient equals the prepare-time destination (canonicalized to raw `wc:hash`), the amount ≥ expected, and it's ≤ 30 min old. Failure map: `tx_not_found`/`api_unavailable` → `pending_confirmation` (retryable); `tx_failed`/`destination_mismatch`/`amount_insufficient`/`tx_too_old` → `verification_failed` (final). Settlement is claim-then-write in raw order: `markSettled` (double-settle guard) → `tryIncrementSharesSold` (race-safe) → holding upsert (weighted-average cost via `nextAvgCostUsd`) → `transactions` row (status success, real txHash, verified amount; `buy_intent_id` UNIQUE). The payer/walletAddress is **not** verified (server lacks a reliable stored wallet for the session; `wallets` table exists but unused) — documented limitation. Shared `TON_API_URL`/`TON_API_KEY` env (also used by the indexer worker). Frontend polls `verifyAndSettle` after `confirmBuy` and shows "Confirming on blockchain…" until settled.
- **`@telegram-apps/sdk-react` is 3.x signal-based** — IMPORTANT correction: the installed 3.3.9 SDK does NOT export `useThemeParams/useBackButton/useMainButton/useHapticFeedback/useViewport` hooks. Correct pattern: `init()` returns a cleanup fn; the singleton components (`backButton`, `mainButton`, `viewport`, `themeParams`, `hapticFeedback`, `closingBehavior`, `miniApp`) hold methods + signals, read via the React binding `useSignal()`. Wired by the Telegram foundation subset of Phase 2 (separate plan).
- **System font over Geist** — scaffold `layout.tsx` still uses `next/font/google` Geist; corrected by the foundation-subset plan to the system stack per the original decision.
- **TypeScript bumped to 7.0.2** during manual Bun install — major version above the `^5` baseline; no Phase 2 usage relies on 7-specific features yet. Monitor for breaking changes.
- **Vitest 4 + jsdom 29 + @testing-library added** — pure-utility TDD for `lib/ton/**` (address, nano conversions, sendTx logic). No component tests in Phase 2.
- **`three@0.185` for onboarding only** — removed in favor of CSS fraction-house animation (Telegram WebView perf / stability).
- **`next-intl` for i18n (no locale URL prefix)** — client `NextIntlClientProvider` + `messages/*.json` for en/fa/ar/ru/de/tr; locale from Settings override or Telegram `language_code`; RTL via `dir` on `<html>`. Avoids breaking TMA fixed start URLs. Guide: `docs/i18n.md`.
- **getCurrentSharePrice() = single price source of truth (property redesign)** � Hero, Metrics, Calculator cost, Chart anchor and Sticky CTA must all read the current share price via src/lib/property-price.ts: funding ? sharePriceUsd; funded/resale ? estAskUsd ?? lastTradeUsd ?? sharePriceUsd. Mock order-book ladders and synthetic trades centre on the same value. No surface may re-derive price from raw fields.
- **Property page redesign (2025-08 phases 1�8)** � single-page composition in PropertyDetail.tsx: Gallery ? Hero ? Metrics ? OwnershipBanner ? IncomeCalculator ? YieldLockSection ? PerformanceChart ? MarketSection (secondary only) ? Trust ? About (+Sheet) ? Documents ? SimilarProperties; sticky CTA reveals after the hero scrolls away. **Price:** every surface reads getCurrentSharePrice (lib/property-price.ts). **Ownership states:** usePortfolio holdings = owned, ctiveLocksForProperty(useLocks()) = locked, free = owned ? locked (banner hidden while loading or owned=0). **Entry points:** Buy primary = BuySheet via MainButton/Hero/Sticky/Calculator (openBuyForContext, TON/USDT tx); Buy secondary = LimitBuySheet @ best ask; Sell secondary = SellSheet (sticky Sell when free shares > 0); Lock/Unlock = LockSheet + YieldLockSection. All flows reuse existing mutations and invalidate portfolio on success.
