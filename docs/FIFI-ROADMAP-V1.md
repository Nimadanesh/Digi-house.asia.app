# Fifi — AI Concierge & Learning System

## FractionalLuxe Product Roadmap v1.0

**Status:** ROADMAP / PLANNING
**Implementation:** Slice-based
**Primary goal:** Build Fifi into a production-grade AI Concierge, Learning Assistant, Product Guide, and Knowledge Interface for FractionalLuxe.

---

# Current Baseline — 2026-09-30

The roadmap below contains the original planning sequence. The implemented state is now ahead of that historical sequence. The following is the authoritative current status for planning the next phase.

## Completed and validated

- FIFI-01 through FIFI-10: Knowledge audit, schema, rewrite, safety hardening, validation, deterministic ingestion, DecisionEngine, retrieval, live-data boundary, answer orchestration, and evaluation.
- Answer Quality rewrite and audit: completed on `fifi/answer-quality-v1`.
- Retrieval expectations finalized; Answer Quality baseline frozen at commit `a3490ed` on that branch.
- Canonical 24-Estate knowledge remains authoritative and dynamic values remain outside static knowledge.
- The Knowledge Foundation, human-facing answer standards, UI answerability, and few-shot response examples are in place.
- Final model framework audit added explicit contracts for low-capability models and runtime availability/access/limits.

## Next implementation sequence

1. Fifi UI Prototype / global assistant surface.
2. UI runtime states: ready, thinking, degraded, unavailable, rate-limited, access-restricted, live-data-unavailable, failed/retry.
3. Real AnswerProvider integration using the frozen Knowledge/Answer Quality baseline.
4. Only when real integration requires it: provision server-side model access and any LLM/Laya credentials or infrastructure.
5. Validate against the frozen benchmark before production rollout.

## Important planning rule

The historical phase labels below must not be interpreted as evidence that unfinished infrastructure should be implemented automatically. The next Slice must follow the current baseline above and must preserve the existing contracts.

# 1. Product Vision

Fifi is the single AI interface through which a FractionalLuxe user can:

* understand the FractionalLuxe business;
* understand every important concept and terminology;
* learn how to use the application;
* discover where a feature or action is located;
* understand Estate information;
* understand Portfolio, Earnings, Wallet, Club, Referral, and other product areas;
* troubleshoot common problems;
* ask contextual or unrelated follow-up questions;
* receive answers in the user's language, especially Persian;
* navigate directly to the relevant area of the application;
* progressively learn without requiring a separate training course.

Fifi must feel like a **premium private concierge**, not a generic chatbot.

The user should not need to understand how Fifi works.

They should only need to know:

> **"If I don't know something, I ask Fifi."**

---

# 2. Core Product Principle

## One Assistant, One Place

FractionalLuxe must have one globally recognizable entry point:

**Fifi**

The user must never need to decide which assistant, help section, support area, or contextual chatbot to use.

The primary interaction is:

```text
Fifi Button
    ↓
Single ChatSheet / Chat Experience
    ↓
Fifi understands context internally
    ↓
Fifi answers / teaches / navigates / troubleshoots
```

Context may include:

* current route;
* current Estate/property;
* locale;
* relevant non-sensitive product state;
* relevant application state;
* conversation context.

Context must remain an implementation detail rather than becoming multiple visible assistants.

---

# 3. What Fifi Is

Fifi has five primary responsibilities.

## 3.1 Explain

Explain:

* Fractional Ownership;
* Shares;
* Estates;
* Valuation;
* Rental Income;
* Yield;
* Earnings;
* Ownership;
* Fees;
* Withdrawal;
* Wallet;
* Club;
* Referral;
* and other relevant concepts.

Explanations must be understandable to non-technical users.

---

## 3.2 Teach

Fifi must progressively teach the user how FractionalLuxe works.

Examples:

> "I'm new here. What should I do first?"

> "What does Yield mean?"

> "How does buying a share work?"

> "How do I understand this Estate?"

