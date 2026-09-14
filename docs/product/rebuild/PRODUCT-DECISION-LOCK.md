# FractionalLuxe — Product Decision Lock & Source-of-Truth Reconciliation

Status: PRODUCT RECORD · 2026-09-11
Scope: Locks decisions A–F below and records the source-of-truth hierarchy (Tier 1–4).
Rule: this document constrains labels, docs, and presentation. It never changes
payment/settlement math, valuations, or economic assumptions — those change only
with explicit Product Owner evidence.

Related: `ESTATE-DATA-CONTRACT.md` (semantic ownership), `ESTATE-MARKETING-FUNNEL.md`
(placement), `ESTATE-ECONOMICS-DESIGN-CONTRACT.md` (V1 model), `ESTATE-24-DATA.json`
(canonical registry), `ECONOMIC-PHILOSOPHY-PRODUCT-TRUTH.md` (rebuild truth),
`.agent/context/BUSINESS-RULES.md` (rebuild authority).

---

## 1. Source-of-truth hierarchy (binding)

### Tier 1 — Rental Escapes identity authority
Authoritative for: property name, location, listing identity/ID, nightly rental rate
(display + rate type), images, source URL. Implementation: `ESTATE-24-DATA.json`
records (24, listingIds 128862…122113) → `src/lib/economics/estates/estate-24-data.ts`
→ marketplace view model (`marketplace-view-model.ts`: name/location/nightly verbatim)
and property-page canonical name. Never overwritten by fixtures or research.

### Tier 2 — FractionalLuxe canonical economic layer
`ESTATE-24-DATA.json` (+ `financial-model-v1-inputs.ts` V1 inputs) is canonical for:
valuation estimates, ANR/modeled revenue, cost/tax model inputs, per-share economics,
provenance, confidence, conflict records. Every non-observed value carries
OBSERVED / ESTIMATED / DERIVED / CONFLICTED / UNKNOWN (or calculated/projected in
the V1 engine, which maps onto the same honesty contract). UI consumes V1 through
`EstateV1Thesis` / `IncomeV1Story` / `EstateInvestmentPanel` / `OwnershipV1Panel` only.

### Tier 3 — Research dataset (evidence only)
`research/24-PROPERTY-RESEARCH-DATASET.md` supports validation. It must never
silently overwrite Tier 1/2, and its ranges/starting-prices/seasonal notes must
never render as verified facts. Growth Potential surfaces research-range uppers
as ESTIMATED with provenance badges.

### Tier 4 — Legacy and mock (non-authoritative)
`src/lib/mock/seed/properties.ts` (`prop-*` fixtures), old titles/descriptions,
fixture economics, `docs/legal/how-yield-works.md`, runbooks. Retained for
tests/demo tape. Must never become user-facing source data where Tier 1/2 exists.
Known live Tier-4 paths are listed in §3 and remain BLOCKED for removal until the
trading-tape migration is approved (they drive Buy/Lock/Earnings settlement mocks).

## 2. Decisions locked and where each is enforced

### A. Monthly profit communication
Profit is calculated and communicated MONTHLY. Four weekly transfers (if used) are a
payment schedule, never "weekly profit". Banned: weekly profit / weekly yield /
guaranteed weekly income. Enforced in:
- `src/lib/onboarding-slides.ts` slide 2 ("every month" + "monthly share").
- Buy flow (`BuyQtyStep.tsx`, `BuySummaryStep.tsx`): `estMonthlyYield`
  ("Projected income / month" × 12 locales), A4 weekly×52/12 conversion — the same
  figure as estate cards and the lock preview.
- `PAYOUT_DISCLAIMER` ("simulated monthly payout · on-chain verifiable post-MVP"),
  `trustFooter` (monthly accrual), V1 per-share monthly (annual ÷ 12, `incomeV1PerMonth`).
- `src/lib/property-yield.ts` header: weekly rate is legacy display only.

