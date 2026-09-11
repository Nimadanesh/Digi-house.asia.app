# Phase 9 Product Contract

This document defines the product truths that must not be changed by an agent finding. A change requires an explicit product decision and an entry in `PHASE-9-DECISION-LOG.md`.

## Product outcome

Deliver a coherent, trustworthy FractionalLuxe demo experience in which a first-time user can understand a property, distinguish primary offering from secondary market activity, understand what is known versus estimated, and complete the intended demo journey without contradictory numbers or unexplained states.

## Canonical inventory

- Exactly 24 selected Rental Escapes villas are the inventory.
- Rental Escapes is authoritative for property identity, name, location, listing identity, images, and observed nightly rental rate.
- `ESTATE-24-DATA.json` is the canonical FractionalLuxe economic data layer.
- The research dataset and legacy `prop-*` fixtures are evidence or compatibility inputs only; they are not selection authority or a competing source of truth.
- Placeholder manifest names and locations must never appear as user-facing identity.

## Economic truths

- Primary base share price is $100 unless a future explicit product decision changes it.
- Canonical primary share supply is valuation divided by $100.
- Monthly profit/income must be described as monthly, even if a payment process uses weekly installments.
- Missing inputs must remain visibly pending/unknown; agents must not invent values.
- Observed, estimated, derived, conflicted, and unknown values must remain distinguishable.
- NFT or digital ownership representation is a digital certificate/record, not a claim that legal title has been transferred.

## Experience truths

- Primary Offering and Secondary Market are distinct contexts.
- Primary price, secondary price, last trade, best ask, and projected income must not be conflated.
- Demo behavior must be honest and disclosed. No fabricated real users, trades, payouts, partnerships, or live liquidity.
- A user action may update demo state only if the resulting state is explicitly defined and consistently reflected; otherwise the UI must explain the limitation.
- Every completed slice requires logic QA and Design/UI QA at 480×840, including RTL, i18n, overflow, hierarchy, spacing, consistency, and polish.

## Non-negotiable prohibitions

- No silent change of product economics.
- No second parallel financial engine.
- No broad refactor outside the active slice.
- No declaring PASS with known in-scope defects.
- No changing this contract from an agent report alone.
