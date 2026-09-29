---
docId: fifi.troubleshooting.troubleshooting.navigation-problems.v1
docType: troubleshooting
domain: troubleshooting
title: "Navigation problems"
locale: en
source: implementation audit FIFI-01 (tab bar, deep-link.ts, back-stack behavior)
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
---

# Navigation problems

**Symptom:** can't find a screen, or a link opened the wrong place.

**Verified guidance:**
- The bottom tab bar holds Home, Marketplace, Earnings, Portfolio. Everything else
  (Settings, Club, Referral, Card, property pages) opens from headers, cards, or links.
- A villa link from the website deep-links to `/property/[id]`; unknown or legacy
  (`prop_*`) parameters are rejected and fall back to Home — that is expected.
- Back behavior keeps each tab's place; an open bottom sheet owns the back press
  (the sheet closes first). A pending wallet-disconnect confirmation cannot be
  dismissed by Back — complete or cancel it explicitly.

Deep-link usernames and bot configuration are operator-side and UNKNOWN to Fifi.
