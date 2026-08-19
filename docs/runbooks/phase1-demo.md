# Phase 1 Demo Runbook

**Self-service walkthrough + QA checklist for the full Phase 1 loop.**

> This is an **operational runbook** for engineering, QA, and phase-gate reviewers.
> For the investor/judge pitch script and presentation tips, see [`../../DEMO.md`](../../DEMO.md).

---

## 1. Purpose

Phase 1 delivers a durable HTTP API (Hono + Postgres) behind a Telegram Mini App. This runbook verifies the complete flow — from Mini App launch through marketplace, hybrid buy settlement, portfolio, earnings, and the payout tick — end to end.

**What this proves:**
- Mini App calls the API (not mock data) via `HttpRepos`
- Telegram initData auth produces a valid session
- Marketplace, property detail, portfolio, and earnings routes return correct data
- Hybrid buy settlement persists holdings in Postgres
- Payout worker transitions pending → paid with idempotency
- Audit events fire on every mutating action
- All numbers are proportional (rent × share% = payout)

---

## 2. Prerequisites Checklist

Before starting, confirm each item:

### API

- [ ] API staging deployed (`https://digihouse-api-staging.fly.dev/healthz` returns 200). See [`staging-deploy.md`](../ops/staging-deploy.md).
- [ ] Database migrated (`npm run db:migrate` applied on staging Postgres).
- [ ] Database seeded (`npm run db:seed` — ≥6 properties: funding, funded, resale).
- [ ] `TELEGRAM_BOT_TOKEN` set on staging (valid test bot from BotFather).
- [ ] `SESSION_SECRET` set (≥32 chars in production).
- [ ] `CORS_ORIGIN` set to the Mini App staging URL.
- [ ] `DATABASE_URL` + `REDIS_URL` configured on staging.
- [ ] Payout worker running: `PAYOUT_WORKER_ENABLED=true`, `PAYOUT_TICK_MS=60000` (see §4 step 10).
- [ ] Yield worker running (for steps 14–16): `YIELD_WORKER_ENABLED=true`, `YIELD_TICK_MS=60000`, `UNLOCK_MATURATION_MS` set (default 3 days).

### Mini App

- [ ] Mini App deployed to Vercel with `NEXT_PUBLIC_DATA_SOURCE=api`.
- [ ] `NEXT_PUBLIC_API_BASE_URL` = staging API URL (e.g., `https://digihouse-api-staging.fly.dev`).
- [ ] `NEXT_PUBLIC_TON_NETWORK=testnet`.
- [ ] TonConnect manifest URL is absolute HTTPS (see [`DEPLOY.md`](../../DEPLOY.md)).
- [ ] BotFather Mini App URL points to Vercel staging URL.
- [ ] `npm run check` passes on latest Mini App commit.
- [ ] Load smoke baseline recorded. See [`smoke-marketplace-results.md`](../ops/smoke-marketplace-results.md).

---

## 3. Environment Setup — Two Paths

### Path A: Staging (recommended for gate review)

| Component | URL / Target |
|---|---|
| API | `https://digihouse-api-staging.fly.dev` |
| Mini App | Vercel staging URL → BotFather binding |
| Postgres | Fly Postgres (managed) |
| Redis | Upstash / Fly Redis (managed) |

```bash
# Verify API is reachable
curl https://digihouse-api-staging.fly.dev/healthz

# Verify marketplace returns data
curl https://digihouse-api-staging.fly.dev/v1/marketplace | jq '. | length'
# Expected: ≥6 listings
```

Open the Mini App in Telegram via BotFather (`https://t.me/<bot>/<app>`).

### Path B: Local (for development / debug)

| Component | URL / Target |
|---|---|
| API | `http://localhost:8787` |
| Mini App | `http://localhost:3000` + cloudflared tunnel for Telegram |
| Postgres | Docker (`npm run infra:up`) |
| Redis | Docker (`npm run infra:up`) |

```bash
# Terminal 1 — start infra
npm run infra:up
npm run infra:ps   # wait for healthy

# Terminal 2 — migrate + seed + start API
npm run db:migrate
npm run db:seed
npm run dev:api

# Terminal 3 — start Mini App
cp .env.local.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_DATA_SOURCE=api
#   NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
npm run dev

# Terminal 4 — tunnel (Telegram requires HTTPS)
npx cloudflared tunnel --url http://localhost:3000
# Update BotFather Mini App URL to the cloudflared HTTPS URL
```

> **Note:** The Mini App will **not** render inside Telegram on `localhost:3000` — Telegram requires HTTPS. Use cloudflared (or deploy to Vercel) for any in-Telegram testing.

