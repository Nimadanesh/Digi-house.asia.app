# ROADMAP — DigiHouse

> Execution plan, sequenced so every increment is reviewable and `npm run check` stays green (including `/design-review`).
> The current phase is **Phase 1 — Specifications**. **No UI/pages/components are built until the docs are approved and you're told to proceed.**

## How to run the phases
- Work phase by phase. Run `npm run check` + a `/design-review` on touched screens at the end of each phase; fix before continuing.
- The **Foundation** phase must land before Components — everyone builds on it.
- Don't add/remove deps mid-phase without updating the [TECH_STACK](./TECH_STACK.md) decisions log.
- A screen that compiles but isn't native-Telegram per [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) is **not done**.
- The **weekly-yield epic** is the spine. At the end of Phases 3, 4, and 5 it must be possible to trace one investor's share → its projected weekly yield → its actual paid earning. If that loop doesn't close, the phase isn't done.

## The Weekly-Yield Epic (spans Phases 2–5)
This is the single feature thread that must always be demonstrable. It is tracked separately because it's the story the product is sold on.
- **Phase 2** — mock data + repo contracts for rent/month, shares, and per-week earnings; format helpers ready.
- **Phase 3** — Earnings/`FundingBar`/`BuyControl` primitives surface projected & paid weekly yield.
- **Phase 4** — the **Earnings report** ships end-to-end and the proportional-math integrity check passes (R-6.6).
- **Phase 5** — animated payout transitions, countdown, and reduced-motion parity.

---

## Phase 1 — Specifications ✅ (current / awaiting approval)
**Goal:** a complete, approved product + tech + design + data spec. No code yet.

Deliverables:
- [x] `docs/research/BRIEF.md` — what & why, principles, MVP scope, **weekly-yield hero narrative**.
- [x] `docs/research/REQUIREMENTS.md` — R-IDs with acceptance criteria; native-Telegram NFRs; **[HERO]-tagged weekly-yield requirements**.
- [x] `docs/research/USER_FLOW.md` — detailed journeys + navigation map + back-stack + haptics rules.
- [x] `docs/research/DESIGN_SYSTEM.md` — native-Telegram authority: colors (oklch), fonts, blocks, buttons, bars, haptics.
- [x] `docs/research/DATA_MODELS.md` — typed domain + repository contracts + mock seed invariants (includes weekly earnings fields).
- [x] `docs/research/TECH_STACK.md` — stack, versions, integration boundaries, decisions log.
- [x] `docs/research/ROADMAP.md` (this file) — phased plan.
- [x] `AGENTS.md` aligned with the strict native-Telegram rule + phase numbering.
- [x] Project reset to clean scaffold (only `docs/`, tokens, layout, deps remain). `npm run check` green.

Exit criteria: spec docs reviewed and explicitly approved. **Stop and wait for the go-ahead before Phase 2.**

---

## Phase 2 — Foundation
**Goal:** a runnable, native-Telegram shell with design tokens, providers, mock data, and Telegram SDK — but intentionally **no finished feature screens**.

Deliverables:
- [ ] `src/app/globals.css` — verify the native-Telegram oklch tokens (already drafted in Phase 1) light up the shadcn base components.
- [ ] `src/app/layout.tsx` — system font via tokens, DigiHouse metadata, Telegram `#17212b` theme color.
- [ ] `src/app/providers.tsx` — client provider tree: Telegram SDK init → TonConnect (restoreConnection) → QueryClient. No visual chrome.
- [ ] `src/lib/telegram/TelegramProvider.tsx` + `useTelegram()` (init, theme params, viewport, MainButton/BackButton, haptics helpers).
- [ ] `src/lib/ton/` — `tonconnect-manifest.json`, `useTonConnect` hook, `sendTx` stub → `{ ok, boc?, error? }`.
- [ ] `src/lib/query/client.ts`; `src/hooks/.gitkeep` only (fill as used).
- [ ] `src/lib/api/*.ts` repo interfaces per [DATA_MODELS](./DATA_MODELS.md); `src/lib/mock/*.ts` seed (≥6 properties: funding/funded/resale, holdings, ≥4 weekly earnings across the payout cadence, ≥1 open order, a failed/pending tx).
- [ ] `src/types/` — mirror interfaces from [DATA_MODELS](./DATA_MODELS.md).
- [ ] `src/lib/format.ts` — `usd`, `ton`, `shortAddr`, `pct`, `weekLabel`, plus the two weekly-yield helpers from [DATA_MODELS](./DATA_MODELS.md): `weeklyRent` (`floor(annualRentUsd / 52)`) and `projectedYield` (`floor(weeklyRentUsd × sharesOwned / totalShares)`).
- [ ] `src/components/layout/{AppShell,Header,BottomTabBar,MainButtonBridge}.tsx` — Telegram-style shell, 4 tabs, safe-area aware.
- [ ] `src/app/(app)/layout.tsx` wraps AppShell; routes `home / marketplace / property/[id] / earnings / portfolio / settings` created with **placeholder** content that still renders skeletons/empty states.
- [ ] `/design-review` passes on the empty shell (native-Telegram tokens, hairlines, fonts).

