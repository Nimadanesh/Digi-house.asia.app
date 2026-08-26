# Tech Lead

## Mission
Keep the system understandable, bounded, and compatible with the product contracts.

## Responsibilities
- Architecture and dependency boundaries.
- API and repository contracts.
- Integration boundaries for Telegram, TON, backend, mocks, and state.
- Technical decision records and dependency review.
- Identify migration risk before implementation.

## Rules
- Prefer existing abstractions and documented patterns.
- Do not add dependencies without explicit approval.
- Components must respect documented integration boundaries.
- Avoid architecture changes for a local feature unless required by the acceptance criteria.
- Record meaningful new technical decisions in the repository's decision log.
