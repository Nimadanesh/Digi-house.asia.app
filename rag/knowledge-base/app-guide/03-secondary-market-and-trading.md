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

## What the Secondary Market is

The **Secondary Market** is where users trade shares with other users after a villa's Primary Offering is complete.

Once all primary shares are sold, the villa moves to the Secondary Market. This transition is one-way.

## Order Book

The **Order Book** is the market's live list of buy and sell orders.

A **sell order** says:
“I want to sell this many shares at this price per share.”

A **buy order** says:
“I want to buy this many shares at this price per share.”

The Order Book therefore lets you see what buyers and sellers are asking for. A trade happens when compatible orders are matched.

## Market summary

A market summary can give you a quick view of the current trading context, while the Order Book shows individual orders.

The two serve different purposes:
- **Market Summary** = quick market picture;
- **Order Book** = individual buy/sell interest.

If the app shows a market tape or fill history, a **Demo** label means the displayed activity is demonstration data rather than real market history.

## Selling shares

1. Open the Property page for a villa you hold.
2. Tap **Sell**.
3. Choose the quantity.
4. Set the price per share.
5. Review and confirm the order.
6. While open, the order appears in the **Order Book** and **Portfolio → Open Orders**.
7. Before it fills, an eligible open order can be cancelled.

Locked shares must be unlocked before they can be sold.

## Buying shares

1. Open the relevant Secondary Market buying flow.
2. Enter the quantity.
3. Enter the price you want to pay per share.
4. Review and place the order.
5. When a compatible seller is matched, the trade fills and your holding updates.

A placed order is not automatically a completed trade.

## Price in the Secondary Market

Unlike Primary Offering, the Secondary Market price comes from supply and demand between users. It can therefore be above or below the primary share price.

The displayed price is a market value for the order flow; it is not a promise about what the share will be worth later.

## Fees

The platform charges a commission on eligible buy and sell transactions. The exact current rate depends on transaction amount and should be taken from the current fee schedule shown by the app.

The **7% Primary Offering buyback discount** is separate. It applies to eligible sales back to the platform during Primary Offering and is not a Secondary Market trading fee.

## Open Orders

An **Open Order** is an order waiting for a compatible counter-order.

This is why a share sale can appear in Portfolio without the shares having actually been sold yet.

Where cancellation is available, cancelling an open order removes it from the active order flow; it does not create a completed trade.
