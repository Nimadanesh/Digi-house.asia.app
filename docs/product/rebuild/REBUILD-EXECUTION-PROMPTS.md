# FractionalLuxe — Rebuild Execution Prompt System

> **Purpose:** Prevent a large rebuild from losing critical requirements. This file contains staged execution prompts for the coding agent. Prompts are intentionally narrow: the agent must finish and verify one slice before moving to the next.
>
> **Execution rule:** Do not ask the agent to "redesign the whole app" in one task. Use the prompts sequentially.

---

# 0. Global Agent Contract

Use this instruction at the start of every rebuild session:

```text
You are implementing the FractionalLuxe product rebuild.

SOURCE OF TRUTH:
- docs/product/rebuild/ECONOMIC-PHILOSOPHY-PRODUCT-TRUTH.md
- docs/product/rebuild/ESTATE-ECONOMICS-DESIGN-CONTRACT.md
- docs/product/rebuild/REBUILD-EXECUTION-PROMPTS.md
- .agent/context/PRODUCT.md
- .agent/context/BUSINESS-RULES.md

Do not invent product economics, property facts, share mechanics, plan terms, or UI states.
Do not silently reinterpret an existing rule.
Do not put financial calculations inside visual components.
Do not replace unknown data with plausible numbers.
Do not use legal/compliance considerations to reduce or constrain the current product experience; current work is a product prototype intended to demonstrate the target experience. Data truth still matters.

This rebuild is Estate-first, not APY-first.
The Estate is the underlying economic asset.
Hospitality operations explain how economic value is generated.
The Marketplace is the capital-allocation and liquidity layer.

When a requirement is not explicitly defined, create the smallest explicit configuration/input needed and report it as a product decision dependency. Do not guess a business rule.

Before coding:
1. inspect the existing implementation;
2. identify reusable components;
3. identify conflicting legacy assumptions;
4. state exactly which files will change;
5. implement only the current slice.

After coding:
1. run relevant tests;
2. verify the 480x840 Telegram WebView target;
3. verify no horizontal overflow;
4. verify all economic numbers against the canonical calculation model;
5. report changed files, tests, screenshots/audit evidence, and unresolved dependencies.
```

---

# 1. Slice A — Economic Data Architecture

```text
TASK: Build the canonical Estate economic data architecture. Do not redesign the UI yet.

Read the three rebuild source-of-truth documents first.

Create a single canonical data model for Estate economics with these groups:

ASSET
- propertyValue
- currency
- nightlyRateMin
- nightlyRateMax
- adr
- occupancyRate
- grossAnnualRevenue

COSTS
- tourismTaxRate = 0.17
- serviceChargeRate = 0.10
- greenTaxPerGuestNight = 12
- agencyRentalOtaRate = 0.18
- operatorOperatingCostRate = 0.125
- repairInsuranceMaintenanceRate = 0.015
- averageOccupiedGuests (explicit Estate input)

ALLOCATION
- ownerNetProfitShare = 0.40
- operatorNetProfitShare = 0.60
- travelAgencyGrossRevenueShare = 0.18

Do not duplicate these constants in components.

Implement deterministic functions for:
- occupied nights
- gross annual revenue
- each individual cost
- total costs
- net profit
- owner profit
- operator profit
- travel agency share

Preserve separate fields for the 18% Agency/Rental/OTA expense and the 18% Travel Agency allocation because both are explicitly part of the supplied model.

Add a calculation reconciliation result so tests can verify that:
net profit = gross revenue - all configured cost lines
owner + operator = net profit

Add data provenance/state support:
OBSERVED, ESTIMATED, CALCULATED, PROJECTED, UNKNOWN.

Do not change UI behavior in this slice unless necessary to wire the model.

Acceptance:
- one source of truth for calculations;
- no economic formulas in React/UI components;
- Grand 2 BDM seed data represented exactly;
- tests cover low/base/high occupancy and ADR scenarios;
- tests cover green tax with explicit guest count;
- no fabricated property facts.
```

---

# 2. Slice B — Scenario Engine

