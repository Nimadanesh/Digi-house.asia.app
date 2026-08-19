# Phase 0 — Sign-off pack

- Status: **Accepted**
- Date prepared: 2026-07-29
- Owner: DigiHouse eng / tech lead
- Gate phrase: **`Phase 0 accepted`** (received 2026-07-29)

**Phase 1 authorized.** Next task: `do P1-01` (monorepo + `apps/api` Hono `/healthz`).

### 10-minute human skim (recommended order)

| Min | Read | Why |
|---|---|---|
| 0–2 | This file §3 decision snapshot + §4 sign-off | What you’re accepting |
| 2–5 | [ADR-001](../adr/ADR-001-settlement-modes.md) mode matrix + badge cutover | Honesty / Mock→live |
| 5–7 | [ADR-003](../adr/ADR-003-distribution-model.md) claim + dust | Hero payout mechanics |
| 7–8 | [ADR-002](../adr/ADR-002-jetton-factory.md) + [ADR-004](../adr/ADR-004-key-hierarchy.md) tables | Deploy + keys |
| 8–9 | [OpenAPI paths](../openapi/digihouse-v0.yaml) (top of file) | API surface |
| 9–10 | [env-matrix §2 defaults](./env-matrix.md) + threat-model required themes | Config + top risks |

Optional deep: full threat-model register, OpenAPI schemas.

---

## 1. Exit criteria map (ROADMAP + EXECUTION-PLAN §3.5)

| Exit criterion | Evidence path | OK? |
|---|---|---|
| Settlement mode ladder `mock` → `hybrid` → `onchain` | [docs/adr/ADR-001-settlement-modes.md](../adr/ADR-001-settlement-modes.md) | [x] |
| Jurisdiction / who can buy | ADR-001 §7 | [x] |
| Key management (deployer, hot wallet cap, multisig) | [docs/adr/ADR-004-key-hierarchy.md](../adr/ADR-004-key-hierarchy.md) | [x] |
| OpenAPI draft ↔ repos | [docs/openapi/digihouse-v0.yaml](../openapi/digihouse-v0.yaml) | [x] |
| Threat model v0 | [docs/security/threat-model-v0.md](../security/threat-model-v0.md) | [x] |
| Env matrix | [docs/ops/env-matrix.md](./env-matrix.md) | [x] |
| Jetton deploy model | [docs/adr/ADR-002-jetton-factory.md](../adr/ADR-002-jetton-factory.md) | [x] |
| Distribution model (claim/batch, dust, Sunday) | [docs/adr/ADR-003-distribution-model.md](../adr/ADR-003-distribution-model.md) | [x] |
| ADR index | [docs/adr/README.md](../adr/README.md) | [x] |
| P0-01…P0-08 tracker deliverables complete | [EXECUTION-PLAN.md](../../EXECUTION-PLAN.md) Progress Tracker | [x] |
| Human **Phase 0 accepted** | Chat / PR + §4 below | [x] |

### Consistency last-check (2026-07-29)