Teaching must be short, progressive, and actionable.

---

## 3.3 Guide

Fifi must help users perform actions inside the application.

Examples:

> "Where is Club?"

> "How do I see my earnings?"

> "Where can I connect my wallet?"

Whenever possible, navigation answers should include a direct action:

* Open Club →
* Open Marketplace →
* Open Estate →
* Open Portfolio →
* Open Wallet →
* etc.

Fifi should not merely describe navigation when the application can directly navigate the user.

---

## 3.4 Answer

Fifi must handle both:

### FractionalLuxe questions

and

### Relevant adjacent questions

Examples:

> "What is a wallet?"

> "What is USDT?"

> "What is fractional ownership?"

> "What does yield mean?"

The knowledge system should distinguish between FractionalLuxe-specific knowledge and general educational knowledge.

---

## 3.5 Protect Trust

Fifi must never invent:

* financial figures;
* Estate figures;
* availability;
* earnings;
* ownership;
* transaction status;
* fees;
* investment returns;
* business rules;
* or application capabilities.

Unknown information remains unknown.

Fifi must prefer:

> "Data is currently unavailable."

over:

> fabricated or inferred numbers.

---

# 4. Product Architecture

Fifi should be designed as a layered system:

```text
                         USER
                           │
                           ▼
                    ┌─────────────┐
                    │    FIFI     │
                    │ Chat UI     │
                    └──────┬──────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │ Context Builder  │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Decision Engine  │
                 │      Laya        │
                 └────────┬─────────┘
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
          Intent       Category      Routing
             │            │            │
             └────────────┼────────────┘
                          ▼
                 ┌──────────────────┐
                 │ Knowledge Layer  │
                 └────────┬─────────┘
                          │
              ┌───────────┼────────────┐
              ▼           ▼            ▼
          Static KB    Product KB   Estate KB
              │           │            │
              └───────────┼────────────┘
                          ▼
                 ┌──────────────────┐
                 │ Live Data Layer  │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Response Engine  │
                 └────────┬─────────┘
                          │
              ┌───────────┼────────────┐
              ▼           ▼            ▼
           Answer      Navigation    Learning
```

---

# 5. Critical Data Boundary

This is a non-negotiable architectural rule.

## Stable knowledge

Static or slowly changing knowledge may come from the Knowledge Base / RAG:

* product explanations;
* business explanations;
* terminology;
* user guides;
* policies;
* FAQs;
* troubleshooting documentation;
* Club explanations;
* Referral explanations;
* Estate descriptive information where appropriate.

## Live information

Dynamic information must NOT be retrieved from stale embeddings.

Examples:

* current price;
* current availability;
* current earnings;
* portfolio balance;
* holdings;
* transaction state;
* current membership state;
* other user-specific or dynamic values.

These must come from the appropriate repository/API/live-data layer.

```text
Stable Knowledge → Knowledge/RAG

Live Numbers → Repo/API/Live Data

Never:
Live Numbers → Embedding → AI answer
```

---

# 6. Financial Trust Rules

Fifi must inherit and enforce FractionalLuxe's existing provenance and honesty rules.

Important concepts include:

* OBSERVED
* ESTIMATED
* DERIVED
* PROJECTED
* UNKNOWN
* CONFLICTED

Fifi must preserve the distinction between:

* projected vs accrued;
* accrued vs paid;
* ANR vs ADR;
* estimated vs observed;
* current vs historical;
* canonical data vs legacy/research data.

If two sources conflict, Fifi must not silently choose one.

It must either use the approved Source of Truth or explicitly surface the uncertainty according to product rules.

---

# 7. Existing `rag/` Folder Strategy

The existing `rag/` folder is not to be discarded.

It becomes the foundation for Fifi's Knowledge Layer.

Existing valuable assets include:

* global provenance/rules;
* canonical Villa documents;
* deterministic Villa document generation;
* ingestion conventions;
* system prompt;
* product document indexes;
* Villa documentation contracts.

