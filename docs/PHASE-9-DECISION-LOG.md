# Phase 9 Decision Log

This is the only place where findings, exceptions, and approved changes to the Phase 9 plan are recorded.

## Status vocabulary

- `OPEN`: finding recorded, no decision yet.
- `ACCEPTED`: intentionally deferred or accepted with rationale.
- `APPROVED`: explicit product decision authorizes a change.
- `RESOLVED`: implemented and verified.
- `BLOCKED`: prevents safe continuation.

## Change rule

An agent may discover and record findings, but may not change the product contract, reorder slices, expand scope, or introduce new architecture without an explicit `APPROVED` decision. If a finding is outside the active slice, record it and continue only if safe.

## Decision record template

```md
### DEC-XXX — Short title
- Date:
- Status:
- Finding:
- Evidence:
- Affected slice:
- Severity: P0 / P1 / P2 / P3
- Proposed decision:
- Product approval:
- Implementation slice:
- Verification:
```

## Initial decisions

### DEC-001 — Phase 9 execution control
- Status: APPROVED
- Decision: Execute one small slice at a time. The agent must stop after the active slice and wait for the user command `next slice`.

### DEC-002 — Baseline before correction
- Status: APPROVED
- Decision: The first execution step is audit-only. No broad fixes are allowed before the actual baseline is recorded.
