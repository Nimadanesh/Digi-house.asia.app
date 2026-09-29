---
docId: fifi.product.app-guide.app-overview-and-navigation.v1
docType: app-guide
domain: product
title: "App overview and navigation — sections, tabs, user journey"
locale: en
source: implementation audit FIFI-01 (src/app routes, PropertyDetail, PropertyTabs)
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
related:
  - fifi.guide.product-doc.how-to-use-the-app.v1
---

# App Overview & Navigation

## What the platform is

FractionalLuxe is the fractional-ownership branch of the parent company Rental Escapes.
It runs on its own website and app across multiple blockchains (TON + EVM). Users buy fractional
shares of luxury villas, lock shares to earn monthly rental profit, and trade shares on the
Secondary Market.

## Main sections

| Section | Action | What you find there |
|---|---|---|
| **Home** | `action.open-home` | Balance / portfolio value, next payout, property cards. Empty state points to the Marketplace. |
| **Marketplace** | `action.open-marketplace` | The estates as cards — price, funding state, projected income per share. Search and filters included. |
| **Property detail** | `action.open-estate {propertyId}` | One villa at `/property/[id]`: photos, price, funding bar, value, stats, and five tabs. Buy and Sell entry points live here. |
| **Earnings** | `action.open-earnings` | Income screen: received totals (paid only), accrued income, per-estate income history. |
| **Portfolio** | `action.open-portfolio` | Holdings, allocation, and open orders (including cancel before fill). |
| **Settings** | `action.open-settings` | Reached from the header (not a tab): wallet, language, theme, about/legal. |
| **Club** | `action.open-club` | Membership tiers and benefits (prototype scope). |
| **Referral** | `action.open-invite` | Invite flows (prototype scope). |

## How to navigate

- The bottom tab bar switches between Home, Marketplace, Earnings, and Portfolio.
- Tapping a Marketplace card (or a Home property card) opens that villa's Property page.
- Tapping back returns within the current tab; each tab keeps its own place.
- Buy and Sell actions always start from the Property page of the villa concerned.

## High-level user journey

1. **Discover:** browse the Marketplace, open a villa, read its tabs.
2. **Buy:** choose a quantity, review total cost and projected income, confirm, approve in the wallet.
3. **Lock to earn:** lock shares (Earn tab) so monthly profit (Average scenario) accrues to them.
4. **Track:** watch Earnings (received + accrued) and Portfolio (holdings + orders).
5. **Withdraw or exit:** request withdrawal (1% fee, net in 4 weekly installments), or unlock then sell — back to the platform during Primary Offering (7% discount), or to other users on the Secondary Market.
