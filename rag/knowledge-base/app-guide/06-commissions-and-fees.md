---
docId: fifi.economics.app-guide.commissions-and-fees.v1
docType: app-guide
domain: economics
title: "Commissions and fees — platform revenue, buyback discount, withdrawals"
locale: en
source: PRODUCT-PLAN.md §0.5; docs/product/rebuild/PRODUCT-DECISION-LOCK.md §6; src/lib/mock/withdrawals.ts
sourceTier: 1
status: ACTIVE
defaultProvenance: MIXED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
---

# Commissions & Fees

## Buy and sell commission

A platform commission applies to eligible buy and sell transactions. The exact current rate depends on transaction amount, so the app's current fee schedule should be used for the applicable rate.

A fee icon or fee pill can open the fee schedule.

## 7% Primary Offering buyback discount

During the Primary Offering, an eligible holder may sell shares back to the platform at a **7% discount** to the share price.

This is a **buyback discount**, not the normal trading commission and not a Secondary Market fee.

## 1% withdrawal fee

A withdrawal request has a **1% fee at request time**. The remaining amount is paid in **exactly four weekly installments**.

This is different from both the buy/sell commission and the 7% Primary Offering buyback discount.

## Easy way to tell them apart

**Trading commission:** applies to eligible buy/sell transactions.

**7% buyback discount:** applies to eligible sales back to the platform during Primary Offering.

**1% withdrawal fee:** applies when a withdrawal is requested.

These are three separate mechanisms.

## Other charges

If a charge is not documented in current product information, Fifi should not invent an amount and should direct the user to the current fee information in the app or support.
