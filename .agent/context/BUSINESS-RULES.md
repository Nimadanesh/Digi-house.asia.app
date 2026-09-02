# FractionalLuxe Business Rules

This file records rules that agents must treat as product constraints. If code conflicts with a rule, report the conflict; do not silently rewrite the business logic.

## Rebuild authority
- `docs/product/rebuild/ECONOMIC-PHILOSOPHY-PRODUCT-TRUTH.md` is the economic source of truth for the rebuild.
- Existing UI, copy, calculations, and legacy program assumptions are not authoritative when they conflict with the rebuild source of truth.
- During the current company-review build, legal/regulatory/compliance concerns must not be used to reduce or degrade the intended product experience. Those constraints are outside current product-design scope.
- Factual/data truth remains mandatory: do not invent property facts, historical performance, valuations, occupancy, revenue, trades, or distributions.

## Estate rules
- Exactly 24 property IDs are defined by the shared manifest/report for the current rebuild catalog.
- Property IDs are cross-repository contracts and must not be renamed or invented.
- Every Estate must preserve its core property identity: photos, name, location, and nightly rental price.
- Observed/sourced data, estimated data, unknown data, and product-model assumptions must remain distinguishable.
- Unknown data must remain unknown rather than being filled with plausible-looking numbers.

## Economic product rules
- Ownership-backed positions and non-ownership yield positions are fundamentally different products and must never be conflated.
- Ownership-backed economics may include operating income participation and potential asset/market-value appreciation.
- Non-ownership yield is a defined capital/return relationship without Estate ownership.
- Yield is an economic attribute, not the identity of an Estate.
- Estates must have meaningful economic differentiation; identical economics must not be introduced merely to simplify UI implementation.
- The exact distribution, offering, unit-pricing, secondary-market, and yield-variation mechanics remain explicit product decisions until locked.

## Income / state vocabulary
- Paid, accrued, expected, projected, rental income, yield, and appreciation are distinct concepts.
- Never present expected or projected values as paid historical income.
- Never present appreciation as rental income.
- Never invent liquidity, trades, ownership events, or payment events.

## Financial safety
- Money is represented in integer minor units according to existing repository conventions.
- TON values use nanoTON where the repository requires chain-native units.
- Never change payment, settlement, ownership, or transaction semantics as a side effect of UI or refactoring work.
- Any new financial calculation requires explicit inputs, deterministic rounding, and tests for boundaries.

## State safety
- State transitions must be explicit and reversible only when the product specification says they are reversible.
- Funding/resale/holding/order states must follow the current documented product contracts.
- Unknown states must fail safely rather than being guessed.

## Data safety
- No personal data in public read endpoints.
- Public endpoints must not expose private orderbook depth or writes unless explicitly specified.
- Never commit secrets, tokens, production credentials, or private keys.

## Decision discipline
- If implementation requires an unresolved economic rule, stop and surface the missing product decision rather than inventing one.
- Do not silently revive legacy business rules because they already exist in code.
