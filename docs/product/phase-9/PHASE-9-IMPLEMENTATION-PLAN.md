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
| 2026-08-31 | 2 — Estate Detail | ACCEPTED WITH NON-BLOCKING FINDINGS | `f64d739` | 4-tab model Estate/Income/Ownership/Details; identity-first hero; resale demoted; Owner Stay P0 presentation-only (honest unavailable); buy-flow copy only (mechanics untouched); tests 520/520; `npm run check` green; e2e 4/4 @ 480×840; screenshots in `screenshots/phase9-slice2/` |
| 2026-09-01 | 3 — Home | ACCEPTED WITH NON-BLOCKING FINDINGS | `0298a68` | Ownership-first Home (Your Estates hero, Next Distribution labeled Expected, My Estates preview, Featured Estate without APY, More Estates, estates empty state); tests 526/526; `npm run check` exit 0; e2e home 2/2 + estate-detail regression 4/4 @ 480×840; screenshots in `screenshots/phase9-slice3/`; findings 1–4 below are deferred, not fixed |
| 2026-09-01 | 4 — Estates (`/marketplace`) | ACCEPTED WITH NON-BLOCKING FINDINGS | `dbe3be1` | Estates header (H1 + “Own a share of exceptional properties.”); search “Search villas, destinations or regions.”; filters exactly All/Featured/New/Income/Owner Stay/Resale; default sort **Curated** (stable manifest feed order — never highest yield) with Rental income/Entry price/Newest (owner-privileges sort omitted: no entitlement data); estate card: no APY, no scarcity badges, Price (or Last price on resale) + Projected income / share (honest “Data pending” chip, never 0), ownership fraction “1 share ≈ 1/N”, availability on primary only; Featured + Owner Stay filters render honest unavailable empty states (no fake matches — no featured flag or stay data exists); tests 539/539; `npm run check` exit 0 (lint 0 errors, 5 pre-existing warnings); e2e marketplace 4/4 + home 2/2 + estate-detail 4/4 + smoke-shell 4/4 @ 480×840; screenshots in `screenshots/phase9-slice4/`; no financial/route/shell/API changes; Slice 5 NOT STARTED. Independent acceptance audit: PASS — non-blocking findings (Curated-comment precision, frozen demo clock, nested FeeInfoButton, raw propertyType — all pre-existing/deferred; nav labels + pickFeaturedListing deferred to later slices) |
| 2026-09-01 | 5 — Income (`/earnings`) | ACCEPTED WITH NON-BLOCKING FINDINGS | `798acdc` | Reframes Earnings as **Income** (redesign §10 / UI Mapping §7) honoring the §7.3 weekly-vs-monthly conflict UX rules (status words only, never frequency promises): Income H1 + subtitle; hero “Received in total” (paid money only) + Next distribution labeled **Expected** (never “guaranteed”/“Est.”, pending entries only, hidden not $0); **NEW accrued block** (“Accrued, paid with next distribution”, lock accrued-unpaid from repo contract); chart keeps static 12-week bars (actual paid / projected pending two-tone) + **Paid/Projected legend** + the one honest alignment line (§7.3 rule 5); timeline becomes **Paid / Accrued / Expected** (period-claim captions “current month”/“Monthly accrual…” removed, Accrued row hidden when no lock data); **NEW income-by-estate** (paid-only per-estate totals → link to `/property/[id]`; estates without paid entries simply absent); withdrawal mechanics + locked copy untouched; empty-state copy de-periodized; tests 543/543; `npm run check` exit 0 (lint 0 errors, 5 pre-existing warnings); e2e income 2/2 + honesty 2/2 + home 2/2 + marketplace 4/4 + property-detail 4/4 + smoke-shell 4/4 @ 480×840 (portfolio 2/3 — 1 pre-existing stale copy test, portfolio = Slice 6 surface; money-path 6 skipped by design, no `BASE_URL`); screenshots in `screenshots/phase9-slice5/`; no financial/route/shell/API changes; Slice 6 NOT STARTED. Independent acceptance audit: PASS — non-blocking findings (chart keeps 12-week weekly bars vs §7.2 “monthly 6/12/all” — documented deviation rooted in the §7.3 [AUDIT-OVERRIDE] (monthly conversion of paid events violates rules 2–3), revisit on formal weekly-vs-monthly resolution; mixed paid+pending week buckets render in paid color (legend explains palette); bottom-nav label still “Earnings” vs H1 “Income” → Milestone 9.1. Pre-existing, not slice-caused: `portfolio.spec` stale copy test (Slice 6 surface), intermittent `PropertyDetail.test` async-chart `findByTestId` flake under parallel load (passes isolated + at 22bfcb8 + 4/4 full runs), 6 dead `earnings.*` keys, money-path `BASE_URL` gating) |

---

# 14. Session Checkpoint — end of session (2026-09-01)

