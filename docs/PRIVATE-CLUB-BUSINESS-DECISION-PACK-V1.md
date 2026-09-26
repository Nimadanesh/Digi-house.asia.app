# FractionalLuxe Private Club — Business Decision Pack v1

> **Status:** decision pack for Business Owner / Product Owner review. No decisions made herein; no implementation; no production-code changes.
> **Sources:** DESIGN, ECONOMICS v1/v2/v3, PRODUCT-RULES-V1, DECISION-CLOSURE-V1 (all read completely), plus Club implementation, stay/referral contracts, estate contracts (inspected where cited).
> **Provenance labels:** OBSERVED · ESTIMATED · MODELED · DERIVED · UNKNOWN · CONFLICTED.
> **Gate note:** this pack numbers gates G1–G13 per the task brief. The Closure doc used a different numbering for the same substance; §2 maps each gate to its Closure equivalent. Closure wording is preserved wherever quoted.

---

## SECTION 1 — EXECUTIVE SUMMARY

- Product Rules V1 is complete (33 sections; mechanisms specified, values provisional).
- Decision Closure V1 is complete (16 sections; readiness verdict: BLOCKED_PENDING_BUSINESS_DECISIONS).
- The Club is **not implementation-ready**: G1–G13 require explicit owner closure.
- Data Contract V1 becomes safe only after G1 (signed nights) plus the nullable-unknown/provenance/config policy — all other gates sequence after.
- Some decisions can be deferred without blocking the domain model (season-entry semantics, state machine, waitlist ordering are FINAL as mechanisms).

Current classification snapshot:

- **LOCKED:** tier thresholds; tier weights 1.0/1.25/1.5/2.0 (2026-09-26); route/navigation; entry semantics; whole-night awards; 4-night standard (2026-09-26; supersedes 3-night structure); no-rollover/expiry/non-transfer; one-award/request caps; remainder-to-rental; waitlist ordering; state machine; a11y contract.
- **DECISION REQUIRED:** G1–G13 (allocation, calendar, eligibility confirm, tier model, award/peak constraints, fair-use values, cancel/no-show policy, entry lifecycle confirm, lottery parameters, liability hard limits, scaling thresholds, promise language, referral rewards).
- **DATA REQUIRED:** availability/owner-use/maintenance/blackouts, calendar, min-stay exceptions, turnover, arrival/usage/cancellation rates, tax, concierge, referral, tier forecast, partner terms.
- **DEFERRED:** concierge fulfillment, referral rewards build, tax accounting, enforcement automation, partner integrations (none block the stay-pool domain model).

## SECTION 2 — DECISION MAP

| Gate | Decision | Current Status | Decision Type | Blocks | Depends On |
|---|---|---|---|---|---|
| G1 — Club allocation / signed nights basis | What % of available days is committed? | PROVISIONAL (~1,450) | Business + data | Data Contract, everything downstream | Availability/owner-use data |
| G2 — Season/calendar model | Bands, split, calendar methodology | PROVISIONAL (bands); calendar BLOCKED | Business + data | Architecture | G1, operator calendar |
| G3 — Eligibility / participation boundary | Who may participate? | Direction FINAL, confirm needed | Business confirm | Draws | — |
| G4 — Tier interaction / priority model | Priority vs weight vs hybrid? | PROVISIONAL (E-lite direction) | Business | Draws | Arrival/usage estimates |
| G5 — Award / peak constraints | 4-night standard (locked 2026-09-26; supersedes 3-night rule + upgrade trigger), peak cap | Structure FINAL | Business | Awards | G1, calendar |
| G6 — Fair-use / booking controls | Caps, windows, cooldowns, waitlist values | Direction FINAL; values PROVISIONAL | Business | Enforcement | Usage data |
| G7 — Cancellation / no-show policy | Ladders, windows, cooldown | Direction FINAL; values PROVISIONAL | Business | Enforcement | Behavioral data |
| G8 — Credit issuance / expiry policy | Entry lifecycle confirm | Semantics FINAL; dates PROVISIONAL | Business confirm | Draws | Ops dates |
| G9 — Lottery / allocation parameters | Weights, pity, seed/audit spec | Mechanism FINAL; params PROVISIONAL | Business | Draws | G4, fairness review |
| G10 — Liability / capacity tripwires | Hard limits + tripwire threshold | Direction FINAL; threshold PROVISIONAL | Business | Scaling | Monitoring |
| G11 — Scaling / member-growth thresholds | Phase framing, admission tripwire | Direction FINAL; thresholds PROVISIONAL | Business | Scaling | Utilization data |
| G12 — Member-facing promise / communication | Approved language | Draft lists; unapproved | Business + legal | Communication | G11, legal review |
| G13 — Referral rewards | Reward or attribution-only? | BLOCKED (contradiction C1) | Business | Referral build | Fraud/legal inputs |

