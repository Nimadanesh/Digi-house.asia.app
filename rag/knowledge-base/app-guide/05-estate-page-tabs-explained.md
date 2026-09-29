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

The top area can show the **photo gallery** (villa images), **villa name**, **location**, **share price**, **total-share information**, **funding progress**, **estate value**, and key statistics such as monthly income, projected annual income, average nightly rate, and estimated growth.

**Buy** starts the purchase flow when available. **Sell** starts the sale flow when available.

## Estate / Overview

This tab answers **“What is this villa?”**

It can contain the introduction, highlights, property type, size, bedrooms, bathrooms, guest capacity, amenities, location information, sourced transfer information, and a link to the source listing.

If a fact is unavailable, the page indicates that instead of inventing a value.

## Income

This tab answers **“How is rental income modeled?”**

It can show the rental-rate basis, projected scenarios, Average scenario, modeled nights, whole-estate gross revenue, per-share income, modeled costs, excluded guest-paid charges, distributable income, owner share, and an estimated owner-side tax amount where shown.

### ANR

ANR means **Average Nightly Rate**: the average of the listed full-buyout nightly rates used by the product model. ANR is not ADR.

Occupancy and ADR are currently unknown for the canonical villas and should not be guessed.

## Ownership

This tab explains what the share represents and information relevant to exit and liquidity.

It can show estate value, reference value per share, total shares, ownership per share, estimated growth, market stage, exit/liquidity information, and a position preview with quantity, investment amount, and projected monthly income.

Estimated growth is not rental income and is not an annual return.

## Earn

This tab is where you lock shares into the earning program.

It can show lock controls, locked-share status, accrued income, and unlock controls. New locks are monthly-only. Historical weekly records, when shown, are labeled Legacy.

## Details

This is the factual record for the villa. It can include sourced operator information, legal and structural notes, valuation date and method, available documents, and distribution/tax disclosures.

Historical performance should only appear when real historical data exists; simulated values must not be presented as historical performance.
