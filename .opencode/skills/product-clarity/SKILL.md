# Product Clarity Skill

Use this skill whenever a user request is informal, incomplete, or outcome-oriented.

## Goal
Convert natural-language intent into an implementation-ready task without forcing the user to write technical specifications.

## Process
1. Read repository instructions and relevant product docs.
2. Inspect the current implementation before proposing a change.
3. Extract: desired outcome, affected user journey, constraints, non-goals, and acceptance criteria.
4. Prefer the interpretation that best preserves the existing product direction.
5. If ambiguity is harmless, make a reasonable assumption and proceed.
6. If ambiguity can cause irreversible architectural, financial, security, or major UX consequences, ask one focused clarification.
7. Implement only after the interpretation is sufficiently grounded.

## Agent response format
For meaningful tasks, internally derive:
- **Intent:** what the user is really trying to achieve.
- **Scope:** what should change and what should remain untouched.
- **Acceptance:** how we know it works.

Do not dump this framework on the user unless it helps. The objective is better execution, not more ceremony.

## UX language translation examples
- “make this feel more premium” → inspect the relevant screen, design system, hierarchy, spacing, typography, states, and interaction quality; do not randomly add gradients or shadows.
- “make this easier” → identify friction in the actual flow and reduce steps, cognitive load, or unclear affordances.
- “fix this page” → inspect the page holistically, identify the highest-impact defects, and fix them without unrelated redesign.
- “make it production ready” → validate behavior, states, responsive layout, error handling, security-sensitive assumptions, and relevant checks rather than only polishing visuals.

## Financial-product rule
When the request concerns ownership, money, payouts, transactions, balances, or verification, never infer a claim of real settlement or on-chain truth from visual requirements alone.
