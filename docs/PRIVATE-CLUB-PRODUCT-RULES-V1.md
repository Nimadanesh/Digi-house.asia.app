# FractionalLuxe Private Club — Product Rules v1 (Stay Pool)

> **Status:** product-rule definition only. No implementation, no UI/code/copy/route/threshold changes.
> **Authorities:** Economics v3 (primary economic authority), Design doc (primary visual authority), v1/v2 (preserved frameworks).
> **Provenance labels:** OBSERVED · ESTIMATED · MODELED · DERIVED · UNKNOWN · CONFLICTED.
> **Readiness tags:** READY (implementable as specified) · PROVISIONAL (concept clear, business value/parameter needs approval) · BLOCKED (required data/decision missing).

---

## 1. Executive Summary

Product Rules v1 converts the v3 dynamic pool + integer-package + credit/lottery model into 60+ auditable rules with explicit dependency chains. Decided here: eligibility (Private+, Standard excluded), annual seasons, one-entry-per-member-per-season credit semantics with annual reset and no rollover (READY), hybrid lottery (tier-priority waitlist + timestamp + lottery-for-exact-ties), 4-night standard (locked 2026-09-26), 3-night peak cap, one active request + one award per season, remainder-to-rental, timestamp ordering, non-transferability. Left PROVISIONAL/BLOCKED: allocation %, peak calendar/split, tier weights, windows, caps values, cooldown length, min-stay exceptions, arrival curves. The system is bounded in every row: finite pool + expiry + caps + no-rollover.

## 2. Product Scope

In scope: stay-pool membership rules, seasons, entries, lottery, weights, awards, peak, booking contract, fair use, cancellation, no-show, waitlist, unused capacity, dilution mechanics, anti-gaming, liability controls, member promise, state machine, parameters, gates. Out of scope: property economics, investment mechanics, fees/settlement, concierge staffing, referral rewards, card fulfillment, UI, implementation.

## 3. Product Invariants

R-P0 (all READY, restating §7 with rule IDs):
- R-P0.1 Pool is finite; R-P0.2 no unlimited stays; R-P0.3 growth dilutes access; R-P0.4 early advantage = fewer rivals; R-P0.5 new members never fund old members (no transfers exist); R-P0.6 awards are whole nights; R-P0.7 fractional nights never user-facing; R-P0.8 no rollover; R-P0.9 credits expire, non-transferable, non-cash; R-P0.10 peak constrained; R-P0.11 tiers grant priority, never unlimited quantity; R-P0.12 stays are not investment returns; R-P0.13 no guaranteed fixed nights unless capacity-signed; R-P0.14 every obligation bounded.

## 4. Membership Eligibility

- R-E1 (READY): Stay-pool eligible tiers: PRIVATE, PRIVATE PLUS, ELITE, SIGNATURE. Thresholds unchanged ($10K/$25K/$100K/$500K, OBSERVED from `club-tiers.ts`).
- R-E2 (READY): STANDARD never enters the pool (preview-only invariant).
- R-E3 (READY): Eligibility evaluated at **lottery time**, not issuance (prevents stale entries).
- R-E4 (READY): Downgrade below Private before lottery → entries void; already-awarded stays stand (no clawback).
- R-E5 (READY): Upgrade mid-season → tier weight of the **higher** tier applies at lottery time; no retroactive entries.
- R-E6 (READY): Mid-season joiners receive entries pro-rata only if joining before the season entry deadline (R-S3); after deadline, wait for next season.
- R-E7 (READY): Membership cancellation voids entries and waitlist positions; confirmed bookings follow cancellation rules (§20).

## 5. Club Stay Pool

