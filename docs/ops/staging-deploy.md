# DigiHouse — Staging Deploy Runbook

**Last updated:** 2026-07-29

## 1. Prerequisites

| Tool | Required | Check |
|---|---|---|
| [Fly.io](https://fly.io) account + `flyctl` installed | `fly version` | `>=0.3` |
| BotFather test bot token | From [@BotFather](https://t.me/BotFather) | Token string |
| Managed Postgres (Fly Postgres, Neon free tier, or Railway) | Connection string with user/pass | `DATABASE_URL` |
| Managed Redis (Upstash free, Railway built-in, or Fly Redis) | Connection string | `REDIS_URL` |
| Mini App deployed to Vercel | URL (e.g., `https://mini-app.vercel.app`) | `CORS_ORIGIN` |
| `flyctl` authenticated | `fly auth whoami` | Shows email |

### Estimated time
- First-time setup: ~30 min (includes provisioning DB + Redis)
- Subsequent deploys: ~2 min per `fly deploy`

---

## 2. API Deploy Steps

### 2.1 Create Fly app (first time only)

```shell
# Create the app
fly apps create digihouse-api-staging

# Optionally: select a different region
# fly regions add lhr  # London
```

### 2.2 Provision databases

**Option A — Fly Postgres (recommended for staging)**

```shell
# Create a Postgres cluster
fly postgres create --name digihouse-pg-staging --region iad --initial-cluster-size 1 --vm-size shared-cpu-1x

# Attach to the API app (sets DATABASE_URL automatically)
fly postgres attach digihouse-pg-staging --app digihouse-api-staging
```

**Option B — External Postgres (Neon, Railway, etc.)**

```shell
# Set the connection string as a secret
fly secrets set DATABASE_URL="postgresql://user:password@host:5432/digihouse?sslmode=require"
```

**Option C — Fly Redis or external** (for payout worker)

```shell
# If using Upstash / Railway Redis:
fly secrets set REDIS_URL="rediss://default:password@host:6379"
```

### 2.3 Set secrets (every deploy — or after rotation)

```shell
# TELEGRAM_BOT_TOKEN — from BotFather test bot (SECRET)
# SESSION_SECRET — random ≥32 chars (SECRET)
fly secrets set \
  TELEGRAM_BOT_TOKEN="1234567890:AA...your-bot-token" \
  SESSION_SECRET="$(openssl rand -base64 32)" \
  DATABASE_URL="postgresql://..." \
  REDIS_URL="redis://..."
```

### 2.4 Set public env vars

```shell
# CORS_ORIGIN must match the Mini App's origin exactly (no trailing slash)
fly env set \
  CORS_ORIGIN="https://mini-app.vercel.app" \
  SETTLEMENT_MODE="hybrid" \
  NODE_ENV="production" \
  PORT="8787" \
  LOG_LEVEL="info" \
  BUY_STUB_NANOTON="10000000" \
  BUY_INTENT_TTL_SECONDS="900" \
  PAYOUT_TICK_MS="60000" \
  PAYOUT_WORKER_ENABLED="false"
```

### 2.5 Deploy

```shell
# From repo root, using the fly.toml config
fly deploy --config fly.toml
```

### 2.6 Verify health

```shell
curl https://digihouse-api-staging.fly.dev/healthz
```

Expected response:

```json
{"ok":"❤️","status":"ok","service":"digihouse-api","ts":"2026-07-29T12:00:00.000Z","settlementMode":"hybrid"}
```

---

## 3. Database Setup

After the API is deployed, the database is empty. Run migrations and seed data.

### 3.1 Run migrations via Fly SSH console

```shell
# Open an interactive console on the running machine
fly ssh console -C "npx tsx apps/api/src/db/migrate.ts"
```

### 3.2 Run seed data

```shell
fly ssh console -C "npx tsx apps/api/src/db/seed/seed-properties.ts"
```

### 3.3 Alternative: from local machine (requires network access)

If the staging Postgres allows connections from your IP or via a proxy:

```shell
# Start Fly proxy to the database
fly proxy 5433:5432 --app digihouse-api-staging

# In another terminal, point to the proxied DB
DATABASE_URL=postgresql://digihouse:digihouse@localhost:5433/digihouse npm run db:migrate

DATABASE_URL=postgresql://digihouse:digihouse@localhost:5433/digihouse npm run db:seed
```

---

## 4. BotFather Configuration

1. Open [@BotFather](https://t.me/BotFather) on Telegram.
2. If you need a new test bot: `/newbot` — follow prompts, save the token.
3. To set the Mini App URL for an existing bot:
   - `/mybot` → select your bot
   - **Bot Settings** → **Menu Button** → configure
   - Set URL to the Mini App staging URL (e.g., `https://mini-app.vercel.app`)
   - Or use shortcut: `/setmenubutton` → send the HTTPS URL
4. The bot token goes into `TELEGRAM_BOT_TOKEN` secret (step 2.3).

---

## 5. Mini App Staging Env

In the Mini App hosting provider (Vercel dashboard), set these env vars:

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_DATA_SOURCE` | `api` | Switch from mock to HTTP repos |
| `NEXT_PUBLIC_API_BASE_URL` | `https://digihouse-api-staging.fly.dev` | API staging URL |
| `NEXT_PUBLIC_TON_NETWORK` | `testnet` | Keep testnet for staging |
| `NEXT_PUBLIC_PAYOUT_TICK_MS` | `60000` | Demo cadence (60s) |

Other `NEXT_PUBLIC_*` vars can stay at their `.env.local.example` defaults. Redeploy the Mini App after changing env vars.

---

## 6. Verification Checklist

| # | Check | Command / How |
|---|---|---|
| 1 | Health endpoint | `curl <api-url>/healthz` → `200 {"status":"ok","service":"digihouse-api"}` |
| 2 | Marketplace public | `curl <api-url>/v1/marketplace` → array of `Listing` (no auth) |
| 3 | Property detail | `curl <api-url>/v1/properties/prop_dubai_marina_01` → single `Listing` |
| 4 | Order book public | `curl <api-url>/v1/properties/prop_dubai_marina_01/order-book` → `{bids, asks}` |
| 5 | Portfolio 401 | `curl <api-url>/v1/portfolio` → `401` (auth required) |
| 6 | Earnings 401 | `curl <api-url>/v1/earnings` → `401` (auth required) |
| 7 | CORS headers | `curl -H "Origin: <mini-app-url>" -I <api-url>/v1/marketplace` → `Access-Control-Allow-Origin` present |
| 8 | Mini App loads | Open staging Mini App URL → marketplace shows properties from API |
| 9 | Auth flow | Mini App authenticates via Telegram initData (200 from `/v1/auth/telegram`) |
| 10 | No mock data | Verify data matches DB seed, not mock seed (e.g. `fundingProgressRatio` values) |

---

## 7. Environment Reference

### 7.1 API env vars (staging)

| Variable | Staging Value | Secret? | Notes |
|---|---|---|---|
| `DATABASE_URL` | Managed Postgres URL | **Yes** | Set via `fly secrets set` |
| `REDIS_URL` | Managed Redis URL | **Yes** | Optional (workers only) |
| `TELEGRAM_BOT_TOKEN` | From BotFather test bot | **Yes** | initData HMAC |
| `SESSION_SECRET` | Random ≥32 chars | **Yes** | JWT signing |
| `CORS_ORIGIN` | `https://mini-app.vercel.app` | No | Exact Mini App origin |
| `SETTLEMENT_MODE` | `hybrid` | No | ADR-001 |
| `NODE_ENV` | `production` | No | |
| `PORT` | `8787` | No | Must match `fly.toml` internal_port |
| `LOG_LEVEL` | `info` | No | |
| `BUY_STUB_NANOTON` | `10000000` | No | 0.01 TON |
| `BUY_INTENT_TTL_SECONDS` | `900` | No | 15 min |
| `PAYOUT_TICK_MS` | `60000` | No | Demo cadence |
| `PAYOUT_WORKER_ENABLED` | `false` | No | Worker runs separately |

### 7.2 Mini App env vars (staging)

| Variable | Staging Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_DATA_SOURCE` | `api` | Switch from mock |
| `NEXT_PUBLIC_API_BASE_URL` | `https://digihouse-api-staging.fly.dev` | API endpoint |
| `NEXT_PUBLIC_TON_NETWORK` | `testnet` | Must match API |
| `NEXT_PUBLIC_PAYOUT_TICK_MS` | `60000` | Demo cadence |
| `NEXT_PUBLIC_TON_RELAY_ADDRESS` | (empty) | Falls back to seed |

---

## 8. Rollback

```shell
# List deployments
fly deployments list

# Rollback to a specific version
fly deployments rollback <version-id>
```

---

## 9. Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| `fly deploy` fails | Missing secrets or env | Run `fly secrets set` before deploy |
| Healthz 500 | `SESSION_SECRET` too short in production | Set ≥32 chars |
| Marketplace 500 | Database not migrated | Run `npm run db:migrate` |
| CORS error in browser | `CORS_ORIGIN` doesn't match Mini App origin | Check for trailing slash |
| `ENOENT drizzle/` | Migrations folder not in image | Check Dockerfile copies `apps/api/drizzle` |
| Auth 401 from Mini App | `TELEGRAM_BOT_TOKEN` mismatch | Verify BotFather token matches API secret |

---

## 10. References

- [Env matrix](../ops/env-matrix.md) — full variable reference
- [ADR-001 Settlement modes](../../docs/adr/ADR-001-settlement-modes.md) — hybrid mode rules
- [OpenAPI spec](../../docs/openapi/digihouse-v0.yaml) — route details
- [Fly.io docs](https://fly.io/docs/) — platform reference
