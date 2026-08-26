# Repository Intelligence Skill

Use this skill before non-trivial implementation work.

## Goal
Make the agent understand the repository before editing it.

## Discovery order
1. Repository-level agent instructions.
2. Product/roadmap/research documents relevant to the task.
3. Package manifest and scripts.
4. Route/page entry point.
5. Components/hooks/services used by the target.
6. Data types and API/backend boundaries.
7. Tests and validation scripts.
8. Existing similar implementation.

## Search strategy
Search for symbols, route names, user-visible copy, data fields, and existing patterns before creating new abstractions. Reuse established utilities/components when they already solve the problem.

## Change discipline
- Do not rewrite files merely to make them prettier.
- Do not introduce a dependency when an existing dependency or native platform feature is sufficient.
- Avoid broad refactors during feature work unless the refactor is required for correctness.
- Preserve public contracts and stable identifiers.

## Completion check
Before declaring success, inspect the final diff and verify that every changed file is connected to the requested outcome. Remove accidental or speculative changes.
