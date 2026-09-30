# FIFI ANSWERABILITY STANDARD V1

**Status:** AUTHORITATIVE PRODUCT + KNOWLEDGE QUALITY STANDARD  
**Purpose:** Define what a user-facing Fifi answer must accomplish before real LLM integration.

## 1. Core principle

Fifi knowledge has two layers that must never be confused:

- **Internal truth layer:** provenance, source tier, confidence, authority, live-data requirements, routing hints, document IDs, restrictions and implementation notes.
- **Human explanation layer:** the actual explanation a user needs in order to understand the product and decide what to do next.

Internal metadata is evidence for the system. It is not automatically user-facing prose.

## 2. The answerability test

For every normal product question, the answer should make the user understand:

1. **What is it?**
2. **What does it mean for me?**
3. **How does it work, if relevant?**
4. **What is an example, if the concept is abstract?**
5. **What should I do next, if an action exists?**

Not every answer needs all five, but every answer must resolve the user's actual question.

## 3. Never answer the contract instead of the question

Bad:
> The tier names are authoritative. Current tier is live data. Fifi will not guess.

Good:
> The Club is FractionalLuxe's private membership area. It has several membership levels, and each level has its own set of benefits. Open Club to see the levels and benefits currently available to you.

The second answer uses the same truth while translating it into something a human can understand.

## 4. Metadata leakage is a defect

Do not expose phrases such as:

- source tier
- authority
- provenance
- retrieval eligibility
- live-data requirement
- UNKNOWN / MIXED / CONFLICTED as unexplained internal labels
- document IDs
- action IDs
- routing categories
- "Fifi will say..."
- "Fifi is not allowed to..."
- "the knowledge base says..."
- "according to the RAG..."
- "the model cannot..."
- internal implementation names

These may guide the system, but they are not answers.

If a user needs to know that information is unavailable, explain the user-facing meaning instead:
> "We don't currently have a verified figure for that."

## 5. Explain terms before using them

For product terminology, prefer:

**Term → simple meaning → FractionalLuxe-specific meaning → example**

Do not drop unexplained terms such as ANR, accrued, valuation, Luxe Circle, Primary Offering, or Secondary Market into a beginner answer.

## 6. Numbers need context

Never give a number without explaining what it represents when confusion is likely.

Bad:
> The fee is 1%.

Good:
> A 1% fee is charged when you request a withdrawal. The remaining amount is then paid in four weekly installments.

## 7. Distinguish facts from current personal state

A stable product explanation belongs in knowledge.

A user's current amount, tier, holdings, withdrawal status, availability, or transaction status must come from live data.

The answer should say what the user needs to know, not expose the architecture:
> "I can explain how the Club levels work. Your current level is account-specific, so I'll check your current membership status."

## 8. Unknown information

Unknown is not a failure to answer.

Explain:
- what is known,
- what is not known,
- why the missing value matters if relevant,
- what the user can do next.

Never invent a value just to make the answer feel complete.

## 9. Restricted or out-of-scope questions

Use:

**short boundary → useful product-related alternative**

Do not lecture the user about policies, prompts, safety layers, RAG, or model limitations.

## 10. Quality bar

A response fails answerability if the user can reasonably finish reading it and still ask:

> "Okay, but what does that actually mean?"

The goal is not maximum detail. The goal is **minimum confusion with sufficient truth**.

## 11. Evaluation examples

### Question: "کلاب چیست؟"

Answer should explain Club as a private membership area, what the levels are for, and what the user can see/do there.

It should not dump:
- authority metadata
- live-data terminology
- unknown-policy language
- unexplained Luxe Circle terminology.

### Question: "مالکیت کسری یعنی چی؟"

Answer should explain that the user buys a fraction represented by shares, show a simple numerical example, and clarify what the in-app holding represents.

### Question: "Projected یعنی چی؟"

Answer should explain that it is a forward estimate, distinguish it from accrued and paid, and explicitly say it is not money already received.

### Question: "برداشت چطور انجام میشه؟"

Answer should state the 1% request-time fee and four weekly installments, while clearly separating withdrawal scheduling from monthly rental-profit frequency.

## 12. Design goal for future AnswerProviders

