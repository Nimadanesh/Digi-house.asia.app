# FIFI-KNOWLEDGE-SCHEMA-V1 — Fifi Knowledge Schema & Contracts

**Status:** CONTRACT / AUTHORITATIVE for all future Fifi implementation slices
**Slice:** FIFI-02 (architecture + contract only — no UI, no RAG engine, no Laya, no LLM, no production changes)
**Date:** 2026-09-29
**Builds on:** `docs/FIFI-KNOWLEDGE-CONTRACT-V1.md` (source-of-truth hierarchy, audit findings — not overridden here)
**Governs:** `docs/FIFI-ROADMAP-V1.md` phases 1–11

> Purpose: define the canonical shape of a Fifi knowledge document and every contract
> governing its lifecycle, so that future Club, Referral, Estate, Portfolio, and
> business-rule changes never require an architecture redesign. The pipeline is:
>
> ```text
> Source → Knowledge Document → Metadata → Provenance →
> Retrieval Eligibility → Answer Policy
> ```

---

## 1. Knowledge Document Schema (canonical)

Every Fifi knowledge document carries this front matter + body contract. Fields marked **R** are required; **O** optional but recommended; **C** conditional (required when the condition holds).

### 1.1 Identity & classification

| Field | Req | Format / values | Notes |
|-------|-----|-----------------|-------|
| `docId` | R | `fifi.<domain>.<type>.<slug>.v<major>` e.g. `fifi.economics.app-guide.locking-and-earning.v1` | Stable across edits; version bump only on breaking meaning change (see §4) |
| `docType` | R | `product-doc` \| `app-guide` \| `villa` \| `glossary` \| `faq` \| `troubleshooting` \| `rules` \| `policy` | Existing `docType: villa/app-guide/product-doc` values remain valid |
| `domain` | R | One of §2 taxonomy (lowercase, single) | Cross-domain docs are split, not multi-tagged, except via relationships (§10) |
| `title` | R | Human title | |
| `locale` | R | `en` (canonical) + translated siblings share `docId` stem with locale suffix record | English is the canonical record; translations are siblings, never forks (see §7) |
| `summary` | R | 1–3 sentences, no figures unless labeled | Used for retrieval ranking context only |
| `keywords` | O | List | Search aids; never authority |
| `aliases` | O | List of alternate user phrasings (incl. Persian) | Feeds future query understanding, not answers |

### 1.2 Subject & entity linkage

| Field | Req | Notes |
|-------|-----|-------|
| `entities` | R for estate/glossary/feature docs; O otherwise | Typed refs per §8 (e.g. `{kind:"property", id:"re-128862"}`) |
| `routes` | O | Navigation-action identifiers per §9 (never raw URLs) |

### 1.3 Source & authority

| Field | Req | Notes |
|-------|-----|-------|
| `source` | R | Tier 1 path(s), e.g. `docs/product/rebuild/PRODUCT-DECISION-LOCK.md §6` |
| `sourceTier` | R | `1` \| `2` \| `3` \| `4` per Contract-V1 §1 |
| `confidence` | C | Required when Tier 3; values `high/medium/low` + `assessed` date. **Never a substitute for provenance** (§3) |
| `status` | R | §4 lifecycle |
| `effectiveDate` | R | First date the content is/was true |
| `lastVerified` | R | Last date checked against its Tier 1 source |
| `supersedes` / `supersededBy` | C | Required when status is `SUPERSEDED` |
| `canonicalFor` / `legacyOf` | C | Required for legacy-labeled records (Tier 4) |

### 1.4 Provenance & eligibility (per-claim, not just per-document)

Body figures carry inline provenance labels (§3). Document-level defaults:

| Field | Req | Notes |
|-------|-----|-------|
| `defaultProvenance` | R | Dominant label of the doc |
| `retrievalEligibility` | R | §5: `eligible` \| `restricted` \| `evidence-only` \| `never` |
| `answerAuthority` | R | §6: `authoritative` \| `explanation-only` \| `evidence-only` \| `none` |
| `requiredDisclaimers` | C | Required for economics/earnings/tax content (e.g. "Projected figures only", "not tax advice") |

