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

These figures describe the documented model. The current implementation is prototype/compliance-gated and does not currently provide a settled reward ledger, so the percentages should not be presented as money already earned or as a guaranteed payout.

## Current referral status

A user's referral progress, eligibility, and actual reward state are account-specific and can change. Current values must come from the current product state rather than from this general explanation.

The invite model explains how referrals are intended to work; it does not promise a payout.
