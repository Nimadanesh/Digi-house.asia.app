# FractionalLuxe Private Club — Economics Definition v1

> **Status:** definition/analysis only. No implementation, no UI copy changes, no production-code changes.
> **Provenance labels used throughout:** OBSERVED · ESTIMATED · MODELED · DERIVED · UNKNOWN · CONFLICTED (see §5).
> **Scope rule:** property economics and Club economics are separate systems (§4). Nothing in this document changes property economics.

---

## 1. Executive Summary

1. The Private Club is a **membership/access layer**, not a financial product. Its economics are the economics of **scarce villa-night inventory, human service, and capped incentives** — not yields, returns, or discounts.
2. The binding constraint is **Club-eligible villa nights**, which are currently **UNKNOWN** (no owner-use allocation, availability calendar, or blackout data exists in the repository).
3. With 24 villas, theoretical maximum inventory is **8,760 villa-nights/year** (DERIVED: 24 × 365). Everything below that ceiling depends on vacancy and allocation decisions that are not yet made.
4. The model therefore works in **nights and priority rights**, not dollars or guaranteed quantities: tiers buy **access order and experience eligibility**, never guaranteed nights, credits with cash value, or returns.
5. **Stay Credits are NOT justified yet.** A credit system is only warranted once confirmed Club inventory exists; until then it would create unbacked liability. The document specifies the exact gate (§10).
6. Stress tests show the Club is viable at 100–1,000 members **only if** Club allocation stays within low single-digit percentages of theoretical inventory and peak usage is hard-capped (§18).
7. The highest-liability items are: uncapped referral rewards (**HIGH**), guaranteed stay promises (**HIGH**), unlimited concierge (**HIGH**), and credit rollover (**MEDIUM**). All are currently absent from the product (correctly) and must stay absent until capped designs are approved (§16).
8. Known copy tension: Club referral copy mentions "Club Credits" while the referral spec is attribution-only and the design bans new reward mechanics — flagged as a decision gate, not resolved here (§21).

## 2. Scope

In scope: membership access model, tier structure economics, six-benefit capacity analysis, villa-stay allocation framework, peak/off-peak rules, Private Escape / Concierge / Referral economic structures, cost framework, fair-use framework, liability analysis, 100/500/1,000-member stress tests, invariants, unknown-data register, decision gates.

Out of scope: property valuation, rental income, yields, fees, settlement, withdrawals, buy/sell mechanics, implementation, UI copy changes, translations.

## 3. Existing Product Invariants

These are fixed inputs, not proposals (all OBSERVED from `src/lib/club/`, `messages/en.json`, `docs/PRIVATE-CLUB-DESIGN.md`):

- Route `/club`; Club is not a bottom tab; `/card` intact; referral flow = existing SettingsSheet invite.
- Tiers (invested-total thresholds, UI prototype): STANDARD $0+ · PRIVATE $10K+ · PRIVATE PLUS $25K+ · ELITE $100K+ · SIGNATURE $500K+.
- Six benefits: ACCESS (Villa Stay, Priority Access) · EXPERIENCES (Private Escape, Concierge) · MEMBERSHIP (Private Club Card, Referral Rewards).
- Unlock progression: STANDARD preview-only; PRIVATE unlocks villa/escape/priority/card/referral; PRIVATE PLUS adds concierge; ELITE/SIGNATURE = status positioning only.
- Selector: `getClubStatus(investedUsdCents)` → `{tierId, nextTierId, toNextUsdCents}`; integer cents; demo portfolio $36,000 → Private Plus, $64,000 to Elite.
- Stay runtime is an honest-unavailable stub (`backend_absent`, all entitlement fields null).

## 4. Data Sources

