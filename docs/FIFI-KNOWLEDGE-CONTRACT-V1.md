# FIFI-KNOWLEDGE-CONTRACT-V1 — Fifi Knowledge & Source-of-Truth Contract

**Status:** CONTRACT / AUTHORITATIVE for all future Fifi slices
**Slice:** FIFI-01 (audit + contract only — no UI, no LLM, no retrieval, no Laya, no new dependencies)
**Date:** 2026-09-29
**Governs:** `docs/FIFI-ROADMAP-V1.md` implementation, all `rag/` curation, all future Fifi retrieval/response work.

> This contract tells every future Fifi slice: **what is true, where the truth comes from,
> what Fifi may know, what Fifi must retrieve live, what remains unknown/conflicted,
> and what must never be hallucinated.**

---

## 1. Source-of-Truth Hierarchy (binding)

| Tier | Name | What it is | Fifi treatment |
|------|------|------------|----------------|
| **Tier 1** | **Authoritative** | Locked specs + current implementation: `FRACTIONALLUXE-PROGRAM.md` (locked income model §1), `docs/product/rebuild/PRODUCT-DECISION-LOCK.md` (Final PO Decisions 2026-09-11, §6), `.agent/context/BUSINESS-RULES.md`, canonical estate dataset `docs/product/rebuild/ESTATE-24-DATA.json`, V1 economics engine (`src/lib/economics/`), current UI implementation (`src/app/`, `src/components/`) | **Only Tier 1 may become authoritative Fifi knowledge.** |
| **Tier 2** | **Derived** | Deterministic artifacts generated from Tier 1: `rag/knowledge-base/villas/re-*.md` (via `rag/scripts/prepare-villa-docs.ts`), `ESTATE-24-DATA.md` companion (via `scripts/generate-estate-24-data-md.mjs`), canonical offering (`src/lib/economics/canonical-offering.ts`) | Usable for retrieval **iff** regenerated from current Tier 1 and provenance-labeled. Never hand-edited. Never the primary source. |
| **Tier 3** | **Research / Supporting** | Third-party/model estimates, research datasets (`docs/product/rebuild/research/24-PROPERTY-RESEARCH-DATASET.md`), `docs/research/*` briefs/flows, operator bios, unsourced editorial | Evidence only. Labeled RESEARCH. Never overrides Tier 1/2. Never presented as official figures. |
| **Tier 4** | **Legacy / Superseded** | Retired mechanics and docs: `prop-*` fixtures, legacy weekly-rate records, `payoutPeriodWeeklyHint`/`LEGACY_WEEKLY_RATE_PENALTY_PP` display math, `rag/knowledge-base/preamble/preamble.md`, stale comments claiming 4 tabs, old Telegram/TON-only wording, aspirational persona copy | **Never user-facing as current truth.** May appear only with explicit `Legacy` labeling where the product preserves historical records. Never ingested as authoritative knowledge. |

**Rule:** Fifi must never treat Tier 3 or Tier 4 as authoritative merely because the text exists inside `rag/` or anywhere else in the repo.

---

## 2. Knowledge Domains

| Domain | Scope | Current source | Status |
|--------|-------|----------------|--------|
| Product | Home, Marketplace, Estate page, Portfolio, Earnings, Wallet, Card, Club, Referral, navigation, onboarding | `src/app/(app)/*`, `src/components/*`, `src/hooks/*`, `docs/research/USER_FLOW.md` (adapt where stale) | Structure known; Estate docs stale (see §5); Earnings/Portfolio mid-redesign |
| Business | Fractional ownership, shares, estate economics, rental income, yield, fees, withdrawal | `PRODUCT-DECISION-LOCK.md` §2+§6, `.agent/context/BUSINESS-RULES.md`, `docs/product/rebuild/ECONOMIC-PHILOSOPHY-PRODUCT-TRUTH.md` | Locked except legal/accounting classification of the 1% (reserved, see §4) |
| Estate | 24 canonical villas: identity, rates, taxes/fees, valuation legs, conflicts | `ESTATE-24-DATA.json` → `estate-24-data.ts` + `canonical-24.ts` → `re-*.md` | Chain verified; generated docs KEEP (see §10) |
| User Guide | Registration, wallet connect, browse, buy, lock, earnings, withdraw, club, invite | `rag/knowledge-base/app-guide/01–06` | **REWRITE required** — stale income model + routes + tab names (see §5) |
| Glossary | Term → fa equivalent → simple → product context → example | *Does not exist yet* | Schema defined in §9; build in FIFI-04 |
| FAQ | Grouped common questions | *Does not exist yet* | Build after knowledge foundation (FIFI-08+) |
| Troubleshooting | Wallet, transactions, navigation, product issues | *Does not exist yet* | Build after knowledge foundation; must never invent resolutions |

