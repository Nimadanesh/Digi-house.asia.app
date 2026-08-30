# Property Redesign — Master Execution Specification

**Project:** DigiHouse / FractionalLuxe
**Scope:** Property Detail Experience — Primary + Secondary
**Status:** Approved design direction / implementation specification
**Execution model:** Phase-by-phase, checkpointed, no automatic phase progression

---

# 0. PURPOSE

Transform the current Property Detail experience from a relatively simple property/sales page into a **rich, premium Asset Detail & Intelligence experience**.

The final experience should feel inspired by the information density and analytical depth of platforms such as TradingView, while remaining:

* simple enough for a normal investor to understand
* visually consistent with the existing DigiHouse design system
* mobile-first
* calm and premium rather than speculative/casino-like
* highly interactive
* rich in real-estate, token ownership, market, and income data
* materially different between Primary and Secondary properties

The Property page must make the user feel:

> "I understand what this asset is, how it is performing, who owns it, how the tokens are distributed, what I can earn, and what is happening in its market."

This is **not** a generic dashboard redesign.

It is an **Asset Detail product experience**.

---

# 1. NON-NEGOTIABLE PRODUCT OUTCOME

The final Property experience MUST support two distinct product states:

## PRIMARY

Primary properties are currently being funded/sold directly by DigiHouse.

The token/share price is fixed during the primary offering.

Therefore:

* No price-performance chart should be presented as if a market price exists.
* No fake price volatility should be displayed.
* Primary analytics must focus on:

  * funding progress
  * token/share distribution
  * ownership
  * holders
  * projected income
  * property fundamentals
  * sales progression
  * historical simulated engagement/distribution where appropriate

Primary should feel like:

> "This asset is currently being funded. Here is how far it has progressed and what owning it could mean."

## SECONDARY

Secondary properties represent an already-issued asset whose shares/tokens can trade between users.

Therefore:

* live/current token price is meaningful
* historical token price is meaningful
* order book is meaningful
* recent trades are meaningful
* price performance is meaningful
* volume is meaningful
* holder distribution is meaningful
* ownership history is meaningful

Secondary should feel like:

> "This is an established asset with a market. Here is what the market is doing and how ownership is distributed."

These two experiences MUST NOT simply be the same page with a different badge.

---

# 2. DESIGN PRINCIPLES

## 2.1 Calm sophistication

The interface should resemble a premium private-wealth / asset-management product with TradingView-inspired analytical depth.

Avoid:

* casino-like urgency
* excessive red/green flashing
* "HOT"
* "FOMO"
* fake scarcity
* unnecessary animations
* excessive KPI cards
* visual noise

Use:

* hierarchy
* whitespace
* restrained typography
* subtle status indicators
* meaningful color
* progressive disclosure
* clear explanations

---

## 2.2 Data density without cognitive overload

The product should be **data-rich but not visually chaotic**.

Advanced information belongs behind:

* tabs
* expandable sections
* disclosure controls
* tooltips
* secondary views

Do not remove useful data merely to make the page look minimal.

Instead, organize it.

---

## 2.3 Never invent financial truth

The implementation MUST distinguish between:

### Existing real application data

Data already exposed by:

* repositories
* hooks
* APIs
* mock repositories
* existing calculations
* existing constants
* existing domain logic

### Simulated product/demo data

Data intentionally generated to enrich the current demo experience.

Simulated data is allowed and expected for the analytics experience described in this specification.

However:

* simulated data must be internally consistent
* simulated data must be deterministic
* simulated data must not accidentally imply real on-chain activity
* simulated data must not alter financial/accounting logic
* simulated data must be clearly identifiable where appropriate
* simulated data must be replaceable by real API data later

Do NOT silently invent production financial calculations.

---

# 3. SOURCE OF TRUTH / SAFETY BOUNDARY

The following MUST NOT be changed as part of this redesign:

* buy settlement logic
* ownership source of truth
* holdings logic
* yield calculation logic
* lock/unlock business logic
* sell business logic
* withdrawal logic
* fee calculations
* NFT lifecycle
* NFT ownership model
* wallet security/binding model
* financial ledger
* database accounting
* transaction settlement
* existing authentication
* existing authorization
* existing API contracts unless explicitly required for a future data extension

UI may consume existing logic.

UI may reorganize existing information.

UI may introduce presentation-layer selectors.

