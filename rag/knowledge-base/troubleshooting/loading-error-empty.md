---
docId: fifi.troubleshooting.troubleshooting.loading-error-empty.v1
docType: troubleshooting
domain: troubleshooting
title: "Loading, error, and empty states"
locale: en
source: implementation audit FIFI-01 (skeletons, ErrorState, EmptyState per screen)
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
---

# Loading, error, and empty states

**Symptom:** a screen shows a skeleton, an error card, or an empty state.

**Verified guidance:**
- Every screen ships loaded / loading-skeleton / empty / error states by design.
  Skeletons match final shape; an empty Portfolio/Earnings with a Marketplace pointer
  is the correct first-run experience, not a failure.
- On an error state, retry the action once; if it persists, use the support channel
  with the visible error text. Fifi cannot see your screen — describe what the error
  card says.
- CSV export and similar actions surface errors via toast rather than failing
  silently; a toast naming the failure is the expected behavior.

Specific error strings and their fixes are UNKNOWN unless documented in-app.
