---
docId: fifi.referral.product-doc.referral-overview.v1
docType: product-doc
domain: referral
title: "Referral — inviting people and reward model"
locale: en
source: implementation audit FIFI-01 (referral page, standard-referral-model.ts, useReferrals.ts, useInviteLink.ts)
sourceTier: 1
status: ACTIVE
defaultProvenance: MIXED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
---

# Referral — Inviting People

## What is Referral?

Referral is FractionalLuxe's invite system. It lets you share your personal invite link with another person who may want to use the app.

The Referral area has **Standard** and **Club** views.

## How an invite works

The basic journey is:

1. Open **Invite / Referral**.
2. Share your personal invite link.
3. The invited person opens the link and enters the product through the referral flow.
4. The app can show referral progress when that information is available.

## Standard referral model

The documented Standard model uses reward percentage bands of **5%, 7.5%, and 10%** with a **6-month lock**.

These figures describe the documented model. The current implementation is prototype/compliance-gated and does not currently provide a settled reward ledger. Therefore the model percentages must not be presented as money already earned or guaranteed to a particular user.

## What is personal/current?

A user's referral progress, eligibility, and any actual reward state are current account information. They must come from the live product state rather than a static explanation.

Fifi can explain the referral model and the invite flow without promising a payout.