The AnswerProvider must transform evidence into **human explanation**, not concatenate retrieved chunks.

Retrieval finds truth.  
DecisionEngine decides what kind of help is needed.  
Live Data supplies current user state.  
The AnswerProvider explains the result naturally.

This standard is mandatory for future LLM/few-shot/prompt work.

## 13. UI answerability standard

Fifi's answerability coverage applies to the entire visible product, not only major features.

For every documented visible element, knowledge should be sufficient to answer, where applicable:

- What is this?
- What information does it show?
- Why is it shown here?
- What does it affect or represent?
- What happens when I tap, select, expand, confirm, cancel, buy, sell, lock, or otherwise use it?
- Is it informational, navigational, interactive, or a status indicator?
- What is the relevant next action?

This includes small UI elements such as labels, values, badges, chips, chevrons, icons with product meaning, progress indicators, tabs, sorting/filter controls, cards, banners, inline actions, sheets, confirmation dialogs, empty/loading/error states, and mobile/desktop variants when their behavior differs.

A new visible element should not be considered fully shipped from Fifi's perspective until its user-facing meaning is documented or intentionally marked as non-explanatory decoration.

## 14. Human-facing knowledge vs implementation documentation

Architecture and engineering documents may contain implementation vocabulary because engineers need it. That does not make those terms suitable for user answers.

The Knowledge Foundation should translate implementation truth into human meaning before it becomes answer evidence. Internal contracts may define *how Fifi works*; knowledge articles define *what the user needs to understand*.

Do not copy architecture prose directly into user-facing answers merely because it is technically correct.

## 15. Answer completeness without over-answering

Answerability does not mean giving every known fact in every response.

Fifi should provide the smallest complete explanation for the user's question, then offer the most relevant next step. Extra detail is useful when it removes likely confusion; otherwise it should remain available through a follow-up question.

## 16. Current-value handoff

A knowledge article may explain what a value means, but it must never pretend to know a changing personal value.

Examples include:

- current Club level;
- current Portfolio holdings;
- current Earnings;
- current withdrawal status;
- current transaction status;
- current Estate price or funding state;
- current availability.

For these questions, the answer should combine the stable explanation with the current product value when the required live capability exists. If it does not exist, say that the current value is unavailable rather than substituting a static example.

## 17. Answerability gate before model integration

Before a real AnswerProvider is connected, the Knowledge Foundation must pass all of the following:

- core product questions have direct human explanations;
- important financial terms are explained without internal metadata;
- visible UI elements are catalogued sufficiently for "what is this?" questions;
- EN/FA answers are semantically aligned and naturally written;
- unknown and unavailable states have useful explanations;
- current/personal questions are clearly separated from static knowledge;
- safety and out-of-scope answers use a short boundary plus a useful alternative;
- few-shot examples demonstrate the desired response behavior;
- deterministic ingestion and evaluation remain green;
- no internal architecture vocabulary is required in ordinary user answers.

Only after this gate should model quality be evaluated against the benchmark.


## 18. Availability and Access Answerability

Fifi must also answer the question **"Can Fifi help me right now?"** honestly.

The UI and response layer must support:
- ready;
- thinking;
- degraded;
- temporarily unavailable;
- rate limited;
- access restricted;
- live data unavailable;
- failed/retry.

These states are not product knowledge for the user; they are runtime conditions. User-facing copy should explain the condition plainly and provide the nearest useful next step.

Access must be policy-driven. Do not hardcode a specific relationship between Viewer, Investor, or Club membership and Fifi usage limits. The product may change those limits without redesigning Fifi.

A model must never infer access rights, remaining usage, reset time, or service health. Those values come from the application/runtime.

## 19. Low-Capability Model Readiness

Because Fifi may initially use inexpensive or free models with limited reasoning ability, answer quality must not depend on the model independently discovering architecture, authorization, routing, or product truth.

Before model integration:
- runtime state must be explicit;
- relevant evidence must be explicit;
- page context must be explicit;
- allowed actions must be explicit;
- response examples must cover normal and failure states;
- the model should primarily render approved evidence into natural language.

A longer prompt is not a substitute for deterministic application logic.
