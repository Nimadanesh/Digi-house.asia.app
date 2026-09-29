---
docId: fifi.troubleshooting.troubleshooting.wallet-connection.v1
docType: troubleshooting
domain: troubleshooting
title: "Wallet connection issues"
locale: en
source: implementation audit FIFI-01 (WalletChooserSheet.tsx, useTonConnect.ts, useEvmWallet.ts)
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
---

# Wallet connection issues

**Symptom:** wallet won't connect, or the wanted wallet isn't listed.

**Verified guidance:**
- Connection happens at first transaction via the wallet chooser: TON wallets
  connect through TonConnect; EVM wallets (Ethereum, BSC, Polygon, Arbitrum) through
  the EVM connector (WalletConnect pairing requires the project ID configured —
  otherwise EVM pairing is unavailable and the UI says so).
- Wallets not on either rail show **Coming Soon** — that is expected, not a bug.
- EVM pairing and QR behavior depend on the user's wallet app; Fifi cannot diagnose
  third-party wallet apps. Point to support if the chooser itself fails to open.

**Do not invent** fixes for third-party wallet internals. Unverified causes stay
UNKNOWN.