Ledger concepts (no implementation; accounting definitions only):
- A. Total property days: 24×365 = 8,760 (DERIVED).
- B. Modeled occupied: 24×270 = 6,480 (DERIVED from MODELED input).
- C. Modeled available: 24×90 = 2,160 (DERIVED).
- D. Club-allocated: C × allocation % → primary scenario **~1,450** (MODELED/PROVISIONAL).
- E. Usable Club nights: D minus maintenance/turnover holds (UNKNOWN → PROVISIONAL haircut parameter `HOLDOUT_PCT`, default TBD).
- F. Awardable nights: E minus peak reserve + remainder truncation to package multiples.
- G. Reserved nights: peak-subpool + concierge-hold (if any; default 0).
- H. Remaining: F − awarded − released; reconciled at season close.
- Pool states: `Pool_Start → Pool_Allocated → Pool_Reserved → Pool_Awarded → Pool_Released → Pool_Remaining`, reconciled to zero liability at season close (R-P0.8).

## 6. Seasons

- R-S1 (READY): one award season per calendar year (annual cadence; simplest expiry boundary).
- R-S2 (PROVISIONAL): season bands OFF-PEAK/SHOULDER/HIGH/PEAK with starter split 25/30/25/20% of pool — needs operator calendar (G3).
- R-S3 (PROVISIONAL): entry deadline (starter: 30 days before first lottery; needs ops approval).
- R-S4 (READY): season calendar published before entries issued; if actual availability differs, pool numbers revise **downward only** mid-season (never upward promises).
- R-S5 (READY): bands are date+property specific, controlled by the operator, not members.

## 7. Stay Credits / Season Entries

- R-C1 (READY): **One credit = one season entry** — an eligibility/participation unit for one award season. NOT a night, NOT a guarantee, NOT money.
- R-C2 (READY): one entry per eligible member per season (base). Tier modifies *weight*, not entry count (prevents entitlement arithmetic).
- R-C3 (READY): entries are seasonal, non-transferable, non-sellable, single-lottery- scoped; one entry cannot win twice (consumed on award).
- R-C4 (READY): unused entries expire at season close; no accumulation across seasons.

## 8. Credit Issuance

Lifecycle (READY as logic; dates PROVISIONAL): eligibility snapshot → season opens → entries issued to eligible members → allocation windows open (tier-staggered) → lottery/allocation runs → entry consumed (win) or expired (lose/season close).
- Join mid-season: R-E6 applies. Upgrade/downgrade: R-E4/R-E5. Ineligible/cancelled: entries void. Win: entry consumed, member exits season lottery (one award max, §16). Lose: entry expires at close; pity counter +1 (capped, §11/§17). Non-participation: entry lapses silently.

## 9. Credit Expiry

- R-X1 (READY): all entries expire at season close; winning consumes the entry.
- R-X2 (READY): losing preserves nothing except the capped pity increment.
- R-X3 (READY): indefinite accumulation forbidden (liability control).
- Exact season length = annual per R-S1 (READY); sub-annual awards would need G3 re-approval.

## 10. Lottery / Allocation Mechanism (candidate adopted)

Hybrid (READY as mechanism; weights PROVISIONAL):
1. Eligible set = Private+ members in good standing at lottery time.
2. Entry set = one live entry each.
3. Weight = tier weight × (1 + pity bonus), pity ≤ +2.0× equivalent, resets on win.
4. Randomization: seeded, logged draw; exact ties → timestamp order; residual exact ties → uniform lottery.
5. Selection proceeds down the ordered list, assigning whole packages while pool remains (peak sub-pool drawn first under peak rules).
6. Redraw on invalid winner (ineligible/duplicate/cancelled entry); duplicates impossible by construction (one entry each).
7. Audit record per draw: entrants, weights, seed, ordered results, awards, remainders (retention TBD/ops).
- Allocation probability = DERIVED per draw; published as bands, never personalized promises (§28).

## 11. Tier Weighting

Direction E-lite carried from v3 (priority + windows + light caps). Normative V1 weights (LOCKED 2026-09-26): Private 1.0×, Plus 1.25×, Elite 1.5×, Signature 2.0×. Windows starter (PROVISIONAL): Signature 180d / Elite 120d / Plus 90d / Private 60d. Caps bound all tiers (§17). No guaranteed nights at any tier.

