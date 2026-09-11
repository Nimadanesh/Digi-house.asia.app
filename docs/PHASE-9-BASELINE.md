# Phase 9 — Slice 0 Baseline and Recovery Audit

> Audit-only. No product behavior was changed in this slice. All findings below are
> observed facts with file:line evidence, recorded 2026-09-11 on the working tree
> described in §A. Slice 1 was not started.

- Branch: `phase-9-redesign`
- HEAD: `7ba236ec30b4f777670696b900151c549a13bccc` (`chore(checkpoint): pre-prompt-04 redesign baseline`)
- Slice order (from `docs/PHASE-9-REDESIGN-PLAN.md`): Slice 0 (this audit) → 1 marketplace
  truth audit → 2 canonical financial presentation layer → 3 `Data pending` villa by villa →
  4 primary vs secondary → 5 honest Buy/Sell → 6 first-time buyer journey → 7 design polish →
  8 cross-surface consistency → 9 final release-readiness audit.
- Status of this slice: **PASS** (every in-scope audit item executed; results below).
  No later slice was started.

---

## A. Repository state

- **Branch:** `phase-9-redesign` (verified via `git branch --show-current`).
- **HEAD commit:** `7ba236ec30b4f777670696b900151c549a13bccc` —
  `chore(checkpoint): pre-prompt-04 redesign baseline`.
- **Upstream divergence:** local is **ahead 10 / behind 12** vs `origin/phase-9-redesign`
  (`git rev-list --left-right --count HEAD...origin/phase-9-redesign` → `10 12`).
  The 10 local-ahead commits are the rebuild slices A–D + marketplace villa work
  (`f2ab16e` Slice A, `44e2aef` Slice C, `2655474` Slice D, `d913201` Slice B,
  `81b080d`/`ee09928` 24-villa feed, `7ba236e` checkpoint). The 12 remote-behind commits
  are docs-only Phase 9 plan/contract/decision-log additions (`4621869`, `c162155`,
  `62e0cc1`, `780b1d4`, …). The two histories have genuinely diverged and will need an
  explicit reconcile (merge or rebase) before Slice 1 — that reconcile is **not** part of
  this slice and was not attempted.
- **Staged (4 files, the Phase 9 control docs):**
  `docs/PHASE-9-CHANGE-CONTROL.md`, `docs/PHASE-9-DECISION-LOG.md`,
  `docs/PHASE-9-PRODUCT-CONTRACT.md`, `docs/PHASE-9-REDESIGN-PLAN.md`.
- **Unstaged modifications (~100 files):** `FRACTIONALLUXE-PROGRAM.md`,
  `docs/product/rebuild/ESTATE-24-DATA.json` (+7589/−48 vs HEAD),
  property/marketplace components, economics libs, all 12 `messages/*.json`,
  e2e specs (incl. deleted `e2e/tests/ownership-touch.spec.ts`), QA screenshots.
- **Untracked (new, uncommitted work):** `docs/product/rebuild/ESTATE-24-DATA.md`,
  `docs/product/rebuild/PRODUCT-DECISION-LOCK.md`, `scripts/generate-estate-24-data-md.mjs`,
  `src/lib/economics/financial-model-v1.ts`,
  `src/lib/economics/canonical-offering.ts`,
  `src/lib/economics/estates/financial-model-v1-inputs.ts`,
  `src/lib/mock/canonical-listing.ts`, `src/types/financial-model-v1.ts`,
  `src/components/property/{EstateV1Thesis,IncomeV1Story,OwnershipV1Panel}.tsx`,
  related tests, `screenshots/decision-lock/`, `test-results/`.
- **Relevant recent commits (local `git log --oneline -15`):**
  `7ba236e` checkpoint · `d913201` Slice B scenario engine · `84ea82f` reconciliation repair ·
  `2655474` Slice D plan engine · `9475faa` source-of-truth docs · `44e2aef` Slice C share model ·
  `f2ab16e` Slice A data architecture · `ee09928` nightly rates on cards · `81b080d` 24 real
  villa datasets · `140c0e3`/`798acdc` Slice 5 income · `a6b20b1`/`dbe3be1` Slice 4 estates.
- **Safe to continue? CONDITIONALLY.** The tree builds and all unit tests pass (§B), so the
  baseline is reproducible. But it is **not** a clean handoff: (1) the branch has diverged
  from upstream (ahead 10 / behind 12) and needs an explicit reconcile; (2) a large body
  of V1/canonical work (financial-model-v1, canonical-listing, PROMPT 05 surfaces) is
  uncommitted, including a +7589-line rewrite of the canonical JSON. Slice 1 must start
  with a commit/stash + divergence decision — recorded as DEC-003, left OPEN for the user.

