# FIFI-ANSWER-ORCHESTRATION-V1 — Answer Orchestration & Provider-Independent Response Layer

**Status:** CONTRACT + REFERENCE IMPLEMENTATION / AUTHORITATIVE for Fifi answers
**Slice:** FIFI-09 (orchestration only — no chat UI, no LLM deployment)
**Date:** 2026-09-29
**Builds on:** DECISION-ENGINE-V1, RETRIEVAL-V1, LIVE-DATA-V1 (all reused, none duplicated)

> One global assistant: ask → understand → answer or guide to the next useful action.
> Evidence and generated prose stay structurally distinct, forever.

---

## 1. Purpose & Architecture

```text
Question → DecisionEngine → Retrieval (+ scope/authority/locale/context gates)
                         → LiveDataProvider (mapped capabilities, server-bound subject)
                         → evidence assembly → AnswerProvider → FifiResponse (+ trace)
```

`src/lib/fifi/`: `answer-types.ts` (contracts), `answer-provider.ts` (interface +
mock), `orchestrator.ts` (`askFifi`).

## 2. AnswerProvider Contract

Input: question, locale, decision, evidence, brandDisplay — never tokens, secrets,
URLs, internals, or prompts. Output: `FifiResponse`. Vendor-neutral; future LLM
providers implement the same interface with zero orchestration changes.

## 3. Orchestrator Contract

`askFifi(input, deps)` with injected engine/retriever/liveData/provider/brand.
Sequencing only: decide → conditional retrieval (static/both) → mapped live calls
→ evidence package → provider → sanitized response or structured fallback.
`sanitizeResponse` rejects malformed provider output; throw paths degrade to a
safe error response (no stacks leak).

## 4. Evidence Model

`{knowledge[], live[], context{route,propertyId,screen}, navigation?}` — sources
never merged. Live entries carry ok/errorCode/provenance/currentness/source;
failed lookups stay visible as failures. Knowledge hits keep IDs, provenance,
authority, entities.

## 5. Static/Live Boundary

Live values only from provider successes labeled with source; `mock-demo` never
presented as production truth; unavailable capabilities surface as structured
`unavailable`, never guesses. Capability mapping is explicit per category
(income→earnings.*, ownership→portfolio.*, withdrawal→withdrawal.status,
troubleshooting→transaction.status, estate→estate.current,
club/referral→NOT_IMPLEMENTED → unavailable path).

## 6. Safety Integration

FIFI-03A taxonomy reused (no duplicate). Scope flows into retrieval gates and
provider templates; technical state renders as plain language (no policy/prompt/
engine/retrieval vocabulary leaks — tested). Restricted/out-of-scope always pair
boundary + alternative.

## 7. Clarification / Navigation / Property Context

Structured clarification only on material ambiguity (`ambiguous_property` etc.),
rendered as short locale-aware questions. Navigation consumes `action.*` IDs
(never URLs, never executed here). Canonical `re-*` identity preserved end to end;
ambiguous property never silently resolves; legacy IDs never canonical.

## 8. Persian Behavior

Locale passthrough, fa evidence preferred by retrieval, RTL bytes intact, English
terms preserved, no raw keys, no internal IDs in prose. Terminology pattern
(term → fa → simple → product meaning) supported by evidence shape.

## 9. Provider Failures & Privacy

Throw/malformed/unavailable/unauthorized paths all degrade to structured states
with next steps. Trace holds safe metadata only (no tokens, payloads, questions
unlogged by design). Subjects server-bound; no cross-user paths exist.

## 10. Mock Provider

`mock-template-v1`: deterministic template composition from evidence excerpts +
provenance labels + hints. `answerOrigin: "mock-template"` on every output;
`confidence` medium only with real evidence, else null. Proves contracts; never
production intelligence.

## 11. Testing

25 orchestration tests (static, live, mixed, navigation, clarification ×2,
out-of-scope, restricted, empty→clarify, unavailable, unauthorized ×2, provider
throw/malformed, no-guess, provenance, safety-language, earnings distinctions,
fa, brand-swap, secrets, action IDs, origin, determinism) + source-hygiene test.
88/88 fifi-total green; `tsc` + `eslint` clean. Defects fixed: live-source `ok`
flag added to source refs; gibberish correctly clarifies (test expectations
corrected, not behavior); lint warning removed.

## 12. Infrastructure Status

None required or added. No server, DB, API, Laya, LLM, vector DB, queue, or paid
service. $0 target holds.

## 13. Future LLM Integration Boundary

Implement `AnswerProvider` against the same input contract; honor evidence-only
grounding, scope templates, and the never-guess rule; keep `answerOrigin` honest.
No orchestration rewrite needed.

---

*End of FIFI-ANSWER-ORCHESTRATION-V1. Next: FIFI-10 (do not start automatically).*
