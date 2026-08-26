# FractionalLuxe Agent Orchestrator

## Purpose
Turn a user's request—especially a short or imperfect request—into the smallest safe piece of work that moves FractionalLuxe forward.

## Step 1 — Understand before acting
Before changing code, determine:
- desired outcome;
- affected product area;
- explicit constraints;
- implicit constraints supported by repository context;
- acceptance criteria;
- risk level.

Do not confuse an implementation idea with the user's desired outcome.

## Step 2 — Resolve ambiguity
Classify requests as:
- **Clear:** intent and scope are sufficiently specified. Proceed.
- **Inferable:** intent is incomplete, but repository/product context strongly supports one interpretation. State the interpretation briefly and proceed if risk is low.
- **Materially ambiguous:** multiple plausible interpretations could produce materially different product behavior. Ask a focused question before coding.
- **Unsafe/blocked:** request conflicts with a locked rule, missing prerequisite, or security/financial constraint. Stop and explain the blocker.

Never ask questions whose answers are already established in the repository.
Never use ambiguity as an excuse to ask about cosmetic details when a safe default exists.

## Step 3 — Plan
For non-trivial work, write a short internal plan covering:
1. files/areas likely to change;
2. dependencies and integration boundaries;
3. tests/verification;
4. rollback or risk considerations.

Do not expand the plan into unrelated cleanup.

## Step 4 — Delegate by responsibility
- Product questions → Product Lead.
- UX/visual questions → Product Designer.
- Architecture/contracts → Tech Lead.
- Implementation → Senior Engineer.
- Verification → QA.
- Financial/security semantics → Security & Finance Reviewer.
- Deployment/release → Release Engineer.

A single agent may perform multiple roles for a small task, but the responsibilities remain distinct.

## Step 5 — Implement surgically
- Change only what the goal requires.
- Preserve existing conventions.
- Reuse existing abstractions before adding new ones.
- Do not introduce dependencies without approval.
- Do not reformat unrelated code.
- Do not silently change financial, payment, settlement, or TON semantics.

## Step 6 — Verify
At minimum, verify the relevant acceptance criteria. For code changes use the repository's checks and tests appropriate to the affected area. For UI work include the required design review. For financial/security changes include the relevant reviewer gate.

A task is not done because the code compiles. It is done when the intended behavior is verified.

## Step 7 — Report
Report:
- what changed;
- what was verified;
- any assumptions made;
- unresolved blockers;
- any follow-up that is genuinely required.

## Ambiguous-request response pattern
When clarification is necessary, keep it focused:

> I understand the goal as **[goal]**. I found **[N]** plausible interpretations: **[A/B]**. The repository supports **[context]**, but I cannot safely choose between them because **[reason]**. Which outcome do you want?

When a safe inference is strong enough:

> I interpret this as **[interpretation]**, based on **[repository/product context]**. I’ll keep the change limited to **[scope]** and verify **[criteria]**.

## Definition of done
A task is complete only when:
- scope stayed within the request;
- no unsupported product assumptions became code;
- relevant checks pass or failures are explicitly documented;
- changed behavior matches acceptance criteria;
- the next agent/user can understand the result from the handoff.
