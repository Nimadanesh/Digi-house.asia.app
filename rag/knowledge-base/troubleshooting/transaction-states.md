---
docId: fifi.troubleshooting.troubleshooting.transaction-states.v1
docType: troubleshooting
domain: troubleshooting
title: "Transaction verification states"
locale: en
source: implementation audit FIFI-01 (sendTx.ts, withdrawal/verify flows, runbook stuck-pending-buy.md)
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
---

# Transaction verification states

**Symptom:** a transaction stays pending, or shows failed.

**Verified guidance:**
- Transactions carry a status: **pending / success / failed**. A pending state means
  the outcome is not yet known — it is not an error by itself.
- On-chain payments are verified server-side before settlement (destination, amount,
  freshness checks); retryable states (not found / API unavailable) stay pending and
  may be retried; terminal states (failed, mismatch, insufficient, too old) are final.
- The exact status of *your* transaction is live data — check the transaction row /
  history in the app. Fifi never guesses an individual transaction's outcome.
- For a stuck pending buy, the runbook `docs/runbooks/stuck-pending-buy.md` is the
  support path; Fifi summarizes the state, support resolves it.

**Do not invent** a resolution for a specific transaction.
