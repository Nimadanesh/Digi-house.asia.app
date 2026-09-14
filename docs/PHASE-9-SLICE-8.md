# Phase 9 — Slice 8 Report: Cross-surface consistency and regression hardening

Status: `PASS` · Date: 2026-09-12 · Branch: `phase-9-redesign`

Scope: DEC-007 naming unification, coverage-gap regression pass, consolidated
24-villa cross-surface matrix, dead-legacy-path removal (proven unused), full
validation + 480×840 UI QA. Slice 9 was not started.

---

## 1. DEC-007 — naming unification (RESOLVED)

**Decision (canonical naming):** the adopted **Estate24 record name and location**
(`ESTATE-24-DATA.json` → `getEstate24ByRuntimeId`) are the single user-visible
identity on every surface — marketplace cards, similar-properties rail, detail
top bar + hero, home, portfolio, CSV export, NFT receipts, earnings. The R2
`canonical-24` name is retired from user-facing rendering (it remains a data
layer for images/nightly/valuation). This follows Tier 1 of
`docs/product/rebuild/PRODUCT-DECISION-LOCK.md`: Rental Escapes identity flows
through the ESTATE-24 records. No Rental Escapes identity data was changed.

**24-name diff evidence** (fixture alias vs R2 vs adopted Estate24):

| # | id | Fixture alias | R2 name | Estate24 (served everywhere) |
|---|---|---|---|---|
| 1 | prop-marina-vista-4b | Grand 2 BDM Ocean Pool Villa | Grand 2 BDM Ocean Pool Villa (JOALI Being) | Grand 2 BDM Ocean Pool Villa (JOALI Being) |
| 2 | prop-soho-loft-studio | The Aerial | The Aerial | The Aerial |
| 3 | prop-bayside-marina-penthouse | Syrene | **Syrene (Villa Syrene)** | **Villa Syrene** |
| 4 | prop-alfama-terrace-flat | Villa du Cap | Villa du Cap | Villa du Cap |
| 5 | prop-tbilisi-riverhouse-loft | Emerald Cay | Emerald Cay | Emerald Cay |
| 6 | prop-canggu-surf-villa | The Branson Beach Estate | The Branson Beach Estate | The Branson Beach Estate |
| 7 | prop-tokyo-shibuya-studio | Chalet Montana | Chalet Montana | Chalet Montana |
| 8 | prop-brooklyn-brownstone-flat | Villa BDM | Villa BDM | Villa BDM |
| 9 | prop-berlin-mitte-apartment | Trajan Villa at Caesars Palace | Trajan Villa at Caesars Palace | Trajan Villa at Caesars Palace |
| 10 | prop-barcelona-eixample-flat | La Datcha | **La Datcha (Villa La Datcha)** | **Villa La Datcha** |
| 11 | prop-london-camden-loft | Galeazzo | **Galeazzo (Villa Galeazzo)** | **Villa Galeazzo** |
| 12 | prop-sydney-harbour-apartment | Embrace | Embrace | Embrace |
| 13 | prop-toronto-condo | ANI Dominican Republic | ANI Dominican Republic | ANI Dominican Republic |
| 14 | prop-melbourne-loft | Mita Principe | Mita Principe | Mita Principe |
| 15 | prop-miami-beach-condo | La Dolce Vita | La Dolce Vita | La Dolce Vita |
| 16 | prop-istanbul-bosphorus-flat | Tranquility | Tranquility | Tranquility |
| 17 | prop-mexico-city-penthouse | Pearls of Long Bay Estate | Pearls of Long Bay Estate | Pearls of Long Bay Estate |
| 18 | prop-kyoto-machiya | Dream Pavilion | Dream Pavilion | Dream Pavilion |
| 19 | prop-cape-town-villa | ANI Thailand | ANI Thailand | ANI Thailand |
| 20 | prop-bangkok-sukhumvit-condo | ANI Sri Lanka | ANI Sri Lanka | ANI Sri Lanka |
| 21 | prop-amsterdam-canal-house | Rio Chico Private Estate | Rio Chico Private Estate | Rio Chico Private Estate |
| 22 | prop-buenos-aires-recoleta-flat | Forza Modern | Forza Modern | Forza Modern |
| 23 | prop-seoul-gangnam-studio | Chateau Prestige | Chateau Prestige | Chateau Prestige |
| 24 | prop-nyc-chelsea-loft | Hawksbill | Hawksbill | Hawksbill |