### 1.5 Body rules

* One topic per file. Headings semantic (chunking depends on them, §11).
* Every number carries its provenance inline on first use.
* No live/user-specific values stored as static facts (§12 validation: such a doc is **invalid**).
* No raw locale keys, no invented routes, no `prop-*` identifiers as canonical entities.

The schema is additive: new optional fields may be introduced by later slices; required fields may only be added with a `v2` schema revision and a migration note. No redesign is needed for new domains — add a domain name (§2), not a schema change.

---

## 2. Knowledge Domains (canonical taxonomy)

`product` · `business` · `estate` · `economics` · `club` · `referral` · `card` · `portfolio` · `earnings` · `security-trust` · `guide` · `faq` · `troubleshooting` · `glossary`

* **product** — screens, navigation, features, terminology of the app itself.
* **business** — ownership/operating/program rules (Tier 1 business sources only).
* **estate** — per-villa descriptive facts (generated artifacts only, §6 Contract-V1).
* **economics** — income, valuation, assumptions, formulas, projections, fees, payout model. **Highest scrutiny domain**: every claim needs provenance + disclaimer; the 1% conflict lives here as `CONFLICTED` (see §5 Contract-V1 §4).
* **club / referral / card** — current content is prototype-scoped (Contract-V1 §10–11): scope/thresholds/mechanics only, never ledger or financial claims.
* **portfolio / earnings** — concept + UI-meaning explanations only; current values are live data (§12), never KB facts.
* **security-trust** — wallet/auth/verification/provenance explanations; never credentials or private flows.
* **guide / faq / troubleshooting / glossary** — learning layer; troubleshooting resolutions only from verified sources.

New domains (e.g. future features) are added by name with a one-line scope record. No schema change required.

---

## 3. Provenance Contract

Six states. Meaning, and what Fifi may do with each:

| Provenance | Meaning | Fifi may state | Fifi must |
|------------|---------|----------------|-----------|
| `OBSERVED` | Directly listed/sourced fact (rate, name, location, fee schedule row) | State directly, with source | Attribute on first use in an answer |
| `ESTIMATED` | Model/third-party estimate within a stated range | State **only as a range with source + method** | Never collapse to a midpoint; never present as official |
| `DERIVED` | Calculated from stated inputs by the V1 engine | State with basis shown (inputs → result) | Never recompute or re-derive; trace to engine |
| `PROJECTED` | Forward scenario figure; only the **Average** scenario grounds payouts | Label "Projected" + scenario name; Average-only for payout basis | Never present as accrued/paid; never present non-Average as payout basis |
| `UNKNOWN` | No verified data exists | Say unknown plainly (see §6 Unknown Contract) | Never fill, average, interpolate, or convert to zero/false |
| `CONFLICTED` | Sources disagree or the rule is under product decision | State that a conflict exists + what is known on each side | Never average, never silently pick, never let retrieval order decide |

**Provenance ≠ confidence.** Provenance answers *"what kind of claim is this?"*; confidence answers *"how strong is this Tier 3 evidence?"* (high/medium/low + date). A `CONFLICTED` Tier 1 rule with low confidence evidence on one side is still `CONFLICTED`, not "low-confidence fact". Collapsing the two into one field is a schema violation (§15).

Attribution ladder: state directly (OBSERVED) → attribute (ESTIMATED/DERIVED) → qualify + disclaim (PROJECTED) → declare unknown (UNKNOWN) → declare conflict (CONFLICTED). Nothing converts upward without a Tier 1 source change.

---

## 4. Knowledge Status (lifecycle)

`DRAFT` → `REVIEW` → `ACTIVE`; sideways to `BLOCKED`; terminal to `SUPERSEDED` / `ARCHIVED`.

