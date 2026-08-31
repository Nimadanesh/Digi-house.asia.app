# Phase 9 — UI Mapping (implementation plan, planning-only)

**Repo:** Nimadanesh/Digi-house.asia.app · **Branch:** `phase-9-redesign` · **Date:** 2026-08-31
**Status:** PLANNING ONLY — no source code touched. This document is the bridge between:

- **CURRENT** = `PHASE-9-AUDIT-9.0.md` (source of truth for what exists)
- **DESIRED** = `PHASE-9-PRODUCT-REDESIGN.md` (source of truth for target UX)
- **FINANCIAL SEMANTICS** = `.agent/context/BUSINESS-RULES.md` + `FRACTIONALLUXE-PROGRAM.md` (locked)

Where the Audit exposes a conflict with the redesign proposal, the Audit wins and the deviation is
explicitly marked **[AUDIT-OVERRIDE]**.

---

## 1. Global Product Architecture

### 1.1 Route preservation decision

Per redesign §3 ("Do not introduce route migrations merely for naming") and confirmed by the Audit
(§2 Route Map): **all existing routes are preserved; only visible product semantics change.**

| Current route | Current meaning | Phase 9 meaning | Route change? | Rationale |
|---|---|---|---|---|
| `/home` | investment dashboard | **Home** — ownership overview + discovery | NO | content refactor only |
| `/marketplace` | marketplace feed | **Estates** — curated estate discovery | NO | filter/sort/card refactor |
| `/property/[id]` | property detail | **Estate Detail** | NO | highest-priority screen, refactor |
| `/portfolio` | portfolio holdings | **My Estates** | NO | label + card refactor |
| `/earnings` | earnings/yield | **Income** — rental distributions | NO | semantics refactor |
| `/transactions` | tx ledger | **Transactions** (utility, not a tab) | NO | see §2.3 |
| `/settings` | settings sheet/page | **Settings** (utility, not a tab) | NO | see §2.3 |
| — | — | **Resale** | NO new route | resale is a *filter + estate-detail state + sheets*, not a page (see §8) |
| — | — | **Owner Stay** | NO new route in P0 | ownership privilege rendered *inside* Estate Detail / My Estates / Home cards (see §9) |

**No new routes are created in Phase 9.** Resale and Owner Stay are surfaces, not destinations:
Resale = Estates filter + estate-detail resale block + existing Sell/LimitBuy sheets.
Owner Stay = entitlement block + calendar sheet inside existing screens. This avoids new tab-bar
slots (max 4 tabs is a hard Telegram-UX constraint at 480px) and avoids route-migration risk.

### 1.2 Naming map (user-visible language)

| Internal | User-visible (EN) | Never shown as |
|---|---|---|
| property / listing | **Estate** | "asset", "token" |
| shares | **ownership share(s)** | "tokens", "coins" |
| holdings | **My Estates / your ownership** | "positions book" |
| earnings | **Income / rental income** | "yield farming", "rewards" |
| secondary market | **Resale** | "trading", "exchange", "market" |
| orderbook bid/ask | best **offer** / best **asking price** | "bid/ask" on primary surfaces |
| lock | **locked ownership** | "stake", "vesting" |
| withdrawal | **withdraw income** | "claim", "harvest" |

---

## 2. Navigation

### 2.1 Phase 9 bottom navigation (4 tabs — hard limit at 480px)

Tab bar: existing `src/components/layout/BottomTabBar.tsx` (floating capsule, active pill
`bg-primary/12`, haptics on tap, prefix-pathname matching). **Only `TAB_DEFS`, icons and i18n keys
change.** Structure/behavior PRESERVED.

| # | Label | Icon (lucide) | Route | Active state | Purpose | Primary user intent |
|---|---|---|---|---|---|---|
| 1 | **Home** | `Home` | `/home` | existing pill `bg-primary/12` + `text-primary` | ownership overview + discovery | "what do I own, what's happening" |
| 2 | **Estates** | `Landmark` (or `Building2`) — property iconography, NOT `Store` | `/marketplace` | same mechanism | curated estate discovery | "find a villa to co-own" |
| 3 | **Income** | `Banknote` (or `Coins`) — NOT `Wallet` (wallet reads crypto) | `/earnings` | same mechanism | rental distributions | "what did I earn, when is next" |
| 4 | **My Estates** | `PieChart` kept, or `KeyRound` | `/portfolio` | same mechanism | ownership collection | "manage what I own" |

Active-state mechanics, haptics, safe-area, capsule styling: **PRESERVE** (Audit §3 — shell is
fully preservable). i18n keys `tabs.*` updated in all 12 locales.

### 2.2 What happens to Transactions and Settings

- **Transactions** (`/transactions`): demoted from navigation candidate to a **utility page**
  reachable from: My Estates → "Pending ownership transactions" block → "All transactions" link;
  and Income → history footer. Kept as-is functionally (BackButton registry consult preserved,
  Audit §3).
- **Settings** (`/settings`): stays a utility destination via Home header profile button (current
  behavior, Audit §4). No tab slot. `SettingsSheet` nested-sheet back-stack preserved untouched.

### 2.3 Not implemented (explicit)

No 5th tab, no hamburger drawer, no route renames, no `/estates` alias route. Route `/marketplace`
keeps its path; the visible H1 becomes "Estates".

---

## 3. HOME (`/home`)

Existing per Audit §4: header, portfolio-value hero, next-payout, my-properties list, featured
property, trust footer — all with skeleton/empty states. Refactor, do not rebuild.

### 3.1 Layout top-to-bottom

