# Decision Note — Club Lifestyle Value Removed from V1

> **Status:** decided. Removed from V1 / Deferred — not an active Club benefit.

## Decision

The "Club Lifestyle Value ≈ 10% of member investment amount" concept (e.g. $10K → $1,000)
is completely removed from the FractionalLuxe Private Club V1 product.

## Reason

The exact service catalog, fulfillment model, pricing, limits, and operational
economics are not sufficiently defined yet. Presenting a monetary-looking value
risked implying cashback or guaranteed return, which the product forbids.

## Scope of removal

- Domain: `lifestyleValueCents` selector and 10/100 rate constants removed from
  `src/lib/club/club-economics.ts`. No other economic rule touched.
- UI: `ClubLifestyleSection` component and its Club page wiring removed. No other
  section modified; layout rebalances through the existing page spacing.
- i18n: `club.lifestyleTitle` / `club.lifestyleSub` removed from all 12 locales.
- Docs: referral-model copy rules updated; no other economics document contained
  the concept.
- Tests: obsolete expectations replaced with removal regression guards.

## Explicitly not introduced

No replacement benefit, percentage, credit, cashback, discount, points system,
allowance, or wallet. Referral Points and the 4-night stay benefit are separate
approved systems and remain unchanged.

## Preserved intact

Tiers, weights, 1,450-day pool, 4-night base, 7-night referral cap, Plus
Experience Layer, six benefits (incl. Concierge as a non-monetary category),
Stay Journey, season calendar, referral ladder, navigation, and all other
Club economics.

## Future reconsideration

Requires a separately approved service catalog AND fulfillment economics model.
Reintroduction must pass the same provenance, liability, and copy-firewall
standards as the rest of the Club economics.
