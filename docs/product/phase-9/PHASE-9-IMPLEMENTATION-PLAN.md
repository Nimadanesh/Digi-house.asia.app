# FractionalLuxe — Phase 9 Implementation Plan

**Branch:** `phase-9-redesign`  
**Baseline:** commit `1b8e065eda74be7173917c84e425e9001c118160`  
**Mode:** Trackable, reversible, checkpointed implementation  
**Rule:** No coding agent may implement the entire Phase 9 in one pass.

## 0. Operating model

Every phase task follows:

`Audit → Plan → Implement → Test → Playwright/Visual QA → Review → Commit`

A task is not complete because the code compiles. It is complete only when its acceptance checks pass.

### Status vocabulary

- `NOT STARTED`
- `AUDIT`
- `READY`
- `IN PROGRESS`
- `QA`
- `BLOCKED`
- `ACCEPTED`
- `REJECTED`

### Change policy

- Work only on `phase-9-redesign` until explicit approval to merge.
- Never force-push.
- Never rewrite history.
- Prefer small commits per milestone.
- Do not mix unrelated cleanup with Phase 9.
- Preserve existing routes and business logic unless the task explicitly authorizes a change.
- If required data is unavailable, stop and report the gap; do not invent production semantics.

---

# 1. Baseline Audit — 9.0

**Status:** AUDIT  
**Goal:** establish exact current implementation mapping before UI changes.

## Audit targets

### App routes

- [ ] `src/app/(app)/home`
- [ ] `src/app/(app)/marketplace`
- [ ] `src/app/(app)/property`
- [ ] `src/app/(app)/portfolio`
- [ ] `src/app/(app)/earnings`
- [ ] app layout/navigation
- [ ] onboarding/profile/settings dependencies

### Components

- [ ] `src/components/home`
- [ ] `src/components/marketplace`
- [ ] `src/components/property`
- [ ] `src/components/portfolio`
- [ ] `src/components/earnings`
- [ ] `src/components/layout`
- [ ] `src/components/documents`
- [ ] transaction/money components

### Data/contracts

- [ ] property types
- [ ] portfolio/holding types
- [ ] earnings types
- [ ] marketplace data source
- [ ] mock vs API behavior
- [ ] primary vs resale state
- [ ] locked/free semantics
- [ ] existing rental-income semantics
- [ ] existing payout/withdrawal semantics

### Existing QA

- [ ] Phase 8 property audits
- [ ] Playwright scripts
- [ ] screenshots
- [ ] component tests
- [ ] viewport assumptions

## Audit deliverable

Update this document's **Current-State Matrix** below and do not write UI code during 9.0.

---

# 2. Current-State Matrix

| Surface | Current route | Existing implementation | Phase 9 action | Risk | Status |
|---|---|---|---|---|---|
| Home | `/home` | home components + payout/value/property sections | Refactor hierarchy | Medium | AUDIT |
| Estates | `/marketplace` | search/filter/cards | Rename/reframe | Low | AUDIT |
| Estate Detail | `/property/[id]` | gallery/hero/metrics/tabs/funding/market/income/trust/docs/buy/sell | Major refactor | High | AUDIT |
| My Estates | `/portfolio` | summary/allocation/holdings/locked/free/orders/export | Reframe | Medium | AUDIT |
| Income | `/earnings` | total/chart/timeline/yield/withdraw | Reframe to rental income | High | AUDIT |
| Resale | secondary market in property/portfolio | market/order components | Reframe | High | AUDIT |
| Owner Stay | no established first-class route found in baseline | capability gap | New P1/P0 preview | High | AUDIT |
| Navigation | app layout | existing bottom nav | Rename labels, preserve routing | Medium | AUDIT |

---

# 3. Milestone 9.1 — Navigation + Information Architecture

**Status:** NOT STARTED  
**Priority:** P0  
**Goal:** change the mental model without route migration.

## Scope

- [ ] visible nav labels: Home / Estates / Income / My Estates
- [ ] preserve existing technical routes
- [ ] verify active state
- [ ] verify Telegram back behavior
- [ ] update relevant i18n keys
- [ ] update accessibility labels
- [ ] no unrelated shell redesign

