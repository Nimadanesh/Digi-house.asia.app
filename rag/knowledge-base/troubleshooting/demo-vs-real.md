---
docId: fifi.troubleshooting.troubleshooting.demo-vs-real.v1
docType: troubleshooting
domain: troubleshooting
title: "Demo data vs real data"
locale: en
source: docs/product/rebuild/PRODUCT-DECISION-LOCK.md §2E; implementation audit FIFI-01 (DemoModeBadge, simulated labels)
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
---

# Demo data vs real data

**Symptom:** uncertainty about whether a figure is real.

**Verified guidance:**
- The current build is a company-review prototype with a discreet **"Demo mode"**
  pill. Paid rows with synthetic hashes carry **"simulated"** badges; price history is
  marked "(simulated)". This is honest demo data for showing the complete loop.
- Rule: anything labeled Demo/simulated is illustrative, never history. Anything
  unlabeled (property facts, calculations, market/ownership/income states) is truthful
  to its configured source.
- No fake users, no trades-as-real, no payouts-as-history, no partnerships, no
  performance history — if something looks like one, report it; do not trust it.

When in doubt, ask what the badge next to the figure says.
