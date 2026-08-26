# Agent Handoff Skill

Use this skill when a task may be continued by another coding-agent session.

## Goal
Leave the repository in a state where the next OpenCode / FreeBuff agent can understand what happened without reconstructing the entire conversation.

## Rules
- Keep durable decisions in repository docs, not only in chat.
- Before finishing a non-trivial task, update the most relevant roadmap/spec/status document if one exists.
- Record important assumptions and unresolved risks.
- Do not create speculative documentation for behavior that does not exist.
- Keep names consistent with FractionalLuxe and `app.fractionalluxe.com`; treat legacy DigiHouse references as migration debt unless they are part of a technical identifier that should remain stable.

## Handoff summary
A useful handoff should answer:
1. What changed?
2. Why was it changed?
3. Which files/areas are affected?
4. What checks were run?
5. What remains to be done?
6. What assumptions should the next agent preserve?

## Continuity rule
The next agent should inspect the diff and repository docs before making further changes. Never rely on a previous agent's prose as a substitute for the actual source of truth.
