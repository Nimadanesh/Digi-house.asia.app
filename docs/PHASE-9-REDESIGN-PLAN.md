# FractionalLuxe — Phase 9 Redesign Execution Plan

## Purpose

This document is the single execution plan for Phase 9. The coding agent must execute it sequentially, one small slice at a time. The user should not need to provide new prompts between slices.

The goal is a coherent, trustworthy, production-ready prototype for a first-time buyer—not a collection of partially applied redesigns.

## Operating rules

1. Read this document completely before starting.
2. Work only on the current slice. Do not implement future slices early.
3. Every slice must be independently stoppable and leave the repository buildable.
4. Before changing code, inspect the existing implementation and identify the smallest safe change.
5. Do not replace canonical data with fixtures, invented values, or new parallel models.
6. Rental Escapes is authoritative only for property identity: name, location, listing ID, nightly rate, and images.
7. `ESTATE-24-DATA.json` is the canonical FractionalLuxe economic input. The research dataset and legacy `prop-*` fixtures are evidence only.
8. Preserve provenance: `OBSERVED`, `ESTIMATED`, `DERIVED`, `CONFLICTED`, `UNKNOWN`.
9. Never imply real users, real transactions, real payouts, legal title, or a Rental Escapes partnership.
10. A slice is not complete until logic/scope QA and full Design/UI QA pass at 480×840, including layout, spacing, hierarchy, consistency, i18n, raw keys, RTL, responsive behavior, and polish.
11. Do not report PASS when a known issue is merely documented rather than fixed or explicitly blocked.
12. After each slice, update this document's status section and create a commit with a clear slice-specific message.

## Definition of a successful final outcome

A first-time visitor can understand, without prior explanation:

- what FractionalLuxe is;
- which villas are available;
- whether they are viewing primary offering or secondary market;
- what one share costs and what the displayed income means;
- which numbers are observed, estimated, derived, conflicted, or unknown;
- what happens when they tap Buy, Invest, or Sell;
- which actions are demo-only;
- how ownership, funding, and order-book numbers relate;
- that the product is a prototype and not a legal ownership or guaranteed-yield product.

## Execution sequence

### Slice 0 — Baseline and recovery checkpoint

**Goal:** establish a safe baseline before redesign work.

Tasks:
- inspect current branch, status, recent commits, and existing Phase 9 work;
- run the existing test, typecheck, lint, build, and available E2E commands;
- record failures without broad refactoring;
- identify the actual app entry points and current data sources;
- confirm the 24 canonical properties are present and traceable;
- create a short baseline report in `docs/PHASE-9-BASELINE.md`.

Deliverable: reproducible baseline and list of blockers.

### Slice 1 — Complete marketplace truth audit

**Goal:** produce a complete map before fixing anything.

Audit all 24 villas across marketplace cards, property detail, primary offering, secondary market, buy flow, ownership/portfolio, and order book.

For every villa record:
- canonical identity source;
- card price source;
- detail price source;
- primary price and secondary price;
- monthly income source and formula;
- valuation source;
- total, sold, remaining, and funded shares;
- progress percentage;
- status and availability;
- every `Data pending` occurrence and exact reason;
- CTA behavior;
- fixture/demo/derived/canonical classification;
- contradictions between surfaces.

Do not change product behavior in this slice. Deliver an auditable table and prioritized defect list.

### Slice 2 — One canonical financial presentation layer

**Goal:** remove financial-source divergence.

Tasks:
- identify the single approved calculation path for primary share price, monthly income per share, valuation, supply, and progress;
- make cards and detail pages consume the same presentation layer;
- remove old shortcut calculations such as fixture yield multiplied by share price;
- preserve legitimate `UNKNOWN` values instead of inventing numbers;
- expose provenance and estimation status in the UI where required;
- add tests proving card/detail parity for all 24 villas.

Deliverable: one source of truth for displayed economics.

### Slice 3 — Resolve `Data pending` villa by villa

**Goal:** make every pending state intentional and understandable.