---

## B. Verification matrix

All commands run on the working tree described in §A on 2026-09-11 (Windows, PowerShell 5.1,
Node via nvm4w). E2E was run against `npm run dev` on port 3000 in the same shell session
(the Playwright config has **no `webServer` block**, so a bare `npx playwright test` fails
with `ERR_CONNECTION_REFUSED` — environment fact, not a product failure).

| # | Exact command | Result | Error summary |
|---|---|---|---|
| 1 | `git branch --show-current` | **PASS** — `phase-9-redesign` | — |
| 2 | `git rev-parse HEAD` | **PASS** — `7ba236ec30b4f777670696b900151c549a13bccc` | — |
| 3 | `git status --short --branch` / `git status` | **PASS (recorded)** — ahead 10 / behind 12; 4 staged, ~100 modified, ~19 untracked | — |
| 4 | `git log --oneline -15` + `git log --oneline HEAD..origin/phase-9-redesign` | **PASS (recorded)** — histories diverged as in §A | — |
| 5 | `npm run typecheck` (`tsc --noEmit`) | **PASS** — clean, zero output | — |
| 6 | `npm run lint` (`eslint`) | **PASS** — 0 errors, 7 warnings (pre-existing: 3× `apps/api` money-path unused vars, 1× `scripts/phase8-bottom-space-review.mjs`, 1× `estate-plan-engine.test.ts`, 1× `mock/stay.ts`, 1× `types/estate-scenario.ts`) | warnings only |
| 7 | `npm test` (`vitest run`) | **PASS** — 123 files, **1096/1096 tests passed** (~50 s; jsdom `scrollTo`/navigation warnings are harness noise) | — |
| 8 | `npm run build` (`next build`, Next 16.2.1 Turbopack) | **PASS** — compiled in 7.5 s, 13 routes (`/`, `/home`, `/marketplace`, `/property/[id]`, `/portfolio`, `/earnings`, …) | — |
| 9 | `npx playwright test --list` | **PASS (recorded)** — 46 tests in 13 files | — |
| 10 | `npx playwright test --reporter=line` (dev server running, viewport 480×840) | **PASS with skips** — **40 passed, 6 skipped, 0 failed** (~3.6 min). The 6 skips are the `money-path-1/2` specs, which call `skipIfNoBaseUrl()` and require a live web+API stack (`PLAYWRIGHT_BASE_URL`) — expected skip, not a regression. | — |
| 11 | Live UI probe (Playwright script, 480×840, en): marketplace → `property/prop-marina-vista-4b` (primary) → hero-Buy sheet → `property/prop-tbilisi-riverhouse-loft` (resale) | **PASS (recorded)** — 24 cards; no horizontal overflow on any surface; no raw i18n keys on buy surfaces (also asserted by `buy-flow.spec.ts`); values captured in §E | — |

---

## C. Architecture map (actual files)

Data layers (read in full for this audit):

| Layer | File | Responsibility |
|---|---|---|
| Canonical JSON | `docs/product/rebuild/ESTATE-24-DATA.json` | 24 records; identity, rateTable ANR, approved valuation, occupancy (all null), conflicts, consolidation |
| Generated companion | `docs/product/rebuild/ESTATE-24-DATA.md` | Generated 2026-09-11 from the JSON (24 records) |
| Placement | `docs/product/rebuild/ESTATE-DATA-PLACEMENT-MATRIX.json` | Field-by-field source/placement rules |
| Contracts | `docs/product/rebuild/ESTATE-DATA-CONTRACT.md`, `ESTATE-ECONOMICS-DESIGN-CONTRACT.md`, `ESTATE-MARKETING-FUNNEL.md`, `PRODUCT-DECISION-LOCK.md` | Provenance vocabulary, economics rules, funnel copy, final PO decisions 1–8 |
| Verbatim loader | `src/lib/economics/estates/estate-24-data.ts` | `ESTATE_24_DATA`, `getEstate24ByRuntimeId/ListingId` — no invented economics |
| R2 identity | `src/lib/economics/estates/canonical-24.ts` | `getCanonicalEstate()`; identity/nightly observed, valuation ESTIMATED, images from fixture gallery, occupancy/income null |
| V1 inputs | `src/lib/economics/estates/financial-model-v1-inputs.ts` | ANR + valuation + owner-tax per listing; throws on missing, never guesses |
| V1 engine | `src/lib/economics/financial-model-v1.ts` | Gross=ANR×nights(220/273/328) − 5%/7.5%/1.5% − ownerTax → Owner 75% → per-share → monthly ÷12; EUR and unknown-tax chains yield null |
| Offering | `src/lib/economics/canonical-offering.ts` | `CANONICAL_BASE_PRICE_USD = 10_000` ($100); `totalShares = valuation ÷ 100` |
| Marketplace VM | `src/lib/economics/marketplace-view-model.ts` | SOLE Canonical+Listing→UI bridge; identity/valuation canonical, trading params listing passthrough (incl. fixture `annualRentUsd/monthlyYieldRate`) |
| Detail VM | `src/lib/economics/estate-detail-view-model.ts` | ONLY place Detail touches engines; V1/investment facts all-24, legacy baseline Grand-only |
| Mock boundary | `src/lib/mock/canonical-listing.ts` | ONE place fixtures→user listings: identity/supply/price/valuation canonicalized; `annualRent/monthlyYieldRate/lastTrade/status` untouched |
| Mock repos | `src/lib/mock/marketplace.ts`, `src/lib/mock/orderbook.ts`, `src/lib/mock/portfolio.ts`, `src/lib/mock/earnings.ts`, `src/lib/mock/seed/*` | Canonicalized repos over 24 fixtures, 2 holdings, seeded books/earnings |
| Legacy yield | `src/lib/property-yield.ts`, `src/lib/yield-math.ts`, `src/lib/marketplace-filter.ts` | Fixture `sharePrice × monthlyYieldRate` math + card `projectedMonthlyIncomeUsd`; weekly −1pp is legacy-lock-only |
| Price | `src/lib/property-price.ts` | Single source: funding→`sharePriceUsd`; funded/resale→`bestAsk ?? lastTrade ?? sharePrice` |

