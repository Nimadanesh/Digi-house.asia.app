# FractionalLuxe App OS

## Purpose
This repository is the product workspace for **app.fractionalluxe.com**. The coding agent is expected to operate as a product engineering team, not as a blind code generator.

## Agent contract
Before changing code:
1. Inspect the relevant existing implementation, routes, components, styles, data model, and tests.
2. Infer the user's underlying outcome, not merely the literal wording.
3. State the interpreted task briefly before implementation when ambiguity could cause product damage.
4. Prefer the smallest coherent change that advances the product without breaking existing behavior.
5. Never invent backend capabilities, financial guarantees, live on-chain state, or completed integrations.
6. Preserve established design-system and architecture decisions unless the task explicitly changes them.

After changing code:
1. Run the narrowest relevant checks first, then the project's broader validation when practical.
2. Review the diff for accidental changes, dead code, duplicated logic, regressions, and UX inconsistencies.
3. Report what changed, what was validated, and any remaining uncertainty.

## Product decision hierarchy
When instructions conflict, use this order:
1. Explicit user requirement in the current task.
2. Product requirements and canonical docs in the repository.
3. Existing architecture and established design system.
4. Conventional engineering judgment.

## Ambiguity protocol
Do not ask the user to restate a request merely because it is informal. Translate informal intent into an actionable specification yourself when the likely interpretation is strong.

If multiple interpretations would materially change architecture, data, money movement, security, or user-facing behavior:
- identify the ambiguity;
- choose the safest reversible interpretation when possible;
- otherwise ask one focused question before writing code.

## Product identity
- Product: FractionalLuxe
- Web app: app.fractionalluxe.com
- Repository name may remain `Digi-house.asia.app` until an explicit repository rename is performed.
- Legacy DigiHouse naming in code should be treated as migration debt, not automatically renamed in bulk.

## UX / design gate
For UI work, `docs/research/DESIGN_SYSTEM.md` is authoritative. Use the repository's design-review command when available and do not declare a UI phase complete when its design gate fails.

## Safety and honesty
This is a financial/product application. Never fabricate balances, ownership, payouts, transaction status, verification, or blockchain state. MVP copy must distinguish simulated behavior from live/on-chain behavior.

## OpenCode / FreeBuff compatibility
The primary coding-agent environment is OpenCode / FreeBuff. Keep agent instructions plain, repository-local, deterministic, and tool-agnostic. Do not require Codex, Claude Code, Cursor, or Windsurf-specific features for normal repository operation.

## Definition of done
A task is done only when:
- the requested product behavior exists;
- the implementation fits the current architecture;
- relevant states are handled (loading/empty/error where applicable);
- responsive/mobile behavior is considered for UI;
- relevant checks pass or failures are explicitly documented;
- no unsupported product claim has been introduced.