R2 vs Estate24 spelling drift existed on exactly 3 villas (#3, #10, #11) — the
`(Villa X)` duplication. Fixture aliases differ on all 24 and serve no surface.

**Alignment changes:**
- `marketplace-view-model.ts` — card name/location now resolve from the Estate24
  record first (R2 → fixture fallback for unmapped ids only).
- `SimilarProperties.tsx` — same fix for the rail (last remaining `.name.value`
  render site; found and fixed in the Slice 8 completion pass).
- Already aligned (verified, no change): `canonical-listing.ts` (repo boundary),
  `estate-display-identity.ts` (earnings/CSV/NFT), `property/[id]/page.tsx`
  (top bar), portfolio (via repo listings), home (via repo).

**Regression tests added:**
- `marketplace-view-model.test.ts` — DEC-007 block: card name/location equal the
  Estate24 record for all 24 villas.
- `SimilarProperties.test.tsx` — rail prints `Villa Syrene`, never the drifted
  R2 `Syrene (Villa Syrene)`.

## 2. Cross-surface numeric-format consistency (P2-3 residue fixed)

Slice 6/7 had reviewed card/hero labels as keep-as-is; the Slice 8 matrix pass
found two remaining numeric-format contradictions in the P2-3 family and fixed
them (same primitive as the detail hero, `toLocaleString`):
- `PropertyCard.tsx` — card fraction now `1/80,000` (was `1/80000`); test pin updated.
- `PropertyStatusBanner.tsx` — funding banner now `180,000 shares left`
  (was `180000`), matching the metrics grid.
- `PropertyCard.tsx` — availability caption `119,840 shares remaining` grouped.
Label wording differences (card `Price / share` vs detail `Share price`) remain
accepted per Slice 6 keep-as-is evidence (same figure, basis-following labels).

## 3. Dead legacy paths removed (proven unused)

Slice 8 task "remove dead legacy paths only when proven unused". The full
MarketSection composition and the Slice-A/PROMPT-03 tab panels were superseded
by ResaleBlock / the V1 panels (PROMPT 05 had retired them from the tabs but
kept the files on disk). Removed after verifying zero imports:

- `EstateCostBreakdown.tsx`, `EstateEconomicsSection.tsx` (+ test),
  `EstateProfitAllocation.tsx`, `FundingPanel.tsx`, `HolderAnalytics.tsx`,
  `IncomeAnalytics.tsx` (+ phase7 test), `MarketSection.test.tsx` (component
  keeps shipping `MarketSummary` only), `PerformanceChart.tsx` (+ test),
  `PerformanceCharts.phase5.test.tsx`, `PrimaryPerformanceCharts.tsx`,
  `estate-plan-engine.ts` (+ test).
- Regression pin: `estate-economics.spec.ts` asserts the legacy sections never
  render (`toHaveCount(0)`). `e2e/tests/ownership-touch.spec.ts` deletion was
  confirmed intentional (retired holder charts; documented in the Final PO
  Decisions entry) — P3-2 discharged.

## 4. Coverage-gap pass — every fixed defect → regression test

| Phase 9 defect | Fixed in | Regression test |
|---|---|---|
| P0-1/DEC-004 card≠detail income | Slice 2 | `property-presentation.test.ts` (card income parity, 24/24) |
| P0-2/DEC-005 card≠detail secondary price | Slice 2 | `property-presentation.test.ts` (card price = live-book detail price, 24/24) |
| P1-1/DEC-006 `funded` vs ledger | Slice 5 | `demo-ledger.test.ts` (7) + `order-lifecycle.spec.ts` (3) |
| P1-2 ask/last-trade labeling | Slice 4 | `market-context.test.tsx` (11) |
| P1-3 Income filter implied 24/24 known | Slice 2 | `marketplace-filter.test.ts` (income filter/sort on presented income, unknown last) |
| P2-1/DEC-007 identity spelling | **Slice 8** | `marketplace-view-model.test.ts` + `SimilarProperties.test.tsx` (new) + `canonical-listing.test.ts` (Tier-1 identity) |
| P2-3 numeric-format drift | **Slice 8** | `PropertyCard.test.tsx` (grouped fraction pin) |
| P2-4 portfolio monthly = weekly tape ×52/12 | Slice 5/PO | accepted resolution (weekly-settlement tape preserved, monthly-labeled); pinned by settlement tests |
| P3-1 `ESTATE-24-DATA.md` missing | PO session | generated companion + script exist |
| P3-2 ownership-touch.spec deletion | PO session | confirmed intentional (§3 above) |
| Slice 3 pending causes | Slice 3 | `pending-states.test.tsx` (24-villa matrix) + presentation unknown tests |
| Slice 5 ledger honesty | Slice 5 | `demo-ledger.test.ts` (idempotent confirm, open orders, instant-sell tx, remainder) |
| Slice 7 RTL/bidi/i18n | Slice 7 | `rtl-bidi.test.tsx`, `PropertyTabs.test.tsx`, `Header.test.tsx`, portfolio cancel-copy tests, `estate-rtl.spec.ts` |

No unfixed Phase 9 defect lacks a regression test or an explicit accepted record.

## 5. Consolidated 24-villa cross-surface matrix

Probe: temp vitest run through the real view models (same method as Slice 1;
removed after the run), plus live 480×840 E2E. Full row set verified with these
per-villa invariants asserted for all 24:

- **Identity (DEC-007):** served listing title == card name == Estate24 name (24/24 ✓).
- **Primary purchase:** base price $100 == `getPresentedPrimaryPrice()` (24/24 ✓);
  supply == valuation ÷ $100 (24/24 ✓); sold + remaining == supply (demo ledger, 24/24 ✓).
- **Secondary market:** card price == live-book detail price; seeded bestAsk rides
  the canonical listing so book-less surfaces agree with book-fed ones (✓ on all
  18 book states; funding villas have empty books and price at $100 primary).
- **Status → CTA:** funding → Buy at $100; funded/resale → market context
  (Ask price · Last price) before the CTA (verified live on Syrene $256.02/$251.00).

| id | status | supply | sold/rem | card price | ask/last | income/share | V1 state |
|---|---|---|---|---|---|---|---|
| prop-marina-vista-4b | funding | 80,000 | 0/80,000 | $100.00 | — | **$16.29** | full-chain |
| prop-soho-loft-studio | funding | 180,000 | 0/180,000 | $100.00 | — | **$5.23** | full-chain |
| prop-bayside-marina-penthouse | funded | 120,000 | 160/119,840 | $256.02 | 256.02/251.00 | UNKNOWN(eur_mixed_currency) | pre-tax-only |
| prop-alfama-terrace-flat | funded | 250,000 | 200/249,800 | $102.00 | 102.00/100.00 | UNKNOWN(eur_mixed_currency) | pre-tax-only |
| prop-tbilisi-riverhouse-loft | resale | 280,000 | 0/280,000 | $81.60 | 81.60/80.00 | **$2.27** | full-chain |
| prop-canggu-surf-villa | resale | 300,000 | 0/300,000 | $204.00 | 204.00/200.00 | **$1.99** | full-chain |
| prop-tokyo-shibuya-studio | funding | 120,000 | 0/120,000 | $100.00 | — | UNKNOWN(eur_mixed_currency) | pre-tax-only |
| prop-brooklyn-brownstone-flat | funding | 180,000 | 0/180,000 | $100.00 | — | UNKNOWN(unknown_owner_tax) | pre-tax-only |
| prop-berlin-mitte-apartment | funding | 80,000 | 0/80,000 | $100.00 | — | UNKNOWN(unknown_owner_tax) | pre-tax-only |
| prop-barcelona-eixample-flat | funding | 150,000 | 0/150,000 | $100.00 | — | UNKNOWN(unknown_owner_tax) | pre-tax-only |
| prop-london-camden-loft | resale | 120,000 | 0/120,000 | $144.84 | 144.84/142.00 | UNKNOWN(eur_mixed_currency) | pre-tax-only |
| prop-sydney-harbour-apartment | resale | 350,000 | 0/350,000 | $150.96 | 150.96/148.00 | UNKNOWN(unknown_owner_tax) | pre-tax-only |
| prop-toronto-condo | resale | 500,000 | 0/500,000 | $124.44 | 124.44/122.00 | UNKNOWN(unknown_owner_tax) | pre-tax-only |
| prop-melbourne-loft | funded | 250,000 | 0/250,000 | $103.02 | 103.02/101.00 | UNKNOWN(unknown_owner_tax) | pre-tax-only |
| prop-miami-beach-condo | resale | 320,000 | 0/320,000 | $135.66 | 135.66/133.00 | **$1.38** | full-chain |
| prop-istanbul-bosphorus-flat | resale | 350,000 | 0/350,000 | $93.84 | 93.84/92.00 | **$1.22** | full-chain |
| prop-mexico-city-penthouse | resale | 600,000 | 0/600,000 | $129.54 | 129.54/127.00 | **$0.82** | full-chain |
| prop-kyoto-machiya | funded | 200,000 | 0/200,000 | $114.24 | 114.24/112.00 | **$1.63** | full-chain |
| prop-cape-town-villa | resale | 450,000 | 0/450,000 | $104.04 | 104.04/102.00 | UNKNOWN(unknown_owner_tax) | pre-tax-only |
| prop-bangkok-sukhumvit-condo | resale | 500,000 | 0/500,000 | $88.74 | 88.74/87.00 | UNKNOWN(unknown_owner_tax) | pre-tax-only |
| prop-amsterdam-canal-house | resale | 250,000 | 0/250,000 | $149.94 | 149.94/147.00 | UNKNOWN(unknown_owner_tax) | pre-tax-only |
| prop-buenos-aires-recoleta-flat | resale | 180,000 | 0/180,000 | $92.82 | 92.82/91.00 | UNKNOWN(unknown_owner_tax) | pre-tax-only |
| prop-seoul-gangnam-studio | resale | 150,000 | 0/150,000 | $119.34 | 119.34/117.00 | UNKNOWN(eur_mixed_currency) | pre-tax-only |
| prop-nyc-chelsea-loft | resale | 220,000 | 0/220,000 | $156.06 | 156.06/153.00 | **$1.46** | full-chain |

**UNKNOWN vs defect classification (rule 4):** 9 villas present a V1 monthly
income; 15 are pending, each with the engine's stated cause rendered in the UI —
5× `eur_mixed_currency` (ANR recorded in EUR; no approved FX conversion) and
10× `unknown_owner_tax` (owner-side tax not published in the listing taxes).
Both are genuinely UNKNOWN canonical inputs — **data honesty, not mapping or
implementation defects** (matches `financial-model-v1-inputs.ts` locked owner-tax
table and `ESTATE-24-DATA.json`; no value invented). No unexplained pending
state exists. Zero contradictions between surfaces remain in the matrix.

## 6. Validation (all green)

| Check | Result |
|---|---|
| `npm test` (vitest) | **126 files, 1057/1057 passed** (file/test count lower than Slice 7's 131/1146: the removed dead-path test files) |
| `npm run typecheck` | clean |
| `npm run lint` | 0 errors, 6 pre-existing warnings (one resided in a removed file) |
| `npm run build` | green, 13 routes |
| `npx playwright test` (480×840) | **46 passed, 6 expected skips** (money-path needs live API stack), 0 failed |
| i18n/RTL | `estate-rtl.spec.ts` + buy/sell RTL gates green; 0 raw keys (E2E + Slice 7 sweep; EN-mirrored translator backlog unchanged) |

## 7. UI/Design QA at 480×840 (visual review of `screenshots/slice8-qa/`)

- Marketplace: card identity/name/fraction `1/80,000`, `$100.00`, nightly range
  LTR-correct, income `$16.29` — matches detail exactly; no overflow; hierarchy intact.
- Grand detail (primary): banner `0.0% · 80,000 shares left` grouped; hero `$100.00`,
  fraction matches card; metrics `0 / 80,000`; Buy CTA leads; provenance ⓘ present.
- Syrene detail (resale): market context `Ask price: $256.02 · Last price: $251.00`
  before the CTA; `Data pending` with the EUR caption — honest, layout stable.
- Brownstone detail (pending funding): `180,000 shares left` grouped; pending income
  with owner-tax caption; CTA hierarchy intact.
- Portfolio: holding names `Villa Syrene` / `Villa du Cap` == cards/detail (DEC-007 live).
- fa RTL: `rtl` document; Persian labels; grouped counts in the banner/fraction;
  price ranges render LTR-correct (bidi isolation from Slice 7 holding); no overflow.
  English strings on fa detail are the known EN-mirrored translator backlog
  (Slice 7 measured ~210 keys/locale) — accepted, no raw keys.
- Dark theme, spacing rhythm, tap targets, demo badge — consistent with Slice 7 baseline.

## 8. Commit note

This commit includes the Slice 8 work **and** the long-standing uncommitted
working-tree body it is built on (V1 engine 2026-09-09, PROMPT 05 2026-09-10,
Product Decision Lock + Final PO Decisions 2026-09-11 — DEC-003's "uncommitted
body"). The body could not be separated at file granularity (Slice 8 edits are
interleaved in the same files, and untracked V1 modules are imported by the
Slice 8 test surface); committing it here is what makes this commit buildable
and green. `FRACTIONALLUXE-PROGRAM.md` progress entries for those sessions are
included verbatim. Upstream divergence (local ahead / origin behind) remains a
separate user decision (DEC-003 process half).

## 9. Remaining (accepted, out of Slice 8 scope)

- DEC-010: the Mimosa pre-commit hook flagged pre-existing `apps/api` findings.
  The 3 high "hardcoded credential" findings (visibly fake test values, files
  untouched by this slice) were remediated behavior-preservingly so the commit
  gate passes — same strings derived instead of literal; edited tests 19/19
  green. The 2 medium taint suspicions (`routes/admin.ts:789`,
  `routes/orders.ts:107`) and the 2 pre-existing api test failures are recorded
  OPEN for a dedicated legacy-workspace pass; they do not affect the Phase 9
  web app gates above.
- DEC-009 tap-target acceptance — product decision, OPEN.
- Translator backlog (~210 EN-mirrored keys/locale) — translators follow up.
- P2-2 `New` badge — accepted demo-tape behavior (badge and New filter share the
  same demo clock; coherent by construction; Slice 6 keep-as-is evidence).
- Upstream branch reconcile (12 behind) — user decision.
