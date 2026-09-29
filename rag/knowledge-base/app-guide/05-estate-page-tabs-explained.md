---
docId: fifi.product.app-guide.estate-page-tabs.v1
docType: app-guide
domain: product
title: "Property page tabs explained — Estate, Income, Ownership, Earn, Details"
locale: en
source: implementation audit FIFI-01 (PropertyDetail.tsx, PropertyTabs.tsx, PropertyMetricsGrid.tsx)
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
related:
  - fifi.product.product-doc.estate-page-structure.v1
---

# Property Page Tabs Explained

Above the tabs, every villa page (`/property/[id]`) shows the same fixed header: photo gallery, villa
name, location, current share price with total shares ("1 share ≈ 1/N of the estate"),
funding progress bar, estate value, the Buy button, and key stats (Monthly income,
Proj. / year, Avg. nightly rate, Est. growth).

## Estate (labeled "Overview")

- The "desire" tab: why this specific estate — short description plus key highlights.
- Key specs in clean rows (type, size, guests/bedrooms/bathrooms). Missing data shows
  as pending, never guessed.
- Amenities grid and location section (area description and transfer details only where
  sourced). External reserve link to the source listing lives here.

## Income

- The "conviction" tab: how the estate makes money and what a share earns.
- **Rental basis:** ANR (Average Nightly Rate — mean of full-buyout listed rates, never
  ADR) with its derivation; occupancy and ADR are Unknown for all villas.
- **Projected revenue scenarios** plus the **Average (payout basis)**. Each card shows
  modeled nights, whole-villa gross revenue, and per-share income (year + month).
- **Modeled costs** (expandable rows with basis and amount) and **excluded charges**
  (guest-paid items labeled "Not deducted from your income").
- **Net economics** summary: distributable income, 75% owner share, owner-side tax
  estimate (*not tax advice*), and per-share monthly net income. Projected vocabulary only.

## Ownership

- The "decision" tab: valuation & shares grid (estate value, reference value per
  share, total shares, exact ownership per share).
- **Growth potential:** upper end of the valuation range shown as Est. Growth —
  estimated, never annualized, never rental income.
- **Exit & liquidity:** market stage status, secondary-market path, and the rule that
  locked shares must be unlocked before selling.
- **Position preview** ("if you invest today"): share stepper, investment amount,
  projected monthly income for that quantity, always footered "Projected figures only".

## Earn

- The yield tab: lock shares here to start earning (monthly-only for new locks);
  locked state and accrued income shown per holding.
- Preserved historical weekly records are labeled Legacy.
- Unlock entry lives here too — unlocked shares stop earning and become sellable.

## Details

- The factual record: operator facts (where sourced), legal & structure notes,
  valuation date and method, available documents list, distribution & tax disclosure
  ("not tax advice").
- **Historical performance renders only when real data exists** — none exists in the
  current dataset, so simulated data must never pose as history.