| # | Section | Component action | Reuse base | Data required | CTA → destination | Loading | Empty | Unavailable |
|---|---|---|---|---|---|---|---|---|
| 1 | **Header** | PRESERVE | home header (brand + profile → `/settings`) | none | profile → `/settings` | static | static | static |
| 2 | **Ownership / wealth snapshot** ("Your Estates") | REFACTOR `Portfolio value hero` | `lib/mock/portfolio.ts` summary | total ownership value, estate count, invested capital; YTD income only if earnings repo has paid entries; value-change % ONLY when a trustworthy baseline exists (P1) | **View My Estates** → `/portfolio` | existing skeleton | "You don't own any estates yet" + CTA **Explore Estates** → `/marketplace` | if holdings repo errors: error block with retry (existing pattern) |
| 3 | **Next distribution** | REFACTOR `Next payout` | `lib/mock/earnings.ts` + `lib/payout-display.ts` | amount + date + status word | **View Income** → `/earnings` | existing skeleton | hide block when no pending/paid entries (not a fake "0") | if only weekly-schedule data exists (see §7.3): label status **Expected**, never "guaranteed"; no period claim beyond what the entry carries |
| 4 | **My Estates preview** (≤3 position mini-cards) | REFACTOR `My properties list` | portfolio repo + `PropertyCard` variant `mini` | owned estates: image, name, ownership %, current value | whole card → `/property/[id]`; footer link **All my estates** → `/portfolio` | existing skeleton | hidden when user owns nothing (section 2 shows empty-state CTA instead) | per-card error → skip card, never render placeholder value |
| 5 | **Featured Estate** | REFACTOR `Featured property` | `lib/home-featured.ts` (`pickFeaturedListing`) | featured listing: image, name+destination, entry/share price, projected income (existing calculator math only), owner-stay entitlement (§9 data — likely UNAVAILABLE, see matrix), verification state | **View Estate** → `/property/[id]` | existing skeleton | hidden when no open listings | projected-income metric shows "Data pending" when dataset lacks it (see §13) |
| 6 | **More Estates** (max 3 cards) | REFACTOR (reuse `PropertyCard` list variant) | marketplace repo | same as estate card (§4.5) | whole card → `/property/[id]` | skeleton | hidden | skip failed cards |
| 7 | **Trust / verification footer** | PRESERVE + copy upgrade | existing trust footer | static | — | static | static | static |

### 3.2 Rules

- No invented financial numbers anywhere (locked rule). Projected income on Featured uses the
  existing `IncomeCalculator`/yield math only; if `annualRentUsd` is absent for an estate →
  "Data pending" chip, not 0.
- One dominant CTA per screen: **View My Estates** (hero). All other CTAs are quiet links.

---

## 4. ESTATES (`/marketplace`)

Existing per Audit §5: search over title/destination, status filters, default feed order,
`PropertyCard` (whole-card navigation, no per-card Buy — already Phase 9 compliant), all states
present.

### 4.1 Page header
REFACTOR labels: H1 **Estates**, subtitle **"Own a share of exceptional properties."** New i18n
keys `estates.*` in all 12 locales (parity tooling, Audit §16).

### 4.2 Search — PRESERVE
`marketplace-filter.ts` text search over title/destination. Placeholder copy → "Search villas,
destinations or regions."

### 4.3 Filters — REFACTOR
Existing status-based chips → Phase 9 set: **All / Featured / New / Income / Owner Stay / Resale**.
- `Featured` / `New` — derivable from existing listing fields (featured flag / created-at age
  window already used by `listingStatusBadge`).
- `Income` — matches estates where a rental-income metric is AVAILABLE (see §13); estates without
  data are excluded from this filter, never shown with a fabricated value.
- `Owner Stay` — matches estates with owner-stay entitlement data; **until the data model exists
  this filter renders but matches nothing** and shows the honest empty state "Owner Stay data is
  not available yet" (no fake matches).
- `Resale` — existing resale status filter (PRESERVE).
- Optional later (P2): destination type chips (beach/mountain/city) — only when the manifest
  carries a type field.

### 4.4 Sorting — REFACTOR
Default **Curated** (stable manifest order = current feed order, renamed). Optional sorts:
rental income (only estates with available income data), entry price, newest, owner privileges.
**Never default to highest yield** (redesign §6).

### 4.5 Estate card — REFACTOR `PropertyCard`
Base: existing card (image, badges, 3-metric grid, funding bar, whole-card navigation). Changes:

| Element | Action | Data | State when missing |
|---|---|---|---|
| property image | PRESERVE | existing | existing fallback image |
| verified badge | NEW (small check chip, top-start next to status badge) | verification state + last-verified date — **PARTIAL/UNAVAILABLE today** (Audit §14) | chip hidden entirely when unverified-unknown; never a fake check |
| estate name / destination / type | REFACTOR labels | existing title/location | existing |
| price per share | PRESERVE `getCurrentSharePrice` single source | existing | existing disabled state |
| ownership fraction per share | NEW line ("1 share ≈ 1/N of the estate") | `1/totalShares` — **AVAILABLE** | — |
| availability (primary) | PRESERVE funding bar + "X% funded · N shares remaining" | existing | — |
| rental/income metric | REFACTOR current income metric | **CONFLICTING/PARTIAL** — `annualRentUsd` + `projectedNetYield` exist as *projections*; actuals do not exist (Audit §11) | premium **"Data pending"** / **"Not yet reported"** state: muted chip with ⓘ, never 0, never a fabricated number |
| owner-stay entitlement indicator | NEW chip ("Owner stays included") | **UNAVAILABLE** (Audit §10 — zero implementation) | chip hidden until data model exists; no placeholder chip |
| CTA | PRESERVE whole-card navigation; **no per-card Buy** | — | — |

### 4.6 Card CTA behavior
Whole card → `/property/[id]` (PRESERVE). Acquisition intent is expressed on Estate Detail only.

---

## 5. ESTATE DETAIL (`/property/[id]`) — highest priority

### 5.1 Tab structure decision: **`Estate / Income / Ownership / Details`** (4 tabs)