Exit criteria: app boots inside Telegram, shows the bottom-tab shell, wallet connects (TonConnect UI appears), Telegram theme params load, **mock weekly-earnings data is queryable from the repo layer**, `npm run check` + `/design-review` green.

---

## Phase 3 — Components
**Goal:** every visual primitive exists, native-Telegram, driven by mock data — in isolation.

Deliverables:
- [ ] `common/`: `Block` + `Row` (grouped-list primitives), `StatusPill`, `Skeleton`, `EmptyState`, `ProgressBar`, `Sheet`, `Toast`.
- [ ] `property/`: `PropertyCard` (list + detail variants), `FundingBar`, `OrderBook`, `BuyControl` *(shows live projected weekly yield for qty)*, `SellSheet`, `MyPosition`.
- [ ] `earnings/`: `EarningsTimeline`, `EarningsSummary` *(all-time + this-week + payout countdown)*, `EarningsEntry` *(share % + amount, Paid/Pending pill)*.
- [ ] `wallet/`: `ConnectWallet` (TonConnectButton styled native-Telegram), `WalletBadge`, `DisconnectedState`.
- [ ] `icons.tsx` — brand mark + property/category SVGs.
- [ ] Every primitive ships loaded | loading skeleton | empty | error variants as applicable.

Exit criteria: primitives render with mock data on stubbed pages; tokens, hairlines, and system font match [DESIGN_SYSTEM](./DESIGN_SYSTEM.md); **projected weekly yield and paid weekly yield render in their primitives**; `npm run check` + `/design-review` green.

---

## Phase 4 — Integration
**Goal:** end-to-end happy paths from [USER_FLOW](./USER_FLOW.md).

Deliverables:
- [ ] Onboarding + role selection (Zustand role; prominent-tab switching; persisted).
- [ ] Home: balance sum + holdings cards from portfolio repo; **next payout countdown**; empty → Marketplace CTA.
- [ ] Marketplace: list + filters + search + pull-to-refresh; **per-card projected weekly yield per share**; tap → detail.
- [ ] Property detail: financials (`Block`/`Row`), funding bar, **weekly-yield block row (live with qty)**, order book, inline Buy & Sell flows; `MainButton` used for confirm.
- [ ] Buy flow: validation → TonConnect TX (real connect, stub tx) → toast → invalidate portfolio + Earnings projection.
- [ ] Sell flow: place/cancel sell order → order book + portfolio open-orders update.
- [ ] **Earnings report (hero screen):** weekly timeline + summary; proportional share %; paid/pending pills; payout countdown; **proportional-math integrity check passes (R-6.6).**
- [ ] Portfolio: allocation bar, holdings, open orders with cancel.
- [ ] Settings: role switch, Telegram-theme toggle, disconnect wallet.
- [ ] Haptics wired per the haptics map.

Exit criteria: USER_FLOW flows 1–4 pass manually; back-stack + `BackButton`/`MainButton` behavior correct; **the weekly-yield loop closes end-to-end** (buy → hold → see projection → see paid on schedule); `npm run check` + `/design-review` green.

---

## Phase 5 — Polish & Deploy
**Goal:** production-grade native feel + deployable.

Deliverables:
- [ ] Framer Motion per DESIGN_SYSTEM motion rules; reduced-motion respected.
- [ ] Empty/error states for every screen; consistent top toasts; `closingConfirmation` during pending TX.
- [ ] Safe-area + Telegram inset polish; no horizontal scroll; max 480 viewport.
- [ ] Dark & light parity; `/design-review` passes on all screens.
- [ ] **Weekly-yield polish:** animated payout transitions, countdown-morphism, paid-row success micro-interactions — all reduced-motion-safe.
- [ ] SEO/manifest: favicon, og, `tonconnect-manifest.json`, Telegram Mini App manifest.
- [ ] BotFather: set domain, configure Mini App URL.
- [ ] Vercel deploy; smoke test inside Telegram (mobile + desktop).
- [ ] **Pitch/recordable demo:** a 30–60s clickable walkthrough of the weekly-yield loop for the competition/judges.

Exit criteria: deployed URL runs inside Telegram; all R-9 native-Telegram criteria met; **weekly-yield loop recorded demo-ready**; `npm run check` + `/design-review` green.

---

## Phase 6+ (post-MVP, out of scope now)
- Owner listing flow (R-10), real on-chain fractionalization smart contract, KYC, Farsi i18n, a real matching engine, a property valuation feed, push notifications for weekly earnings, **real on-chain weekly payout distribution**.

## What "winning" looks like (north star, not a phase)
A judge opens the Telegram bot, connects a wallet, buys 0.5% of a property in under a minute, and a week later the Earnings screen shows the rent arrive — **proportional to their share, paid on schedule**. **MVP:** the weekly payout is *simulated* (mock scheduler) and the hero Earnings screen says so; the promise of an on-chain, verifiable payout is what the real TON Distribution contract delivers post-MVP. Every phase above exists to make that 60-second + 7-day story real.