# Phase 5 — Mainnet Go/No-Go Meeting

> **Status:** Prepared for human meeting. All evidence links point to existing artifacts. No automatic production deploy from this task.
>
> Meeting gate phrase: **`Phase 5 go/no-go accepted`** (recorded in §F).

---

## How to use this pack

1. **Pre-read (10 min):** skim each section's evidence links. Items marked `/` need a human check.
2. **Meeting (30 min):** walk sections A–E; assign a named owner for each NO-GO item.
3. **Sign-off (§F):** each role records Go or No-Go. If No-Go, list conditions for re-review.

---

## A. Security

| # | Item | Evidence | Status |
|---|---|---|---|
| A.1 | **P5-01 pen-test** — PASS or accepted residuals listed | [pen-test-p5-01.md](../security/pen-test-p5-01.md) | / |
| A.2 | **P5-02 audit findings** — Critical/High fixed or Accepted with owner | [audit-findings-register.md](../security/audit-findings-register.md), [pre-audit-checklist.md](../security/pre-audit-checklist.md) | / |
| A.3 | **Secrets rotation drill** executed on staging (log filled) | [secrets-rotation-drill.md](./secrets-rotation-drill.md) + drill log | / |
| A.4 | **Supply-chain policy** active | [supply-chain.md](../security/supply-chain.md) | / |
| A.5 | **Threat model v1** — updated post P5-01/02 | [threat-model-v1.md](../security/threat-model-v1.md) | / |

**NO-GO blockers (security):** Any Critical pen-test finding open. Any High audit finding unaccepted without an owner.

---

## B. Reliability

| # | Item | Evidence | Status |
|---|---|---|---|
| B.1 | **Staging ≥2 consecutive real Friday (or documented synthetic Friday) distributions** without incident | [phase1-demo.md](../runbooks/phase1-demo.md) (QA checklist §B) + deployment log (external) | / |
| B.2 | **Backup restore drill signed** | [backup-drill-log.md](./backup-drill-log.md) (latest entry) | / |
| B.3 | **Status page + incident runbook exist** | [status-page.md](./status-page.md), [incident-response.md](../runbooks/incident-response.md), [public/status/index.html](../../public/status/index.html) | / |
| B.4 | **On-call rotation named** | Table below | / |

**On-call rotation (fill names):**

| Slot | Name | Contact |
|---|---|---|
| Primary ops | | |
| Secondary ops | | |
| Engineer escalation | | |

**NO-GO blockers (reliability):** No backup drill entry in the last 30 days. No status page URL resolves.

---

## C. Product honesty

| # | Item | Evidence | Status |
|---|---|---|---|
| C.1 | **ADR-001 badges verified** on staging screenshots or E2E `earnings-honesty` spec | [e2e/tests/earnings-honesty.spec.ts](../../e2e/tests/earnings-honesty.spec.ts) — simulated badge assertions | / |
| C.2 | **`SETTLEMENT_MODE=hybrid`** default on prod plan (no silent `onchain`) | [ADR-001 §5](../adr/ADR-001-settlement-modes.md#5-default-per-environment), [env-matrix.md](./env-matrix.md) §2, [mainnet-checklist.md](./mainnet-checklist.md) item 2.1 | / |
| C.3 | **No marketing claiming verifiable wallet rent** without onchain mode | [counsel-review-checklist.md](../legal/counsel-review-checklist.md) §3 marketing scan, [risk-disclosures.md](../legal/risk-disclosures.md) §4 | / |

**NO-GO blockers (honesty):** Any production screen claiming on-chain settlement while `SETTLEMENT_MODE=hybrid`. Hero copy not visible.

---

## D. Legal

| # | Item | Evidence | Status |
|---|---|---|---|
| D.1 | **Counsel signed risk disclosures** (P5-07) | [counsel-review-checklist.md](../legal/counsel-review-checklist.md) §6 sign-off block | / |
| D.2 | **Target geos listed** | [ADR-001 §7](../adr/ADR-001-settlement-modes.md#7-jurisdiction--who-can-buy) | / |

**NO-GO blockers (legal):** Counsel review incomplete or flagged blocking issue. Any targeted geo with unresolved securities status.

---

## E. Launch plan

| # | Item | Evidence | Status |
|---|---|---|---|
| E.1 | **Feature-flag allowlist plan** (P5-09) | [mainnet-checklist.md](./mainnet-checklist.md) §5 + P5-09 plan (separate) | / |
| E.2 | **Pause key holders reachable** | [ADR-004 §2](../adr/ADR-004-key-hierarchy.md#2-who-can-pause) roles table, [admin-pause.md](../runbooks/admin-pause.md) | / |
| E.3 | **Rollback plan understood** | [mainnet-dry-run.md](../runbooks/mainnet-dry-run.md) step 9 (rollback procedure) | / |

**NO-GO blockers (launch):** No named pause key holders. Rollback procedure not rehearsed.

---

## F. Sign-off table

| Role | Name | Date | Go / No-Go |
|---|---|---|---|
| Tech lead | | | |
| Ops | | | |
| Counsel | | | |
| Founder | | | |

**Gate phrase (recorded when all Go):** `Phase 5 go/no-go accepted`

---

## References

- [ROADMAP.md](../../ROADMAP.md) — Phase 5 exit criteria
- [mainnet-checklist.md](./mainnet-checklist.md) — detailed readiness items
- [mainnet-dry-run.md](../runbooks/mainnet-dry-run.md) — testnet rehearsal
- [ADR-001](../adr/ADR-001-settlement-modes.md) — settlement modes & badge rules
- [ADR-004](../adr/ADR-004-key-hierarchy.md) — key roles, pause caps, rotation
- [threat-model-v1.md](../security/threat-model-v1.md) — risk register post P5-01/02
- [phase0-signoff.md](./phase0-signoff.md) — style reference for sign-off packs
