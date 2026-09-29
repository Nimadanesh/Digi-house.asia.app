# FractionalLuxe Private Club — Decision Closure & Data Readiness Audit v1

> **Status:** readiness audit only. No implementation, no UI/code/copy/route/threshold changes.
> **Position in chain:** PRODUCT RULES V1 → **DECISION CLOSURE (this doc)** → DATA CONTRACT → ARCHITECTURE → IMPLEMENTATION.
> **Classification vocabulary:** FINAL/LOCKED · BUSINESS APPROVAL REQUIRED · DATA REQUIRED · PROVISIONAL/CONFIGURABLE · BLOCKED · OUT OF MVP/DEFERRED.
> **Provenance vocabulary:** OBSERVED · ESTIMATED · MODELED · DERIVED · UNKNOWN · CONFLICTED.

---

## SECTION 1 — EXECUTIVE DECISION STATUS

| Area | Status | Why | Required Next Action |
|---|---|---|---|
| Membership eligibility | FINAL (direction) | Private+ eligible, Standard excluded — matches implementation + rules | Confirm at G2, no rework risk |
| Tier thresholds | FINAL/LOCKED | $0/10K/25K/100K/500K live in `club-tiers.ts`, unchanged across all docs | None |
| Club pool | PROVISIONAL | ~1,450 nights MODELED, unsigned | G1 allocation approval |
| Club allocation % | PROVISIONAL | LOW/MED/HIGH modeled, ~67% primary unapproved | G1 |
| Season model | PROVISIONAL | Annual cadence decided; bands/split modeled | G3 + operator calendar |
| Peak calendar | BLOCKED | No dates, no blackouts, no operator input exist | Acquire calendar data |
| Season entries | FINAL (semantics) | 1 credit = 1 season entry; values PROVISIONAL | G4 confirm |
| Entry issuance | FINAL (lifecycle) | Lifecycle logic specified; dates PROVISIONAL | G4 + ops dates |
| Entry expiry | FINAL (direction) | Annual reset, no rollover; season length annual decided | None structural |
| Lottery | PROVISIONAL | Hybrid mechanism specified; weights/pity need approval | G5 |
| Tier weighting | LOCKED 2026-09-26 | 1.0/1.25/1.5/2.0 normative V1 weights | None |
| Award size | FINAL (structure) | Whole-night packages only; 4-night standard (locked 2026-09-26; supersedes 3-night) | None |
| 3-night rule | SUPERSEDED 2026-09-26 | Integer package, min viable award (locked 4-night base stay) | None |
| 4-night upgrade | SUPERSEDED 2026-09-26 | Off-peak conditional (moot under locked 4-night base) | None |
| Peak rules | PROVISIONAL | 3-night cap direction set; gates/values pending | G8 + calendar |
| Booking window | PROVISIONAL | Tier-staggered direction; values + min-stay pending | Operator data + G8 |
| Cancellation | PROVISIONAL | Ladder direction; windows pending | G10 |
| No-show | PROVISIONAL | Forfeiture + cooldown direction; 90d placeholder | G10 |
| Waitlist | FINAL (mechanism) | Tier→timestamp→lottery-ties; response window PROVISIONAL | Ops value |
| Fair use | FINAL (direction) | Caps/no-rollover/one-request; values PROVISIONAL | G9 |
| Early-member advantage | FINAL (mechanism) | Dilution monotonicity proven; copy bands PROVISIONAL | G12 |
| Anti-gaming | FINAL (direction) | Non-transferability, identity, audit log; tooling BLOCKED | Enforcement tooling |
| Pool reconciliation | FINAL (logic) | Ledger concepts + zero-liability close defined | None structural |
| Tax treatment | BLOCKED | No jurisdiction analysis exists | Legal/tax input |
| Concierge | PROVISIONAL/DEFERRED | Scope direction set; staffing/cost BLOCKED | Staffing model; candidate MVP exclusion |
| Referral rewards | BLOCKED | Attribution-only spec vs "Club Credits" copy = CONFLICTED | G1-equivalent referral decision (see contradiction C1) |
| Monitoring/enforcement | BLOCKED | No tooling, no tripwire instrumentation | Observability build |
| Member-facing promise | PROVISIONAL | May/must-not-say lists drafted; copy unfinalized | G12 |

## SECTION 2 — FINAL / LOCKED DECISIONS

Only genuinely established items (verified against sources; implementation may rely on these):