---

## 3. Static vs Dynamic Information

**Static (RAG-eligible):** product explanations, business rules, terminology, user guides, policies, FAQs, troubleshooting docs, Club/Referral explanations, estate *descriptive* facts with provenance.

**Dynamic (RAG-FORBIDDEN — see §7 Dynamic Data Contract):** current price, availability/funding progress, portfolio balances, holdings, earnings/accrued/paid states, transaction status, membership state, any user-specific value. These come only from repository/API/live-data layers.

```text
Stable Knowledge → Knowledge/RAG
Live Numbers → Repo/API/Live Data
Never: Live Numbers → Embedding → AI answer
```

---

## 4. Business Rules Audit — THE 1% CONFLICT (CONFLICTED, blocking)

### 4.1 What the authoritative sources say (Tier 1, mutually consistent)

* `FRACTIONALLUXE-PROGRAM.md:19` (locked 2026-08-23) + Phase A step A4: rental income **accrues monthly**; **withdrawals on request: 1% fee, paid in 4 weekly installments**. "Weekly" may appear ONLY in withdrawal/installment contexts.
* `docs/product/rebuild/PRODUCT-DECISION-LOCK.md` §2B + §6 (Final PO Decisions 2026-09-11, Decisions 3–5): the **withdrawal 1% fee** (`withdrawalTerms` × 12 locales; `src/lib/mock/withdrawals.ts:23` `WITHDRAWAL_FEE_BPS = 100`, `planWithdrawal()` fee-at-request + net in exactly 4 weekly installments) is **distinct** from the **legacy lock weekly display adjustment** (`yield-math.ts LEGACY_WEEKLY_RATE_PENALTY_PP`, −1pp). The legacy −1pp rate "survives only for preserved weekly records + their settlement math" (§6, Monthly model + lock). `LockSheet` is **monthly-only**; mock coerces legacy `"weekly"` → monthly. The exact legal/accounting meaning of the 1% is **reserved for advisers** (neutral wording; §4.7/§6).
* Implementation matches: `src/lib/mock/withdrawals.ts:5,15-25,28-42`, `src/lib/property-yield.ts:18`.

### 4.2 What current `rag/` says (contradicts Tier 1)

* `rag/knowledge-base/preamble/00-global-rules-and-provenance.md:67-70`: "The user may opt for **weekly payouts**, in which case **1% is deducted from the share's yield rate**."
* `rag/knowledge-base/app-guide/04-locking-shares-and-earning.md:21-28`: "Monthly default vs optional weekly … With weekly payouts, **1% is deducted**."
* `rag/knowledge-base/product-docs/02-business-rules.md:55-57,63-66` and `01-product-overview.md`, `03-economic-model.md`, `05-how-to-use-the-app.md`: same weekly-option framing. **No RAG document describes the withdrawal 1% fee + 4-installment model.**
* RAG therefore canonicalizes the **retired legacy weekly rate** as live product behavior and omits the authoritative withdrawal model — exactly what Decision Lock §2B forbids ("MUST NOT be presented as the withdrawal fee").

### 4.3 Audit verdict