Product surfaces:

| Surface | Files |
|---|---|
| Marketplace cards | `src/app/(app)/marketplace/page.tsx` (screen) · `src/components/property/PropertyCard.tsx` (card, consumes `MarketplaceEstate` only) · `src/components/marketplace/Marketplace{Search,FilterChips,SortChips,Skeleton}.tsx` · `src/lib/marketplace-filter.ts` (filters/sorts/card income) · home variants `src/components/home/{FeaturedPropertyCard,MoreOpportunitiesSection,MyPropertiesSection,YourEstatesCard}.tsx` (still on `useMarketplace` fixture path) |
| Property detail | `src/app/(app)/property/[id]/page.tsx` (route, sheet orchestration) · `src/components/property/PropertyDetail.tsx` (4-tab composer) · `PropertyHero.tsx` (identity + CTA state machine) · `PropertyTabs.tsx` · `EstateTabPanel.tsx` · `PropertyMetricsGrid.tsx` (V1 monthly) · `PropertyGallery/CompactTopBar/StickyCta/StatusBanner/DetailSkeleton.tsx` |
| Primary offering | `src/components/property/EstateInvestmentPanel.tsx` (value/growth/shares/$100) · `OwnershipV1Panel.tsx` (decision facts) · legacy `FundingPanel.tsx` (zero prod importers — dead, tests only) |
| Secondary market | `src/components/property/ResaleBlock.tsx` (demoted expander) · `MarketSection.tsx` (full section dead; only exported `MarketSummary` is live via `ResaleBlock`) |
| Order book | `src/components/property/OrderBook.tsx` (read-only) · `RecentTrades.tsx` · `src/hooks/useOrderBook.ts` · `src/lib/mock/orderbook.ts` (placed orders never move best) |
| Buy flow | `property/[id]/page.tsx` (`openBuyForContext`, `confirmBuy`, MainButton machine) · `buy/BuySheet.tsx` + `BuyQtyStep.tsx` + `BuySummaryStep.tsx` + `BuySuccessStep.tsx` (primary) · `LimitBuySheet.tsx` (secondary) · `src/hooks/useBuyShares.ts` · `src/lib/buy-quote.ts` |
| Sell flow | `SellSheet.tsx` (orchestrator) · `sell/{SellInstantPane,SellCustomPane,SellQtyStepper,SellQuoteSummary,SellListingStatus}.tsx` · `src/hooks/useSells.ts` · `src/lib/sell-quote.ts` · `src/components/portfolio/OpenOrdersBlock.tsx` + `ConfirmActionSheet.tsx` (cancel) |
| Portfolio/ownership | `src/app/(app)/portfolio/page.tsx` · `src/components/portfolio/{PortfolioSummaryCard,HoldingCard,HoldingDetailSheet,AllocationBar,LockedFreeCard,OpenOrdersBlock,PortfolioSkeleton}.tsx` · `PositionCard/OwnershipBanner/YieldLockSection/LockSheet.tsx` · `src/hooks/{usePortfolio,useLocks,useNfts}.ts` · `src/lib/portfolio-math.ts` |
| Income/valuation | `src/app/(app)/earnings/page.tsx` · `src/components/earnings/{EarningsHeroCard,YieldSummaryCard,IncomeJourneyChart,IncomeTimeline,IncomeByEstate,DistributionStatus,OtherReturns,PayoutCountdown}.tsx` · `IncomeV1Story.tsx` + `EstateV1Thesis/EstateProfitAllocation/EstateCostBreakdown/EstateEconomicsSection.tsx` (V1 narrative) · legacy `IncomeCalculator.tsx` (fixture coefficients) · `IncomeAnalytics/HolderAnalytics/PerformanceChart/PrimaryPerformanceCharts.tsx` (test-only, superseded) · `src/lib/income-view-model.ts`, `src/lib/estate-share-model.ts` |
| Translations | `messages/{en,ar,de,es,fa,fr,hi,id,pt,ru,tr,zh}.json` (en is type authority) · `src/i18n/{config,get-messages,detect-locale}.ts` · `src/components/i18n/LocaleProvider.tsx` · `src/components/settings/LanguageSelector.tsx`; usage is `useTranslations("<ns>")` per surface |
| Routes | `/` → `src/app/page.tsx`; `/home`, `/marketplace`, `/property/[id]`, `/portfolio`, `/earnings`, `/transactions`, `/settings`, `/onboarding`, `/profile-setup`, `/recovery-login` under `src/app/(app)/` |
| Hooks boundary | `useMarketplaceEstates` → `marketplace-view-model`; `useEstateDetailViewModel` → `estate-detail-view-model`; `useMarketplace/useProperty/useOrderBook/useBuyShares/useSells/usePortfolio/useEarnings/…` → `getRepo()` mock boundary |

