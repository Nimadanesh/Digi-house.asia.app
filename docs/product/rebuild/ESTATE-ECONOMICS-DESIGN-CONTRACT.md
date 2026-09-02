# FractionalLuxe — Estate Economics & Investment UX Design Contract

> **Status:** Rebuild Source of Truth — v1.0
> **Purpose:** Convert the approved Estate assumptions into an implementation-ready product/data/UX contract. This document governs Estate Detail, Marketplace, investment flows, share pricing, selling, profit presentation, and investment-plan UI.
>
> **Scope rule:** This is a product-design and economic-model contract. Current prototype development is not constrained by legal/regulatory considerations. Data accuracy and explicit distinction between observed, estimated, calculated, and unknown values remain mandatory.

---

## 0. Design Priority

The product must optimize for five things in this order:

1. **Economic comprehension** — the user immediately understands what the Estate is and how it generates money.
2. **Decision quality** — the user can compare Estates and understand why one opportunity differs from another.
3. **Investment conversion** — the product makes the next action obvious and compelling without hiding the economics.
4. **State clarity** — owned shares, available shares, sold shares, income, accrued income, paid income, sale value, and plan status are never mixed.
5. **Visual quality** — premium luxury-hospitality presentation with restrained financial UI and excellent mobile interaction.

Beauty is important, but beauty must serve information hierarchy. No decorative component may compete with the economic decision.

---

# 1. Canonical Estate Input Model

Every Estate must have a structured economic object. UI components must consume this object rather than embedding calculations or business values inside presentation components.

### Asset

- `propertyValue`
- `currency`
- `nightlyRateMin`
- `nightlyRateMax`
- `adr`
- `occupancyRate`
- `grossAnnualRevenue`

### Costs

- `tourismTaxRate` = 17%
- `serviceChargeRate` = 10%
- `greenTaxPerGuestNight` = $12
- `agencyRentalOtaRate` = 18%
- `operatorOperatingCostRate` = 12.5%
- `repairInsuranceMaintenanceRate` = 1.5% of property value
- `averageOccupiedGuests` — explicit Estate input used to calculate Green Tax

### Profit allocation

- `ownerNetProfitShare` = 40%
- `operatorNetProfitShare` = 60%
- `travelAgencyGrossRevenueShare` = 18%

These values are product inputs and must be centralized. Do not duplicate them across cards, pages, or calculation helpers.

---

# 2. Canonical Grand 2 BDM Seed

The following is the baseline product scenario for the Grand 2 BDM Ocean Pool Villa.

| Field | Baseline |
|---|---:|
| Property value | $8,000,000 |
| Nightly rental range | $67,000–$80,000 |
| ADR | Derived/configured within the approved range |
| Occupancy | 60%–90% |
| Gross annual revenue | Approximately $16M–$24M |
| Tourism tax | 17% of gross revenue |
| Service charge | 10% of gross revenue |
| Green tax | $12 × guest nights |
| Agency + Rental + OTA | 18% of gross revenue |
| Operator operating costs | 12.5% of gross revenue |
| Repair / insurance / maintenance reserve | 1.5% of property value |
| Owner share | 40% of net profit |
| Operator/resort share | 60% of net profit |
| Travel agency share | 18% of gross revenue |

The product must preserve these values exactly as configured inputs. Do not silently alter percentages or substitute another model.

---

# 3. Calculation Pipeline

Calculations must follow a single deterministic pipeline.

### Step 1 — Occupied nights

`occupiedNights = 365 × occupancyRate`

### Step 2 — Gross annual revenue

`grossAnnualRevenue = ADR × occupiedNights`

The UI may show the supplied gross-revenue range as the Estate's scenario range. The calculation engine must retain the underlying ADR and occupancy inputs that produced each scenario.

### Step 3 — Cost lines

`tourismTax = grossAnnualRevenue × 17%`

`serviceCharge = grossAnnualRevenue × 10%`

`greenTax = averageOccupiedGuests × occupiedNights × $12`

`agencyRentalOtaCost = grossAnnualRevenue × 18%`

`operatorOperatingCosts = grossAnnualRevenue × 12.5%`

`repairInsuranceMaintenance = propertyValue × 1.5%`

### Step 4 — Net profit

`netProfit = grossAnnualRevenue - all configured cost lines`

### Step 5 — Profit allocation

`ownerProfit = netProfit × 40%`

`operatorProfit = netProfit × 60%`

`travelAgencyShare = grossAnnualRevenue × 18%`

**Important:** The cost line `agencyRentalOtaCost` and the allocation line `travelAgencyShare` are separate fields because the supplied business model explicitly contains both. The UI/data architecture must not merge or silently remove either line. Their accounting relationship must remain visible in the calculation model until the business model is explicitly revised.

---

# 4. Scenario Model

The Estate must not be represented by one fake precision number when the underlying economics are ranges.

Each Estate should support at least three scenarios:

- **Conservative** — lower approved occupancy / lower approved rental assumptions.
- **Base** — configured ADR and occupancy baseline.
- **High** — higher approved occupancy / higher approved rental assumptions.