1. Tier thresholds $0/10K/25K/100K/500K — Rules §4, `club-tiers.ts:20-24` — OBSERVED — reliance: YES.
2. `/club` route + non-tab navigation + `/card` intact — Design doc §2/§16, implementation — OBSERVED — YES.
3. Credit = season entry (not night/money/guarantee) — Rules §7/R-C1 — MODEL rule, FINAL as semantics — YES.
4. Whole-night awards; no fractional user rewards — Rules §12/R-A1, v3 §5 — FINAL — YES.
5. 4-night standard award structure — Rules §12–13 — MODEL rule, FINAL as structure — YES (locked 2026-09-26; supersedes 3-night).
6. No rollover; annual reset; non-transferable — Rules §9/R-X, v3 §18 — FINAL direction — YES.
7. Finite pool; tier-priority waitlist + timestamp + lottery-ties — Rules §§10/20 — FINAL mechanism — YES.
8. One award + one active request per season; remainder-to-rental — Rules §§12/21 — FINAL — YES.
9. State machine structure (§27) — FINAL as model — YES for domain modeling.
10. State must not depend on color alone; ≥44px targets; Esc/backdrop close — Design + implementation — OBSERVED — YES.
11. Anti-transfer principle — Rules §24 — FINAL direction — YES.

## SECTION 3 — BUSINESS APPROVAL REGISTER

- **G1 Club allocation %**: candidates LOW/MED/HIGH, primary ~1,450 (~67%). Matters: sizes the entire pool. Changes: every downstream number. Approver: Business Owner + operator. **BLOCKS DATA CONTRACT.** Deadline: before any pool sizing work.
- **G2 Eligible-member definition**: direction ready (Private+). Confirm only. **DOES NOT BLOCK** domain modeling.
- **G3 Season model/calendar**: annual decided; bands/split need operator calendar. **BLOCKS ARCHITECTURE** (allocation engine needs bands).
- **G4 Entry definition**: semantics final; issuance dates need ops. **DOES NOT BLOCK** domain modeling.
- **G5 Lottery mechanism + weights/pity**: hybrid specified; weights provisional. **BLOCKS IMPLEMENTATION** (draws).
- **G6 Tier weights + windows**: placeholders. **BLOCKS IMPLEMENTATION.**
- **G7 3/4-night structure + upgrade trigger**: structure final; trigger provisional. **BLOCKS IMPLEMENTATION** (awards).
- **G8 Peak rules**: direction set; gates/values/calendar pending. **BLOCKS IMPLEMENTATION** (peak).
- **G9 Fair-use caps**: direction set; values pending. **BLOCKS IMPLEMENTATION** (enforcement).
- **G10 Cancellation/no-show policy**: ladders set; windows/cooldown pending. **BLOCKS IMPLEMENTATION.**
- **G11 Liability limits + tripwire**: tripwire threshold provisional. **BLOCKS SCALING** (not MVP draw logic).
- **G12 Member promise/copy**: may/must-not lists drafted. **BLOCKS COMMUNICATION**, not engine.
- **G13 Referral rewards definition** (new finding): copy promises "Club Credits"; spec is attribution-only; design bans new mechanics. Decide: remove promise vs design capped backing. **BLOCKS any referral build.**

## SECTION 4 — DATA REQUIREMENTS REGISTER

| Data | Required? | Current Status | Source | Provenance | Granularity | Frequency | Blocks What |
|---|---|---|---|---|---|---|---|
| Available/occupied/owner-use dates | Yes | Absent | Operator | UNKNOWN | villa×date | Seasonally | Pool sizing, calendar |
| Maintenance blocks | Yes | Absent | Operator | UNKNOWN | villa×date-range | Seasonally | Usable nights |
| Blackout dates | Yes | Absent | Operator | UNKNOWN | date sets | Seasonally | Peak rules |
| Min-stay requirements | Yes | Partial (guest min-stay arrays OBSERVED) | Dataset/operator | OBSERVED (guest); UNKNOWN (Club exceptions) | villa | Once + changes | Award feasibility |
| Turnover requirements/costs | Yes | 1 datapoint (Forza $2,000) | Operator | UNKNOWN | per stay | Ongoing | Cost model |
| Seasonal calendar + peak dates | Yes | Absent | Operator | UNKNOWN | date bands × villa | Seasonally | Seasons, peak |
| Stay utilization/arrival curves | Yes | Absent | Product analytics (future) | UNKNOWN | tier×week | Ongoing | Weights, tripwire |
| Cancellation/no-show rates | Yes | Absent | Ops (future) | UNKNOWN | per booking | Ongoing | Ladders, cooldowns |
| Avg stay length/demand concentration | Yes | Modeled only | Model | MODELED | — | Once | Stress tests |
| Tax treatment | Yes | Absent | Legal/tax | UNKNOWN | jurisdiction | Once | Promise, accounting |
| Concierge cost/volume | Yes | Absent | Ops/vendor | UNKNOWN | request | Ongoing | Concierge scope |
| Referral eligibility/fraud inputs | Yes | Spec only (attribution) | Spec | UNKNOWN (rewards) | referral | Ongoing | Referral build |
| Tier distribution forecast | Yes | Absent | Business | UNKNOWN | tier | Per season | Pool sizing |
| Partner experience terms | Yes | Absent | Partners | UNKNOWN | contract | Per season | Escape supply |
| Card fulfillment cost | Deferred | Absent | Vendor | UNKNOWN | unit | Once | Card P&L (non-blocking) |

