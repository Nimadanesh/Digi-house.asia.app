# P5-10 — Post-Launch Monitoring Week (On-Call Playbook)

> **This is a playbook for a human on-call engineer.** The agent that created this document did NOT run the on-call week. A human must execute each shift.

---

## On-Call Rotation

| Slot | Name | Dates | Handoff |
|------|------|-------|---------|
| Primary | ________ | ________ → ________ | [[date]] |
| Secondary | ________ | ________ → ________ | [[date]] |
| Escalation | ________ | Emergency only | pager via [[tool]] |

---

## What to Watch (Daily Checklist)

Run the health script (`scripts/oncall-health.ps1` or `scripts/oncall-health.sh`) each morning, then work through the 10 checks below.

### 1. API health + error rate

```bash
curl -sS https://api.digihouse.app/healthz | jq .
```

Expected: `{"status":"ok","launchMode":"allowlist","uptime":"...",...}`

If status ≠ `ok` → [incident-response.md](../runbooks/incident-response.md).  
Check API logs for 5xx spikes in past 24 h (Fly logs or your log sink).

### 2. Marketplace latency smoke

Run the smoke script or health script (it curls `/v1/marketplace`):

```bash
bash scripts/oncall-health.sh
.\scripts\oncall-health.ps1
```

Thresholds (proposal):
- p99 latency < 1000 ms
- Error rate < 1%

If exceeded → investigate query perf, DB connection pool, rate-limiter config.

### 3. Buy success / fail counts

Pull buy metrics from logs or DB:

```sql
-- Via psql
SELECT status, count(*), date_trunc('hour', created_at) AS hour
FROM buy_intents
WHERE created_at > now() - interval '24 hours'
GROUP BY status, hour ORDER BY hour;
```

Alert if:
- `failed` / `expired` spikes above 10% of total
- `pending` older than 5 min (→ [stuck-pending-buy.md](../runbooks/stuck-pending-buy.md))

### 4. Indexer lag / reconciliation

If `SETTLEMENT_MODE=onchain`:
- Check `GET /v1/admin/indexer/status`
- Expected: `"healthy": true`, cursor advancing every poll interval
- If stale > 60 s → recovery in [stuck-pending-buy.md](../runbooks/stuck-pending-buy.md)

If `SETTLEMENT_MODE=hybrid` (current default):
- **N/A** — indexer not needed for payout path.
- Note: future on-chain flip will enable this check.

### 5. Pending buys older than SLA

Query intents with `status='pending'` and `created_at < now() - interval '5 minutes'`:

```sql
SELECT id, user_id, property_id, created_at
FROM buy_intents
WHERE status = 'pending' AND created_at < now() - interval '5 minutes';
```

If any found → [stuck-pending-buy.md](../runbooks/stuck-pending-buy.md).

### 6. Hot wallet balance

Check the hot wallet address (see env `HOT_WALLET_ADDRESS`) on Tonviewer.

Thresholds (proposal):

| Metric | Floor | Ceiling | Action |
|--------|-------|---------|--------|
| Balance | < 10 TON | — | Top up from cold storage |
| Balance | — | > `HOT_WALLET_MAX_TON` | Sweep excess to cold storage |
| TX count (24h) | 0 | — | Verify payout worker is running |

If payout worker is not running → check `PAYOUT_WORKER_ENABLED` env var.

### 7. Payout job last success (Sunday focus)

Every Sunday (payout day):
- Check `POST /v1/admin/worker/status` (if implemented) or logs for `payout.tick` completion
- Verify last payout batch has `status = 'paid'`
- Check earnings entries for the current week are visible to users
- If no payout in 24 h past scheduled → investigate worker health

### 8. Honesty spot-check

Verify settlement-mode badges match backend:

```bash
curl -sS https://api.digihouse.app/healthz | jq '.settlementMode'
```

- If `hybrid` → UI should show "Simulated" badge on earnings
- If `onchain` → UI should show "On-Chain" badge
- Flip UI badge source: `store.settlementMode` from `/healthz`

### 9. Rate-limit saturation

Inspect API logs for `429 Too Many Requests` responses:

```bash
# Fly: grep recent 429s
fly logs --app digihouse-api | grep "429"
```

If sustained rate-limiting is hitting legitimate users → adjust `RATE_LIMIT_MAX` and/or `RATE_LIMIT_WINDOW_MS` in env config. Update caller after change.

### 10. Status page accuracy