```text
Topic: income/withdrawal 1% model — Status: CONFLICTED — Blocking Fifi: YES
Source A (authoritative): PROGRAM locked model + PRODUCT-DECISION-LOCK §6 +
  withdrawals.ts implementation → monthly-only locks, full monthly rate,
  withdrawal 1% fee + 4 weekly installments, legacy weekly = history only.
Source B (stale): rag/ preamble + app-guide/04 + product-docs/01/02/03/05 →
  live "optional weekly payouts with 1% deducted from yield rate".
Authoritative per governance: Source A (PROGRAM §1 + Decision Lock §6 supersede;
  RAG README itself declares the tree FROZEN pending reconciliation).
Required: explicit rewrite of all RAG income-model copy to Source A before any
  retrieval/response slice. Fifi must NEVER answer income/withdrawal questions
  from current RAG content.
Note: RAG's own scaffolding log (PROGRAM:154, 2026-09-21) recorded the CORRECT
  copy (monthly-accrual + 1%-fee-4-installments) — the tree drifted during
  curation. Restore toward the scaffolding spec + Decision Lock §6.
```

Open but non-blocking sub-item: legal/accounting classification of the 1% (fee vs withholding vs reserve) is reserved for advisers — Fifi must use neutral "1% fee" wording and never invent a classification.

---

## 5. Estate Page Audit (verified against implementation)

### 5.1 Verified current structure (Tier 1 = implementation)

* **Route:** `/property/[id]` — `src/app/(app)/property/[id]/page.tsx:38`. **No** `marketplace/property/[id]` route exists (glob + grep confirmed; 14 pages total, one property-detail).
* **Tabs: 5** — `src/components/property/PropertyTabs.tsx:17-25`: `estate | income | ownership | earn | details`, default `estate` (`PropertyDetail.tsx:68`), panels at `PropertyDetail.tsx:181-230`.
* **Tab 1 display label is "Overview"**, not "Estate": `messages/en.json:703` `tabEstate: "Overview"` (id `estate`, label Overview; `tabEarn: "Earn"`, order estate→income→ownership→earn→details).
* **L0/L1 above tabs** (`PropertyDetail.tsx:126-179`): gallery + hero (L0), 4-stat metrics grid Monthly income / Proj. year / Avg. nightly rate / Est. growth (L1, `PropertyMetricsGrid.tsx:87-121`), OwnershipCard (owned only), CoOwnEstateCard.

### 5.2 Stale documentation (must be rewritten, not ingested as-is)

* `rag/.../product-docs/04-estate-page-structure.md`: describes **4 tabs** (Estate/Income/Ownership/Details, no Earn) — **STALE**.
* `rag/.../app-guide/05-estate-page-tabs-explained.md`: 5 tabs (correct count) but tab-1 named "Overview" inconsistently vs product-docs "Estate", and `app-guide/01` cites route `/marketplace/property/[id]` — **STALE route + terminology**.
* In-code comments claiming "5 → 4 tabs" (`PropertyTabs.tsx:5`, `PropertyDetail.tsx:2-3`, `PropertyDetail.test.tsx:124`) and `PropertyTabs.test.tsx` (type omits `earn`) are **stale witnesses** of an unlanded/provisional 4-tab revision — implementation is 5 tabs. Flag for code-owner cleanup; Fifi contract follows implementation.
* Related program context: Resume Here notes "wave 3 (Yield removed / Earn tab)" work in progress — Estate docs must be re-verified after the refactor lands.

---

## 6. Estate Data Boundary

Verified chain (subagent audit, 2026-09-29):

```text
docs/product/rebuild/ESTATE-24-DATA.json (24 records, listingIds verified)
  → src/lib/economics/estates/estate-24-data.ts (verbatim adoption, ESTATE_24_DATA)
  → src/lib/economics/estates/canonical-24.ts (identity/reconciliation, re-<listingId>)
  → UI: getEstate24ByRuntimeId (9 runtime import sites: property page, Buy/Sell/
     LimitBuy sheets, SimilarProperties, DistributionTaxSection, view-models, mock)
     + getCanonicalEstate (identity layer, 7 sites: deep-link, view-models, mock)
  → rag/scripts/prepare-villa-docs.ts (SOURCE_PATH resolves to the JSON above: MATCH)
  → rag/knowledge-base/villas/re-*.md (24 files, deterministic, provenance-labeled)
```