| # | Source | Path |
|---|---|---|
| S1 | Canonical 24-estate reconciliation | `src/lib/economics/estates/canonical-24.ts` |
| S2 | Estate-24 dataset + contract | `src/lib/economics/estates/estate-24-data.ts`, `src/types/estate-24-data.ts` |
| S3 | Canonical estate type/provenance | `src/types/estate-canonical.ts` |
| S4 | 24-property research JSON | `docs/product/rebuild/ESTATE-24-DATA.json` |
| S5 | Slice-A economic engine + types | `src/lib/economics/estate-economics.ts`, `src/types/estate.ts` |
| S6 | Financial Model V1 + inputs | `src/lib/economics/financial-model-v1.ts`, `.../financial-model-v1-inputs.ts` |
| S7 | Stay stub + types | `src/types/stay.ts`, `src/lib/mock/stay.ts`, `src/lib/api/repos.ts:106-114` |
| S8 | Club UI layer | `src/lib/club/club-tiers.ts`, `club-status.ts`, `club-benefits.ts` |
| S9 | Referral attribution spec | `docs/superpowers/specs/2026-07-30-referral-attribution.md` |
| S10 | Phase 9 Owner-Stay direction | `docs/product/phase-9/PHASE-9-PRODUCT-REDESIGN.md` §12, `PHASE-9-UI-MAPPING-9.0.md` §9 |
| S11 | Rebuild contracts/decisions | `docs/product/rebuild/ESTATE-ECONOMICS-DESIGN-CONTRACT.md`, `PRODUCT-DECISION-LOCK.md`, `ECONOMIC-PHILOSOPHY-PRODUCT-TRUTH.md` |
| S12 | Club design (visual only) | `docs/PRIVATE-CLUB-DESIGN.md` |
| S13 | Demo portfolio seed | `src/lib/mock/seed/holdings.ts`, `src/lib/mock/seed/index.ts` |

## 5. Data Provenance

Every economic value below carries one label:

- **OBSERVED** — directly supported by an authoritative source or verified app data.
- **ESTIMATED** — informed estimate on incomplete evidence.
- **MODELED** — deliberate assumption for scenario analysis.
- **DERIVED** — mathematically calculated from other values (assumptions stated).
- **UNKNOWN** — required information currently unavailable.
- **CONFLICTED** — sources disagree (e.g., legacy $82M Grand-2 valuation vs $8M canonical).

Rule enforced in this document: ESTIMATED/MODELED/DERIVED values are never presented as observed facts. The repo already uses compatible provenance enums (`estate.ts:21`, `estate-canonical.ts:11-22`, `financial-model-v1.ts:33`).

## 6. Property Inventory Inputs

### 6.1 What exists (OBSERVED)

- 24 canonical estates, `re-<RentalEscapesListingId>`, joined 1:1 to Rental Escapes listings (S1, S2, S4).
- Nightly **rate displays** per estate (ranges, from-prices, or DYNAMIC), e.g. Grand-2 `$67,655–$76,458` (RANGE), Trajan `from ~$25,000` (STARTING_FROM), Forza `from ~$12,000` (STARTING_FROM), La Dolce Vita DYNAMIC. These are listing-observed full-buyout displays, **never ADR**.
- Season rate tables with `minStay` arrays (OBSERVED guest rules, e.g. 7 / 3 / 4-5-7-10 nights), check-in/out times, policies, taxes/fees/house rules.
- Valuation bands ESTIMATED (e.g. $15M, $30M, $32M, $40M, $60M, $70M ranges; methodology: research-band LOW adopted).
- V1 engine constants: $100/share; scenarios 220/273/328 nights on approved ANR; agency 5%, operator 7.5%, reserve 1.5% of value, owner 75% of net.
- One cleaning datapoint: Forza exit cleaning fee $2,000 (OBSERVED, single estate).

### 6.2 What is UNKNOWN (binding constraints on this document)

- **Occupancy**: null on all 24 (contract-pinned). No ADR stored anywhere. No annual revenue, yield, or income figures.
- **Owner-use / Club allocation**: no field, no rate, no formula exists in any engine or dataset.
- **Blackout dates, availability calendars, booking engine**: absent; stay entitlements stubbed `backend_absent`.
- **Cleaning/turnover cost schedule**: one datapoint (Forza), otherwise UNKNOWN. Concierge cost: UNKNOWN. Partner experience costs: UNKNOWN.
- Legacy Grand-2 seed ($8M, $67–80k, 60–90%) exists in the retired Slice-A layer only — usable as ESTIMATED single-villa illustration, never as 24-wide fact.

