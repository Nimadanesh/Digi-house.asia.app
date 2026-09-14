# Phase 9 — Repository Audit 9.0

**Repo:** Nimadanesh/Digi-house.asia.app · **Branch:** `phase-9-redesign` · **Date:** 2026-08-31
**Scope:** READ-ONLY audit of the current implementation before Phase 9 Product Redesign. Source code is the source of truth.

---

## 1. Executive Summary

**What the current implementation actually is:** a monorepo (npm workspaces) Telegram Mini App — Next.js 16 App Router web client (`apps/web`, in-repo `src/`) plus a NestJS-style API (`apps/api`) with Postgres (drizzle migrations) and Redis/BullMQ. The product is a fractional real-estate investment dashboard: browse properties, buy shares with TON, weekly/monthly earnings, secondary-market orderbook, withdrawal installments.

**Production-oriented:** the API layer (drizzle migrations, real buy/settlement pipeline `settleVerifiedBuy`, orderbook engine, withdrawal installments, NFT minting worker, public read API + waitlist). The 24-property manifest seed (`portfolio-manifest.json`) is production data shared with the marketing site.

**Demo/mock-oriented:** the web client runs against a mock repository layer (`src/lib/mock`) behind repo interfaces in dev — holdings, earnings, orderbook, withdrawal fixtures are mock fixtures. The `properties-data.ts` fixtures are mock fixtures used by 20+ test files.

**Strongest foundations for Phase 9:** the Property Detail tab architecture (5 tabs: Overview/Performance/Holders/Income/Details — 5 tabs: Overview/Performance/Holders/Income/Details), the shared analytics dataset (`src/lib/property-analytics.ts`), the buy/sell/lock/withdraw sheet system (`ConfirmActionSheet`, sheet registry), the 24-property manifest seed, TON Connect flow, 12-locale i18n parity.

**Biggest blockers:** rental economics (occupancy, operating costs, net distributable income) does not exist anywhere in the data model — Phase 9 §13 requires it; Owner Stay has zero implementation; payout code pays weekly while the locked model says monthly accrual (documented conflict, not resolved per rules); two property datasets (DB manifest vs `src/lib/mock` fixtures) can drift.

---

## 2. Route Map

| User-facing area | Current route | Main component | Supporting components | Data source |
| ---------------- | ------------- | -------------- | --------------------- | ----------- |
| Onboarding | `/onboarding` | `(app)/onboarding/page.tsx` | `components/onboarding/*` carousel | static slides (`lib/onboarding-slides.ts`) |
| Profile setup | `/profile-setup` | `(app)/profile-setup/page.tsx` | `components/profile/*` | local store |
| Recovery login | `/recovery-login` | `(app)/recovery-login/page.tsx` | — | Telegram initData |
| Home | `/home` | `(app)/home/page.tsx` | `components/home/*` | mock (`lib/mock/portfolio.ts`, `earnings.ts`) |
| Marketplace | `/marketplace` | `(app)/marketplace/page.tsx` | `PropertyCard`, `marketplace-filter` | mock (`lib/mock/marketplace.ts`) |
| Property detail | `/property/[id]` | `(app)/property/[id]/page.tsx` | `PropertyDetail` + 5-tab panels, sheets | mock repos + `lib/property-analytics.ts` |
| Portfolio | `/portfolio` | `(app)/portfolio/page.tsx` | `components/portfolio/*` | mock (`lib/mock/portfolio.ts`) |
| Earnings | `/earnings` | `(app)/earnings/page.tsx` | `components/earnings/*` | mock (`lib/mock/earnings.ts`, `withdrawals.ts`) |
| Transactions | `/transactions` | `(app)/transactions/page.tsx` | `components/transactions/*` | mock (`lib/mock/transaction.ts`) |
| Settings | `/settings` | `(app)/settings/page.tsx` | `SettingsSheet` | local store |
| Root | `/` | `src/app/page.tsx` | onboarding redirect | — |

---

## 3. Navigation Audit