## 12. Award Rules

- R-A1 (READY): awards are whole-night packages only.
- R-A2 (READY): 4-night standard (locked 2026-09-26; supersedes the 3-night + off-peak-upgrade structure).
- R-A3 (READY): peak awards capped at 3 nights.
- R-A4 (READY): member selects dates within the awarded band/window; system confirms from pool; confirmation deadline applies (value PROVISIONAL).
- R-A5 (READY): fourth night never convertible (cash/credit/transfer); award never splittable across seasons.
- R-A6 (READY): one award per member per season.

## 13. 4-Night Standard Award

READY as structure: 4 consecutive nights, any band subject to peak rules, min-stay exception policy per villa (values BLOCKED pending operator data). 362 awards per 1,450-pool (+2 remainder) (DERIVED).

## 14. 4-Night Off-Peak Upgrade (SUPERSEDED 2026-09-26 by the locked 4-night base stay)

SUPERSEDED: upgrade offered only from off-peak/shoulder inventory at allocation time; if unavailable, award stays 3 nights (no compensation owed). 362 awards per pool if all-4 (DERIVED). Exact upgrade trigger (auto vs opt-in): PROVISIONAL, needs UX/ops decision (G7).

## 15. Peak Rules

Peak sub-pool = season peak share (PROVISIONAL %); Elite/Signature gating under scarcity (READY direction); 3-night max (READY); peak booking window = tier windows (§11); peak lottery drawn first from the peak sub-pool; blackouts published pre-season (BLOCKED on calendar).

## 16. Booking Rules (conceptual contract)

Advance window per tier (PROVISIONAL values); min stay = max(3, villa min-stay) with exception policy (BLOCKED); max stay = award length (READY — stay cannot exceed award); confirmation deadline (PROVISIONAL starter: 7 days); inventory from pool ledger only (§5F).

## 17. Fair-Use Rules

READY direction, values PROVISIONAL unless noted: annual max 1 award (READY); rolling 12-month enforcement (READY); peak sub-cap 1 peak award/season (READY direction); one active request (READY); anti-hoarding via R-A6 + single request (READY); cooldown after 2 consecutive wins — skip next season lottery (READY direction, length PROVISIONAL); max 1 future reservation (READY).

## 18. Cancellation Rules

- Before confirmation: award returns to pool, entry treated as unused-loss (pity accrues), no penalty (READY).
- After confirmation, outside window: nights return to pool if re-bookable else released to rental; pity accrues; strike recorded (READY direction; window value PROVISIONAL).
- Close to arrival / after check-in: forfeiture + strike; 2 strikes → next-season ineligibility (READY direction; windows PROVISIONAL, non-punitive principle: forfeiture only, no monetary penalties — monetary penalties would be financial mechanics requiring separate approval).

## 19. No-Show Rules

No-show = full forfeiture + strike + cooldown. Cooldown length: **PROVISIONAL — BUSINESS APPROVAL REQUIRED** (v3 90-day starter carried as placeholder, not a rule). Two no-shows → next-season ineligibility (READY direction).

## 20. Waitlist Rules

Tier-priority → timestamp → lottery-for-exact-ties (READY mechanism): entry on non-selection or pool exhaustion; promotion in order as nights return; notification with response window (PROVISIONAL starter: 48h); no-response = pass with position forfeited (pity preserved); waitlist expires at season close.

## 21. Unused Pool Capacity

Default (READY): expire + release to rental; within-season reallocation to waitlist up to release cutoff (PROVISIONAL starter: 21 days pre-date); no cross-season carry. Rollover forbidden (liability proof in v3 §12).

## 22. Member Growth / Dynamic Dilution

