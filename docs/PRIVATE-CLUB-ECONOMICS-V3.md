# FractionalLuxe Private Club — Economics Definition v3: Stay Pool, Credits & 3–4 Night Lottery Model

> **Status:** definition/analysis only. No implementation, no UI/code/copy/route/threshold changes.
> **Provenance labels:** OBSERVED · ESTIMATED · MODELED · DERIVED · UNKNOWN · CONFLICTED.
> **Builds on:** v1 (`PRIVATE-CLUB-ECONOMICS.md`) and v2 (`PRIVATE-CLUB-ECONOMICS-V2.md`) — both preserved. §2 documents what v2 got wrong.

---

## 1. Executive Summary

1. **Correction:** v2 framed capacity as 24 × 270. That is wrong for this model. 270 days are MODELED *occupied* days; Club inventory comes from the *non-occupied* side: 24 × 90 = **2,160 modeled available days** (DERIVED), of which **~1,450 is a MODELED/PROVISIONAL Club allocation** — not "24 × 90."
2. **Award math:** 1,450 nights → **362 complete 4-night awards** (+2 remainder) or **483 complete 3-night awards** (+1 remainder), DERIVED.
3. **Integer-night principle:** fractional "nights/member" is analytical only; every real award is a whole 3- or 4-night package.
4. **Transition band (calculated, §13):** strong allocation (≥ ~80% win probability) holds to roughly **360–600 Private members** depending on package mix; beyond that the system must operate as an explicit lottery. Recommended operating rule: declare Phase B (lottery-first framing) at **500 members**.
5. **Credit definition (recommended):** one credit = **one lottery entry for one award season**, earned by eligibility (tier + good standing), weighted by tier window-priority and a capped loss-streak pity factor — never "1 credit = 1 night" (§10).
6. **Lottery recommendation:** hybrid — equal base entry, tier-weighted, capped pity, timestamp tiebreaks; exact ties by lottery (§11).
7. **Award recommendation (SUPERSEDED 2026-09-26 — locked 4-night base stay):** 3-night standard, 4-night off-peak upgrade path (capacity + turnover + min-stay evidence, §9).
8. **Liability stays bounded** via: finite pool, annual credit reset, no rollover, per-member caps, peak sub-caps, waitlist, published blackouts (§18).
9. **§26 answers:** (1) YES for early phase; (2) ~360–600, operate lottery framing from 500; (3) credit = lottery entry; (4) hybrid; (5) 4-night standard (locked 2026-09-26; supersedes the 3-night + upgrade recommendation); (6) finite pool + expiry + caps + no-rollover; (7) data list in §22.

## 2. Correction to Economics v2

v2's error: it applied the Club allocation rate to the 6,480 *utilized* nights (displacement framing: pool = 6,480 × %). Under the intended business model that is the wrong base — it prices Club nights as displaced peak rental and produces absurd costs (≈$23M at Grand-2 rates), because it treats occupied inventory as the source.

Corrected chain (§3): modeled utilization defines what's *taken*; the Club pool is carved from what's *left* (the ~90-day residual), at a separately modeled allocation. Consequences:

- v2 pool sizes (65/162/324) are **superseded** for stay planning (kept only as displacement-cost sensitivity).
- v2 demand model (tier-weighted nights/member), fair-use, liability, concierge/referral, and invariant frameworks are **preserved** — they did not depend on the framing error.
- v2's "pool nights ÷ members" indicator is **insufficient**: fractional results (0.65, 0.16…) cannot become rewards. v3 resolves every fraction into integer packages + a credit/lottery resolution mechanism.

## 3. Core Business Model

Finite annual Club Stay Pool → Private members → dynamic credit/lottery eligibility → whole-night (3–4) awards. Fewer members → higher win probability (early advantage); more members → lower probability (same pool). New members dilute access; they never fund earlier members (§12-style proof carried in §8/§12 of this doc via the dilution monotonicity + no-transfer structure).

