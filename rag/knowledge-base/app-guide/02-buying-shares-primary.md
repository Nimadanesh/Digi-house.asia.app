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

## How the Primary Offering works

- When a villa is first listed for fractional sale, its shares are offered at a **fixed
  price**: **$100 base price per share** (base = approved valuation ÷ 100).
- The seller of these primary shares is **the platform itself**.
- A funding progress bar ("X% funded · N shares left") shows how much of the offering
  is still available. Figures shown are derived live from the demo ownership ledger —
  never static claims.

## Steps to buy

1. From the **Marketplace** (`action.open-marketplace`), tap an estate card to open its Property page (`action.open-estate`).
2. Review the fixed top section (photos, name, location, share price, funding bar,
   estate value) and the stats (Monthly income, Proj. / year, Avg. nightly rate,
   Est. growth).
3. Tap **Buy** and choose the share quantity with the stepper.
4. Review the summary: total cost and the projected monthly income for that quantity
   (labeled **Projected**, Average scenario).
5. Confirm in the app and approve the transaction in the wallet (TON or EVM).
6. On success, **Portfolio** and Home update with the new holding.

## What happens after purchase

- The holding appears in Portfolio with quantity, value, and gain/loss vs acquisition.
- Newly bought shares do **not** earn until locked — see
  `fifi.product.app-guide.locking-shares-and-earning.v1`.
- While the villa is still in its Primary Offering, the holder may sell shares back
  **to the platform at a 7% discount** (share price − 7%).
- Once all primary shares are sold, the villa moves to the Secondary Market — see
  `fifi.product.app-guide.secondary-market-and-trading.v1`.
