# BRIEF — DigiHouse

> The single source of truth for the project's *what* and *why*. Read this first, before any other doc.

---

## Project Name
**DigiHouse** — *Own a slice. Earn every week.*

## One-line Description
A **Telegram Mini App** to buy, sell, and earn **weekly rental yield** from fractionalized real estate on the **TON** blockchain — with as little as a few dollars.

## The Pitch (for the competition & investors)
Real estate is the oldest wealth-building asset class — and the most exclusive. Most people are priced out forever. **DigiHouse cracks it open**: anyone inside Telegram can buy a fraction of a real property and receive **rent income, paid weekly, proportional to their share** — directly to their TON wallet.

No bank. No paperwork. No quarterly reports. Just a Telegram chat, a TON wallet, and **money in your account every seven days.**

That weekly payout is the magic. It turns a slow, illiquid asset into something that feels alive — a paycheck you can watch arrive. That's the hook that makes small investors care, and the story that makes DigiHouse win.

## Why Telegram + TON
- **One billion users already live in Telegram.** We don't ask them to download an app; we arrive where they are.
- **TON is Telegram's native chain.** Wallet, identity, and asset share one user, one tap — zero onboarding friction.
- **Yield distribution on TON is cheap and fast.** Weekly micro-payouts that would be infeasible on Ethereum are practical here.
- DigiHouse must feel like a **first-party Telegram product** — not a web page awkwardly opened from a chat.

## The Problem
| # | Pain | Who feels it |
|---|---|---|
| 1 | Real estate is high-ticket — most people can never afford a whole property. | Small investors |
| 2 | Owners needing liquidity are forced to sell an entire asset at once. | Property owners |
| 3 | Rental income is opaque and slow — paid monthly/quarterly, buried in statements. | Everyone |
| 4 | Existing tokenization platforms (e.g. Lofty.ai) are not built for the Telegram + TON ecosystem that dominates our market. | Our users |
| 5 | Crypto-native users in Telegram want yield they can understand in seconds — not a spreadsheet. | Crypto users |

## The Solution
DigiHouse **fractionalizes** property into on-chain shares on TON. Investors buy shares with small budgets; owners raise liquidity by selling a *percentage* instead of the whole asset. Rent income is distributed to shareholders **proportional to their share, paid weekly** — visible, predictable, and instantly claimable.

## The Hero Feature — Weekly Rental Yield
> **An investor who buys a fraction of a property receives rental income proportional to that fraction, distributed weekly.**

This is the single non-negotiable invariant of the product. Every screen, data model, transaction, and marketing line must preserve and reflect it.

**Why it's the differentiator:**
- **Frequency wins attention.** Daily/weekly feedback beats "wait a year and see."
- **Understandability wins trust.** "You own 1% → you get 1% of the rent, every Friday" is a sentence a 12-year-old gets.
- **On-chain proof wins credibility.** Every payout is a TON transaction — verifiable, not a PDF.

We don't just tokenize property. We make the **rent show up.**

## Primary Goal
Let small-budget investors participate in real-estate markets and receive **proportional weekly rental yield**, while giving owners a way to unlock liquidity without selling their entire property — all from inside Telegram, in a flow that feels native to the platform.

## Secondary Goal (sets up the business)
Demonstrate the full loop end-to-end — invest → hold → earn → (sell) — so investors and judges can see the engine running, even if MVP distribution is simulated at the mock layer. The story alone is investable.

## Target Users
| Persona | Role | Goal | Why DigiHouse |
|---|---|---|---|
| **Aria — Investor** | Buys/sells property shares | Earn passive **weekly** rental yield with small capital | First real-estate yield she can afford and actually feel |
| **Omid — Owner** | Lists a property for fractional sale | Raise liquidity without a full sale | Unlocks cash without losing the asset |
| **Sam — Trader** | Trades shares on the order book | Speculate / provide liquidity | A liquid secondary market for tokenized rent-yielding assets |

## Product Principles
1. **Native Telegram first** — the UI must be indistinguishable from a real Telegram Mini App: official colors, system fonts, grouped blocks, hairline separators, the Telegram header, bottom navigation, haptic feedback, safe-area aware. See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).
2. **Numbers are the hero** — the weekly yield, the share %, the balance. Generous whitespace, low chrome. Every money figure shows both USD and a TON estimate. Tabular-nums always.
3. **Trust through clarity** — every claim is backed by an on-chain number; nothing is hidden behind marketing copy.
4. **Dark first** — Telegram's blue glows on a dark canvas; light mode is a faithful mirror.
5. **One accent** — Telegram blue drives every action; green/red are reserved strictly for finance up/down and bid/ask.
6. **One primary action per screen** — every screen has exactly one hero CTA; secondary actions are secondary. The weekly yield is the always-visible emotional payoff.

## MVP Scope
See [REQUIREMENTS.md](./REQUIREMENTS.md) for the acceptance-criteria-driven breakdown and [USER_FLOW.md](./USER_FLOW.md) for journeys.

### Investor side (priority order)
1. Onboarding + role selection (**Investor** vs **Owner**)
2. TON wallet connection (TonConnect)
3. Home — username, USD balance, owned-share property cards with **next payout countdown** (CTA to Marketplace when empty)
4. Marketplace — browse fractional property listings as clean Telegram-style cards
5. Property detail — total price, shares offered/sold/remaining, share price, order book, inline buy (and sell if holding)
6. **Earnings report — weekly yield timeline per owned property** *(the hero screen)*
7. Buy/sell fractions + place sell orders
8. User portfolio
9. Fully mobile, Telegram-native UI/UX

### Owner side (secondary for MVP)
- List a property → define total price, number of shares, share price
- View funded status (shares sold / remaining)
- Receive raised capital to wallet
(Owner listing flow is **post-MVP**; stubbed in MVP — see [ROADMAP](./ROADMAP.md). The investor loop is the competition-winning story.)

## Success Metrics (ideshowing the loop)
> MVP can't measure real adoption, but the *demo* must visibly prove each:
- **Weekly payout fires on schedule** → the hero screen updates every simulated week.
- **Anyone can buy a share in under 60 seconds** from opening the bot → owning.
- **Proportional math is exact and on-display** — own 1%, see 1% of the rent land.
- **The whole app lives inside Telegram** — no external browser, no separate sign-up.

## Out of Scope (MVP)
- Legal/KYC document automation
- Off-chain property valuation oracles
- Secondary-market AMMs (we use a simple order book)
- Multi-currency settlement (TON + USD-denominated only)
- Property management tooling (maintenance requests, etc.)
- Farsi i18n (English copy only for MVP)
- Real on-chain fractionalization smart contract (simulated by the mock layer; only wallet connect + a minimal "buy" TX stub are real on-chain touchpoints)

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
- We **win on feel and story**, not on-chain completeness. The mock layer exists to make the weekly-yield loop demonstrable immediately.

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
4. **Integration** — TonConnect, listings, buy/sell flows, the weekly-earnings hero screen.
5. **Polish & Deploy** — animations, empty/error states, Telegram theming, QA, deploy.

## One-Sentence Summary (for the judges)
**DigiHouse lets anyone in Telegram buy a fraction of real estate and get rent paid to their wallet every week — proving that the oldest asset class and the newest chain can meet inside a chat.**