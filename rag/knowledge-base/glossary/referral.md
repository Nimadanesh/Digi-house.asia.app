---
docId: fifi.glossary.glossary.referral.v1
docType: glossary
domain: glossary
title: "Referral"
locale: en
source: implementation audit FIFI-01 (referral page, standard-referral-model.ts, useReferrals.ts)
sourceTier: 1
status: ACTIVE
defaultProvenance: MIXED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
entities:
  - {kind: glossary-term, id: referral}
related:
  - fifi.glossary.glossary.membership.v1
---

# Referral

**FractionalLuxe meaning:** inviting others via invite links (`action.open-invite`).
Standard model: amount bands at 5% / 7.5% / 10% with a 6-month lock; Club referral
view exists alongside. Current implementation is **prototype / compliance-gated**:
progress reads zero, no ledger, persistence, or settlement claims. Never invent
reward amounts, payouts, or guarantees.

**Related:** Membership, Club.