**Contract rule:**

> Villa knowledge documents are **generated artifacts** and must never become the primary source of truth. Source of truth is `ESTATE-24-DATA.json` (+ V1 economics). No hand-editing of `re-*.md`. Regenerate via `node --experimental-strip-types rag/scripts/prepare-villa-docs.ts`. Byte-identical re-runs expected.

---

## 7. Fifi Dynamic Data Contract

The following must **NEVER** be sourced from embeddings/RAG. Expected live source where verified; otherwise marked TO BE VERIFIED. No guessing.

| Data | Static/Dynamic | Current source (verified) | RAG allowed? |
|------|----------------|---------------------------|--------------|
| Current estate price / offer | Dynamic | `getCurrentSharePrice` hierarchy (primary offer → best ask → last trade → list fallback); canonical $100 primary via `canonical-offering.ts` | **NO** |
| Availability / funding progress / shares sold-remaining | Dynamic | Demo ownership ledger (`demoSoldShares`); statuses `funding/funded/resale` are scenario state | **NO** |
| Portfolio balance / holdings / allocation | Dynamic | `getRepo().portfolio.summary()` → `usePortfolio.ts` (mock `mock/portfolio.ts`, http `GET /v1/portfolio`) | **NO** |
| Earnings: paid / accrued / expected | Dynamic | `getRepo().earnings.summary()` → `useEarnings.ts` (mock frozen demo ledger, "no live tick") | **NO** |
| Transaction / order status | Dynamic | Order/sell repos + `useOrderBook`/`useSells`; Portfolio open orders | **NO** |
| Withdrawal requests / installments | Dynamic | Withdrawals repo (`mock/withdrawals.ts`, `planWithdrawal`) | **NO** |
| Membership / Club tier state | Dynamic | `usePortfolio→getClubStatus`, `club-tiers.ts` / `club-status.ts` (prototype) | **NO** |
| Referral progress | Dynamic | `useReferrals.ts` (`0, isPrototype:true`) | **NO** |
| Fee tiers (current table) | Dynamic-ish (config) | `PRODUCT-PLAN.md` §0.5 served via `GET /v1/fees` — Fifi must reference, never quote from memory | **NO** (cite source) |
| Estate descriptive facts (name, location, rates, taxes, valuation legs, conflicts) | Static w/ provenance | `re-*.md` generated docs (Tier 2) | YES, with labels |
| Business rules, guides, glossary, FAQ, troubleshooting | Static | Curated docs after rewrite (Tier 1-derived) | YES, after FIFI-03 |

---

## 8. Provenance Contract

Preserved from `00-global-rules-and-provenance.md` (KEEP), formalized for retrieval/response design:

* Labels: **OBSERVED** (listed fact) · **ESTIMATED** (model-derived, always with range) · **DERIVED** (calculated — show basis) · **PROJECTED** (forward scenario; only Average grounds payouts) · **UNKNOWN** ("Unknown — not established in current data"; never guessed/averaged/filled) · **CONFLICTED / QUARANTINED** (known-bad; never quoted as valid; official value treated as Unknown).
* Economic distinctions (never mixed): **projected ≠ accrued ≠ paid**; **ANR ≠ ADR** (ANR = mean of full-buyout listed rates; ADR always Unknown — occupancy Unknown for all 24); asset appreciation ("Est. Growth", non-annualized) ≠ rental income; primary price ≠ reference value/share ≠ secondary price; NFT = display-only collectible, never legal ownership/deed/title.
* Conflict rule: listing-identity facts > canonical dataset + approved economics > research evidence > legacy/mock (never wins). Beyond that: surface the conflict, don't silently choose.
* Carriage rule: every future retrieval chunk must carry its provenance + source id; every Fifi answer citing a figure must carry its label; missing data must render the honest pending/Unknown state, never $0 or an invention.

