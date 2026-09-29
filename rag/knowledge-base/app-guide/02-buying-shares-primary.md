---
docId: fifi.product.app-guide.buying-shares-primary.v1
docType: app-guide
domain: product
title: "Buying shares in the Primary Offering"
locale: en
source: implementation audit FIFI-01 (BuySheet, getCurrentSharePrice, canonical-offering.ts); docs/product/rebuild/PRODUCT-DECISION-LOCK.md §6
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
---

# Buying Shares — Primary Offering

## What Primary Offering means

**Primary Offering** is the first sale of a villa's fractional shares. In this stage, the platform is the seller.

The base share price is **$100 per share**. The funding indicator shows how much of the offering has been sold and how many shares remain.

## What the Property page is showing you

Before opening Buy, the Property page gives you the context for the purchase:

- **Photos** — what the villa looks like;
- **Name and location** — which estate you are reviewing;
- **Share price** — the price used for the displayed purchase calculation;
- **Total shares** — how the estate's ownership is divided;
- **Funding progress** — how much of the primary offering has been sold;
- **Estate value** — the displayed value of the whole estate;
- **Property metrics** — facts such as size, bedrooms, bathrooms, or guests when available;
- **Projected income** — a model estimate, not money already received.

## Buying step by step

1. Open **Marketplace** and select a villa.
2. Review the Property page and its tabs.
3. Tap **Buy**.
4. Use the **quantity stepper** to choose how many shares you want.
5. Review the **purchase summary**, including total cost and projected monthly income for that quantity.
6. Confirm the purchase in the app.
7. Approve the transaction in your connected wallet.
8. After a successful purchase, the holding appears in **Portfolio** and the relevant Home summary.

## Quantity stepper

The **quantity stepper** is the small increase/decrease control used to change the number of shares.

It is useful because the summary updates with the quantity:
- more shares → higher total purchase amount;
- fewer shares → lower total purchase amount;
- the displayed projected income changes with the selected quantity.

## Funding progress

The **funding bar** is a visual progress indicator for the Primary Offering.

It answers two simple questions:
- How much of the offering has already been sold?
- How much remains?

It is not a statement about future price performance.

## Purchase summary

The **purchase summary** is the final on-screen check before confirmation. It brings the selected quantity and resulting purchase amount together, along with the projected monthly income shown for that selection.

Review this summary before approving the wallet transaction.

## After purchase

Your holding can show:
- number of shares;
- displayed value;
- gain/loss relative to acquisition, where available.

Newly purchased shares do not earn rental profit until they are locked.

During Primary Offering, eligible shares can be sold back to the platform at a **7% discount** to the share price.

When all primary shares are sold, the villa moves to the Secondary Market.

## Primary vs Secondary

**Primary Offering:** you buy shares from the platform.

**Secondary Market:** you buy shares from another user through the market's order flow.

That distinction explains why the two screens can have different price and order behavior.
