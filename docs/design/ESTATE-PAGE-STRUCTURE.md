# ESTATE PAGE STRUCTURE — Source of Truth

> **Status:** STRUCTURE ONLY — nothing on any villa page has been changed yet.
> This document is the single source of truth for the Estate detail page
> (`/property/[id]`, `PropertyDetail`) information architecture. Villa pages are
> refactored **one at a time, villa by villa**, against this structure — after the
> data unification step. No page may be refactored from memory; every refactor
> reads this file first.
>
> **Created:** 2026-09-13 (product-owner structure directive, this session).
> **Supersedes:** the tab-content ordering described in
> `docs/product/rebuild/ESTATE-MARKETING-FUNNEL.md` (PROMPT 05) wherever the two
> disagree; the funnel *roles* (Estate = desire, Income = conviction,
> Ownership = decision, Details = truth) are preserved.

---

## 0. Scope — what this structure may and may not touch

### 0.1 In scope (the only things the refactor changes)

- The content and ordering of the **four tabs**: Estate, Income, Ownership, Details.
- The **fixed 4-stat section** above the tabs (a reorganization of the current
  KPI/metrics area).
- Presentation wiring that mounts the sections above.

### 0.2 Preserve list — must survive byte-for-byte in behavior (never touched)

| # | Preserved element |
|---|---|
| P1 | Buy and Sell buttons and their entry points |
| P2 | The Secondary button linking to the villa's rental page on Rental Escapes (`ReserveVillaCta`) |
| P3 | Buy and sell modals/sheets (BuySheet flow, SellSheet flow) |
| P4 | Lock / Unlock shares functionality (`LockSheet`, `YieldLockSection`) |
| P5 | The sticky header that appears on scroll (`PropertyCompactTopBar`) and the sticky bottom CTA (`PropertyStickyCta`) |
| P6 | All purchase, sale, lock, and navigation logic, state, and components (page-owned `onBuy`, MainButton flow, order book, position flows) |

The refactor is **presentation-of-information only**. Any change that would alter
buy/sell/lock/navigation behavior is out of scope and must be rejected.

### 0.3 Execution order (locked process)

1. **This document** — structure agreed (no page changes). ← *current step*
2. **Data unification** — resolve §8 open data decisions; wire each section's
   data through `useEstateDetailViewModel` (the hooks boundary). No UI change yet.
3. **Villa-by-villa refactor** — one villa at a time, verified per §9 gates.
   No villa may skip the gates; no batch refactor.

---

## 1. Page anatomy (top → bottom)

```
┌────────────────────────────────────────────┐
│ L0  FIXED TOP SECTION (above the fold)     │  §2
│ L1  FIXED 4-STAT SECTION (always visible)  │  §3
├────────────────────────────────────────────┤
│ L2  TABS                                   │
│   Tab 1 — Estate    (desire)      §4       │
│   Tab 2 — Income    (conviction)  §5       │
│   Tab 3 — Ownership (decision)    §6       │
│   Tab 4 — Details   (truth)       §7       │
└────────────────────────────────────────────┘
```

- L0 and L1 are **fixed**: identical shape for every villa, always rendered
  before the tabs, never scrolled into a tab.
- Each tab owns its sections in the exact order given below. Section order
  within a tab is part of this contract.

---

## 2. L0 — Fixed Top Section (above the fold)