### B. 1% deduction framing
The withdrawal 1% fee ("1% fee · 4 weekly installments", `withdrawalTerms` × 12) is
charged at request time; installments describe schedule, not frequency. The separate
legacy weekly display rate (−1pp) is disclosed in buy assumptions
(`onLockedSharesNote`, `payoutPeriodWeeklyHint`) and MUST NOT be presented as the
withdrawal fee. The exact legal/accounting meaning of the 1% is still ambiguous —
see §4.7. No label may present the 1% as hidden loss/weekly yield.

### C. Economic share vs legal ownership
Holdings DB record = the user's economic position. NFT = display-only collectible
receipt (`types/nft.ts`, `nftDisclaimer`: "database remains the record of ownership").
Banned: legal ownership / deed / property title / direct real-estate title for the
NFT. No SPV/trust/nominee wrapper exists in copy or code — legal structure stays
with Rental Escapes + qualified advisers (see §4.8).

### D. $100 primary base price
Base = valuation ÷ 100, communicated as "$100 base price per share at the primary
offering" (`ownershipV1NominalNote` × 12 locales, next to the Ownership price row).
Secondary price is separate/demand-driven (`getCurrentSharePrice` hierarchy:
primary offer → best ask → last trade → list fallback; ResaleBlock market UI).
Generic entry claims aligned to $100 (onboarding subtitle, portfolio emptyMessage).
No guarantee / no permanent-price / no 100-legal-units implications (see KnowBody).

### E. Demo honesty
Single discreet DEMO system: floating `DemoModeBadge` ("Demo mode", toggleable),
`DEMO_TX_DISCLAIMER` (buy success, earnings rows, About/Legal), "simulated" badges
on paid rows with synthetic hashes, "(simulated)" price history, pending-state
honesty (holders, verification, management partner, owner stay). No fake users,
trades-as-real, payouts-as-history, partnerships, or performance history.

### F. White-label-ready, no implied partnership
Architecture stays layered (UI → hooks → api/ton → types; V1 engine pure) so the
platform is transferable to Rental Escapes or another qualified operator. No UI,
doc, or test claims a confirmed partnership, commission, revenue-share,
integration, or endorsement. External listing links (Reserve Villa CTA) are source
attribution, not partnership.

## 3. Reconciliation findings (2026-09-11 audit)

1. **ESTATE-24-DATA.md has no file** — only `ESTATE-24-DATA.json` exists (24 records
   verified: ids 1–24, listingIds match the research dataset). The JSON is canonical;
   the missing MD companion is recorded here instead of fabricated.
2. **Tier-4 fixture leakage (live, accepted as demo tape):** `prop-*` titles/locations
   still feed Home chips, portfolio names, earnings by-estate names, Buy/Lock sheets,
   and fixture descriptions/propertyType ("Apartment" for villas) survive where no
   canonical fallback is wired. Marketplace cards + property top bar + About use
   Tier 1/2. Full cutover is BLOCKED on the trading-tape migration (PO decision §4.1).
3. **Dual share systems:** V1 fractionalization (valuation ÷ $100; Grand = 80,000 @
   $100) vs fixture trading supply (600–2,500 shares @ $85–$150; Grand = 2,500 @
   $100 = $250k offering vs $8M valuation). V1 panels never consume fixture counts
   (`scalePosition` guards); Buy/Lock still trade fixture supply. Reconciliation of
   the two supplies is a PO decision (§4.2).
4. **Weekly-profit framings fixed this session:** onboarding slide 2, buy-sheet
   `estWeeklyYield` → `estMonthlyYield` (both steps, 12 locales), yield-math header.
5. **Settlement-schedule weekly strings kept deliberately** (Sunday payout cadence is
   live settlement behavior per PROGRAM A4 note; changing copy would misrepresent it):
   lock payout-period selector, `accruingWeekly`/`perWeek`, earnings history cadence
   (`thisWeek`, `chartTitle` "Last 12 weeks", streaks), `buySuccessEverySunday`,
   `pendingThisWeek`. The lock weekly-vs-monthly payout model itself needs PO
   resolution (§4.3).
