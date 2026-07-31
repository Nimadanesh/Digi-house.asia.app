# Mainnet Deploy Dry-Run

> **Testnet rehearsal only.** No mainnet keys, no mainnet addresses, no `SETTLEMENT_MODE=onchain`.
> If a contract or deploy tool does not yet exist, mark the step **N/A** and continue — do not invent a PASS.
>
> Cross-references: [mainnet-checklist.md](../ops/mainnet-checklist.md), [secrets-rotation-drill.md](../ops/secrets-rotation-drill.md),
> [env-matrix.md](../ops/env-matrix.md),
> [ADR-001](../adr/ADR-001-settlement-modes.md), [ADR-004](../adr/ADR-004-key-hierarchy.md),
> [staging-deploy.md](../ops/staging-deploy.md), [admin-pause.md](./admin-pause.md),
> [backup-restore.md](./backup-restore.md), [status-page.md](../ops/status-page.md),
> [incident-response.md](./incident-response.md),
> [pre-audit-checklist.md](../security/pre-audit-checklist.md),
> [audit-findings-register.md](../security/audit-findings-register.md)

---

## 0. Preconditions

Check each before starting the dry-run. If a precondition is not met, the dry-run may proceed but the gap must be noted in the log.

| # | Precondition | Covers | Verification |
|---|---|---|---|
| 0.1 | Phase 1 (API + Postgres) deployed and healthz-OK on staging | P1 staging | `curl <staging-api>/healthz` → 200 |
| 0.2 | Phase 2 testnet addresses exist (jetton + distribution contracts) or marked N/A | P2 deploy | `deployments/testnet.json` exists or N/A |
| 0.3 | Phase 3 E2E testnet loop green (or N/A if contracts not deployed) | P3 testnet | Runbook phase3-e2e-testnet.md green or N/A |
| 0.4 | P5-02 pre-audit checklist: no Critical-open findings | P5-02 audit | `pre-audit-checklist.md` — all Critical items PASS or N/A |
| 0.5 | P5-04 backup drill logged (or N/A) | P5-04 drill | `backup-drill-log.md` has latest entry or N/A |
| 0.6 | P5-06 incident template + status page exist | P5-06 ops | `docs/ops/incident-template.md` and `docs/ops/status-page.md` exist or `TBD` placeholder |
| 0.7 | Secrets rotation drill written and dry-run done on staging | P5-05 rotation | `secrets-rotation-drill.md` logged |
| 0.8 | `SETTLEMENT_MODE` = `hybrid` on staging | ADR-001 | `curl <staging-api>/healthz | jq .settlementMode` → `"hybrid"` |

---

## 1. Build contracts at pinned commit SHA

```bash
# Record the commit used for this dry-run
DRY_RUN_COMMIT=$(git rev-parse HEAD)
echo "Dry-run commit: $DRY_RUN_COMMIT"

# Build (if contracts exist)
cd contracts  # or equivalent
npx blueprint build  # or equivalent compiler command
```

Verify the build output matches the pinned commit. No freestyle patches.

**If no contracts/ directory exists:** mark N/A, note as blocker for P5-09.

---

## 2. Deploy testnet only

> **Never paste mainnet mnemonics.** Use testnet-only keys from secrets manager or local gitignored env.

```bash
npx blueprint deploy --network testnet
# Follow deploy script prompts
```

Write output to:

```
deployments/testnet.json
```

Expected schema (example — exact fields depend on Phase 2 contracts):

```json
{
  "commitSha": "<DRY_RUN_COMMIT>",
  "deployedAt": "2026-07-30T12:00:00Z",
  "network": "testnet",
  "properties": [
    {
      "propertyId": "prop-xxx",
      "jettonMaster": "EQD...",
      "distributionAddress": "EQD..."
    }
  ]
}
```

**If contracts not deployable:** mark N/A, note as blocker.

---

## 3. Freeze API / DB registry

Set contract addresses in the database registry (at most one ops writes per property):

1. Connect to staging Postgres (or admin API)
2. For each property, set `onchain_master` and `distribution_address` from the deployment output
3. Verify: no freestyle overwrites — a change requires a new deploy + new registry row + an ops note

```sql
UPDATE properties
SET onchain_master = 'EQD...',
    distribution_address = 'EQD...',
    registry_frozen_at = NOW()
WHERE id = 'prop-xxx'
  AND registry_frozen_at IS NULL;
```

Immutable rule after freeze: `registry_frozen_at` is non-null. To change, deploy new contracts and insert a new registry row; never silently overwrite.

---

## 4. API + Mini App env parity

Set env vars to match the target prod configuration (testnet TON, hybrid settlement):

| Variable | Dry-run value | Prod target | Notes |
|---|---|---|---|
| `DATABASE_URL` | Staging Postgres | Prod Postgres | Managed SM |
| `REDIS_URL` | Staging Redis | Prod Redis | Managed SM |
| `TELEGRAM_BOT_TOKEN` | Test bot token | Prod bot token | Never `NEXT_PUBLIC_*` |
| `SESSION_SECRET` | Staging secret | Prod SM secret | Rotated per drill |
| `ADMIN_API_SECRET` | Staging secret | Prod SM secret | Optional mount |
| `SETTLEMENT_MODE` | `hybrid` | `hybrid` | ADR-001 §5 — must not default to `onchain` |
| `NEXT_PUBLIC_DATA_SOURCE` | `api` | `api` | Read path only — does not imply on-chain honesty |
| `NEXT_PUBLIC_TON_NETWORK` | `testnet` | `testnet` → `mainnet` only after P5-09 go/no-go |
| `CORS_ORIGIN` | Staging Mini App URL | Prod Mini App URL | Exact, no trailing slash |
| `PAYOUT_WORKER_ENABLED` | `false` | `false` (initial) | Enable after monitoring baseline set |
| `HOT_WALLET_MAX_TON` | Not set / 0 | Policy cap (§ ADR-004) | Testnet: ≤50 TON if funded |