- **Bottom tab bar:** `src/components/layout/BottomTabBar.tsx` — floating capsule, 4 tabs: Home (`Home` icon), Marketplace (`Store`), Earnings (`Wallet`), Portfolio (`PieChart`). Labels via `next-intl` `tabs.*` keys. Active state: pathname prefix match + active pill (`bg-primary/12`) + haptics on tap.
- **Telegram BackButton:** sheet close-registry (`closeTopSheet`, Task 2 of 2026-08-28) — Back closes the topmost open sheet; Settings nested sheets unwind in order; a pending non-dismissible disconnect can never be dismissed by Back. Transactions page consults the registry before `router.back()`.
- **MainButton:** `AppShell` hides the tab bar while `mainButtonActive` (ui.store) — MainButton takes over.
- **Sheets:** `SettingsSheet` with nested language/about/sign-out/withdraw/disconnect-confirm; `ConfirmActionSheet` generic intent→details→confirm flow; global toast host.
- **Phase 9:** shell is fully preservable — only tab labels/iconography change (Estates/Income/My Estates per redesign §4).

---

## 4. Home Audit

Route `/home` → `(app)/home/page.tsx` → `components/home/*`:

| Component | Responsibility | CTA / target | States |
| --- | --- | --- | --- |
| Home header | brand + profile access | → `/settings` | — |
| Portfolio value hero (`lib/mock/portfolio.ts`) | total value + holdings count | → `/portfolio` | skeleton + empty |
| Next payout (`lib/mock/earnings.ts`) | next payout amount/date | → `/earnings` | skeleton |
| My properties list | owned properties | → `/property/[id]` | skeleton + empty |
| Featured property (`lib/home-featured.ts`) | featured card | → `/property/[id]` | skeleton |
| Trust footer | verification/disclaimer | — | static |

Phase 9 mapping: Portfolio Value → **Your Estates** hero (REFACTOR); Next Payout → **Next Distribution** (REFACTOR, `Expected/Accrued/Paid` semantics); My Properties + Featured → **Featured Estate** + **More Estates** (REFACTOR); Trust Footer → PRESERVE + upgrade copy.

---

## 5. Marketplace / Estates Audit

Route `/marketplace` → `(app)/marketplace/page.tsx` + `lib/marketplace-filter.ts`:

- **Search:** text search over title/destination (`marketplace-filter.ts`).
- **Filters:** status-based (funding/funded/resale).
- **Sorting:** default feed order; no curated sort yet.
- **Property cards:** `PropertyCard` with image, name, destination, metric grid (Primary: "Night / From"; Secondary: "Last price"), funding states (progress bar on funding cards), resale states (last-price metric).
- **Card CTA:** whole card navigates to `/property/[id]` (no per-card Buy buttons — already Phase 9 compliant).
- **States:** loading skeleton, empty, error all present.

Phase 9: search/filter/card infrastructure is the base of the Estates experience (PRESERVE + REFACTOR: add `Featured/New/Income/Owner Stay` filters, `Curated` default sort, ownership-fraction + owner-stay entitlement on cards).

---

## 6. Property Detail Audit

Route `/property/[id]` → `(app)/property/[id]/page.tsx` → `PropertyDetail` (5 tabs: Overview/Performance/Holders/Income/Details). Data: mock repos + `lib/property-analytics.ts` (shared deterministic dataset).

