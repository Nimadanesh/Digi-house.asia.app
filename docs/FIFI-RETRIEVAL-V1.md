# FIFI-RETRIEVAL-V1 — Retrieval Runtime & Knowledge Query Layer

**Status:** RUNTIME CONTRACT + IMPLEMENTATION / AUTHORITATIVE for static retrieval
**Slice:** FIFI-07 (retrieval only — no answer generation, no live-data fetching)
**Date:** 2026-09-29
**Builds on:** DECISION-ENGINE-V1, INGESTION-V1 (build artifact), all prior contracts

> Retrieval finds relevant approved knowledge. It never decides the answer.

---

## 1. Architecture

```text
Decision → KnowledgeRetriever → evidence chunks (+ live-data handoff) → Answer Layer (future)
```

`src/lib/fifi/retrieval.ts`: `KnowledgeRetriever` interface, `BuildRetriever`
(build-backed), `getDefaultRetriever()` (load-once cache — the build file is
immutable at runtime), `loadRetrievalBuild()`, `tokenize()`/`stemWord()` helpers.

## 2. Corpus Source

Exclusively `rag/build/fifi-knowledge-build.json` (486 chunks, 153 files).
No filesystem scans, no wildcards, no legacy sources at runtime. Excluded content
cannot surface: the build contains only manifest-approved records, and the
retriever defensively re-checks `eligible + ACTIVE + Tier≤2` per chunk.

## 3. Input / Output Contracts

Input: query*, locale, intent?, category?, scope?, propertyId?, route?,
knowledgeRequirement?, learningLevel?, topK? (default 5). No paths, no vector/DB
details, no engine syntax leak. Output: traceable hits (chunkId, docId, locale,
heading, text, authority, provenance, entities, relations, source, score +
scoreParts) + `liveData` handoff + `emptyReason?` + `deterministic: true`.

## 4. Ranking Model

IDF-weighted lexical relevance + structural bonuses: propertyId-exact +1000,
context-property +500, title-token 4×idf, heading-token 2.5×idf, body-token 1×idf,
locale +5, tier1 +3 / tier2 +2, exact-phrase +15. Content hit required (bonuses
alone never qualify). Latin matching is whole-word with a minimal trailing-s
stemmer ("villas"→"villa"; generic "work" never matches "works"); non-Latin by
substring. Ties prefer shorter focused chunks, then docId/locale. Scores are
internal only — never user-facing.

## 5. Authority / Provenance / Locale / Property Context

Authority is corpus membership + tier metadata, never raw similarity; Tier 3/4
absent by construction. All six provenances pass through untouched. Locale
prefers the request language with siblings available; RTL bytes preserved;
mixed terms (ANR) retrievable from Persian queries. Property resolution priority:
exact id (+1000) > active context (+500) > name/destination lexical > generic;
without context, similar villas co-surface instead of a silent single pick
(engine routes true ambiguity to clarify/`neither` → structured empty).

## 6. Scope, Safety & Live-Data Handoff

`never_disclose_or_perform`/`out_of_scope` → structured empty (`scope_excluded`);
`neither` → empty (`awaiting_clarification`); empty query / no match → safe
empties. Secrets scan clean (declarations only); no orchestration vocabulary in
chunks. `live`/`both` requirements return concept evidence plus an explicit
handoff (`required`, category, `needsPropertyContext`, `needsUserState`) — static
text never stands in for current values. Retrieved text is inert data: it cannot
alter instructions, policy, routing, tools, or navigation.

## 7. Limits, Empty Behavior, Multi-Doc

Top-K (default 5) with content-hit threshold; small-enough-to-reason,
large-enough-to-answer. Empties carry reasons the answer layer renders as
known/unknown/next-step. Multi-concept queries return multiple traceable chunks,
never one synthetic merge.

## 8. Determinism, Performance, Brand Independence

Identical query/context/corpus → identical order (tested). Corpus loads once;
no network, no services, stdlib-only, cold start = one JSON parse. Retrieval
logic carries zero display-brand literals (test-enforced); brand fields never
enter scoring (proven by identical ordering with brand-stripped input) — a rename
changes nothing here.

## 9. Extension Points

Vector/embedding provider behind the same `KnowledgeRetriever` interface when
justified (not now — $0 target holds); live-data tool layer consuming the handoff;
richer stemming; per-domain weights — all without changing callers.

## 10. Verification (this slice)

47/47 vitest green (25 decision + 22 retrieval: product, terminology en/fa, tabs,
context±collision, firewall ×3, multi-doc, authority, provenance, club/referral,
safety ×3, inert-text, empty/unknown, determinism, brand ×2, singleton);
`tsc` + `eslint` clean. Defects fixed in-slice: substring/generic-word inflation
→ whole-word + stemming; per-doc title flooding → focus tie-break; both with
regression tests. No answer-generation or live-data code added (status scan clean).

---

*End of FIFI-RETRIEVAL-V1. Next: FIFI-08 (do not start automatically).*