6. **1% ambiguity documented, not relabeled** (§4.7): lock weekly −1pp display rate vs
   withdrawal 1% fee are distinct mechanics sharing one number.
7. **NFT language clean:** no deed/title/legal-ownership claims in UI, types, or
   `docs/research/NFT.md` (only pre-existing aspirational persona copy in
   `docs/research/USER_FLOW.md:79` — Tier-4 research doc, not user-facing).
8. **$100 framing fixed this session** (`ownershipV1NominalNote`); fixture $85–$150
   trading prices + legacy $80 entry claims: entry claims aligned to $100, fixture
   prices remain demo tape (§4.2).
9. **Demo disclosure intact:** badge + disclaimers + simulated labels + pending states
   all present; nothing added that fabricates history.
10. **No partnership claims** in UI/docs/tests; white-label direction is architectural.
11. **Provenance intact + repaired:** V1 provenance badges, ANR method, excluded-charge
    disclosure, tax/reserve/projection notes, JSON conflict + consolidation records.
    This session repaired cp1256-mojibake in 5 EN-mirrored V1 keys × 11 locales
    (em-dash/÷ rendered as `â€"`/`أ·`); byte-verified clean.

## 4. Remaining decisions requiring Product Owner approval (do NOT guess)

1. **Trading-tape migration:** when `prop-*` fixtures stop feeding Buy/Lock/Portfolio/
   Earnings and what the live supply source becomes.
2. **Share-supply reconciliation:** V1 (valuation ÷ $100) vs fixture supplies/offers;
   real primary offering sizes and per-estate (or flat-$100) pricing.
3. **Lock payout model:** keep/retire the weekly payout-period option (rate −1pp) vs
   pure monthly accrual + withdrawal-installments; what existing weekly locks mean.
4. **$80→$100 entry alignment confirm:** generic entry claims now say $100 per
   Decision D; confirm no $80 offering exists (fixtures min $85).
5. **ESTATE-24-DATA.md companion:** whether to generate a human-readable registry
   from the JSON (this record stands in until then).
6. **Secondary-market mechanics:** matching/liquidity guarantees (UI promises none —
   keep it that way until specified).
7. **Legal/accounting meaning of the 1%** (fee vs withholding vs reserve) and the
   legal ownership wrapper (SPV/trust/nominee) — with qualified advisers, not in code.
8. **Owner Stay economics, fee schedule beyond commission tiers, valuation
   methodology** — per `ECONOMIC-PHILOSOPHY-PRODUCT-TRUTH.md` §19 open decisions.

## 5. Change log (this session; labels/docs only — no logic, math, or settlement changes)

- `src/lib/onboarding-slides.ts` + test: monthly slide 2, $100 entry.
- `BuyQtyStep.tsx` / `BuySummaryStep.tsx` + `BuyFlow.test.tsx`: monthly projection.
- `src/lib/property-yield.ts`: header/comment honesty clarification (math untouched).
- `messages/*.json` (12): `estMonthlyYield`, $100 entry strings, Decision-D nominal
  note, mojibake repair (byte-verified, JSON-validated, key-parity preserved).
- This file: hierarchy + lock record.
- `FRACTIONALLUXE-PROGRAM.md`: progress entry (no phase checkboxes touched —
  no program step names this reconciliation).

Verification: targeted vitest → full `vitest run` → `npm run check`
(lint + typecheck + build); 24-record JSON validation; byte-level locale checks;
480×840 review of touched surfaces. Results in the session report.

---

## 6. Final PO Decisions application record (2026-09-11, Decisions 1–8)

Supersedes the blockers in §4.1–§4.4: the trading-tape migration, supply
reconciliation, lock payout model, and $100 entry confirmation are now DECIDED
and implemented below. Legal/accounting classification of the 1% (§4.7) and the
legal ownership wrapper remain reserved for advisers (neutral wording kept).

### Canonical supply + base price (Decisions 1–2)
- Formula: `Total shares = valuation ÷ $100`; `$100 base/share (primary)`.
  Grand: $8,000,000 → 80,000 shares. Enforced by the single source
  `src/lib/economics/canonical-offering.ts` (`CANONICAL_BASE_PRICE_USD`,
  `getCanonicalOffering` over V1 approved valuations — all 24 covered).