Set via platform secrets manager or `fly secrets set` for staging:

```bash
fly secrets set \
  SETTLEMENT_MODE=hybrid \
  NEXT_PUBLIC_TON_NETWORK=testnet \
  ...
```

---

## 5. Smoke test (hybrid path)

Run the Phase 1 demo runbook smoke endpoints:

```bash
# Healthz
curl -sS <staging-api>/healthz | jq .settlementMode
# Expected: "hybrid"

# Marketplace (public, no auth)
curl -sS <staging-api>/v1/marketplace | jq 'length'
# Expected: ≥1

# Property detail
curl -sS <staging-api>/v1/properties/<id> | jq .title

# Buy prepare (requires auth token) — test hybrid path
# curl -sS -X POST <staging-api>/v1/buys/prepare \
#   -H "Authorization: Bearer <token>" \
#   -H "Content-Type: application/json" \
#   -d '{"propertyId":"prop-xxx","shares":1}'
```

Do **not** claim "mainnet live" — the smoke proves the hybrid path on testnet, not on-chain settlement.

---

## 6. Pause drill

Execute the pause-everything sequence per [ADR-004 §2](../adr/ADR-004-key-hierarchy.md#2-who-can-pause) and [admin-pause.md](./admin-pause.md):

| Step | Action | Verification |
|---|---|---|
| 6.1 | Pause sale + distribution (scope=all) | API returns 200, subsequent buy prepare returns 409 |
| 6.2 | API kill switch (if applicable) | Mutating routes return 4xx |
| 6.3 | Stop payout worker | `PAYOUT_WORKER_ENABLED=false` or scale to 0 |

Then unpause and verify resume:

| Step | Action | Verification |
|---|---|---|
| 6.4 | Unpause sale | buy prepare returns 200 again |
| 6.5 | Restart worker (if stopped) | Worker log shows tick resumed |

---

## 7. Hot wallet balance vs cap

If a hot wallet is configured for testnet:

| Check | Guidance |
|---|---|
| Current balance | `ton <address> balance` or TonAPI |
| Max cap | `HOT_WALLET_MAX_TON` env var or SM value |
| Within cap? | Balance ≤ cap. Testnet interim cap: ≤50 TON (ADR-004 §3) |
| Low-water alert configured? | Alert if balance < next Friday's rent pool need |

No hot wallet on testnet → mark N/A.

---

## 8. Secrets rotation drill (staging)

Run the [secrets-rotation-drill.md](../ops/secrets-rotation-drill.md) against staging:

| Secret rotated | Old revoked? | Auth still works? | Log entry |
|---|---|---|---|
| `SESSION_SECRET` | Yes / N/A | Yes / N/A | |
| `TELEGRAM_BOT_TOKEN` | Yes / N/A | Yes / N/A | |
| `ADMIN_API_SECRET` | Yes / N/A | Yes / N/A | |
| DB password | Yes / N/A | Yes / N/A | |

A full rotation was **completed** as part of this dry-run if all four are ticked.

---

## 9. Rollback

Procedure to undo the dry-run and return to pre-dry-run state:

1. **Pause** sale + distribution per step 6
2. **Point API registry back** to pre-dry-run values (or revert deployment registry table)
3. **Reset env vars** to pre-dry-run values (re-deploy or restore SM entries)
4. **Verify degraded state is acceptable** — smoke test returns 200 but hybrid-buy path may be disabled

```bash
# Example: revert registry
UPDATE properties SET onchain_master = NULL, distribution_address = NULL, registry_frozen_at = NULL
WHERE registry_frozen_at IS NOT NULL;
```

---

## 10. Sign dry-run log

| Field | Value |
|---|---|
| Dry-run date | YYYY-MM-DD |
| Commit SHA | `<DRY_RUN_COMMIT>` |
| Performed by | `@name` |
| Witnessed by | `@name` |
| Log filed at | `docs/ops/backup-drill-log.md` (appended) |

---

## Done evidence

| Step | Status | Detail |
|---|---|---|
| 0. Preconditions | PASS / N/A / FAIL | |
| 1. Build contracts | PASS / N/A | SHA: `<commit>` |
| 2. Deploy testnet | PASS / N/A | Addresses: `testnet.json` |
| 3. Registry freeze | PASS / N/A | Properties frozen: N |
| 4. Env parity | PASS / N/A | vars set per table |
| 5. Smoke hybrid | PASS / N/A | healthz, marketplace OK |
| 6. Pause drill | PASS / N/A | pause → unpause OK |
| 7. Hot wallet cap | PASS / N/A | balance ≤50 TON |
| 8. Secrets rotation | PASS / N/A | 4/4 rotated |
| 9. Rollback | PASS / N/A | state restored |
| **Overall** | **PASS / FAIL** | All gaps documented |

> This dry-run rehearses the mainnet deploy procedure on **testnet only**.
> It does not authorize `SETTLEMENT_MODE=onchain` on mainnet.
> The onchain allowlist launch is a separate go/no-go (P5-09).