For each villa:
- determine whether the missing value is genuinely unavailable, not mapped, or incorrectly blocked;
- wire available canonical/derived inputs;
- keep unavailable values pending only when justified;
- show a concise human-readable explanation and provenance;
- ensure pending states do not break layout or CTA hierarchy;
- test all 24 properties individually.

Deliverable: no unexplained pending state.

### Slice 4 — Clarify primary offering versus secondary market

**Goal:** eliminate conceptual confusion.

Tasks:
- clearly separate primary offering, secondary market, and portfolio ownership;
- explain that `$100` is the primary base share price where applicable;
- show secondary prices as demand/order-book values, not as the primary price;
- distinguish asking price, last trade, and indicative value;
- remove misleading labels such as weekly profit/yield;
- make the current market context visible before any Buy/Sell CTA.

Deliverable: a first-time user can explain the difference after one screen.

### Slice 5 — Make Buy and Sell behavior honest and coherent

**Goal:** connect actions to visible state or clearly label simulation.

Tasks:
- trace the full Buy/order flow;
- decide and document whether the flow is simulated or stateful demo behavior;
- if stateful, update the appropriate order, holdings, sold/remaining, funding, and progress values consistently;
- if not stateful, prevent misleading impressions and show a clear demo disclosure;
- ensure repeated actions, cancellation, and refresh behave consistently;
- add E2E tests for the complete user journey.

Deliverable: no action appears to succeed while unrelated numbers silently remain contradictory.

### Slice 6 — Rebuild the first-time buyer journey

**Goal:** make the product understandable without project history.

Review and improve, in order:
1. marketplace landing;
2. property card;
3. property detail hero;
4. economics explanation;
5. ownership/risks/trust;
6. primary or secondary decision;
7. Buy/Sell action;
8. confirmation and next state.

Use progressive disclosure. Remove duplicated, competing, or overly technical explanations from the first viewport. Keep important truth visible.

Deliverable: one coherent journey from discovery to action.

### Slice 7 — Design/UI and responsive polish pass

**Goal:** production-ready visual consistency.

At minimum test 480×840 and desktop widths. Check:
- overflow and clipping;
- spacing rhythm;
- typography and numeric alignment;
- hierarchy and scanability;
- buttons and tap targets;
- loading, empty, error, pending, and success states;
- dark/light or theme consistency;
- RTL and all supported locales;
- raw translation keys and truncation;
- cards, charts, badges, sheets, and dialogs;
- accessibility basics and keyboard/focus behavior where applicable.

Fix issues found; do not merely list them.

### Slice 8 — Cross-surface consistency and regression hardening

**Goal:** ensure every villa behaves consistently.

Tasks:
- run a 24-villa matrix against all important screens;
- verify identity, image, location, price, economics, status, CTA, and provenance;
- test representative primary, secondary, pending, conflicted, and unavailable cases;
- remove dead legacy paths only when proven unused;
- add regression tests for every defect fixed in Phase 9.

Deliverable: complete matrix with no unexplained contradictions.

### Slice 9 — Final release-readiness audit

**Goal:** decide whether Phase 9 is genuinely complete.

Run:
- tests;
- typecheck;
- lint;
- build;
- E2E at 480×840;
- visual/UI QA;
- i18n/RTL QA;
- data/provenance audit;
- demo-honesty audit;
- Git diff and documentation review.

Create `docs/PHASE-9-FINAL-REPORT.md` containing:
- completed slices and commits;
- remaining blockers;
- known limitations;
- exact demo disclosures;
- final test results;
- explicit PASS, CONDITIONAL PASS, or BLOCKED decision.

## Slice completion template

At the end of every slice, append a short entry to this file:

- Status: `NOT STARTED` / `IN PROGRESS` / `PASS` / `BLOCKED`
- Commit:
- Scope completed:
- Files changed:
- Tests run and results:
- Design/UI QA result:
- Remaining issues:
- Next slice:

## Current status

All slices: `NOT STARTED`
