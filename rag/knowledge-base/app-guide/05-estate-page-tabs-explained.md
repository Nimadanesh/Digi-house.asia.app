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

Every villa has a Property page with a common top area followed by five tabs.

## The top area

The top section can show:
- **Photo gallery** — browse the villa images.
- **Villa name** — identifies the estate.
- **Location** — shows where the villa is located.
- **Share price** — the current displayed price for a share.
- **Total-share information** — explains how a share relates to the estate's total shares.
- **Funding progress** — shows progress through the current offering.
- **Estate value** — the value used by the product for the estate.
- **Buy** — starts the purchase flow when buying is available.
- Key statistics such as monthly income, projected annual income, average nightly rate, and estimated growth.

## Estate / Overview tab

This tab answers: **What is this villa?**

It can include:
- a short introduction;
- key highlights;
- property type;
- size;
- bedrooms;
- bathrooms;
- guest capacity;
- amenities;
- location information;
- transfer information when sourced;
- a link to the source listing.

When a fact is not available, the page indicates that it is pending rather than inventing a value.

## Income tab

This tab answers: **How is rental income modeled for this villa?**

It can include:
- rental-rate basis;
- projected income scenarios;
- the Average scenario used as the payout basis;
- modeled nights;
- whole-estate gross revenue;
- per-share income for year and month;
- modeled costs;
- charges that are not deducted from your income;
- distributable income and owner share;
- an estimated owner-side tax amount where shown.

Income figures in this section are presented as projected figures unless they are explicitly identified as something else.

### ANR

ANR means **Average Nightly Rate**. It is the average of the listed full-buyout nightly rates used by the product's model.

ANR is not the same as ADR.

### Occupancy and ADR

Occupancy and ADR are currently unknown for the villas in the canonical dataset. The product should not invent these values.

## Ownership tab

This tab answers: **What am I buying and what could affect my exit?**

It can include:
- estate value;
- reference value per share;
- total shares;
- ownership represented by a share;
- estimated growth information;
- market stage;
- exit and liquidity information;
- a position preview showing quantity, investment amount, and projected monthly income.

Growth information is an estimate and is not rental income or an annual return.

## Earn tab

This tab answers: **How do I put shares into the earning program?**

It can show:
- lock controls;
- locked-share status;
- accrued income;
- unlock controls.

New locks are monthly-only. Historical weekly records, when shown, are labeled Legacy.

## Details tab

This tab is the factual record for the villa.

It can include:
- operator information where sourced;
- legal and structural notes;
- valuation date and method;
- available documents;
- distribution and tax disclosures.

Historical performance should only be presented when real historical data exists. Simulated values must not be presented as historical performance.