Mapping note: Closure G1 = pack G1; Closure G2 (eligible-member) = pack G3; Closure G3 (season) = pack G2; Closure G4 (entry) = pack G8; Closure G5 (lottery) = pack G9; Closure G6 (tier) = pack G4; Closure G7 (awards) = pack G5; Closure G8 (peak) folded into pack G5 + G2 calendar; Closure G9 (fair-use) = pack G6; Closure G10 (cancel/no-show) = pack G7; Closure G11 (liability) = pack G10; Closure G12 (copy) = pack G12. Pack G11 (scaling) and the G13 referral gate are explicit in both. Substance identical; only numbering differs.

## SECTION 3 — G1: CLUB ALLOCATION / SIGNED NIGHTS BASIS

Model chain (all provenance preserved): 24 villas × 270 MODELED occupied days = 6,480 modeled occupied villa-days (DERIVED). Residual: 24 × 90 = **2,160 DERIVED available villa-days** (90 itself MODELED). The ~1,450 Club-night scenario is **MODELED / PROVISIONAL — NOT approved**.

Existing scenarios from the economics documents (presented, not ranked):

| Scenario | Allocation | Pool (DERIVED) | Provenance | Operational meaning | Member capacity (balanced mix) | Relies on | Missing data | Unlocks | Risk |
|---|---|---|---|---|---|---|---|---|---|
| LOW | 25% of available | ~540 | MODELED | Binds from ~150 members | ~535 nights/500 members | Residual actually free | Availability, owner-use | Small honest pool | Under-supply complaints |
| MEDIUM | 50% of available | ~1,080 | MODELED | Waitlist-normal by 500 | ~1,130/500 | Same + turnover | Same + turnover costs | Balanced MVP pool | Peak shortfall |
| HIGH/primary | ~67% (~1,450) | ~1,450 | MODELED/PROVISIONAL | Status-driven by 1,000 | ~2,260/1,000 | Same + peak calendar | Same + blackouts | Rich early experience | Displacement cost, peak blowout |

> BUSINESS DECISION REQUIRED: "What portion of the modeled available villa-days may be committed to the Private Club pool?" Decision owner: Business Owner. Required evidence: actual availability / owner-use / maintenance / blackout / operational constraints. (Not answered here.)

## SECTION 4 — G2: SEASON / CALENDAR MODEL

Modeled framework (MODELED STARTER ASSUMPTION — NOT APPROVED): OFF-PEAK / SHOULDER / HIGH / PEAK at 25/30/25/20% of pool. Missing per band: actual peak dates (UNKNOWN), property-specific seasonality (UNKNOWN — season tables exist as rate evidence only), blackout periods (UNKNOWN), min-stay exceptions (UNKNOWN), operational restrictions (UNKNOWN). Each missing input requires the operator; all block peak/allocation implementation. Decision required: approve the season model and calendar methodology (not dates).

## SECTION 5 — G3: ELIGIBILITY / PARTICIPATION BOUNDARY