---

## D. Twenty-four-property data audit

Runtime `prop-*` ↔ Rental Escapes listing map (`canonical-24.ts`, `estate-24-data.ts`):

| # | Runtime id | ListingId | Name (canonical) |
|---|---|---|---|
| 1 | prop-marina-vista-4b | 128862 | Grand 2 BDM Ocean Pool Villa (JOALI Being) |
| 2 | prop-soho-loft-studio | 126855 | Aerial Villa |
| 3 | prop-bayside-marina-penthouse | 108924 | Syrene Villa |
| 4 | prop-alfama-terrace-flat | 123861 | Villa du Cap |
| 5 | prop-tbilisi-riverhouse-loft | 125643 | Emerald Cay |
| 6 | prop-canggu-surf-villa | 130393 | Branson Villa |
| 7 | prop-tokyo-shibuya-studio | 130901 | Chalet Montana |
| 8 | prop-brooklyn-brownstone-flat | 131293 | Villa BDM |
| 9 | prop-berlin-mitte-apartment | 128529 | Trajan Villa |
| 10 | prop-barcelona-eixample-flat | 123320 | La Datcha |
| 11 | prop-london-camden-loft | 109098 | Galeazzo Villa |
| 12 | prop-sydney-harbour-apartment | 127825 | Embrace Villa |
| 13 | prop-toronto-condo | 122422 | ANI Dominican Republic |
| 14 | prop-melbourne-loft | 129548 | Mita Principe |
| 15 | prop-miami-beach-condo | 122903 | La Dolce Vita |
| 16 | prop-istanbul-bosphorus-flat | 126870 | Tranquility Villa |
| 17 | prop-mexico-city-penthouse | 130397 | Pearls of the Ocean |
| 18 | prop-kyoto-machiya | 127483 | Dream Pavilion |
| 19 | prop-cape-town-villa | 108856 | ANI Thailand |
| 20 | prop-bangkok-sukhumvit-condo | 108860 | ANI Sri Lanka |
| 21 | prop-amsterdam-canal-house | 106441 | Rio Chico |
| 22 | prop-buenos-aires-recoleta-flat | 129549 | Forza Modern |
| 23 | prop-seoul-gangnam-studio | 123919 | Chateau Prestige |
| 24 | prop-nyc-chelsea-loft | 122113 | Hawksbill Villa |

Canonical JSON economics per property (verified by parsing the working-tree JSON):