---

## 9. Persian Knowledge Contract

Persian is a first-class Fifi knowledge layer — not post-generation translation.

* Required schema per concept (FIFI-04 builds this; this slice only defines it):

```text
English term
Persian equivalent
Simple Persian explanation
FractionalLuxe-specific explanation
Example (approved-estate data only, when available)
Related concepts
```

* Current Persian source audit: `messages/fa.json` (1343 lines, 16 namespaces) is **UI copy only** — zero per-villa dataset content (verified: no rate tables, valuations, or provenance; sample keys `common.appName`, `home.trustFooter`, `estates.searchPlaceholder`). UI copy ≠ educational knowledge. Glossary/FAQ/Troubleshooting in Persian do not exist yet.
* **Stale-locale finding:** `messages/fa.json:3` `common.appName` = `دیجی‌هاوس` vs `messages/en.json:3` `FractionalLuxe` — brand regression in fa locale. Flagged for i18n owner; Fifi must always render the brand as Latin `FractionalLuxe`.
* Requirements for later slices: RTL-aware presentation; consistent Persian terminology with English technical terms preserved alongside; no raw localization keys in answers; beginner-simple register; mixed fa/en query handling; Persian intent evaluation on real questions (FIFI-14).

---

## 10. RAG Folder Audit — Inventory & Classification

Verified 2026-09-29 (full tree read; ingestion folder contains README only; 24/24 villa files present).

| File/Group | Classification | Reason | Required action |
|------------|----------------|--------|-----------------|
| `preamble/00-global-rules-and-provenance.md` | **KEEP** | Strong provenance/honesty rulebook; compatible with Tier 1 except income-model §4 (see below) | Keep; rewrite §4 to Decision Lock §6 in FIFI-03 |
| `villas/re-*.md` (24) | **KEEP** | Deterministic generation, provenance legs, quarantine correct, front matter intact | Keep; regenerate only from JSON |
| `villas/ABOUT.md` | **KEEP** | Correct generation contract | Keep |
| `scripts/prepare-villa-docs.ts` | **KEEP** | Deterministic, validated, source path MATCH | Keep |
| `prompts/system-prompt.md` | **KEEP** (minor update later) | Role, no-advice, adversarial handling correct; income §5 carries the stale weekly model | Keep; update §5 + add fa/brand notes in FIFI-03 |
| `ingestion/README.md` | **KEEP** | Correct Flowise conventions (excludes superseded preamble) | Keep |
| `product-docs/DOCUMENTS-TO-WRITE.md` | **KEEP** | Accurate index + writing rules ("not yet locked" discipline) | Keep; extend with rewrite tasks |
| `product-docs/01-product-overview.md` | **REWRITE** | Weekly-option model; Telegram/TON-only superseded claims partially retained | Rewrite to monthly-only + withdrawal model + multi-chain |
| `product-docs/02-business-rules.md` | **REWRITE** | Core of the 1% conflict (§4); otherwise good hierarchy | Rewrite income § + banned-phrasing § |
| `product-docs/03-economic-model.md` | **REWRITE** | Weekly-option + scenario-as-payout ambiguity; V1 lines otherwise sound | Rewrite payout-basis § to Average + monthly-only |
| `product-docs/04-estate-page-structure.md` | **REWRITE** | 4-tab structure stale vs 5-tab implementation | Rewrite to verified §5.1 structure |
| `product-docs/05-how-to-use-the-app.md` | **REWRITE** | Weekly payout wording; route/tab drift | Rewrite post-redesign |
| `app-guide/01-app-overview-and-navigation.md` | **REWRITE** | Wrong route `/marketplace/property/[id]`; stale journey | Rewrite post-redesign |
| `app-guide/02-buying-shares-primary.md` | **REWRITE** | $100 base OK; surrounding flow references stale tabs/copy | Verify + rewrite post-redesign |
| `app-guide/03-secondary-market-and-trading.md` | **REWRITE** | Mechanics broadly OK; commission pointer OK; verify vs final UI | Verify + rewrite post-redesign |
| `app-guide/04-locking-shares-and-earning.md` | **REWRITE** (blocking) | Heart of the 1% conflict: weekly-option framing | Rewrite to monthly-only + withdrawal model |
| `app-guide/05-estate-page-tabs-explained.md` | **REWRITE** | 5-tab count right; names/route inconsistent; pre-redesign | Rewrite to §5.1 after refactor lands |
| `app-guide/06-commissions-and-fees.md` | **REWRITE (light)** | 7%-buyback distinction correct; `PRODUCT-PLAN.md` §0.5 pointer correct | Light verify; keep pointer pattern |
| `preamble/preamble.md` | **SUPERSEDED** | Header self-declares superseded; excluded from ingestion set | Remove from ingestion; delete file at refresh (refs: only `ingestion/README.md:10`) |
| `rag/README-RAG.md` | **REWRITE (light)** | FROZEN status + resume gates still valid; income bullets (§What is already done) repeat stale weekly model | Update resume gate: add Decision-Lock-§6 reconciliation as gate 0 |
| Club/Referral/Card knowledge | **UNKNOWN → TO BE AUTHORED** | No KB docs exist; implementation is prototype-only (Club tiers + empty Circle; referral `isPrototype:true`; Card promo-only) | Author only from approved sources; never from prototype UI |

