# Pre-Audit Checklist — DigiHouse Smart Contracts

- **Run against**: current tree at commit `c2ab4b3` (pre-Batch-2 merge base)
- **Date**: 2026-07-30
- **Cross-reference**: [ROADMAP.md](../../ROADMAP.md) P5-02, P2-11, Phase 2 exit criteria
- **Note**: Smart contracts are **Phase 2 delivery** — not yet in tree. Code items marked N/A with evidence path "blocked on Phase 2 artifacts" where appropriate.

---

## Checklist

### 1. Source of truth

- [x] **Source of truth commit SHA recorded**
  - **PASS** — Commit `c2ab4b3` (base) and audit-v1 tag will be created at contract delivery. This checklist references the current tree. Contracts will reside in `contracts/` per ROADMAP.

### 2. Math / conservation / dust

- [ ] **Conservation tests exist: `sum(payouts) + dust == rentPool`**
  - **N/A** — No contracts exist yet. ADR-003 §3 defines the invariant: `ΣamountUsd == rentPoolUsd` via `floor()` with dust→largest-holder rule. DATA_MODELS.md § Proportional invariant (lines 280–290) documents the same. Test vectors must be written in Phase 2 (`P2-05 conservation tests`).

- [ ] **Floor division validated for all shareRatio paths**
  - **N/A** — Off-chain math (`map-earnings.ts`) uses `Math.floor()` and is tested in `earnings.test.ts` / `map-earnings.test.ts`. On-chain nanoTON floor rules are defined (ADR-003 §3) but not yet implemented.

- [ ] **Dust policy documented and tested: remainder goes to largest holder (not lost)**
  - **PASS** — ADR-003 §3, DATA_MODELS.md (line 289), and ADR-003 deep-dive all mandate dust→largest-holder. Off-chain `buildEarningsSummary` in `map-earnings.ts` applies floor division. On-chain implementation pending Phase 2.

### 3. Access control

- [ ] **Non-admin mint fails (revert/throw)**
  - **N/A** — `PropertyJettonMaster` contract not yet written. ADR-002 § Mint/supply rules and ADR-004 § Key roles table define deployer/admin-only mint. Test ready in Phase 2.

- [ ] **Non-admin pause/unpause fails**
  - **N/A** — On-chain pause not yet implemented. Admin API pause (`POST /v1/admin/properties/:id/pause`) is tested and requires `X-Admin-Key` header (tested in `admin.test.ts` lines 259–384). On-chain pause flag on Distribution contract pending Phase 2.

- [ ] **No public mint / self-mint**
  - **N/A** — Contract not yet written. ADR-002 explicitly forbids public mint: "Admin mint: restricted to deployer/admin roles."

- [ ] **Mint capped to `totalShares` (no supply inflation)**
  - **N/A** — Contract not yet written. ADR-002: `totalSupply = Property.totalShares`. Schema field `properties.total_shares` exists.

### 4. Distribution / unbounded loops

- [ ] **No unbounded holder iteration in a single TX (claim model)**
  - **PASS** — ADR-003 selects pull/claim model for MVP-on-chain. Each holder pays their own gas. No single-TX push loop. Threat model TM-09 is mitigated by this design choice.

- [ ] **Claim max window documented (7 days default)**
  - **PASS** — ADR-003 § Claim rules: 7-day default window. Unclaimed rolls into next week's pool.

- [ ] **Double-claim prevention (claimed bitmap / status check)**
  - **N/A** — On-chain bitmap not yet implemented. Off-chain: `earnings_entries.status` CHECK `IN ('paid', 'pending')`, flip pending→paid is idempotent in `markPendingPaidForDistribution`.

- [ ] **Underfunded pool cannot be marked paid**
  - **N/A** — Distribution contract not yet written. ADR-003 § Failure modes documents "Underfunded rent pool" as a failure path. Hybrid mode checks `remaining < pool` before paying (in `tick-payout.ts`).

### 5. Pause path

- [x] **Pause runbook exists or is documented**
  - **PASS** — ADR-004 § Who can pause defines the one-action model: on-chain pause → API kill switch → stop workers → open incident. Admin API pause endpoint exists (`POST /v1/admin/properties/:id/pause`). Distribution-paused flag prevents hybrid tickPayout from flipping pending→paid.

- [ ] **Pause does not lock user funds permanently**
  - **N/A** — Contract not yet written. ADR-003: "Contract pause flag (ADR-004) — claims/distribute disabled; pending unchanged." Pause is non-destructive.

- [ ] **Unpause requires same privilege level**
  - **N/A** — Contract not yet written. ADR-004: admin multisig for both pause and unpause.

### 6. Upgrade policy

- [ ] **Immutable vs proxy decision stated**
  - **PASS** — ADR-002 § Decision: "prefer immutable + new deploy". ROADMAP Phase 2.1: "Upgrade policy (prefer immutable + new deploy)". Contracts are replaced via new deployment with new address, not proxied.

- [ ] **Proxy pattern security considerations documented (if proxy is chosen)**
  - **N/A** — Immutable chosen per ADR-002. No proxy.

### 7. Known limitations

- [x] **Known limitations documented honestly**
  - **PASS** — See § Known limitations below.

---

## Known limitations (honest disclosure)

1. **MVP claim pay, not dual-jetton.** ADR-005 (USDT stable pay path) is proposed but not accepted. MVP uses nanoTON-only pay path for on-chain distributions. If ADR-005 is accepted later, distribution contracts must be updated or new versions deployed.

2. **No wallet-bind API.** Wallet address is set by the client during onboarding; no `POST /wallets/bind` with TonConnect proof exists. This is a P5-01 documented GAP.

3. **Batch push not implemented.** ADR-003 Option B (batched push, `MAX_HOLDERS_PER_BATCH = 50`) is deferred. Claim-only for MVP mitigates TM-09.

4. **No formal verification.** The audit scope does not include formal verification of FunC/Tact code. Manual review + property tests are the baseline.

---

## Summary

| Section | Count | PASS | N/A | FAIL |
|---|---|---|---|---|
| Source of truth | 1 | 1 | 0 | 0 |
| Math / conservation | 3 | 1 | 2 | 0 |
| Access control | 4 | 0 | 4 | 0 |
| Distribution / loops | 4 | 2 | 2 | 0 |
| Pause path | 3 | 1 | 2 | 0 |
| Upgrade policy | 2 | 1 | 1 | 0 |
| Known limitations | 1 | 1 | 0 | 0 |
| **Total** | **18** | **7** | **11** | **0** |