| Status | Meaning | Retrievable? | Answer-authoritative? |
|--------|---------|--------------|----------------------|
| `DRAFT` | Being written, unverified | No | No |
| `REVIEW` | Written, awaiting Tier 1 verification | Restricted (authors only) | No |
| `ACTIVE` | Verified against Tier 1, within `lastVerified` freshness | Per §5 | Per §6 |
| `BLOCKED` | Depends on an unresolved product decision (e.g. 1%-model docs) | Evidence-only | **No** |
| `SUPERSEDED` | Replaced by a named successor (`supersededBy` required) | Never (excluded from index) | No |
| `ARCHIVED` | Historical record kept deliberately (Tier 4) | Evidence-only on explicit history queries | No |

**`SUPERSEDED` ≠ `CONFLICTED`.** Supersession is a versioning fact (old → new, settled). Conflict is an authority fact (A vs B, unsettled). A conflicted document may hold useful evidence but must not become answer-authoritative; a superseded document must not be retrieved at all. Reference example: `preamble/preamble.md` is SUPERSEDED (successor: `00-global-rules-and-provenance.md`); the income-model docs are BLOCKED/CONFLICTED (no settled successor yet).

Status transitions require re-verification (`lastVerified` bump); `ACTIVE` lapses to `REVIEW` when its Tier 1 source changes until re-checked (see §12 update flow).

---

## 5. Retrieval Eligibility vs §6 Answer Authority

Explicitly separate concepts (critical):

```text
Retrieval eligibility ≠ Answer authority
```

* **Retrieval eligibility** — may this chunk be fetched as context? (`eligible` / `restricted` / `evidence-only` / `never`.) Decided by status + tier + conflict + supersession + locale + verification freshness.
* **Answer authority** — may this chunk ground a user-facing claim? (`authoritative` / `explanation-only` / `evidence-only` / `none`.)

| Content kind | Retrieval | Answer authority |
|--------------|-----------|------------------|
| ACTIVE Tier 1/2, provenance clean | eligible | authoritative (with labels + disclaimers) |
| Research (Tier 3) | eligible, labeled | explanation-only — context, never overrides Tier 1/2 |
| Legacy (Tier 4) | evidence-only, history queries | evidence-only — explains past behavior, never current truth |
| CONFLICTED / BLOCKED | evidence-only | none for the disputed claim; may state *that a conflict exists* |
| SUPERSEDED | never | none |
| UNKNOWN-marked field | eligible (the unknown-ness is informative) | explanation-only ("currently unknown") |

Research may inform, legacy may explain history, conflicted sources may document the dispute — none may silently override authoritative current rules. Retrieval order never determines truth.

---

## 6. Conflict & Unknown Contracts

**Conflict behavior (normative):** (1) detect; (2) preserve state as `CONFLICTED`; (3) prefer the clearly-authoritative source when one exists; (4) if the authoritative rule itself is unresolved, answer as conflicted; (5) never invent a resolution; (6) never average values; (7) never prefer the newer-looking document; (8) never let retrieval order decide.
Reference example: the 1% income-model conflict (Contract-V1 §4) — Fifi must not answer income/withdrawal questions from current RAG content until the rewrite lands; the only permissible response pattern is *"this is under product reconciliation; what is settled is X"* where X is Tier 1 undisputed fact.

**Unknown behavior (normative):** `UNKNOWN` is a valid terminal answer state. Permitted patterns: "We don't currently have verified information for this." / "This value is currently unknown." / "I can explain the concept, but I cannot confirm the current value." Missing data is never zero, false, average, or estimated unless explicitly marked ESTIMATED with method + range.

---

## 7. Persian Knowledge Contract

One concept, multiple locale siblings — never a separate Persian architecture:

* Canonical record is English (`locale: en`); Persian sibling shares the `docId` stem, carries `locale: fa`, and contains: English term → Persian equivalent → simple Persian explanation → FractionalLuxe-specific meaning → example (approved-estate data only) → aliases (fa + mixed fa/en phrasings) → related concepts.
* Mixed-language queries ("Yield یعنی چی؟") resolve against aliases + glossary entities, not machine translation.
* Presentation: RTL-safe (directional markup owned by UI layer), English terms/IDs/numbers/currency codes preserved verbatim inside Persian prose, no raw locale keys, consistent terminology (a term table is a FIFI-04 deliverable), beginner-simple register.
* Nothing in this slice translates the KB. Translation without the schema above is explicitly *not* Persian-first design (Roadmap §9).