**Decision: adopt the 4-tab model.** Reasoning against each alternative criterion:

- **Current component architecture:** the 5 tabs are thin dispatchers over independent panels
  (`PropertyDetail.tsx` — Audit §6). Regrouping panels into 4 tabs is a composition change in ONE
  file plus i18n keys; no panel component needs structural rewrite. Low risk.
- **Information hierarchy:** current Overview mixes ownership (banner/position), market (MarketSection)
  and projections (calculator) — three mental models in one scroll. Splitting into Estate (what is
  this property + can I buy) / Income (does it earn) / Ownership (what do I hold + who else holds)
  gives each model its own home.
- **User mental model:** "Holders" and "Performance" are exchange vocabulary. Redesign §7
  explicitly forbids a stock-exchange model; "Ownership" and "Income" are owner vocabulary.
- **Technical risk:** Performance content *splits* — funding charts (Primary) belong to Estate,
  rental/income charts to Income, price charts (Secondary) demote to a collapsed resale block.
  Holders→Ownership is a clean MOVE. The risky part (chart demotion) is required by the redesign
  regardless of tab count, so it adds no *extra* risk to the 4-tab choice.
- **Luxury positioning:** 4 quiet tabs read like brochure sections; 5 dense tabs read like a terminal.
- **Investment clarity:** Income as a first-class tab matches the product promise ("my ownership
  participates in rental income").

Rejected alternative (retain 5 tabs with semantic renames): keeps "Performance" as a tab — but
Performance's only Phase 9-legitimate content is rental economics, which IS Income. A separate
Performance tab would either duplicate Income or keep a trading-terminal surface. **4 tabs win.**

### 5.2 Complete page map

| Section | Existing component | Action | New / refactored | Data | CTA | States |
|---|---|---|---|---|---|---|
| **Header / Gallery** | `PropertyGallery` | PRESERVE | — | existing images | — | existing |
| **Hero** | `PropertyHero` | REFACTOR | ownership proposition line, share price, CTA states per redesign §7 | existing + verification chip | non-owner: **Acquire Ownership**; owner: **Manage Ownership** (scrolls to Ownership tab); resale: **Acquire Resale Ownership**; sold-out: **View Resale Opportunities** (switches to resale block) | existing disabled/sold-out states |
| **Status banner** | `PropertyStatusBanner` | PRESERVE | — | existing | — | existing |
| **KPI grid** | `PropertyMetricsGrid` | REFACTOR labels | ownership-first wording | existing | — | existing |
| **Tab strip** | `PropertyTabs` | REFACTOR | 5→4 tabs: `estate / income / ownership / details` (ids kept stable where possible: overview→estate, income→income, holders→ownership, details→details; performance panel dissolved) | — | — | existing a11y (roving tabindex) PRESERVED |
| **Estate tab — ownership proposition** | `FundingPanel` (Primary) / `MarketSection` (Secondary) | REFACTOR | Primary: funding story leads. Secondary: market summary **demoted** below proposition; bid/ask → "best offer / best asking price" wording | existing | — | existing |
| **Estate tab — property fundamentals** | `PropertyFundamentals` | PRESERVE (move to Estate tab) | — | value / annual rent / gross yield (existing) | — | existing |
| **Estate tab — rental/income story** | NEW summary block | NEW | 3-line narrative: projected rent → "operating costs not reported" → projected distributable | `annualRentUsd` (AVAILABLE as projection); occupancy/costs/net (**UNAVAILABLE**, Audit §11) | **See Income tab** | explicit "operating costs not yet reported" line — never a net-income number |
| **Estate tab — resale block (Secondary)** | `SecondaryPerformanceCharts` | REFACTOR + **DEMOTE** | collapsed "Resale market" block: current price, best offer/asking, spread; **price/OHLC/volume charts removed from primary UX** (redesign §11) — chart moves behind an expander "Price history (simulated)" with existing disclosure | `lib/property-price.ts`, orderbook | **Acquire Resale Ownership** | empty-book state existing |
| **Income tab** | `IncomeAnalytics` | MOVE + REFACTOR | rental chart (actual vs projected visually distinct), payout history | `property-analytics.ts` incomeHistory (SIMULATED — keep disclosure) | link → `/earnings` | existing skeleton |
| **Ownership tab** | `PositionCard`, `OwnershipBanner`, `HolderAnalytics` | MOVE + COMPOSE | position snapshot (P0: ownership %, shares, current value, avg cost, free/locked) + holder analytics | mock holdings + `property-analytics.ts` (holders SIMULATED — disclosure kept) | **Manage Ownership** flows (existing sheets) | hidden-when-no-ownership (existing) |
| **Ownership tab — Owner Stay preview** | NEW | NEW (§9) | entitlement summary for owners; privilege explainer for non-owners | **UNAVAILABLE** → renders explainer-only in P0 | **View Owner Calendar** (disabled with tooltip until data exists) | honest unavailable state |
| **Details tab — trust** | `PropertyTrust` | REFACTOR | verification states + last-verified date (§10) | verification data **PARTIAL** | — | unavailable → "Verification pending" |
| **Details tab — management** | NEW line inside trust block | NEW | operating/rental partner identity | **UNAVAILABLE** | — | "Management partner: not yet published" |
| **Details tab — documents** | `PropertyDocumentsList` | PRESERVE (move to Details) | + valuation/rental-history/management/ownership-structure doc kinds when manifest provides | mock documents | download (existing error surfacing) | existing |
| **Details tab — similar** | `SimilarProperties` | PRESERVE | — | existing | → detail | existing |
| **Buy CTA** | `BuySheet` + `PropertyStickyCta` + MainButton | PRESERVE mechanics, REFACTOR step order (redesign §8): amount → shares+%+amount → projected income+assumptions → owner-stay entitlement → review → TON pay → ownership confirmation | — | existing TON flow — **transaction logic untouched** | **Secure Ownership** | existing |
| **Sell CTA** | `SellSheet` / `LimitBuySheet` | PRESERVE | — | existing | — | existing |

### 5.3 Explicitly demoted/removed from primary UX
`SecondaryPerformanceCharts` price/OHLC/volume → collapsed expander with simulated-data disclosure.
`HolderAnalytics` stays but under **Ownership** (not a market tab). No new speculative charts.

---

## 6. MY ESTATES (`/portfolio`)

Existing per Audit §7: summary, allocation, holdings (locked/free, accrued unpaid), open orders,
CSV export, NFT badge. All states present.

| UX requirement | Component action | Data | Wording (plain-language luxury) | State |
|---|---|---|---|---|
| total ownership value | REFACTOR portfolio summary hero | `lib/mock/portfolio.ts` | "Your ownership is worth X across N estates" | skeleton/empty existing |
| estate count | same hero | holdings count | — | — |
| position cards | REFACTOR holdings list → Estate Position Card | image, estate/destination, ownership %, current value, income YTD (only if paid entries exist), owner-stay availability (**UNAVAILABLE** → line hidden) | **Manage Estate** → `/property/[id]` | skeleton/empty existing |
| ownership % | NEW on card | `ownedShares/totalShares` — AVAILABLE | "You own 2.4% of this estate" | — |
| locked / free shares | REFACTOR existing block | `lib/mock/locks.ts` | "Free shares can be resold · Locked shares are committed for the lock period" | existing sheets |
| accrued income | PRESERVE accrued-unpaid display | existing | "Income accrued, paid with next distribution" | — |
| owner stay entitlement | NEW line per card | **UNAVAILABLE** (Audit §10) | hidden until data exists; NO placeholder | — |
| pending transactions | REFACTOR open-orders label | `lib/mock/orderbook.ts` | **"Pending ownership transactions"** + cancel (existing confirm sheet) | existing |
| statement / download | REFACTOR export label | existing CSV | **"Download ownership statement"** | existing error toast |
| NFT badge | PRESERVE | existing | "Collectible certificate" | existing disclaimer |

Hero CTA: **View Income** → `/earnings`. Crypto-native terms avoided everywhere (§1.2 map).

---

## 7. INCOME (`/earnings`)

Existing per Audit §8: total earnings, cumulative chart, timeline, yield summary, withdrawal flow
(1% fee, 4 installments — consistent across API/mock/UI).

### 7.1 Sections

| UX requirement | Component action | Data | Treatment |
|---|---|---|---|
| total distributed income | REFACTOR total-earnings hero | paid entries only | "Received in total" — paid money only |
| accrued income | NEW block | lock accrued-unpaid (`mockYieldSummary().accruedUnpaidUsd` — exists) | "Accrued, paid with next distribution" — clearly separated from received |
| next distribution | REFACTOR next-payout | pending entries + `nextPayoutDate` | status word **Expected** (never "guaranteed"); amount from pending entry only |
| paid history | PRESERVE timeline | entries | status **Paid** |
| income by estate | NEW (P0) | group entries by `propertyId` | per-estate rows → link to `/property/[id]`; estates with no entries simply absent |
| rental statement | NEW (P1) | gross revenue (AVAILABLE as projection), operating costs (**UNAVAILABLE**), net (**UNAVAILABLE**) | **P1 only**; renders only the revenue→distribution chain for fields that exist; missing steps render as "not yet reported" — never skipped silently, never invented |
| withdrawal | PRESERVE mechanics | `planWithdrawal` mirror | existing review: available balance, 1% fee, 4 weekly installments — wording unchanged (locked rule) |

### 7.2 Chart — REFACTOR
Monthly income bars (6/12/all). **Actual (paid) vs projected (pending) visually distinct** —
two-tone with legend. Existing cumulative line may stay as a secondary element.

### 7.3 CRITICAL — weekly/monthly conflict UX semantics [AUDIT-OVERRIDE]

Audit §11/§13: payout code pays **weekly** (Sunday schedule); locked model says **monthly
accrual**; display converts weekly ×52/12. This is NOT resolved in Phase 9 code. UI rules until
formal resolution:

1. **Never show a frequency claim that is not authoritative.** No "weekly income", no "monthly
   payout" as a *promise*. Amounts carry a status word only: **Paid / Accrued / Expected**.
2. The `/ month` presentation conversion (A4, `payout-display.ts`) stays — it is the documented
   display contract — but is always attached to the word **"Expected"** or **"projected"**, never
   to a paid event.
3. Paid events show the **actual paid amount and its actual date** — no period label beyond the
   entry's own `weekOf`/date.
4. No APY as hero metric (redesign §10): hero = received total + next expected.
5. Any tooltip/help text states: "Distribution schedule is being aligned with the monthly income
   model" — one honest line, no math shown to the user.
6. Withdrawal copy stays exactly: 1% fee, 4 weekly installments (this "weekly" is locked and
   correct — installment context, Audit A4).

---

## 8. RESALE (surface, not a route)

Current implementation (Audit §9): MarketSection (price/bid/ask/spread/fills), orderbook mock,
BuySheet→TON→`settleVerifiedBuy`, SellSheet (−7% instant buyback with review), limit orders,
cancel-with-confirm, locked-share restrictions, single price source.

### 8.1 UX definition — "private ownership transfer market"

| Element | Action | Treatment |
|---|---|---|
| current estate price | PRESERVE `lib/property-price.ts` single source | "Current ownership value per share" |
| available shares | PRESERVE orderbook depth | "Shares offered by co-owners" |
| bid | REFACTOR label | **"Best offer"** — demoted below asking price |
| ask | REFACTOR label | **"Best asking price"** — leads |
| spread | REFACTOR | shown only when both sides exist (existing rule) |
| buy | PRESERVE BuySheet/TON flow | entry: Estates filter `Resale`, Estate Detail hero, resale block |
| sell | PRESERVE SellSheet | entry: My Estates position card "Resell ownership"; free shares only |
| limit order | PRESERVE LimitBuySheet | framed as "Offer your price — matched when a co-owner accepts" |
| pending order | PRESERVE | label "Pending ownership transaction" (My Estates §6) |
| locked-share restriction | PRESERVE `lib/mock/locks.ts` | "Locked shares cannot be offered until the lock period ends" |

### 8.2 Demoted / removed from primary UX
- `SecondaryPerformanceCharts` price/OHLC/volume → collapsed "Price history (simulated)" expander
  on Estate Detail resale block. **Removed from the default scroll.**
- Recent fills list → moved inside the same expander.
- No new price charts anywhere. No orderbook depth visualization on Estates cards.

### 8.3 Resale card (Estates filter `Resale`)
image, estate name, ownership offered (shares), asking price, acquisition reference when
appropriate, income YTD/history when available, owner-stay rights (hidden until data exists),
verified-ownership state (existing NFT/verification badge).

---

## 9. OWNER STAY — minimum viable UX (zero code exists, Audit §10)

**P0 principle:** Owner Stay renders as an **ownership privilege attached to an estate**, not a
booking engine. No availability engine, no payments, no inventory system.

### 9.1 Surfaces (all inside existing screens — no new route)

| Surface | Component | NEW vs reusable |
|---|---|---|
| entitlement summary | `OwnerStayCard` — **NEW** (`src/components/stay/OwnerStayCard.tsx`) | NEW component; reuses `Block`, format helpers, i18n |
| request stay | `OwnerStayRequestSheet` — **NEW** (built on existing `Sheet` + `ConfirmActionSheet` patterns) | NEW; reuses sheet registry/haptics |
| stay history + request status | rows inside `OwnerStayCard` | NEW list, existing row/list styling |
| calendar | **P1** — only after entitlement/blackout data model exists | NEW |
| concierge/services | **P1** static list inside request sheet (chef/transfer/yacht/spa/driver) — request-only, no marketplace | NEW static |

### 9.2 Fields and honest states

| Field | Data today | P0 treatment |
|---|---|---|
| entitlement summary (annual nights) | UNAVAILABLE | card hidden for non-owners; for owners: explainer copy + "Entitlement details will appear once your estate's stay program is published" |
| available nights | UNAVAILABLE | — (no number rendered) |
| blackout dates | UNAVAILABLE | mentioned in rules text as concept, no dates listed |
| request stay | UNAVAILABLE backend | button renders **disabled** with tooltip "Stay requests open with your estate's stay program" — visible, honest, non-functional in P0 |
| stay history | UNAVAILABLE | empty state "No stays yet" only when entitlement data exists |
| request status | UNAVAILABLE | states defined now (Requested / Confirmed / Declined) for API contract, UI renders only when data exists |

### 9.3 What must be NEW vs reusable (exact)
- NEW: `OwnerStayCard`, `OwnerStayRequestSheet`, `stay` i18n namespace, stay entitlement TypeScript
  types (`src/types/stay.ts`), mock stay repo stub returning empty/unavailable.
- REUSABLE: `Block`, `Sheet`/`ConfirmActionSheet` + registry, haptics, toast, `PropertyCard` mini
  variant (stay chip), skeleton patterns.
- NOT built in P0: calendar grid, availability engine, concierge booking, payments.

---

## 10. TRUST SYSTEM

Per-estate trust information and progressive disclosure (summary → details → documents), styled as
quiet provenance, **not a compliance dashboard**.

| Trust item | Data today | Source | UI treatment |
|---|---|---|---|
| ownership structure | PARTIAL (holder buckets SIMULATED; ownership-structure doc kind absent) | `property-analytics.ts` + documents | summary chip "Co-owned by N holders" → Ownership tab → doc when present |
| valuation | AVAILABLE (manifest `valuationUsd` → `totalValueUsd`) | seed/DB | "Valuation: $X (verified YYYY-MM-DD when date exists)" |
| rental history | PARTIAL (annualRent projection AVAILABLE; actual payment history SIMULATED in analytics; mock rentalHistory empty in production seed) | manifest + analytics | "Projected annual rent" with disclosure; actual history only when real entries exist |
| management | UNAVAILABLE | — | "Professional management — partner to be announced" |
| verification status | PARTIAL (`TrustSection` exists; states+date absent) | refactor target | chip states: Verified (date) / Pending / Unverified-unknown (hidden) |
| last verified date | UNAVAILABLE | needs data model | rendered only when present |
| documents | PARTIAL (mock docs exist; valuation/rental/management/ownership kinds absent) | `lib/mock/documents.ts` | Details tab, existing download flow |
| TON transaction verification | AVAILABLE (real `settleVerifiedBuy`) | API | existing NFT/tx verification badges — PRESERVE |

**Progressive disclosure:** Estate tab = one trust chip + one line. Ownership/Details tabs =
expanded cards. Documents = full list. No checkmark walls, no percentages-of-compliance, no badges
grids.

---

## 11. Luxury UX Rules (concrete)

- **Hierarchy:** property identity first (photo, name, place) → ownership proposition → numbers.
  One dominant CTA per screen; secondary actions are text links.
- **Density:** airy. Max ~2 metric rows per card; sections separated by whitespace, not boxes-in-boxes.
- **Typography:** existing system-font stack (Telegram-native rule). Serif-free; numbers in
  `tnum` tabular figures; hero numbers ≤ 2.5rem (existing hero scale), labels 10–13px muted.
- **Numbers:** integer money via `usd()`; never raw cents; percentages via `pct()`; no decimals
  beyond existing helpers; projected values always suffixed (Expected/projected) and never styled
  identically to paid values (muted vs success color).
- **Cards:** flat blocks (existing `Block`), hairline separators, NO drop shadows (design rule),
  radius 12px, photography as the luxury signal — image area ≥ 40% of card.
- **CTA language:** "Acquire Ownership", "View Estate", "Manage Ownership", "Request Stay",
  "Resell Ownership", "Download ownership statement". Banned: Buy Now, Trade, Swap, Claim, Harvest,
  Stake, APY-max, "Limited time".
- **Badges:** max 2 per card (status + verification). Owner-stay chip only with real data.
  No scarcity/FOMO badges (non-goal §14).
- **Charts:** muted Telegram-blue only; green/red strictly for paid/up vs pending/down finance
  semantics; every chart carries actual-vs-projected distinction and simulated-data disclosure
  where the dataset is simulated. No candlesticks above the fold; no volume bars on primary surfaces.
- **Whitespace:** section spacing ≥ 20px; page bottom clearance per UI-polish #08 (96px + 88px
  AppShell inset — do not regress).