## Acceptance

- [ ] all four tabs open correct existing route
- [ ] no route regressions
- [ ] labels do not say Marketplace / Earnings / Portfolio in primary UI
- [ ] 480×840 visual audit passes

## Checkpoint

Commit only after QA. Suggested message: `feat(phase9): align ownership navigation`

---

# 4. Milestone 9.2 — Estate Detail

**Status:** NOT STARTED  
**Priority:** P0 / highest product priority  
**Goal:** make the property detail screen the central ownership + rental-economics experience.

## Preserve

- gallery
- hero mechanics
- property metrics
- existing tab infrastructure where useful
- funding panel
- market/secondary logic
- income calculator
- trust/documents
- buy/sell sheets
- TON transaction path
- MainButton/BackButton behavior

## Refactor

- [ ] tabs → Estate / Income / Ownership / Details
- [ ] property-first hero hierarchy
- [ ] Ownership Snapshot
- [ ] rental performance explanation
- [ ] actual/projected labeling
- [ ] owner-stay preview
- [ ] verification layer
- [ ] professional management presentation

## New data requirements

- [ ] rental revenue
- [ ] occupancy
- [ ] operating costs
- [ ] net distributable income
- [ ] ownership ratio
- [ ] distribution status
- [ ] verification status
- [ ] management state
- [ ] owner-stay state

## Acceptance

- [ ] user can identify the estate before financial metrics dominate
- [ ] rental economics is explainable
- [ ] no unsupported financial values are fabricated
- [ ] existing buy flow still works
- [ ] primary vs resale behavior remains correct
- [ ] sticky CTA behavior remains correct
- [ ] Playwright + 480×840 visual review passes

## Checkpoint

Suggested commit: `feat(phase9): redesign estate detail ownership experience`

---

# 5. Milestone 9.3 — Home + My Estates

**Status:** NOT STARTED  
**Priority:** P0

## Home

- [ ] ownership-first hero
- [ ] next rental distribution
- [ ] featured estate
- [ ] max 3 additional opportunities
- [ ] trust footer

## My Estates

- [ ] ownership collection hero
- [ ] estate position cards
- [ ] rental income per estate
- [ ] owner-stay availability
- [ ] liquidity status
- [ ] position detail sheet
- [ ] ownership allocation wording
- [ ] pending ownership transactions
- [ ] ownership statement export

## Acceptance

- [ ] Home leads to ownership/discovery
- [ ] My Estates clearly distinguishes ownership from income
- [ ] locked/free states are explained
- [ ] all existing portfolio actions remain functional
- [ ] Playwright + 480×840 visual review passes

## Checkpoint

Suggested commit: `feat(phase9): redesign home and my estates`

---

# 6. Milestone 9.4 — Income

**Status:** NOT STARTED  
**Priority:** P0

## Scope

- [ ] rename Earnings → Income
- [ ] rental-income hero
- [ ] monthly chart
- [ ] actual/projected distinction
- [ ] income timeline
- [ ] income by estate
- [ ] withdrawal transparency
- [ ] statement foundation if data exists

## Financial invariant

The active payout business rule remains authoritative. If current product rule is monthly accrual + 1% withdrawal fee + four weekly installments, UI must represent that accurately and must not silently replace it with weekly accrual.

## Acceptance

- [ ] no misleading APY-first presentation
- [ ] actual vs projected values distinguishable
- [ ] withdrawal fee/schedule visible before confirmation
- [ ] withdrawal behavior unchanged
- [ ] tests + visual QA pass

## Checkpoint

Suggested commit: `feat(phase9): redesign rental income experience`

---

# 7. Milestone 9.5 — Resale

**Status:** NOT STARTED  
**Priority:** P1

## Scope

- [ ] visible terminology becomes Resale
- [ ] resale filter/entry point
- [ ] resale estate card
- [ ] resale detail
- [ ] seller flow for eligible free shares
- [ ] buyer flow
- [ ] clear locked/free constraints

## Acceptance

- [ ] no exchange/trading mental model in primary UI
- [ ] secondary purchase still uses real order/transaction infrastructure
- [ ] ineligible locked shares cannot be offered
- [ ] price/ownership information is clear
- [ ] QA passes

