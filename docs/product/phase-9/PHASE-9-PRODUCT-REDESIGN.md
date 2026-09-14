# FractionalLuxe — Phase 9 Product Redesign

**Status:** Approved product direction; implementation not started  
**Branch:** `phase-9-redesign`  
**Viewport target:** Telegram Mini App, 480px-first  
**Primary objective:** evolve the existing investment dashboard into a premium fractional-estate ownership experience without breaking current routes, TON transaction flows, or locked business rules.

## 1. Product North Star

The user should think:

> I own part of this villa.

Then:

> My ownership participates in rental income.

Then:

> I have real owner privileges.

And finally:

> I can access liquidity when eligible.

FractionalLuxe owns the **ownership layer**. Hospitality/rental partners own the **guest-experience layer**. The villa is the shared asset.

## 2. Non-negotiable principles

- Property identity precedes financial metrics.
- Rental income must have a visible source: revenue → operating costs → net distributable income → ownership → distribution.
- Actual, accrued and projected amounts must never be visually conflated.
- TON is settlement infrastructure, not the product narrative.
- No speculative/trading-terminal aesthetic, crypto neon, fake urgency or yield-first hierarchy.
- One dominant CTA per screen.
- Preserve existing Telegram BackButton/MainButton, haptics, sheets and safe-area behavior unless a Phase 9 task explicitly requires change.
- Preserve current business rules unless a separate approved business decision changes them.

## 3. Navigation / route semantics

Keep technical routes initially; change visible product language:

| Existing route | Phase 9 label | Purpose |
|---|---|---|
| `/home` | Home | Ownership overview + discovery |
| `/marketplace` | Estates | Curated estate discovery |
| `/property/[id]` | Estate Detail | Property + ownership + rental economics |
| `/portfolio` | My Estates | User's ownership collection |
| `/earnings` | Income | Rental distributions |

Do not introduce route migrations merely for naming.

## 4. Global shell

- Keep current 480px mobile-first canvas.
- Bottom navigation: **Home / Estates / Income / My Estates**.
- Use property/house iconography rather than exchange/trading iconography.
- Keep existing loading, error, empty and Telegram interaction patterns.

# 5. Home

### Goal
Answer: what do I own, what income is happening, and what estate should I explore?

### Layout order

1. Header / profile access
2. **Your Estates** ownership hero
3. **Next Distribution**
4. **Featured Estate**
5. **More Estates** (max 3 cards)
6. Trust footer

### Ownership hero

Data:
- current ownership value
- invested capital
- YTD rental income
- number of estates
- optional value change only when trustworthy

CTA: **View My Estates**

### Next Distribution

Show amount + status + period. Use `Expected`, `Accrued`, or `Paid` correctly. Never imply guaranteed income.

### Featured Estate

Card hierarchy:
- premium image
- estate name + destination
- entry/share price
- projected rental income
- owner-stay entitlement
- verification
- **View Estate**

### Trust footer

Use the existing trust footer as the base. Upgrade copy toward property documentation, valuation, rental information and operating structure.

# 6. Estates

Existing Marketplace becomes the visible **Estates** experience. Preserve search/filter/card infrastructure where possible.

### Header
**Estates**  
**Own a share of exceptional properties.**

### Search
Search villas, destinations or regions.

### Filters
`All / Featured / New / Income / Owner Stay / Resale`

Optional later: beach, mountain, city.

### Default sort
**Curated**. Optional: rental income, entry price, newest, owner privileges.

Do not default to highest yield.

### Estate Card

Show:
- property image
- verified state when available
- estate name / destination / property type
- price per share
- ownership fraction represented by one share
- availability for primary offerings
- rental-income metric
- owner-stay entitlement

Whole card opens detail. Avoid Buy buttons on every card.

# 7. Estate Detail

This is the highest-priority Phase 9 screen.

Existing Property Detail infrastructure should be refactored rather than rebuilt where practical: gallery, hero, metrics, tabs, funding, market, position, income calculator, trust, documents, similar properties, buy/sell sheets and Telegram CTA behavior.

### New visible tab model

`Estate / Income / Ownership / Details`

Existing Performance content moves into Income or Ownership. Existing Holders content moves into Ownership. Do not expose a stock-exchange mental model.

### Hero

- full-width premium image
- estate name
- destination
- compact property facts
- verified state
- ownership proposition
- share price
- primary CTA

CTA states:
- non-owner primary: **Acquire Ownership**
- owner: **Manage Ownership**
- resale: **Acquire Resale Ownership**
- sold-out primary: **View Resale Opportunities**

### Ownership Snapshot — P0

Show:
- user's ownership %
- shares owned
- current value
- average acquisition cost
- free shares
- locked shares

### Rental Performance — P0

Show:
- gross rental revenue
- occupancy
- operating costs
- net distributable income
- user's ownership ratio
- projected/actual distribution

Every projected number must be explainable.

### Rental chart

12-month rental performance. Clearly distinguish actual from projected data.

### Rental calendar — P1

Monthly occupancy/revenue view. Add only when reliable rental data exists.

### Owner Stay — P0 preview

For owners:
- annual entitlement
- used
- remaining
- booking window
- CTA: **View Owner Calendar**

For non-owners: explain that designated owner-use periods are an ownership privilege.

Rules must be explicit: blackout dates, minimum stay, booking window, notice, guest policy, fees, cancellation and revenue treatment.