- **Motion:** existing 180ms `dh-page-in`, `active:scale` presses, reduced-motion honored. No
  parallax, no shimmer beyond existing skeletons, no count-up animations on money.
- **Telegram constraints:** 480px first, safe-area aware, no horizontal scroll, BackButton sheet
  registry untouched, MainButton carries screen-primary actions, haptics on tab/CTA.

---

## 12. Component Mapping Matrix

| Phase 9 area | Existing component | File | Action | New component | Data required |
|---|---|---|---|---|---|
| Shell/tabs | `BottomTabBar` | `src/components/layout/BottomTabBar.tsx` | REFACTOR (labels/icons) | — | i18n `tabs.*` |
| Shell | `AppShell`, sheets, toasts | `src/components/layout/*`, `src/components/common/*` | PRESERVE | — | — |
| Home hero | Portfolio value hero | `src/components/home/*` | REFACTOR | — | portfolio summary |
| Home next dist | Next payout | `src/components/home/*` | REFACTOR | — | earnings pending entries |
| Home preview | My properties list | `src/components/home/*` | REFACTOR | — | holdings |
| Home featured | Featured property | `src/components/home/*`, `src/lib/home-featured.ts` | REFACTOR | — | listings + featured picker |
| Home trust | Trust footer | `src/components/home/*` | REFACTOR (copy) | — | static |
| Estates header/filters | marketplace page + `marketplace-filter.ts` | `src/app/(app)/marketplace/`, `src/lib/marketplace-filter.ts` | REFACTOR | — | listings |
| Estate card | `PropertyCard` | `src/components/property/PropertyCard.tsx` | REFACTOR | — | listing + verification chip data |
| Detail gallery | `PropertyGallery` | `src/components/property/PropertyGallery.tsx` | PRESERVE | — | images |
| Detail hero | `PropertyHero` | `src/components/property/PropertyHero.tsx` | REFACTOR | — | listing, verification |
| Detail KPI | `PropertyMetricsGrid` | `src/components/property/PropertyMetricsGrid.tsx` | REFACTOR | — | listing, price |
| Detail tabs | `PropertyTabs` | `src/components/property/PropertyTabs.tsx` | REFACTOR (5→4) | — | — |
| Detail compose | `PropertyDetail` | `src/components/property/PropertyDetail.tsx` | REFACTOR (panel regroup) | — | — |
| Funding story | `FundingPanel`, `FundingBar` | `src/components/property/FundingPanel.tsx`, `FundingBar.tsx` | PRESERVE (move to Estate tab) | — | listing |
| Fundamentals | `PropertyFundamentals` | `src/components/property/PropertyFundamentals.tsx` | PRESERVE (move) | — | listing |
| Rental story | — | — | — | `RentalStoryBlock` (NEW) | annualRent; costs UNAVAILABLE state |
| Income tab | `IncomeAnalytics` | `src/components/property/IncomeAnalytics.tsx` | MOVE + REFACTOR | — | incomeHistory (SIMULATED) |
| Ownership tab | `PositionCard`, `OwnershipBanner`, `HolderAnalytics` | `src/components/property/PositionCard.tsx`, `OwnershipBanner.tsx`, `HolderAnalytics.tsx` | MOVE + COMPOSE | — | holdings, holder datasets (SIMULATED) |
| Resale demote | `SecondaryPerformanceCharts`, `RecentTrades`, `OrderBook` | `src/components/property/SecondaryPerformanceCharts.tsx`, `RecentTrades.tsx`, `OrderBook.tsx` | REFACTOR (expander) / MOVE | — | price history (SIMULATED), orderbook |
| Primary charts | `PrimaryPerformanceCharts` | `src/components/property/PrimaryPerformanceCharts.tsx` | MOVE (→ Estate tab) | — | fundingHistory (SIMULATED) |
| Trust | `PropertyTrust` | `src/components/property/PropertyTrust.tsx` | REFACTOR | — | verification (PARTIAL) |
| Documents | `PropertyDocumentsList` | `src/components/documents/PropertyDocumentsList.tsx` | PRESERVE | — | documents (PARTIAL) |
| Similar | `SimilarProperties` | `src/components/property/SimilarProperties.tsx` | PRESERVE | — | listings |
| Buy/sell | `BuySheet`, `SellSheet`, `LimitBuySheet`, `LockSheet`, `PropertyStickyCta` | `src/components/property/*` | PRESERVE (CTA copy REFACTOR) | — | TON flow untouched |
| Market | `MarketSection` | `src/components/property/MarketSection.tsx` | REFACTOR (labels, position) | — | price source |
| My Estates | portfolio components | `src/components/portfolio/*` | REFACTOR | — | holdings, orders |
| Income page | earnings components, `earnings-stats.ts`, `payout-display.ts` | `src/components/earnings/*`, `src/lib/*` | REFACTOR | `IncomeByEstate` (NEW) | entries |
| Owner Stay | — | — | — | `OwnerStayCard`, `OwnerStayRequestSheet` (NEW) | UNAVAILABLE → explainer states |
| Legacy | `PerformanceChart` | `src/components/property/PerformanceChart.tsx` | REMOVE from imports (file may stay on disk) | — | — |

