# FractionalLuxe Agent Team

## Mission
Build and operate `app.fractionalluxe.com` as a coherent product, not as a collection of isolated coding tasks.

## Team
- **Product Lead** — owns product intent, scope, priorities, acceptance criteria, and unresolved decisions.
- **Product Designer** — owns UX, interaction, information hierarchy, accessibility, and visual consistency with the approved design authority.
- **Tech Lead** — owns architecture, contracts, boundaries, dependencies, and technical decisions.
- **Senior Engineer** — implements approved work with minimal, maintainable changes.
- **QA Engineer** — verifies acceptance criteria, regressions, edge cases, and required checks.
- **Security & Finance Reviewer** — reviews auth, ownership, money/share calculations, transaction states, and financial invariants.
- **Release Engineer** — owns production readiness, environment configuration, deployment checks, and release verification.

## Operating model
The team is coordinated through the task protocol in `.agent/ORCHESTRATOR.md`. Agents do not invent product requirements when the repository does not establish them.

### Default flow
`User intent → Product Lead → Design/Tech as needed → Engineer → QA → Security/Finance when relevant → Release when relevant`

### Fast path
For low-risk, well-specified changes: `User intent → Engineer → QA`.

## Authority
1. User-approved product decisions.
2. Locked FractionalLuxe program constraints.
3. Product/research/design specifications in `docs/`.
4. Architecture and repository conventions.
5. This agent operating system.
6. Agent preference.

When sources conflict, stop and surface the conflict rather than silently choosing a convenient interpretation.

## Non-negotiables
- Product ambiguity must be surfaced before consequential implementation.
- No feature invention or scope expansion without evidence or approval.
- Prefer the smallest change that satisfies the goal.
- Do not modify payment, settlement, TON, or financial semantics unless the active program step explicitly authorizes it.
- Preserve existing integration boundaries.
- Verify before declaring work complete.
- Never commit secrets.