No blind deletions performed in this slice. `preamble.md` deletion is deferred to FIFI-03 with reference check (single referrer, documented above).

---

## 11. Product Knowledge Map (structural — not a completeness claim)

```text
Product
├── Home (implemented; chips/cards canonicalized per Decision Lock §6)
├── Marketplace (implemented; filters/sorts per Phase 9 Slice 4)
├── Estate (implemented, 5 tabs; refactor in progress — docs STALE, see §5)
├── Portfolio (implemented mock+http; redesign scheduled)
├── Earnings (implemented mock frozen ledger; redesign scheduled)
├── Wallet (implemented DUAL-RAIL: TON TonConnect + EVM wagmi ETH/BSC/Polygon/Arbitrum)
├── Card (promo-only, no repo/flow — knowledge: promo scope only)
├── Club (prototype: tiers + empty Circle — knowledge: scope + thresholds only, never financial)
└── Referral (prototype, compliance-gated — knowledge: bands/lock only, no ledger claims)

Business
├── Fractional Ownership (locked: branch of Rental Escapes; ownership vs yield distinct)
├── Shares (ownershipPerShare = 1/N; $100 primary base; reference vs secondary distinct)
├── Estate economics (V1 engine: ANR basis, 5%/7.5%/1.5% costs, 75/25 allocation)
├── Rental income (monthly per-share, Average scenario = payout basis)
├── Yield (attribute, not identity; banned "weekly yield" marketing)
├── Fees (commissions every trade, tiers via GET /v1/fees; 7% primary buyback discount)
└── Withdrawal (1% fee at request, net in 4 weekly installments; classification reserved)

Learning (TO BE BUILT: glossary → FAQs → tutorials; schema in §9)
Troubleshooting (TO BE BUILT; resolutions only from verified sources)
```

Wallet correction vs RAG: RAG claims "multi-chain" without detail — verified dual-rail above is the precise statement future KB must use. TON-only wording elsewhere is Tier 4.

---

## 12. Future Feature Rule

```text
Product Feature Change
        ↓
Source-of-Truth Update (Tier 1 spec and/or implementation)
        ↓
Knowledge Impact Review (which KB docs cite the changed behavior)
        ↓
Knowledge Update / Regeneration (curated rewrite or deterministic regen)
        ↓
Fifi understands the new feature
```

Applies to Club, Referral, Portfolio, Earnings, Estate, Wallet, and unknown future features. Fifi must never depend on manually copying UI text into ad-hoc RAG documents — curated docs cite their Tier 1 source; estate docs regenerate from JSON.