| Component | File | Current purpose | Data | CTA | Phase 9 action |
| --------- | ---- | --------------- | ---- | --- | -------------- |
| Gallery | `property/PropertyGallery.tsx` | image gallery | mock images | — | PRESERVE |
| Hero | `property/PropertyHero.tsx` | name/destination/facts | mock property | — | REFACTOR (Phase 9 hero: ownership proposition, CTA states) |
| KPI grid | `PropertyDetail.tsx` | price/shares metrics | mock property | — | REFACTOR (ownership-first labels) |
| Tabs | `property/PropertyTabs.tsx` | 5 tabs: Overview/Performance/Holders/Income/Details | — | — | REFACTOR (→ `Estate/Income/Ownership/Details`; Performance → Income/Ownership; Holders → Ownership) |
| FundingPanel | `property/FundingPanel.tsx` | funding % + bar (Primary) | mock property | — | PRESERVE |
| PropertyFundamentals | `property/PropertyFundamentals.tsx` | value/annual rent/gross yield | mock property | — | PRESERVE |
| IncomeCalculator | `property/IncomeCalculator.tsx` | projected income | shares × yield | — | PRESERVE (buy flow step 3) |
| PositionCard | `property/PositionCard.tsx` | locked/free shares, accrued unpaid | mock holdings | Lock/Sell → sheets | PRESERVE (→ Ownership tab) |
| MarketSection | `property/MarketSection.tsx` | current price, bid/ask, spread | `lib/property-price.ts` | — | PRESERVE (→ Income/Ownership) |
| PrimaryPerformanceCharts | `property/PrimaryPerformanceCharts.tsx` | funding progress charts | `property-analytics.ts` | — | MOVE (→ Income/Ownership) |
| SecondaryPerformanceCharts | `property/SecondaryPerformanceCharts.tsx` | price/ohlc/volume charts | `property-analytics.ts` | — | REFACTOR (demote; no speculative charts per redesign §11) |
| HolderAnalytics | `property/HolderAnalytics.tsx` | 6 holder visualizations | `property-analytics.ts` | — | MOVE (→ Ownership tab) |
| IncomeAnalytics | `property/IncomeAnalytics.tsx` | 12-month per-share payouts | `property-analytics.ts` | — | MOVE (→ Income tab) |
| IncomeCalculator | `property/IncomeCalculator.tsx` | projected income | shares × yield | — | PRESERVE (buy flow step 3) |
| TrustSection | `property/TrustSection.tsx` | verification/disclaimer | mock property | — | REFACTOR (verification states + last-verified date) |
| Documents | `property/PropertyDocumentsList.tsx` | document list + download | mock `lib/mock/documents.ts` | download | PRESERVE (→ Details/due diligence) |
| SimilarProperties | `property/SimilarProperties.tsx` | related properties | mock | → detail | PRESERVE |
| BuySheet | `property/BuySheet.tsx` | TON buy flow | mock/API | TON pay | PRESERVE (reorder per redesign §8) |
| SellSheet / LockSheet | `property/SellSheet.tsx`, `LockSheet.tsx` | sell/lock flows | mock locks | sell/lock | PRESERVE |
| Owner Stay | — | — | — | — | NEW (not implemented anywhere) |

---

## 7. Portfolio / My Estates Audit

Route `/portfolio` → `(app)/portfolio/page.tsx` + `components/portfolio/*`:

- **Portfolio summary:** total value, holdings count (`lib/mock/portfolio.ts`).
- **Allocation:** per-property breakdown.
- **Holdings:** locked vs free shares; accrued unpaid; unlock/sell → sheets; LockSheet/SellSheet mount conditionally (G10).
- **Open orders:** from `lib/mock/orderbook.ts`; cancel with confirmation sheet.
- **CSV/export:** error surfacing via toast.
- **NFT badge:** collectible position card + detail block.

Phase 9 mapping: summary → **My Estates hero** (REFACTOR); holdings → **Estate Position Card** (REFACTOR: image, ownership %, stay availability); locked/free → plain-language copy (REFACTOR); open orders → "Pending ownership transactions" (label REFACTOR); export → "Download ownership statement" (label REFACTOR).

---

## 8. Earnings / Income Audit

Route `/earnings` → `(app)/earnings/page.tsx` + `components/earnings/*`, `lib/earnings-stats.ts`:

- **Total earnings:** sum of mock payouts (`lib/mock/earnings.ts`).
- **Chart:** cumulative earnings.
- **Timeline:** payout events.
- **Yield summary:** yield rate display.
- **Withdrawal:** `lib/mock/withdrawals.ts` mirrors API math (`planWithdrawal`); review flow shows 1% fee, net, 4 weekly installments.

**Income/yield/payout terminology definition sites (do not change):**
- `src/lib/yield-math.ts` — yield formulas
- `src/lib/earnings-stats.ts` — earnings aggregation
- `src/lib/payout-display.ts` — display conversion (weekly mock figure ×52/12 → "/ month")
- `apps/api` payout/settlement module — Sunday weekly schedule (documented conflict with monthly model)
- `messages/*.json` — all user-facing terminology

**Semantics conflicts (documented, not resolved):** payout code pays weekly while locked model says monthly accrual; display converts weekly ×52/12.

---

## 9. Resale Audit

