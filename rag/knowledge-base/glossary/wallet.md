---
docId: fifi.glossary.glossary.wallet.v1
docType: glossary
domain: glossary
title: "Wallet"
locale: en
source: implementation audit FIFI-01 (useTonConnect.ts, useEvmWallet.ts, WalletChooserSheet.tsx)
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
entities:
  - {kind: glossary-term, id: wallet}
related:
  - fifi.glossary.glossary.transaction.v1
---

# Wallet

**FractionalLuxe meaning:** your blockchain identity for buying and selling,
connected when you first transact. **Two rails:** TON (TonConnect: Tonkeeper,
MyTonWallet; testnet/mainnet) and EVM (Ethereum, BSC, Polygon, Arbitrum via
wagmi + WalletConnect). The chooser sheet lists wallets; others show Coming Soon.
TonConnect exposes no spendable balance display — the app never fakes one.

**Related:** Transaction, Buy flow.
