# FIFI-INGESTION-V1 — Deterministic Ingestion Pipeline & Retrieval-Ready Build

**Status:** ARCHITECTURE + BUILD / AUTHORITATIVE for all future Fifi retrieval/runtime work
**Slice:** FIFI-05 (ingestion build only — no chat UI, no LLM, no live-data fetching, no vector DB)
**Date:** 2026-09-29
**Builds on:** CONTRACT-V1, SCHEMA-V1, SCOPE-AND-SAFETY-CONTRACT-V1, VALIDATION-V1 (FIFI-04 PASS)

> Objective achieved: **a deterministic, trustworthy, brand-independent Knowledge
> Foundation that survives future renames without a corpus-wide rewrite.**

---

## 1. Ingestion Architecture

```text
Validated corpus (rag/knowledge-base)
        ↓
rag/scripts/build-ingestion.ts
  1. enumerate (sorted, manifest-mirroring rules)
  2. parse + validate front matter (enums, ACTIVE-only, Tier 1/2)
  3. normalize (CRLF→LF, trim trailing space)
  4. heading-aware chunking (## sections; intro folds into first chunk)
  5. attach metadata (doc/claim authority, provenance, locale, entities,
     relations, scope, sensitivity, live-data flags, context hints,
     platform + display brand from rag/brand.json)
  6. deterministic chunk IDs (sha256, no randomness)
  7. sorted emit → rag/build/fifi-knowledge-build.json
```

Single script, stdlib-only (`node:crypto/fs/path/url`), run via
`node --experimental-strip-types` like the existing villa generator. No new
dependencies, no services, no network.

## 2. Input Manifest

`rag/knowledge-base/ingestion/MANIFEST.md` governs; the script mirrors it with
explicit rules (preamble allowlist, per-dir excludes, villa filename pattern).
153 files in, 0 out-of-manifest files in. Process docs, scripts, raw datasets, and
the scope contract itself are never chunks (behavior enforced via system prompt +
preamble summary instead).

## 3. Normalization

Line-ending + trailing-whitespace normalization only. Bodies never rewritten;
meaning never altered. (Two deliberate corpus normalizations happened pre-build and
are committed as source edits: Latin brand token on the fa entry doc,
`` `action.*` `` identifier canonicalization in fa tables.)

## 4. Chunking Strategy & Rationale

Heading-aware `##` sections (one chunk per section, `###` kept inside, H1/intro
folded into the first chunk) — chosen because KB docs are already written as
self-contained sections with labeled claims; arbitrary fixed-size chunking would
split definitions from their provenance labels. Single-section docs (most glossary)
yield one chunk. Rationale documented here so FIFI-06+ can tune without redesign.

## 5. Deterministic ID Strategy

`chunkId = "fifi-ch-" + sha256(docId|locale|headingPath|ordinal)[0:16]`.
DocIds stay canonical (`fifi.<domain>.<type>.<slug>.v1`); villa docIds derived at
build time as `fifi.estate.villa.<propertyId>.v1` (resolving the FIFI-04 villa-docId
exception without touching generated artifacts). Re-runs on unchanged inputs are
byte-identical (proven: two consecutive builds, equal SHA-256).

## 6. Metadata Model (per chunk)

`chunkId, docId, domain, docType, locale, sourceTier, status, defaultProvenance,
retrievalEligibility, answerAuthority, scopeClass, sensitivity, requiresLiveData,
entities[], relatedDocIds[], contextHints[], headingPath[], ordinal, platform,
brandDisplay, brandMentioned, source, text`. Per-claim provenance stays inline in
text; chunk metadata carries the document default. `platform` is always
`"platform"`; `brandDisplay` resolves per locale from `rag/brand.json`.

## 7. Provenance / Authority Handling

Six states preserved verbatim on every chunk; authority from front matter, never
from file/order/similarity. Tier 2 villas carry `sourceTier: 2` with
`answerAuthority: authoritative` (manifest-approved derivations). `MIXED` admitted
as document-level aggregate only (C-PROV-01); per-claim labels govern answers.

## 8. Locale Handling

