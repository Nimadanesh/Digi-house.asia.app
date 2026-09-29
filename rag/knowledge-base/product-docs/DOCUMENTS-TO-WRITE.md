# Product documentation index

Curated product documentation for the Fifi Knowledge Foundation. One topic per file,
FIFI-02 schema front matter on every active document (`docId`, `domain`, `locale`,
`source`/`sourceTier`, `status`, provenance, retrieval eligibility, answer authority).
English canonical record + Persian sibling (`*.fa.md`) per document. Extracted from
repository Tier 1 sources — never invented.

## Current files (rewritten 2026-09-29 to the locked model — FIFI-03)

**Tier 1 — must-have (answers most user questions):**

- [x] `01-product-overview.md` (+ `.fa.md`) — what FractionalLuxe is (fractional-ownership branch of
      Rental Escapes; own website/app, multi-chain TON+EVM), the Estate-first model, value
      proposition (monthly profit per locked share on the full monthly rate, lock-to-earn, Average-scenario payouts,
      conservative valuation + Est. Growth, capital funds more villas), target users,
      high-level how-it-works, demo honesty.
      Source: `docs/product/rebuild/PRODUCT-DECISION-LOCK.md` §6, `.agent/context/PRODUCT.md`, `README.md` (older Telegram/TON-only and weekly-option wording superseded).
- [x] `02-business-rules.md` (+ `.fa.md`) — all locked business rules (source-of-truth hierarchy,
      estate/id rules, Rental Escapes ownership structure, ownership vs yield, locked
      income model (monthly per-share on the full rate, lock-to-earn, Average-scenario payouts, new locks monthly-only, Legacy history), withdrawal 1% fee + 4 installments with neutral wording, banned
      phrasing, multi-chain financial/data safety, decision discipline).
      Source: `.agent/context/BUSINESS-RULES.md`, `docs/product/rebuild/PRODUCT-DECISION-LOCK.md`.
- [x] `03-economic-model.md` (+ `.fa.md`) — share pricing (primary/reference/secondary), conservative
      valuation + Est. Growth range, ANR vs ADR, V1 cost lines, 75/25 allocation, scenarios
      + Average (Average = payout basis), monthly profit per locked share,
      projected vs accrued vs paid, withdrawals, provenance states.
      Source: `docs/product/rebuild/ECONOMIC-PHILOSOPHY-PRODUCT-TRUTH.md`,
      `ESTATE-ECONOMICS-DESIGN-CONTRACT.md`, `PRODUCT-DECISION-LOCK.md`.
- [x] `club-overview.md` (+ `.fa.md`) — Club tiers/scope from approved sources; economics beyond approved rules marked UNKNOWN.
- [x] `referral-overview.md` (+ `.fa.md`) — Standard bands + 6-month lock mechanics; prototype scope, no ledger claims.
- [x] `card-overview.md` (+ `.fa.md`) — promo-only scope; no functional claims.

**Tier 2 — supporting:**

- [x] `04-estate-page-structure.md` (+ `.fa.md`) — the five tabs (Estate labeled Overview / Income / Ownership /
      Earn / Details), route `/property/[id]`, the fixed top + 4-stat sections (Average-scenario payout figures,
      lock-to-earn copy), and what each section is for.
      Source: implementation audit FIFI-01 (older 4-tab wording superseded).
- [x] `05-how-to-use-the-app.md` (+ `.fa.md`) — user guide: getting started (own website/app,
      multi-chain wallets incl. EVM chains), navigation, buying shares, locking to earn, checking
      monthly earnings, withdrawing (1% + 4 installments), selling, settings.
      Source: implementation audit FIFI-01 (older
      Telegram/TON-only wording superseded; adapted to the locked model).
- [x] `app-guide/01–06` (+ `.fa.md` each) — rewritten to implementation + locked model (FIFI-03).
- [x] `glossary/` — 30 canonical terms, en + fa siblings (FIFI-03).
- [x] `faq/` — 14 foundational topics, en + fa siblings (FIFI-03).
- [x] `troubleshooting/` — 6 verified topics, en + fa siblings (FIFI-03).

## Optional deep-dives (not yet written — write only with a real source)

- [ ] `ownership-vs-yield-products.md` — dedicated deep-dive (currently covered in 02
      and 03).
- [ ] `market-states.md` — funding/funded/resale states in depth (partially covered in
      05; see also the ownership contract).
- [ ] `plans.md` — investment plans deep-dive (envelope covered in 03).
- [ ] `fees-and-taxes.md` — per-villa tax/fee taxonomy (values live in the villa
      documents; V1 treatment covered in 03).
- [ ] `data-provenance.md` — provenance deep-dive (rules live in the preamble; states
      covered in 03).

Writing rules: source every claim from the repository docs listed above or the villa
data — never from memory; keep one topic per file; where a value is an unresolved
product decision, write "not yet locked" — do not guess.