- **Current phase:** Phase 9 — Product/UX Redesign (branch `phase-9-redesign`; spec docs in `docs/product/phase-9/`)
- **Last accepted slice:** **Slice 5 — Income (`/earnings`, ACCEPTED WITH NON-BLOCKING FINDINGS)** — accepted via independent acceptance audit (see §13 row 5); Slices 1–4 remain accepted (1 ACCEPTED; 2–4 ACCEPTED WITH NON-BLOCKING FINDINGS)
- **Last implemented & pushed slice:** **Slice 5 — Income (`/earnings`)** — commit `798acdc` — `feat(phase9): income (/earnings) rental-income redesign (slice 5)` — pushed; HEAD == `origin/phase-9-redesign`; working tree clean. **Status: ACCEPTED WITH NON-BLOCKING FINDINGS** (independent acceptance audit, see §13 row 5). Slice 4 acceptance docs commit: `a6b20b1`.
- **Independent audit confirmation (Slice 5, re-run by auditor):** git ground truth verified (branch `phase-9-redesign`, HEAD == `origin/phase-9-redesign` == `e4db4e1`, clean tree, `main` untouched); scope audit clean (29 files, all Slice-5: implementation/i18n/e2e/screenshots/tooling/checkpoint — zero financial/route/shell/API/package changes); unit 543/543 (89 files; 4 consecutive full runs — one intermittent pre-existing `PropertyDetail.test` async-chart flake under parallel load, passes isolated + at 22bfcb8 + on re-runs); `npm run check` exit 0 (lint 0 errors, 5 pre-existing warnings); typecheck clean; production build pass; e2e income 2/2 + earnings-honesty 2/2 + home 2/2 + marketplace 4/4 + property-detail 4/4 + smoke-shell 4/4 @ 480×840 (portfolio 2/3 — confirmed pre-existing stale copy test, portfolio files untouched by Slice 5); screenshot `screenshots/phase9-slice5/income-primary.png` verified 480×840; data-honesty trace: every displayed number paid/pending/accrued-labeled correctly, no weekly→monthly conversion anywhere on the surface; `earnings-honesty.spec.ts` rewrite analyzed (old spec asserted a string the earnings page deliberately never renders — pre-existing guaranteed failure — new spec hard-fails 4 forbidden patterns incl. “guaranteed” and asserts §7.3 status words/alignment line; no contract violation masked; demo disclosure persists via global `DemoModeBadge`); i18n 12/12 parity (36 keys), removed keys referenced nowhere, only the 6 pre-existing dead keys remain; no financial/route/shell/API changes
- **Next task:** **Slice 6 — My Estates** — ownership collection per `PHASE-9-PRODUCT-REDESIGN.md` §11 and UI Mapping §8; do not revisit Slices 1–5; preserve existing API/mock contracts and all Telegram shell behavior
- **Slice 6 must NOT start automatically.** The next session must first verify git state (HEAD == `origin/phase-9-redesign`), then start Slice 6 ONLY after Slice 5 is formally ACCEPTED per `PHASE-9-IMPLEMENTATION-CONTRACT.md` §2 (mandatory dependency order).

### Deferred findings carried forward (do NOT fix opportunistically during Slice 6)

1. `pickFeaturedListing` (`src/lib/home-featured.ts`) still ranks open listings by APY — a pre-existing selection heuristic, **not rendered** in Home UI. **Slice 4 investigation outcome:** no featured flag or editorial ranking exists in any data layer (Listing type, mock seed, 24-property manifest). The redesign's Curated default sort is therefore implemented as the stable manifest feed order (the only truthful editorial artifact), and the Estates *Featured* filter renders but matches nothing, showing the honest “Featured curation is not available yet.” empty state — the same treatment the docs prescribe for Owner Stay. `pickFeaturedListing` itself was NOT changed (Home surface, out of Slice 4 scope); replacing it needs a real featured flag/rank, which does not exist — deferred to a future data-model task.
2. Naive `{count}` interpolation renders “1 estates” when exactly one estate is owned (copy nit only).
3. Dead `src/components/home/NextPayoutCard.tsx` still references the removed `home.nextPayout` key; it is never imported or rendered. Do NOT casually clean it during Slice 6.
4. Home “rental income YTD” = paid/settled demo income (`totalEarningsUsd`, paid entries only). Never reinterpret it as expected/projected income.
5. **Slice 5 (documented deviation):** the Income chart stays the static 12-week weekly-bar presentation (actual paid vs projected pending two-tone) rather than UI Mapping §7.2's “monthly 6/12/all bars” — converting paid weekly amounts into monthly bars would attach a non-authoritative frequency to paid events, violating §7.3 rules 2–3 (the mapping itself flags the conflict). Revisit only when the weekly-vs-monthly payout conflict is formally resolved (A4 / audit §11/§13).
6. **Slice 5 (pre-existing, not caused by slice):** `e2e/tests/portfolio.spec.ts` “shows holdings or empty state” checks copy (“Explore Marketplace”/“No holdings”/“My Properties”) that the current portfolio page does not render (it shows “Your portfolio is empty” / holdings table). Portfolio is **Slice 6 (My Estates)**'s surface — fix it there or at Cross-surface QA (Slice 10).
7. **Slice 5 (pre-existing, by design):** `e2e/tests/money-path-1.spec.ts` and `money-path-2.spec.ts` skip unless a seeded `BASE_URL` is provided (`skipIfNoBaseUrl`) — not a failure.
8. Bottom-nav labels (Marketplace/Earnings/Portfolio) remain the pre-Phase-9 terminology — Milestone 9.1 (Navigation) surface. The Income page H1 now says “Income” while the tab still says “Earnings” (same pattern as Estates vs Marketplace).

### Tooling note

`npm run check` lint can be polluted by generated Playwright trace bundles under `e2e/reports/trace/assets/*.js` after a failing/retried e2e run (gitignored artifacts, not source errors). Slice 4's check ran clean. Do not fix lint config unless it actually blocks the assigned Slice 5 work.
