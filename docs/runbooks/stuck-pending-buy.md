# Stuck Pending Buy — Diagnosis & Recovery Runbook

**How to detect, diagnose, and recover from a buy transaction that is stuck in "pending" state.**

> This runbook covers P3-11 (Phase 3). It applies when a user submits a buy via TonConnect, the wallet approves the TX, but the Mini App never transitions to "success" and the holding never appears in Portfolio.

---

## 1. Stuck Transaction Indicators

### User-visible symptoms

- Buy sheet stuck on "Confirming…" spinner for >30s
- TonConnect TX approved in wallet, but Mini App doesn't update
- Refresh → holding not in Portfolio
- Refresh → property shares available unchanged
- No success toast (green, haptic)

### API symptoms

- Buy intent exists but status is `pending` (not `confirmed`)
- `GET /v1/buys/intents` shows intent with `status: "pending"`
- No corresponding `chain_events` entry for the expected wallet interaction

### Indexer symptoms

- Indexer cursor has not moved past the expected transaction block
- `GET /v1/admin/indexer/status` shows stale cursor or `"lastProcessedLt": null`

---

## 2. Diagnosis Steps

### Step 1 — Check the buy intent

```bash
# Requires auth token
curl -sS https://digihouse-api-staging.fly.dev/v1/buys/intents \
  -H "Authorization: Bearer <token>" | jq '.intents[] | {id, status, propertyId, shares, tonAmount}'
```

- If `status: "confirmed"` → holding should exist. Proceed to Step 2.
- If `status: "pending"` → intent not yet confirmed. Proceed to Step 3.
- If no intent found → buy never initiated. User should retry from marketplace.

### Step 2 — Check holding exists

```bash
curl -sS https://digihouse-api-staging.fly.dev/v1/portfolio \
  -H "Authorization: Bearer <token>" | jq '.holdings[] | {propertyId, shares}'
```

- If holding exists with correct shares → UI may have stale state. Clear Mini App cache or reload.
- If holding missing and intent is `confirmed` → race condition. See §3 recovery.

### Step 3 — Check TonConnect TX status

- Open Tonkeeper (testnet) → Activity → find the TX
- Check if TX succeeded, is pending, or failed
- If TX is still pending → wait for wallet confirmation (testnet can be slow)
- If TX failed → insufficient TON, or wallet rejected. User should retry.
- If TX succeeded → proceed to Step 4.

### Step 4 — Check indexer status

```bash
curl -sS https://digihouse-api-staging.fly.dev/v1/admin/indexer/status | jq .
```

- If `"healthy": false` → indexer is down. See §3.
- If cursor is old (more than a few minutes behind) → indexer is lagging. See §3.
- If cursor matches current testnet block → TX may not have been a jetton-transfer. Check recipient address.

### Step 5 — Check chain_events table

```bash
# Via Fly SSH or direct psql
psql $DATABASE_URL -c "SELECT * FROM chain_events WHERE user_id = '<userId>' ORDER BY created_at DESC LIMIT 5;"
```

- If no events for this user → indexer didn't process the transfer. Check indexer logs for TonAPI errors.
- If event exists with `event_type: 'jetton_transfer'` but holding not updated → handler had an error. Check indexer error logs.

---

## 3. Recovery Procedures

### Recovery A: Indexer is down

1. Check `INDEXER_ENABLED=true` in API env
2. Check `TON_API_URL` and `TON_API_KEY` are correct
3. Check `TON_API_KEY` has testnet access (TonCenter Pro doesn't include testnet by default)
4. Restart the API: `fly deploy --app digihouse-api-staging`
5. Verify indexer resumes: cursor should advance within 5s

### Recovery B: Indexer is lagging (cursor stale)

1. Reduce `INDEXER_POLL_MS` to `2000` temporarily (default is 5000)
2. Monitor cursor advancement
3. Once caught up, restore original poll interval

### Recovery C: Intent confirmed but holding missing (race condition)

The intent has `status: "confirmed"` but the holding was not created. This indicates a bug in the confirm handler.

1. Manually inspect the handler response:
   ```bash
   # Attempt a dry-run (read-only check)
   curl -sS https://digihouse-api-staging.fly.dev/v1/buys/intents \
     -H "Authorization: Bearer <token>" | jq .
   ```
2. Create the holding manually via psql (**dev/staging only, never on prod**):
   ```sql
   INSERT INTO holdings (user_id, property_id, shares, avg_cost_cents, total_invested_cents, status)
   VALUES ('<userId>', '<propertyId>', <shares>, <costCents>, <totalCents>, 'active');
   ```
3. Verify portfolio returns the holding correctly.
4. File a bug: the confirm handler must guarantee holding creation before returning `confirmed`.

### Recovery D: Intent is stuck at `pending` with no TX

The user approved the TonConnect prompt but the TX never sent or was lost.

1. Advice for user: **Do not re-submit the buy immediately** — this could create a duplicate intent.
2. Check if the intent has a `created_at` timestamp > 5 minutes ago.
3. If yes, the intent is stale. The API should auto-expire intents > 5 min.
4. User should refresh the property page and start a fresh buy.
5. If intent auto-expiry is missing, file a feature request (P3 backlog).

### Recovery E: User sees "Pending" for >5 min after successful TX

1. Advise user to hard-close the Mini App and re-open
2. If still stuck, check intent status (Step 1)
3. If intent is `confirmed` but UI still shows pending → clear Mini App cache
4. If intent is `pending` but TX succeeded → the TonConnect callback was lost. See Recovery C/D.

---

## 4. Prevention

| Mitigation | Status | Owner |
|---|---|---|
| Buy intent auto-expiry after 5 min | Not implemented (Phase 3 backlog) | — |
| Indexer health alerting | Not deployed | — |
| TonConnect TX fallback polling | Use `@tonconnect/ui-react` `sendTransaction` with `return: "tx"` to get txHash | Implemented |
| Optimistic holding creation on intent confirm | Future work | — |

---

## 5. Escalation

If none of the recoveries above resolve the issue:

1. Collect: intent ID, user ID, property ID, timestamp, wallet address
2. Check API logs for the relevant time window
3. Check TonAPI logs for the relevant testnet TX
4. File a GitHub issue with collected data, labeled `p3-buy-stuck`

---

## 6. References

| Doc | Path |
|---|---|
| Phase 3 E2E testnet demo | [`./phase3-e2e-testnet.md`](./phase3-e2e-testnet.md) |
| Phase 1 demo runbook | [`./phase1-demo.md`](./phase1-demo.md) |
| ADR-001 — Settlement modes | [`../adr/ADR-001-settlement-modes.md`](../adr/ADR-001-settlement-modes.md) |
| Indexer source | `apps/api/src/indexer/` |
| Buy flow source | `src/components/property/buy/` |