| # | ANR (rateTable.averageNightlyRate) | Valuation approved.central | Currency | Occupancy estimates |
|---|---|---|---|---|
| 1 | 97230.25 (FULL_TABLE, OBSERVED_DERIVED, inputs 67655/76458/102664/142144) | $8M, range [$8M,$10M], ESTIMATED | USD | null (UNKNOWN) |
| 2 | 64000.00 (FULL_TABLE) | $18M ESTIMATED | USD | null |
| 3 | 40000.00 (FULL_TABLE) | $12M ESTIMATED | EUR | null |
| 4 | 38575.00 (FULL_TABLE) | $25M ESTIMATED | EUR | null |
| 5 | 44285.67 (FULL_TABLE) | $28M ESTIMATED | USD | null |
| 6 | 41687.50 (FULL_TABLE) | $30M ESTIMATED | USD | null |
| 7 | 28785.72 (FULL_TABLE, allDerived) | $12M ESTIMATED | EUR | null |
| 8 | 38333.34 (FULL_TABLE, allDerived) | $18M ESTIMATED | USD | null |
| 9 | 35000 (MODEL_INPUT, PM-approved, NOT observed) | $8M ESTIMATED | USD | null |
| 10 | 37500.00 (FULL_TABLE) | $15M ESTIMATED | USD | null |
| 11 | 18000.00 (FULL_TABLE) | $12M ESTIMATED | EUR | null |
| 12 | 38571.43 (FULL_TABLE, allDerived) | $35M ESTIMATED | USD | null |
| 13 | 32666.67 (FULL_TABLE) | $50M ESTIMATED | USD | null |
| 14 | 30000.00 (FULL_TABLE) | $25M ESTIMATED | USD | null |
| 15 | 31500.00 (HOLIDAY_ONLY) | $32M ESTIMATED (HIGH confidence) | USD | null |
| 16 | 30625.00 (FULL_TABLE) | $35M ESTIMATED | USD | null |
| 17 | 36758.33 (FULL_TABLE) | $60M ESTIMATED | USD | null |
| 18 | 22988.00 (FULL_TABLE) | $20M ESTIMATED | USD | null |
| 19 | 27666.67 (FULL_TABLE) | $45M ESTIMATED | USD | null |
| 20 | 32666.67 (FULL_TABLE) | $50M ESTIMATED | USD | null |
| 21 | 25710.75 (FULL_TABLE) | $25M ESTIMATED | USD | null |
| 22 | 20000 (MODEL_INPUT, PM-approved, NOT observed) | $18M ESTIMATED | USD | null |
| 23 | 11815.00 (FULL_TABLE) | $15M ESTIMATED | EUR | null |
| 24 | 22783.33 (FULL_TABLE) | $22M ESTIMATED | USD | null |

Per-field source classification (uniform across all 24 unless noted):