READY mechanism: fixed annual pool ÷ growing eligible base → published probability bands fall monotonically. No artificial benefit reduction, no fake scarcity, no countdowns. Admission tripwire (PROVISIONAL threshold): sustained sub-15% win rates trigger pool-expansion-or-pause review (G11).

## 23. Early-Member Advantage

Emergent property of §22 (READY as mechanism): fewer rivals → higher probability. Communicable only as shared-pool scarcity (§28 framing), never as returns or guarantees.

## 24. Anti-Gaming Rules

Identity-verified membership (READY direction); one account per human (needs auth support — BLOCKED on enforcement); no entry refresh via cycling (entries issuance-logged); tier snapshot at lottery time defeats pre-lottery upgrades gaming partially + upgrade cooldown (PROVISIONAL starter: upgrades <14d before draw keep old weight); fake bookings → no-show ladder; cancellations abuse → strikes; referral abuse → existing attribution first-write-wins + eligibility definition (BLOCKED on reward definition); entries non-transferable/non-sellable (READY); coordinated pools detectable via audit log (monitoring, BLOCKED on tooling).

## 25. Liability Controls

Each control answers "what prevents unlimited obligation": finite signed pool (cap); whole packages (no fractions); expiry (no backlog); non-transferability (no secondary market); one award/request caps (no concentration); peak sub-pool (no holiday blowout); concurrent-booking limit 1 (no parallel holds); repeat-win cooldown (no capture); cancellation forfeiture (no waste spiral); published bands not promises (no legal guarantee). Residual HIGH risk: peak concentration + hypergrowth — handled by tripwire (G11).

## 26. Member-Facing Promise

MAY SAY (conceptual, not final copy): shared limited annual pool; awards limited/subject to availability; access changes with membership and inventory; early membership = fewer members sharing the pool. MUST NOT SAY: guaranteed N nights; every member gets a stay; investment earns nights; disappearing-night urgency; unlimited stays. Copy finalization is a separate gate (G12).

## 27. State Machine

`INELIGIBLE → ELIGIBLE → ENTRY_ISSUED → PARTICIPATING → SELECTED → AWARD_PENDING → BOOKED → COMPLETED`, with `NOT_SELECTED → (WAITLISTED | EXPIRED)`, `AWARD_PENDING → CANCELLED → (pool return | rental release)`, `BOOKED → NO_SHOW → COOLDOWN`, `COMPLETED → (pity reset, next season)`. Transitions conditioned on §§8–12/18–20. Product state model only.

## 28. Rule Dependency Graph

Property Availability → Club Allocation → Club Stay Pool → Season Calendar → Eligible Members → Season Entries → Tier Priority/Weight → Lottery → 3/4-Night Award → Booking → Completion/Cancellation/No-show → Pool Reconciliation. Cannot finalize without upstream data: allocation % (needs signed nights), calendar (needs operator), weights/windows (needs arrival/usage curves), min-stay exceptions (needs per-villa ops), cooldowns/windows values (needs behavioral data).

## 29. Numeric Parameters

