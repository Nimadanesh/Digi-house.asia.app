---
docId: fifi.glossary.glossary.transaction.v1
docType: glossary
domain: glossary
title: "Transaction"
locale: en
source: implementation audit FIFI-01 (sendTx.ts, http-repos.ts, mock settlement)
sourceTier: 1
status: ACTIVE
defaultProvenance: MIXED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
entities:
  - {kind: glossary-term, id: transaction}
related:
  - fifi.glossary.glossary.wallet.v1
---

# Transaction

**FractionalLuxe meaning:** a wallet-approved action (buy payment, order placement)
recorded with a status (pending / success / failed) and, when on-chain, a real
transaction hash derived from the signed payload. Mock-only paths use `simulated:`
hashes that are never presented as chain history. Any transaction's current status
is **live data**, never a KB fact.

**Related:** Wallet, Withdrawal, Open Orders.