Complete secondary-market flow:

- **Market listings:** `MarketSection` — current price (`lib/property-price.ts`), best bid/ask, spread, recent fills.
- **Order book:** `lib/mock/orderbook.ts` — bids/asks with spread.
- **Buy:** `BuySheet` → TON buy flow → `settleVerifiedBuy` (API) → holdings + NFT mint.
- **Sell / limit buy:** `SellSheet` (instant sell at −7% buyback with review step) and limit orders with confirmation; `lib/mock/sells.ts`.
- **Cancellation:** cancel with confirmation sheet.
- **Locked/free restrictions:** locked shares cannot be sold — `lib/mock/locks.ts`; LockSheet unlock flow.
- **Price representation:** cents internally, `usd()` display; single-source current price (`lib/property-price.ts`).

**Works (real):** buy/settlement pipeline, orderbook engine, withdrawal installments, NFT minting, public API.
**Simulated/mock:** price history, holder data, income history, fills (deterministic generators in `lib/property-analytics.ts`); mock repos in dev.

---

## 10. Owner Stay Audit

Repository-wide search for: owner stay / owner nights / stay rights / booking / calendar / concierge / guest / reservation / hospitality / service — **no implementation exists**. No data structures, no UI, no API, no mock data.

**OWNER STAY: NOT IMPLEMENTED**

Phase 9 needs: entitlement/usage/blackout data model, calendar UI, request flow, concierge service list (§12) — all NEW.

---

## 11. Rental Economics Audit

| Value | Frontend | Backend | DB/schema | Mock | Calculation location |
| --- | --- | --- | --- | --- | --- |
| Property value | display | manifest `valuationUsd` | `properties` table | `properties-data.ts` | seed ×100 cents |
| Share price | `lib/property-price.ts` (single source) | `pricePerShare` | `properties` table | fixtures | API + mock |
| Rental revenue | — | `annualRentUsd` (manifest) | `properties` table | derived | seed |
| Occupancy | — | — | — | — | **does not exist** |
| Expenses | — | — | — | — | **does not exist** |
| Net income | — | — | — | — | **does not exist** |
| Yield | `lib/yield-math.ts` | `projectedNetYield` | `properties` table | derived | API + mock |
| Payout | `lib/earnings-stats.ts` | Sunday weekly schedule | payout tables | `lib/mock/earnings.ts` | API + mock |
| Distribution | `lib/payout-display.ts` (weekly ×52/12 → "/ month") | — | — | — | presentation layer |
| Withdrawal fee | `lib/mock/withdrawals.ts` (`planWithdrawal` mirror) | 1% fee, 4 weekly installments | withdrawal tables | mirrors API | API + mock |
| Payout schedule | display only | Sunday weekly schedule | payout tables | mirrors API | API + mock |

**Duplicated calculations flagged:** payout-display weekly×52/12 conversion; withdrawal math mirrored between API and `lib/mock/withdrawals.ts`; yield derived independently in `lib/yield-math.ts` and `property-analytics.ts` (yield from price walk).

**Documented conflict (not resolved):** payout code pays weekly while locked model says monthly accrual.

---

## 12. Data Source Audit

- **Mock mode:** web client dev default — `src/lib/mock/*` repos behind interfaces; `properties-data.ts` fixtures used by 20+ test files.
- **API mode:** `apps/api` — drizzle migrations, Postgres, Redis/BullMQ; `settleVerifiedBuy` pipeline; public read API (`GET /public/properties[/:id]`, A5) + waitlist (A6).
- **Database mode:** Postgres via drizzle migrations; Redis/BullMQ workers (NFT minting).
- **Environment variables:** `.env.example`, `.env.local.example`, `.env.vercel.example`; `PUBLIC_CORS_ORIGINS` (A5).
- **Seed data:** `portfolio-manifest.json` (repo root) — the 24-property manifest shared with the marketing site; `db:seed:dryrun` script; idempotent.
- **Demo properties:** `properties-data.ts` fixtures (test-only).
- **Real FractionalLuxe properties:** the manifest (production data, shared with site).

**Actual data flow:** UI → mock repos (dev) | UI → API → Postgres/Redis (deployed). Manifest is production data shared with the marketing site.

---