UI may introduce simulated analytics datasets.

UI MUST NOT redefine business truth.

---

# 4. HIGH-LEVEL INFORMATION ARCHITECTURE

The Property experience should have two major layers.

## Layer A — Property Overview

The primary decision-making experience.

Contains:

1. Property header
2. Asset status
3. Primary/Secondary context
4. Key metrics
5. Primary/Secondary-specific market/funding information
6. Calculator
7. Position information
8. Core property information
9. Primary CTA

---

## Layer B — Asset Intelligence

A dedicated analytical area/page within the Property experience.

This is intentionally more data-dense.

Recommended navigation:

* Overview
* Market / Performance
* Holders
* Income
* Details

The exact naming may be adapted to the existing navigation conventions, but the conceptual separation MUST remain.

The analytical area should feel like:

> "Open the terminal and understand the asset."

It should not feel like another marketing page.

---

# 5. PROPERTY HEADER

Create a strong, consistent property header.

Include:

* property image
* property name
* location
* Primary/Secondary status
* funding/trading status
* expected annual yield
* primary CTA

### Primary CTA

Primary:

`Buy Shares`

Secondary:

`Buy at $X`

The CTA must use the existing buy flow.

Do not create a new financial transaction flow.

---

# 6. KPI BAR

Introduce a compact KPI section inspired by TradingView key statistics.

Target metrics:

* Price per Share
* Monthly Yield / Share
* Total Property Value
* Shares Sold / Total Shares
* Number of Holders
* Next Payout
* Last Payout

Do NOT force all metrics into equal-weight cards if the design system suggests a better hierarchy.

The KPI section should remain readable on mobile.

### Primary behavior

Price per Share:

> Fixed Primary Offering Price

Do not show historical price movement.

### Secondary behavior

Price per Share:

> Current Secondary Market Price

Historical price performance may be shown in Analytics.

---

# 7. PROPERTY TABS

Implement a coherent tab system.

Recommended tabs:

1. Overview
2. Performance
3. Holders
4. Income
5. Details

Tabs should:

* work on mobile using horizontal scrolling
* preserve the current design system
* avoid browser-like heavy navigation
* maintain clear active state
* support deep analytical content

Do not introduce unnecessary nested navigation unless it improves comprehension.

---

# 8. OVERVIEW — PRIMARY

Primary Overview should emphasize the funding opportunity.

Include:

## Funding Progress

Prominent funding visualization:

* percentage funded
* shares sold
* shares remaining
* total target
* current fixed share price

Use a calm, premium progress visualization.

Avoid:

* animated urgency
* flame badges
* "HOT"
* fake scarcity language

Example tone:

> `92% funded · 200 shares remaining`

---

## Earnings Calculator

Preserve the existing calculator.

Improve presentation if necessary.

Do not change:

* yield logic
* fee logic
* lock logic
* financial calculations

---

## Property Fundamentals

Where data is available, surface:

* property value
* expected yield
* cap rate
* NOI
* cash-on-cash return
* expense ratio

If a metric is not backed by existing or explicitly approved simulated data:

* do not fabricate a value
* either omit it
* or mark it clearly as simulated/demo

---

## Confidence / Trust

Preserve the existing confidence/trust content.

Use concise visual hierarchy.

---

# 9. OVERVIEW — SECONDARY

Secondary Overview should feel like a market page.

Include:

## Market Summary

* current price
* price change
* best bid
* best ask
* spread
* volume where available

## Order Book

Preserve and improve the existing order book.

## Recent Trades

Preserve and improve recent trades.

## Your Position

If the current user owns shares:

* total shares
* locked shares
* unlocked/free shares
* accrued earnings
* current estimated value
* relevant actions

Actions:

* Lock
* Sell

Use existing flows and interaction primitives.

---

# 10. PERFORMANCE / MARKET

This is the core TradingView-inspired analytical experience.

---

## PRIMARY PERFORMANCE

### DO NOT SHOW A PRICE CHART

This is a strict requirement.

Primary price is fixed.

A price chart would communicate a false market behavior.

Instead show:

### Chart 1 — Funding Progress Over Time

Historical period:

* ideally 6–12 months
* deterministic simulated dataset where real historical data does not exist

Display:

* percentage funded
* shares sold
* timeline
* meaningful milestones

Chart type:

* Line or Area

---

### Chart 2 — Cumulative Shares Sold