| Field | Source | Provenance | Notes |
|---|---|---|---|
| Identity (name/slug/listingId/sourceUrl) | `ESTATE-24-DATA.json` via `estate-24-data.ts` + `canonical-listing.ts:42` | canonical / OBSERVED | Fixture `title` shorthand quarantined |
| Image | `canonical-24.ts:76-80` fixture gallery (`existing-app-fixture`) | fixture-based / hardcoded | JSON carries no images (confirmed by placement matrix); counts vary 8–95 per property but class is identical |
| Location | `estate24.location.full` via `canonical-listing.ts:43` | canonical / OBSERVED | Fixture shorthand overridden |
| Nightly rate display | `canonical-24.ts:81-86` verbatim | canonical / OBSERVED (types preserved: 5 RANGE, 15 APPROXIMATE, 2 STARTING_FROM — #9 Trajan, #22 Forza — 1 DYNAMIC — #15 La Dolce Vita) | #1 Grand range `$67,655–$76,458` is stale vs its 4-input ANR table (see §E) |
| Valuation (current) | `financial-model-v1-inputs.ts:179-191` (lowest-valid-value lows) | canonical / ESTIMATED | #1 single $8M for display vs [$8M,$10M] range in JSON |
| Growth potential | `growth-potential.ts:115-141` (research upper; #1 hardcoded $18M, no pct) | derived / ESTIMATED | — |
| Primary share price | `canonical-offering.ts:23` — $100.00 uniform | canonical / DERIVED | Fixture $85–$150 overridden |
| Secondary price | `property-price.ts:21-22` → fixture `lastTradeUsd` (e.g. #5 $81.60) | fixture-based / pending demo tape | No canonical ledger |
| Monthly income | DUAL (see §E): V1 `perShare.monthlyCents` (derived/projected — 9 known, 15 null) vs fixture `sharePrice × monthlyYieldRate` (all 24) | conflicted (derived vs fixture) | Cards use fixture; detail grid uses V1 |
| Total shares | `canonical-offering.ts:47` valuation÷100 → 80k,180k,120k,250k,280k,300k,120k,180k,80k,150k,120k,350k,500k,250k,320k,350k,600k,200k,450k,500k,250k,180k,150k,220k | canonical / DERIVED | Fixture 600–2500 overridden |
| Sold / remaining / funding | `canonical-listing.ts:36-38,56-58` demo ledger (`HOLDINGS` has only 2 rows: #3 Syrene 160, #4 Villa du Cap 200) → ~0% everywhere else | derived (demo ledger) | Fixture sold/progress overridden |
| Funding status (funding/funded/resale) | `seed/properties.ts` fixture, passed through untouched | fixture-based | No canonical source; drives CTA |
| annualRentUsd / monthlyYieldRate | `seed/properties.ts` fixture, passed through `marketplace-view-model.ts:110-111` | fixture-based | 6.77–7.38% band |
| Owner-tax (V1) | hand table: rate-known 9 (#1 10%, #2/#6/#5/#15/#16/#17/#18/#24 0%); explicit unknown 4 (#8,#12,#9,#22); implicit unknown 11 | canonical input / UNKNOWN where absent | 5 EUR estates short-circuit to null before tax |
| V1 computability | 9 computable (USD + known tax: #1,#2,#5,#6,#10,#15,#16,#17,#18,#24 — minus EUR/unknown-tax); 15 UNKNOWN (5 EUR + 10 unknown-tax) | derived / UNKNOWN | No values invented — `computeFinancialModelV1` returns null chains |
| Consolidation | CONFLICTED for #1 + #21–#24; ANI DR land conflict preserved | conflicted | — |

No property behaves structurally differently except: #1 Grand (range/single special-casing,
legacy $82M conflict, 4-input ANR), #9/#22 (PM-approved MODEL_INPUT ANR), #15 (HOLIDAY_ONLY
scope), the 5 EUR estates (V1 UNKNOWN chain), and the 15 unknown-tax estates (V1 UNKNOWN chain).

Real usage of the named inputs (verified, not trusted from reports):
`ESTATE-24-DATA.json` = canonical economic input (24 records, parsed above);
`ESTATE-24-DATA.md` = generated companion (exists — contradicts `PRODUCT-DECISION-LOCK.md`
“has no file”, see §E); `ESTATE-DATA-CONTRACT.md` = provenance/placement rules (honored:
no invented occupancy/income); `ESTATE-MARKETING-FUNNEL.md` = funnel copy contract;
`ESTATE-DATA-PLACEMENT-MATRIX.json` = per-field placement rules; canonical economics logic =
`financial-model-v1.ts` + `canonical-offering.ts` (live on detail surfaces, all-24);
legacy fixtures = `seed/properties.ts` (still live for status/rent/rate/lastTrade and all
home-page cards); `prop-*` ids preserved exactly as the runtime contract; marketplace data =
`marketplace-view-model.ts` (canonical identity + fixture trading params);
property-detail data = `estate-detail-view-model.ts` + `useEstateDetailViewModel.ts`.

---

## E. Contradictions and anomalies (all observed, with evidence)

1. **Card vs detail monthly income (Grand #1, live): card `$7.19` vs detail `$16.29`.**
   Observed in the 480×840 probe: first marketplace card
   `PROJECTED INCOME / SHARE $7.19` (from `projectedMonthlyIncomeUsd` =
   `sharePriceUsd × monthlyYieldRate`, `marketplace-filter.ts:102-107`, fixture inputs via
   `marketplace-view-model.ts:110-111`); detail `PropertyMetricsGrid` shows
   `MONTHLY INCOME $16.29` (from V1 `perShare.monthlyCents`, `PropertyMetricsGrid.tsx:53`),
   and the V1 story shows `$195.43 / year` (= $16.29/mo). Same share, two incomes.
2. **Nightly ANR vs nightly range confusion (Grand #1, live):** card/hero show the observed
   range `$67,655–$76,458` (`canonical-24.ts:170`, `ESTATE-24-DATA.json` rates block) while the
   detail V1 story shows `Average nightly rate $97,230.25` (the 4-input mean,
   `financial-model-v1-inputs.ts`). Both are “nightly” numbers with different meanings and no
   shared explanation on first viewport.
3. **Old yield shortcut still live:** `property-yield.ts:27-29` (`shareMonthlyYieldUsd`),
   `marketplace-filter.ts:102-107`, and `FeaturedPropertyCard.tsx:29` render
   fixture-rate income as user-facing income on cards/home, parallel to the V1 engine.
   Slice 2 owns this removal.
4. **Secondary price presented without market context:** resale hero (#5 Emerald Cay) shows
   `SHARE PRICE $81.60` (= fixture `lastTradeUsd` via `property-price.ts:22`) with CTA
   `Acquire Resale Ownership`, while primary shows `$100.00` + `Buy`. The number is correct
   per the hierarchy, but nothing on the hero says last-trade vs ask vs primary — the exact
   conflation the contract forbids.
5. **`0% funded · N shares remaining` on (almost) every estate:** the demo ledger
   (`canonical-listing.ts:21-24`, `HOLDINGS` = 2 rows) makes 22 of 24 estates read 0% funded,
   including $50–60M flagships. Technically demo-honest, but a first-time user reads it as a
   dead marketplace. Slice 5 owns the honesty/state decision.
6. **Images bypass the canonical JSON:** `PRODUCT-DECISION-LOCK.md` Tier-1 claims images flow
   JSON→view-model, but `estate-24-data.ts` carries no images and `marketplace-view-model.ts:92`
   falls back to the fixture gallery (`canonical-24.ts:76-80`, source `existing-app-fixture`).
   Provenance gap, not user-visible today.
7. **Grand valuation range vs single:** JSON range `[$8M,$10M]` + `marketplace-view-model.ts:41-44`
   vs displayed single `$8M` (`growth-potential.ts`, decision-lock §6). Screens are consistent
   ($8M everywhere observed), but the range/single duality is unresolved in the docs.
8. **Grand nightly inputs stale:** 4-input ANR table (incl. 102664/142144) vs displayed range
   `$67,655–$76,458` (2 inputs). Retired conflict `C-RATE-01` updated the model but not the
   `rates.nightly`/`rateDisplay` verbatim display.
9. **EUR + unknown-tax estates (15/24) are V1-UNKNOWN while fixture yield still renders:**
   `financial-model-v1.ts:116-160` correctly returns null, but any surface calling the fixture
   path would still print a confident number. Detail grid is safe (pending state); cards are not.
10. **Status drives CTA with no canonical source:** `funding/funded/resale` comes from the
    fixture (`marketplace-view-model.ts:102`, `estate-detail-view-model.ts:230`) and selects
    Buy vs Resale vs funded CTA (`estate-detail-view-model.ts:291-303`).
11. **Marketplace bottom card clipped by chrome (480×840 screenshot):** the last card’s
    `0% funded · 80000 shares remaining` + `View Estate` row slides under the bottom tab bar;
    the `Demo mode` pill overlaps card body copy (`1 share ≈ 1/80000` truncated). Spacing/
    safe-area issue, polish slice.
12. **`1 Issue` red pill overlapping content in probe screenshots:** external Chrome-extension
    overlay (no app source renders that string — grep clean). Test-environment artifact, not a
    product defect; E2E screenshots in CI are unaffected.
13. **Buy sheet copy `earn rental yield`:** frequency-neutral and consistent with the locked
    model (`messages/en.json`: 6 `weekly` hits — all withdrawal/installment contexts; 44
    `yield` hits, mostly lock/section labels). No `weekly profit/yield` promise found. P3 at most.
14. **`ESTATE-24-DATA.md` exists vs decision-lock “has no file”:** `PRODUCT-DECISION-LOCK.md:99-101`
    says the JSON “has no file” companion; the generated MD now exists (2026-09-11). Doc
    staleness only.
15. **`e2e/tests/ownership-touch.spec.ts` deleted in working tree** (165 lines). Uncommitted
    deletion — Slice 8/9 must confirm intentional vs accidental.

RTL/i18n state (observed): 12 locales present; E2E `estate-rtl` (fa) + `buy-flow` RTL gate +
`sell-flow` RTL gate all pass with no overflow and no raw keys; `buy-flow` LTR asserts no raw
keys on buy surfaces. No raw-key, truncation, or RTL failure was observed in this slice’s probe.

---

## F. Prioritized findings

- **P0-1 — Card/detail income divergence ($7.19 vs $16.29, Grand #1).**
  Path: `src/lib/marketplace-filter.ts:102-107` + `src/lib/economics/marketplace-view-model.ts:110-111`
  (card, fixture) vs `src/components/property/PropertyMetricsGrid.tsx:53`
  + `src/lib/economics/financial-model-v1.ts:239-260` (detail, V1).
  Observed: same share shows two monthly incomes (§E.1). Expected: one presentation layer
  (contract: single approved path). Likely source: Slice 2 work half-landed (V1 on detail,
  fixture still on cards). In current slice? No — record only. Recommended: **Slice 2**.
  Blocks continuation? Yes — it is the core Slice 2 defect; Slice 1 must table it first.
- **P1-1 — ANR vs nightly-range double “nightly” ($97,230.25 vs $67,655–$76,458).**
  Path: `src/lib/economics/estates/financial-model-v1-inputs.ts:155-177` vs
  `src/lib/economics/estates/canonical-24.ts:81-86`, surfaced together on the detail page.
  Expected: one explained nightly semantic per context. Recommended: **Slice 2/3**. Non-blocking.
- **P1-2 — Secondary price without market-context label ($81.60 hero).**
  Path: `src/lib/property-price.ts:17-23` + `src/components/property/PropertyHero.tsx:84-94`.
  Expected: last-trade/ask/NAV distinguished before the CTA (contract experience truths).
  Recommended: **Slice 4**. Non-blocking for Slice 1.
- **P1-3 — Fixture yield path still user-facing (cards/home).**
  Path: `src/lib/property-yield.ts:27-29`, `src/lib/marketplace-filter.ts:102-107`,
  `src/components/home/FeaturedPropertyCard.tsx:29`, `src/components/property/IncomeCalculator.tsx:11`.
  Expected: V1-only presentation with honest UNKNOWN. Recommended: **Slice 2**. Non-blocking alone.
- **P1-4 — 15/24 estates V1-UNKNOWN while cards print fixture income.**
  Path: `src/lib/economics/financial-model-v1.ts:116-160` vs card path above.
  Expected: pending state wherever V1 is UNKNOWN. Recommended: **Slice 2/3**. Non-blocking alone.
- **P2-1 — `0% funded` nearly everywhere (demo ledger of 2 holdings).**
  Path: `src/lib/mock/canonical-listing.ts:21-24,56-58`, `src/lib/mock/seed/holdings.ts:13-30`.
  Expected: explicit Slice 5 decision (stateful demo vs disclosed simulation).
  Recommended: **Slice 5**. Non-blocking.
- **P2-2 — Fixture status drives Buy/Resale CTA.**
  Path: `src/lib/economics/marketplace-view-model.ts:102`,
  `src/lib/economics/estate-detail-view-model.ts:230,291-303`.
  Expected: defined market-context rules (Slice 4). Recommended: **Slice 4**. Non-blocking.
- **P2-3 — Marketplace bottom clipping + Demo-pill overlap at 480×840.**
  Path: `src/app/(app)/marketplace/page.tsx` list tail / `AppShell` bottom inset.
  Expected: last card fully clear of tab bar; pill never covers copy. Recommended: **Slice 7**.
  Non-blocking.
- **P2-4 — Images fixture-sourced despite Tier-1 claim.**
  Path: `src/lib/economics/estates/canonical-24.ts:76-80`,
  `src/lib/economics/marketplace-view-model.ts:92`.
  Expected: doc/layer alignment (provenance honest). Recommended: **Slice 8**. Non-blocking.
- **P2-5 — Grand range/single + stale nightly inputs.**
  Path: `docs/product/rebuild/ESTATE-24-DATA.json:44-50,166-193`,
  `src/lib/economics/estates/growth-potential.ts:94-100`.
  Expected: one approved display + refreshed verbatim range. Recommended: **Slice 3**.
  Non-blocking.
- **P3-1 — `ESTATE-24-DATA.md` vs decision-lock staleness.**
  Path: `docs/product/rebuild/PRODUCT-DECISION-LOCK.md:99-101`.
  Expected: one-line doc correction. Recommended: **Slice 1 (docs only)**. Non-blocking.
- **P3-2 — Deleted `e2e/tests/ownership-touch.spec.ts` (uncommitted).**
  Expected: confirm intentional in Slice 8/9. Recommended: **Slice 8**. Non-blocking.
- **P3-3 — `earn rental yield` connect copy + 44 `yield` hits in `en.json`.**
  Path: `messages/en.json` (`property/connectWalletBody`, lock/section labels).
  Expected: terminology sweep against the locked monthly model. Recommended: **Slice 6/7**.
  Non-blocking.
- **Process-1 — Diverged branch + large uncommitted body (no product change proposed).**
  Observed: ahead 10 / behind 12; staged control docs; ~100 modified + ~19 untracked files
  incl. the +7589-line canonical JSON rewrite. Expected: user decision on
  commit + upstream reconcile before Slice 1. Recorded as DEC-003 (OPEN). **Blocks Slice 1
  start until acknowledged — not a product defect.**

Nothing in this slice was fixed, migrated, or redesigned. No economics were changed, no data
was invented, no fixture replaced canonical input, and the Phase 9 plan was not reordered.

---

## Probe screenshots (this slice, 480×840, en, dev server)

Captured to the OS temp dir (not committed): `marketplace.png` (24 cards, no overflow),
`detail-primary.png` (`prop-marina-vista-4b`: hero $100.00, `1 share ≈ 1/80,000`,
`Buy · $100.00`, metrics $100.00 / $16.29 / $8M / 0 / 80,000, no resale block),
`detail-buy-sheet.png` (wallet gate: `Connect wallet / Connect a TON wallet to buy shares
and earn rental yield`), `detail-secondary.png` (`prop-tbilisi-riverhouse-loft` resale:
hero $81.60, `Acquire Resale Ownership`, resale block present, no overflow).
