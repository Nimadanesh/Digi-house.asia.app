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

The Secondary Market is where users trade shares with other users after a villa's Primary Offering is complete.

Once all primary shares are sold, the villa moves to the Secondary Market. This transition is one-way.

## Order Book

The Order Book is the area where buy and sell orders are shown.

A **sell order** says that a holder wants to sell a chosen number of shares at a chosen price.

A **buy order** says that a buyer wants to purchase a chosen number of shares at a chosen price.

A trade happens when a compatible buyer and seller are matched.

## Selling shares

1. Open the Property page for a villa you hold.
2. Open **Sell**.
3. Choose the quantity.
4. Set the price per share.
5. Confirm the order.
6. The order appears in the Order Book and in **Portfolio → Open Orders** while it is open.
7. Before it fills, an eligible open order can be cancelled.

Locked shares must be unlocked before they can be sold.

## Buying shares

1. Open the relevant Secondary Market flow.
2. Enter the quantity and price you want to buy at.
3. Place the order.
4. When a seller matches the order, the trade fills and your holding updates.

## Price in the Secondary Market

Unlike the Primary Offering, the Secondary Market uses supply and demand between users. The price can therefore differ from the primary share price.

## Fees

The platform charges a commission on buy and sell transactions. The exact current rate depends on the transaction amount and should be taken from the current fee schedule shown by the app.

The **7% Primary Offering buyback discount** is different: it applies to eligible sales back to the platform during Primary Offering and is not a Secondary Market trading fee.

## Demo market information

Where the app labels an order-book entry, fill, or market tape as demo, treat it as demonstration data rather than real market history.