Show cumulative token/share sales over time.

This should be internally consistent with:

* total shares
* current funding percentage
* final funding target

---

### Internal Primary Performance Sections

Recommended:

* Funding
* Yield Projection

Do not create unnecessary chart controls.

---

# 11. SECONDARY PERFORMANCE

Secondary gets the richer market experience.

## Main Price Chart

Support:

* Line
* Area
* Candlestick where the dataset supports OHLC
* timeframe selection

Recommended timeframes:

* 1D
* 1W
* 1M
* 3M
* 6M
* 1Y
* All

Only expose timeframes for which meaningful data exists.

---

## Volume

Display trading volume beneath the price chart.

---

## Yield Performance

Allow switching from:

`Price Performance`

to:

`Yield Performance`

---

## Optional overlays

Where simulated data exists:

* Occupancy Rate
* Average Daily Rate

These should be optional overlays, not permanently visible noise.

---

# 12. HOLDER ANALYTICS

This section is intentionally data-rich.

Create an analytical Holder page/section.

The following charts are explicitly required.

---

## 12.1 Token Holder Distribution — Donut Chart

Show:

* Top 5–10 holders
* Others
* ownership percentage
* share/token count

Center of donut:

> Total Holders

Tooltip:

* holder category
* token count
* percentage

Do not expose private user identities.

Use anonymized labels such as:

* Holder A
* Holder B
* Holder C

or appropriate privacy-safe categories.

---

## 12.2 Top Token Holders — Horizontal Bar Chart

Show ranked holders.

Each row:

* rank
* anonymized holder label
* token/share count
* ownership percentage

Highlight:

* Top 5
* optionally Top 10

Do not expose personally identifiable information.

---

## 12.3 Ownership Treemap

Create a treemap showing relative ownership.

Use:

* holder/category
* share count
* percentage

Desktop:

* larger visualization

Mobile:

* simplified or horizontally scrollable alternative if required

Treemap must remain understandable.

---

## 12.4 Token Distribution Over Time — Stacked Area

Show how ownership distribution changes over time.

Historical period:

* 6–12 months

Segments may represent:

* Top Holder
* Top 2–5
* Other Holders
* Retail / Smaller Holders

The exact categories should be derived from the dataset.

Tooltip must expose:

* date
* category
* token count
* percentage

---

## 12.5 Token Holder Bubble Chart

Create a bubble visualization representing holders.

Bubble size:

> token/share ownership

Optional secondary dimension:

> ownership percentage / holding age / activity

Do not encode arbitrary data merely for visual effect.

Tooltip:

* anonymized holder
* shares
* ownership %
* optional activity metric

---

## 12.6 Holder Statistics

Add a compact statistics area:

* Total Holders
* Average Holding
* Median Holding
* Top 10 Ownership %
* New Holders — 30D
* Largest Holder %

All values must come from the same holder dataset.

---

# 13. INCOME ANALYTICS

Income should combine the property income story with rental yield.

## Main chart

Monthly or quarterly:

* Yield Paid
* Cumulative Yield

Use a combination of:

* bars for periodic income
* line for cumulative income

---

## Income history

Table/list:

* period
* payout date
* amount per share
* total distributed
* source/property

---

## Projected Earnings

Preserve the existing calculator.

Where supported, provide:

* Conservative
* Base
* Optimistic

These are scenarios, not promises.

Clearly label them as projections.

---

## Real Estate Metrics

Where available/supported:

* Gross Yield
* Net Yield
* Cap Rate
* Cash-on-Cash Return
* NOI
* Expense Ratio

---

## Optional Revenue Breakdown

If the simulated dataset includes the necessary fields:

* base rent
* services
* parking
* other income

Display as a stacked bar.

Do not invent revenue categories merely to fill space.

---

# 14. DETAILS

Preserve and improve existing Details content.

Include:

* About
* property information
* documents
* location
* map where supported
* similar properties
* additional media where supported

Do not allow Details to overwhelm the analytical experience.

---

# 15. SIMULATED DATA STRATEGY

This is a major part of the redesign.

For Secondary properties, create deterministic simulated historical datasets covering approximately:

> 6–12 months

Prefer 12 months when practical.

The dataset must be internally consistent.

---

## Required relationships

For example:

* holder totals must equal total shares
* holder percentages must sum to approximately 100%
* Top Holder cannot own more shares than total shares
* distribution history must lead logically to the current distribution
* trading volume should correspond reasonably to price/activity
* price history should have realistic variation
* income history should correlate reasonably with yield assumptions
* current displayed values should correspond to the final historical data point where applicable

Do NOT generate independent random values for each chart.

All charts must derive from shared underlying datasets.

---

# 16. SECONDARY MARKET MOCK DATA

Where real historical market data does not exist, create a shared deterministic dataset supporting:

* historical price
* OHLC if candlestick is used
* volume
* trades
* bid/ask
* spread
* holder changes
* ownership distribution
* funding/issuance history where relevant
* income/yield history

The dataset should make the property feel like a believable established tokenized real-estate asset.

Avoid unrealistic crypto-like volatility.

This is a real-estate asset.

Price behavior should be relatively measured.

---

# 17. PRIMARY MOCK DATA

Primary properties may use simulated historical data for:

* funding progress
* shares sold
* holder growth
* ownership distribution
* income projections
* engagement/participation metrics where appropriate

However:

**Never simulate price volatility for the Primary offering price.**

Primary offering price remains fixed.

---

# 18. DATA ARCHITECTURE

Prefer a structure similar to:

```text
property
 ├── market
 │    ├── current
 │    ├── historicalPrice
 │    ├── volume
 │    ├── trades
 │    └── orderBook
 │
 ├── ownership
 │    ├── current
 │    ├── historical
 │    ├── holders
 │    └── distribution
 │
 ├── funding
 │    ├── current
 │    └── historical
 │
 └── income
      ├── historical
      ├── projected
      └── metrics
```

Exact implementation may follow existing repository conventions.

Do not introduce unnecessary architectural complexity.

The key requirement is:

> All visualizations must consume coherent shared data.

---

# 19. CHART SYSTEM

Charts should feel related to TradingView without copying its UI.

## Required qualities

* responsive
* interactive
* clean
* readable
* tooltips
* sensible axes
* clear legends
* timeframe controls where meaningful
* no unnecessary gradients
* no visual clutter
* consistent typography
* consistent DigiHouse tokens

---

## Chart interaction

Where appropriate:

* hover/tap tooltip
* selected data point
* timeframe selection
* legend toggles
* expandable chart
* horizontal scrolling where necessary

On mobile:

* touch-friendly
* full-width
* readable tooltips
* no tiny controls
* no desktop-only dense tables

---

# 20. VISUAL HIERARCHY

Not every metric deserves equal visual weight.

Priority:

### Level 1

* asset identity
* current state
* yield
* primary CTA
* price/funding context

### Level 2

* market/ownership/income information

### Level 3

* advanced statistics
* historical breakdowns
* secondary metrics

### Level 4

* technical/detail information

The page should remain understandable even if the user only reads Level 1.

---

# 21. INTERACTION REQUIREMENTS

The Property experience must feel like a real application, not a static Figma prototype.

Use the interaction primitives already introduced by the previous redesign work.

For mutations:

* confirmation where required
* loading state
* disabled CTA while pending
* success state
* error state
* retry where appropriate
* haptic feedback where already supported
* sheets must not silently disappear after important actions

Safe interactions may remain immediate:

* tabs
* filters
* chart timeframe
* navigation
* disclosure
* selection

Do not add confirmation dialogs to trivial interactions.

---

# 22. MOBILE REQUIREMENTS

Mobile is a first-class target.

The page must be designed for a narrow Telegram/WebView environment.

Requirements:

* horizontal-scroll tabs
* full-width charts
* compact KPI presentation
* readable tables
* touch-friendly controls
* bottom-sheet compatibility
* no desktop-only hover dependency
* chart tooltips must work through touch
* avoid excessive nested scrolling

The user should never feel that a desktop dashboard was squeezed onto a phone.

---

# 23. DESIGN SYSTEM COMPLIANCE

`DESIGN_SYSTEM.md` remains the visual authority.

Do not override it casually.

Respect:

* typography
* spacing tokens
* system fonts
* flat visual language
* Telegram-native blocks
* existing component patterns
* existing colors
* existing radius/elevation rules

TradingView is an inspiration for:

> information architecture and analytical depth

It is NOT a visual copy target.

---

# 24. LOCALIZATION

All user-facing strings must use the existing localization system.

Do not introduce hard-coded English text.

