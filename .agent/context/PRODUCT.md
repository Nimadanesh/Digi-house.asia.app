# FractionalLuxe Product Context

## Product identity
- Product: **FractionalLuxe**
- App: **`app.fractionalluxe.com`**
- Current repository name: `Digi-house.asia.app` (do not rename repository identifiers unless explicitly requested).
- The app is a Telegram Mini App for a premium fractional real-estate / luxury-hospitality product experience.

## Current rebuild model
The product is Estate-first.

- The **Estate** is the underlying hospitality asset.
- Hospitality operations are the value-creation engine.
- The **Marketplace** is the capital-allocation and liquidity layer.
- Fractionalization is the access mechanism.
- Portfolio growth is the long-term business flywheel.

An Estate is not merely a decorative wrapper around a yield percentage.

## Prototype design policy
Current product development is intentionally not constrained by legal/regulatory limitations. The prototype should demonstrate the complete target product experience to the company.

This does **not** permit fabricated data. Property facts, calculations, market states, ownership states, and income states must remain truthful to their configured source/status.

## Canonical Estate economics
Every Estate economic model must use a centralized data structure and deterministic calculation layer.

Required inputs include:
- property value
- nightly rental range
- ADR
- occupancy
- gross annual revenue
- 17% TGST
- 10% service charge
- $12 green tax per guest-night
- 18% agency + Rental + OTA expense
- 12.5% operator operating costs
- 1.5% property-value repair/insurance/maintenance reserve
- 40% owner share of net profit
- 60% operator/resort share of net profit
- 18% travel-agency share of gross revenue

Grand 2 BDM Ocean Pool Villa is the baseline seed scenario:
- property value: $8,000,000
- nightly rental: $67,000–$80,000
- occupancy envelope: 60%–90%
- gross annual revenue envelope: approximately $16M–$24M

The supplied values are product inputs and must not be silently changed.

## Estate UI requirements
Estate Detail must preserve and prominently use:
- villa photos
- Estate name
- location
- nightly rental price/range

Required economic presentation:
- property value
- ADR
- occupancy
- gross annual revenue
- all six cost lines
- net profit
- owner/operator profit allocation
- travel agency allocation
- share economics
- investment plans
- primary market state
- secondary market state

The information must be progressively disclosed rather than dumped into one dense table.

## Investment model
Two economic product types must remain distinct:

1. **Ownership-backed position** — exposure to an Estate ownership/ownership-linked position, operating income, and potentially asset/market value changes.
2. **Non-ownership yield position** — contractual capital/return relationship without Estate ownership.

Never imply ownership for a non-ownership product.

## Share model
Share economics must distinguish:
- primary share price
- reference asset value per share
- secondary-market price
- ownership per share
- available primary supply
- secondary listings

Primary and secondary market states must drive the CTA and UI.

## Investment plans
The approved product envelope for target-profit plans is **80%–125%**.

Plans must be configuration-driven and calculated by a dedicated PlanEngine. Do not hardcode plan math into UI components.

Required plan inputs:
- principal
- target profit rate
- term
- payout cadence
- distribution mode
- Estate economics snapshot

Projected plan outcomes must never be displayed as paid income.

## Income states
Keep these distinct:
- Projected
- Accrued
- Eligible
- Requested
- Scheduled
- Paid

Also distinguish operating income, projected plan profit, and secondary-market appreciation/gain.

## Data truth
Every displayed economic value must be classified as:
- Observed / sourced
- Estimated
- Calculated
- Projected
- Unknown

Unknown data must remain unknown.

## Product principles
- Trust through clarity.
- Numbers are primary; avoid decorative chrome.
- Luxury hospitality presentation with restrained financial UI.
- One clear primary action per decision state.
- Native Telegram behavior and interaction patterns are mandatory.
- The Marketplace is a capital-allocation decision environment, not a villa gallery.
- Yield is an economic attribute, not the identity of an Estate.
- Product conversion should come from clear economics, not fake scarcity or fake activity.

## Rebuild execution
Use:
- `docs/product/rebuild/ECONOMIC-PHILOSOPHY-PRODUCT-TRUTH.md`
- `docs/product/rebuild/ESTATE-ECONOMICS-DESIGN-CONTRACT.md`
- `docs/product/rebuild/REBUILD-EXECUTION-PROMPTS.md`

Do not attempt the entire rebuild as one task. Execute the staged slices and gates in order.

## Rebrand rule
User-facing brand is FractionalLuxe. Technical identifiers may remain DigiHouse where changing them would create unnecessary risk or break contracts. Rename technical identifiers only when explicitly required and verified.
