# Phase 9 — Checkpoint after Slice 8

Purpose: clean, documented, recoverable checkpoint of the repository state after
the completion of Slice 8, created before any further work. This document only
records state — it starts no new work.

- Date: 2026-09-12
- Branch: `phase-9-redesign` (local; diverged from `origin/phase-9-redesign` —
  local ahead 18 / behind 12 at this commit; reconcile is a user decision)
- Latest commit: **`b25c270`** — `feat(phase9): slice 8 cross-surface consistency
  and regression hardening` (146 files, +12,171/−3,572)
- Working tree at checkpoint creation: **clean** (0 changed/untracked files)
- Recoverable state: commit `b25c270` on `phase-9-redesign` is self-contained and
  buildable; no push performed (workflow does not require it here).

## Slice 8 status: `PASS`

Judged against `docs/PHASE-9-CHANGE-CONTROL.md` completion rules: deliverables
complete, in-scope tests green, no known in-scope defect, Design/UI QA performed
at 480×840, report + decision log updated, commit created. Slice 9 has **not**
been started.

## Completed work (in `b25c270`)

- DEC-007 naming unification (RESOLVED): adopted Estate24 record name/location is
  the single user-visible identity on every surface; 3 R2 spelling drifts retired
  (Syrene, La Datcha, Galeazzo); last R2-name render site (SimilarProperties rail)
  fixed; identity-parity regression tests for cards (24/24) + rail.
- Consolidated 24-villa cross-surface matrix: identity, $100 primary base,
  V1 supply (valuation ÷ $100), demo-ledger sold/remaining, card == book price,
  status → CTA. Full table: `docs/PHASE-9-SLICE-8.md` §5.
- Pending-income classification: 15 pending = 5× `eur_mixed_currency` +
  10× `unknown_owner_tax` — genuine canonical UNKNOWNs rendered with causes, not
  mapping/implementation defects. No unexplained pending state.
- P2-3 numeric-format residue fixed (card fraction, funding banner, availability
  caption grouped like hero/metrics) with test pins updated.
- Dead legacy paths removed after proving zero imports (Slice-A panels,
  FundingPanel, HolderAnalytics, IncomeAnalytics, PerformanceChart(s),
  PrimaryPerformanceCharts, estate-plan-engine, full MarketSection composition);
  `estate-economics.spec.ts` pins they never render. P3-2 confirmed intentional.
- Coverage-gap pass: every fixed Phase 9 defect mapped to a regression test
  (`docs/PHASE-9-SLICE-8.md` §4).
- Documentation: `docs/PHASE-9-SLICE-8.md` (report), Slice 8 entry in
  `docs/PHASE-9-REDESIGN-PLAN.md`, DEC-007 RESOLVED + DEC-010 opened in
  `docs/PHASE-9-DECISION-LOG.md`.
- Note: `b25c270` also contains the long-standing uncommitted working-tree body
  Slice 8 was built on (V1 engine 2026-09-09, PROMPT 05 2026-09-10, Product
  Decision Lock + Final PO Decisions 2026-09-11) — not separable at file
  granularity; recorded in `docs/PHASE-9-SLICE-8.md` §8.

## Incomplete work

None inside Slice 8's scope. Open items recorded as decisions/backlog, none
blocking the checkpoint:

- **DEC-010 (OPEN, needs user confirmation):** Mimosa commit-gate medium findings
  in the legacy `apps/api` workspace — suspected cross-file taint at
  `routes/admin.ts:789` and `routes/orders.ts:107` (pre-Phase-9 demo code,
  untouched by Slice 8 product work; disclosed at commit time per the gate's
  requirement). The 3 high "hardcoded credential" findings (visibly fake test
  values) were remediated behavior-preservingly to clear the forced block.
- **Pre-existing `apps/api` test failures (2):** `marketplace.test.ts` query
  filter and `public.test.ts` contract shape fail identically without any
  Phase 9 change — recorded in DEC-010 for a dedicated legacy pass; not in
  Phase 9 web-app scope.
- DEC-009 (OPEN): tap-target acceptance — product decision, no code.
- Translator backlog (~210 EN-mirrored keys/locale).
- P2-2 `New` badge — accepted demo-tape behavior (badge and filter share the
  demo clock; coherent by construction).
- Upstream branch reconcile (12 behind origin) — user decision.

## Known defects

No product defect is known in the Phase 9 web app surfaces at this commit.
Known limitations are the accepted/OPEN items above; none is an in-scope Slice 8
defect.

## Validation (re-run at this checkpoint, against `b25c270` exactly)

| Command | Result |
|---|---|
| `npm test` (vitest) | 126 files, **1057/1057 passed** |
| `npm run typecheck` | clean |
| `npm run lint` | 0 errors, 6 pre-existing warnings |
| `npm run build` | green (13 routes) |
| `npx playwright test` (480×840, dev server) | Run A: 45 passed/6 skipped with one flaky single-test outcome; **Run B (re-run): 46 passed, 6 expected skips, 0 failed** — matches the Slice 8 validation |
| Edited legacy api test files (`npx vitest run` in `apps/api`, 2 files) | 19/19 passed |
| Design/UI QA at 480×840 | PASS — screenshots reviewed (`screenshots/slice8-qa/`): card==detail identity/price/fraction/income on primary, resale, pending villas; grouped counts; fa RTL correct, no overflow, no raw keys |

Expected skips (6): money-path E2E requiring the live API stack (documented
since Slice 0; config has no webServer — dev server started manually).

## Current risks

1. **Branch divergence** (ahead 18 / behind 12 vs origin) grows; reconcile
   (merge or rebase) is a user decision (DEC-003 process half).
2. **Legacy `apps/api` workspace**: 2 medium security-scan suspicions + 2
   failing tests + ~986 packages scanned with 12 matched advisories —
   quarantined out of Phase 9 scope, but the commit gate will keep surfacing
   the mediums until reviewed (DEC-010).
3. **E2E flake observed once** (single-test outcome in Run A, green in Run B) —
   no user-visible symptom identified; watch at Slice 9.
4. Translator backlog renders English mirror text in some locales (fa detail
   surfaces) — accepted, tracked since Slice 7.

## Exact recommended next step

Await the user command `next slice`, then run **Slice 9 — final
release-readiness audit** per `docs/PHASE-9-REDESIGN-PLAN.md` (full test/lint/
typecheck/build/E2E, visual + i18n/RTL + data-provenance + demo-honesty audits,
`docs/PHASE-9-FINAL-REPORT.md` with an explicit PASS / CONDITIONAL PASS /
BLOCKED decision). Separately (user-scheduled, outside Phase 9): DEC-010
legacy-workspace security/test pass and the upstream branch reconcile.

## Statement

**No Slice 9 work and no new product or design work has been started.** This
checkpoint only documents the post-Slice-8 state and re-runs validation against
commit `b25c270`.