Rules V1 position: PRIVATE ($10K+), PRIVATE PLUS ($25K+), ELITE ($100K+), SIGNATURE ($500K+) participate (thresholds OBSERVED, unchanged); STANDARD ($0+) never enters (preview-only); eligibility evaluated at lottery time; downgrade voids entries; mid-season joiners subject to entry deadline; cancellation voids entries. Alternatives if the owner disagrees: admit Standard with zero weight (rejected in Rules — creates expectation without capacity); season-varying eligibility (rejected — complexity without evidence). Decision required: Who may participate? (Confirm direction or redefine.)

## SECTION 6 — G4: TIER INTERACTION

Documented approaches: equal treatment; priority ordering; weighting; hybrid (E-lite: priority + windows + light caps — EXISTING MODELED/PROPOSED DIRECTION, not final). Fairness: priority is legible, weights need publishing, equal wastes tier value. Access: windows shape *when*, weights shape *odds*. Complexity/auditability: priority+timestamp simplest to audit; weights need logged draws. Higher tiers: earlier windows, stronger odds — never guaranteed nights (unsupported). Early members: unaffected within tier (timestamp ordering is tier-scoped). Decision required: How should tier status affect allocation priority?

## SECTION 7 — G5: AWARD + PEAK CONSTRAINTS

Established: 4-night standard (locked 2026-09-26; supersedes 3-night + off-peak upgrade); whole nights only; no fractions; peak constrained; no holiday guarantees. Unresolved: peak maximum value; property-specific min-stay exceptions; min-stay conflicts (e.g. OBSERVED 7-night minimums vs 4-night awards). Decision required: peak constraints.

## SECTION 8 — G6: FAIR-USE / BOOKING CONTROLS

Framework (direction FINAL): one award + one active request per season; rolling 12-month enforcement; peak sub-cap; advance windows; future-reservation limit 1; repeat-win cooldown; waitlist; anti-hoarding. Provisional values each shown with provenance (MODEL/UNKNOWN), reason (tail-risk binding), evidence needed (usage/arrival data), and configurability (all versioned-config, none hard-coded). No values selected here.

## SECTION 9 — G7: CANCELLATION / NO-SHOW

Concepts: pre-confirmation return (no penalty); post-confirmation forfeit ladder; close-to-arrival forfeiture + strike; no-show forfeiture + cooldown (90-day starter PROVISIONAL); waitlist release; pool-vs-rental return routing. Economic reason per step: waste recovery + abuse deterrence without monetary penalties (which would be separate financial mechanics). All timings PROVISIONAL. Decision required: acceptable cancellation/no-show policy.

## SECTION 10 — G8: CREDIT / SEASON ENTRY

Established: credit = season entry; not a night, money, or guarantee; non-transferable; expires/resets. Unresolved: issuance frequency (annual decided, sub-annual needs re-approval); entries per member (one, decided); issuance timing (ops dates); expiry mechanics (season close, decided); tier-change handling (higher weight applies, decided direction); mid-season changes (void/apply rules decided direction); selection (consumes entry); cancellation (returns per §9 ladders). Decision required: confirm the entry lifecycle.

## SECTION 11 — G9: LOTTERY / ALLOCATION PARAMETERS

Locked: eligibility gate, tier-priority ordering, timestamp, lottery-for-exact-ties, seeded/logged draw, audit record, capped pity concept. Provisional: weight values, pity cap, seed procedure details, retention period. No probabilities or randomization weights introduced here. Decision required: parameters making draws deterministic and auditable.

## SECTION 12 — G10: LIABILITY / CAPACITY TRIPWIRES

Controls and what each protects: finite signed pool (unbounded obligation); expiry/no-rollover (backlog compounding, proven); caps (concentration); peak sub-pool (holiday blowout); cancellation/no-show forfeiture (waste spiral); anti-gaming (capture); admission tripwire (scaling). Modeled tripwire starter (sub-15% win rate) shown with MODEL provenance only. Decision required: which controls are hard limits + tripwire threshold.

## SECTION 13 — G11: SCALING / MEMBER GROWTH

Existing modeled scenarios (100/200/300/400/500/750/1,000/2,000, v3 §12/§14 — analytical, not forecasts, not ranked): pool dilution is monotonic; 360–600 transition band is a MODELED direction; operational pressure shifts from fulfillment (early) to triage (late). Growth matters because fixed pool ÷ more members = lower probability + peak binding. Decision required: operational thresholds triggering allocation-behavior change.

