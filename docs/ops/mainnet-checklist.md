# Mainnet Readiness Checklist

> Gate input for P5-08 go/no-go. Each item must be **PASS** or documented **N/A** with a clear reason.
> Cross-references: [mainnet-dry-run.md](../runbooks/mainnet-dry-run.md),
> [secrets-rotation-drill.md](./secrets-rotation-drill.md),
> [ADR-001](../adr/ADR-001-settlement-modes.md), [ADR-004](../adr/ADR-004-key-hierarchy.md),
> [env-matrix.md](./env-matrix.md), [staging-deploy.md](./staging-deploy.md),
> [admin-pause.md](../runbooks/admin-pause.md),
> [status-page.md](./status-page.md), [incident-response.md](../runbooks/incident-response.md),
> [backup-restore.md](../runbooks/backup-restore.md),
> [pre-audit-checklist.md](../security/pre-audit-checklist.md),
> [audit-findings-register.md](../security/audit-findings-register.md)

---

## 1. Operations readiness

| # | Item | Status | Notes |
|---|---|---|---|
| 1.1 | **Liquidity ops plan** — documented procedure for funding rent pools, managing hot wallet balance, and JIT top-up before payout Fridays | / | |
| 1.2 | **Legal pointer** — external legal counsel or compliance contact identified (not a document; a named person or firm) | / | P5-07 |
| 1.3 | **Support contact** — escalation path for users (Telegram group, email, or ticketing system) | / | |
| 1.4 | **Pause key holders** — named roles (not private keys): at minimum a primary and a break-glass holder for Admin pause authority | / | ADR-004 §2, admin-pause.md |
| 1.5 | **Status page URL** — `https://digihouse.app/status/` (or alternative) configured and testable | / | P5-06 |
| 1.6 | **Backup drill** — latest drill logged; RTO ≤4h / RPO ≤24h proposals confirmed or updated | / | P5-04, backup-restore.md |
| 1.7 | **Secrets rotation drill** — all 4 secret types rotated on staging at least once; log signed | / | secrets-rotation-drill.md |
| 1.8 | **Hot wallet ≤ policy cap** — `HOT_WALLET_MAX_TON` set in SM and balance < cap; high/low water alerts configured | / | ADR-004 §3 |
| 1.9 | **Incident response runbook** — published and accessible to on-call | / | incident-response.md |

---

## 2. Configuration readiness

| # | Item | Status | Notes |
|---|---|---|---|
| 2.1 | **`SETTLEMENT_MODE=hybrid`** — API default is `hybrid`, never `onchain`, on mainnet | / | ADR-001 §5 |
| 2.2 | **`NEXT_PUBLIC_TON_NETWORK=testnet`** — Mini App stays testnet until P5-09 go/no-go | / | env-matrix.md |
| 2.3 | **`DATA_SOURCE=api`** — does not imply on-chain honesty; badge rules per ADR-001 §3 | / | ADR-001 |
| 2.4 | **`CORS_ORIGIN`** — set to the exact prod Mini App origin, no trailing slash | / | staging-deploy.md |
| 2.5 | **`ADMIN_API_SECRET`** — set in SM, ≥32 chars; admin routes mounted | / | admin-pause.md |
| 2.6 | **`TELEGRAM_BOT_TOKEN`** — prod bot token from BotFather; not a test token | / | |
| 2.7 | **`SESSION_SECRET`** — ≥32 random chars, rotated at least once during drill | / | |
| 2.8 | **Database credentials** — password rotated from defaults; not the dev-only `digihouse:digihouse` | / | |
| 2.9 | **`PAYOUT_WORKER_ENABLED=false`** — initially disabled; enable after monitoring baseline | / | |
| 2.10 | **TonConnect manifest** — `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` resolves to absolute HTTPS URL | / | |

---

## 3. Security & trust readiness

| # | Item | Status | Notes |
|---|---|---|---|
| 3.1 | **Pre-audit checklist** — all items PASS or N/A; no Critical-open findings | / | P5-02 |
| 3.2 | **Pen-test report** — auth/IDOR/session findings closed or accepted with mitigating controls | / | P5-01 |
| 3.3 | **Supply-chain policy** — dependency scanning active; no unpatched high-severity CVEs in production deps | / | supply-chain.md |
| 3.4 | **Honesty assertions** — `PAYOUT_DISCLAIMER` present in earnings UI; no false on-chain claims | / | DESIGN_SYSTEM, ADR-001 |
| 3.5 | **Rate limiting** — auth 10/min, orders 30/min, buys/prepare 15/min configured on mainnet API | / | TM-08 |
| 3.6 | **Secrets never in repo** — confirmed by grep of `DATABASE_URL=postgres://` patterns, private keys, mnemonics | / | ADR-004 §6 |

---

## 4. Infrastructure readiness

| # | Item | Status | Notes |
|---|---|---|---|
| 4.1 | **Mainnet dry-run executed** — all 10 steps signed off; log filed | / | mainnet-dry-run.md |
| 4.2 | **Contract addresses frozen** — registry entries have `registry_frozen_at` set | / | mainnet-dry-run.md step 3 |
| 4.3 | **API blue-green or rolling deploy** — documented procedure (platform-specific) | / | |
| 4.4 | **Database migration applied** — latest migration on prod Postgres | / | |
| 4.5 | **Monitoring & alerts** — healthz, error rate, payout tick, hot wallet balance, pause status | / | |
| 4.6 | **CORS configured** — mainnet API allows mainnet Mini App origin | / | |

---

## 5. Decision

| Criterion | Status |
|---|---|
| All PASS items: | / XX |
| N/A items with documented reason: | / XX |
| Blocking fails: | / 0 |
| **Go / No-go for mainnet launch:** | **PENDING** |

> Sign-off at P5-08 after all items are PASS or documented N/A.
> `SETTLEMENT_MODE=onchain` allowlist launch is a separate decision (P5-09).