### Trust / verification — P0

Show property documentation, valuation, rental history, management and ownership structure with verification state and last verified date.

### Management

Present the professional operating/rental partner without implying FractionalLuxe is replacing hospitality operators.

### Due diligence

Keep existing documents infrastructure. Surface property docs, valuation, rental history, management agreement and ownership structure.

# 8. Buy flow

Preserve current TON/USDT transaction implementation.

Change hierarchy:

1. **How much would you like to own?**
2. Show shares + ownership % + investment amount.
3. Show projected annual rental income with clear assumptions.
4. Show owner-stay entitlement.
5. Review.
6. Secure ownership / TON payment.
7. Ownership confirmation.

Success screen should celebrate ownership, not a crypto transaction.

# 9. My Estates

Existing Portfolio becomes **My Estates**. Preserve summary, allocation, holdings, locked/free shares, open orders and statement/export capabilities.

### Hero

- current ownership value
- estate count
- total ownership where meaningful
- YTD rental income

CTA: **View Income**

### Estate Position Card

- image
- estate / destination
- ownership %
- current value
- rental income YTD
- owner-stay availability
- **Manage Estate**

### Position sheet

Sections:
- Your position
- Rental income
- Owner privilege
- Liquidity

CTAs: **Plan a Stay / View Income / Resell Ownership**

### Locked/free shares

Explain the meaning in plain language. Free shares can be eligible for resale; locked shares cannot be offered when business rules prohibit it.

### Open orders

Visible label: **Pending ownership transactions**.

### Export

Visible label: **Download ownership statement**.

# 10. Income

Existing Earnings becomes **Income** and is explicitly rental-income oriented.

### Hero

- total received
- latest distribution
- next projected distribution

Avoid APY as the hero metric.

### Chart

Monthly rental income, 6/12/all months. Actual and projected states are visually distinct.

### Income timeline

Each event shows estate, period, amount and status: Paid / Accrued / Projected.

### Income by Estate — P0

Break total income down by estate and link to estate detail.

### Rental statement — P1

Show gross rental revenue, operating costs, net distributable income, user's ownership and resulting distribution.

### Withdrawal

Keep current withdrawal mechanics. Before confirmation show available balance, 1% withdrawal fee and the current four-weekly-installment payout schedule if that is the active business rule. Do not silently change payment semantics.

# 11. Resale

Visible term: **Resale**, never Trading/Exchange.

### Entry points
- Estates filter: Resale
- Estate Detail: View resale opportunities
- My Estates: Resell ownership

### Resale card

- estate image/name
- ownership offered
- asking price
- acquisition reference when appropriate
- rental income YTD/history
- owner-stay rights
- verified ownership state

### Seller flow

Select eligible free shares → set asking price → review → publish.

Clearly distinguish free vs locked shares.

### Buyer flow

Resale → Estate → ownership details → rental history → owner rights → **Acquire Resale Ownership**.

Do not introduce speculative price charts unless there is a real, supported secondary-market use case.

# 12. Owner Stay

First-class owner utility, but keep Phase 9 scope controlled.

### Entry points
- Home ownership card
- My Estates
- Estate Detail

### Calendar

States: Available / Requested / Confirmed / Unavailable / Blackout / Rental booking.

### Request flow

Dates → guests → optional concierge services → review → **Request Stay**.

Optional services can include chef, transfer, yacht, spa and driver. Do not build a full hospitality marketplace in P0.

### Confirmation

Show estate, dates, owner nights and additional services; confirm that request/availability status is not the same as a guaranteed booking.

# 13. Data requirements

Phase 9 needs these concepts represented by real data or explicit unavailable states:

- estate identity and imagery
- property value / share price / total shares / availability
- primary vs resale status
- rental revenue, occupancy, operating costs and net distributable income
- historical monthly rental metrics
- verification states + last verified date
- management partner state
- ownership distribution
- user position: shares, ratio, cost, value, locked/free
- rental distributions: projected/accrued/paid
- owner-stay entitlement, usage, blackout/rules

Do not fabricate unavailable backend data merely to satisfy the UI.

# 14. Explicit non-goals

Do not add in Phase 9:

- DAO/governance
- leverage/lending
- yield farming/staking
- social trading/copy trading
- leaderboards
- NFT marketplace
- crypto price ticker as a hero element
- artificial scarcity/urgency

# 15. Definition of Done

### Product
- [ ] Property is understandable before financial metrics.
- [ ] Rental economics are explainable end-to-end.
- [ ] Actual/projected states are explicit.
- [ ] Owner Stay is visible for owners.
- [ ] Resale reads as ownership liquidity.
- [ ] Verification and management are visible.

### UX
- [ ] One dominant CTA per screen.
- [ ] Existing Telegram interaction patterns preserved.
- [ ] Loading/error/empty states preserved.
- [ ] 480px viewport remains first-class.

### Visual
- [ ] Photography is the primary luxury signal.
- [ ] No crypto-neon/trading-terminal styling.
- [ ] Financial UI is restrained and editorial.

### QA
- [ ] Playwright coverage for each redesigned screen.
- [ ] 480×840 visual review.
- [ ] Geometry/overflow audit.
- [ ] CTA/navigation interaction audit.
- [ ] Regression tests for buy/sell/withdraw behavior.