For Grand 2 BDM, the approved occupancy envelope is 60%–90% and nightly rental envelope is $67k–$80k.

The scenario engine must expose its inputs so the UI can explain why gross revenue changes.

Do not invent historical occupancy or historical revenue.

---

# 5. Data Provenance Contract

Every displayed economic number must belong to one of these states:

### Observed / sourced

Directly supplied or extracted property information.

Examples:
- villa name
- location
- photos
- nightly rental range

### Estimated

A deliberate valuation or market estimate supplied for the product model.

Example:
- $8M property value

### Calculated

A deterministic result of configured inputs.

Examples:
- gross annual revenue
- tourism tax
- net profit
- owner share
- scenario results

### Projected

A future-looking output generated by the investment-plan model.

Examples:
- projected distributions
- projected cumulative profit
- projected position value

### Unknown

Data not currently available.

Unknown must be displayed as unavailable, not replaced with a plausible-looking number.

---

# 6. Estate Detail — Mandatory Information Architecture

The Estate Detail page must contain all supplied property economics, but must not dump them into one giant table.

Recommended information hierarchy:

## A. Hero

- Villa photo
- Estate name
- Location
- Nightly rental range
- Property value
- Primary investment action

The first viewport should communicate **what the asset is + why it is economically interesting + what action is available**.

## B. Rental performance

Display:

- Nightly range
- ADR
- Occupancy range / selected scenario
- Gross annual revenue

Use compact visualizations rather than dense paragraphs.

## C. How the Estate makes money

A visual flow:

`ADR × Occupancy → Gross Revenue → Costs → Net Profit → Owner Share`

This section is critical. It transforms the villa from a beautiful image into an understandable productive asset.

## D. Cost structure

Show every required cost line:

- TGST 17%
- Service charge 10%
- Green Tax $12 / guest night
- Agency + Rental + OTA 18%
- Operator costs 12.5%
- Repair / insurance / maintenance 1.5% of asset value

Use progressive disclosure on mobile: summary first, detailed breakdown on tap.

## E. Profit allocation

Show:

- Owner: 40% of net profit
- Operator/Resort: 60% of net profit
- Travel Agency: 18% of gross revenue

Clearly label the basis of each percentage.

## F. Investment opportunity

This section connects Estate economics to the actual investor position:

- total Estate value
- total shares
- price per share
- available shares
- ownership represented by one share
- primary price
- current secondary price when applicable
- estimated/projected economics for the selected position
- investment plans

## G. Market / resale

Show:

- owned shares
- shares available to buy
- shares currently listed for sale
- last/current secondary price where available
- user's potential sale value
- price change vs acquisition price
- liquidity state

Never imply a sale price exists if no market/listing exists.

---

# 7. Share Pricing Architecture

Share pricing must be a first-class economic model, not a UI calculation.

Required inputs:

- `estateValue`
- `totalShares`
- `primarySharePrice`
- `ownershipPerShare`
- `primarySharesAvailable`
- `secondaryListings[]`
- `secondaryMarketPrice` when a valid market price exists

Conceptual baseline:

`ownershipPerShare = 1 / totalShares`

`referenceAssetValuePerShare = estateValue / totalShares`

The product must distinguish:

- **Primary price** — price offered by the platform for newly available shares.
- **Reference asset value per share** — proportional value derived from the Estate valuation.
- **Secondary market price** — actual/listed market price for existing shares.

These values must never be collapsed into one generic "share value".

---

# 8. Share Purchase States

The purchase flow must explicitly handle:

1. Primary shares available.
2. Primary shares nearly sold out.
3. Primary shares sold out.
4. Secondary shares available.
5. No shares currently available.
6. User already owns shares.
7. User owns shares and may sell.

The CTA changes by state.

Examples:

- `Invest in Estate`
- `Buy Shares`
- `Buy on Marketplace`
- `Sold Out — View Secondary Market`
- `You Own 120 Shares`
- `Sell Shares`

Never show a generic Buy button when the available supply state does not support it.

---

# 9. Selling Shares — Required UX

The Sell flow must make the user's economic outcome obvious before confirmation.

Inputs:

- shares owned
- shares selected to sell
- acquisition price
- proposed/listing price
- total sale value
- estimated gain/loss vs acquisition
- applicable marketplace mechanics if configured
- resulting remaining ownership

The confirmation screen must answer:

> "If I sell this amount at this price, how much do I receive and how does my position change?"

Required states:

- create listing
- active listing
- listing matched/sold
- cancel listing
- no buyer / pending liquidity
- price above acquisition
- price below acquisition
- price equal to acquisition

No UI may imply instant liquidity unless an actual mechanism provides it.

---

# 10. Investment Plan Engine — 80% to 125% Target Profit Envelope

The product model uses an approved target-profit envelope of **80%–125%** for investment plans.

This must be implemented as a configurable plan engine rather than hardcoded numbers scattered through UI.

Required plan inputs:

- `principal`
- `targetProfitRate` — configured between 0.80 and 1.25 for the approved plan set
- `termMonths`
- `payoutCadence`
- `startDate`
- `distributionMode`
- `estateEconomicsSnapshot`

Core calculation:

