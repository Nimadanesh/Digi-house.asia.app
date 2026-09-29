# FIFI-DECISION-ENGINE-V1 — DecisionEngine Interface & Routing Contract

**Status:** CONTRACT + REFERENCE IMPLEMENTATION / AUTHORITATIVE for Fifi routing
**Slice:** FIFI-06 (decision layer only — no chat UI, no answer generation, no live integrations)
**Date:** 2026-09-29
**Builds on:** CONTRACT-V1, SCHEMA-V1, SCOPE-AND-SAFETY-CONTRACT-V1, VALIDATION-V1, INGESTION-V1

> **DecisionEngine decides what Fifi should do; it does not decide what Fifi should say.**

---

## 1. Purpose & Architecture

One visible assistant; internal classification after the question:

```text
User → Fifi → DecisionEngine → information/action path → Fifi answer
                ├── Retrieval (static KB build, FIFI-05)
                ├── Live Data Layer (future; flagged docIds)
                └── Navigation Layer (structured action IDs)
```

Separation enforced: engine (decide) / retrieval (find) / live data (current state) /
answer layer (explain) / navigation (execute). Never collapsed into one model call.

## 2. Interface (`src/lib/fifi/decision-engine.ts`)

```ts
interface DecisionEngine {
  readonly providerName: string;
  decide(input: DecisionInput): Promise<FifiDecision> | FifiDecision;
}
```

`createDecisionEngine("rule-based" | "laya")` factory (default rule-based);
`withSafeFallback()` wrapper guarantees a valid decision even on provider failure.
Methods are pure and side-effect free; `decide` never throws through the wrapper.

## 3. Input Contract (`DecisionInput`)

`message*`, `locale`, `route?`, `propertyId?` (canonical `re-*` only),
`screenContext?`, `authState?` (authenticated|anonymous|unknown — never tokens),
`conversationContext?` (bounded plain text), `learningSignal?`. Minimum necessary
context; no secrets, wallet credentials, private keys, or raw sensitive state.

## 4. Output Contract (`FifiDecision`)

`intent` (8-value enum) · `category` (13-value enum) · `scope` (4-value enum) ·
`knowledgeRequirement` (static|live|both|neither) · `needsClarification` +
`clarificationReason` · `navigation?` (actionId + params, never URLs) ·
`learningLevel` (beginner|intermediate|advanced|unspecified) · `nextStepHint?`
(internal token for the answer layer's useful-refusal/alternative) ·
`source` (deterministic|model|hybrid|fallback) · `fallback` (none |
low_confidence | provider_unavailable | provider_error).

## 5. Intent / Category / Scope Taxonomy

Intents: explain, learn, navigate, troubleshoot, retrieve_live_data, clarify,
restricted, out_of_scope. Categories: product, estate, ownership, income,
withdrawal, card, club, referral, terminology, account, troubleshooting,
safety_trust, other. Scopes mirror the safety contract: in_scope, restricted,
out_of_scope, never_disclose_or_perform. Categories are routing metadata, never a
user-facing choice.

## 6. Static / Live Routing

Rule order guarantees the firewall: explicit navigation wins over live keywords
("Open my portfolio" navigates); user-state questions ("How much have I earned?",
holdings, withdrawal/tx/club state) route `retrieve_live_data` + `live`; price
with property context routes `both` (concept + current value), without context
routes `clarify/ambiguous_property`. Static text is never a source of current values.

## 7. Property Context

"this villa" + `propertyId` → resolved with `both` requirement and sub-category
(location→estate, income→income, buy/share→ownership). Without context →
`clarify/ambiguous_property` with `ask_which_villa` hint. Users never repeat IDs
the app already provides.

## 8. Clarification Rules

Clarify only when ambiguity changes the action/information (unknown property for
price/estate questions; empty input). Otherwise route directly. The answer layer
renders `clarificationReason` as a short natural question.

## 9. Navigation Contract

Canonical `action.*` IDs (`open-home/marketplace/estate/portfolio/earnings/card/
club/invite/wallet`), property param only for `open-estate`. Engine returns actions;
it never executes them and never emits URLs.

## 10. Safety Routing

Stage-ordered: never-disclose (extraction, secrets, repo, hacking, agent/model
internals, injection imperatives) → out-of-scope (sexual, political, unrelated) →
restricted (fraud accusations→safety_trust, guarantees/advice→income,
legal-tax→withdrawal, persuasion→referral) — each with a `nextStepHint` encoding
short-boundary + useful-alternative. No refusal prose generated here.

## 11. Financial Routing

Six-way split preserved: educational explanation vs product fact vs live user state
vs projection vs advice vs guarantee; projected/accrued/paid and ANR/ADR
distinctions intact via category + knowledge-requirement routing. The 1%
classification stays neutral/reserved; economics untouched.

## 12. Laya Adapter (`src/lib/fifi/laya-engine.ts`)

Same interface; server-side fetch to `FIFI_LAYA_ENDPOINT` (optional
`FIFI_LAYA_API_KEY`); untrusted model output mapped through enum allowlists with
deterministic fallback for unknown values; unconfigured → transparent deterministic
delegation (`fallback: provider_unavailable`); errors → `provider_error`. No weights
bundled, no new dependencies, $0-compatible (dormant unless configured).

## 13. Provider Abstraction & Determinism

Default provider is deterministic (`rule-based-v1`); source recorded per decision
for testability. Prefer rules where sufficient; models add judgment later through
the same interface.

## 14. Error Handling & Observability

`safeFallbackDecision()` (clarify/other, `ambiguous_request`, `ask_what_to_help_with`)
on empty input, invalid output, or exceptions — failures degrade to a useful next
step, never arbitrary behavior. Observable: provider name, intent, category, scope,
static/live, clarification, navigation, level, source, fallback. Secrets and
personal data never logged (nothing is logged at all in this slice).

## 15. Security Boundaries

No credentials in code; endpoint via env (server-side); input contract excludes
secrets by type; retrieved KB treated as untrusted (engine consumes no KB text —
patterns only, so injection via corpus is structurally impossible at this layer).

## 16. Brand Independence

Routing carries zero display-brand literals (test-enforced): product-identity
questions resolve data-driven via the `rag/brand.json` mirror (`DISPLAY_NAMES`,
`LEGACY_BRAND_ALIASES`, sync-tested). Legacy names route as migration context.
A rename changes config, never this logic.

## 17. Extension Points

New intents/categories (additive enum + stage + tests); new providers (implement
interface); live-data tool layer keyed by flagged decisions; conversation memory
via `conversationContext`; learning-level refinement via `learningSignal`.

## 18. Verification (this slice)

25/25 vitest green (`src/lib/fifi/__tests__/decision-engine.test.ts`: product,
legacy, education, terminology en/fa, context±property, live split, withdrawal,
navigation en/fa, club/referral, 6 safety cases, fallback, factory default, Laya
degradation, wrapper safety, brand sync, brand-literal absence); `tsc --noEmit`
clean; `eslint src/lib/fifi/` clean. Defects fixed in-slice: regex-as-function
call, case-sensitive matching (single lowercase normalization), navigation/live
ordering, `fraction` substring hijack, legacy-alias casing, type import paths.

---

*End of FIFI-DECISION-ENGINE-V1. Next: FIFI-07 (do not start automatically).*
