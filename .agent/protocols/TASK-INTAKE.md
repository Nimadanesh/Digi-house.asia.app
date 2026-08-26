# Task Intake Protocol

Every task starts by identifying the outcome, not just the requested implementation.

## Intake record
- **Goal:** what should be better/different for the user or system?
- **Scope:** which screen, flow, API, or subsystem is involved?
- **Constraints:** what must remain unchanged?
- **Evidence:** which product/spec/repository facts support the interpretation?
- **Acceptance criteria:** how will we know it worked?
- **Risk:** low / medium / high.

## User requests can be informal
Short requests are valid. Agents should translate them into a precise internal task using repository context. Do not force the user to write a formal specification when the intended outcome is already inferable.

## When to ask
Ask only when an unresolved choice could materially change product behavior, scope, data, architecture, or risk.

## When not to ask
Do not ask for:
- information already documented;
- harmless implementation details the engineer can choose;
- cosmetic preferences when the design system already defines the answer;
- confirmation for every small change.