en/fa never merged: separate chunks, shared docId stems, `brandDisplay` per locale,
RTL-safe source text preserved byte-identical. Sibling pairing = same docId +
other locale. Preamble is en-only by design (translated at response time per the
language rule). fa coverage: 119 chunks (+216 locale-neutral villa chunks usable
with translation).

## 9. Safety Metadata

`sensitivity: standard|financial` (rule: economics domain or financial docId
pattern — documented in-script); `scopeClass: general` on all KB chunks
(restricted-handling lives in prompt + future engine, never as embedded policy
text that could leak); secrets scan clean (only never-disclose declarations);
no internal orchestration vocabulary in chunks.

## 10. Static/Live Boundary

`requiresLiveData` on 15 curated docIds (portfolio/earnings/where-/transaction/
withdrawal/membership concepts + navigation guides showing live figures) → 77
chunks. Firewalled values enumerated in CONTRACT-V1 §7; build carries the flag so
the future engine routes to runtime interfaces instead of quoting text.

## 11. Property-Context & Villa Ranking Preparation

All 216 villa chunks: `entities: [{kind: property, id: re-*}]`,
`contextHints: ["property"]`, plus front-matter `destination`/name in text.
Ranking contract for later layers: exact `re-*` id > villa name > destination >
in-estate-context generic. "This villa" resolution needs the context envelope
(§14 Schema-V1) — prepared here, implemented later.

## 12. Brand Identity Abstraction

`rag/brand.json` is the single source of truth: `platformId: "platform"`,
per-locale display names, legacy aliases (`DigiHouse`, `دیجی‌هاوس`), frozen
technical-namespace note. Audit results: docIds (`fifi.*`), action IDs
(`action.*`), routes (`/property/[id]`), deep-link params (`re_`), villa
filenames/front matter — all brand-neutral; villas contain zero brand strings;
`FractionalLuxe` in copy is display usage (acceptable); `DigiHouse` appears
nowhere in the corpus (legacy answers resolve via brand.json aliases, not KB).
**Rename principle: internal identity stays stable when the display brand changes —
a rename edits `rag/brand.json` (+ user-facing copy pass), never the architecture.**

## 13. Deterministic Build Procedure

1. `node --experimental-strip-types rag/scripts/build-ingestion.ts`
2. Re-run; compare SHA-256 (must match).
3. Artifact: `rag/build/fifi-knowledge-build.json` (486 chunks, 153 files,
   153 docId|locale docs, 24 villa docs; en 367 / fa 119 chunks).

## 14. Generated Artifacts

`rag/build/fifi-knowledge-build.json` — records (above) + `contracts[]`,
`manifest`, `brand{platform,display}`, `systemPrompt{source,sha256,text}`,
`stats{}`. No timestamps, no absolute paths, keys sorted, chunk order stable.

## 15. Validation Procedure

Build-twice hash equality; unique chunk IDs (486/486); zero chunks missing core
fields; 13 representative retrieval cases (matrix in the FIFI-05 report — all
PASS, incl. DigiHouse-legacy, scam-question, injection, repo/hacking, live-data,
unknown, conflict); stale-weekly/`prop-*`/DigiHouse scans clean; en/fa parity
holds.

## 16. Known Limitations

- Chunking is structural, not semantic-embedding-tuned (by design at this stage).
- `sensitivity` uses a documented pattern rule; edge docs default to standard.
- Villa chunks are en-only; fa estate answers translate at response time.
- `MIXED` document-level aggregate awaits formal FIFI-05-follow-up admission
  (recorded C-PROV-01; behaviorally safe today).
- F-BRAND-01: 30 narrow fa docs carry no brand token — chunk-build brand context
  (`platform` + `brandDisplay` fields) is the specified mechanism; no body stuffing.

## 17. Future Extension Points

Vector index over `text` + metadata filters; DecisionEngine consuming
`sensitivity/scopeClass/requiresLiveData/entities`; live-data tool layer keyed by
the flagged docIds; context envelope joining `contextHints`; rename via
`rag/brand.json`; re-verify estate docs post-Phase-9-refactor before trusting new
tab copy in retrieval ranking.

---

*End of FIFI-INGESTION-V1. Next: FIFI-06 (per roadmap sequence; do not start automatically).*