### 6.3 Derived inventory ceiling

- Theoretical maximum: 24 villas × 365 days = **8,760 villa-nights/year** (DERIVED, exact arithmetic on OBSERVED villa count).
- For scale only (DERIVED/MODELED illustration, not a business fact): at a MODELED 20% vacancy, theoretical vacant pool ≈ 1,752 nights; a MODELED 5% Club share of that pool ≈ 88 nights/year across all 24 villas. Assumptions stated; true vacancy UNKNOWN.

## 7. Club Capacity Model

Separate, in order (only layer 1 is OBSERVED):

1. **Total property inventory**: 24 villas (OBSERVED).
2. **Rental inventory**: UNKNOWN (no occupancy/availability data).
3. **Owner/private inventory**: UNKNOWN (no owner-use allocation exists).
4. **Potential Club inventory**: UNKNOWN — bounded above by the 8,760-night ceiling (DERIVED).
5. **Confirmed Club inventory**: **zero** — no villa is confirmed for Club use (OBSERVED absence).
6. **Club-eligible nights**: UNKNOWN — the single variable the business must go create.
7. **Peak Club inventory**: UNKNOWN (no peak calendar exists; Christmas/New Year availability must NOT be assumed).
8. **Off-peak Club inventory**: UNKNOWN.

Conclusion: capacity planning must proceed **top-down from a negotiated allocation** (nights/year the business secures), not bottom-up from property data that does not exist.

## 8. Membership Capacity Model

Demand unit: **requested villa-nights per member per year**, tier-weighted (all demand figures MODELED):

| Tier | MODELED nights/member/year | Basis |
|---|---|---|
| Standard | 0 (preview only) | Product invariant (§3) |
| Private | 2–4 | MODELED assumption |
| Private Plus | 3–5 | MODELED assumption |
| Elite | 4–7 | MODELED assumption |
| Signature | 5–10 | MODELED assumption, concierge-assisted |

Utilization = DERIVED: (Σ members × tier demand) ÷ confirmed Club nights. Because confirmed nights = 0 today, every scenario below is expressed as **required nights** (demand side only), which §18 then constrains.

## 9. Tier Model

Tiers sell **priority and eligibility**, never quantities (access inventory is UNKNOWN, so quantities cannot be honestly priced):

- STANDARD ($0+): preview only. Zero demand weight. No liability.
- PRIVATE ($10K+): core access — stay eligibility, escape eligibility, priority window, card, referral. Standard booking window (to be defined in nights/days, value UNKNOWN pending operator input).
- PRIVATE PLUS ($25K+): + concierge channel + earlier window (e.g. MODELED +7 days illustrative only).
- ELITE ($100K+): + earliest window + status recognition. No additional guaranteed nights (unjustified by capacity).
- SIGNATURE ($500K+): + white-glove handling + first refusal on released peak inventory. No guaranteed nights.

Higher tiers may receive priority, windows, and status — never guaranteed nights, credits with cash value, returns, or discounts (none supported by capacity evidence).

## 10. Villa Stay Economics

### 10.1 Allocation primitives (provisional, require operator data)

Annual Club nights cap · per-villa caps · per-member annual cap · min/max stay (guest min-stay arrays OBSERVED: 3–10 nights bound the feasible range) · advance window by tier · blackout set · cancellation/no-show rules · no rollover default · waitlist with tier-priority + timestamp tiebreak · concurrency cap per villa.

### 10.2 Are Stay Credits justified? Not yet.

Credits are justified only when **fungible inventory** exists to back them. Current state: confirmed inventory = 0, so a credit would be an unbacked promise. **Gate for credits:** confirmed Club nights ≥ 2× modeled annual demand for two consecutive seasons, plus an expiration/liability policy (§16, §18). If later adopted: 1 credit = 1 off-peak villa-night equivalent; peak nights cost a MODELED multiplier (e.g. 2× illustrative); credits created only against confirmed inventory; expire after 12 months; never transferable, never cash-redeemable (else they become financial liability).

