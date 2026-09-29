---
docId: fifi.economics.product-doc.economic-model.v1
docType: product-doc
domain: economics
title: "How the economic model works — shares, valuation, income, costs, projections"
locale: en
source: docs/product/rebuild/ECONOMIC-PHILOSOPHY-PRODUCT-TRUTH.md; docs/product/rebuild/ESTATE-ECONOMICS-DESIGN-CONTRACT.md; docs/product/rebuild/PRODUCT-DECISION-LOCK.md
sourceTier: 1
status: ACTIVE
defaultProvenance: MIXED
requiredDisclaimers:
  - "Projected figures only — not paid income."
  - "Tax figures are estimates; seek personal tax advice."
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
related:
  - fifi.business.product-doc.business-rules.v1
---

# Economic Model — Shares, Valuation, Income, Costs, Projections

How share pricing, valuation, rental income, costs, and projections work. Every figure
label here is contractual. *Projected figures only — never paid income.*

## The one calculation authority

The current model is **Financial Model V1** — a single canonical engine. Components and
answers never recompute or re-derive numbers; every figure traces to the model and its
documented inputs (per-estate inputs come from the canonical research dataset,
`ESTATE-24-DATA.json`).

## Share pricing — three different numbers

Share economics distinguish three values that must never be collapsed into one
"share value":

| Term | Meaning |
|---|---|
| **Primary price** | Price offered by the platform for newly offered shares. Locked model: **$100 base price per share at the primary offering** (base = approved valuation ÷ 100). |
| **Reference asset value per share** | Proportional value derived from the estate valuation ÷ total shares. A derived reference, not a market price. |
| **Secondary market price** | Actual/listed market price for existing shares — separate and demand-driven. |

Related definitions:

- `ownershipPerShare = 1 / totalShares` (one share ≈ 1/N of the estate).
- Ownership per share is shown exactly (no rounding artifacts).

## Primary vs Secondary pricing mechanics

- **Primary Offering:** fixed primary price ($100 base); the platform itself is the
  seller. During this stage a user may sell shares back to the platform at a
  **7% discount** (share price − 7%).
- **Secondary Market:** once all primary shares are sold, trading moves to the
  Secondary Market, where price is set by **supply and demand** (order book / user
  orders between users).
- The platform takes a commission on **every** buy and sell transaction; exact tiers
  live in `PRODUCT-PLAN.md` §0.5 (served via `GET /v1/fees`) — never quote commission
  rates from memory.

## Valuation — conservative value plus growth range, always labeled

- Villa valuations are calculated from the **average of comparable villas in the same
  region** and are intentionally set on the **conservative (lower) side**.
- Each villa has a price range. The current (conservative) valuation is the official
  figure; the **upper end of the range is treated as "Est. Growth"** — the difference
  between current valuation and the upper end is shown to users as growth potential.
- The valuation's provenance is always stated (Approved = official; Research = estimate
  only). A **CONFLICTED** status (sources disagree) or **QUARANTINED** status (blocked for
  quality) means there is no usable official number: treat the official valuation as
  Unknown, say so, and never quote a Research estimate as the official figure.
- Growth potential is **estimated, non-annualized, with its source** — never a per-year
  forecast, never rental income.

## Rental income — the ANR basis and modeled revenue

- **ANR (Average Nightly Rate)** = the mean of the distinct **full-buyout listed rates**
  for the villa (as listed by the source). ANR is the rental basis — **never ADR**.
- **ADR** (revenue ÷ nights actually sold) cannot exist in answers: occupancy is
  **UNKNOWN for all 24 estates** and is never invented.
- Revenue is modeled from **modeled nights per scenario**, not from an occupancy claim.
- The rental basis, its derivation method, and its provenance are always disclosed.

## Costs — the V1 model lines

The V1 model subtracts three cost lines from gross revenue (each labeled a **model
assumption**, with basis shown):

- **Agency / Rental Escapes / OTA:** 5% of gross revenue.
- **Operator operating costs:** 7.5% of gross revenue.
- **Repair / insurance / maintenance reserve:** 1.5% of the property value (honest
  UNKNOWN when the reserve currency differs from the revenue currency — never
  FX-converted).

Per-villa values for these assumptions live in each villa document
("Cost-structure defaults"). Guest-paid charges — e.g., **Green Tax, damage waiver,
tourism taxes** — are **listed but not deducted** from investor income; they are shown
with a "Not deducted from your income" label.

## Allocation — who gets what

- Net (post-cost, post-owner-side-tax) distributable income is allocated
  **75% owner side / 25% operator side** (locked V1 allocation).
- Owner-side tax is shown as an **estimate with its assumption stated** (or honest
  unknown where no rate applies/is known) — with the disclaimer to seek personal tax
  advice. *Not tax advice.*
- Per-share figures = the owner-side pool ÷ total shares (annual; ÷ 12 for monthly).
  Profit is shown per locked share as a **MONTHLY amount on the full monthly rate**.
  Shares must be locked to receive it — unlocked shares earn nothing.

## Scenarios — ranges, not fake precision

Income is presented as **scenarios plus an Average scenario** built on modeled
nights, never as a single precise promise. The **Average scenario is the basis for
actual payout calculations** and must equal the headline "Monthly Income" / "Proj. / Year"
figures. Scenario inputs are exposed so the "why" behind a revenue number is always
explainable. Never present a non-Average scenario as the payout basis.

## Projected vs Accrued vs Paid — never mixed

Every investor amount has an explicit state; they are different numbers and are never
added together or substituted for each other:

| State | Meaning | Vocabulary rule |
|---|---|---|
| **Projected** | Forward-looking calculation from documented scenarios/model | Always labeled "Projected"; never shown as received; only the Average scenario grounds payouts |
| **Accrued** | Earned on locked shares (monthly profit per share), not yet distributed | Labeled "Accrued"; distinct from paid; unlocked shares never accrue |
| **Paid** | Actually received (historical) | The only state allowed in "received" totals |

- Never add projected or accrued amounts into a "Paid" balance.
- Never present appreciation as rental income.
- Investment plans are projections inside the locked **80%–125% target-profit envelope**;
  projected plan outcomes are never displayed as paid income.
- In the current build, paid entries are **demo data explicitly labeled "simulated"** —
  disclosed as such, never presented as history.

## Withdrawals

Withdrawals are requested at any time. A **1% fee** is charged at request time
(neutral wording; classification reserved for advisers) and the **net is paid in
exactly 4 weekly installments** — a payment schedule, never profit frequency.
Preserved historical weekly lock records are labeled Legacy; the legacy −1pp weekly
display adjustment is not the withdrawal fee.

## Data provenance states

Every displayed economic number belongs to one of: **OBSERVED, ESTIMATED,
DERIVED, PROJECTED, UNKNOWN, CONFLICTED**. Unknown must be displayed as unavailable —
never replaced with a plausible-looking number. Provenance labels per villa live in the
villa documents ("Valuation & data provenance", "Data quality & open conflicts").
