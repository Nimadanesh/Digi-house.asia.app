# TECH STACK — DigiHouse

> Exact stack, versions, and integration boundaries. Agents: read this *before* installing or wiring anything.
> Don't guess versions; prefer the installed version in `package.json`. Log every dependency change in the **Decisions log** at the bottom.

## Runtime / Build
| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router) | `output: "standalone"` in `next.config.ts` (self-host friendly) |
| Language | **TypeScript** strict, `noEmit` | no `any`; `@/*` → `./src/*` |
| React | **19.2** | server components by default; `"use client"` for the interactive Mini App shell |
| Styling | **Tailwind CSS v4** (PostCSS) | oklch tokens in `src/app/globals.css` per [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) |
| UI primitives | **shadcn/ui** (base-nova style) + `lucide-react` | components in `src/components/ui/` — **restyled to native-Telegram look** (see DESIGN_SYSTEM) |
| Animation | **Framer Motion** | per DESIGN_SYSTEM motion rules |
| Node | 24 | `.nvmrc` = `24` |
| Deploy | **Vercel** + **Telegram Mini App** (BotFather) | `next build` must pass |

> **Next.js note (per AGENTS.md):** This is the latest Next.js with breaking changes vs. training data. Before writing App Router code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.

## TON / Blockchain
| Concern | Package | Purpose |
|---|---|---|
| Wallet connect | `@tonconnect/ui-react` | `<TonConnectUIProvider>`, restore, button, send TX |
| Cell / contract typing | `@ton/core` | add when needed — build messages, parse jettons |
| Crypto | `@ton/crypto` | only if signature/key helpers are needed (not MVP) |

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
| SDK | `@telegram-apps/sdk-react` | `init()` + `restoreInit()` in a client provider; `useLaunchParams`, theme params, viewport, `backButton`, `mainButton`, `hapticFeedback` |
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
| Server / async cache | **TanStack Query** | all listing/portfolio/earnings/order-book data. `src/lib/query/client.ts` + hooks in `src/hooks/*` |
| Local UI state | **Zustand** | role, settings, sheet flags, selected property. `src/stores/*` — keep minimal |
| Form state | React 19 native (`useState`) or valibot if needed | add libs only if proven necessary; **log it** |

## Data layer & mocking (important for parallel agents)
- Define repository **interfaces** in `src/lib/api/*.ts` (`MarketplaceRepo`, `OrderBookRepo`, `PortfolioRepo`, `EarningsRepo`, `TxRepo`) — see contracts in [DATA_MODELS](./DATA_MODELS.md).
- Implement a **mock** backend in `src/lib/mock/*.ts` returning typed data with realistic delays.
- Single `getRepo()` injection point → real TON/backend swap-in is a one-folder change.
- Mock seed must cover every UI state (see [DATA_MODELS](./DATA_MODELS.md) "Mock seed invariants").

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
    earnings/                           # EarningsTimeline, EarningsSummary
    wallet/                             # ConnectWallet, WalletBadge, DisconnectedState
    common/                             # Block, Row, StatusPill, Skeleton, EmptyState, ProgressBar, Sheet, Toast
  hooks/                                # useMarketplace, usePortfolio, useEarnings, useOrderBook, useTelegram, useTonConnect, useHaptics
  lib/
    utils.ts (cn), format.ts (usd/ton/shortAddr/pct/weekLabel)
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

## Decisions log (append-only)
- **Dropped `@telegram-apps/telegram-ui`** — requires React 18; conflicts with React 19. We use shadcn + DESIGN_SYSTEM instead, restyled to native-Telegram.
- **Kept `@telegram-apps/sdk-react`** even with the deprecation warning; acceptable for MVP; swap to `@tma.js/react` only if it breaks.
- **System font over Geist** — Telegram renders in the device native font; switched `--font-sans` to the system stack for native fidelity (see [DESIGN_SYSTEM](./DESIGN_SYSTEM.md)).
- **Flat, hairline design** — no drop shadows on blocks; color separation + hairlines only, to match Telegram (per DESIGN_SYSTEM).
- **`MainButton` for screen-primary actions** — not an in-page duplicate; only app tab bar on read screens.
- **Mock-first** — no real on-chain fraction contract in MVP; only the wallet + a minimal buy TON tx stub are real.