| Order | Element | Data source (existing) | Component today |
|---|---|---|---|
| 1 | Photo gallery | `listing.images` | `PropertyGallery` (keep) |
| 2 | Villa name | canonical identity (`estateVm.identity.name`) | `PropertyHero` (keep) |
| 3 | Location | canonical identity (`estateVm.identity.location`) | `PropertyHero` (keep) |
| 4 | Current share price + total shares, with the ownership fraction ("1 share ≈ 1/N of the estate") | V1 nominal `$100` + `v1.totalShares` (`canonical-offering`); hero fraction already V1-based | `PropertyHero` (keep) |
| 5 | Funding progress bar ("X% funded · N shares left") | `listing.sharesSold` / `heroTotalShares` (V1 supply), demo-ledger sold/remaining | `PropertyHero` funding bar (keep) |
| 6 | Estate value ("Estate value: $8M") | `FinancialModelV1Valuation` (`v1.valuation`, ESTIMATED, single value) | `PropertyHero` value row (keep) |
| 7 | Buy button | existing page-owned `onBuy` → BuySheet | `PropertyHero` CTA + `PropertyStickyCta` (P1, keep) |
| 8 | Helper text under the button: "Withdraw anytime — 1% fee, paid in 4 weekly installments" | locked income-model copy (`withdrawalTerms` key, locked 2026-08-23) | existing fee-note slot (keep; ensure it sits under the primary CTA) |

Rules:
- The gallery **never** appears inside a tab.
- The value shown here is the ONE V1 valuation; no other valuation figure may
  appear anywhere on the page (no band, no research range, no legacy figure).
- Price, shares, and value shown here must equal the figures in L1 and Tab 3 §1.

---

## 3. L1 — Fixed 4-Stat Section

Always visible between the top section and the tabs. Exactly four stats:

| # | Stat | Data source (existing) | Label vocabulary |
|---|---|---|---|
| 1 | **Monthly Income** | V1 per-share monthly, **Base scenario**: `v1.base.ownerProfitCents ÷ v1.totalShares ÷ 12` (see §8 D1) | "Projected" framing — never paid/guaranteed |
| 2 | **Proj. / Year** | V1 per-share annual, **Base scenario**: `v1.base.ownerProfitCents ÷ v1.totalShares` | "Projected" framing |
| 3 | **Avg. Nightly Rate** | `v1.anr` (ANR — **never ADR**; provenance OBSERVED_DERIVED vs PM_APPROVED_MODEL_INPUT must stay distinguishable) | ANR |
| 4 | **Est. Growth** | `getGrowthPotential()` (research-range potential; % only when the basis is unambiguous) | "Estimated" — never a per-year forecast (§8 D3) |

Consistency rule (locked): **stat 1 and stat 2 must equal the Base scenario card
in Tab 2 §2.** If a figure is unknown for a villa, the stat renders the honest
pending state — never $0, never an invented number.

---

## 4. Tab 1 — Estate (desire)

Section order is fixed:

### 4.1 Why this estate
- Short attractive title + 1–2 sentence description.
  Source: `Estate24Record.description.short` (canonical; the fixture
  `listing.description` must not be used).
- **3–4 key highlight points with icons.**
  Source: derived or curated per villa from ESTATE-24 data — derivation rule is
  an open decision (§8 D5). Do not invent highlights.
- Component: new shared **`IconPointsGrid`** (single-column variant for
  highlights).

### 4.2 Key Specs
- Clean two-column rows (compact cards allowed): Type, Size (indoor + outdoor
  when available), Year built / last renovation, Rental status, Lease until
  (when applicable).
- Source: `Estate24Record.specs` (guests/bedrooms/bathrooms/sizeInteriorM2/
  sizeTotalM2/poolM2), `propertyType`; rental status + lease from
  `PropertyMeta` (`meta.rentalStatus`, `meta.leaseUntil`). Unknown/pending
  fields render as labeled pending rows (established pattern) — never blank.
- Component: `FactRow` rows in a `Block` (DEC-014 row system).

### 4.3 Amenities
- **Premium amenities only**, icon grid: 2 columns mobile / 3 columns desktop-width.
- Source: `Estate24Record.amenities` (general/outdoor/indoor/…). "Premium only"
  = a presentation filter over these lists; the filter rule is per §8 D5.
- Component: new shared **`IconPointsGrid`** (grid variant).

### 4.4 Location
- Full location text (`Estate24Record.location.full`), short description of the
  island/resort area (`description` context — place-level copy), key distances
  (airport, resort center, …), small map (static or interactive).
