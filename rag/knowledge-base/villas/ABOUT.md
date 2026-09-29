# villas/ — Generated Estate Documents

**Files in this folder are GENERATED. Do not hand-edit them.**

- Source: `docs/product/rebuild/ESTATE-24-DATA.json` (24 records)
- Generator: `rag/scripts/prepare-villa-docs.ts`
- Naming: `re-<listingId>-<slug>.md` (canonical `re-<listingId>` ids are cross-repo
  contracts shared with the marketing site — never renamed, never invented)
- Regenerate from the repo root:

```bash
node --experimental-strip-types rag/scripts/prepare-villa-docs.ts
```

Output is deterministic — unchanged input produces byte-identical files (safe to re-run).

## Document shape (per villa)

1. **Identity** — name, location, property type, source listing URL, photo URLs.
2. **Stay rules** — check-in/out, minimum stay, policies, seasonality notes.
3. **Rates** — listed nightly/weekly rate with type (RANGE / APPROXIMATE / STARTING_FROM /
   DYNAMIC) and a season rate **summary** table: identical rows merged, and per-configuration
   price variants shown as min–max ranges of listed prices only (no invented numbers; the
   source dataset keeps full detail).
4. **Taxes & fees** — tourism tax, service charge, green tax, damage waiver (as listed;
   missing items are omitted, not guessed).
5. **Valuation block** — explicit provenance legs:
   - `APPROVED` (product-approved central value + range + decision source)
   - `RESEARCH` (third-party estimate + confidence)
   - `QUARANTINED (CONFLICTED)` legacy values — labeled as invalid evidence, never to be
     quoted as valid.
6. **Cost-structure defaults** — the documented percentage assumptions for the economic
   model (labeled as model defaults, not observed facts).
7. **Data-quality notes** — open conflicts and consolidation status, so the chatbot can
   disclose data-quality caveats honestly.
8. **YAML front matter** — `docType`, `propertyId`, `name`, `destination`, `dataConfidence`
   for Flowise metadata filtering.

## Global retrieval rules

The chatbot's global rulebook — never invent data, UNKNOWN stays UNKNOWN, provenance
labels, Projected vs Paid/Accrued, ANR vs ADR, canonical `re-<listingId>` ids — lives in
`../preamble/00-global-rules-and-provenance.md` and must be retrieved with every query.