## 4. 270-Day Occupancy Assumption

270 utilized days/villa/year. **Provenance: MODELED** (revenue-model minimum-occupancy basis). Not property-level fact; occupancy remains UNKNOWN on all 24 estates; no source field is overwritten. Sensitivity: 270/365 ≈ 74%, inside the legacy Grand-2 60–90% band — plausible, not corroborated.

## 5. Available-Day Model

- Non-occupied residual: 365 − 270 = **90 days/villa/year** (DERIVED from MODELED input; label the 90 itself MODELED).
- 24-villa available pool: 24 × 90 = **2,160 modeled available villa-days/year** (DERIVED).
- Explicit caveat: residual ≠ availability. Maintenance, owner use, turnover friction, and seasonality consume unknown portions (all UNKNOWN). The 2,160 is a planning envelope, not bookable inventory.

## 6. Club Allocation Model

- LOW: 25% of available → **~540 nights** (MODELED).
- MEDIUM: 50% of available → **~1,080 nights** (MODELED).
- HIGH: ~67% of available → **~1,450 nights** (MODELED/PROVISIONAL primary scenario).
- The ~1,450 figure is a business assumption under test, **not** "24 × 90" (which equals 2,160) and **not** an observed fact. Unallocated residual stays in rental/owner/maintenance use.

## 7. ~1,450-Day Primary Scenario

Award capacity (DERIVED, exact):

| Package | Complete awards | Remainder | Remainder handling |
|---|---|---|---|
| 4-night | **362** (362×4=1,448) | 2 nights | Released to rental (too small to award) |
| 3-night | **483** (483×3=1,449) | 1 night | Released to rental |
| Mixed (example: 200×4 + 216×3 = 800+648=1,448) | 416 awards | 2 nights | Released to rental |

At LOW (540): 135×4-night (+0) or 180×3-night (+0). At MEDIUM (1,080): 270×4 (+0) or 360×3 (+0).

## 8. Whole-Night Award Model

- Internal analytics may use decimals (pool ÷ members); every member-facing award resolves to an integer-night package (§5 integer-night principle).
- Remainder nights (< package size) are never awarded, banked, or credited — released to rental inventory. This kills fractional-liability at the root.
- Minimum viable award: 3 nights (below that, turnover/support cost per night dominates member value — qualitative bound; exact turnover costs UNKNOWN).

## 9. 3-Night vs 4-Night Analysis

| Dimension | 3-night | 4-night | Variable 3–4 |
|---|---|---|---|
| Awards from 1,450 | 483 | 362 | Mix-dependent |
| Member experience | Real break, lighter | Stronger "meaningful stay" | Best perception |
| Inventory fragmentation | Fits min-stay ≥3 villas | Blocked where min-stay >4 (e.g. Grand-2 requires 7 — OBSERVED) | Needs exception policy |
| Cleaning/turnover | 483 turnovers (highest burden) | 362 turnovers (lowest) | In between |
| Peak pressure | More winners in peak | Fewer, hungrier peak demand | Tunable |
| Fairness | More members win | Fewer winners, bigger prize | Mixed expectations |
| Operational simplicity | One SKU | One SKU | Two SKUs + rules |

**Recommendation (SUPERSEDED 2026-09-26 — locked 4-night base stay):** 3-night standard + 4-night off-peak upgrade path (Options 3+5 hybrid). Rationale: maximizes winners under scarcity, fits observed min-stay floors, concentrates the expensive 4-night awards where displacement cost is lowest. Peak awards capped at 3 nights. Min-stay conflicts (7-night villas) require an explicit operator exception policy — flagged UNKNOWN/data gate.

## 10. Dynamic Credit Definition

**Precise definition (recommended): one (1) Club Credit = one (1) lottery entry valid for one (1) award season.** Credits are eligibility tokens, not nights, not money, not transferable, not redeemable.

Model comparison:

