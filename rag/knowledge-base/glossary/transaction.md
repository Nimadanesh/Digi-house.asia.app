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

A **transaction** is a wallet-approved action, such as a purchase payment or an order-related operation, that is recorded with a status such as pending, successful, or failed.

When a transaction is on-chain, it can also have a transaction hash. Demonstration or simulated activity should not be treated as real blockchain history.

The current status of a particular transaction can change, so check the transaction or activity information shown in the app for the latest state.

**Related:** Wallet, Withdrawal, Open Orders.
