---
docId: fifi.business.product-doc.business-rules.v1
docType: product-doc
domain: business
title: "Locked business rules the chatbot must never violate"
locale: en
source: .agent/context/BUSINESS-RULES.md; docs/product/rebuild/PRODUCT-DECISION-LOCK.md
sourceTier: 1
status: ACTIVE
defaultProvenance: MIXED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
related:
  - fifi.economics.product-doc.economic-model.v1
  - fifi.product.product-doc.product-overview.v1
---

# Locked Business Rules

Rules every product surface — including this chatbot — must never violate. Extracted
from the repository's business-rules record (`.agent/context/BUSINESS-RULES.md`) and the
product decision lock (`docs/product/rebuild/PRODUCT-DECISION-LOCK.md`, Final PO
Decisions 2026-09-11). If code or copy conflicts with a rule, the conflict is reported —
never silently rewritten.

## Source-of-truth hierarchy (binding)

1. **Tier 1 — Listing identity authority** (Rental Escapes, the parent company and villa
   operator): property name, location,
   listing id, nightly rental rate (display + rate type), images, source URL. Never
   overwritten by fixtures or research.
2. **Tier 2 — Canonical economic layer**: the canonical research dataset
   (`ESTATE-24-DATA.json`) + the V1 financial model — valuations, ANR/modeled revenue,
   cost/tax model inputs, per-share economics, provenance.
3. **Tier 3 — Research dataset**: evidence only; never renders as verified fact.
4. **Tier 4 — Legacy/mock material**: non-authoritative; never user-facing source data
   where Tier 1/2 exists.

## Estate rules

- Exactly **24 property IDs** are defined by the shared manifest for the current catalog.
- Property IDs are **cross-repository contracts**: canonical form `re-<listingId>`.
  Never renamed or invented. Legacy `prop-*` identifiers are never canonical.
- Every Estate preserves its core identity: photos, name, location, nightly rental price.
- Observed, estimated, unknown, and model-assumption data must stay distinguishable.
- **Unknown data must remain unknown** rather than being filled with plausible numbers.
- Estates must be economically differentiated; identical economics are never introduced
  just to simplify UI.
- Ownership structure: some villas are owned by the parent company (Rental Escapes) —
  for these, fractional sales raise liquidity without selling the full villa. Other
  villas are under contractual agreements with owners who allow fractional sales on the
  platform while keeping operational control.

## Economic product rules

- **Ownership-backed positions** and **non-ownership yield positions** are fundamentally
  different products and must never be conflated.
- Ownership-backed economics may include operating income participation and potential
  asset/market-value appreciation.
- Non-ownership yield is a defined capital/return relationship **without** Estate
  ownership — never imply ownership for it.
- **Yield is an economic attribute, not the identity of an Estate.**

## Income model (locked; Final PO Decisions 2026-09-11)

- Profit is calculated AND communicated **MONTHLY, per locked share, on the full
  monthly rate**.
- Projected rental income is shown in scenarios plus an **Average scenario**; the
  **Average scenario is the basis for actual payout calculations**.
- To receive profit, the user **must lock their shares**. Unlocked shares
  earn nothing — this prevents selling on the secondary market while earning yield.
- New locks are **monthly-only**. Preserved historical weekly lock records exist and
  are labeled **Legacy**; their settlement math is preserved, not offered.
- **Withdrawals:** request at any time; a **1% fee** is charged at request time
  (neutral wording — the legal/accounting classification is reserved for advisers),
  and the **net is paid in exactly 4 weekly installments**. Installments are a payment
  schedule, never profit frequency.
- The legacy weekly display adjustment (−1pp) is a preserved settlement fact for
  historical records only. It is **NOT the withdrawal 1% fee** — the two share a
  number and nothing else, and must never be conflated.
- **Banned phrasing:** "weekly profit" / "weekly yield" as product claims, "weekly
  payouts" as a current option, guaranteed income or returns, presenting any
  non-Average scenario as the payout basis, presenting unlocked shares as earning
  income, presenting installments as profit frequency.

## Income / state vocabulary

- **Projected, accrued, expected, requested, scheduled, paid** are distinct concepts.
- Never present expected or projected values as paid historical income.
- Never present one scenario's figure as another's; only the Average scenario grounds payouts.
- Never present appreciation as rental income.
- Never invent liquidity, trades, ownership events, or payment events.

## Share economics

- The **$100 primary base price** per share is locked: base = approved valuation ÷ 100,
  communicated as "$100 base price per share at the primary offering". The secondary
  price is separate and demand-driven.
- Primary price, reference asset value per share, and secondary market price are three
  different numbers and are never blended.
- An NFT receipt is a **display-only collectible**; the holdings record is the user's
  economic position. Never call the NFT legal ownership, a deed, or property title.

## Market stages — Primary Offering vs Secondary Market

- **Primary Offering:** when a villa is first listed for fractional sale, shares are
  offered at a **fixed price** ($100 base) and the seller is **the platform itself**.
- **Primary buyback:** during the Primary Offering stage, a user who wants to sell can
  sell shares back **to the platform at a 7% discount** (share price − 7%).
- **Secondary Market:** after all primary shares of a villa are sold, the villa moves to
  the Secondary Market. Price is determined by **supply and demand** (order book / user
  orders); users place orders to buy from or sell to **other users**.
- **Platform commissions:** the platform takes a commission on **every** buy and sell
  transaction (primary and secondary). Commissions are a main platform revenue source.
  Tiers are amount-based per transaction; the exact current table lives in
  `PRODUCT-PLAN.md` §0.5 (served via `GET /v1/fees`) — never quote commission rates
  from memory.
- Never present the 7% buyback discount as a fee on secondary trades; it applies only
  to platform buybacks during the Primary Offering stage.

## Financial & data safety

- Money is represented in integer minor units (USD cents) per repository convention;
  chain-native units follow each supported chain's convention where required (multi-chain
  platform — never single-chain-only wording).
- Never change payment, settlement, ownership, or transaction semantics as a side effect.
- New financial calculations require explicit inputs, deterministic rounding, and
  boundary tests.
- No personal data in public endpoints; never expose private orderbook depth or writes.
- Never commit secrets, tokens, production credentials, or private keys.

## Decision discipline

- If an answer requires an unresolved economic rule, say the decision is pending rather
  than inventing one.
- Do not silently revive legacy business rules because they exist in old code or docs
  (this includes the retired weekly-payout option).
- No UI, doc, or answer may claim a confirmed partnership, commission, revenue-share,
  integration, or endorsement (white-label-ready architecture, no implied partnership).
