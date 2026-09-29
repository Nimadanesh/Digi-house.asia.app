---
docId: fifi.product.app-guide.secondary-market-and-trading.v1
docType: app-guide
domain: product
title: "Secondary Market and trading — order book, commissions"
locale: en
source: implementation audit FIFI-01 (SellSheet, LimitBuySheet, useOrderBook, MarketSummary); docs/product/rebuild/PRODUCT-DECISION-LOCK.md §6
sourceTier: 1
status: ACTIVE
defaultProvenance: MIXED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
---

# Secondary Market & Trading

## When a villa moves to the Secondary Market

- After **all primary shares** of a villa are sold, the villa moves to the Secondary
  Market. This transition is one-way: a villa never returns to Primary.
- Statuses (`funding/funded/resale`) are demo scenario state controlling which flow
  opens; all numbers shown are canonical or ledger-derived.

## How buying and selling works there

- Price is determined by **supply and demand**: users place orders to buy from or sell
  to **other users** (the platform is no longer the counterparty).
- **Sell:** open a holding's Property page, use the **Sell** entry, set quantity and
  price per share in the sell sheet, and confirm to place the order. It appears in the
  order book and under Portfolio → **Open Orders**, where it can be cancelled any time
  before it fills.
- **Buy:** place a buy order at a chosen price into the order book; when a seller
  matches, the trade fills and holdings update.
- Shares locked in the yield program must be **unlocked** before they can be sold.
- Secondary demo tape (order book, synthetic fills) is isolated demo data, marked as
  demo throughout — never presented as real market history.

## Platform commission on trades

- The platform takes a commission on **every** buy and sell transaction — a main
  platform revenue source. 9-tier amount-based table plus flat 7% instant-sell note.
- Commission tiers are amount-based per transaction. The exact current table lives in
  `PRODUCT-PLAN.md` §0.5 (served via `GET /v1/fees`) — never quote rates from memory.
- A fee disclosure is available in the app (fee icon / pill opens the fee schedule).

## Primary vs Secondary at a glance

| | Primary Offering | Secondary Market |
|---|---|---|
| Seller | The platform | Other users |
| Price | Fixed ($100 base) | Supply and demand (order book) |
| Sell-back | To the platform at 7% discount | Via orders to other users |
| Commission | Platform commission applies | Platform commission applies |
