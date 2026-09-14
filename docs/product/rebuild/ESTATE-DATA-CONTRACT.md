# FractionalLuxe — Canonical Estate Data Contract

Status: PRODUCT / DATA CONTRACT

---

# 1. Purpose

This document defines the canonical property information model used by FractionalLuxe.

The canonical Estate record is the single source from which:

- Estate
- Income
- Ownership
- Detail
- Marketplace
- Buy
- Sell

derive their property-related information.

UI components must not invent or independently calculate Estate facts.

---

# 2. Source Hierarchy

## Primary property source

Rental Escapes is authoritative for observed public listing facts:

- property identity
- listing name
- location
- images
- source nightly rate
- property specifications
- amenities
- services
- listing description
- observed taxes / fees where explicitly published

## FractionalLuxe enrichment

FractionalLuxe may add:

- estimated property valuation
- valuation range
- investment structure
- fractional ownership data
- product-specific economic data

These must be clearly distinguished from observed listing facts.

---

# 3. Provenance

Every canonical field must belong to one of:

- OBSERVED
- ESTIMATED
- DERIVED
- CONFLICTED
- UNKNOWN

## OBSERVED

Directly supported by an identified source.

## ESTIMATED

A model or research estimate.

## DERIVED

Mathematically derived from known values.

## CONFLICTED

Multiple credible sources disagree.

## UNKNOWN

No reliable value currently available.

Never silently convert one provenance class into another.

---

# 4. Canonical Estate Schema

```ts
Estate {
  id
  runtimeId
  listingId
  name
  slug

  location {
    country
    region
    place
    full
  }

  propertyType

  sourceUrl

  specs {
    guests
    bedrooms
    bathrooms
    sizeInteriorM2
    sizeTotalM2
    poolM2
    landHa
    landNote
  }

  description {
    short
    full
    seasonality
  }

  amenities {
    general[]
    outdoor[]
    indoor[]
    kitchen[]
    entertainment[]
    activities[]
    nearby[]
  }

  services {
    included[]
    staff[]
    extraCost[]
  }

  rates {
    nightly
    type
    currency
    notes
    observedPeriod
  }

  taxesAndFees {
    tourismTax
    serviceCharge
    greenTax
    damageWaiver
    other[]
  }

  valuation {
    central
    range
    provenance
    confidence
  }

  research {
    lastUpdated
    confidence
    sources[]
  }
}
```
# 5. Field Rules

Identity

Identity must come from the canonical record.

Legacy fixture names must not be used as fallback if canonical data exists.

Property type

Must be source-supported or explicitly marked unknown.

Do not use generic legacy fixture types such as "Apartment" for villas.

Size

Preserve the source value exactly where available.

Do not invent missing area.

If multiple area definitions exist, preserve their semantics.

Bedrooms / bathrooms / guests

These are property facts.

They belong primarily in Detail.

They may be selectively surfaced elsewhere when useful.

Nightly rate

Never assume every rate is ADR.

Preserve:

original display
rate type
observed period
notes

Rate types may include:

RANGE
STARTING_FROM
DYNAMIC
APPROXIMATE

The UI must respect these semantics.

Valuation

Valuation is not the same thing as:

nightly rate
offering amount
share price
market price

Keep definitions separate.

Current approved Grand 2 BDM product valuation:

$8M–$10M estimated band.

Do not restore the legacy $82M figure.

Occupancy

Occupancy is UNKNOWN unless supported by credible data.

Do not estimate occupancy for product display without an explicit business decision.

ADR

Do not derive ADR from a nightly range midpoint and present it as observed ADR.

Annual revenue

Do not invent annual revenue.

It requires a defined operating model and source/assumption basis.

# 6. Estate vs Economic Data

Property facts and investment economics are separate layers.

Property layer:

property
location
specs
amenities
services
listing rates
observed taxes

Economic layer:

occupancy assumption
ADR
gross revenue
costs
net income
owner distributable
investor income

Do not create economic values merely because property facts exist.

# 7. Display Ownership

| Data          | Estate     | Income           | Ownership | Detail       |
| ------------- | ---------- | ---------------- | --------- | ------------ |
| Name          | Yes        | Optional         | Optional  | Yes          |
| Location      | Yes        | Optional         | Optional  | Yes          |
| Images        | Yes        | Optional         | Optional  | Yes          |
| Property type | Optional   | No               | No        | Yes          |
| Bedrooms      | Optional   | No               | No        | Yes          |
| Bathrooms     | Optional   | No               | No        | Yes          |
| Guests        | Optional   | No               | No        | Yes          |
| Size          | Optional   | No               | No        | Yes          |
| Amenities     | No         | No               | No        | Yes          |
| Services      | No         | No               | No        | Yes          |
| Nightly rate  | Yes        | Economic context | No        | Yes          |
| Valuation     | Yes        | Context          | Optional  | Yes          |
| Occupancy     | No         | Yes              | No        | If available |
| Revenue       | High-level | Yes              | No        | If relevant  |
| Ownership     | Yes        | Yes              | Yes       | Yes          |
| Taxes / fees  | High-level | Yes              | No        | Yes          |
| Source URL    | Optional   | Optional         | Optional  | Yes          |


This table is a product guideline, not permission to duplicate conflicting values.

# 8. Legacy Data Rule

Legacy mock fixtures are not authoritative.

They may remain temporarily for migration/testing.

They must not drive user-visible Estate facts when canonical data exists.

Known legacy leakage includes:

incorrect property descriptions
incorrect property types
incorrect financial values
legacy APY
legacy projected income
legacy location/name combinations
# 9. Conflict Handling

When two sources disagree:

Preserve both evidence records internally.
Identify the authoritative source.
Mark the canonical value appropriately.
Do not silently choose a value.
If unresolved, expose UNKNOWN or CONFLICTED rather than inventing certainty.
# 10. Completion Rule

An Estate is "data complete" only when every field is classified as:

populated and sourced
intentionally unavailable
intentionally not applicable

A blank field without explanation is incomplete.