### 10.3 Opportunity-cost frame (illustrative, Grand-2 anchors)

Opportunity cost per Club night ≈ displaced rental revenue (ESTIMATED from OBSERVED range): Grand-2 range midpoint $72,056.50/night (DERIVED from `$67,655–$76,458`); at MODELED 10 allocated nights ≈ **$720,565/year displaced gross on one villa** (DERIVED/MODELED). At portfolio scale this is why allocation must stay in low single-digit percentages of theoretical inventory. Cleaning/turnover per stay: UNKNOWN except Forza $2,000 datapoint.

## 11. Peak/Off-Peak Model

Recommended four-band skeleton (bands defined by future operator calendar; dates UNKNOWN today): Peak / High / Shoulder / Off-peak.

- Peak: tier-gated (Elite/Signature only in scarcity), max nights per member per year (MODELED starter: 3–5), no rollover into peak, waitlist mandatory, blackout list published.
- High: Private Plus and above, MODELED starter cap 5–7 nights.
- Shoulder/Off-peak: all eligible tiers, standard caps, rollover-forbidden (liability control).
- Credit multiplier (if credits ever adopted): Peak 2×, High 1.5×, Shoulder 1×, Off-peak 1× (all MODELED placeholders).
- Never promise named holidays without a signed inventory calendar (UNKNOWN).

## 12. Private Escape Economics

Candidate structures compared:

| Model | Cost driver | Burden | Abuse risk | Scalability | Data needed |
|---|---|---|---|---|---|
| Fixed annual allowance (1 escape/member/yr) | villa-night + experience | HIGH | HIGH (transfer/sale) | Poor without caps | Confirmed nights, experience costs (UNKNOWN) |
| Invitation-based (member gifts, Club fulfills from capped pool) | pooled nights | MEDIUM | MEDIUM (identity verification) | Medium | Pool size, verification flow |
| Experience budget (partner-funded) | partner subsidy | LOW to Club | LOW | Good | Partner contracts (UNKNOWN) |
| Tier-gated (Elite/Signature only) | concentrated demand | MEDIUM | LOW | Good | Tier distribution (UNKNOWN) |

Recommendation (provisional): invitation-based from a capped annual pool, tier-gated at Private+, partner-funded experiences preferred. Gifting copy ("Give someone special…") is compatible only with the invitation model; fixed allowances would convert gifts into entitlements and multiply liability. Occasions (Valentine/birthday/anniversary/honeymoon) are demand-shaping labels, not inventory.

## 13. Concierge Economics

Concierge is **human-service cost**, unbounded by default: cost ≈ requests × minutes × fully-loaded rate + partner pass-throughs. All three inputs UNKNOWN. Required boundaries before launch: published scope (stays/escapes/membership questions only), response SLA, included-vs-paid line, escalation path, per-member monthly request cap (fair-use), Private Plus gate (matches current unlock). Without caps, concierge is HIGH liability (§16). No vendor or cost may be invented; use MODELED unit economics only in closed planning with labeled assumptions.

## 14. Referral Economics

Current state: UI-level invite via existing flow; attribution spec is attribution-only (first-write-wins, no reward fields); Club copy mentions "Club Credits" — a **CONFLICTED** promise surface (copy vs spec vs design ban on new reward mechanics). Economics required before any reward: strictly separate PRODUCT BENEFIT (access, e.g. priority window bump — capacity-cheap) from FINANCIAL REWARD (anything monetary — HIGH liability, needs ledger, caps, anti-fraud, accounting). No amounts or percentages are supportable today. Required controls: attribution window, self-referral/fraud rules, eligibility definition ("eligible investment"), cap per referrer, expiry. Decision gate in §21 resolves the copy conflict first.

## 15. Club Cost Model