New keys must be mirrored across all existing locales according to the repository's localization conventions.

Before completion:

* run locale key parity validation
* ensure no missing keys
* ensure no obvious hard-coded strings remain in the redesigned flow

---

# 25. ACCESSIBILITY

Ensure:

* semantic labels
* sufficient contrast
* keyboard/focus behavior where applicable
* chart descriptions or accessible summaries where practical
* buttons have meaningful labels
* status is not communicated through color alone

---

# 26. PERFORMANCE

Analytics must not make Property unusably heavy.

Prefer:

* lazy loading for advanced analytics
* memoized selectors
* deterministic static datasets
* efficient chart rendering
* avoiding unnecessary re-renders

Do not introduce a large dependency solely for one visualization if the existing stack can support it.

---

# 27. PHASE EXECUTION PLAN

The Agent MUST execute phases sequentially.

**NEVER automatically start the next phase.**

After every phase:

```text
IMPLEMENT
→ TEST
→ LINT
→ TYPECHECK
→ BUILD where appropriate
→ AUDIT
→ REPORT
→ STOP
```

The next phase requires explicit instruction.

---

# PHASE 0 — AUDIT & ARCHITECTURE

### Goal

Understand the existing Property implementation before modifying it.

### Tasks

* inspect current Property page
* inspect all Property components
* inspect Primary/Secondary logic
* inspect existing market data
* inspect ownership data
* inspect income/yield data
* inspect mock repositories
* inspect existing chart infrastructure
* inspect design system
* inspect localization
* identify reusable components
* identify data gaps
* map current buy/lock/sell interactions

### Deliverable

Create/update the implementation plan with:

* current architecture
* proposed architecture
* data availability matrix
* simulated-data requirements
* component dependency map
* risk list

### Restrictions

No production/business logic changes.

### STOP

Do not implement Phase 1 automatically.

---

# PHASE 1 — PROPERTY FOUNDATION

### Goal

Build the structural foundation.

Implement:

* redesigned header
* status
* KPI area
* Primary/Secondary branching
* tab architecture
* responsive foundation

Do not implement all analytics yet.

### Acceptance criteria

* Primary and Secondary visibly behave differently
* no fake price chart for Primary
* existing financial actions still work
* mobile layout works
* existing design system is respected

### Validation

* tests
* lint
* typecheck
* build

### STOP

---

# PHASE 2 — PRIMARY OVERVIEW

Implement:

* funding visualization
* funding metrics
* calculator integration
* property fundamentals
* trust section
* Primary-specific information hierarchy

Remove/avoid:

* Primary price chart
* fake market behavior
* unnecessary urgency cues

### STOP after validation.

---

# PHASE 3 — SECONDARY OVERVIEW

Implement:

* market summary
* order book
* recent trades
* position card
* lock/sell actions
* Secondary-specific hierarchy

Do not alter financial logic.

### STOP after validation.

---

# PHASE 4 — ANALYTICS DATA FOUNDATION

Before building the full chart suite:

Create the shared deterministic analytics datasets.

Implement data structures/selectors for:

* price history
* OHLC
* volume
* trades
* holders
* ownership history
* funding history
* income history
* property metrics

Generate approximately 6–12 months of coherent simulated data for properties requiring it.

### Critical requirement

All charts must derive from these shared datasets.

Do not create chart-specific random data.

### Validation

Add data integrity tests:

* percentages
* totals
* dates
* consistency
* final/current state alignment

### STOP.

---

# PHASE 5 — PERFORMANCE / MARKET ANALYTICS

### Primary

Implement:

* Funding Progress Over Time
* Cumulative Shares Sold
* Yield Projection where supported

### Secondary

Implement:

* price chart
* timeframe selector
* volume
* yield performance
* optional overlays

### STOP after validation.

---

# PHASE 6 — HOLDER ANALYTICS

Implement all required ownership visualizations:

1. Token Holder Distribution — Donut
2. Top Token Holders — Horizontal Bar
3. Ownership Treemap
4. Token Distribution Over Time — Stacked Area
5. Token Holder Bubble Chart
6. Holder Statistics

All must use the shared holder dataset.

### STOP after validation.

---

# PHASE 7 — INCOME ANALYTICS

Implement:

* income history chart
* cumulative yield
* payout history
* projections
* real-estate ratios
* optional revenue breakdown