---

## 8. Entity Contract

Typed entities, identity separated from routing:

* Kinds: `property` · `feature` · `screen` · `concept` · `club-tier` · `referral-concept` · `glossary-term` · `financial-concept`.
* Property identity is the canonical `re-<listingId>` only. Legacy `prop-*` strings must never validate as entities (aligns with repo-wide `test-*` convention and deep-link rejection of legacy params).
* A glossary-term entity backs every important product term (feeds §7 aliases).
* Screen entities reference navigation-action identifiers (§9), never URLs — so "What is this villa?" (entity lookup) and "Where can I find this in the app?" (entity → action) compose without conflating identity with routing.

---

## 9. Route / Navigation Contract (future)

Knowledge references canonical **action identifiers**, resolved to real routes by the future UI layer:

`action.open-marketplace` · `action.open-estate {propertyId}` · `action.open-portfolio` · `action.open-earnings` · `action.open-wallet` · `action.open-club` · `action.open-card` · `action.open-invite` · `action.start-tutorial {flowId}`

Rules: no hard-coded URLs in KB docs; every action carries an entity precondition (e.g. open-estate requires a valid `re-*` id); unknown/future routes are never invented — unresolvable actions degrade to a textual direction + support pointer. Verified current route facts available to future resolvers: `/property/[id]`, `/marketplace`, `/portfolio`, `/earnings`, `/club`, `/referral`, `/card`, `/settings` (audited FIFI-01).

---

## 10. Knowledge Relationships

Typed edges (stored alongside docs or in a sidecar index — implementation choice deferred, vocabulary fixed here):

`explains` · `defines` · `belongs_to` · `describes` · `derived_from` · `supports` · `supersedes` · `conflicts_with` · `related_to` · `navigates_to`

Invariants: `derived_from` points Tier 1-ward only; `supersedes` requires the successor's `docId`; `conflicts_with` requires both sides + a `CONFLICTED` marker on the disputed claim; `navigates_to` targets action identifiers (§9), not URLs. Retrieval may traverse relationships for context; authority still follows §§5–6 per node.

---

## 11. Chunking Contract (principles — no implementation)

When a future slice builds retrieval: semantic + heading-aware boundaries; **every chunk inherits** parent `docId`, domain, locale, source + tier, provenance default, entity refs, status, conflict flags; no chunk may lose the authority context of its parent. Fixed-size chunking alone is prohibited. Tables (rate tables, fee tiers) chunk as whole units with their method notes attached. SUPERSEDED content is excluded at index time, not filtered at query time.

---

## 12. Knowledge Update Contract

```text
Product/Business Change → Authoritative Source Updated → Knowledge Audit →
Knowledge Document Updated (or deterministic regen for estates) → Validation (§15) →
Retrieval Index Refresh → Fifi QA → Release
```

* Estate docs regenerate from JSON only; hand-edits are invalid (§15).
* Any Tier 1 change lapses dependent `ACTIVE` docs to `REVIEW` until re-verified.
* The 1%-model rewrite is pre-authorized by this contract's conflict record — it is a *restoration to Tier 1*, not a product decision.

---

## 13. Dynamic Data Contract (future interface — not implemented)

Concept only: future Fifi services request live values through **approved application/service interfaces** (repos, hooks, API endpoints audited in Contract-V1 §7) — never direct DB/chain access. Shape per category: *what* (e.g. current price), *from where* (interface name), *freshness* (realtime/cached + TTL owner), *fallback* (stale-label or unknown — never estimate).

```text
Knowledge → explains meaning    Live Data → supplies current value
App Context → supplies navigation/user context (see §14)
```

