# Admin: Pause / Unpause Property Sale & Distribution (P4-03)

## One-liner

```bash
curl -X POST "https://api.example.com/v1/admin/properties/<id>/pause" \
  -H "X-Admin-Key: <ADMIN_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"scope":"all"}'
```

## Scope values

| scope     | Effect                                                    |
|-----------|-----------------------------------------------------------|
| `sale`    | Reject new buy prepare + confirm (API returns 409)        |
| `distribution` | TickPayout skips this property (earnings not flipped) |
| `all`     | Both of the above                                         |

## Unpause

Same URL but `…/unpause`:

```bash
curl -X POST "https://api.example.com/v1/admin/properties/<id>/unpause" \
  -H "X-Admin-Key: <ADMIN_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"scope":"sale"}'
```

## Env

| Variable | Required? | Notes |
|---|---|---|
| `ADMIN_API_SECRET` | optional | If unset, `/v1/admin/*` routes are not mounted. **Must be ≥ 32 chars in production.** |

## Who holds the secret

- **Staging**: set in Fly secrets manager; shared with ops team.
- **Prod**: set in platform secrets manager; rotate on incident or key compromise.
- **Never**: in Mini App env, `.env.local`, git, or CI logs.

## Audit trail

Every pause/unpause writes an `audit_events` row with:
- `action = "admin.pause"` or `"admin.unpause"`
- `actor_type = "admin"`
- `payload` includes `{ propertyId, scope }`

## Incident flow ("pause everything")

Per ADR-004 §2:

1. Pause distribution + sale for all active properties (scope=all)
2. Kill payout worker: `PAYOUT_WORKER_ENABLED=false`
3. Open incident per runbook template
4. Do not unpause until incident checklist green