However, the current RAG implementation remains **FROZEN until its knowledge is reconciled with the current Product and Business Source of Truth.**

The existing RAG content must not be treated as automatically authoritative.

---

# 8. Knowledge Architecture

The Knowledge Base should ultimately be organized into clear domains.

## Product Knowledge

How FractionalLuxe works as an application.

Examples:

* Home;
* Marketplace;
* Estate;
* Portfolio;
* Earnings;
* Wallet;
* Card;
* Club;
* Referral;
* navigation;
* onboarding.

---

## Business Knowledge

How the FractionalLuxe business model works.

Examples:

* fractional ownership;
* Estate structure;
* Shares;
* rental economics;
* ownership model;
* income model;
* fees;
* withdrawal rules;
* applicable limitations.

Only approved business rules may become authoritative knowledge.

---

## Estate Knowledge

Canonical information for the 24 approved Estates/Villas.

Estate information must retain:

* canonical property ID;
* name;
* location;
* rental information;
* relevant estate data;
* provenance;
* confidence;
* unknown fields;
* conflict status.

Estate documents must remain generated from the canonical Estate data source rather than manually edited.

---

## User Guide Knowledge

Step-by-step application instructions.

Examples:

* how to register;
* how to connect a wallet;
* how to browse Estates;
* how to purchase;
* how to view Portfolio;
* how to view Earnings;
* how to withdraw;
* how to use Club;
* how to invite someone.

---

## Glossary

Every important product term should have a structured definition:

```text
English term
Persian equivalent
Simple explanation
Technical/product explanation
Example
Related concepts
```

For example:

```text
Yield
بازده

Simple:
The return generated by an investment over a defined period.

Product context:
How FractionalLuxe presents the relevant return metric.

Example:
Use an approved Estate example only when the required data is available.
```

---

## FAQ

Common questions grouped by domain.

---

## Troubleshooting

Known problems and safe resolutions.

---

# 9. Persian-First Learning Layer

Persian is a first-class learning language, not merely a translated UI.

For Persian responses:

```text
English concept
        ↓
Persian equivalent
        ↓
Simple Persian explanation
        ↓
FractionalLuxe-specific context
        ↓
Example when safe and supported
```

Fifi must support:

* RTL-aware presentation;
* Persian terminology;
* English technical terminology where useful;
* simple explanations for beginners;
* consistent translations;
* avoidance of raw localization keys;
* Persian examples;
* culturally natural conversational language.

The system must never assume that translating English output after generation is equivalent to Persian-first knowledge design.

---

# 10. Decision Engine

The selected decision technology for the current architecture is:

## Laya

Laya should be used for typed decisions rather than free-form answer generation.

Potential decisions include:

* intent;
* category;
* navigation vs explanation vs troubleshooting;
* whether live data is required;
* whether clarification is required;
* user learning level;
* answer routing.

Example:

```json
{
  "intent": "estate_economics",
  "category": "estates",
  "needs_live_data": true,
  "needs_clarification": false
}
```

However, the application must not hard-code the entire product around Laya.

Create a stable internal interface:

```text
DecisionEngine
```

with Laya as the current implementation.

This preserves the ability to replace the implementation later without redesigning Fifi.

---

# 11. Conversation Categorization

The user must NOT be forced to choose a category before asking a question.

The experience remains:

> Ask anything.

After or during the conversation, the system may classify it into categories such as:

* Getting Started
* Platform
* Estates
* Investing
* Earnings
* Wallet
* Club
* Referral
* Troubleshooting
* General Learning

Categories exist primarily for:

* organization;
* conversation history;
* analytics;
* learning personalization;
* routing.

They are not gates.

---

# 12. Contextual Awareness Without Multiple Assistants

Fifi is one assistant.

However, it may receive internal context.

Example:

```text
route:
 /marketplace/property/128862

propertyId:
 128862

locale:
 fa

relevant product context:
 estate detail
```

If the user asks:

> "این ویلا چطور درآمد ایجاد می‌کنه؟"

Fifi should understand that "این ویلا" refers to the currently viewed Estate.

The context must remain invisible unless useful to explain the answer.

---

# 13. Navigation Actions

Fifi responses should support structured actions where appropriate.

Examples:

```text
Open Club →
Open Estate →
Open Portfolio →
Open Earnings →
Open Wallet →
Start Tutorial →
```

Navigation should use the application's existing routing architecture rather than inventing URLs.

Fifi must not expose broken or speculative routes.

---

# 14. Learning System

Fifi should progressively move the user from:

```text
Unknown
    ↓
Understand
    ↓
Explore
    ↓
Act
    ↓
Understand outcome
    ↓
Become independent
```

Learning should be short and contextual.

Avoid forcing users through long courses.

---

# 15. Interactive Tutorials

Where technically appropriate, Fifi may initiate guided flows.

Example:

> "How do I buy a share?"

Fifi:

```text
1. Open Marketplace
2. Select an Estate
3. Review the Estate
4. Review ownership details
5. Continue to purchase
```

Then:

**Start Tutorial →**

The tutorial should guide the user through the real UI.

The tutorial must never execute financial actions automatically.

---

# 16. Privacy

Sensitive user data must not be sent to an LLM unnecessarily.

Particularly:

* wallet addresses;
* Telegram initData;
* authentication secrets;
* unnecessary personal information;
* private transaction information.

LLM access should be server-side when real AI integration is introduced.

The client should never contain private model credentials.

---

# 17. Fifi Personality

Fifi should feel:

* warm;
* concise;
* intelligent;
* premium;
* calm;
* trustworthy;
* helpful;
* never childish;
* never overly corporate;
* never excessively verbose.

Fifi should not behave like a generic AI assistant.

Its personality should reflect:

**Luxury + clarity + confidence + discretion.**

It should never use hype to compensate for missing information.

---

# 18. UX Principles

Fifi UI must:

* be accessible from one consistent location;
* remain visually lightweight;
* feel native to FractionalLuxe;
* work correctly in RTL;
* work across all 12 locales;
* respect the existing design system;
* support 480×840 mobile/WebView constraints;
* avoid clutter;
* maintain premium visual hierarchy;
* avoid turning every screen into an AI interface.

The Fifi experience should be discoverable but not intrusive.

---

# 19. Roadmap

## PHASE 0 — Product & Knowledge Audit

Goal:

Establish the authoritative truth before Fifi is allowed to answer real questions.

Tasks:

* audit current `rag/`;
* identify stale/superseded documents;
* reconcile business-rule conflicts;
* reconcile Estate page documentation with final UI;
* identify Source-of-Truth files;
* identify dynamic vs static data;
* define knowledge ownership;
* define provenance requirements.

Output:

**Fifi Knowledge Contract v1**

---

# PHASE 1 — Knowledge Foundation

Goal:

Turn the existing `rag/` folder into a clean, versioned Knowledge Foundation.

Tasks:

* preserve valid existing knowledge;
* remove superseded ingestion artifacts;
* restructure product documentation;
* define metadata/front matter;
* define document IDs;
* define domains/categories;
* define provenance;
* define locale strategy;
* define Persian learning schema;
* define regeneration rules for Estate documents.

Output:

**Production-ready static Knowledge Base structure**

No real LLM required.

---

# PHASE 2 — Fifi UX Foundation

Goal:

Build the actual product surface.

Tasks:

* Fifi identity;
* global Fifi button;
* ChatSheet;
* empty state;
* conversation UI;
* suggested questions;
* loading state;
* error state;
* RTL;
* localization;
* responsive QA;
* premium visual treatment.

The initial response engine may be mock/rule-based.

Output:

**Fifi UI MVP**

---

# PHASE 3 — Decision Layer

Goal:

Create the routing brain.

Tasks:

* DecisionEngine interface;
* initial rule-based fallback;
* Laya adapter;
* intent schema;
* category schema;
* navigation classification;
* live-data requirement classification;
* clarification classification;
* learning-level classification.

Output:

**Typed Fifi routing layer**

---

# PHASE 4 — Static Knowledge Retrieval

Goal:

Connect Fifi to validated static knowledge.

Tasks:

* retrieval pipeline;
* document filtering;
* metadata filtering;
* category-aware retrieval;
* provenance-aware retrieval;
* answer grounding;
* source-aware responses;
* fallback when no reliable answer exists.

Output:

**Fifi can answer validated product/business/learning questions from the Knowledge Base.**

---

# PHASE 5 — Live Product Data

Goal:

Connect Fifi to current application state safely.

Tasks:

* define approved live-data tools/interfaces;
* Estate dynamic data;
* Portfolio data;
* Earnings data;
* transaction state;
* membership state;
* other approved dynamic information.

Hard rule:

Live data must come from the appropriate repository/API layer, not embeddings.

Output:

**Fifi can safely answer current-state questions.**

---

# PHASE 6 — Navigation & Actions

Goal:

Make Fifi capable of helping users actually use the application.

Tasks:

* structured navigation actions;
* deep links;
* Open Estate;
* Open Marketplace;
* Open Portfolio;
* Open Earnings;
* Open Wallet;
* Open Club;
* Open Referral;
* Start Tutorial.

Output:

**Fifi becomes an in-app guide rather than a text-only chatbot.**

---

# PHASE 7 — Persian Learning Excellence

Goal:

Make Persian one of Fifi's strongest experiences.

Tasks:

* Persian glossary;
* Persian examples;
* beginner-friendly explanations;
* RTL QA;
* terminology consistency;
* Persian intent evaluation;
* Persian ambiguity handling;
* English/Persian mixed-language handling.

Output:

**High-quality Persian-first Fifi experience.**

---

# PHASE 8 — Conversation Intelligence

Goal:

Turn conversations into a learning system.

Tasks:

* automatic categorization;
* conversation metadata;
* history organization;
* recurring-question detection;
* learning progress;
* personalized suggestions;
* safe conversation continuity.

Output:

**Fifi becomes progressively more useful to returning users.**

---

# PHASE 9 — Interactive Education

Goal:

Connect answers to real application workflows.

Tasks:

* guided tutorials;
* step-by-step flows;
* contextual explanations;
* "Show me how" actions;
* safe navigation;
* completion tracking where appropriate.

Output:

**Users can learn by doing.**

---

# PHASE 10 — Evaluation & Quality

Goal:

Prove Fifi is reliable before production expansion.

Build an evaluation set of at least:

**50–100 real Persian user questions**

covering:

* onboarding;
* business;
* Estates;
* economics;
* Wallet;
* Club;
* Referral;
* troubleshooting;
* navigation;
* ambiguous questions;
* unsupported questions.

Measure:

* intent accuracy;
* category accuracy;
* retrieval relevance;
* factual grounding;
* hallucination rate;
* Persian quality;
* navigation correctness;
* live-data correctness;
* unknown-data handling;
* response latency.

No model should be selected based solely on public benchmarks.

---

# PHASE 11 — Production Hardening

Goal:

Make Fifi production-grade.

Tasks:

* server-side LLM integration;
* authentication boundaries;
* rate limiting;
* observability;
* error handling;
* privacy;
* abuse protection;
* latency optimization;
* caching where safe;
* cost controls;
* fallback behavior;
* monitoring.

Output:

**Production-ready Fifi**

---

# 20. Slice Strategy

Fifi must NOT be implemented as one giant task.

Implementation should proceed through small, auditable Slices.

Recommended sequence:

```text
FIFI-01
Knowledge / Source-of-Truth Audit

FIFI-02
Knowledge Schema & Contracts

FIFI-03
RAG Folder Cleanup / Restructure

FIFI-04
Persian Learning Layer

FIFI-05
Fifi UI Foundation

FIFI-06
DecisionEngine Interface

FIFI-07
Laya Adapter

FIFI-08
Static Retrieval

FIFI-09
Grounded Answer Engine

FIFI-10
Live Data Boundary

FIFI-11
Navigation / Deep Links

FIFI-12
Conversation Categorization

FIFI-13
Interactive Tutorials

FIFI-14
Persian Evaluation

FIFI-15
Production Hardening
```

Slices may be reordered if the current Product development state requires it, but no Slice may bypass the Source-of-Truth and trust requirements.

---

# 21. Definition of Done

A Fifi Slice is not PASS merely because:

* code compiles;
* tests pass;
* route loads.

Every Fifi Slice must include:

## Logic QA

* scope respected;
* Source-of-Truth respected;
* no invented business rules;
* no financial hallucination paths;
* correct data boundaries;
* correct fallback behavior.

## Design/UI QA

* visual hierarchy;
* spacing;
* typography;
* responsiveness;
* 480×840;
* RTL;
* all supported locales;
* no raw translation keys;
* empty/loading/error states;
* touch targets;
* premium polish;
* consistency with FractionalLuxe design language.

## AI QA

Where applicable:

* grounding;
* intent routing;
* category routing;
* unsupported-question behavior;
* ambiguity;
* provenance;
* UNKNOWN handling;
* prompt injection resistance.

The Agent must identify and fix obvious issues before reporting PASS.

---

# 22. Non-Negotiable Rules

1. Fifi is one assistant.
2. The user must never be forced to select a category before asking.
3. Laya is the current Decision Engine choice.
4. Laya must sit behind an internal DecisionEngine interface.
5. No unnecessary AI dependency should be added to the client bundle.
6. No LLM API secret may be exposed client-side.
7. Stable knowledge may come from RAG.
8. Dynamic numbers must come from approved live data.
9. UNKNOWN must remain UNKNOWN.
10. Conflicted data must not be silently resolved.
11. Legacy/research data must not override canonical data.
12. Fifi must never invent financial information.
13. Persian is a first-class language.
14. Navigation answers should provide actions where technically possible.
15. Fifi must remain optional and non-intrusive.
16. Fifi must complement the Product, not replace Product UX.
17. Every new FractionalLuxe feature must have a defined Knowledge/Assistant integration path.
18. Business-rule changes must trigger Knowledge synchronization.
19. Estate data changes must trigger deterministic Estate knowledge regeneration.
20. Every production Slice must pass both functional and Design/UI QA.

---

# 23. Future-Proofing Requirement

Fifi must be designed so that adding a new FractionalLuxe feature does not require rebuilding Fifi.

For example:

```text
New Club feature
       ↓
Updated Source of Truth
       ↓
Knowledge regeneration/update
       ↓
Fifi automatically gains knowledge
```

Likewise:

```text
New Referral feature
       ↓
Referral documentation + rules
       ↓
Knowledge update
       ↓
Fifi understands Referral
```

The architecture must therefore separate:

* UI;
* Knowledge;
* Decision logic;
* Retrieval;
* Live data;
* Response generation;
* Navigation.

---

# 24. Final Product Definition

Fifi is successful when a new user can enter FractionalLuxe and reasonably expect:

> "If I don't understand something, I can ask Fifi."

And when the user asks, Fifi should be able to:

```text
UNDERSTAND
    ↓
CLASSIFY
    ↓
FIND TRUSTWORTHY INFORMATION
    ↓
CHECK LIVE DATA IF REQUIRED
    ↓
EXPLAIN SIMPLY
    ↓
SHOW THE USER WHAT TO DO
    ↓
NAVIGATE THEM THERE
    ↓
HELP THEM LEARN
```

The final goal is not to build "a chatbot."

The goal is to build:

> **The intelligence layer of the FractionalLuxe product experience.**

Fifi should become one of the reasons FractionalLuxe feels easier to understand, easier to use, and more trustworthy than a conventional investment platform.
