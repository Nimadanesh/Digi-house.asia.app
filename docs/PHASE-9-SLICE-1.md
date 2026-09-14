# Phase 9 — Slice 1: Complete Marketplace Truth Audit

> Audit-only. No product behavior was changed. All values below were read from the
> running app (dev server, 480×840, en) and from a code-level probe through the real
> view models on 2026-09-11. Branch `phase-9-redesign`, base HEAD `7ba236e`
> (plus this slice's docs commit — see Status).

Money convention: all prices/incomes are integer minor units (cents) in code;
tables show display dollars. `F` = fixture, `C` = canonical, `D` = derived,
`DL` = demo ledger, `U` = unknown/pending.

## 1. Method

1. Temp vitest probe (deleted after the run) drove all 24 `PROPERTIES` through the real
   path `toCanonicalListing → toMarketplaceEstate → getFinancialModelV1 →
   buildEstateDetailViewModel` and emitted the full matrix as JSON.
2. Playwright probe at 480×840: all 24 marketplace cards + all 24 detail pages
   (hero price/CTA, metrics grid, resale-block presence, per-tab pending-string counts,
   overflow) + portfolio + earnings screens.
3. Cross-checked: card↔detail price, card↔detail income, CTA kinds, pending reasons,
   order-book ladder (`seed/orderbooks.ts`), holdings ledger, i18n copy.

## 2. Twenty-four-villa truth table

Status: `FUND` = funding (6), `SOLD` = funded (4), `RES` = resale (14).
Card price label is `PRICE / SHARE` on FUND, `LAST PRICE` on SOLD/RES.
Detail hero price on SOLD/RES = seeded `bestAsk` = `lastTrade × 1.02` (see §4).
Card income = `F: $100-base sharePrice × monthlyYieldRate` (all 24).
Detail monthly = `V1 perShare.monthlyCents` (9 known) or `Data pending` (15).
CTA (anonymous): FUND → `Buy · $100.00`; SOLD/RES → `Acquire Resale Ownership`,
except the 2 owned villas → `Manage Ownership`.

| # | Villa (card name) | St | Card price | Detail hero | Price parity | Card inc/mo | Detail inc/mo | Income parity | Valuation (C, est) | Total / Sold / Remain | Progress | Detail CTA |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Grand 2 BDM (#128862) | FUND | $100.00 | $100.00 | YES | $7.19 F | $16.29 V1 | **NO (2.3×)** | $8M | 80,000 / 0 / 80,000 DL | 0% | Buy |
| 2 | Aerial (#126855) | FUND | $100.00 | $100.00 | YES | $7.32 F | $5.23 V1 | **NO** | $18M | 180,000 / 0 / 180,000 | 0% | Buy |
| 3 | Syrene (#108924) | SOLD | $251.00 | $256.02 | **NO (+2%)** | $7.13 F | pending (EUR-U) | **NO** | $12M | 120,000 / 160 / 119,840 | 0.13% | Manage (owned) |
| 4 | Villa du Cap (#123861) | SOLD | $100.00 | $102.00 | **NO (+2%)** | $6.89 F | pending (EUR-U) | **NO** | $25M | 250,000 / 200 / 249,800 | 0.08% | Manage (owned) |
| 5 | Emerald Cay (#125643) | RES | $80.00 | $81.60 | **NO (+2%)** | $7.38 F | $2.27 V1 | **NO (3.3×)** | $28M | 280,000 / 0 / 280,000 | 0% | Acquire |
| 6 | Branson (#130393) | RES | $200.00 | $204.00 | **NO (+2%)** | $7.26 F | $1.99 V1 | **NO (3.6×)** | $30M | 300,000 / 0 / 300,000 | 0% | Acquire |
| 7 | Chalet Montana (#130901) | FUND | $100.00 | $100.00 | YES | $7.19 F | pending (EUR-U) | **NO** | $12M | 120,000 / 0 / 120,000 | 0% | Buy |
| 8 | Villa BDM (#131293) | FUND | $100.00 | $100.00 | YES | $7.01 F | pending (tax-U) | **NO** | $18M | 180,000 / 0 / 180,000 | 0% | Buy |
| 9 | Trajan (#128529) | FUND | $100.00 | $100.00 | YES | $7.13 F | pending (tax-U) | **NO** | $8M | 80,000 / 0 / 80,000 | 0% | Buy |
| 10 | La Datcha (#123320) | FUND | $100.00 | $100.00 | YES | $6.95 F | pending (tax-U) | **NO** | $15M | 150,000 / 0 / 150,000 | 0% | Buy |
| 11 | Galeazzo (#109098) | RES | $142.00 | $144.84 | **NO (+2%)** | $7.07 F | pending (EUR-U) | **NO** | $12M | 120,000 / 0 / 120,000 | 0% | Acquire |
| 12 | Embrace (#127825) | RES | $148.00 | $150.96 | **NO (+2%)** | $7.32 F | pending (tax-U) | **NO** | $35M | 350,000 / 0 / 350,000 | 0% | Acquire |
| 13 | ANI DR (#122422) | RES | $122.00 | $124.44 | **NO (+2%)** | $7.19 F | pending (tax-U) | **NO** | $50M | 500,000 / 0 / 500,000 | 0% | Acquire |
| 14 | Mita Principe (#129548) | SOLD | $101.00 | $103.02 | **NO (+2%)** | $6.83 F | pending (tax-U) | **NO** | $25M | 250,000 / 0 / 250,000 | 0% | Acquire |
| 15 | La Dolce Vita (#122903) | RES | $133.00 | $135.66 | **NO (+2%)** | $7.13 F | $1.38 V1 | **NO (5.2×)** | $32M | 320,000 / 0 / 320,000 | 0% | Acquire |
| 16 | Tranquility (#126870) | RES | $92.00 | $93.84 | **NO (+2%)** | $7.26 F | $1.22 V1 | **NO (6.0×)** | $35M | 350,000 / 0 / 350,000 | 0% | Acquire |
| 17 | Pearls (#130397) | RES | $127.00 | $129.54 | **NO (+2%)** | $7.07 F | $0.82 V1 | **NO (8.6×)** | $60M | 600,000 / 0 / 600,000 | 0% | Acquire |
| 18 | Dream Pavilion (#127483) | SOLD | $112.00 | $114.24 | **NO (+2%)** | $6.77 F | $1.63 V1 | **NO (4.2×)** | $20M | 200,000 / 0 / 200,000 | 0% | Acquire |
| 19 | ANI Thailand (#108856) | RES | $102.00 | $104.04 | **NO (+2%)** | $7.19 F | pending (tax-U) | **NO** | $45M | 450,000 / 0 / 450,000 | 0% | Acquire |
| 20 | ANI Sri Lanka (#108860) | RES | $87.00 | $88.74 | **NO (+2%)** | $7.38 F | pending (tax-U) | **NO** | $50M | 500,000 / 0 / 500,000 | 0% | Acquire |
| 21 | Rio Chico (#106441) | RES | $147.00 | $149.94 | **NO (+2%)** | $6.89 F | pending (tax-U) | **NO** | $25M | 250,000 / 0 / 250,000 | 0% | Acquire |
| 22 | Forza Modern (#129549) | RES | $91.00 | $92.82 | **NO (+2%)** | $7.01 F | pending (tax-U) | **NO** | $18M | 180,000 / 0 / 180,000 | 0% | Acquire |
| 23 | Chateau Prestige (#123919) | RES | $117.00 | $119.34 | **NO (+2%)** | $7.32 F | pending (EUR-U) | **NO** | $15M | 150,000 / 0 / 150,000 | 0% | Acquire |
| 24 | Hawksbill (#122113) | RES | $153.00 | $156.06 | **NO (+2%)** | $6.95 F | $1.46 V1 | **NO (4.8×)** | $22M | 220,000 / 0 / 220,000 | 0% | Acquire |

Result: price parity **6/24** (all FUND at $100); income parity **0/24**.
V1-known: #1,2,5,6,15,16,17,18,24. V1-unknown: 5 EUR-mixed-currency
(#3,4,7,11,23) + 10 unknown-owner-tax (#8,9,10,12,13,14,19,20,21,22).
No horizontal overflow on any of the 24 detail pages; no raw i18n keys observed.

## 3. Pending-state inventory (exact reason each)

- Metrics `MONTHLY INCOME → Data pending` (15 villas): V1 `perShare.monthlyCents` is null —
  EUR villas (reserve currency ≠ rental currency, no approved FX) or unknown owner tax.
  Correct per contract (never invented). Owner: Slice 3 (explain + keep pending).
- Estate tab `Not yet reported ×2` (all 24): operating-costs + net-distributable lines are
  engine-UNKNOWN (occupancy null for all 24; costs unreported). Has explainer copy. Owner: Slice 3.
- Estate tab `Data pending ×2` (the 15 V1-unknown): investment-panel per-share figures absent.
  Owner: Slice 2/3.
- Income tab `Data pending ×6` (the 15 V1-unknown): V1 story chain cannot render.
  The 9 V1-known show zero pending on Estate/Income/Ownership tabs. Owner: Slice 3.
- Ownership tab pending (only where relevant): 3 on the 2 owned + V1-unknown villas
  (#3,4: position/accrual states), 1 on unowned V1-unknown, 0 on V1-known. Owner: Slice 5.
- Details tab (all 24): `Verification pending` (trust verification) + management
  `not yet published` + `Data pending` ×2–3 (sizeText null on 8 villas:
  #3,4,7,8,10,11,12,18 — dataset records UNKNOWN; never a fixture number). Owner: Slice 3/6.
- Marketplace `Owner Stay` / `Featured` filters → honest empty states (no data exists).
  `Income` filter matches all 24 (fixture `hasIncomeData` always true — misleading, see §5).
- Cards never show income-pending (fixture inputs always > 0). Owner: Slice 2.

## 4. Secondary-market mechanics (observed)

- Order book (`OrderBook`, via `ResaleBlock`) renders on all 18 SOLD/RES villas, absent on
  all 6 FUND (correct gating). Seeded asks ladder at `lastTrade × {1.02, 1.04, 1.06, 1.08}`
  (`seed/orderbooks.ts:13`); `bestAsk` (×1.02) feeds `getCurrentSharePrice` on detail
  (`property/[id]/page.tsx:110-112`), while cards call it with **no book** → systematic
  +2% detail-vs-card gap on all 18 (e.g. $251.00 → $256.02). Placed orders never move best
  (`mock/orderbook.ts`). Owner: Slice 2 (single price path) + Slice 4 (label ask vs last).
- Buy flow: FUND hero `Buy · $100.00` → `BuySheet` (qty → summary → success), wallet-gated
  (`Connect wallet` sheet; E2E `buy-flow` covers primary, secondary limit-buy with fee
  preview + escrow total, RTL, no raw keys). Sell flow: owned villas get `SellSheet`
  (instant/custom → Active → cancel → Cancelled); unowned show the honest empty state
  (E2E `sell-flow` green). No action was executed in this slice.

## 5. Prioritized defect list (carried forward, none fixed here)

- **P0-1 (→ Slice 2): card/detail income divergence, 24/24.** Card prints fixture income
  ($6.77–$7.38 on every card) while detail prints V1 ($0.82–$16.29) or pending. Gaps up to
  8.6× (Pearls $7.07 vs $0.82). Paths: `marketplace-filter.ts:102-107` /
  `marketplace-view-model.ts:110-111` vs `PropertyMetricsGrid.tsx:53` /
  `financial-model-v1.ts:239-260`. (DEC-004 already OPEN.)
- **P0-2 (→ Slice 2, NEW): card/detail price divergence, 18/18 secondary.** Card `LAST PRICE`
  = `lastTrade` (no book); detail hero = seeded `bestAsk` (+2%). Same share, two prices on
  adjacent screens. Recorded as DEC-005 (OPEN).
- **P1-1 (→ Slice 4, NEW): `funded` status contradicts the ledger.** #3/#4/#14/#18 read
  `funded` with sold 160/200/0/0 of 120k–250k (0–0.13%) and CTAs split (`Manage` on owned,
  `Acquire` on the rest). `SHARES SOLD / TOTAL 0 / 250,000` under a `funded` banner (#14)
  is self-contradictory. Status is fixture with no canonical source. DEC-006 (OPEN).
- **P1-2 (→ Slice 4): secondary hero labeled `SHARE PRICE` with no market context.**
  $256.02 hero never says ask vs last-trade vs NAV; card says `LAST PRICE` for a different
  number. Both true per their own hierarchy, jointly confusing.
- **P1-3 (→ Slice 2): `Income` filter + card income imply 24/24 known income** while V1
  says 15 UNKNOWN. `hasIncomeData` (`marketplace-filter.ts:89-93`) reads fixture fields.
- **P2-1 (→ Slice 8, NEW): identity spelling differs by surface.** Cards use R2 names
  (`Syrene (Villa Syrene)`, `La Datcha (Villa La Datcha)`); portfolio/detail-hero use
  estate24 names (`Villa Syrene`, `Villa La Datcha`). Same villa, two names. DEC-007 (OPEN).
- **P2-2 (→ Slice 7): `New` badge on ~22/24 cards incl. decade-old resale listings**
  (demo clock `MARKETPLACE_DEMO_CLOCK_MS` + fixture `createdAt`). Scarcity-adjacent noise.
- **P2-3 (→ Slice 6/7): label drift** — detail `SHARE PRICE` (always) vs card
  `PRICE / SHARE`/`LAST PRICE`; detail `TOTAL PROPERTY VALUE` vs card `ESTATE VALUE`;
  detail fraction `1/80,000` vs card `1/80000`.
- **P2-4 (→ Slice 5): portfolio `Est. monthly rent` = weekly tape × 52/12**
  (`HoldingCard.tsx:14-15,129`; verified $1,275.04 / $1,340.00 from 29424/30923).
  Labeled monthly (allowed) but its weekly-tape basis is invisible; earnings mixes weekly
  tape (`3 weeks in a row`, `Yield payments`) with the monthly model line.
- **P3-1 (→ Slice 3): `ESTATE-24-DATA.md` vs decision-lock “has no file”** (carried, Slice 0 §E.14).
- **P3-2 (→ Slice 8): uncommitted deletion of `e2e/tests/ownership-touch.spec.ts`** —
  confirm intentional (carried, Slice 0 §E.15).

## 6. Verification for this slice

- `npx vitest run src/lib/economics/__tests__/slice1-probe.test.ts` → 1 passed (temp file,
  removed afterwards; verified absent; tree otherwise untouched by this slice).
- Full Playwright suite was green in Slice 0 (40 passed / 6 expected skips); this slice
  re-ran no product code, so no re-run was required — the live probe above (24 cards +
  24 details + portfolio + earnings at 480×840) is this slice's fresh evidence.
- Design/UI QA at 480×840: 24/24 detail pages no-overflow; marketplace no-overflow;
  fa RTL + no-raw-key coverage via existing `estate-rtl` / `buy-flow` / `sell-flow` E2E.

## Status

- Status: `PASS` (audit deliverables complete; no behavior changed).
- Scope completed: full 24-villa map (§2), pending inventory (§3), mechanics trace (§4),
  defect list (§5).
- Files changed: `docs/PHASE-9-SLICE-1.md` (new), `docs/PHASE-9-REDESIGN-PLAN.md`
  (status section only), `docs/PHASE-9-DECISION-LOG.md` (DEC-005/006/007 OPEN).
- Tests run and results: temp probe 1/1 (removed); live 24-villa probe all-green on
  overflow; E2E suite per Slice 0 baseline (no product-code change since).
- Design/UI QA result: PASS (no overflow 24/24; pending states honest; no raw keys).
- Remaining issues: §5 list (all carried, none in this slice's scope to fix).
- Next slice: Slice 2 — one canonical financial presentation layer.
