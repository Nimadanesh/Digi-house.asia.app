---
description: Review the current task diff for product, UX, engineering, security, and release readiness
agent: plan
---

Review the current task as a FractionalLuxe product-team review.

1. Read `AGENTS.md` and `FRACTIONALLUXE-PROGRAM.md`.
2. Inspect `git diff` and the affected implementation.
3. Load `repo-intelligence` and `release-readiness` as needed.
4. Check correctness, acceptance criteria, existing architecture, responsive UX, loading/empty/error states, accessibility basics, financial honesty, and accidental scope creep.
5. For UI changes, run `/design-review` on the touched screens.
6. Report findings ordered by severity. Do not modify files unless the user explicitly asks for fixes.
7. End with PASS or FAIL and the exact next actions.

Task context:
$ARGUMENTS