Fifi composes the three at answer time without mixing their authority. Fifi never becomes a second undocumented backend.

---

## 14. User Context Contract (future — not implemented)

Future context envelope: current route + action context, current property (`re-*` only), locale, permitted product-state summary (e.g. "owns shares in X" — boolean, never balances). Explicitly separated from **User Private Data** (wallet addresses, `initData`, secrets, credentials, personal/tx detail) which is *default-deny* for model exposure. Only minimum-necessary context crosses to the model; sensitive access is never defined in a knowledge slice.

---

## 15. DecisionEngine Contract (abstraction only — no Laya)

```text
Fifi → DecisionEngine → (Laya implementation)
```

Never `Fifi → Laya` directly. Conceptual outputs: `intent`, `category`, `mode` (navigation/explanation/troubleshooting), `needs_live_data`, `needs_clarification`, `learning_level`, `uncertainty`. The interface accepts text + context envelope (§14) and returns typed decisions only — no free-form generation. Laya selection validated later on real Persian questions (Roadmap Phase 10); the abstraction keeps it replaceable. **Nothing installed or configured in this slice.**

---

## 16. Conversation Categorization

Internal system behavior, invisible to the user: one Fifi, "ask anything", no pre-question category gates. Post-question classification (Getting Started, Platform, Estates, Investing, Earnings, Wallet, Club, Referral, Troubleshooting, General Learning) serves analytics, retrieval hints, routing, history, and product improvement. Categories are labels on conversations, never separate assistants, and never affect answer authority.

---

## 17. Zero-Cost & Security Constraints (preserved)

* **Zero-cost:** initial deployment ≈ $0/mo (FreeStyle free tier, self-hosted Laya, free NVIDIA/OpenRouter models where suitable). No mandatory paid dependency; every contract above stays upgradeable without user-facing changes.
* **Security:** secrets server-side only; no provider keys in client; no `initData`/private keys/wallet credentials to the model; minimal personal data; retrieved KB treated as untrusted input (prompt-injection surface — KB docs can never override system safety/authority rules).

---

## 18. Schema Validation (invalid states — normative)

A validator (future slice) must reject: SUPERSEDED marked answer-authoritative · CONFLICTED/BLOCKED marked authoritative without explicit product approval · required provenance missing · live user-specific value stored as static fact · legacy entity as canonical · raw URL in place of action identifier · translation sibling diverging in meaning from canonical English · chunk missing parent authority context. A documentation-only reading of this section suffices for this slice; no runtime code is created.

---

## 19. Verification (FIFI-02 self-check)

* ✅ No Tier 1 hierarchy overridden — conflicts preserved as CONFLICTED (1% model untouched).
* ✅ Schema covers all required knowledge types (§1 fields × §2 domains); additive-only extensibility stated.
* ✅ Stable/live/context boundary explicit with composition rule (§13) and no direct-DB principle.
* ✅ Provenance (6 states) separated from confidence; per-claim labeling required.
* ✅ Retrieval eligibility ≠ answer authority, with matrix (§5) and relationship authority rule (§10).
* ✅ Conflicts can never silently become truth (§§4–6, §18 validators).
* ✅ UNKNOWN terminal-state patterns defined; zero/false/average conversions prohibited.
* ✅ Legacy/research quarantined per Contract-V1 tiers.
* ✅ Persian first-class via sibling-record schema (§7); no blind translation performed.
* ✅ Entity identity separated from routing (§8 vs §9); `re-*` canonical, `prop-*` rejected.
* ✅ DecisionEngine abstracted; Laya uninstalled/unconfigured; nothing added to client bundle.
* ✅ One-assistant architecture preserved (§16).
* ✅ Zero-cost viability + upgrade path stated (§17).
* ✅ No prohibited scope: docs-only slice — single file created, no src/apps/messages/rag edits, no deps, no conflict resolutions.

---

*End of FIFI-KNOWLEDGE-SCHEMA-V1. Next: FIFI-03 — Knowledge Base Rewrite & Canonical Ingestion Preparation (do not start automatically).*
