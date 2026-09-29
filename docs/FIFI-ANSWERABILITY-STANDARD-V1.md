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