- Distances: only where the ESTATE-24 research context carries them — otherwise
  omit (never approximate).
- Map: no map asset or coordinates exist in the data layer → §8 D6. Until
  decided, the section renders text-only.

---

## 5. Tab 2 — Income (conviction)

The V1 model (`FinancialModelV1PropertyModel`) is the **only** calculation
authority. Components never recompute; all figures arrive via the view-model.
Every scenario-driven section follows the **currently selected scenario** (§5.2).

### 5.1 Rental Basis
- **ANR as the large number**, with its one-line definition underneath
  (`v1.anr.method` — verbatim derivation, never ADR).
- Occupancy rate (historical + projected): **conflict — see §8 D2.** Occupancy is
  UNKNOWN for all 24 estates and the locked V1 basis is modeled *nights*, not
  occupancy. Render occupancy rows only when a real source exists; until then
  this slot shows the modeled-nights basis (or nothing), honestly.

### 5.2 Scenario Revenue
- **Four scenarios: Conservative / Base / Optimistic / Average** — the locked V1
  keys (`conservative` 220 nights, `base` 273, `optimistic` 328, `average` =
  mean gross).
- For **each** scenario: modeled nights (`nights`), gross annual revenue for the
  whole villa (`grossCents`), projected income per share / year
  (`ownerProfitCents ÷ totalShares`), projected income per share / month
  (`… ÷ 12`). Per-share-per-scenario derivation is §8 D1.
- **Base selected by default.**
- Component: new shared **`ScenarioCards`** (replaces the current
  pills + single-scenario FactRows on refactor).

### 5.3 Modeled Costs
- Expandable rows ("Task-rows style"): Agency / Rental Escapes / OTA
  (`agencyCents`, 5% of gross), Operator (`operatorCents`, 7.5% of gross),
  Reserve (`reserveCents`, 1.5% of property value, `reserveCurrency` — honest
  UNKNOWN when not subtractable), Other operating costs (**only if a source
  exists** — V1 defines no such line; omit rather than invent).
- Each row expands for detail: basis, formula note, and meta rows (e.g.
  mixed-currency `unknownReason`).
- Component: new shared **`ExpandableCostRows`**.

### 5.4 Listed charges not deducted
- Green Tax, Damage waiver, and similar items — each with a green checkmark and
  the caption "Not deducted from your income".
- Source: `v1.excludedCharges` (classification `A_GUEST_PAID`, `deducted: false`
  by type contract) — names preserved verbatim from the source.
- Component: simple rows in a `Block` (current excluded-charges block pattern).

### 5.5 Net Economics (summary card)
One prominent summary card following the selected scenario:

| Row | Source |
|---|---|
| Net distributable income | `ownerProfitCents` (owner-side pool = 75% of net; UNKNOWN stays UNKNOWN with the engine's `unknownReason`) |
| Owner share % | allocation constant **75%** owner / 25% operator (locked V1) |
| Owner-side tax (estimated) | `ownerTaxCents` + `v1.ownerTax` (rate+assumption or honest unknown) |
| Net profit per share / year | `ownerProfitCents ÷ totalShares` |
| Net profit per share / month | `… ÷ 12` |

Net figures are the visual hero of this card. Projected vocabulary only.

Position income (real accrued from locks; paid ledger on global Income) remains
on this tab below the V1 chain — existing behavior, not part of this reordering.

---

## 6. Tab 3 — Ownership (decision)

### 6.1 Valuation & Shares (2×2 grid / four cards)
| Card | Source |
|---|---|
| Estate value | `v1.valuation.valueCents` (the ONE valuation) |
| Reference value per share | valuation ÷ `v1.totalShares` (= the $100 V1 nominal by construction) |
| Total shares | `v1.totalShares` |
| Ownership per share | 1 / `v1.totalShares` (exact, no rounding artifacts) |

### 6.2 Growth Potential
- Estimated growth percentage + timeframe + source of estimation.
- Source: `getGrowthPotential()` (`potentialPct` when the basis is unambiguous;
  research range evidence; `research.lastUpdated`/`sources` for provenance).
- **Never annualized, never a forecast** — see §8 D3. Estimated vocabulary only.

### 6.3 Exit & Liquidity (visually prominent)
- Sell anytime (no lock-up), 1% withdrawal fee, paid in 4 weekly installments
  (locked copy), secondary-market status when data exists (live listing / order
  book state).
- Honesty constraint: shares locked in the yield program are not sellable until
  unlocked — copy must not claim "sell anytime" over locked shares.
- Sources: locked withdrawal-terms copy, `WITHDRAWAL_FEE_BPS` fee vocabulary,
  listing/order-book state. Prominence = layout emphasis only; **no new fee or
  liquidity math** (P1/P3/P4 preserved).

### 6.4 Your Position Preview
- Simulation: "If you buy 1 share today" — current value, expected monthly
  income, projected value in 12 months; optional ± controls to change the share
  count.
- Sources: V1 nominal/current price, Base-scenario per-share monthly (§3),
  12-month projection — **needs an approved basis** (§8 D4; growth potential is
  not a per-year rate). Until decided, render value + expected monthly income
  and omit the 12-month row.
- Component: new during the per-villa refactor (share-count stepper pattern
  exists in `sell/QtyStepper`); not built in the structure phase.

### 6.5 Risk Disclosures
- 3–5 main risks in simple language, accordion / collapsible list.
- Copy source does not exist yet → §8 D9. Component: `Disclosure` list (existing
  primitive). Hidden until approved copy exists.

---

## 7. Tab 4 — Details (truth)

### 7.1 Management & Operator
- Operator name, short experience/background, logo when available.
- **Gap (§8 D7):** no operator identity exists in any data layer (Tier-1
  Rental Escapes is the *agency*). Render nothing until sourced.

### 7.2 Legal & Structure
- Legal structure (e.g. SPV), insurance coverage, valuation date & method.
- Valuation method/source exists (`v1.valuation.source`, `estimates.provenance`,
  `research.lastUpdated`); SPV and insurance **do not** → §8 D8. Pending rows
  until sourced; never invented.

### 7.3 Documents
- Downloadable list: Shareholder Agreement, Valuation Report, Property
  Management Agreement, Insurance Certificate, other relevant documents; each
  with a PDF icon + Download action.
- Source: existing documents system (`PropertyDocumentsList` + API document
  data). Keep existing download/error states; P-rules untouched.

### 7.4 Distribution & Tax
- Profit distribution schedule, payment method, tax reporting information.
- Locked model: income accrues **monthly**; the schedule copy stays the honest
  "being aligned with the monthly income model" line until a real schedule
  ships (§8 D10). Tax reporting → pending (§8 D10).

### 7.5 Historical Performance (only if data exists)
- Simple 12–24-month chart/summary of occupancy and revenue.
- **No real historical dataset exists** (occupancy UNKNOWN; `rentalHistory` is
  simulated and disclosed as such). Until real data exists this section is
  **omitted entirely** — simulated data must never pose as history (§8 D11).

---

## 8. Open data decisions (resolve in the data-unification step — before any villa refactor)

| ID | Decision needed | Context |
|---|---|---|
| D1 | Per-share-per-scenario derivation + which scenario feeds the 4-stat | Template: every scenario shows per-share figures, and Base must equal Monthly Income / Proj.-Year. V1 ships `perShare` (average-based) only. Proposed rule: per-share = `scenario.ownerProfitCents ÷ totalShares` (÷12 for monthly), 4-stat = Base. Needs PO confirmation since it changes the current average-based display. |
| D2 | Occupancy Rate on the Income tab | Template asks for occupancy (historical + projected); data says UNKNOWN for all 24 and the locked V1 basis is modeled nights. Options: omit, or show only when sourced. |
| D3 | "Est. Growth" framing | Template implies per-year growth; the locked growth-potential concept is a non-annualized valuation potential. Show potential + source, never a per-year rate. |
| D4 | 12-month projected value in Position Preview | No approved per-year growth basis exists. Omit until a product rule lands. |
| D5 | "Why this estate" highlights + "premium amenities" filter | Derivation rule from ESTATE-24 data (specs/amenities) vs. curated editorial input per villa. |
| D6 | Map | No coordinates or map asset in the data layer. Static image vs. interactive; asset sourcing. |
| D7 | Operator identity | Operator name/background/logo absent (agency ≠ operator). |
| D8 | Legal structure & insurance | SPV / insurance facts absent. |
| D9 | Risk disclosure copy | 3–5 risks need legal-approved wording. |
| D10 | Distribution schedule + tax reporting | Locked monthly accrual is the only truth; schedule/tax-reporting copy pending. |
| D11 | Historical performance | Real dataset absent; simulated history must never be presented as performance. |

---

## 9. Implementation rules

1. **Do not add the photo gallery inside any tab** — it exists at the top.
2. **Keep all numbers consistent** — top section ↔ 4-stat section ↔ Income tab
   (Base) ↔ Ownership tab §1. One valuation, one share price, one share count.
3. **Base scenario numbers must match Monthly Income and Proj. / Year.**
4. **Mobile-first, clean spacing** — max app width 480px, ≥44px touch targets,
   no horizontal scroll, `prefers-reduced-motion` respected, flat (no shadows).
5. **Expandable where specified** — Modeled Costs via `ExpandableCostRows`,
   risks via `Disclosure`.
6. **Do not invent data.** Every figure traces to the V1 model, ESTATE-24
   data, or the existing listing/position layer; anything else renders as an
   honest pending state or is omitted.
7. **Projected is never Paid/Accrued**; ANR is never ADR; the locked income
   model copy is verbatim.
8. **Rows use the FactRow system** (DEC-014); blocks/sections reuse the shared
   primitives (`Block`, `Row`, `LabelStack`, `Disclosure`, `StatusPill`) — no
   one-off hand-rolled shapes.
9. **Components stay presentational** — data via props/hooks boundary; engines
   are never imported into tab section components; strings arrive via i18n at
   the call site.
10. **One villa at a time**, gated per §10.

## 10. Per-villa refactor gates

Each villa refactor is done only when ALL of these pass on that villa:

1. `npm run check` (lint + typecheck + build) green.
2. Unit tests for every touched component green; full web suite green.
3. E2E on the touched villa page @480×840 (incl. fa RTL) — no overflow, no raw
   i18n keys, preserve-list behaviors intact (buy, sell, lock, sticky header,
   Rental Escapes link).
4. Structure conformance check against this document (section order + data
   sources).
5. Screenshots reviewed; design-review pass on the touched surfaces.

---

## 11. Shared components built for this structure (structure phase, not yet wired)

Built clean and separate; **no villa page imports them yet**. All are
presentational (props in, callbacks out), i18n-free (strings arrive via props
from the call site), and stay under the file-ownership limits.

| Component | File | Owns | Used by (after refactor) |
|---|---|---|---|
| `ScenarioCards` | `src/components/property/ScenarioCards.tsx` | The four-scenario selectable card set (§5.2): one expanded card, Base default via caller state | Income tab |
| `ExpandableCostRows` | `src/components/property/ExpandableCostRows.tsx` | The expandable modeled-cost row list (§5.3): independent per-row expansion | Income tab |
| `IconPointsGrid` | `src/components/property/IconPointsGrid.tsx` | Read-only icon+label point grid (§4.1 highlights, §4.3 amenities) | Estate tab |

Existing primitives already cover the rest: `FactRow` (rows), `Block`, `Row`,
`LabelStack`, `Disclosure` (risks, header-style expanders), `StatusPill`,
`TabPanelSkeleton`, `ProvenanceInfo`, `PropertyDocumentsList` (documents),
`FundingBar` (progress).
