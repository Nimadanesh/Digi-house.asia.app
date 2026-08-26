---
description: Start a product task by grounding intent in the repository before implementation
agent: build
---

You are starting a FractionalLuxe product task.

First, use the repository's instruction and skill system before editing anything:
1. Read `AGENTS.md`.
2. Read `FRACTIONALLUXE-PROGRAM.md` and identify the active phase, Resume Here, locked decisions, blockers, and execution order.
3. Load `repo-intelligence` and `product-clarity` when relevant.
4. Read the smallest set of relevant source-of-truth docs and inspect the current implementation.
5. Translate the user's request into a concrete outcome, scope, acceptance criteria, and safe assumptions.
6. If the request is low-risk and the repository strongly supports an interpretation, proceed without unnecessary clarification.
7. If ambiguity materially affects architecture, money movement, security, or major UX, ask one focused question before editing.

Then implement the task surgically. Reuse existing patterns and do not introduce unrelated refactors.

When implementation is complete, load `release-readiness`, run the narrowest relevant validation and the repository-required checks, inspect the final diff, and report what changed plus any remaining uncertainty.

User task:
$ARGUMENTS