---

## 13. Fifi Knowledge Eligibility

A document becomes authoritative Fifi knowledge **only if** it has: an identifiable Tier 1 source, explicit provenance labels, a named owner for sync, and no unresolved CONFLICTED content. Existence in `rag/`, prior generation, research origin, or LLM authorship confers **zero** authority by itself.

---

## 14. Laya Preparation (contract only — no install in this slice)

* `DecisionEngine` is the stable internal interface; **Laya is the selected implementation**. No Laya code, dependency, or config in this slice (none added — verified: no package/slice changes outside `docs/`).
* Future typed decisions: `intent`, `category`, `navigation vs explanation vs troubleshooting`, `needs_live_data`, `needs_clarification`, `learning level`, answer routing (e.g. `{intent:"estate_economics", category:"estates", needs_live_data:true, needs_clarification:false}`).
* Selection must be validated on 50–100 real Persian FractionalLuxe questions (FIFI-14), never on public benchmarks alone.

---

## 15. Zero-Cost Initial Architecture Constraint

Initial Fifi deployment targets **≈$0/month infra + model cost** at low volume: free/self-hosted infra (FreeStyle), free NVIDIA model access where available, free OpenRouter models where appropriate, self-hosted Laya. No paid infrastructure as a requirement. Architectural boundaries (§3, §7, §16) must not be compromised to hit $0 — the system stays upgradeable to paid infra/models after growth.

---

## 16. Security Boundary (for future implementation slices)

LLM credentials server-side only; never in WebView/client. No Telegram `initData`, no wallet addresses, no auth secrets, no private tx data to external models unless explicitly required and approved. Minimize personal data. Separate auth from AI context. No implementation in this slice.

---

## 17. Required Audit Tables

### Table A — Source of Truth

| Domain | Source | Authority | Notes |
|--------|--------|-----------|-------|
| Income/withdrawal model | PROGRAM §1 + Decision Lock §6 + `mock/withdrawals.ts` | Tier 1 | Monthly-only; withdrawal 1% + 4 installments; RAG contradicts → CONFLICTED |
| Estate structure/tabs/routes | Implementation (`property/[id]`, 5 tabs) | Tier 1 | RAG 4-tab/route docs stale |
| Estate facts | `ESTATE-24-DATA.json` | Tier 1 | 24 records verified |
| Estate identity/reconciliation | `canonical-24.ts` | Tier 1-derived | UI layering verified |
| Economics engine | V1 (`src/lib/economics/`, Decision Lock §2) | Tier 1 | ANR, costs 5/7.5/1.5, 75/25, Average basis |
| Villa KB docs | `re-*.md` via script | Tier 2 | KEEP; regen-only |
| Business context | `BUSINESS-RULES.md`, `ECONOMIC-PHILOSOPHY-*` | Tier 1 | Legal-1% classification reserved |
| Research briefs/flows | `docs/research/*`, research dataset | Tier 3 | Inform, never override |
| Legacy fixtures/weekly math | `prop-*`, `LEGACY_WEEKLY_*`, old preamble | Tier 4 | Never authoritative |
| Persian UI copy | `messages/fa.json` | Tier 1 (UI) | Copy only; appName stale (`دیجی‌هاوس`) |

### Table B — RAG Inventory (condensed; full detail in §10)

| File/Group | Classification | Required action |
|------------|----------------|-----------------|
| preamble/00-global | KEEP (+§4 rewrite) | Rewrite income § to Decision Lock §6 |
| villas/re-*.md, ABOUT.md, prepare script | KEEP | Regen-only discipline |
| system-prompt.md | KEEP (+§5 update) | Fix income §, add brand/fa notes |
| ingestion/README.md, DOCUMENTS-TO-WRITE.md | KEEP | Extend with rewrite tasks |
| product-docs/01–05, app-guide/01–06 | REWRITE | Post-redesign, from Tier 1 |
| preamble/preamble.md | SUPERSEDED | Delete at ingestion refresh |
| README-RAG.md | REWRITE (light) | Add reconciliation gate 0 |
| Club/Referral/Card KB | TO BE AUTHORED | From approved sources only |

