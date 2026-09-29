# FIFI-EVALUATION-V1 — Evaluation Harness, Grounding & Quality Benchmark

**Status:** BENCHMARK / AUTHORITATIVE quality gate for all future providers
**Slice:** FIFI-10 (harness only — no LLM, no Laya, no server, no embeddings)
**Date:** 2026-09-29
**Baseline:** 84 cases — routing 100% · retrieval 95% · grounding/safety/security/static-live/clarification/next-step/persian 100%

> This benchmark evaluates future AnswerProviders/LLMs without changing its contract.
> It measures Truth × Safety × Usability — never a single vanity score.

---

## 1. Purpose & Scope

Prove the pre-AI foundation routes, grounds, guards, and fails safely on real
Persian/English questions before any model connects. `src/lib/fifi/evaluation/`.

## 2. Dataset Structure (84 cases, stable IDs)

`cases.ts` index + `cases-1/2/3.ts` (product 20, estate 15, economics 10, live 10,
navigation 5, fa terminology 5, ambiguous 5, adversarial 12, security 2). Fields:
id, locale, question, context (propertyId/route/subject), partial expectations
(intent, category, scope, dataMode, level, docIdContains/Absent, topLocale,
minHits, liveCapabilities, status, nextStepKind, action, mustContain/NotContain,
provenanceInSources), notes. `validateDataset` rejects malformed/unknown-enum/
duplicate cases.

## 3. Case Taxonomy & Difficulty

L1 direct ("What is fractional ownership?") → L2 product-specific → L3 contextual
("این ویلا..." + propertyId) → L4 multi-concept → L5 ambiguous/adversarial
("این یعنی تضمینیه؟", "Are you a scam?"). Persian-first (≥50%, natural phrasing,
mixed terms, spelling variation); English coverage maintained.

## 4. Routing / Retrieval / Grounding Evaluation

Exact-enum decision diffs; Hit@K + absence + topLocale retrieval checks; hard
grounding rule (every $/% figure must occur in used evidence — enforced by
re-issuing deterministic retrieval + live reads in the runner). Hallucination
traps: unavailable earnings, чужой portfolio, availability, guarantees,
UNKNOWN occupancy, estimated-only valuation, tier-less membership.

## 5. Provenance / Currentness / Static-Live Firewall

Six provenances + current/historical/projected + accrued/paid verified end to
end; silent collapse fails. Static explains, live serves; mixed only via
`both` with separate traceability.

## 6. Security / Safety / Next-Step / Navigation / Property / Persian / Brand

Cross-user + identity-override + serialization secret scans; 03A matrix behavior
(boundary + alternative, never exact-wording match); `hasNextStep` on every
non-resolved case; structured action IDs (no URLs, no execution); canonical
`re-*` preserved, legacy never canonical, unknown names never invented; fa
locale/semantics/terminology/RTL checks; brand-swap invariance (logic + ranking
identical with brand fields stripped).

## 7. Metrics (diagnostic, per-metric numerator/denominator/failed-IDs)

Routing, retrieval, grounding, staticLive, safety, clarification, nextStep,
security, persian. Baseline §0. Failed case IDs visible in test output and the
machine-readable report (`buildReport`/`serializeReport`, redacted, stable,
ordered).

## 8. Determinism & Maintenance

Same repo state + fixtures → same results (fingerprint per case; full double-run
avoided for speed — decision/retrieval are separately proven deterministic).
Fixtures fixed when wrong (documented below); production fixed only on genuine
contract gaps (documented). Reports reproducible via the suite test.

## 9. Production Fixes Discovered (all documented, regression-covered)

Rule engine: product-hint entry, `tell-me-about`/`how-many` learn markers,
`\bshares?\b`, income economics terms (rate/scenario/average), fee/1% withdrawal
routing, estate fa nouns, take-me-to navigation, nav-verb requirements (fa),
PRICE duration-lookahead (چقدر طول ≠ value), display-brand gated to
identity-questions, ownership-before-estate, income-before-estate.
Retrieval: whole-word Latin + minimal stemming (incl. conservative fa suffix
strip), definition boost for title-about single-token queries, focus tie-break,
degenerate-chunk merge at build, رو stopword.
Fixtures: e08 concept-first routing, c05 canonical fee doc, l06 limitation note,
l08 no-tier-assignment, a02 no-invention, p03 unavailable-by-design, f05
evidence-set calibration.

## 10. Known Limitations (pre-LLM)

Mixed concept+live in one answer needs answer-layer work (engine routes live-only
except price path); term-vs-guide ranking ties near K boundary; fa morphology
beyond conservative stemming; weights are heuristic, not learned.

## 11. Infrastructure Status

None required or added: no LLM, Laya, server, API, DB, embeddings, paid service.
$0 holds. Full suite ~9s.

## 12. Future LLM Usage

Run `Question → Fifi → Real AnswerProvider → same harness`: grounding,
unsupported-claim, safety, next-step, locale, navigation, and provenance checks
apply unchanged. No benchmark rewrite needed.

---

*End of FIFI-EVALUATION-V1. Next: FIFI-11 (do not start automatically).*