| Model | Meaning | Fair | Simple | Comprehension | Gaming risk | Liability | Scales | Early advantage | Late experience |
|---|---|---|---|---|---|---|---|---|---|
| A. Tickets | 1 credit = 1 entry | High | High | High | Low | Bounded by pool | High | Via fewer rivals | Thin but honest |
| B. Booking priority | rank, no lottery | Medium | Medium | Medium | Medium (window gaming) | Low | Medium | Strong | Poor |
| C. Hybrid priority + weight | weighted entries | High | Medium | Medium | Low-Medium | Bounded | High | Strong | Fair |
| D. Entitlement conversion | theoretical nights → packages | Low | Low | Poor | High (fractional claims) | High | Low | Confusing | Confusing |

**Recommended: C** — every eligible member receives base entries; tier multiplies weight within published bounds; capped loss-streak pity adds weight; exact ties break by timestamp, then lottery. D is rejected: it recreates the fractional-night problem v3 exists to kill.

## 11. Lottery Models

Equal (A) is fair but wastes tier value; credit-weighted (B) rewards engagement opaquely; tier-weighted (C) matches the product but risks "pay-to-win" perception; hybrid (D) balances all three; priority-queue + lottery ties (E) is operationally heaviest. **Recommended: D with E's tiebreak** — auditable (published weights + timestamp log), manipulation-resistant (no purchasable entries, identity-verified members, one active request), bounded (finite pool caps total awards regardless of entries), defensible (rules published before each season).

## 12. Early-Member Advantage

Win probability ≈ awards ÷ eligible members (DERIVED, assuming full eligibility):

| Private members | 4-night (362) | 3-night (483) |
|---|---|---|
| 100 | 362% (3.6× coverage) | 483% |
| 200 | 181% | 242% |
| 300 | 121% | 161% |
| 400 | 90% | 121% |
| 500 | 72% | 97% |
| 750 | 48% | 64% |
| 1,000 | 36% | 48% |
| 2,000 | 18% | 24% |

>100% means slack for choice/rebooking, not extra awards. Framing: earlier = fewer rivals for a finite pool. Never funded by later members: no transfers exist; dilution is monotonic — each added member can only *reduce* others' probability, which is the mathematical proof of non-pyramid structure.

## 13. Transition Point

"Strong allocation" = win probability ≥ ~80% for a participating member (MODELED threshold for the phase definition):

- 4-night awards: 100% to ~362 members; 80% to ~452 members.
- 3-night awards: 100% to ~483; 80% to ~604.
- **Calculated transition band: ~360–600 members.** Operating rule: run Phase-A framing below ~350; switch to explicit lottery-first framing at **500 members** (clean, inside the band for both packages). N was calculated, not invented.

## 14. Member Scenarios

Per §12 table (100/200/300/400/500/750/1,000/2,000): theoretical pool/member, complete packages (362×4 / 483×3 fixed by pool), member-to-award ratios (= win probabilities above), lottery pressure (= inverse), expected frequency (≈ probability per season), liability (bounded by pool size in all rows — the finite pool is the liability ceiling).

## 15. Tier Interaction

Tiers unchanged. Tier affects: eligibility (Private+ for stays; Standard preview-only — existing invariant), credit weight multiplier within published bounds (normative V1 weights, locked 2026-09-26: Private 1.0×, Plus 1.25×, Elite 1.5×, Signature 2.0×), booking windows (v2 §10 starter values carried), peak access gating, maximum award size (peak capped at 3 for all tiers). No tier receives guaranteed nights. Higher tiers get *probability and priority*, never quantity promises.

## 16. Peak/Off-Peak

Pool split starter (MODELED): Peak 20% / High 25% / Shoulder 30% / Off-peak 25%. Peak awards 3-night only; Elite/Signature gating under scarcity; blackouts published; no named holidays promised. 4-night upgrades valid off-peak/shoulder only.

## 17. Fairness