## SECTION 5 — DATA PROVENANCE AUDIT

- 270 occupied days: MODELED (business assumption; analytical scenario use only).
- 90 available days: MODELED residual (DERIVED arithmetic on MODELED input).
- 2,160 available villa-days: DERIVED (exact math, modeled base).
- ~1,450 Club allocation: MODELED/PROVISIONAL (unsigned business scenario).
- 4-night award: MODEL rule, FINAL as structure (locked 2026-09-26).
- 4-night upgrade: SUPERSEDED 2026-09-26 (moot under locked 4-night base).
- Season percentages (25/30/25/20): MODELED starter.
- Peak limits (3-night cap, sub-pool %): MODEL direction, PROVISIONAL values.
- Tier thresholds: OBSERVED (implementation).
- Tier weights (1.0/1.25/1.5/2.0): normative V1, LOCKED 2026-09-26.
- Cooldowns (90d), windows (7d/48h/21d/60–180d), pity cap: UNKNOWN with starter placeholders, PROVISIONAL.
- Member-count scenarios: analytical scenarios, not forecasts.
- "Club Credits" copy: CONFLICTED (copy vs attribution spec vs design ban).

## SECTION 6 — PARAMETER CLASSIFICATION

| Parameter | Current Value | Status | Type | Configurable? | Requires Approval? | Requires Real Data? |
|---|---|---|---|---|---|---|
| Tier thresholds | 0/1M/2.5M/10M/50M¢ | LOCKED | Threshold | No | No | No |
| 270/90-day base | 270/90 | PROVISIONAL_CONFIG | Assumption | Yes | Yes (G1) | Corroboration desired |
| Allocation % / pool size | ~1,450 | BUSINESS_DECISION | Sizing | Yes | **G1** | Signed nights |
| Season bands/split | 4 bands, 25/30/25/20 | PROVISIONAL_CONFIG | Calendar | Yes | G3 | Operator calendar |
| Tier weights | 1.0–2.0× | LOCKED 2026-09-26 | Weight | Yes | — | Arrival/usage |
| Windows | 60–180d | PROVISIONAL_CONFIG | Window | Yes | G6/G8 | Operator |
| Caps/cooldowns/pity | starters | PROVISIONAL_CONFIG | Control | Yes | G9/G10/G5 | Behavioral |
| Min-stay exceptions | TBD | UNKNOWN | Ops rule | Yes | Operator | Per-villa data |
| Tax treatment | TBD | UNKNOWN | Legal | No | Legal | Jurisdiction analysis |
| Referral rewards | TBD | UNKNOWN | Economics | Yes | G13 | Eligibility + fraud |
| Concierge staffing | TBD | UNKNOWN | Ops | Yes | Staffing model | Cost/volume |
| Monitoring/tripwire | TBD | UNKNOWN | Tooling | Yes | G11 | Instrumentation |
| Copy bands | TBD | PROVISIONAL_CONFIG | Promise | Yes | G12 | Utilization data |
| Card fulfillment | TBD | DEFERRED | Unit cost | Yes | Vendor | Non-blocking |

## SECTION 7 — WHAT CAN BE BUILT WITHOUT FINAL ECONOMICS

A. SAFE TO IMPLEMENT NOW: domain types (tier/member/season/entry/award/booking states), state machine transitions, provenance model (labels on every numeric field), pool ledger structure, season-entry + award entities, booking lifecycle model, audit-event model, waitlist ordering logic. Verified safe: none require numeric values, only shapes the rules already finalize.
B. SAFE AS CONFIGURATION/DOMAIN MODEL ONLY: thresholds table, season definitions, allocation %, award caps, expiry, cooldowns, tier weights — as versioned config with PROVISIONAL flags, never hard-coded.
C. MUST WAIT: real booking integration, lottery execution, benefit issuance, financial settlement, referral rewards (needs G1–G13 + data).
D. MUST NOT BE IMPLEMENTED YET: credit ledger with value semantics, rollover, cash/transfer features, peak fulfillment, enforcement automation, monitoring tripwires (needs tooling).