---

## 13. Data Availability Matrix

| UX requirement | Data exists? | Source | Reliable? | UI treatment |
|---|---|---|---|---|
| estate identity/imagery | AVAILABLE | manifest seed → `properties` / mock fixtures | yes (production manifest) | render |
| share price | AVAILABLE | `lib/property-price.ts` single source | yes | render |
| total shares / ownership fraction | AVAILABLE | listing | yes | render |
| primary vs resale status | AVAILABLE | listing.status | yes | render |
| availability (shares remaining) | AVAILABLE | listing | yes | render |
| valuation | AVAILABLE | `totalValueUsd` (manifest) | yes | render |
| projected annual rent | AVAILABLE (as projection) | `annualRentUsd` | yes, labeled projection | render with "projected" |
| projected net yield | AVAILABLE (as projection) | `projectedNetYield` / `yield-math` | derivation differs API vs `property-analytics` (Audit flag) | render once per surface, labeled |
| **occupancy** | **UNAVAILABLE** | — | — | "Not yet reported" — never a number |
| **operating costs** | **UNAVAILABLE** | — | — | "Not yet reported" — never a number |
| **net distributable income** | **UNAVAILABLE** | — | — | "Not yet reported" — never a number |
| historical monthly rental metrics | SIMULATED | `property-analytics.ts` incomeHistory | deterministic but synthetic | render with existing simulated disclosure |
| paid distributions (user) | PARTIAL | mock earnings (dev) / API payout tables (prod) | mock in dev | render; paid vs pending distinct |
| payout schedule | **CONFLICTING** | weekly code vs monthly locked model | documented conflict | §7.3 rules: status words only, no frequency promises |
| verification states + last-verified date | PARTIAL | `TrustSection` (no states/date) | — | chip only when data present |
| management partner | UNAVAILABLE | — | — | "partner to be announced" |
| ownership distribution | SIMULATED | `property-analytics.ts` holder buckets | synthetic, totals exact | render with disclosure |
| user position (shares/value/cost/locked/free) | AVAILABLE | holdings repo / mock | yes in contract | render |
| accrued unpaid income | AVAILABLE | locks state | yes | render |
| owner-stay entitlement/usage/blackout | **UNAVAILABLE** | — (zero implementation, Audit §10) | — | explainer-only; no numbers, disabled CTA |
| concierge services | UNAVAILABLE | — | — | P1 static list, request-only |
| documents (valuation/rental/management/ownership) | PARTIAL | mock documents | demo | render what exists; absent kinds not listed |
| TON tx verification | AVAILABLE | `settleVerifiedBuy` + NFT badges | yes (real pipeline) | render |