```text
TASK: Build the Estate economic scenario engine.

Use the canonical EconomicModel from Slice A.

Support at least:
- Conservative
- Base
- High

The scenario is a combination of explicit ADR and occupancy inputs. Do not invent historical performance.

For Grand 2 BDM:
- nightly rental range = $67,000–$80,000
- occupancy range = 60%–90%
- property value = $8,000,000
- gross annual revenue envelope = approximately $16M–$24M

The engine must expose scenario inputs and outputs, not only the final result.

Output per scenario:
- ADR
- occupancy
- occupied nights
- gross revenue
- each cost line
- net profit
- owner share
- operator share
- agency share

Build unit tests that prove changing occupancy changes revenue and downstream economics deterministically.

Do not create or change marketing copy in this slice.
```

---

# 3. Slice C — Share Model

```text
TASK: Build the canonical share/ownership model.

Read ESTATE-ECONOMICS-DESIGN-CONTRACT.md section 7 and section 8.

Create a model for:
- total shares
- ownership per share
- primary share price
- reference asset value per share
- primary shares available
- secondary listings
- current secondary price when valid

Keep these concepts separate:
1. primary price
2. proportional/reference asset value
3. secondary market price

Create explicit market states:
- primary available
- primary nearly sold out
- primary sold out
- secondary available
- no shares available
- user owns shares
- user owns shares and can sell

Do not infer total share count or primary price from visual design. They must be explicit configuration.

Add deterministic functions:
- shares purchased for capital amount
- ownership represented by shares
- primary purchase total
- secondary sale total
- gain/loss vs acquisition price
- remaining ownership after sale

Add tests for zero, minimum, full supply, and sold-out states.
```

---

# 4. Slice D — Investment Plan Engine

```text
TASK: Build the investment-plan calculation engine.

Approved target-profit envelope: 80%–125%.

Do not hardcode plan cards into UI.
Plans are configuration objects consumed by a PlanEngine.

Required inputs:
- principal
- targetProfitRate
- termMonths
- payoutCadence
- startDate
- distributionMode
- Estate economics snapshot

Required calculations:
- targetProfit = principal × targetProfitRate
- targetTotalReturn = principal + targetProfit
- period count from term + cadence
- period profit according to the configured distribution mode
- cumulative projected profit
- remaining projected profit

Support target rates from 0.80 through 1.25.

Do not invent a term or payout cadence as a business rule. If the repository has an explicit configured plan set, use it. If it does not, implement the engine generically and report that plan-term configuration is required before production plan cards are finalized.

The engine must label outputs as PROJECTED unless backed by an actual transaction state.

Tests required:
- 80%
- midpoint
- 125%
- rounding boundaries
- different terms
- different cadences
- zero/invalid principal handling
```

---

# 5. Slice E — Estate Detail Information Architecture

```text
TASK: Rebuild Estate Detail around the economic story while preserving the luxury property experience.

Mandatory hero fields:
- villa photos
- Estate name
- location
- nightly rental range
- property value
- primary investment CTA

Do not remove or hide these property facts.

Create this information hierarchy:
1. Hero / asset identity
2. Rental performance
3. How the Estate makes money
4. Cost structure
5. Profit allocation
6. Investment opportunity
7. Secondary market / resale

The user should understand this chain visually:
ADR × Occupancy → Gross Revenue → Costs → Net Profit → Owner Economics

Do not show every metric in the first viewport.
Use progressive disclosure for detailed cost lines on mobile.

The design must feel like a premium luxury hospitality product, not an accounting dashboard.

At every point where a number is shown, use its provenance/state.

Do not add invented occupancy history, revenue history, or market activity.
```

---

# 6. Slice F — Marketplace Rebuild

```text
TASK: Rebuild the Marketplace as an economic decision environment.

The Marketplace must answer:
"Where should I allocate my capital, and what economic position am I choosing?"

Do not make APY the identity of the Marketplace.

Every Estate card must expose, at minimum:
- image
- Estate name
- location
- nightly rental range
- property value
- entry/share price when available
- ownership/yield product type
- one or more meaningful economic metrics
- availability state
- CTA

The card should be compact. The Estate Detail page contains the full economics.

Provide filters/sorting only when driven by actual model data.

Potential comparison dimensions:
- asset value
- nightly rate
- ADR
- occupancy
- gross annual revenue
- net profit
- owner share
- entry price
- ownership fraction
- supply
- secondary market state
- plan target
- data confidence

Do not rank Estates solely by yield.

Do not use scarcity language unless share supply is actually constrained.
```

