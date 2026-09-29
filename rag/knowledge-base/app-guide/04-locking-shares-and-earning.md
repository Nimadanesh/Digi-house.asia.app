---
docId: fifi.product.app-guide.locking-shares-and-earning.v1
docType: app-guide
domain: product
title: "Locking shares and earning profit — monthly, lock-to-earn"
locale: en
source: docs/product/rebuild/PRODUCT-DECISION-LOCK.md §6; src/lib/property-yield.ts; src/lib/mock/withdrawals.ts
sourceTier: 1
status: ACTIVE
defaultProvenance: MIXED
requiredDisclaimers:
  - "Projected figures only."
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
related:
  - fifi.economics.product-doc.economic-model.v1
---

# Locking Shares & Earning

## Why locking is required

- Only **locked** shares earn rental profit. This prevents selling on the Secondary
  Market while earning yield.
- Locked shares are **not sellable** until unlocked.

## How to lock shares

1. Open the Property page of a villa you hold (`action.open-estate`).
2. Use the lock entry in the Earn tab and choose the quantity to lock.
3. Confirm. Accrual starts from locking; the holding shows its locked state.
   New locks are **monthly-only**.

## Monthly profit

- Profit is calculated and communicated as a **MONTHLY amount per locked share, on
  the full monthly rate**, grounded in the **Average scenario**.
- Projected figures are labeled **Projected**; they are never paid income.
- Preserved historical weekly lock records exist and are labeled **Legacy** where
  shown. Their settlement math is preserved — weekly is not offered for new locks.

## What happens if shares stay unlocked

- Unlocked shares earn **nothing** — no accrual, no payouts.
- Unlocked shares are the sellable ones (Secondary Market orders, or platform buyback
  at 7% discount during Primary Offering).

## Withdrawals

- Request withdrawal at any time. A **1% fee** is charged at request time (neutral
  wording; legal/accounting classification reserved for advisers) and the net is
  paid in **exactly 4 weekly installments** — a payment schedule, never profit
  frequency.
- The legacy weekly display adjustment (−1pp, preserved settlement math for
  historical records only) is **not** the withdrawal fee.

## How to unlock

- Request unlock from the Earn tab. Yield stops accruing at the request,
  and the shares become sellable after a short processing period (see the app for the
  current timing).
- Unlock before placing any sell order for locked shares.