---

## 14. Dependency Map

Format: Screen → component → data source → API/DB requirement → business rule. **P0** = blocks
Phase 9 core.

- **Home** → hero/next-dist/featured → portfolio+earnings repos → none beyond current mocks →
  monthly-accrual wording rule. *(P0, reuse ~90%)*
- **Estates** → `PropertyCard`+filter → marketplace repo → none → no-fabricated-income rule
  ("Data pending" state). *(P0)*
- **Estate Detail** → `PropertyDetail` regroup → listings + holdings + analytics + orderbook →
  none new for P0 → Primary-no-price-chart rule; simulated disclosures. *(P0)*
  - **[P0] Verification states + last-verified date** → needs 2–3 fields on listing/meta (data
    model extension) — otherwise trust chips stay hidden.
  - **[P0] Owner Stay types + mock stub** → `src/types/stay.ts` + empty mock repo — otherwise
    Owner Stay surfaces cannot render honest states.
  - **[P1] Rental economics fields** (occupancy/costs/net) → DB/model extension — BLOCKED on
    business decision; UI ships "Not yet reported" until then.
- **My Estates** → portfolio components → holdings+orders repos → none → locked/free plain-language
  rule. *(P0)*
- **Income** → earnings components → earnings+withdrawals repos → none → **[P0] §7.3
  conflict-semantics rules**; withdrawal 1%/4-installment locked rule. *(P0)*