## SECTION 14 — G12: MEMBER-FACING PROMISE

MAY SAY (conceptual direction): shared limited annual pool; limited awards subject to availability; access changes with membership/inventory; early membership = fewer members sharing. MUST NOT PROMISE: guaranteed N nights; every member gets a stay; investment earns nights; disappearing-night urgency; unlimited stays/concierge/referrals. Legal/tax review flagged (benefit-in-kind, monetary-penalty permissibility). No legal conclusions drawn. Decision required: approved promise language.

## SECTION 15 — G13: REFERRAL REWARDS

Contradiction C1 preserved exactly: (a) Club UI/design copy references "Club Credits"; (b) the referral attribution spec is attribution-only (first-write-wins, no reward fields); (c) design/product rules prohibit unsupported reward promises. Directions present in sources only: (i) remove/align the promise to attribution-only — product impact: copy + data-model alignment; economic: zero; implementation: trivial; data: none; fraud/legal: minimal; (ii) design a capped reward backing — product: new benefit surface; economic: ledger + caps + expiry + fraud controls (HIGH burden); implementation: ledger + attribution + audit; data: eligibility + fraud + accounting; legal/tax review required. No amounts invented. Decision required: does Club referral have an economic reward at all? If yes, the mechanism must be defined before implementation; if no, copy/model align to attribution-only. Code and documents NOT modified in this task.

## SECTION 16 — CROSS-GATE DEPENDENCY MAP

- Independent now: G3 confirm, G8 confirm, G12 drafting (content), domain modeling.
- Depends on G1: everything sizing-related (G2 split, G5 awards feasibility, G10 tripwire calibration, G11 thresholds).
- Requires operational data: G2 calendar, G5 min-stay exceptions, G6/G7 behavioral values, G8 dates.
- Requires legal/tax review: G7 monetary-penalty question, G12 promise, G13 rewards, benefit-in-kind flag.
- Chain: G1 → G2 → G5 → G6/G7/G8/G9 → G10 → G11; G13 parallel; G12 after G10/G11; G4 needs arrival estimates alongside G1.

## SECTION 17 — WHAT THE BUSINESS OWNER ACTUALLY NEEDS TO DECIDE

### Decision 1 — Pool size
Question: What portion of available days is committed? Options: 25%/50%/~67% (+ custom). Evidence: §3 table; 2,160 DERIVED base. Impact: sizes every downstream number. Approval: Business Owner + operator signature.

### Decision 2 — Calendar
Question: Season bands, split, blackouts, min-stay exceptions? Options: 4-band starter or custom. Evidence: rate tables (evidence only). Impact: unlocks peak/award/window rules. Approval: Owner + operator.

### Decision 3 — Tier model
Question: Priority, weights, windows? Options: equal/priority/weight/hybrid. Evidence: §6 comparison. Impact: fairness + perceived value. Approval: Product Owner.

### Decision 4 — Awards & peak
Question: 3/4 structure, upgrade trigger, peak cap? Options per §7. Impact: fulfillment feasibility. Approval: Product Owner + operator.

### Decision 5 — Fair-use values
Question: caps, windows, cooldowns? Impact: enforcement buildability. Approval: Product Owner.

### Decision 6 — Cancel/no-show
Question: ladders, windows, 90-day starter? Impact: waste control. Approval: Product Owner (+ legal if monetary).

### Decision 7 — Lottery parameters
Question: weights, pity, seed/audit spec? Impact: draw determinism. Approval: Product Owner.

### Decision 8 — Liability hard limits + tripwire
Question: which controls are hard limits; tripwire value? Impact: scaling safety. Approval: Business Owner.

### Decision 9 — Scaling thresholds
Question: phase framing + admission policy? Impact: growth ops. Approval: Business Owner.

### Decision 10 — Promise language
Question: exact approved wording? Impact: communication/legal. Approval: Product Owner + legal.

