# ingestion/ — Flowise-Ready Manifest (FIFI-03)

Deterministic ingestion set for the Fifi Knowledge Foundation. **The governing rule is
this manifest — never "ingest everything under rag/".**

## INCLUDE (active corpus — docIds in `docs/FIFI-KNOWLEDGE-SCHEMA-V1.md` format)

### Global rules (always retrieved first)

- `knowledge-base/preamble/00-global-rules-and-provenance.md`
  (`fifi.rules.rules.global-rules-and-provenance.v1`)

### Product / business / economics (en + fa siblings)

- `knowledge-base/product-docs/01-product-overview.md` + `.fa.md`
- `knowledge-base/product-docs/02-business-rules.md` + `.fa.md`
- `knowledge-base/product-docs/03-economic-model.md` + `.fa.md`
- `knowledge-base/product-docs/04-estate-page-structure.md` + `.fa.md`
- `knowledge-base/product-docs/05-how-to-use-the-app.md` + `.fa.md`
- `knowledge-base/product-docs/club-overview.md` + `.fa.md`
- `knowledge-base/product-docs/referral-overview.md` + `.fa.md`
- `knowledge-base/product-docs/card-overview.md` + `.fa.md`

### App guides (en + fa siblings)

- `knowledge-base/app-guide/01-app-overview-and-navigation.md` + `.fa.md`
- `knowledge-base/app-guide/02-buying-shares-primary.md` + `.fa.md`
- `knowledge-base/app-guide/03-secondary-market-and-trading.md` + `.fa.md`
- `knowledge-base/app-guide/04-locking-shares-and-earning.md` + `.fa.md`
- `knowledge-base/app-guide/05-estate-page-tabs-explained.md` + `.fa.md`
- `knowledge-base/app-guide/06-commissions-and-fees.md` + `.fa.md`

### Glossary (en + fa siblings, 30 terms)

- `knowledge-base/glossary/*.md` + `*.fa.md` (fractional-ownership, fraction, estate,
  villa, investment, ownership, rental-income, earnings, accrued, paid, projected,
  valuation, occupancy, adr, anr, yield, fee, withdrawal, portfolio, club, referral,
  membership, wallet, transaction, provenance, estimated, observed, derived, unknown,
  conflicted)

### FAQ (en + fa siblings, 14 topics)

- `knowledge-base/faq/*.md` + `*.fa.md`

### Troubleshooting (en + fa siblings, 6 topics)

- `knowledge-base/troubleshooting/*.md` + `*.fa.md`

### Estate knowledge (generated, 24 files)

- `knowledge-base/villas/re-*.md` (all 24, with YAML front matter intact)

### System prompt (deployed verbatim as the Flowise system message)

- `prompts/system-prompt.md`

Behavioral boundaries (scope, safety, adversarial) are enforced via the system prompt
plus the preamble's §10 summary; the canonical text is
`docs/FIFI-SCOPE-AND-SAFETY-CONTRACT-V1.md` (not ingested — it governs behavior, and
ingesting it would expose internal orchestration vocabulary to retrieval).

## EXCLUDE (never ingested for normal retrieval)

- `knowledge-base/preamble/preamble.md` — SUPERSEDED (deleted at refresh; successor is
  `00-global-rules-and-provenance.md`).
- `docs/product/rebuild/ESTATE-24-DATA.json` and research datasets — sources, not
  retrieval content (villas carry their content).
- `rag/scripts/*` — tooling, not knowledge.
- `DOCUMENTS-TO-WRITE.md`, `villas/ABOUT.md`, `README-RAG.md`, this manifest —
  process documentation, not user-facing knowledge.
- Any file with `status: BLOCKED/SUPERSEDED/ARCHIVED/DRAFT/REVIEW` metadata.
- Any content quoting the retired weekly-payout option as current, `prop-*` ids as
  canonical, or transliterated brand names — these fail validation (§Validation).

## Conventions

- One file = one document. Keep filenames exactly as-is.
- Villa files carry YAML front matter for metadata filtering (`docType`, `propertyId`,
  `destination`, `dataConfidence`) — keep intact when copying.
- Nothing here is hand-authored beyond curated docs: estate files regenerate via
  `rag/scripts/prepare-villa-docs.ts`. No product code, no secrets, no personal data.

## Refresh flow

1. Update the source (Tier 1 doc, `ESTATE-24-DATA.json`, or a curated KB doc).
2. Re-run the villa script from the repo root:
   `node --experimental-strip-types rag/scripts/prepare-villa-docs.ts`
3. Re-run validation (§Validation in the FIFI-03 report: stale-weekly scan,
   `prop-*` scan, brand scan, dynamic-value scan, 24-file determinism check).
4. Upload the refreshed INCLUDE set in Flowise.
