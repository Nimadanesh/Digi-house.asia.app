# FractionalLuxe Business Rules

This file records rules that agents must treat as product constraints. If code conflicts with a rule, report the conflict; do not silently rewrite the business logic.

## Locked rules
- Exactly 24 property IDs are defined by the shared manifest.
- Property IDs are cross-repository contracts and must not be renamed or invented.
- Rental income accrues monthly.
- Withdrawal is user-requested, carries a 1% fee, and is paid in 4 weekly installments.
- The app must preserve simulated-data disclosures where applicable.
- No fabricated trades, earnings, ownership, or payment events that could be mistaken for real activity.

## Financial safety
- Money is represented in integer minor units according to existing repository conventions.
- TON values use nanoTON where the repository requires chain-native units.
- Never change payment, settlement, ownership, or transaction semantics as a side effect of UI or refactoring work.
- Any new financial calculation requires explicit inputs, deterministic rounding, and tests for boundaries.

## State safety
- State transitions must be explicit and reversible only when the product specification says they are reversible.
- Funding/resale/holding/order states must follow the documented product contracts.
- Unknown states must fail safely rather than being guessed.

## Data safety
- No personal data in public read endpoints.
- Public endpoints must not expose private orderbook depth or writes unless explicitly specified.
- Never commit secrets, tokens, production credentials, or private keys.
