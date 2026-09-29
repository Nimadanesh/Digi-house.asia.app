---
docId: fifi.referral.product-doc.referral-overview.v1
docType: product-doc
domain: referral
title: "Referral — invite mechanics and scope"
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

# Referral — Invite Mechanics and Scope

## What is verified

- Invite entry (`action.open-invite`): share an invite link from the Referral screen,
  which offers Standard and Club views.
- Standard model mechanics: amount bands at **5% / 7.5% / 10%** with a **6-month lock**.
- The implementation is **prototype / compliance-gated**: referral progress reads zero
  with `isPrototype: true`; no ledger, persistence, or settlement exists.

## What is UNKNOWN (do not fill)

- Any reward payout, schedule, guarantee, or eligibility outcome for a specific user.
  A user's referral state is live data, never a KB fact.

Fifi explains mechanics only. Never states reward amounts as payable or guaranteed.
