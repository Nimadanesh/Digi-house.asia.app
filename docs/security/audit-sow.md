# Statement of Work — External Smart Contract Audit

- **Engagement**: DigiHouse Phase 5 smart contract audit
- **Version**: 1.0 (draft — fill placeholders before issuing)
- **Cross-reference**: [ROADMAP.md](../../ROADMAP.md) P5-02, Phase 5.1 "External smart contract audit (budget line item)"

---

## 1. Scope

### In scope

The auditor reviews the following FunC/Tact contracts deployed on the TON blockchain (testnet, later mainnet):

| Contract | Description | ADR | Source location |
|---|---|---|---|
| **PropertyJettonMaster** | Per-property jetton (share token). Mint-only (initial supply), standard TEP-74 wallet for holders. No custom burn. | ADR-002 | `contracts/property-jetton/` (Phase 2 delivery — not yet in tree at time of SOW) |
| **Distribution** | Weekly rent pool; holders claim their share. Claim-based (pull), not push. 7-day window, remainder rolls to next week. | ADR-003 | `contracts/distribution/` (Phase 2 delivery — not yet in tree at time of SOW) |
| **Pause access control** | Admin/pause multisig that can disable claims, halt primary sale mint, or pause buy path. | ADR-004 | Embedded in Distribution and/or separate `PauseManager` |
| **Mint ACL** | Who can mint initial supply (deployer/admin). No public mint. | ADR-002, ADR-004 | Embedded in PropertyJettonMaster |
| **Fee bps** (if any) | Platform fee deducted from rent pool before distribution. (Zero for MVP; non-zero requires an ADR update per rules.) | — | (Not yet specified — ADR update required if >0) |

### Out of scope

- **Frontend / Mini App** (`src/app`, `src/components`). API auth covered by P5-01 pen-test.
- **API backend auth** (`apps/api/src/auth/`). Covered by P5-01 and threat model TM-01/02/03/04/11/18.
- **Third-party jetton standard library** (TEP-74 / `@ton/ton` provided wallet implementation). Auditor should note the version and review for known issues but the standard library is assumed vetted by the TON ecosystem.
- **Database schema** (`apps/api/src/db/schema/`). Off-chain bookkeeping is out of contract audit scope; covered by operational audit.
- **Indexer / event processing** (`apps/api/src/indexer/`). Not a contract; covered by internal review.

## 2. Deliverables

1. **Audit report** (PDF + markdown), including:
   - Executive summary
   - Methodology and tools used
   - Full contract listings with inline annotations
2. **Severity ratings** per finding: Critical / High / Medium / Low / Informational (per audit firm's standard classification).
3. **Recommended fixes** for each finding, with code snippets where applicable.
4. **Retest** after fix round: auditor confirms all Critical/High findings are resolved or accepted with documented risk owner.

## 3. Access & materials

The auditor receives:
- Target commit SHA (tagged `audit-v1`) — source repository at `github.com/digihouse/mini-app`
- Testnet addresses for deployed contracts (Phase 2 deploy scripts at `deployments/testnet/`)
- Deploy scripts (`contracts/deploy/`) with environment config
- Test suite (blueprint `npm test` under `contracts/`)
- ADR documents: ADR-002 (jetton model), ADR-003 (distribution), ADR-004 (key hierarchy)
- Threat model v0 (`docs/security/threat-model-v0.md`)

## 4. Timeline

| Milestone | Target date |
|---|---|
| Contract delivery (tagged source + testnet addresses) | [FILL: date] |
| Auditor kick-off call | [FILL: date] |
| Draft report received | [FILL: date + ~2–3 weeks from kick-off] |
| Fix sprint (internal) | [FILL: date + ~1 week] |
| Retest complete | [FILL: date + ~1 week after fix delivery] |
| Final report + sign-off | [FILL: date] |

## 5. Budget

Budget line item per ROADMAP Phase 5.1. Estimate: [FILL: USD amount]. Covers initial audit + one retest round.

## 6. Communication

- Primary channel: private GitHub repository (auditor forks, files issues)
- Weekly sync during active audit
- Findings embargo: 30 days after final report before public disclosure

## 7. Acceptance criteria

- All Critical/High findings resolved or explicitly accepted with named risk owner
- Updated findings register (`docs/security/audit-findings-register.md`) reflects final disposition
- Fix-sprint process (`docs/security/audit-fix-sprint.md`) followed for each finding
- Final report filed in `docs/security/audit-reports/`
