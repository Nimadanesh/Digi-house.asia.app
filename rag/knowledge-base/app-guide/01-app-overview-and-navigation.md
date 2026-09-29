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

FractionalLuxe is arranged around a simple journey: discover a villa, understand it, buy shares, manage those shares, and follow income and activity.

## Home

**Home** is your starting point and a quick summary of your account.

Depending on your current account state, the screen can show:
- **Portfolio value** — the current value presented for your holdings;
- **Balance information** — available account-level amounts shown by the app;
- **Next payout** — payout information when there is a scheduled or available value to show;
- **Property cards** — shortcuts into individual villa pages;
- **Invest** — entry into the investment/marketplace journey;
- **Invite** — entry into the referral experience;
- **Club** — entry into private membership.

A property card is more than a picture: it is a shortcut. Tapping the card opens that villa's full Property page.

## Marketplace

**Marketplace** is the discovery screen for estates available through the product.

A property card can contain:
- **Villa image** — the visual preview;
- **Name and location** — identifies the estate;
- **Share price** — the current displayed price for a share;
- **Funding / offering status** — shows where the offering currently stands;
- **Projected income** — a forward-looking model figure when available;
- **Key property facts** — useful summary information.

Search and filters narrow the list. The card is designed for scanning; the Property page is where you investigate the villa in depth.

## Property page

The **Property page** is the detailed workspace for one villa.

The upper section can include:
- a **photo gallery** for browsing villa images;
- **name and location** for identifying the estate;
- **share price** and share information;
- a **funding bar** showing offering progress;
- **estate value** and key metrics;
- **Buy**, when purchasing is available;
- **Sell**, when the relevant selling flow is available.

The five tabs below divide the information so each question has a clear home:

1. **Estate / Overview** — “What is this villa?”
2. **Income** — “How is rental income modeled?”
3. **Ownership** — “What does my share represent?”
4. **Earn** — “How do I lock shares and follow earnings?”
5. **Details** — “What supporting facts and documents are available?”

## Earnings

**Earnings** is your income view.

It can separate:
- **Paid** — income already distributed;
- **Accrued** — income earned on locked shares but not yet paid;
- **Income by estate** — a way to see where the displayed income belongs.

This separation matters: accrued income is not the same as money already received.

## Portfolio

**Portfolio** is your ownership and activity workspace.

It can show:
- **Holdings** — what you own;
- **Allocation** — how your holdings are distributed across estates;
- **Quantity and value** — how many shares you hold and their displayed value;
- **Gain / loss** — where the product has enough information to calculate it;
- **Open Orders** — orders that have not filled yet.

An open order is not the same as a completed trade. Where cancellation is available, an eligible open order can be cancelled before it fills.

## Settings

**Settings** opens from the header rather than the bottom navigation.

It contains app and account controls such as:
- **Wallet**;
- **Language**;
- **Theme**;
- **About and legal information**.

These controls affect how you use or understand the app; Settings is not another marketplace or portfolio section.

## Club and Invite

**Club** is the private membership area. It presents membership levels and the benefits associated with them.

**Invite** is the referral area. It gives you access to the app's invitation flow and your referral experience.

## Bottom navigation

The main bottom bar switches between:
- **Home**
- **Marketplace**
- **Earnings**
- **Portfolio**

The bottom bar is for the app's four primary workspaces. **Settings, Club, and Invite are reached through other entry points.**

## Typical journey

**Discover → Review a villa → Buy shares → Lock eligible shares if you want to earn → Follow Portfolio and Earnings → Withdraw or sell when eligible.**

If you point Fifi to any visible element — even a small icon, label, number, badge, button, tab, or status — it should explain what the element means, why it is there, and what action it leads to when that behavior is documented.
