# FractionalLuxe Private Club — Economics Definition v2: Dynamic Stay Pool Model

> **Status:** definition/analysis only. No implementation, no UI/code changes, no production-code modifications.
> **Provenance labels:** OBSERVED · ESTIMATED · MODELED · DERIVED · UNKNOWN · CONFLICTED (§19).
> **Builds on:** `docs/PRIVATE-CLUB-ECONOMICS.md` (v1) — preserved, not replaced (§3).

---

## 1. Executive Summary

1. **New input:** a MODELED business assumption of **270 utilized days/villa/year**, stated to derive from the revenue model's minimum-occupancy basis. It is kept MODELED throughout — never relabeled OBSERVED.
2. **Derived base:** 24 × 270 = **6,480 modeled utilized villa-nights/year** (DERIVED). This is *utilization*, not Club inventory (§17 chain enforced).
3. **Answer to §22: YES, conditionally.** A dynamic Club Stay Pool is economically definable on 270 modeled days + a controlled allocation % + finite growing membership + fair use + no fixed-night guarantees — **iff** the §17 pre-implementation conditions hold (signed nights, caps, peak calendar, copy discipline, no-credit default).
4. **Core finding:** at luxury buyout rates, displacement is brutally expensive (illustrative: 324 HIGH-pool nights at the Grand-2 midpoint ≈ **$23.3M** displaced gross, DERIVED/MODELED). The pool is therefore only viable as a **small, off-peak-weighted carve-out with hard caps** — which is exactly what makes the early-member dynamic work.
5. **Early-member effect is real and legitimate:** per-member theoretical capacity falls monotonically as membership grows (dilution of a finite pool). It is mathematically incapable of being pyramid-like: new members can only *dilute*, never *fund*, existing members (§6 proof).
6. **No Stay Credits yet** (v1 gate stands). If ever adopted, peak multipliers and expiry are specified here provisionally (§9, §12).

## 2. New 270-Day Business Assumption

