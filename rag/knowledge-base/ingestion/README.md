# ingestion/ — Flowise-Ready Files

Final file sets staged for upload to Flowise live here, **unchanged in content** from
their knowledge-base sources.

## Conventions

- One file = one document. Keep knowledge-base filenames exactly as-is.
- Upload set = `preamble/00-global-rules-and-provenance.md` + everything in
  `product-docs/` + all 24 files in `villas/`. (`preamble/preamble.md` is superseded and
  must not be ingested.)
- Villa files carry YAML front matter for metadata filtering in Flowise (`docType`,
  `propertyId`, `destination`, `dataConfidence`). Keep front matter intact when copying.
- Nothing in this folder is hand-authored: copy from `knowledge-base/`, or generate via
  `rag/scripts/prepare-villa-docs.ts`. No product code, no secrets, no personal data.

## Refresh flow

1. Update the source (`ESTATE-24-DATA.json` or a curated product doc).
2. Re-run the villa script from the repo root:
   `node --experimental-strip-types rag/scripts/prepare-villa-docs.ts`
3. Copy the changed files into this folder (same names).
4. Upload the refreshed set in Flowise.