| Parameter | Value | Unit | Provenance | Status | Dependency | Approval? |
|---|---|---|---|---|---|---|
| Modeled occupancy | 270 | days/villa/yr | MODELED | READY (assumption) | Revenue model basis | No (given) |
| Available days | 90 | days/villa/yr | MODELED | READY (assumption) | 270 assumption | No (given) |
| Available pool | 2,160 | nights/yr | DERIVED | READY | 24 villas (OBSERVED) | No |
| Club allocation | ~1,450 | nights/yr | MODELED/PROVISIONAL | PROVISIONAL | Signed nights | **G1** |
| 4-night awards | 362 | awards | DERIVED | READY (math) | Pool size | No |
| 4-night awards | 362 (+2 remainder) | awards | DERIVED | READY (math) | Pool size | No |
| Transition band | 360–600 | members | DERIVED | READY (math) | Package mix | No |
| Lottery framing threshold | 500 | members | MODEL | PROVISIONAL | Ops | **G5** |
| Tier weights 1.0/1.25/1.5/2.0 | — | multiplier | MODEL | LOCKED 2026-09-26 | Arrival/usage | **—** |
| Windows 60/90/120/180 | — | days | MODEL | PROVISIONAL | Operator | **G6/G8** |
| Peak split 20/25/30/25 | — | % of pool | MODEL | PROVISIONAL | Calendar | **G3/G8** |
| Peak cap 3 | — | nights | MODEL | PROVISIONAL | Calendar | **G8** |
| Annual max 1 award | 1 | award | RULE | READY | — | No |
| One active request | 1 | request | RULE | READY | — | No |
| No-show cooldown (90d starter) | TBD | days | UNKNOWN | PROVISIONAL | Behavioral | **G10** |
| Confirmation window (7d starter) | TBD | days | UNKNOWN | PROVISIONAL | Ops | **G9/G10** |
| Response window (48h starter) | TBD | hours | UNKNOWN | PROVISIONAL | Ops | Ops |
| Release cutoff (21d starter) | TBD | days | UNKNOWN | PROVISIONAL | Ops | Ops |
| Pity cap (+2.0×, reset on win) | TBD | weight | MODEL | PROVISIONAL | Fairness review | **G5** |
| Win-rate tripwire (15%) | TBD | % | MODEL | PROVISIONAL | Monitoring | **G11** |

## 30. Required Data Inputs

Signed Club nights + peak split; per-villa min-stay exceptions + turnover feasibility/cost; blended effective rate; operator calendar + blackouts; member arrival/usage curves; cancellation/no-show rates; waitlist tolerance; concierge staffing math; referral eligibility + fraud controls; benefit tax treatment; card costs (carried).

## 31. Unknown / Provisional Rules

All PROVISIONAL/BLOCKED items above remain non-final: allocation %, calendar/split, weights, windows, caps values, cooldowns, min-stay exceptions, arrival curves, tax, concierge staffing, referral rewards, monitoring tooling. No provisional value may be presented as final in implementation.

## 32. Business Approval Gates

G1 allocation approval (blocks pool sizing) · G2 eligible-member definition (ready direction, confirm) · G3 season model/calendar (blocks bands) · G4 entry definition (ready direction, confirm) · G5 lottery mechanism incl. weights/pity (blocks draws) · G6 tier weighting + windows (blocks priority) · G7 3/4-night structure + upgrade trigger (blocks awards) · G8 peak rules (blocks peak) · G9 fair-use caps (blocks enforcement) · G10 cancellation/no-show policy (blocks ladders) · G11 liability limits + tripwire (blocks scaling) · G12 member promise/copy (blocks communication). Each states decision/why/data/blocking as listed.

## 33. Implementation Readiness Checklist

READY (implementable as specified): invariants R-P0, eligibility R-E1–R-E7, pool ledger concepts, annual seasons, entry semantics/expiry/non-transferability, hybrid lottery mechanism, award structures, one-award/request caps, remainder-to-rental, waitlist ordering, state machine, anti-transfer rules. PROVISIONAL: all numeric values above. BLOCKED: calendar, min-stay exceptions, arrival/usage data, monitoring/enforcement tooling, tax, concierge staffing, referral rewards. **The system as a whole is NOT declared implementation-ready** — it becomes so when PROVISIONAL values are approved and BLOCKED data lands.

---

## Appendix A — Verification

- All four source docs read; v3 is primary economic authority; design doc is visual authority.
- `club-tiers.ts`/`club-status.ts`/`club-benefits.ts` inspected; thresholds/benefits/copy/routes untouched by this task (documentation only).
- Every numeric rule carries provenance; modeled values stay modeled; no guaranteed nights; no fractional rewards; rollover/peak controlled; lottery auditable; early advantage capacity-based; no member-to-member funding; promise discipline; unknowns + gates explicit.