- Mock boundary `src/lib/mock/canonical-listing.ts` canonicalizes every listing
  served to UI (Tier-1 identity + V1 supply/price; fixture seed never mutated).
  Fixture 2,500 / 600–2,500 / $85–$150 values no longer reach any user surface.
- Sold/remaining/progress have no canonical ledger: derived live from the demo
  ownership ledger (`demoSoldShares`), i.e. real demo facts under the DEMO
  disclosure — e.g. Grand 0/80,000 until demo buys land.
- Buy executes at $100 (`confirmBuy` canonical value/ratio; page/BuySheet already
  price from `getCurrentSharePrice` → $100 primary). Instant sell buys back at
  $100 − 7% (`MockSellsRepo`); fixture property mutation removed.
- Seed holdings re-based to $100 cost/value with canonical ratios
  (Bayside 160/120,000; Alfama 200/250,000); pending amounts stay
  weekly-settlement tape, monthly-labeled at render.

### Monthly model + lock (Decisions 3–4)
- All user-facing income projections use the FULL monthly rate
  (`projectedMonthlyIncomeUsd`, `shareMonthlyYieldUsd`, `positionYieldUsd.monthlyUsd`
  in cards/featured/buy). The legacy −1pp weekly rate survives only for preserved
  weekly records + their settlement math (`property-yield.ts` docs).
- `LockSheet` is monthly-only (selector + weekly preview removed; creation sends
  `"monthly"`). Mock `create()` coerces any legacy `"weekly"` request to monthly
  (migration compatibility, documented). Seed lock is monthly.
- Historical weekly records preserved untouched; UI labels them `Legacy`
  (`legacyTag` × 12) in `YieldLockSection`. `PayoutPeriod` union kept for history.

### 1% separation (Decision 5)
- `yield-math.ts LEGACY_WEEKLY_RATE_PENALTY_PP` (lock display adjustment, legacy
  weekly records only) vs `mock/withdrawals.ts WITHDRAWAL_FEE_BPS` (withdrawal
  fee, neutral wording, 4 installments) — distinct names, fields, labels, docs.
  No cross-use (verified by search). Withdrawal flow copy unchanged (already
  neutral); legal classification reserved.

### Fixture migration + secondary honesty (Decisions 6–7)
- Migrated: marketplace cards (view model + repo), home chips/cards (repo),
  portfolio/CSV/names (repo + `exportCsv`), earnings names (already canonical),
  buy/lock sheets (repo + monthly), ownership/investment/hero/metrics/trust
  (repo + V1), NFT titles (canonical identity), similar-properties (already).
- Status values (`funding/funded/resale`) remain as demo SCENARIO state (which
  flow opens); all NUMBERS shown are canonical/ledger. `bannerCoOwned`
  ("Fully funded") removed — non-primary banner is always "Resale market".
  `PropertyTrust` sold-row renders only when ledger sold > 0.
- Secondary demo tape (order book, synthetic fills, limit/sell sheets) isolated:
  never feeds primary numbers (page-wide price stays $100 primary), internally
  marked demo throughout, plus a visible `demoOrderBookNote` caption in
  `MarketSummary` and the existing "(simulated)" history + DEMO badge.
- Fixtures remain ONLY for: isolated tests importing `PROPERTIES` directly,
  mock settlement mechanics, migration compatibility, historical reference.

### Documentation (Decision 8)
- `ESTATE-24-DATA.md` now EXISTS as a generated companion
  (`scripts/generate-estate-24-data-md.mjs` → 24 records, identity + valuation
  layers + conflicts; no invented ADR/occupancy/revenue). The JSON remains the
  single editable source; the MD header forbids hand edits.
- This §6 + the per-surface table above record migration status. Remaining
  legal/accounting questions: withdrawal-1% classification; legal ownership
  wrapper (advisers, not code).