### Table C — Knowledge Domains (see §2 + §11 for detail)

| Domain | Current source | Status | Future Fifi role |
|--------|---------------|--------|------------------|
| Product | src/app + components + hooks | Known; estate docs stale | Guide + navigate |
| Business | Decision Lock + BUSINESS-RULES | Locked (1% class reserved) | Explain, never invent |
| Estate | JSON → script → re-*.md | Verified chain | Explain w/ provenance |
| User Guide | app-guide/01–06 | Stale | Rewrite post-redesign |
| Glossary/FAQ/Troubleshooting | Nonexistent | Schema only (§9) | FIFI-04 / FIFI-08+ |

### Table D — Dynamic Data (see §7)

| Data | Static/Dynamic | Current source | RAG allowed? |
|------|---------------|----------------|--------------|
| Price, availability, portfolio, earnings, tx/order state, withdrawals, membership, referral | Dynamic | Repos/hooks/API (§7) | NO |
| Fee tiers | Config-dynamic | `PRODUCT-PLAN.md` §0.5 / `GET /v1/fees` | Reference only |
| Estate facts, rules, guides | Static | Tier 1/2 docs | YES (post-rewrite) |

### Table E — Conflicts

| Topic | Source A | Source B | Status | Blocking Fifi? |
|-------|----------|----------|--------|----------------|
| Income 1% model | PROGRAM + Decision Lock §6 + withdrawals.ts | rag/ preamble/app-guide/product-docs | CONFLICTED | **YES — blocks all answer slices** |
| Estate tabs (4 vs 5) | Implementation (5 tabs) | product-docs/04 (4 tabs) + stale comments | STALE-B WINS? No — A wins | YES for estate answers until rewrite |
| Estate route | `/property/[id]` (impl) | `/marketplace/property/[id]` (app-guide/01) | STALE-B | YES for navigation answers |
| Tab-1 name | "Overview" (en.json) | "Estate" (product-docs) | TERMINOLOGY DRIFT | Minor — normalize in rewrite |
| fa brand | `FractionalLuxe` (en) | `دیجی‌هاوس` (fa appName) | STALE LOCALE | Flag to i18n owner |
| 1% legal meaning | Neutral "fee" (impl) | Any classification | RESERVED | Fifi: neutral wording only |
| Weekly locks | Monthly-only + Legacy history | RAG "optional weekly" | RETIRED vs STALE | Covered by row 1 |

---

## 18. Verification (FIFI-01 self-check)

1. ✅ Entire `rag/` tree read (35 files enumerated; all KB docs + script + prompt read in full).
2. ✅ 1% conflict verified at exact lines on both sides + Decision Lock §6 finality + implementation match.
3. ✅ Estate structure verified against implementation via targeted audit (route glob, tab-type definition, panel wiring, en labels, L0/L1 composition).
4. ✅ Canonical data path verified end-to-end (JSON 24 records → dual TS layers → 9+7 import sites → script source MATCH → 24 generated docs).
5. ✅ Dynamic boundaries verified against actual repos/hooks (`repos.ts`, `usePortfolio`, `useEarnings`, `mock/withdrawals.ts`, `club-tiers.ts`, `useReferrals.ts`, wallet dual-rail).
6. ✅ Superseded docs verified (single referrer `ingestion/README.md:10`; no code refs).
7. ✅ Contract internally consistent: every REWRITE traces to a Tier 1 source; no financial rule changed (all resolutions deferred to product).
8. ✅ No production code touched: this slice creates `docs/FIFI-KNOWLEDGE-CONTRACT-V1.md` only (docs-only; no src/apps/messages/rag edits, no deps).

---

*End of FIFI-KNOWLEDGE-CONTRACT-V1. Next: FIFI-02 — Knowledge Schema & Contracts (do not start automatically).*
