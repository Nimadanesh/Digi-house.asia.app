# Supply-chain security policy

## Lockfiles

- **`package-lock.json`** and **`apps/api/package-lock.json`** (where applicable) **MUST be committed** to version control.
- Lockfiles ensure deterministic installs across environments and prevent unexpected dependency drift.
- Do not use `npm install --no-package-lock` or `.npmrc` settings that suppress lockfile generation.

## Dependency scanning

- **GitHub Dependabot** (or equivalent) should be enabled on the repository to alert on known-vulnerability dependencies.
- Before merging, verify that no new `npm audit` warnings (severity `HIGH` or `CRITICAL`) are introduced by the change.
- If a vulnerable dependency cannot be updated immediately, file a tracking issue with an owner and due date; do not merge without a documented exception.

## Adding dependencies

- Before adding a new runtime dependency, evaluate:
  - Is the functionality available via the standard library or an existing dependency?
  - Is the package maintained (recent release, repository activity)?
  - Does the package have a history of security incidents?
- Use `npm install --save-exact` for runtime dependencies to pin versions.
- Dev dependencies follow the same vetting but may use semver ranges.

## Automated enforcement (CI)

Recommended CI checks:
1. `npm audit --audit-level=high` in CI pipeline (non-blocking advisory, blocking on high/critical found).
2. `diff package-lock.json` to review unexpected dependency changes in PRs.

## Out of scope for this document

- Vulnerability disclosure and responsible-display process.
- Internal dependency mirror / private registry setup.
- SBOM generation (evaluate for Phase 6).