Annual Club Cost = Villa Benefit Cost + Experience Cost + Concierge Cost + Operations Cost + Referral Cost + Other.

| Category | Status |
|---|---|
| Villa opportunity cost (displaced rent) | Formula-ready (§10.3); inputs UNKNOWN |
| Cleaning/turnover | UNKNOWN (1 datapoint: Forza $2,000) |
| Concierge (human + partner) | UNKNOWN |
| Private experiences (partner/direct) | UNKNOWN |
| Club card (physical production/fulfillment) | UNKNOWN |
| Operations/support/fraud/abuse | UNKNOWN |
| Referral incentives | 0 today (must stay 0 until §14 resolved) |
| Cancellations/no-shows | Policy variables (§10.1), values UNKNOWN |

## 16. Liability Analysis

| Risk | Level | Note |
|---|---|---|
| Guaranteed stay promises | HIGH | Inventory UNKNOWN; any guarantee is unbacked |
| Uncapped referral rewards | HIGH | No ledger/caps/fraud controls exist |
| Unlimited concierge | HIGH | Unbounded human-service cost |
| Credit system without expiry/caps | MEDIUM (HIGH if cash-like) | Rollover accumulation; transfer/sale abuse |
| Peak concentration (holidays) | HIGH | No peak calendar; demand spikes certain |
| Too many members vs thin allocation | MEDIUM | Contained by caps + waitlist if enforced |
| No-show/cancellation waste | MEDIUM | Needs deposit/penalty policy |
| Partner-funded escape shortfall | MEDIUM | Contracts UNKNOWN |
| Physical card fulfillment | LOW | Bounded unit cost once (UNKNOWN value) |
| Copy promising "Club Credits" | MEDIUM | CONFLICTED surface; fix copy or build backing |

## 17. Fair-Use Model

Recommended (define now, implement later): annual per-member night caps by tier; rolling 12-month windows; peak sub-caps; waitlist with tier-then-timestamp ordering; cancellation tiers (free → partial forfeit → full forfeit by notice); no-show = night forfeiture + cooldown (MODELED starter: 90 days); anti-hoarding (one active request per member); no rollover default; cooldowns after peak stays. Goal: no small cohort can consume disproportionate inventory.

## 18. Stress Tests (100 / 500 / 1,000 members)

Demand assumptions MODELED (§8 midpoints: Private 3, Plus 4, Elite 5.5, Signature 7.5 nights/yr). Required Club nights/year (DERIVED, audited):

| Mix (per 100 members) | 100 members | 500 members | 1,000 members |
|---|---|---|---|
| Standard-heavy (70/20/7/2/1%) | ~107 | ~535 | ~1,070 |
| Balanced (40/35/15/7/3%) | ~226 | ~1,130 | ~2,260 |
| Private-heavy (15/55/20/7/3%) | ~306 | ~1,530 | ~3,060 |
| Elite-heavy (10/30/30/20/10%) | ~395 | ~1,975 | ~3,950 |
| Signature-concentrated (5/20/25/25/25%) | ~485 | ~2,425 | ~4,850 |

(Worked example: balanced-100 = 35×3 + 15×4 + 7×5.5 + 3×7.5 = 105 + 60 + 38.5 + 22.5 = 226; ×5 and ×10 scale linearly.)

Read against the 8,760-night theoretical ceiling (DERIVED): 1,000-member signature-heavy demand (4,850) is ~55% of a ceiling that already assumes 100% vacancy — impossible in practice. Against a MODELED 20% vacancy pool (1,752 nights), balanced-500 (1,130) already consumes ~65%, and anything above breaks. Findings:

- 100 members: supportable under any mix with a modest allocation (≤ ~485 nights ≈ 5.5% of theoretical ceiling).
- 500 members: requires ≥ ~1,130–2,425 confirmed nights; viable only with enforced caps + peak controls.
- 1,000 members: requires ≥ ~2,260–4,850 nights (26–55% of theoretical max); HIGH risk without signed peak inventory and strict fair use.
- Utilization risk concentrates in peak: if >30% of demand lands in a 6-week peak window (MODELED behavior), waitlists bind in all scenarios above 100 members.
- Operating burden scales with stays (turnover, support, concierge), not members — Standard-heavy mixes are cheap; Signature-heavy mixes are support-intensive.