Open `https://status.digihouse.app` and confirm:

- [ ] Components listed match actual services (API, indexer, TON RPC, payout worker)
- [ ] Current status reflects reality
- [ ] No incident from previous day still marked "Investigating" without update

If the status page is stale → update `public/status/index.html` and deploy.

---

## Paging Thresholds (Proposal)

| Condition | Severity | Action |
|-----------|----------|--------|
| API returns non-ok healthz for > 2 consecutive polls | SEV1 | Call primary + secondary |
| p99 marketplace latency > 2000 ms for 5 min | SEV2 | Investigate, page secondary |
| Buy confirm failure rate > 10% in 15 min window | SEV1 | Pause buys → incident |
| Hot wallet balance < 5 TON | SEV2 | Top up from cold storage |
| No payout in 48 h past scheduled | SEV2 | Investigate worker |
| Pending buys > 5 min old and growing | SEV2 | Run stuck-pending runbook |
| Rate-limit saturation affecting > 5% of requests | SEV3 | Tune limits |

---

## Daily Log Template

Use `docs/ops/on-call-daily-log.md`. One section per day. Fill in:

```markdown
## Day N — YYYY-MM-DD

**On-call:** ________

| Check | Status | Notes |
|-------|--------|-------|
| 1. Healthz | ✅ / ❌ / N/A | |
| 2. Marketplace latency | ✅ / ❌ / N/A | |
| 3. Buy success/fail | ✅ / ❌ / N/A | |
| 4. Indexer lag | ✅ / ❌ / N/A | |
| 5. Stuck pending buys | ✅ / ❌ / N/A | |
| 6. Hot wallet balance | ✅ / ❌ / N/A | |
| 7. Payout job | ✅ / ❌ / N/A | |
| 8. Honesty badges | ✅ / ❌ / N/A | |
| 9. Rate-limit | ✅ / ❌ / N/A | |
| 10. Status page | ✅ / ❌ / N/A | |

**Incidents:** None / [[INC-yyyy-n link]]

**Notes:**
- ...
```

---

## Handoff Checklist

When your on-call shift ends:

- [ ] Daily log filled for your last day
- [ ] Outstanding incidents transferred to incoming primary
- [ ] Status page up to date
- [ ] Hot wallet balance documented (TON amount + timestamp)
- [ ] Escalation paths verified with incoming primary
- [ ] Key: `ADMIN_API_SECRET` location (secrets manager, never in plaintext)
- [ ] Key: database connection string location
- [ ] Known issues / quirks communicated verbally or in log

---

## Escalation Tree

```
User reports issue
       │
       ▼
On-call primary (first responder)
       │
       ├─ Can fix?  → Fix and log
       │
       └─ Needs help?
              │
              ▼
       On-call secondary
              │
              ├─ SEV1 and needs commander?
              │       ▼
              │  Incident commander (see incident-response.md)
              │
              └─ Needs SME?
                      ▼
              Backend / Contract eng (see team list)
```

Full incident flow: [incident-response.md](../runbooks/incident-response.md)

---

## Week-End Report

After the 7-day monitoring period, fill `docs/ops/on-call-week-report-TEMPLATE.md` (create copy with date):

1. Summary of each day's findings
2. Incidents count and severity breakdown
3. Threshold adjustments proposed
4. Runbook improvements discovered
5. Go/no-go recommendation for full launch (allowlist → open)

---

## References

| Doc | Path |
|-----|------|
| Incident response | [`../runbooks/incident-response.md`](../runbooks/incident-response.md) |
| Admin pause/unpause | [`../runbooks/admin-pause.md`](../runbooks/admin-pause.md) |
| Stuck pending buy | [`../runbooks/stuck-pending-buy.md`](../runbooks/stuck-pending-buy.md) |
| Mainnet checklist | [`./mainnet-checklist.md`](./mainnet-checklist.md) |
| Status page | [`./status-page.md`](./status-page.md) |
| Allowlist launch | [`../runbooks/allowlist-launch.md`](../runbooks/allowlist-launch.md) |
| Env matrix | [`./env-matrix.md`](./env-matrix.md) |
| Smoke marketplace results | [`./smoke-marketplace-results.md`](./smoke-marketplace-results.md) |
| Health check script (bash) | [`../../scripts/oncall-health.sh`](../../scripts/oncall-health.sh) |
| Health check script (PowerShell) | [`../../scripts/oncall-health.ps1`](../../scripts/oncall-health.ps1) |
