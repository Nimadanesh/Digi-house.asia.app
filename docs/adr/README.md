# Architecture Decision Records — DigiHouse

## Status legend

| Status | Meaning |
|---|---|
| **Proposed** | Written; awaiting team accept |
| **Accepted** | Team signed off (Phase 0 or later) |
| **Superseded** | Replaced by a newer ADR |

## Index

| ID | Title | Status | One-line decision | File |
|---|---|---|---|---|---|
| **ADR-001** | Settlement modes + UI badge rules | Accepted | `SETTLEMENT_MODE` ladder; badges until real explorer hash; ≠ `DATA_SOURCE` | [ADR-001-settlement-modes.md](./ADR-001-settlement-modes.md) |
| **ADR-002** | Jetton deployment | Accepted | One master/property; **manual deploy** P2; factory optional later | [ADR-002-jetton-factory.md](./ADR-002-jetton-factory.md) |
| **ADR-003** | Weekly distribution | Accepted | **Claim** MVP; largest-holder dust; Friday UTC; no unbounded push | [ADR-003-distribution-model.md](./ADR-003-distribution-model.md) |
| **ADR-004** | Key hierarchy & custody | Accepted | Role table; hot-wallet caps; secrets never in repo/client | [ADR-004-key-hierarchy.md](./ADR-004-key-hierarchy.md) |
| **ADR-005** | USDT stable pay path | Proposed | Defer to Phase 5; dual-jetton escrow preferred if accepted; no USDT in MVP buy flow | [ADR-005-usdt-pay-path.md](./ADR-005-usdt-pay-path.md) |

> **Phase 0 accepted** 2026-07-29 (chat). Sign-off record: [phase0-signoff.md](../ops/phase0-signoff.md).

## Related Phase 0 artifacts (not ADRs)

| Artifact | Path |
|---|---|
| OpenAPI skeleton 3.1 | [../openapi/digihouse-v0.yaml](../openapi/digihouse-v0.yaml) |
| OpenAPI validate notes | [../openapi/README.md](../openapi/README.md) |
| Threat model v0 | [../security/threat-model-v0.md](../security/threat-model-v0.md) |
| Audit SOW, findings register, pre-audit checklist, fix-sprint | [../security/audit-sow.md](../security/audit-sow.md) (P5-02) |
| Env matrix | [../ops/env-matrix.md](../ops/env-matrix.md) |
| Phase 0 sign-off checklist | [../ops/phase0-signoff.md](../ops/phase0-signoff.md) |

## How to add an ADR

1. Copy the template from [EXECUTION-PLAN.md](../../EXECUTION-PLAN.md) §3.2.
2. Add `docs/adr/ADR-00N-short-slug.md` with Status **Proposed**.
3. Link it in the Index table above.
4. Do not silently change Accepted ADRs — supersede with a new ID if the decision reverses.

## Phase 0

Full exit checklist and human gate: **[docs/ops/phase0-signoff.md](../ops/phase0-signoff.md)**.

Phase 0 accepted 2026-07-29. Phase 1 in progress — see `EXECUTION-PLAN.md`.