Usage sensitivity (low/normal/high = 0.5×/1×/1.8× demand): high-usage 1,000-member elite-heavy ≈ 7,110 nights — exceeds any plausible allocation → hard caps are non-negotiable (§18 invariants).

## 19. Economic Invariants (proposed hard rules)

1. Club shall not promise unlimited villa access.
2. Club inventory shall be capped annually, per villa, and per member.
3. Peak inventory shall be separately constrained with blackouts published.
4. Higher tiers confer priority/windows/status — never unlimited quantities.
5. Referral rewards shall be capped, expiring, and fraud-controlled — or access-only.
6. Concierge shall have a published scope, SLA, and request caps.
7. Any credit system shall expire (≤12 months), be non-transferable, non-cash, and created only against confirmed inventory.
8. No rollover of nights or credits by default.
9. No named-holiday promises without a signed inventory calendar.
10. Copy shall never state monetary benefit values the ledger cannot back.

## 20. Unknown Data Register

Required before economic finalization: actual owner-use allocation per villa; confirmed Club nights/year; peak calendar + blackouts; occupancy (all 24); cleaning/turnover unit costs; concierge unit cost + volume; partner experience costs/terms; card unit cost; member utilization curves; tier distribution forecast; cancellation/no-show rates; referral eligibility definition + fraud controls; tax treatment of benefits (flag, jurisdiction-dependent).

## 21. Recommended Next Decision Gates

- G1: Resolve "Club Credits" copy conflict (remove promise vs design capped backing) — blocks any referral work.
- G2: Negotiate and sign confirmed Club nights (annual + peak split) — blocks stay allocation design.
- G3: Approve fair-use caps + waitlist ordering — blocks booking UX.
- G4: Approve concierge scope/SLA/caps + staffing model — blocks Private Plus promise.
- G5: Credits go/no-go against the §10.2 gate — blocks any credit ledger.
- G6: Partner experience contracts (Escape supply) — blocks Escape fulfillment.

## 22. Open Questions

1. Is owner villa-use time contribution-based (pro-rata by shares) or membership-based (flat per tier)?
2. Should peak access be auctioned, waitlisted, or lottery-allocated at Signature level?
3. Does Priority Access extend to primary offerings (investment) or stays only?
4. What is the Club card's actual fulfillment cost and vendor?
5. Are guest-paid charges (cleaning, taxes) passed through on Club stays?
6. How are Elite/Signature differentiated without quantitative benefits if membership scales?
7. What jurisdiction's tax lens applies to benefit-in-kind reporting?

---

## Appendix A — Files inspected

`src/lib/economics/estate-economics.ts`, `estates/canonical-24.ts`, `estates/estate-24-data.ts`, `estates/financial-model-v1-inputs.ts`, `src/lib/economics/financial-model-v1.ts`, `src/types/estate*.ts`, `estate-canonical.ts`, `estate-24-data.ts`, `financial-model-v1.ts`, `stay.ts`, `src/lib/mock/stay.ts`, `src/lib/mock/seed/holdings.ts`, `index.ts`, `me.ts`, `src/lib/api/repos.ts`, `src/lib/club/*`, `messages/en.json` (club namespace), `docs/PRIVATE-CLUB-DESIGN.md`, `docs/product/rebuild/*.md`, `docs/product/phase-9/*.md`, `docs/research/*`, `docs/adr/*`, `docs/superpowers/specs/2026-07-30-referral-attribution.md`.

## Appendix B — Verification

- No production code modified (only this new document added).
- No property economics altered; no thresholds, benefits, copy, or routes touched.
- Every number above carries a provenance label; modeled values state assumptions.
- Stress-test arithmetic audited (all table figures recomputed from §8 midpoints).