- **Resale** → existing sheets + `MarketSection` → orderbook + price source → none → locked-shares
  rule; no-speculative-charts rule. *(P0, mostly label/position work)*
- **Owner Stay** → NEW `OwnerStayCard`/sheet → stay types + mock stub (P0) → real entitlement API
  (P1, BLOCKED on business design) → no-guaranteed-booking wording. *(P0 shell / P1 data)*
- **Trust layer** → `PropertyTrust` refactor → verification fields (P0 data-model extension) →
  documents kinds (P1). *(P0 UI / P0 minimal data)*

**P0 dependency chain:** verification fields + stay types/mock + §7.3 display rules must land
*before or with* the screen refactors that consume them.

---

## 15. Final Recommendations

### KEEP
- All routes; AppShell/BottomTabBar mechanics; sheets system + BackButton registry; TON
  buy/settlement/sell/limit/withdraw mechanics; 24-property manifest contract; i18n parity
  tooling; simulated-data disclosures; whole-card navigation (no per-card Buy).

### CHANGE
- Tab labels/icons (`Estates/Income/My Estates`); Property Detail 5→4 tabs with panel regroup;
  hero CTA states; marketplace filters/sort (Curated default); card metric labels + verification
  chip; portfolio/earnings visible language to ownership/income vocabulary; resale demotion
  (charts → expander); trust copy + chip.

