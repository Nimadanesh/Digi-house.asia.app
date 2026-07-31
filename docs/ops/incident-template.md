# Incident Template

> Copy this template for each incident. One incident per branch or deployment freeze.
> Cross-reference: ADR-004 §2 (pause-everything order), [incident-response.md](../runbooks/incident-response.md)

---

## Incident ID: `INC-<year>-<n>`

| Field | Value |
|---|---|
| **Severity** | SEV1 / SEV2 / SEV3 / SEV4 |
| **Status** | Detecting / Mitigating / Monitoring / Resolved / Post-mortem |
| **Commander** | @name |
| **Detected at** | YYYY-MM-DD HH:MM UTC |
| **Mitigated at** | YYYY-MM-DD HH:MM UTC |
| **Resolved at** | YYYY-MM-DD HH:MM UTC |
| **Duration** | (calculated) |
| **Link to status update** | PR or commit updating `public/status/index.html` |

## Customer impact

| Surface | Affected? | Detail |
|---|---|---|
| **Buy** (shares) | Yes / No | |
| **Payout** (earnings) | Yes / No | |
| **Portfolio / read-only** | Yes / No | |
| **Login / auth** | Yes / No | |

## Honesty impact

> **SEV1 trust** if badges, balances, or earnings could have shown incorrect values.

| Question | Answer |
|---|---|
| Did payout badges appear paid before funds moved? | Yes / No |
| Could balances show wrong holdings? | Yes / No |
| Did any SEV1 data appear honest but was false? | Yes / No |

## Timeline

```
HH:MM UTC — Detection (alert / user report / manual)
HH:MM UTC — Pause initiated (on-chain / API / workers)
HH:MM UTC — Mitigation action completed
HH:MM UTC — Monitoring period started
HH:MM UTC — Resolved (services restored / fix deployed)
```

## Root cause

(One paragraph. If not yet determined, mark "TBD — post-mortem pending." Include relevant commit SHAs, env config, or transaction hashes.)

## Action items

| ID | Action | Owner | PR / Ticket | Status |
|---|---|---|---|---|
| | | | | Open |
| | | | | Open |

## Post-mortem meeting

Scheduled: YYYY-MM-DD. Attendees: [names].

---

## Severity definitions

| Sev | Definition | Ack SLA | Update SLA |
|---|---|---|---|
| **SEV1** | Buy or payout fully down, or trust-compromising data issue affecting all users | 15 min | 30 min |
| **SEV2** | Partial outage affecting a subset of users or degraded experience | 1 h | 4 h |
| **SEV3** | Minor issue with workaround available | next business day | — |
| **SEV4** | Cosmetic, informational, or pre-prod | backlog | — |
