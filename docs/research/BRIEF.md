# BRIEF — DigiHouse

> The single source of truth for the project's *what* and *why*. Read this first, before any other doc.

---

## Project Name
**DigiHouse**

## One-line Description
A **Telegram Mini App** to buy, sell, and earn weekly rental yield from fractionalized real estate on the **TON** blockchain.

## Why Telegram + TON
The target market lives inside Telegram, and TON is the native chain of that ecosystem. Building inside Telegram (as a Mini App) and settling on TON removes friction: the wallet, the chat identity, and the asset share one user, one app, one tap. DigiHouse should feel **like a first-party Telegram product** — not a web page awkwardly opened from a chat.

## Problem
- Real estate is high-ticket — most people cannot afford a whole property.
- Owners who need liquidity are forced to sell an entire asset at once.
- Existing tokenization platforms (e.g. Lofty.ai) are not built for the Telegram + TON ecosystem that dominates our market.
- Crypto-native users in Telegram want yield they can understand in seconds — not a spreadsheet.

## Solution
DigiHouse fractionalizes property into on-chain shares on TON. Investors buy shares with small budgets; owners raise liquidity by selling a percentage instead of the whole asset. Rent income is distributed to shareholders **proportional to their share**, paid out **weekly**.

## Primary Goal
Let small-budget investors participate in real-estate markets and receive proportional weekly rental yield, while giving owners a way to unlock liquidity without selling their entire property — all from inside Telegram, in a flow that feels native to the platform.

## Core Mechanism (non-negotiable)
> **An investor who buys a fraction of a property receives rental income proportional to that fraction, distributed weekly.** Every screen, data model, and transaction must preserve and reflect this invariant.

## Target Users
| Persona | Role | Goal |
|---|---|---|
| **Aria — Investor** | Buys/sells property shares | Earn passive weekly rental yield with small capital |
| **Omid — Owner** | Lists a property for fractional sale | Raise liquidity without a full sale |
| **Sam — Trader** | Trades shares on the order book | Speculate / provide liquidity |

## Product Principles
1. **Native Telegram first** — the UI must be indistinguishable from a real Telegram Mini App: official colors, system fonts, grouped blocks, hairline separators, the Telegram header, bottom navigation, haptic feedback, safe-area aware. See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).
2. **Trust through clarity** — numbers are the hero. Generous whitespace, low chrome. Every money figure shows both USD and a TON estimate.
3. **Dark first** — Telegram's blue glows on a dark canvas; light is a faithful mirror.
4. **One accent** — Telegram blue drives every action; green/red are reserved strictly for finance up/down and bid/ask.
5. **One primary action per screen** — every screen has exactly one hero CTA; secondary actions are secondary.

## MVP Scope
See [REQUIREMENTS.md](./REQUIREMENTS.md) for the acceptance-criteria-driven breakdown and [USER_FLOW.md](./USER_FLOW.md) for journeys.

### Investor side (priority order)
1. Onboarding + role selection (**Investor** vs **Owner**)
2. TON wallet connection (TonConnect)
3. Home — username, USD balance, owned-share property cards (CTA to Marketplace when empty)
4. Marketplace — browse fractional property listings as clean Telegram-style cards
5. Property detail — total price, shares offered/sold/remaining, share price, order book, inline buy (and sell if holding)
6. Earnings report — weekly yield timeline per owned property
7. Buy/sell fractions + place sell orders
8. User portfolio
9. Fully mobile, Telegram-native UI/UX

### Owner side (secondary for MVP)
- List a property → define total price, number of shares, share price
- View funded status (shares sold / remaining)
- Receive raised capital to wallet
(Owner listing flow is post-MVP; stubbed in MVP — see ROADMAP.)

## Out of Scope (MVP)
- Legal/KYC document automation
- Off-chain property valuation oracles
- Secondary-market AMMs (we use a simple order book)
- Multi-currency settlement (TON + USD-denominated only)
- Property management tooling (maintenance requests, etc.)
- Farsi i18n (English copy only for MVP)

## Tech Stack (summary — full: [TECH_STACK.md](./TECH_STACK.md))
- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind CSS v4 + shadcn/ui
- **Wallet / Chain:** TonConnect (`@tonconnect/ui-react`); `@ton/core` when needed
- **Telegram:** `@telegram-apps/sdk-react` (init, theme, viewport, MainButton/BackButton, haptics)
- **State:** TanStack Query (server cache) + Zustand (local UI)
- **Animation:** Framer Motion
- **Data:** mock repository layer behind repo interfaces — real TON/backend swap-in later
- **Deploy:** Vercel + Telegram Mini App (BotFather)

## Non-Goals / Constraints
- **Not a clone** of any site. We define our own visual language, but it is *specified to look native to Telegram*, not to any web product.
- No on-chain fractionalization smart contract in MVP — listing/fractionalization is simulated by the mock layer; only the wallet connection and a minimal "buy" TON transaction stub are real on-chain touchpoints.

## Inspiration (original design — not copying)
- FractioNFT — fractional ownership pattern on TON
- Getgems — TON NFT marketplace UX
- MRKT — real-estate tokenization UX
- Shardify — fractional data model
The visual authority, however, is **Telegram's own native design language**, codified in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

## Build Phases (summary — full: [ROADMAP.md](./ROADMAP.md))
1. **Specifications** (current) — product/tech/design docs approved before any code.
2. **Foundation** — providers, routing shell, design tokens, mock data, Telegram SDK init.
3. **Components** — atomic native-Telegram UI primitives.
4. **Integration** — TonConnect, listings, buy/sell flows, earnings.
5. **Polish & Deploy** — animations, empty/error states, Telegram theming, QA, deploy.