| Check | Result |
|---|---|
| OpenAPI paths ⊇ EXECUTION-PLAN P0-05 table + `/healthz` | pass |
| Buy = prepare+confirm (not public `tickPayout`) | pass — worker-only per ADR-001/OpenAPI |
| ADR-001 defaults = env-matrix §2 (dev mock/mock, staging hybrid/api, prod hybrid/api) | pass |
| ADR-003 claim + largest-holder dust; unbounded push rejected | pass |
| ADR-002 manual deploy Phase 2; one master/property | pass |
| ADR-004 hot wallet ≤50 TON testnet interim; secrets never `NEXT_PUBLIC_*` | pass |
| Threat model ≥15 risks; 6 required themes present | pass (22 risks) |
| `repos.ts` mock `tx.buy` ↔ OpenAPI buys/* split documented | pass |
| ROADMAP Phase 0 deliverables linked to files | pass (updated) |
| No real secrets in Phase 0 docs | pass |

### File existence check (2026-07-29)

| Path | Exists |
|---|---|
| `docs/adr/ADR-001-settlement-modes.md` | yes |
| `docs/adr/ADR-002-jetton-factory.md` | yes |
| `docs/adr/ADR-003-distribution-model.md` | yes |
| `docs/adr/ADR-004-key-hierarchy.md` | yes |
| `docs/adr/README.md` | yes |
| `docs/openapi/digihouse-v0.yaml` | yes |
| `docs/security/threat-model-v0.md` | yes |
| `docs/ops/env-matrix.md` | yes |
| `docs/ops/phase0-signoff.md` | yes |

**Blockers:** none for documentation pack.

---

## 2. Open questions register

Carried from ADR-adjacent docs. Nothing silently dropped.

| # | Question | Source | Disposition |
|---|---|---|---|
| Q1 | Cookie vs bearer default for Mini App (CSRF vs XSS) | threat-model-v0 | **Ticketed → P1-05 / P1-16** |
| Q2 | Confirmation depth / reorg policy (testnet vs mainnet) | threat-model-v0 | **Ticketed → P3-01** |
| Q3 | Exact prod hot-wallet cap formula (1-week float vs fixed) | threat-model + env-matrix | **Ticketed → mainnet checklist / P5-08**; interim caps in ADR-004 + env-matrix stand |
| Q4 | Admin API separate host vs path prefix | threat-model-v0 | **Ticketed → P4-03** |
| Q5 | Geo allowlist source of truth | threat-model-v0 | **Ticketed → Phase 5 legal** |
| Q6 | `SESSION_SECRET` vs `JWT_SECRET` name | env-matrix | **Ticketed → P1-05** (pick one at impl) |
| Q7 | Web settlement echo: `NEXT_PUBLIC_SETTLEMENT_MODE` vs `/v1/config` | env-matrix | **Ticketed → P1-15+**; prefer API config later |
| Q8 | Staging/prod hostname finals (`*.example` placeholders) | env-matrix | **Ticketed → P1-17 deploy** |
| Q9 | Sentry DSN classification (browser vs server) | env-matrix | **Ticketed → P1 observability** |
| Q10 | Multisig vendor detail (Ton multisig vs external) | ADR-004 out of scope | **Ticketed → P2 deploy docs** |
| Q11 | Batch size final number if push helper added | ADR-003 interim 50 | **Ticketed → P2-07** gas report |
| Q12 | User signs wrong TonConnect payload | threat residual | **Accepted residual** — reduce via prepare UX (P3) |
| Q13 | Multisig not day-one testnet | threat residual | **Accepted residual** — staged ladder ADR-004; gate mainnet P5-08 |
| Q14 | Legal characterization of “shares” | threat residual | **Accepted residual** — counsel Phase 5; ADR-001 §7 interim |
| Q15 | Supply-chain zero-days | threat residual | **Accepted residual** — lockfile + P5 scans |

Unresolved **blockers for Phase 1 start:** **none**. Ticketed items may proceed in parallel with P1.

---

## 3. Decision snapshot (for skim)

| Topic | Decision |
|---|---|
| Settlement | `SETTLEMENT_MODE` ∈ mock \| hybrid \| onchain; ≠ `NEXT_PUBLIC_DATA_SOURCE` |
| Honesty | Simulated badges until onchain + real non-`simulated:` txHash + explorer URL |
| Jettons | One master per property; **manual/scripted deploy** Phase 2; factory later optional |
| Distribution | **Claim-based** MVP; largest-holder dust; Sunday UTC; no unbounded push |
| Keys | Roles + caps; secrets never in repo/client; pause ownership defined |
| API surface | OpenAPI 3.1 skeleton ↔ `repos.ts` |
| Security | Threat model v0 ≥15 risks; STRIDE-lite |
| Config | Env matrix S/P + ADR-001 defaults |

---

## 4. Human sign-off

- [x] I have skimmed ADR-001…004 and Phase 0 artifacts
- [x] I accept residual risks / ticketed questions above
- [x] I authorize Phase 1 start (P1-01 monorepo + API)

**Phrase recorded:** `Phase 0 accepted`

| Field | Value |
|---|---|
| Accepted by | user (chat) |
| Date | 2026-07-29 |
| Notes | Phase 0 pack last-check green; ADR-001…004 Accepted |

---

## 5. References

- [ROADMAP.md](../../ROADMAP.md) — Phase 0 deliverables  
- [EXECUTION-PLAN.md](../../EXECUTION-PLAN.md) — §3.4 P0-08, §3.5 exit  
- [docs/adr/README.md](../adr/README.md) — ADR index  
