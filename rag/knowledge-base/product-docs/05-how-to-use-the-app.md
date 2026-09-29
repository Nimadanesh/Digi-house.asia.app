---
docId: fifi.guide.product-doc.how-to-use-the-app.v1
docType: product-doc
domain: guide
title: "How to use the app — a simple user guide"
locale: en
source: implementation audit FIFI-01 (routes, tabs, hooks); docs/product/rebuild/PRODUCT-DECISION-LOCK.md
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
related:
  - fifi.product.app-guide.app-overview-and-navigation.v1
---

# How to Use the App

A simple guide for users. Locked model throughout: monthly profit per locked share,
Average scenario = payout basis, $100 base share price, five estate tabs, route
`/property/[id]`.

## Getting started

1. **Open the app** — FractionalLuxe runs on its own website and app
   (`app.fractionalluxe.com`, via `fractionalluxe.com`), across multiple blockchains.
2. **First-time onboarding** — a few short intro slides explain the product ("Receive
   your rental share every month"); pick your role (Investor or Owner) with one tap.
   Returning users skip straight to Home.
3. **Connect a wallet** — TON (TonConnect) or EVM (Ethereum, BSC, Polygon, Arbitrum)
   when you first transact. The wallet is your identity for buying and selling.

## Navigating

The app has a bottom tab bar:

| Tab | What you find there |
|---|---|
| **Home** | Your balance/portfolio value, next payout, and your property cards. Empty state points you to the Marketplace. |
| **Marketplace** | The 24 estates as cards — price, funding state, projected income per share. Search and filters included. |
| **Earnings** | Your income screen: received totals, accrued income, and per-estate income history. |
| **Portfolio** | Your holdings, allocation, and open orders. |

Other screens (Settings, Club, Referral, Card, property detail) open from the header,
cards, or deep links — not from the tab bar.

Design principles to expect: one primary action per screen, numbers presented before
words, and every screen shipping loaded/loading/empty/error states.

## Buying shares (the main flow)

1. From **Marketplace**, tap an estate card to open its page (`/property/[id]`).
2. The page shows the fixed top section (photos, name, location, share price, funding
   bar, estate value) plus four always-visible stats: **Monthly income**, **Proj. / year**
   (both projected per-share, Average scenario = payout basis), **Avg. nightly rate**
   (ANR), and **Est. growth** (upper end of the valuation range).
3. Explore the five tabs — **Estate** (labeled "Overview": why this estate, specs,
   amenities, location), **Income** (rental basis, scenarios, modeled costs, net income),
   **Ownership** (valuation & shares, growth, exit & liquidity, position preview),
   **Earn** (lock/unlock), **Details** (operator, legal, documents, distribution & tax).
4. Tap **Buy**, choose your share quantity with the stepper, and review the summary:
   total cost and the projected monthly income for that quantity (labeled **Projected**,
   Average scenario).
5. Confirm in the app and approve the transaction in your wallet.
6. On success, your **Portfolio** and Home update with your new holding.
7. **Lock your shares** (Earn tab) to receive the monthly profit per share. Unlocked
   shares earn nothing.

## Checking your earnings

1. Open the **Earnings** tab. The hero shows **received in total** (paid money only).
2. Below it: **Accrued income** — earned on your locked shares, paid with the next
   monthly distribution — and **Expected** entries for pending distributions.
3. **Income by estate** lists paid income per estate; tap through to an estate page.
4. Profit is **per locked share, monthly** (Average scenario). Only **locked** shares
   earn — unlocked shares earn nothing.
5. In the current demo build, paid entries are **labeled "simulated"** — honest demo
   data, never presented as real history.

Projected, accrued, and paid are always shown as **separate numbers** — never blended.

## Withdrawing

Request withdrawal at any time. A **1% fee** is charged at request time and the net is
paid in **exactly 4 weekly installments**. Installments are a payment schedule, not
profit frequency.

## Selling shares

1. Open an estate you hold and use the **Sell** entry.
2. The sell sheet shows quantity, price, total sale value, and gain/loss vs your
   acquisition — before you confirm.
3. Confirm to create your listing; it appears in the order book and in Portfolio →
   **Open Orders**, where you can cancel it any time before it fills.
4. Shares locked in the yield program must be unlocked before they can be sold — and
   once unlocked they stop earning. During the Primary Offering, shares may be sold
   back to the platform at a 7% discount. No UI implies instant liquidity unless a real
   mechanism provides it.

## Other useful things

- **Settings** (bottom sheet): wallet, demo-badge toggle, language, theme, about/legal.
- **Demo mode badge**: the current build shows a discreet "Demo mode" pill so demo data
  is never mistaken for the real thing.
- **Deep links**: tapping a specific villa link on the website opens that estate's page
  directly.
- **Support topics** (payments, account issues, legal advice) are outside the chatbot's
  scope — the app and official support channels handle those.