Pure lottery risks repeat losers; pure guarantees create liability. Bounded middle ground (recommended): capped pity weight (+1 entry-equivalent per consecutive losing season, max 3× base, resets on win) + published odds + timestamp tiebreaks + annual eligibility audit. Pity is bounded, therefore liability-bounded — unlike uncapped accumulation.

## 18. Credit Expiry/Accumulation

- Credits **reset each award season** (recommended annual); no rollover.
- No tenure accrual, no investment-amount accrual (would convert membership into yield-like returns — forbidden by product invariants).
- Only carryover: capped pity counter (bounded, resets on win).
- Liability proof: reset bounds maximum outstanding entries to one season's issuance; rollover alternative compounds backlog (~20% unused → +65–97 entries/yr on these pools), recreating the v2 rollover finding.

## 19. Liability Analysis

Carried from v1/v2 (guarantees HIGH, uncapped referrals HIGH, unlimited concierge HIGH, cash-like credits HIGH) plus v3-specific: fractional-award promises (eliminated by integer rule), rollover backlog (eliminated by reset), repeat-winner concentration (bounded by one-award-per-season-per-member cap, recommended), no-show waste (forfeiture + cooldown), gaming (identity + one-active-request + non-transferability). Peak concentration remains the dominant residual risk.

## 20. Stress Tests

Usage multipliers 0.5×/1×/1.8× scale eligible demand; pool fixed → probability tables recomputed per row (method stated; representative: balanced-500 at HIGH usage ≈ demand 2,034 vs 362 four-night awards → ~18% win rate). Low allocation (540 pool → 135×4): binding from ~150 members. Breaking point definition: sustained win rate < ~15% with no status consolation = experience failure → tripwire to pause admissions or expand pool (decision gate, not auto-rule).

## 21. Product Rule Candidates

P1 pool published annually (nights + peak split). P2 no guaranteed nights in copy. P3 one credit = one season entry. P4 annual reset, no rollover, non-transferable. P5 tier weights published within bounds. P6 capped pity (≤3×, resets on win). P7 one active request + one award per season per member. P8 peak 3-night cap + gates. P9 4-night standard (locked 2026-09-26; supersedes the 3-night + upgrade recommendation). P10 remainder released to rental. P11 timestamp tiebreaks, lottery for exact ties. P12 min-stay exception policy per villa. P13 admission tripwire on sustained low win rates.

## 22. Required Data

v1/v2 registers stand, plus: operator-confirmed min-stay exceptions for sub-week awards; turnover cost per stay; blended effective nightly rate; peak calendar + blackouts; member arrival/usage curves; waitlist tolerance; no-show/cancellation rates; tax treatment of complimentary stays; card/fulfillment costs (carried); concierge staffing (carried); referral eligibility (carried, G1).

## 23. Open Questions

v1/v2 questions stand, plus: (13) exact peak split %? (14) pity cap value? (15) tier weight values? (16) season length (annual vs semi-annual awards)? (17) transfer-once gifting rule for Escape vs non-transferable stay awards — consistent? (18) min-stay exception pricing — who absorbs?

## 24. Implementation Gates

Same standing rule as v1/v2: no ledger, no booking, no copy changes until G-series gates clear (allocation band, peak calendar, fair-use numbers, copy bands, credits go/no-go, Escape supply, min-stay exceptions, admission tripwire).

---

## Appendix A — Verification

- v2 read and preserved; v2's 24×270 framing explicitly corrected (§2); v2 demand/fair-use/liability frameworks reused.
- Thresholds/benefits/copy/routes untouched (doc-only task).
- 270 = MODELED, 90 = MODELED, 2,160 = DERIVED, ~1,450 = MODELED/PROVISIONAL, packages = MODEL INPUTS, probabilities = DERIVED.
- All table arithmetic: 1450÷4 = 362 r2; 1450÷3 = 483 r1; phase probabilities = awards/members; transition band solved from 80%/100% thresholds.