## 13. Business Rules Audit

Authoritative docs: `FRACTIONALLUXE-PROGRAM.md` (locked model), `.agent/context/BUSINESS-RULES.md`, `docs/product/phase-9/PHASE-9-PRODUCT-REDESIGN.md`.

- **Monthly rental income accrual:** locked model says monthly; payout code pays weekly (Sunday schedule) — conflict documented in A4, not resolved.
- **Withdrawal fee:** 1% fee — consistent across API, mock mirror (`planWithdrawal`), and UI review flow.
- **Four weekly installments:** consistent across API, mock, UI.
- **Locked/free ownership:** locked shares cannot be sold — consistent across API, mock (`lib/mock/locks.ts`), UI (LockSheet).
- **Primary vs secondary market:** consistent across API, mock, UI (Primary fixed price, no price charts; Secondary orderbook).

**Conflicts (documented, not resolved):** weekly payout code vs monthly locked model; display converts weekly ×52/12 at presentation layer.

---

## 14. Trust / Verification Audit

**Exists:** `TrustSection` (verification/disclaimer), `PropertyDocumentsList` (document list + download, error surfacing), simulated-data disclosures, NFT collectible verification badge + detail block, TON transaction verification (`settleVerifiedBuy`), funding/status banners.

**Phase 9 needs:** verification states + last-verified date, valuation docs, rental history, management partner identity, ownership-structure docs — partially NEW (REFACTOR TrustSection + extend data model).

---

## 15. Technical Risk Register

| Risk | Severity | Evidence | Phase 9 impact | Recommendation |
| ---- | -------- | -------- | -------------- | -------------- |
| Rental economics (occupancy/expenses/net income) absent | P0 | §11 — fields exist nowhere | Estates/Rental Performance/Owner Stay need them | Add explicit unavailable states or extend data model |
| Owner Stay not implemented | P0 | §10 — zero code | §12 requires calendar/entitlement | NEW capability, controlled scope |
| Weekly payout code vs monthly locked model | P1 | A4 log, §11 | Income screens mislabel semantics | Keep documented; presentation-layer conversion |
| Dual property datasets (DB manifest vs mock fixtures) | P1 | §12 | Mock/API drift | Single source contract tests (A3 pattern) |
| Simulated analytics datasets (price/holders/income) | P2 | §9, `property-analytics.ts` | Phase 9 "no fabricated data" rule | Keep disclosures; mark as simulated |

---

## 16. Reusable Foundation

### PRESERVE
- TON buy/settlement pipeline (`settleVerifiedBuy`), orderbook engine, withdrawal installments, NFT minting worker, public API + waitlist.
- Property Detail tab architecture, sheets system (`ConfirmActionSheet`, sheet registry, toasts), AppShell + BottomTabBar.
- 24-property manifest seed, `property-analytics.ts` shared dataset, 12-locale i18n parity tooling.

### REFACTOR
- `TrustSection` (verification states + last-verified date), `PropertyHero` (ownership proposition + CTA states), `PropertyTabs` (→ `Estate/Income/Ownership/Details`), Marketplace filter (→ Phase 9 filters), Portfolio components (→ My Estates labels/cards), Earnings (→ Income semantics).

### NEW
- Owner Stay (calendar, entitlement, request flow, concierge list — zero code today).
- Rental economics data model (occupancy, operating costs, net distributable income).
- Income by Estate breakdown; rental statement view.

### LEGACY / CONFLICT
- Weekly payout schedule vs monthly locked model (documented, unresolved).
- Simulated price/holder/income datasets vs Phase 9 "no fabricated data" rule (keep disclosures).
- Legacy `PerformanceChart` (superseded by Phase 5 charts, kept on disk).

---

## 17. Audit Conclusion

### Phase 9 Readiness

**READY FOR IMPLEMENTATION PLANNING**

Why: the foundations are strong — tab architecture, sheets system, TON settlement, manifest seed, shared analytics dataset, i18n parity — and the Phase 9 redesign explicitly preserves them. But Owner Stay has zero code, rental economics fields (occupancy, operating costs, net distributable income) do not exist in any data layer, and the payout-schedule conflict is unresolved. These need planning (data model + explicit unavailable states) before implementation can start.