### NEW
- `RentalStoryBlock` (Estate tab); `IncomeByEstate` (Income page); `OwnerStayCard` +
  `OwnerStayRequestSheet` + `src/types/stay.ts` + stay mock stub; verification-state fields +
  last-verified date (data model); "Data pending / Not yet reported" premium states.

### BLOCKED
- Rental economics actuals (occupancy, operating costs, net distributable income) — no data
  anywhere (Audit §11); needs business decision + data model before any UI shows them.
- Real Owner Stay entitlement/availability/blackout data — needs backend design (P1).
- Weekly-vs-monthly payout conflict resolution — locked rule says document, never fix in Phase 9.
- Any per-estate "value change %" on Home — no trustworthy baseline series.

## Recommended implementation sequence

| Rank | Screen/slice | Why this order (importance · dependency · reuse · risk · visual impact) |
|---|---|---|
| 1 | **Estate Detail** (tabs 5→4 + hero CTA states + resale demotion + trust chip) | highest product importance · depends only on verification fields · ~80% reuse · medium risk (panel regroup) · biggest visual impact |
| 2 | **Data-model P0 slice** (verification fields + stay types/mock + §7.3 display helpers) | unblocks 1, 3–6; tiny; must precede screens per §14 |
| 3 | **Home** | first touchpoint · high reuse (~90%) · low risk · high visual impact |
| 4 | **Estates** | discovery funnel · high reuse · low risk (filters/sort/labels) |
| 5 | **Income** | money truthfulness · medium reuse · low-medium risk (conflict semantics) |
| 6 | **My Estates** | management surface · high reuse · low risk |
| 7 | **Resale polish** (labels + demotion completion) | mostly done inside #1 · low risk |
| 8 | **Owner Stay P0 shell** | zero code today · explainer-only states · high differentiation value |
| 9 | **Trust layer deepening** (docs kinds, management identity) | P1 data-dependent |

---

## 16. Acceptance Criteria (per screen — future coding-agent tasks)

**Global**
- G1 `npm run check` + full test suite green after each screen slice; no new dependencies.
- G2 No changes to payment/settlement/TON/lock/yield math (diff review confirms).
- G3 All new user-facing strings mirrored across 12 locales (parity tooling passes).
- G4 Loading/empty/error states exist for every new/changed section; 480×840 verified; no
  horizontal scroll; bottom clearance per UI-polish #08 preserved.

**Home**
- H1 Hero shows ownership value + estate count from repo; CTA "View My Estates" → `/portfolio`.
- H2 Next-distribution block shows only Paid/Accrued/Expected wording; no frequency promise; hidden
  when no data.
- H3 Featured card shows projected income only from existing yield math, else "Data pending".
- H4 Empty-ownership state offers "Explore Estates" → `/marketplace`.

**Estates**
- E1 Filters exactly: All/Featured/New/Income/Owner Stay/Resale; default sort Curated.
- E2 Cards show price + ownership fraction; income metric renders value or "Data pending" — never 0/fabricated.
- E3 Owner Stay filter with no data shows honest empty state; no fake matches.
- E4 Whole-card navigation only; no per-card Buy.

**Estate Detail**
- D1 Exactly 4 tabs: Estate/Income/Ownership/Details; a11y (roving tabindex) preserved.
- D2 Hero CTA matches state: Acquire Ownership / Manage Ownership / Acquire Resale Ownership /
  View Resale Opportunities (sold-out).
- D3 Price/OHLC/volume charts not in default scroll; expander carries simulated disclosure.
- D4 Primary never renders a price chart (regression test kept green).
- D5 Rental story shows "Not yet reported" for costs/net — asserted by test.
- D6 Owner Stay block: explainer for non-owners; disabled request CTA with tooltip; no fabricated
  nights.
- D7 Buy flow step order per redesign §8; TON logic untouched (diff-verified); success screen
  celebrates ownership.
- D8 Trust chip states Verified(date)/Pending/hidden; no compliance-dashboard styling.

**My Estates**
- M1 Hero: ownership value + estate count; CTA "View Income".
- M2 Position cards: image, ownership %, value, locked/free plain-language copy.
- M3 Open orders labeled "Pending ownership transactions"; export labeled "Download ownership
  statement"; cancel confirm preserved.

**Income**
- I1 Hero = received total + next expected; no APY hero.
- I2 Chart distinguishes paid vs projected visually + legend.
- I3 Income-by-estate rows link to `/property/[id]`.
- I4 Withdrawal review unchanged: balance, 1% fee, 4 weekly installments.
- I5 No weekly/monthly frequency claim anywhere except installment context (grep-testable).

**Resale**
- R1 Labels: Resale / asking price / best offer; no "trading/exchange" strings (grep-testable).
- R2 Sell flow restricted to free shares (existing rule test stays green).
- R3 Limit order + cancel confirmations preserved.

**Owner Stay**
- O1 Owner Stay visible on Estate Detail + My Estates card slot + Home (when entitled).
- O2 Request CTA disabled with honest tooltip while data unavailable; no booking engine UI.
- O3 Request sheet (when enabled) follows dates→guests→services→review→Request Stay; confirmation
  states request ≠ guaranteed booking.

**Trust**
- T1 Progressive disclosure: chip → tab card → documents; no more than 2 badges per surface.
- T2 Simulated datasets keep disclosures everywhere they render.

---

## Verification footer (planning-only compliance)

- Allowed change: creation of this file only.
- Source code, routes, components, APIs, schema, business logic, calculations, translations: untouched.
- Git status at time of writing: only `docs/product/phase-9/*` untracked/modified.
- HEAD at time of writing: `69d77f69b068bf6ce92433aff8f25f1f2a48d809`
  (`docs(phase9): add trackable implementation plan`).
