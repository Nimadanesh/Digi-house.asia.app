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

## Platform commissions on buy/sell

- Commissions on buy and sell transactions are one of the platform's **main revenue
  sources**.
- A commission applies to **every** buy and sell transaction, in both the Primary
  Offering and the Secondary Market.
- 9-tier amount-based table per transaction plus a flat 7% instant-sell note. The exact
  current table lives in `PRODUCT-PLAN.md` §0.5 (served via `GET /v1/fees`) — never
  quote commission rates from memory.
- A fee disclosure is available in the app (fee icon / pill opens the fee schedule
  sheet).

## 7% primary buyback discount — clarification

- During the **Primary Offering stage only**, a user may sell shares back **to the
  platform at a 7% discount** (share price − 7%). Returned shares go back into primary
  supply.
- This 7% is a **buyback discount**, not a commission and not a secondary-market fee.
  Never present it as applying to Secondary Market trades between users.

## Withdrawal 1% fee — clarification

- Withdrawals carry a **1% fee charged at request time** (neutral wording; the
  legal/accounting classification is reserved for advisers), with the net paid in
  **exactly 4 weekly installments**.
- This 1% is **not** a commission, **not** the 7% buyback discount, and **not** the
  legacy weekly display adjustment (−1pp, preserved settlement math for historical
  records only). The three numbers must never be conflated.

## Other fees

- No other fee is documented in the current knowledge base. If a charge is not stated
  in a retrieved document, treat it as Unknown and point the user to the app or
  support — never invent fees.