`targetProfit = principal × targetProfitRate`

`targetTotalReturn = principal + targetProfit`

If a plan distributes profit evenly by period:

`periodProfit = targetProfit / numberOfPeriods`

The engine must never infer term, cadence, or distribution mode from the visual design. Those are explicit plan configuration values.

### Product requirement

The 80%–125% range must be used to create **meaningful plan choices**, not five visually identical cards with different percentages.

Each plan should communicate:

- capital required
- target profit
- total projected return
- term
- payout cadence
- when money starts being paid
- cumulative paid amount
- remaining amount
- relationship to Estate economics

Projected plan outcomes must be visually distinct from actual received income.

---

# 11. Profit State Machine

Every investor amount must have an explicit state.

Minimum states:

`Projected → Accrued → Eligible → Requested → Scheduled → Paid`

Additional states may exist only if the product contract requires them.

The UI must never add projected or accrued amounts to a "Paid" balance.

For a position with ownership-linked operating income, the product should show:

- projected income
- accrued income
- paid income
- next expected distribution
- cumulative received

These are different numbers.

---

# 12. Conversion / Investment Psychology

The product should encourage investment through **economic understanding**, not artificial pressure.

High-conversion components should include:

### 12.1 Economic proof

"This Estate generates revenue from nightly stays."

### 12.2 Clear ownership

"Your shares represent X% of the Estate position."

### 12.3 Scenario visibility

Allow the user to understand how occupancy and ADR affect revenue.

### 12.4 Concrete investment outcome

Show what a selected investment amount buys and what the configured plan/ownership model produces.

### 12.5 Scarcity only when real

Use available-share counts only when the supply is actually constrained.

### 12.6 Progress

Primary offering progress can show:

`X / Y shares allocated`

but must be driven by actual product state.

### 12.7 Premium confidence

Luxury imagery, typography, spacing, and motion should make the product feel premium. Trust comes from precise numbers and clean explanations.

---

# 13. Marketplace Card Contract

Every Estate card must answer, in a few seconds:

1. What is it?
2. Where is it?
3. What does it rent for?
4. What is the asset value?
5. What is the economic profile?
6. What can I buy?
7. Why might I choose this instead of another Estate?

Minimum card content:

- image
- Estate name
- location
- nightly rental range
- asset value
- investment/share entry price
- ownership or yield product type
- selected economic metric(s)
- availability state
- CTA

Do not force every economic field onto the card. The card is the decision gateway; Estate Detail is the economic deep dive.

---

# 14. Comparison Model

Marketplace comparison must support side-by-side evaluation across:

- asset value
- nightly rate
- ADR
- occupancy
- gross annual revenue
- net profit
- owner share
- entry price
- ownership fraction
- available supply
- secondary market state
- plan target
- data confidence

The UI should help the user discover meaningful differences between Estates rather than sorting solely by return percentage.

---

# 15. Component Architecture

Economic calculations must live outside visual components.

Recommended layers:

`EstateData → EconomicModel → ScenarioEngine → ShareModel → PlanEngine → ViewModel → UI`

### EstateData
Raw/configured Estate inputs.

### EconomicModel
Deterministic revenue/cost/profit calculations.

### ScenarioEngine
Conservative/base/high scenarios.

### ShareModel
Share count, ownership fraction, primary price, reference value, secondary market.

### PlanEngine
80%–125% target-profit plan calculations using explicit terms.

### ViewModel
Maps economic state into UI-ready labels, numbers, and states.

### UI
Pure presentation and interaction.

No page component should independently calculate net profit, share value, or plan payout.

---

# 16. Required Test Matrix

Before a rebuild slice is considered complete, test:

### Estate economics
- low occupancy
- base occupancy
- high occupancy
- low ADR
- high ADR
- property value change
- green-tax guest-count change
- all cost lines present
- net profit reconciliation
- owner/operator allocation reconciliation

### Shares
- one share
- minimum purchase
- full primary supply
- primary sold out
- secondary listing above acquisition
- secondary listing below acquisition
- no secondary liquidity

### Plans
- 80% target
- midpoint target
- 125% target
- short term
- long term
- different payout cadences
- rounding boundaries

### Profit states
- projected
- accrued
- eligible
- requested
- scheduled
- paid

### UX
- 480×840 Telegram WebView target
- long Estate name
- large dollar values
- RTL/localization if applicable
- no horizontal overflow
- CTA remains visible at decision points

---

# 17. Definition of Done

The Estate rebuild is not complete when the page looks beautiful.

It is complete only when:

- every required Estate input is represented in the data model;
- every economic calculation has one source of truth;
- every displayed number has a provenance/state;
- the user can understand how the Estate generates money;
- the user can understand what one share means;
- the user can understand how buying differs from selling;
- primary and secondary market states are distinct;
- investment plans are calculated from explicit configuration;
- 80%–125% plan targets are supported by the engine;
- projected vs accrued vs paid income is unmistakable;
- Marketplace comparison has meaningful economic dimensions;
- the UI remains premium, simple, and mobile-first;
- no calculation is hidden inside a visual component;
- the implementation passes the required economic and interaction tests.
