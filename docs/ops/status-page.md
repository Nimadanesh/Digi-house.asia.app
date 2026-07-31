# Status Page

## Public URL

**`https://digihouse.app/status/`** (served from `public/status/index.html` via Next.js static serving).

## Components tracked

| Component | Description |
|---|---|
| **Mini App** | Telegram Mini App frontend (UI, navigation, balances display) |
| **API** | Backend HTTP API (auth, portfolio, earnings, orders, transactions) |
| **Buy** | Share purchase flow (prepare + confirm, primary + secondary) |
| **Payouts** | Weekly earnings distribution (tick, claim, fund transactions) |
| **Telemetry** | Indexer, event processing, payout queue |

## States

| State | Colour | Meaning |
|---|---|---|
| **Operational** | `#45ba5e` | Normal function. |
| **Degraded** | `#e9a820` | Slower than normal or partial feature outage. |
| **Outage** | `#e53935` | Component unavailable for all users. |

## Manual update instructions

The status page is a **static HTML file** at `public/status/index.html`. No API or build step required — edit the file and commit.

### Quick update (outage or degraded)

1. Edit `public/status/index.html`
2. Change the `data-status` attribute and text content of the affected component's status cell:
   - `Operational` → `Degraded` or `Outage`
   - Update the `data-status` attribute to match (`operational` / `degraded` / `outage`)
3. Update the **Last updated** timestamp at the top
4. Commit with message: `docs(status): update status — <reason>`
5. Deploy (via normal deploy pipeline or direct Vercel redeploy)

### Adding a new component

1. Copy an existing `<tr>` row in the table
2. Update the component name
3. Set status to `Operational`
4. Add corresponding style rule if needed (`--status-<name>` is optional — `operational`/`degraded`/`outage` classes apply universally)

## Never auto-claim

- Do **not** dynamically set status to "Operational" based on uptime checks or test results without human review.
- Do **not** claim "All payouts on-chain" in the status page — payout status reflects the hybrid ledger, not on-chain contract state.
- The status file is manually edited. Automation may send alerts but must not write to `public/status/index.html`.

## Alternative: external hosting

If you prefer a hosted status page (Better Stack, Statuspage.io, etc.):

- Configure the external tool to point at `api.digihouse.app/healthz` as the probe endpoint.
- Replace `public/status/index.html` with a redirect to the external page, or remove it.
- Update this doc to reflect the external URL.
