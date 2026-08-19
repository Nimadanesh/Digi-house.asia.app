# Incident Response Runbook

**Cross-references**: ADR-004 §2 (pause-everything order), [admin-pause.md](./admin-pause.md), [stuck-pending-buy.md](./stuck-pending-buy.md), [incident-template.md](../ops/incident-template.md), [backup-restore drill](../ops/backup-restore.md) (P5-04), [status-page.md](../ops/status-page.md)

---

## Pause-everything order (ADR-004 §2)

In a SEV1 incident, execute in order. Do not skip steps.

```
1. On-chain pause distribution + sale
   └─ Admin multisig: pause Distribution contract (if on-chain live)
   └─ API: POST /v1/admin/properties/:id/pause scope=all per property
       curl -X POST "https://api.digihouse.app/v1/admin/properties/<id>/pause" \
         -H "X-Admin-Key: <ADMIN_API_SECRET>" \
         -H "Content-Type: application/json" \
         -d '{"scope":"all"}'

2. API kill switch — refuse buys
   └─ Set PAYOUT_WORKER_ENABLED=false in platform env
   └─ Verify: POST /v1/buys/prepare returns 4xx

3. Stop workers
   └─ Pause BullMQ tickPayout queue (or scale worker to 0)
   └─ Stop rent-fund scripts / payout funder
   └─ Verify: no pending→paid flips in monitoring

4. Open incident
   └─ Copy docs/ops/incident-template.md → INC-<year>-<n>.md
   └─ Fill severity, commander, timeline
   └─ Update public/status/index.html → Outage or Degraded
   └─ Notify: #incidents channel
```

**Do not unpause until checklist green** (see § Unpause checklist below).

## Ops alerting (PF-05)

Failed background work alerts the `#incidents` channel via Telegram before a user notices.

**Configuration** (set in platform env, both required to enable):

| Env | Purpose |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Bot used for alerts (same prod bot as user notifications) |
| `OPS_CHAT_ID` | Telegram chat id of the ops channel (user or group) |

When `OPS_CHAT_ID` is unset, alerting is **disabled** and failures only log (`yield job failed` /
`payout job failed` / `match.maker_guard_tripped`) — the API stays healthy either way (fail-open).

**What triggers an alert** (all fail-open — alerting never breaks the failing path):

| Trigger | Source | Subject prefix |
|---|---|---|
| BullMQ yield tick job failed | `yield/queue.ts` `worker.on("failed")` | `Yield job failed` |
| BullMQ payout job failed | `payouts/worker.ts` `worker.on("failed")` | `Payout job failed` |
| Yield boot tick failed (cold worker) | `worker.ts` boot tick | `Yield boot tick failed` |
| Match guard tripped (concurrent change during fill) | `orders/settle-matches.ts` | `Match guard tripped on <property>` |

**Triage**: each alert carries the job id / order ids and the error message. Match-guard alerts are
usually transient (a concurrent cancel/fill); repeated alerts on the same property warrant a SEV2.

**Verify after deploy**: set both env vars, then confirm the worker boot log line
`ops alerting enabled (failed jobs + match guard trips → Telegram)`.

## Incident commander checklist

- [ ] Assign commander (first responder or on-call)
- [ ] Execute pause-everything in order
- [ ] Open incident from template
- [ ] Update status page: set affected components
- [ ] Post initial comms: timeline, impact, ETA
- [ ] Engage on-call engineer(s)
- [ ] Begin root-cause investigation
- [ ] Every 30 min: update status page + incident channel

## Unpause checklist

After root cause is fixed and monitoring confirms stability:

- [ ] Root cause identified and fix deployed
- [ ] Playwright smoke tests pass (or manual equivalent on staging)
- [ ] Buy confirm end-to-end green on testnet/staging
- [ ] Payout tick dry-run produces expected results
- [ ] No residual alert firing in monitoring
- [ ] Incident post-mortem drafted (can complete afterwards)
- [ ] Commander signs off

**Unpause order** (reverse of pause):

1. Start workers (tickPayout, funder)
2. API buy enable (if disabled at app level)
3. On-chain unpause distribution + sale (if on-chain)
4. Update status page → Operational
5. Close incident

## Related runbooks

| Scenario | Runbook |
|---|---|
| Admin pause/unpause via API | [admin-pause.md](./admin-pause.md) |
| Stuck pending buy (user side) | [stuck-pending-buy.md](./stuck-pending-buy.md) |
| Database backup & restore | P5-04 (backup-restore drill) |

## SLAs (proposal)

| Severity | Acknowledgement | Update frequency |
|---|---|---|
| SEV1 | 15 min | every 30 min |
| SEV2 | 1 h | every 4 h |
| SEV3 | next business day | — |
| SEV4 | backlog | — |

> These are **proposals** for human confirmation during P5-08 go/no-go. They are not contractual SLAs.

## Post-mortem process

- Schedule within 5 business days of incident resolution.
- Attendees: commander, responders, relevant engineers.
- Document: timeline, root cause, action items, preventions.
- Action items tracked in incident template.
- Post-mortem filed in `docs/ops/post-mortems/`.