---

# 7. Slice G — Investment / Buy Flow

```text
TASK: Build the investment decision and purchase flow.

The flow must connect:
Estate → economic profile → investor position → terms → purchase.

Before confirmation, show:
- selected Estate
- selected shares / capital
- price per share
- ownership represented
- primary/secondary source
- selected plan if applicable
- target profit
- projected total return
- term
- payout cadence
- important economic assumptions

The user must be able to answer:
"What exactly am I acquiring?"
"How much am I paying?"
"What economic outcome is projected?"

Use projected language for plan outputs.
Never display projected profit as paid income.

The CTA should be strong and clear, but never based on fabricated scarcity or fabricated social proof.
```

---

# 8. Slice H — Sell / Secondary Market Flow

```text
TASK: Build the complete share resale experience.

The flow must support:
- owned shares
- quantity to sell
- proposed price
- total sale value
- acquisition cost
- gain/loss vs acquisition
- remaining shares
- remaining ownership
- listing status

States:
1. Create listing
2. Active listing
3. Pending liquidity
4. Matched/sold
5. Cancelled
6. No buyer / no liquidity

If proposed price is above acquisition, show gain.
If below acquisition, show loss.
If equal, show break-even.

Do not promise instant liquidity unless an actual mechanism exists.

The confirmation screen must answer:
"If I sell this amount at this price, how much do I receive and what remains?"
```

---

# 9. Slice I — Profit / Income Experience

```text
TASK: Rebuild the income/profit experience around explicit economic states.

Implement and display:
- Projected
- Accrued
- Eligible
- Requested
- Scheduled
- Paid

Never mix these balances.

For an ownership-backed position show, where applicable:
- projected income
- accrued income
- paid income
- next expected distribution
- cumulative received

Use the Estate economics model to explain the origin of operating income.

The UI must make a clear distinction between:
- rental/operating income
- projected plan profit
- appreciation
- secondary-market gain/loss

Do not collapse these into one generic "earnings" number.
```

---

# 10. Slice J — Conversion & Premium Polish

```text
TASK: Optimize the rebuilt product for investment conversion without damaging economic clarity.

Prioritize:
- immediate comprehension
- premium visual hierarchy
- short decision paths
- clear CTAs
- strong photography
- high-quality typography
- restrained motion
- excellent Telegram WebView behavior

Conversion mechanisms must be economic and truthful:
- explain revenue generation
- show ownership clearly
- show scenario economics
- show what a selected investment buys
- show plan outcome
- show genuine supply constraints
- show genuine marketplace activity

Do not use fake timers, fake buyers, fake transaction counts, fake earnings, or fake scarcity.

Every high-emotion visual element must support the economic decision rather than obscure it.
```

---

# 11. Slice K — Full Economic QA Audit

```text
TASK: Perform a complete economic + UX audit of the rebuild. Do not make speculative fixes before reporting findings.

Verify:

DATA
- all required Estate fields exist
- no fabricated values
- provenance is correct

ECONOMICS
- revenue formulas
- all cost lines
- net profit
- owner/operator allocation
- agency allocation
- scenario outputs

SHARES
- primary pricing
- reference value
- secondary pricing
- ownership fraction
- buy/sell calculations

PLANS
- 80% target
- midpoint
- 125% target
- term calculation
- payout cadence
- rounding

STATES
- projected
- accrued
- eligible
- requested
- scheduled
- paid

UX
- first viewport comprehension
- CTA clarity
- mobile 480×840
- no overflow
- long names
- large currency values
- loading/error/empty states

For every defect report:
- severity
- exact screen/component
- observed behavior
- expected behavior
- source-of-truth rule
- recommended fix

Do not silently change product economics during QA.
```

---

# 12. Agent Handoff Format

At the end of every slice, the coding agent must return:

```text
SLICE: <name>
STATUS: PASS | PARTIAL | BLOCKED

Implemented:
- ...

Files changed:
- ...

Economic model changes:
- ...

UI changes:
- ...

Tests:
- ...

Visual QA:
- viewport:
- screenshots:
- overflow:
- interaction checks:

Known gaps:
- ...

Product decisions required:
- ...

Commit:
- <sha>
```

A slice is not complete if it has hidden assumptions, failing economic tests, or unreported product dependencies.