- **Value:** 270 days/villa/year of utilization. **Provenance: MODELED** (business assumption from the revenue model's minimum-occupancy basis, per the task brief).
- It is a portfolio-level planning scalar, **not** a property-level observation: occupancy remains null/UNKNOWN on all 24 estates (v1 §6.2, re-verified this task via `club-tiers.ts` thresholds check + unchanged repo state).
- It must NOT overwrite, reinterpret, or backfill any OBSERVED/UNKNOWN field in the estate datasets.
- Sensitivity note: 270/365 ≈ 74% implied utilization — inside the legacy Grand-2 60–90% band (ESTIMATED single-villa illustration), so the assumption is *plausible* but remains MODELED, not corroborated, at 24-villa scope.

## 3. Relationship to Existing Economics v1

- Preserved intact: liability analysis, peak-concentration findings, fair-use framework, concierge/referral economics, tier logic, unknown-data register, the 10 economic invariants, decision gates G1–G6.
- Changed by the 270-day input: capacity reasoning moves from "allocation of an unknown pool" (v1 §7) to "allocation of an explicit modeled base" (§4–§5 below). All v1 UNKNOWNs remain UNKNOWN; the 270 figure adds a *planning base*, not evidence.
- v1 stress-test demand side (tier-weighted nights/member) is reused as the demand model against the new supply side.

## 4. 24-Villa Capacity Model

Theoretical modeled utilized base (DERIVED, exact arithmetic on MODELED input):

- 24 villas × 270 days = **6,480 modeled utilized villa-nights/year**.
- Complement: 24 × (365 − 270) = **2,280 theoretical non-utilized nights/year** (DERIVED). This is a calendar residual, **not** availability — maintenance, owner use, turnover friction all live here and are UNKNOWN.

Two framings for where Club nights come from (both require operator confirmation):

- **Framing A — displacement (primary, recommended):** Club nights are carved from utilized capacity; every Club night displaces rental revenue at full opportunity cost. Liability is explicit and priced.
- **Framing B — vacancy capture (alternative):** Club nights are captured from the 2,280-night residual (e.g. MODELED capture 5%/10%/20% → 114/228/456 nights). Cheaper on paper but dishonest if the residual is already consumed by unknown frictions — same UNKNOWN problem, hidden. Rejected as primary; kept as sensitivity.
- Required explicit chain (§17): MODELED VILLA UTILIZATION (6,480) → POTENTIAL VILLA CAPACITY → CLUB ALLOCATION (%) → CLUB STAY POOL → MEMBER ACCESS (priority/window/caps, never guarantees).

## 5. Club Allocation Model

Club Stay Pool = 6,480 × Club Allocation Rate. Three labeled scenarios (allocation % MODELED; recommended operating band: LOW–MEDIUM):

| Scenario | Allocation (MODELED) | Pool nights/yr (DERIVED) |
|---|---|---|
| LOW | 1% | **~65** |
| MEDIUM | 2.5% | **~162** |
| HIGH | 5% | **~324** |

- LOW is the only band where displacement cost stays containable (see opportunity math §6-adjacent below).
- HIGH is included as a stress boundary, not a recommendation: 324 nights ≈ one full villa-year of utilization (324 ≈ 365 × 0.89) spread across 24 villas.
- No single final percentage is selected; the product-rules phase must pick within LOW–MEDIUM pending signed inventory.

## 6. Dynamic Club Stay Pool

Pool behavior as membership grows (pool fixed per scenario; per-member figures DERIVED, analytical only — never entitlements):

| Members | LOW (~65) | MEDIUM (~162) | HIGH (~324) |
|---|---|---|---|
| 100 | 0.65 | 1.62 | 3.24 |
| 250 | 0.26 | 0.65 | 1.30 |
| 500 | 0.13 | 0.32 | 0.65 |
| 1,000 | 0.06 | 0.16 | 0.32 |
| 2,000 | 0.03 | 0.08 | 0.16 |

Oversubscription check (v1 balanced-mix demand: 226/1,130/2,260/4,520 nights at 100/500/1,000/2,000 members; DERIVED):

| Members (balanced demand) | vs LOW | vs MEDIUM | vs HIGH |
|---|---|---|---|
| 100 (226) | 3.5× over | 1.4× over | 0.7× (slack) |
| 500 (1,130) | 17× over | 7× over | 3.5× over |
| 1,000 (2,260) | 35× over | 14× over | 7× over |
| 2,000 (4,520) | 70× over | 28× over | 14× over |

Reading: under balanced demand the pool binds almost immediately — which is *expected and healthy* for a scarce club good, provided binding is handled by waitlist + caps rather than by manufacturing inventory. The pool does not need to clear demand; it needs to **allocate fairly under persistent excess demand** (§11, §13).

Opportunity-cost anchor (why allocation must stay small): Grand-2 OBSERVED range midpoint = (67,655+76,458)/2 = **$72,056.50/night** (DERIVED). HIGH pool at that rate ≈ 324 × 72,056.50 ≈ **$23.35M displaced gross/year** (DERIVED/MODELED illustration, single-villa rate applied pool-wide as an upper bound). Blended 24-villa rate is UNKNOWN. Implication: Club stays must be off-peak/shoulder-weighted with peak sub-caps; displacing peak buyout inventory at scale is economically indefensible.

Structural friction (OBSERVED): guest min-stay arrays run 3–10 nights, so sub-week escapes may be infeasible at some villas — another reason per-member "night counts" mislead and access-window framing is superior.

## 7. Membership Scaling Model

Same pool, more members → monotonic dilution (DERIVED from §6 table). Operational read per band:

- **100 members:** pool feels generous at HIGH, tight at LOW. Caps optional but should exist from day one (precedent-setting).
- **250 members:** MEDIUM pool ≈ 0.65/member — waitlist activates under balanced demand. Fair-use mandatory.
- **500 members:** all scenarios oversubscribed ≥3.5× — waitlist is the normal path, not the exception. Peak sub-caps bind.
- **1,000 members:** 7–35× oversubscribed — experience quality depends entirely on priority ordering + peak gating + concierge triage.
- **2,000 members:** 14–70× — viable only as a status/priority club with rare fulfillment; product must set this expectation *before* scaling here (copy discipline, §8).

## 8. Early-Member Advantage

Fixed MEDIUM pool (162 nights) across growth phases (DERIVED):

- PHASE 1 (100 members): **1.62** theoretical nights/member.
- PHASE 2 (500 members): **0.32** (−80% vs Phase 1).
- PHASE 3 (1,000 members): **0.16** (−90% vs Phase 1).

Peak impact: early phases clear shoulder demand with rare waitlists; later phases push peak demand permanently onto waitlist, making tier priority (§9) the binding allocator. The growth incentive is legitimate **iff** communicated as shared-pool dilution ("fewer members sharing the pool today"), never as guaranteed nights or returns. It rewards timing with *access probability*, not with value transfer.

## 9. Tier Interaction

Five models compared (no selection made here; recommendation noted):

| Model | Fairness | Simplicity | Scalability | Liability | Perceived value | Abuse resistance | Ops complexity |
|---|---|---|---|---|---|---|---|
| A. Same pool, booking priority | High | High | High | Low | Medium | Medium | Low |
| B. Same pool, access windows | High | Medium | High | Low | High | High | Medium |
| C. Same pool, max-usage caps | Medium | Medium | Medium | Low | Low | High | Medium |
| D. Tier-weighted allocation | Low* | Low | Medium | Medium | High | Low | High |
| E. Hybrid (A+B+C) | High | Low | High | Low | High | High | High |

*Weighted shares read as entitlements and invite gaming.
**Recommended: E-lite = A + B with light C caps** (priority ordering + tiered windows + annual/peak caps). Rationale: priority and windows consume no inventory by themselves (liability-neutral), caps bound the tail, and all three are explainable without numbers that look like promises. Higher tiers get earlier windows and stronger priority — never guaranteed nights (unsupported by §6 capacity evidence).

## 10. Peak / Off-Peak Model

Pool split (MODELED starter, operator to confirm): Peak 20% / High 25% / Shoulder 30% / Off-peak 25% of Club nights.

- Peak: Elite/Signature gating when oversubscribed, per-member peak cap (MODELED starter 3 nights/yr), mandatory waitlist, published blackouts. No named holidays promised (UNKNOWN calendar).
- Provisional credit multipliers (only if credits ever pass the v1 gate): Peak 2×, High 1.5×, Shoulder/Off-peak 1× (MODELED placeholders).
- Advance windows by tier (MODELED illustration): Signature 180d / Elite 120d / Plus 90d / Private 60d / Standard none. Values require operator confirmation; the *mechanism* (staggered windows) is the invariant, not the numbers.

## 11. Fair-Use Model

Around the dynamic pool (define now, implement later): per-member annual cap (MODELED starter 7 nights) + peak sub-cap (3); rolling 12-month window; one active request per member (anti-hoarding); cancellation ladder (free → partial forfeit → full forfeit by notice); no-show = night forfeiture + MODELED 90-day cooldown; tier-then-timestamp waitlist; concurrency cap per villa; **no rollover by default** (§12). Binding constraint: no cohort, however small, may consume a disproportionate pool share.

## 12. Unused Capacity Model

- **Default: expire + release to rental inventory.** Expired Club nights return to revenue inventory — the operator is made whole, liability stays zero.
- **No rollover** (preferred): rollover creates backlog liability. Proof (DERIVED recurrence): with 20% annual non-use on a 324 pool, backlog grows ~65 nights/yr → ~324 nights (≈ a second full pool) within 5 years, all of it peak-seeking. Partial rollover (e.g. 50%, same-season only) halves but does not remove the compounding; only expiry eliminates it.
- **Dynamic reallocation:** unbooked inventory inside a release window (MODELED starter: 21 days) auto-returns to rental; waitlist backfills from the pool, never from rental.

## 13. Over-Demand Model

100 available vs 150 requested (canonical case). Options compared:

| Mechanism | Pros | Cons | Verdict |
|---|---|---|---|
| First-come-first-served | Simple, legible | Rewards bots/speed, tier value invisible | Reject as sole rule |
| Tier priority | Rewards membership, matches product | Lower tiers rarely clear peak | Adopt as primary |
| Weighted allocation | Proportional "fairness" | Reads as entitlement; complex | Reject |
| Lottery | Peak fairness theater | Destroys tier value proposition | Reject except tiebreaks |
| Waitlist (tier-then-timestamp) | Fair, explainable, scalable | Lower-tier waits | **Adopt** |
| Dynamic availability display | Manages expectations | Needs real inventory feed | Adopt when feed exists |
| **Hybrid (recommended)** | — | — | Tier-priority waitlist + timestamp tiebreaks + lottery only for exact ties |

## 14. Early Member Scenario (worked phases, MEDIUM pool = 162 nights)

- PHASE 1 (100, balanced mix, demand ≈226): 1.4× oversubscribed — most shoulder requests clear; peak waitlists short. Theoretical 1.62/member.
- PHASE 2 (500, demand ≈1,130): 7× oversubscribed — waitlist is normal; tier priority visibly matters; peak effectively gated. Theoretical 0.32/member.
- PHASE 3 (1,000, demand ≈2,260): 14× — fulfillment is scarce and status-driven; concierge triage load rises. Theoretical 0.16/member.
- Access advantage, never investment return: members buy earlier *position in a shared queue*, not yield.

## 15. Growth Incentive Analysis

The incentive ("the pool is less crowded now") is: mathematically real (dilution curve §8), honest (no fabricated countdowns), and self-limiting (it weakens exactly as it succeeds — a stabilizer, not a cliff). Risk: late joiners perceiving a hollow benefit — mitigated by status/priority value that does not dilute (tier windows, recognition) plus copy that sells membership before nights. Forbidden framing: any guaranteed-night countdown or disappearing-benefit urgency.

## 16. Economic Safety Constraints

Safe envelope (LOW–MEDIUM allocation + §11 fair use + §10 peak split): 100 members comfortable; 250 managed; 500 waitlist-normal; 1,000 status-driven; 2,000 only with expectation reset. Breakpoints: capacity insufficient below ~1 night/member theoretical at balanced demand (LOW breaks at ~100, MEDIUM at ~500, HIGH at ~2,000); peak problematic whenever peak share of demand > peak share of pool; liability unacceptable the moment any uncapped promise (nights, credits, concierge, referrals) ships. Usage sensitivity 0.5×/1×/1.8× scales all demand figures linearly — caps, not forecasts, are the control.

## 17. Occupied Days vs Club Days (explicit chain)

`MODELED VILLA UTILIZATION (6,480)` → `POTENTIAL VILLA CAPACITY` → `CLUB ALLOCATION %` → `CLUB STAY POOL (65/162/324)` → `MEMBER ACCESS (priority, windows, caps)`. The 270 days are *utilized* days, of which Club nights are a carved subset — never "270 Club-eligible nights." Conflating them is the single most dangerous misreading of this model.

## 18. Product Rule Candidates (for Product Rules v1, not implementation)

R1 pool = % of modeled base, published annually. R2 no guaranteed nights in copy. R3 tier = priority + windows + caps. R4 peak sub-pool with gates. R5 expiry-by-default, no rollover. R6 one active request per member. R7 cancellation/no-show ladder. R8 waitlist tier-then-timestamp. R9 referral access-only until G1 resolved. R10 concierge scoped/capped. R11 credits forbidden until v1 gate. R12 utilization-triggered copy bands (qualitative only).

## 19. Remaining UNKNOWN Inputs

v1 register stands, plus v2 additions: confirmed Club nights and peak split; operator min-stay/blackout/turnover feasibility for sub-week escapes; blended effective nightly rate; turnover cost curve; concierge staffing math; member arrival/usage curves by tier; cancellation/no-show rates; waitlist UX tolerance; tax treatment of stay benefits.

## 20. Recommended Decision Gates

Carry G1–G6 from v1; add: G7 approve allocation % band; G8 sign peak calendar + blackouts; G9 approve fair-use numbers; G10 approve floating-capacity copy bands; G11 credits go/no-go (unchanged gate, new multipliers specified); G12 Escape supply contracts with per-occasion feasibility.

## 21. Open Questions

v1 §22 stands, plus: (8) displacement vs vacancy-capture as the contractual framing? (9) Should Standard members accrue waitlist seniority? (10) Peak multiplier values if credits ever exist? (11) Who funds shoulder-season turnover on complimentary stays — operator, owner, or Club P&L? (12) Sunset rule if membership exceeds pool viability (e.g. pause new Private admissions)?

## 22. Final Rule Answer

**YES — conditionally.** A dynamic Club Stay Pool on 270 modeled days + controlled allocation + finite growing membership + fair use + no fixed-night guarantees is economically definable **iff, before implementation:** (a) confirmed annual + peak Club nights are signed with the operator; (b) allocation stays in LOW–MEDIUM with per-member, per-villa, and peak caps; (c) waitlist is tier-priority + timestamp with no-rollover expiry; (d) copy states shared-pool access only, never guaranteed nights/returns; (e) concierge and referrals stay scoped/access-only; (f) no credit ledger until the v1 gate; (g) utilization monitoring with a membership-pause tripwire. Absent (a)–(c), the answer is NO — an unbacked pool is a liability, not a benefit.

---

## Appendix A — Verification

- Thresholds re-verified unchanged (`club-tiers.ts`: 0/1M/2.5M/10M/50M cents). No production code, UI, copy, routes, or thresholds modified by this task (definition document only).
- 270-day figure kept MODELED throughout; all downstream math labeled DERIVED with stated assumptions; no source field overwritten.
- v1 preserved; changes from the 270-day input documented in §3.