Do not change existing financial calculations.

### STOP after validation.

---

# PHASE 8 — DETAILS & FINAL POLISH

Implement/refine:

* About
* Documents
* location
* map
* similar properties
* media
* responsive polish
* animations
* loading states
* empty states
* error states
* localization
* accessibility
* performance

### STOP after validation.

---

# PHASE 9 — FINAL QA

Perform a complete Property-only audit.

Verify:

## Primary

* fixed price
* no price-performance chart
* funding analytics
* funding history
* ownership analytics
* income analytics
* calculator
* CTA
* responsive behavior

## Secondary

* market price
* price history
* volume
* order book
* trades
* holders
* ownership history
* income
* position
* lock/sell
* responsive behavior

## Shared

* tabs
* localization
* loading
* errors
* empty states
* accessibility
* interaction feedback
* no hard-coded strings
* no broken navigation

Run:

* lint
* typecheck
* all relevant tests
* build

Then produce a final audit report.

---

# 28. GIT / CHECKPOINT POLICY

The Agent MUST NOT:

* push automatically
* merge automatically
* rebase automatically
* switch branches automatically
* overwrite unrelated work

Preferred checkpoint behavior:

After a successfully validated phase, create a local commit only if explicitly authorized by the current workflow.

Recommended commit pattern:

```text
redesign(property): phase 1 foundation
redesign(property): phase 2 primary overview
redesign(property): phase 3 secondary overview
...
```

Never bundle unrelated work into a Property redesign commit.

---

# 29. FAILURE / BLOCKER POLICY

If the Agent encounters:

* missing data
* unclear business logic
* architectural conflict
* unexpected existing behavior
* required API changes
* migration requirements
* financial logic dependency
* design-system conflict
* security concern

it MUST stop and report.

It MUST NOT invent a solution that changes business truth.

For simulated presentation data, the Agent may proceed only when the requirement is explicitly covered by this specification.

---

# 30. DEFINITION OF DONE

The redesign is complete only when:

### Product

The Property page feels like a professional tokenized-real-estate asset platform.

### Primary

Feels like:

> Funding + ownership + income opportunity.

### Secondary

Feels like:

> Market + ownership + performance + income.

### Analytics

The user can explore:

* funding
* price
* volume
* holders
* ownership distribution
* ownership changes over time
* income
* yield
* property fundamentals

### Required ownership charts exist

* Donut
* Gauge
* Top Holder Bar
* Treemap
* Stacked Area
* Bubble Chart

### Data

* shared
* deterministic
* internally consistent
* 6–12 months where required
* clearly simulated where applicable
* replaceable with real data later

### UX

* interactive
* responsive
* mobile-first
* no prototype-like dead buttons
* meaningful loading/success/error states
* no unnecessary confirmations

### Safety

No changes to:

* settlement
* ownership truth
* financial accounting
* yield logic
* fees
* withdrawal logic
* NFT logic
* wallet security

### Engineering

* tests pass
* lint passes
* typecheck passes
* build passes
* localization passes
* no unrelated modifications

---

# 31. FINAL PRODUCT VISION

The finished Property experience should not feel like:

> "Here is a property and a Buy button."

It should feel like:

> "Here is a real asset. I can understand its funding, market, ownership, income, performance, and fundamentals — and I can decide what to do."

Primary should communicate **opportunity and funding progression**.

Secondary should communicate **market intelligence and asset performance**.

The analytical layer should provide enough depth that an experienced user can spend meaningful time exploring the asset, while the hierarchy remains simple enough that a first-time investor is never lost.

**Depth belongs behind structure.
Complexity must never become confusion.
Data must always tell one coherent story.**

---

# 32. AGENT OPERATING INSTRUCTION

When this document is introduced into the repository:

1. Read this entire document.
2. Read `DESIGN_SYSTEM.md`.
3. Inspect the existing Property implementation.
4. Determine the current phase.
5. Execute ONLY the current phase.
6. Do not start a later phase automatically.
7. Preserve all unrelated work.
8. Never modify financial/business truth for visual convenience.
9. Use shared deterministic datasets for simulated analytics.
10. Validate before reporting completion.
11. Report exactly:

* what changed
* what did not change
* files changed
* tests
* lint
* typecheck
* build
* known limitations
* next phase

12. STOP.

**Explicit rule: A successful phase is a checkpoint, not permission to continue.**