### Decision 11 — Referral rewards
Question: economic reward or attribution-only? Options per §15. Impact: ledger build vs copy fix. Approval: Business Owner (+ legal/tax if rewards).

### Decision 12 — Entry lifecycle
Question: confirm lifecycle + dates? Impact: draw operations. Approval: Product Owner + ops.

## SECTION 18 — DATA REQUEST PACK

A. Property/Operations: available/occupied/owner-use dates; maintenance blocks; blackouts; min-stay + exceptions; turnover reqs (granularity villa×date; source operator; blocks G1–G3/G5/G7).
B. Booking/Rental Ops: confirmation/response/release windows; lead times; cancellation/no-show rates; arrival/usage curves (blocks G6–G10).
C. Finance: turnover costs; blended rate; concierge unit cost; card cost; partner terms (blocks cost model + G8/G13).
D. Legal/Tax: benefit-in-kind treatment; penalty permissibility; referral reward tax (blocks G7/G12/G13).
E. Concierge/Partners: staffing model; volume capacity; experience contracts (blocks concierge + Escape supply).
F. Membership/Growth: tier forecast; participation/request frequency; waitlist tolerance (blocks G4/G6/G11).
No invented sources; where the source is unknown, the owner is "TBD — owner to designate."

## SECTION 19 — DECISION SEQUENCE

1. G1 allocation basis (sizes everything; needs availability data first).
2. Operator availability + calendar data delivery.
3. G2 season/calendar + G5 award/peak constraints (parallelizable once data lands).
4. G4 tier model + G6 fair-use values (needs arrival/usage estimates).
5. G9 lottery parameters + G7 cancel/no-show + G8 lifecycle confirm.
6. G10 liability hard limits + tripwire + monitoring plan.
7. G13 referral + G12 promise language (+ legal).
8. Data Contract V1 safe (after 1–3 + nullable/provenance policy).
9. Architecture safe (after 4–6 + booking boundary).
10. Implementation safe (after 7 + min-stay exceptions + enforcement values).
Provisional values may advance steps 8–9 in draft; BLOCKED items hold step 10.

## SECTION 20 — FINAL BUSINESS APPROVAL SHEET

| Gate | Decision | Business Owner Decision | Evidence Attached | Approved? | Notes |
|---|---|---|---|---|---|
| G1 | Club allocation / signed nights | TBD | §3 table | TBD |  |
| G2 | Season/calendar model | TBD | §4 | TBD |  |
| G3 | Eligibility boundary | TBD | §5 | TBD |  |
| G4 | Tier interaction model | TBD | §6 | TBD |  |
| G5 | Award + peak constraints | TBD | §7 | TBD |  |
| G6 | Fair-use / booking controls | TBD | §8 | TBD |  |
| G7 | Cancellation / no-show policy | TBD | §9 | TBD |  |
| G8 | Credit issuance / expiry | TBD | §10 | TBD |  |
| G9 | Lottery parameters | TBD | §11 | TBD |  |
| G10 | Liability / tripwires | TBD | §12 | TBD |  |
| G11 | Scaling thresholds | TBD | §13 | TBD |  |
| G12 | Member promise language | TBD | §14 | TBD |  |
| G13 | Referral rewards | TBD | §15 | TBD |  |

(All decision fields intentionally empty.)

## SECTION 21 — IMPLEMENTATION GATE

BUSINESS DECISIONS CLOSED → DATA CONTRACT V1 → ARCHITECTURE V1 → IMPLEMENTATION PLAN → CONTROLLED IMPLEMENTATION. Later phases not started.

---

## Appendix A — QA verification

- All six sources read completely; G1–G13 mapped to Closure gates (§2 table); every decision has evidence/options/dependencies; no decision made (approval sheet empty; no rankings, no winners, no preferred options).
- Provenance on every number; 1,450 MODELED/PROVISIONAL; 270 MODELED; 2,160 DERIVED; C1 preserved unresolved.
- No new assumptions, values, dates, costs, weights, or probabilities introduced.
- No production code modified (documentation-only task).