## Checkpoint

Suggested commit: `feat(phase9): reframe secondary market as resale`

---

# 8. Milestone 9.6 — Owner Stay

**Status:** NOT STARTED  
**Priority:** P1 after core ownership surfaces

## Scope

- [ ] owner-stay entitlement model
- [ ] entry points from Estate Detail and My Estates
- [ ] calendar states
- [ ] rules disclosure
- [ ] stay request sheet
- [ ] optional concierge request entry

## Important scope boundary

Do not build a full hospitality marketplace. Concierge should be a lightweight request/integration surface until an actual operating partner contract and backend capability exist.

## Acceptance

- [ ] only eligible ownership positions see actionable stay rights
- [ ] entitlement and restrictions are explicit
- [ ] request is not presented as confirmed booking until confirmed by the operating process
- [ ] no invented availability

## Checkpoint

Suggested commit: `feat(phase9): introduce owner stay experience`

---

# 9. Milestone 9.7 — Cross-Surface QA

**Status:** NOT STARTED  
**Priority:** P0 before merge

## Required screens

- [ ] Home
- [ ] Estates
- [ ] Estate Detail — primary
- [ ] Estate Detail — resale
- [ ] My Estates
- [ ] Income
- [ ] Buy flow
- [ ] Resale flow
- [ ] Owner Stay
- [ ] loading states
- [ ] error states
- [ ] empty states

## Required viewport

`480 × 840` Telegram WebView target.

## Required checks

- [ ] screenshots
- [ ] geometry/computed-style audit
- [ ] horizontal overflow
- [ ] bottom safe-area spacing
- [ ] sticky CTA
- [ ] Telegram BackButton
- [ ] sheet open/close
- [ ] navigation
- [ ] keyboard/input behavior where applicable
- [ ] accessibility labels
- [ ] regression tests

---

# 10. Product Acceptance Gate

Phase 9 may be proposed for merge only when:

- [ ] every P0 milestone is `ACCEPTED`
- [ ] no P0 item is `BLOCKED`
- [ ] no known business-rule contradiction remains
- [ ] no unsupported data is presented as real
- [ ] existing TON purchase behavior passes regression
- [ ] withdrawal behavior passes regression
- [ ] primary/resale distinction passes regression
- [ ] 480×840 review passes
- [ ] final screenshots are archived
- [ ] implementation notes are updated

---

# 11. Rollback / Stop Rules

Stop implementation and report instead of guessing if:

1. required backend data does not exist;
2. current business rules conflict with the redesign;
3. a component's ownership/financial semantics are unclear;
4. a route migration appears necessary;
5. a change breaks an existing transaction path;
6. Playwright reveals a regression that is not isolated;
7. the coding agent proposes unrelated refactoring.

Rollback to the last accepted milestone rather than patching multiple unrelated changes together.

---

# 12. Agent Handoff Template

For each milestone, give the coding agent only the relevant task plus this contract:

> Read `docs/product/phase-9/PHASE-9-PRODUCT-REDESIGN.md` and this implementation plan first. Inspect the existing implementation before editing. Implement only the requested milestone. Preserve existing routes, business rules, Telegram behavior and transaction semantics. Do not invent missing data. Do not perform unrelated refactors. Run relevant tests. Run the existing Playwright/visual audit where applicable. Report changed files, tests run, screenshots/audit results, known limitations and commit-ready status. Do not merge to `main`.

---

# 13. Progress Log

| Date | Milestone | Result | Commit | Notes |
|---|---|---|---|---|
| 2026-08-31 | 9.0 documentation baseline | READY FOR AUDIT | `93e02fc` | Product Spec added; implementation plan added next |
| 2026-08-31 | 1 — P0 Foundation / Contract | ACCEPTED | `e4af750` | Branch `phase-9-redesign`; pushed / synced with `origin`; tests 522/522; typecheck clean; lint 0 errors (existing warnings + noted `_propertyId` warning); financial regression none; scope compliance PASS; Slice 2 NOT STARTED |

**Next action:** execute **Slice 2 — Estate Detail** (highest product priority) after Slice 1 acceptance.