---

## 4. Walkthrough Script

Execute each step and check the box. If a step fails, consult §5 (Troubleshooting).

| # | Step | What to verify | Req |
|---|---|---|---|
| 1 | **Open TMA in Telegram** | App loads with Telegram theme (dark canvas `#17212b`). Telegram header visible. No white flash. | R-9.1–9.4 |
| 2 | **Onboarding** | ≤3 brand slides. **Get Started** (MainButton). Role picker (Investor / Owner). **Continue** (MainButton). Redirects to Home. | R-1.1–1.5 |
| 3 | **Connect Wallet** | Home shows "Explore Marketplace". Tap → **Connect Wallet** prompt. TonConnect sheet opens. Pick Tonkeeper (testnet). Address appears in header. | R-2.1–2.3 |
| 4 | **Marketplace** | Card list loads (skeleton → cards). ≥6 properties shown. Each card shows weekly yield per share. Filter chips (Funding / Funded / Resale) work. | R-4.1–4.2 |
| 5 | **Property detail** | Tap a **funding** property. Financials block, funding bar, **Weekly Yield** block visible. BackButton works. | R-4.3, R-5.1–5.4 |
| 6 | **Buy flow — prepare** | Buy control. Choose quantity (e.g., 5 shares). Total cost updates live. Projected weekly yield updates live. Tap **Buy** (MainButton). TonConnect TX prompt appears. | R-5.5, R-7.1 |
| 7 | **Buy — confirm (hybrid)** | Approve TonConnect TX (testnet, may fail — that's OK). API confirms intent. Success toast (green, haptic). **Simulated** badge visible on confirmation. | R-7.1, ADR-001 |
| 8 | **Portfolio** | Navigate to Portfolio tab. Holding card visible: property name, shares owned (5), avg cost, current value. Open orders section (empty unless you placed one). | R-8.1–8.3 |
| 9 | **Earnings — pending** | Navigate to Earnings tab. Summary header: "Pending: $X.XX". Per-week entries with **Pending** status. Each entry shows share % and projected amount. | R-6.1–6.4 |
| 10 | **Payout tick** | Wait ≤60s for payout worker (or check logs). Verify via API: the payout tick fires, pending entries flip to **Paid**. `simulated:` txHash visible. Proportional math verified (see §6). | R-6.1, R-6.6 |
| 11 | **Home post-payout** | Navigate to Home. Balance updated. Next payout countdown shows next Sunday. Property card shows updated pending for next week. | R-3.1–3.3 |
| 12 | **Rate limiting** | Send 11 rapid POSTs to `/v1/auth/telegram`. First 10 return 200/400 (valid auth). 11th returns `429` with `{"code":"rate_limit_exceeded","message":"Too many requests"}`. | H3, TM-08 |
| 13 | **Portfolio empty state** | Create a new user (no holdings) via auth. Hit `GET /v1/portfolio`. Response is `200` with `{"holdings":[],...}` — not 500. | R-8.1 |
| 14 | **Yield lock (Phase B)** | On a funded property, lock shares → lock appears (locked shares held). After `UNLOCK_MATURATION_MS`, the lock matures and unlocks (shares free again). Weekly yield accrual rows appear. | Phase B |
| 15 | **Queued sell → sellout (Phase D)** | Place a **custom sell** on a **funding** property → order is `queued` (not matchable). Sell the last primary share (admin or another user) → property flips to `resale`, queued sells activate `open`, seller gets a Telegram notification. | Phase D, PF-02 |
| 16 | **Secondary match (Phase D)** | On a resale property, a crossing buy executes against the resting ask (or vice versa). Verify: trade row, both ledger rows (`trade_buy` / `trade_sell`), seller credited notional − fee, buyer shares moved. | PD-01/02 |
| 17 | **Withdrawal (Phase E)** | Request a withdrawal (withdrawable balance → `requested`). Admin approves → `approved` → mark paid → `paid` + success ledger row. Reject path refunds exactly once. | PE-03 |

> **PF-01/PF-02 automated coverage:** the two money-path E2E specs
> [`e2e/tests/money-path-1.spec.ts`](../../e2e/tests/money-path-1.spec.ts) (buy→lock→yield→unlock→mature→instant sell→shares back)
> and [`e2e/tests/money-path-2.spec.ts`](../../e2e/tests/money-path-2.spec.ts) (buy→queued sell→sellout→match→withdrawal)
> exercise steps 14–17 against staging. The same flows are covered in-process by
> [`apps/api/src/e2e/money-path-1.test.ts`](../../apps/api/src/e2e/money-path-1.test.ts) and
> [`apps/api/src/e2e/money-path-2.test.ts`](../../apps/api/src/e2e/money-path-2.test.ts).

### Detailed verification commands (for QA / headless)

Run these alongside the UI walkthrough to verify the API directly:

```bash
# 1) Health
curl -sS https://digihouse-api-staging.fly.dev/healthz | jq .

# 2) Marketplace list
curl -sS https://digihouse-api-staging.fly.dev/v1/marketplace | jq '. | length'

# 3) Property detail
curl -sS https://digihouse-api-staging.fly.dev/v1/properties/prop-marina-vista-4b | jq .

# 4) Order book (public)
curl -sS https://digihouse-api-staging.fly.dev/v1/properties/prop-marina-vista-4b/order-book | jq .

# 5) Auth — POST /v1/auth/telegram (requires valid initData; use a test fixture or the Mini App's initData from browser dev tools)
# curl -sS -X POST https://digihouse-api-staging.fly.dev/v1/auth/telegram \
#   -H "content-type: application/json" \
#   -d '{"initData":"query_id=...&hash=..."}' | jq .

# 6) Portfolio (auth required)
# curl -sS https://digihouse-api-staging.fly.dev/v1/portfolio \
#   -H "Authorization: Bearer <token>" | jq .

# 7) Earnings (auth required)
# curl -sS https://digihouse-api-staging.fly.dev/v1/earnings \
#   -H "Authorization: Bearer <token>" | jq .
```

**Rate limit smoke:**
```bash
# Send 11 rapid requests; expect first 10 ≤429, 11th = 429
for i in $(seq 1 11); do curl -s -o /dev/null -w "%{http_code}\n" -X POST https://digihouse-api-staging.fly.dev/v1/auth/telegram -H "content-type: application/json" -d '{"initData":"test"}'; done | sort | uniq -c
# Expected output: 10 400 (or 401) and 1 429
```

**Portfolio empty test (requires fresh user token):**
```bash
# Create a new user or use a user with no holdings
# curl -sS https://digihouse-api-staging.fly.dev/v1/portfolio \
#   -H "Authorization: Bearer <fresh_token>" | jq '.holdings | length'
# Expected: 0
```

---

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| White screen / app doesn't load | Mini App URL not set in BotFather, or cloudflared tunnel expired | Re-deploy Mini App, update BotFather URL, restart tunnel. |
| Telegram theme not applied | `@telegram-apps/sdk` init failure | Check browser console for SDK errors. Ensure Mini App served over HTTPS. |
| `401 Unauthorized` on portfolio/earnings | Session expired or initData invalid | Clear Mini App storage, reload. Check TELEGRAM_BOT_TOKEN matches BotFather. |
| `401` on auth endpoint | `TELEGRAM_BOT_TOKEN` not set on API | Add `TELEGRAM_BOT_TOKEN` to staging env. Verify it matches the bot the Mini App was opened from. |
| CORS error in console | `CORS_ORIGIN` doesn't match Mini App origin | Set `CORS_ORIGIN` to the exact Mini App URL (including https://). |
| Empty marketplace | DB not seeded | Run `npm run db:seed` on the staging Postgres. |
| Property detail 404 | Wrong property ID | List properties via `GET /v1/marketplace` to find valid IDs. |
| Buy prepare returns 400 | Property status isn't `funding`, or quantity exceeds remaining shares | Check property status. Choose a `funding` property with available shares. |
| Buy confirm returns 409 | Intent expired or already confirmed | Create a new intent via `POST /v1/buys/prepare`. |
| TonConnect sheet doesn't open | Manifest URL not reachable, or not HTTPS | Verify `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` is an absolute HTTPS URL. Check manifest is served. |
| Payout tick doesn't fire | `PAYOUT_WORKER_ENABLED=false` or `REDIS_URL` missing | Set `PAYOUT_WORKER_ENABLED=true` and ensure `REDIS_URL` points to a reachable Redis instance. |
| Payout tick fires but no entries flip | No pending earnings for any holding, or idempotency key collision | Verify holdings exist and have pending earnings. Check worker logs. |
| `(simulated)` badge missing | `SETTLEMENT_MODE` not set or override logic wrong | API default is mock/hybrid — badge should render. Check ADR-001 badge rules. |
| `npm run check` fails after API changes | Type error or lint | Run `npm run typecheck:api` and `npm run lint` separately to isolate. |
| Load smoke fails | API under-provisioned or DB connection pool exhausted | Increase Fly VM size or DB pool. Re-run smoke after scaling. See [`smoke-marketplace-results.md`](../ops/smoke-marketplace-results.md). |

---

## 6. Phase 1 Exit Checklist

All items must pass before Phase 1 gate is approved.

### Walkthrough

- [ ] Step 1 — TMA opens with Telegram theme
- [ ] Step 2 — Onboarding completes (role selected)
- [ ] Step 3 — Wallet connects (TonConnect)
- [ ] Step 4 — Marketplace loads ≥6 listings from API
- [ ] Step 5 — Property detail renders financials + weekly yield
- [ ] Step 6 — Buy prepare works (intent created, TonConnect messages returned)
- [ ] Step 7 — Buy confirm persists holding + transaction; `simulated` badge visible
- [ ] Step 8 — Portfolio shows holding with correct shares/value
- [ ] Step 9 — Earnings show pending entries with share %
- [ ] Step 10 — Payout tick fires; pending entries become `Paid` within 60s; `simulated:` txHash visible
- [ ] Step 11 — Home updates post-payout (balance, next payout countdown)
- [ ] Step 12 — Rate limiting: 11th rapid request to `/v1/auth/telegram` returns 429
- [ ] Step 13 — Portfolio empty state: fresh user returns 200 with empty holdings

### Quality gates

- [ ] `npm run check` — green (lint + typecheck + build)
- [ ] `npm run test -w @digihouse/api` — green (101 tests, 17 files)
- [ ] `npm run phase1:verify` — green (runs both above)
- [ ] `npm run phase1:smoke-api` — load smoke baseline healthy
- [ ] `npm test` (Mini App tests) — green
- [ ] No console errors during full walkthrough loop
- [ ] No uncaught API errors in staging logs during loop

### Math integrity (R-6.6)

Choose one paid earnings entry and verify proportional math:

```text
Rent/month of property:    $10,000
Share %:                   0.5%
Your weekly payout:        $10,000 × 0.5% = $50.00 → $50 / 4.33 weeks ≈ $11.55 / week

Verify: entry.amountUsd ≈ floor(property.annualRentUsd * shareRatio / 52)
```

- [ ] Verified for ≥1 entry: payout = floor(rent × shareRatio / 52)

### Honesty badges

- [ ] "Simulated" badge visible on buy confirm screen
- [ ] "Simulated" badge visible on paid earnings entry
- [ ] `SETTLEMENT_MODE` correctly reported on `/healthz`
- [ ] Mock txHash prefix is `simulated:`

### Infrastructure

- [ ] Staging deploy runbook verified (P1-17). See [`staging-deploy.md`](../ops/staging-deploy.md).
- [ ] Load smoke baseline recorded and acceptable (P1-18). See [`smoke-marketplace-results.md`](../ops/smoke-marketplace-results.md).
- [ ] TM-08 (rate abuse) risk accepted in threat model. See [`threat-model-v0.md`](../security/threat-model-v0.md).
- [ ] Secrets: no `TELEGRAM_BOT_TOKEN`, `SESSION_SECRET`, or `DATABASE_URL` in repo or console output.

### Improvements (Phase 1 enhancements)

- [ ] Rate limiting active on POST `/v1/auth/telegram` (10/min/IP)
- [ ] Rate limiting active on POST `/v1/orders` (30/min/user)
- [ ] Rate limiting active on POST `/v1/buys/prepare` (15/min/user)
- [ ] Global error handler: generic 500 catch blocks removed (10 routes cleaned)
- [ ] Portfolio N+1 fixed: `getByIds` batch query replaces per-item loop
- [ ] Order cancel is atomic: `UPDATE ... WHERE status='open' RETURNING *` no TOCTOU race
- [ ] Schema migration `0009_phase2_prep.sql` generated and ready (not applied)
- [ ] Drizzle Kit snapshot infrastructure repaired and working

---

## 7. Cleanup / Reset

To reset the demo state between runs:

### Reset seed data (API)

```bash
# Via Fly SSH
fly ssh console -C "npx tsx apps/api/src/db/seed/seed-properties.ts" --app digihouse-api-staging

# Or via local Docker
npm run db:seed   # idempotent — safe to re-run
```

### Reset user state

```bash
# Clear holdings, earnings, orders, buy intents, transactions (dev only)
# Connect to staging Postgres:
fly ssh console -C "psql \$DATABASE_URL -c 'TRUNCATE holdings, earnings, orders, buy_intents, transactions, payout_ticks, audit_events RESTART IDENTITY CASCADE;'" --app digihouse-api-staging
```

### Reset Mini App

- Clear Telegram Mini App cache: Settings → Privacy → Clear Web App Data (varies by client)
- Or re-deploy the Mini App to Vercel with a fresh deploy

### Reset wallet state

- Disconnect wallet via TonConnect in the Mini App settings
- If using a test wallet, reset or switch to a fresh testnet account

### Full clean re-deploy

```bash
# API: re-deploy with fresh DB
fly deploy --config fly.toml --app digihouse-api-staging
fly ssh console -C "npx tsx apps/api/src/db/migrate.ts" --app digihouse-api-staging
fly ssh console -C "npx tsx apps/api/src/db/seed/seed-properties.ts" --app digihouse-api-staging

# Mini App: re-deploy to Vercel
git push   # or Vercel dashboard → Redeploy
```

---

## 8. Phase 1 — Sign-off

### Verification pipeline

| Check | Status | Command |
|---|---|---|
| API tests | ✅ 101 tests, 17 files | `npm run test -w @digihouse/api` |
| Lint | ✅ clean | `npm run lint` |
| TypeScript | ✅ strict, no errors | `npm run typecheck` |
| Production build | ✅ compiled | `npm run build` |
| Full pipeline | ✅ green | `npm run phase1:verify` |
| Load smoke | ✅ baseline recorded | `npm run phase1:smoke-api` |

### Improvements delivered

| Area | Status | Detail |
|---|---|---|
| P1-01..20 | ✅ complete | All 20 Phase 1 deliverables in place |
| Atomic cancelIfOpen | ✅ done | `UPDATE ... WHERE status='open' RETURNING *` — no TOCTOU race |
| Global error handler | ✅ done | `app.onError()` with `requestId` + structured logging; 10 try/catch blocks removed |
| Portfolio N+1 fix | ✅ done | `getByIds` batch query replaces per-item loop |
| Rate limiting | ✅ done | Sliding window: auth 10/min, orders 30/min, buys/prepare 15/min |
| Schema prep migration | ✅ ready | `0009_phase2_prep.sql` — jetton columns + distribution_id index |
| Drizzle Kit snapshot | ✅ repaired | Infrastructure now produces correct diff-only migrations |
| API README | ✅ done | Full env table, route table, quick start, troubleshooting |
| Demo runbook | ✅ updated | 13-step walkthrough including rate limit + portfolio empty tests |

### Sign-off

```
Phase 1 — Fully Improved & Ready
═════════════════════════════════
Go/No-Go for Phase 2:  ✅ GO

No blocking technical debt.
Rate limiting protects TON-triggered routes.
Schema migration 0009_phase2_prep.sql is the first action item of Phase 2.
Run `npm run db:migrate -w @digihouse/api` to apply it.

Approved by: Human Sign-off
Date: 2026-07-29

Phase 1 signed off. Phase 2 authorized.
```

---

## 9. References

| Doc | Path | Content |
|---|---|---|
| Demo pitch & presentation | [`../../DEMO.md`](../../DEMO.md) | 60-second live script, screenshots, pitch one-liner |
| Mini App deploy | [`../../DEPLOY.md`](../../DEPLOY.md) | Vercel, env setup, TonConnect, BotFather |
| API README | [`../../apps/api/README.md`](../../apps/api/README.md) | API setup, env table, route table, troubleshooting |
| Staging deploy runbook | [`../ops/staging-deploy.md`](../ops/staging-deploy.md) | Full Fly.io deploy steps, env tables, verify checklist |
| Load smoke baseline | [`../ops/smoke-marketplace-results.md`](../ops/smoke-marketplace-results.md) | Marketplace GET load test results, TM-08 baseline |
| Env matrix | [`../ops/env-matrix.md`](../ops/env-matrix.md) | dev/staging/prod variable reference |
| Threat model v0 | [`../security/threat-model-v0.md`](../security/threat-model-v0.md) | Risk register, TM-08 rate abuse |
| ADR-001 — Settlement modes | [`../adr/ADR-001-settlement-modes.md`](../adr/ADR-001-settlement-modes.md) | Mock/hybrid/onchain ladder, badge rules |
| USER_FLOW | [`../research/USER_FLOW.md`](../research/USER_FLOW.md) | Detailed journeys, navigation map, haptics |
| REQUIREMENTS | [`../research/REQUIREMENTS.md`](../research/REQUIREMENTS.md) | Full requirement IDs (R-*) |
| DATA_MODELS | [`../research/DATA_MODELS.md`](../research/DATA_MODELS.md) | Shared TypeScript types, money units |
| EXECUTION-PLAN | [`../../EXECUTION-PLAN.md`](../../EXECUTION-PLAN.md) | Progress tracker, next tasks |
| Exit criteria (ROADMAP) | [`../../ROADMAP.md`](../../ROADMAP.md) | Phase 1 exit criteria, full platform strategy |