## SECTION 8 — DATA CONTRACT READINESS

1. Entities sufficiently known: member tier snapshot, season, season entry, award, booking, waitlist position, audit event, pool ledger.
2. Stable fields: ids, tier ids, season year, entry status enum, award night-count (3|4), state enums.
3. Must be nullable/UNKNOWN: all operator dates, costs, rates, calendars, arrival metrics.
4. Require provenance: every numeric field carries a provenance label (v1 pattern, extend to Club tables).
5. Must be configurable: allocation %, splits, weights, windows, caps, cooldowns, thresholds table.
6. Depend on external ops data: availability, blackouts, min-stay exceptions, turnover, calendar.
7. Must never persist fabricated values: occupancy, ADR, revenue, availability, costs — nullable with provenance UNKNOWN, never backfilled from the 270 model.
Conclusion: DOMAIN STRUCTURE is ready to specify; BUSINESS VALUES are not. A contract that enforces nullable-unknown + provenance can be written now.

## SECTION 9 — ARCHITECTURE READINESS

- Domain model: READY (entities + state machine final).
- Persistence model: PARTIAL (shapes ready; nullable/provenance/config policy needed → Data Contract first).
- Calculation engine: PARTIAL (formulas specified; values provisional).
- Allocation/lottery engine: PARTIAL (mechanism specified; weights/calendar blocked).
- Booking integration boundary: BLOCKED (no operator interface exists).
- Audit trail: PARTIAL (record contents specified; retention/store TBD).
- Configuration: READY as versioned-config pattern (values pending).
- Admin controls: PARTIAL (operations enumerated; UX deferred).
- Observability: BLOCKED (no instrumentation; tripwire needs it).
- Enforcement: BLOCKED (automation needs G9/G10 values + tooling).
- Data ingestion: BLOCKED (no operator feed exists).

## SECTION 10 — MVP BOUNDARY

MVP/PHASE 1: eligibility + seasons + entries + hybrid lottery + 4-night awards (locked 2026-09-26; supersedes 3-night + upgrade) + peak caps + waitlist + expiry/no-rollover + audit records + versioned config. LATER: concierge fulfillment (scope direction exists but staffing/cost blocked — does not block stay MVP), referral rewards (blocked on G13; invite flow stays as-is), tax accounting (blocked on legal), real booking integration (blocked on operator interface), peak calendar refinement (iterates with data), enforcement automation (manual ops first), partner integrations (per-contract).
Deferred items do not block MVP except: signed nights (G1), calendar (G3), min-stay exceptions — these three gate even manual MVP operation.

## SECTION 11 — IMPLEMENTATION RISK REGISTER

Defined scale: Probability (LOW/MED/HIGH given current controls) × Impact (LOW/MED/HIGH on economics/trust), with gate as mitigation.
1. Hard-coded economics — MED×HIGH — mitigation: versioned config (G1–G10 values flagged PROVISIONAL).
2. Fake availability — MED×HIGH — mitigation: nullable-unknown contract; never backfill from 270 model.
3. Fake season calendar — MED×HIGH — mitigation: G3 + downward-only revision rule.
4. Incorrect allocation — MED×HIGH — mitigation: G1 signed nights.
5. Unlimited liability — LOW (given invariants) ×HIGH — mitigation: R-P0 + expiry + caps.
6. Peak concentration — HIGH×HIGH — mitigation: sub-pool + gates + blackouts (G8).
7. Tier fairness — MED×MED — mitigation: published weights + audit log (G5/G6).
8. Cancellation/no-show leakage — MED×MED — mitigation: ladders + forfeiture (G10).
9. Anti-gaming gaps — MED×MED — mitigation: identity + non-transfer + audit (tooling BLOCKED).
10. Tax/legal ambiguity — LOW×HIGH — mitigation: legal input before promise (G12).
11. Operational partner mismatch — MED×HIGH — mitigation: contracts before fulfillment (G3/G7).
12. Data provenance loss — LOW×HIGH — mitigation: provenance labels mandatory in contract.
13. Rebuild after decisions change — MED×MED — mitigation: this closure + config-versioning + decision sequence (§13).

## SECTION 12 — DECISION DEPENDENCY GRAPH

