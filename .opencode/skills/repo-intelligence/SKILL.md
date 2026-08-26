---
name: repo-intelligence
description: Inspect repository instructions, architecture, relevant code, data boundaries, tests, and existing patterns before non-trivial implementation work.
compatibility: opencode
metadata:
  opencode/autoinvoke: "true"
---

# Repository Intelligence Skill

Use this skill before non-trivial implementation work.

## Discovery order
1. `AGENTS.md` and active program status.
2. Product, requirements, user-flow, design-system, data-model, and tech-stack docs relevant to the task.
3. Package manifest and scripts.
4. Target route/page entry point.
5. Components, hooks, services, and data boundaries used by the target.
6. Tests and validation commands.
7. Existing similar implementations.

## Search strategy
Search for symbols, route names, user-visible copy, data fields, and existing patterns before creating new abstractions. Reuse established utilities/components when they already solve the problem.

## Change discipline
- Do not rewrite files merely to make them prettier.
- Do not introduce dependencies without approval when an existing capability is sufficient.
- Avoid broad refactors during feature work unless required for correctness.
- Preserve public contracts and stable identifiers.

## Completion check
Before declaring success, inspect the final diff and verify that every changed file is connected to the requested outcome. Remove accidental or speculative changes.
