# Phase 9 Change Control

## Operating rule

The active slice is the only authorized scope. The agent must not continue into later slices automatically.

## Allowed during a slice

- Inspect existing code and data.
- Make changes explicitly listed in the active slice.
- Add or update tests required by that slice.
- Fix small defects directly caused by the active change.
- Record unrelated findings in the decision log.

## Not allowed without approval

- Reordering or merging slices.
- Changing product economics or canonical data rules.
- Replacing the canonical source with fixtures.
- Introducing a new financial engine.
- Broad refactoring.
- Changing the product contract.
- Expanding the active slice because a different issue was discovered.

## Escalation rules

Use `BLOCKED` only when:

1. continuing would corrupt data or contradict the product contract;
2. a required source or decision is genuinely unavailable;
3. the active slice cannot be completed safely without changing scope.

For all other unrelated findings, record them as `OPEN` in the decision log and continue within scope.

## Completion rules

A slice may be marked `PASS` only when:

- its stated deliverables are complete;
- all in-scope tests pass;
- no known in-scope defect remains;
- Design/UI QA was performed at 480×840;
- the report and decision log are updated;
- a commit was created;
- the agent stops and waits for `next slice`.

Valid final statuses are `PASS`, `PARTIAL`, or `BLOCKED`. Never claim overall Phase 9 completion from a slice report.