```
SIGNED CLUB NIGHTS (G1) [BLOCKS contract]
        ↓
SEASON CALENDAR + PEAK SPLIT (G3) [BLOCKS architecture]
        ↓
ELIGIBLE MEMBERS (G2) [ready direction]
        ↓
SEASON ENTRIES (G4) [ready direction]
        ↓
TIER WEIGHTS + WINDOWS (G6) [BLOCKS draws]
        ↓
LOTTERY + PITY (G5) [BLOCKS draws]
        ↓
3/4-NIGHT AWARDS (G7) [BLOCKS awards]
        ↓
BOOKING CONTRACT + MIN-STAY EXCEPTIONS [BLOCKS fulfillment]
        ↓
COMPLETION / CANCELLATION / NO-SHOW (G10) [BLOCKS enforcement]
        ↓
POOL RECONCILIATION [ready logic]
  ↳ MONITORING/TRIPWIRE (G11) [BLOCKS scaling]
  ↳ COPY BANDS (G12) [BLOCKS communication]
  ↳ REFERRAL REWARDS (G13) [BLOCKS referral build]
  ↳ TAX TREATMENT [BLOCKS accounting]
  ↳ CONCIERGE STAFFING [BLOCKS concierge fulfillment]
```

## SECTION 13 — DECISION SEQUENCE (rework-minimizing order)

STEP 1 — G1 allocation basis (sizes everything downstream).
STEP 2 — Operator availability + calendar (G3 inputs).
STEP 3 — Season calendar + peak split (G3).
STEP 4 — Min-stay exceptions + turnover feasibility (award feasibility).
STEP 5 — Tier weights + windows (G6; needs arrival/usage estimates).
STEP 6 — Lottery + pity + cooldowns (G5/G10).
STEP 7 — Fair-use caps (G9).
STEP 8 — Cancellation/no-show ladders (G10).
STEP 9 — Liability tripwire + monitoring (G11).
STEP 10 — Referral resolution (G13) + copy bands (G12) + tax flag.
STEP 11 — Concierge staffing (parallel track, non-blocking for stay MVP).

## SECTION 14 — IMPLEMENTATION GATE

A. **Data Contract V1** — allowed when: G1 signed nights exist; nullable-unknown + provenance policy adopted; config-versioning pattern agreed. Forbidden unknowns at this gate: none (contract must *represent* unknowns, not resolve them).
B. **Architecture V1** — allowed when: G3 calendar + G6 weights/windows provisional values exist; booking boundary interface defined (even if manual); audit retention decided.
C. **Production Implementation** — allowed when: G5/G7/G8/G9/G10 values approved; min-stay exceptions signed; copy bands approved (G12); tripwire monitoring exists; referral stays access-only until G13; tax flagged. Forbidden unknowns: any uncapped promise, any cash-like credit, any guaranteed nights, any backfilled availability.
Core answer: **no engineer may implement the economic engine until signed nights + calendar + approved numeric values exist and every persisted number carries provenance.**

## SECTION 15 — OPEN QUESTIONS

BUSINESS: allocation %? tier weights? peak split? tripwire threshold? referral: remove promise or build backing? pause-admissions policy?
DATA: actual availability/blackouts/min-stay exceptions/turnover/arrival/usage/cancellation rates?
OPERATIONS: confirmation/response/release windows? concierge staffing? partner terms? monitoring tooling?
LEGAL/TAX: benefit-in-kind treatment per jurisdiction? monetary-penalty permissibility?
TECHNICAL: audit retention? identity enforcement for anti-gaming? manual-vs-automated booking boundary?

## SECTION 16 — FINAL RECOMMENDATION

**BLOCKED_PENDING_BUSINESS_DECISIONS** (with a parallel track open).

Rationale: domain structure, mechanisms, and invariants are final and sufficient to begin **Data Contract V1** as soon as G1 (signed nights) lands — the contract can fully specify nullable-unknown + provenance + versioned config without any further business input. But Architecture V1 and any implementation are blocked on G3/G5–G10 values, operator data, and the G13 referral resolution. This is not a product-quality verdict; it is a sequencing verdict: proceed to Data Contract on the G1 trigger, hold everything else.

---

## Appendix A — Contradictions found

- **C1 (CONFLICTED):** `club.benefit.referral.body` promises "Club Credits" while the referral spec is attribution-only and the design bans new reward mechanics. REPORTED, not fixed (copy change out of scope for this audit).
- No other doc↔implementation contradictions found: thresholds, benefits, unlock mapping, stay-stub nulls, and non-tab navigation all match their documents.

## Appendix B — Verification

- All five authoritative docs read completely; classifications cross-checked against sources; no provisional value promoted; every blocker has a reason; unknowns stay UNKNOWN; no new economics invented; dependency graph consistent; decision sequence ordered for minimal rework.
- No production code modified (documentation-only task).
