# `@digihouse/api` — DigiHouse HTTP API

Hono-based HTTP API for DigiHouse fractional real estate on TON. Handles auth, marketplace, portfolio, earnings, orders, buy settlement (hybrid), payout ticks, and audit events. Postgres via Drizzle, Redis via BullMQ for the payout worker.

---

## Quick Start

Complete setup in <30 minutes.

```bash
# 1) From repo root — install workspace deps
npm install

# 2) Start local Postgres 16 + Redis (Docker)
npm run infra:up

# 3) Verify infra is healthy
npm run infra:ps

# 4) Create API env file
cp apps/api/.env.example apps/api/.env
#   Edit apps/api/.env if needed (defaults work for local dev)

# 5) Apply database migrations
npm run db:migrate

# 6) Seed properties (≥6 listings: funding, funded, resale)
npm run db:seed

# 7) Start API dev server
npm run dev:api

# 8) Verify it works
curl http://localhost:8787/healthz
```

Expected healthz response:

```json
{ "ok": true, "status": "ok", "service": "digihouse-api", "ts": "2026-07-29T..." }
```

---

## Project Layout

```
apps/api/
  src/
    index.ts            — Entry point (loadEnv → createApp → serve)
    app.ts              — Hono app factory (routes wired from deps)
    env.ts              — Zod env schema + loadEnv() parser
    logger.ts           — Pino structured logger
    db/                 — Drizzle schema, migrations, seed
    auth/               — initData validation, session (JWT), require-session middleware, user-store interface
    marketplace/        — Property listing, property-store interface
    portfolio/          — Holdings, holding-store interface
    earnings/           — Earnings entries, earnings-store interface
    orders/             — Order book, order-store interface
    buys/               — Buy intent + confirm (hybrid settlement)
    audit/              — Append-only audit event writer
    worker.ts           — BullMQ tickPayout worker entry
  drizzle/              — Generated SQL migrations
  .env.example          — Env template
  Dockerfile            — Multi-stage production image (Fly.io)
  fly.toml              — Fly.io deploy config
```

Workspace packages: `apps/api`, `packages/shared` (shared types). Mini App stays at repo root (`npm run dev` → :3000).

---

## Prerequisites

| Dependency | Version | Notes |
|---|---|---|
| Node | >= 24 | `.node-version` pinned |
| npm | >= 10 | Workspaces required |
| Docker | Desktop/Engine | For Postgres + Redis infra |

---

## Environment Variables

Full list of variables consumed by `loadEnv()` in `src/env.ts`. Required vars are **bold**.

### Core

| Variable | Default | Required | Notes |
|---|---|---|---|
| **`PORT`** | `8787` | No | HTTP listen port |
| **`NODE_ENV`** | `development` | No | `development`, `test`, or `production` |
| **`LOG_LEVEL`** | `debug` | No | pino level (`fatal`/`error`/`warn`/`info`/`debug`/`trace`/`silent`) |

### Database

| Variable | Default | Required | Notes |
|---|---|---|---|
| **`DATABASE_URL`** | — | Yes (for auth/routes) | `postgresql://user:pass@host:5432/db` |
| **`REDIS_URL`** | — | No (for worker only) | `redis://host:6379` — required for BullMQ payout worker |

### Auth & Session

| Variable | Default | Required | Notes |
|---|---|---|---|
| **`TELEGRAM_BOT_TOKEN`** | — | Yes (for auth routes) | Telegram Bot token — initData HMAC secret; **never `NEXT_PUBLIC_*`** |
| **`SESSION_SECRET`** | `dev-only-session-secret-min-32-chars!!` (dev default) | Yes (≥32 chars in production) | JWT HS256 signing key. Alias: `JWT_SECRET` |
| **`SESSION_TTL_SECONDS`** | `604800` (7 days) | No | JWT expiry |

### CORS & Buy Settlement

| Variable | Default | Required | Notes |
|---|---|---|---|
| **`CORS_ORIGIN`** | `http://localhost:3000` | No | Allowed origin for CORS |
| **`SETTLEMENT_MODE`** | unset | No | `mock` / `hybrid` / `onchain` — echoed on `/healthz` |
| **`TON_RELAY_ADDRESS`** | — | No | TON address for TonConnect stub messages |
| **`ADMIN_TON_WALLET_ADDRESS`** | — | No | Receive destination for native-TON buy payments (fallback: admin > TON_RELAY_ADDRESS > listing owner). Required for real (non-stub) on-chain settlement |
| **`ADMIN_USDT_WALLET_ADDRESS`** | — | No | Receive wallet for USDT (Jetton) buy payments (ADR-005) |
| **`USDT_JETTON_MASTER_ADDRESS`** | — | No | USDT jetton master — **must match `TON_API_URL`'s network** (testnet `kQDw5tNMBGsM0ZlLGhA9TSV9iX1nMLrfPZ7HnrQMBxgrAhWe`, mainnet `EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs`). A mismatched master rejects every settle (`jetton_mismatch`) |
| **`TON_USD_PRICE_CENTS`** | `200` | No | USD→TON rate used by /v1/buys/prepare to derive the payable nanoTON amount |
| **`BUY_STUB_NANOTON`** | `10000000` | No | NanoTON fallback when TON_USD_PRICE_CENTS is unset (0.01 TON) |
| **`BUY_INTENT_TTL_SECONDS`** | `900` | No | Buy intent TTL (15 min) |
| **`TON_API_URL`** | `https://testnet.tonapi.io` | No | TonAPI base URL. Shared: `/v1/buys/verify-and-settle` (on-chain payment verification) + indexer worker. **Mainnet: `https://tonapi.io`** |
| **`TON_API_KEY`** | — | No | TonAPI API key (sent as `Authorization: Bearer`). Required on mainnet; recommended on testnet (higher rate limits) |

### Payout Worker

| Variable | Default | Required | Notes |
|---|---|---|---|
| **`PAYOUT_WORKER_ENABLED`** | `false` | No | Kill switch — worker exits 0 when `false` |
| **`PAYOUT_TICK_MS`** | `60000` | No | Demo cadence per ADR-003; **not** production Sunday schedule |
| **`ALLOW_MANUAL_PAYOUT_TICK`** | `false` | No | Mount manual tick route (off by default) |
| **`PAYOUT_TICK_SECRET`** | — | No | Secret for manual tick route |

---

## Local Infra — Postgres 16 + Redis

Infra is managed via root [`docker-compose.infra.yml`](../../docker-compose.infra.yml) (does **not** start legacy Next containers).

```bash
npm run infra:up         # start Postgres + Redis
npm run infra:ps         # wait until both are healthy
npm run infra:logs       # optional follow logs
npm run infra:down       # stop
npm run infra:down:v     # stop + wipe volumes (clean slate)
```

| Service | Host port | Credentials (DEV ONLY) |
|---|---|---|
| Postgres 16 | `5432` | user/db/password: `digihouse` / `digihouse` / `digihouse` |
| Redis 7 | `6379` | no auth |

```
DATABASE_URL=postgresql://digihouse:digihouse@localhost:5432/digihouse
REDIS_URL=redis://localhost:6379
```

Manual checks:

```bash
docker exec digihouse-postgres pg_isready -U digihouse -d digihouse
docker exec digihouse-redis redis-cli ping
```

`GET /healthz` still works **without** infra. DB/Redis are required for all routes.

---

## Database — Drizzle ORM

Schema lives in `src/db/schema/`. Migrations in `apps/api/drizzle/`.

### Current migrations

| Migration | Tables |
|---|---|
| `0001_users_wallets` | `users`, `wallets` |
| `0002_properties` | `properties` |
| `0003_holdings` | `holdings` |
| `0004_earnings` | `earnings` |
| `0005_orders` | `orders` |
| `0006_buy_intents_transactions` | `buy_intents`, `transactions` |
| `0007_payout_ticks` | `payout_ticks` |
| `0008_audit_events` | `audit_events` |

### Scripts

```bash
npm run db:migrate       # apply all pending migrations
npm run db:generate      # generate new migration from schema diffs
npm run db:seed          # seed ≥6 properties (idempotent)
npm run db:studio        # Drizzle Studio GUI (optional)
```

### Design notes

- `users.id` = Telegram user id (**text** PK)
- `users.wallet_address` = denormalized primary display wallet
- `wallets` = bind history / multi-wallet source of truth; unique `address`; one primary per user
- Never store private keys
- Money stored as integer minor units: USD in cents, shares as integers

---

## Auth — Telegram initData

Telegram Mini App `initData` is validated **server-side only** with HMAC-SHA-256 per [Validating data received via the Mini App](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).

```ts
import { validateInitData } from "./src/auth/validate-init-data.js";

const result = validateInitData(initData, process.env.TELEGRAM_BOT_TOKEN!);
// result.ok ? { userId, authDate, ... } : { code: "invalid_hash" | "expired" | ... }
```

| Rule | Detail |
|---|---|
| Fail closed | bad/missing hash, expiry, missing user → `ok: false` |
| Timing-safe | hash compare via `crypto.timingSafeEqual` |
| Max age | default 24h (`maxAgeSeconds`); injectable `now` for tests |
| Token | `TELEGRAM_BOT_TOKEN` — never `NEXT_PUBLIC_*` (ADR-004 / TM-01) |

---

## API Routes

All routes return JSON. Mutating routes require `Authorization: Bearer <token>`. Error shape: `{ code: string, message: string }`.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/auth/telegram` | Public | Exchange initData for JWT. Upserts user row. |
| `GET` | `/v1/me` | Bearer | Session probe — returns current user. |

```bash
curl -sS -X POST http://localhost:8787/v1/auth/telegram \
  -H "content-type: application/json" \
  -d '{"initData":"query_id=...&hash=..."}' | jq .

# Grab token from response, then:
curl -sS http://localhost:8787/v1/me -H "Authorization: Bearer <token>"
curl -sS http://localhost:8787/v1/me   # 401
```

### Marketplace

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/marketplace` | Public | List all properties with optional filters |
| `GET` | `/v1/properties/:id` | Public | Single property detail |

```bash
curl -sS "http://localhost:8787/v1/marketplace" | jq .
curl -sS "http://localhost:8787/v1/marketplace?status=funding" | jq .
curl -sS "http://localhost:8787/v1/marketplace?query=dubai" | jq .
curl -sS "http://localhost:8787/v1/properties/prop-marina-vista-4b" | jq .
curl -sS -w "\n%{http_code}\n" "http://localhost:8787/v1/properties/nope"  # 404
```

| Query | Behavior |
|---|---|
| `status` | `funding` \| `funded` \| `resale` (else 400) |
| `query` | case-insensitive match on title **or** location |

Response: `Listing[]` with derived `sharesRemaining` + `fundingProgressRatio`. Default order: `created_at DESC`.

### Portfolio

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/portfolio` | Bearer | User's portfolio summary (holdings, value, yield) |

```bash
curl -sS http://localhost:8787/v1/portfolio -H "Authorization: Bearer <token>" | jq .
```

Response: `PortfolioSummary`. Empty portfolio is valid.

### Earnings

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/earnings` | Bearer | User's earnings summary + per-week entries (pending/paid) |

```bash
curl -sS http://localhost:8787/v1/earnings -H "Authorization: Bearer <token>" | jq .
```

Response: `EarningsSummary` with `totalEarnedUsd`, `pendingUsd`, `paidUsd`, `entries[]`.

### Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/properties/:id/order-book` | Public | Aggregated buy/sell orders for a property |
| `POST` | `/v1/orders` | Bearer | Place a buy or sell order |
| `DELETE` | `/v1/orders/:id` | Bearer | Cancel own order |

```bash
# View order book (public)
curl -sS "http://localhost:8787/v1/properties/prop-marina-vista-4b/order-book" | jq .

# Place order (auth required)
curl -sS -X POST http://localhost:8787/v1/orders \
  -H "content-type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"propertyId":"prop-marina-vista-4b","side":"buy","priceUsd":5000,"quantity":5}' | jq .

# Cancel order
curl -sS -X DELETE http://localhost:8787/v1/orders/ord_<uuid> \
  -H "Authorization: Bearer <token>"   # 204 No Content
```

IDOR protection: only the order owner can cancel. Sell orders validate share balance.

### Buy Settlement

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/buys/prepare` | Bearer | Create buy intent; returns admin receive address + payable nanoTON (sharePrice × qty at TON_USD_PRICE_CENTS) or the USDT jetton_transfer message |
| `POST` | `/v1/buys/confirm` | Bearer | Confirm buy intent; records the payment (boc/txHash) — no shares/ledger changes here |
| `POST` | `/v1/buys/verify-and-settle` | Bearer | Verify the recorded payment on-chain (TonAPI) and settle shares only if it matches the intent (payer + destination + amount + success + ≤30 min old). Idempotent; already-settled intents return `settled` |

```bash
# 1) Prepare
curl -sS -X POST http://localhost:8787/v1/buys/prepare \
  -H "content-type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"propertyId":"prop-marina-vista-4b","quantity":3,"priceUsdPerShare":5000}' | jq .
# Returns intentId, totalUsd, tonConnectMessages, expiresAt

# 2) Confirm (boc may be null in hybrid mode)
curl -sS -X POST http://localhost:8787/v1/buys/confirm \
  -H "content-type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"intentId":"intent_<uuid>","boc":null,"txHash":"<signed-msg-hash>"}' | jq .
# Returns { intentId, status: "confirmed" } — payment recorded, settlement deferred

# 3) Verify + settle (poll until status != pending_confirmation)
curl -sS -X POST http://localhost:8787/v1/buys/verify-and-settle \
  -H "content-type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"intentId":"intent_<uuid>"}' | jq .
# pending_confirmation (tx_not_found / api_unavailable — retry)
# verification_failed (payer_mismatch / destination_mismatch / amount_insufficient / tx_failed / tx_too_old — final)
# settled → shares_sold bumped, holding upserted (WAC), transaction ledger row written with the real txHash
```

### Buy settlement security invariants

| Invariant | How it is enforced |
|---|---|
| **Double settlement** | `settleVerifiedBuy` claims the intent `confirmed → settled` atomically (`markSettled`) before any write; `transactions.buy_intent_id` is UNIQUE, so a second ledger row for the same intent fails |
| **txHash replay across intents** | `confirm` and `verify-and-settle` both reject a wallet-signed txHash already consumed by another intent → `409 { code: "tx_hash_reused" }` (plus a DB partial unique index on `buy_intents.tx_hash`) |
| **Intent ownership** | prepare/confirm/verify all bind to `c.get("userId")`; another user's intent → `404` |
| **Payer wallet** | The connected wallet is stored at prepare (`buy_intents.paid_by_wallet`) and verified on-chain: TON tx must originate from that account; USDT transfer must originate from that owner's jetton wallet (`get_wallet_address`). Mismatch → `verification_failed (payer_mismatch)` |
| **Immutable expectations** | `expected_nano_ton` / `expected_jetton_amount` / `destination_address` are written only at prepare; `confirm` accepts only `boc` + `txHash` |
| **Recency** | Both verifiers reject payments older than 30 minutes (`tx_too_old`) |

In hybrid mode, `boc` is optional (`null`). In mock mode, `tonConnectMessages` is empty. Validate: only `funding` status, quantity within remaining shares, price matches list price.

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/healthz` | Public | Service health (no DB required) |

```bash
curl -sS http://localhost:8787/healthz
```

Response includes `settlementMode` when `SETTLEMENT_MODE` is set.

---

## Mini App — Switching to API

The Mini App defaults to **mock data** (local in-memory). To switch to the API:

1. **Mini App env** (`.env.local`):
   ```
   NEXT_PUBLIC_DATA_SOURCE=api
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8787   # or staging URL
   ```

2. API must be running with `DATABASE_URL` + migrated + seeded.

3. On first load, the Mini App calls `POST /v1/auth/telegram` with Telegram `initData`. The JWT is stored in the session token module and sent as `Authorization: Bearer` on subsequent requests.

4. If the session expires or a 401 is received, the auth provider re-authenticates automatically.

For staging deploy configuration, see [Staging Deploy Runbook](../../docs/ops/staging-deploy.md).

---

## Payout Worker (BullMQ)

Off-chain `pending` → `paid` transition with `simulated:` txHash (ADR-001: hybrid mode). No TON leaves any wallet.

```bash
# Kill switch OFF by default — worker exits immediately
PAYOUT_WORKER_ENABLED=false npm run worker -w @digihouse/api   # exits 0

# Enable (needs REDIS_URL + DATABASE_URL)
REDIS_URL=redis://localhost:6379 PAYOUT_WORKER_ENABLED=true \
  PAYOUT_TICK_MS=60000 npm run worker -w @digihouse/api
```

Idempotency key: `${propertyId}#${weekOf}` in `payout_ticks` table. Core unit tests run **without** Redis (`tick-payout.test.ts`).

---

## Audit Events

Append-only `audit_events` table (migration `0008`). Writers on:
- **Buy confirm** (`buy.confirm`)
- **Buy verify** (`buy.verify`) — every verification outcome (valid / reason)
- **Buy settle** (`buy.settle`) — verified settlement with the on-chain amounts
- **Order cancel** (`order.cancel`)
- **Tick payout** (`payout.tick`) — only when `paidEntries > 0`

No secrets in payload. `payload_hash` = SHA-256 of canonical JSON.

---

## Testing

```bash
# Run all API tests (vitest)
npm run test -w @digihouse/api

# Watch mode
npm run test:watch -w @digihouse/api

# Typecheck
npm run typecheck:api         # from repo root
```

---

## Staging Deploy

Full runbook: [`docs/ops/staging-deploy.md`](../../docs/ops/staging-deploy.md)

Target: `digihouse-api-staging` on Fly.io. Dockerfile + `fly.toml` included.

```bash
# From repo root
fly deploy --config fly.toml
curl https://digihouse-api-staging.fly.dev/healthz
```

---

## Load Smoke

Baseline: [`docs/ops/smoke-marketplace-results.md`](../../docs/ops/smoke-marketplace-results.md)

```bash
# Run smoke test (100 concurrent GETs on /v1/marketplace, 10s)
npm run smoke:marketplace
```

---

## Scripts Reference

| Script | Command | Description |
|---|---|---|
| Dev (watch) | `npm run dev -w @digihouse/api` | tsx watch on src/index.ts |
| Start once | `npm run start -w @digihouse/api` | tsx (no watch) |
| Typecheck | `npm run typecheck:api` | tsc --noEmit |
| Test | `npm run test -w @digihouse/api` | vitest run |
| Test (watch) | `npm run test:watch -w @digihouse/api` | vitest watch |
| DB migrate | `npm run db:migrate` | Apply SQL in apps/api/drizzle |
| DB generate | `npm run db:generate` | Generate migration from schema diffs |
| DB seed | `npm run db:seed` | Seed properties (idempotent) |
| DB studio | `npm run db:studio -w @digihouse/api` | Drizzle Studio GUI |
| Worker | `npm run worker -w @digihouse/api` | BullMQ payout worker |
| Infra up | `npm run infra:up` | Docker Compose Postgres + Redis |
| Infra down | `npm run infra:down` | Stop infra |
| Infra down+v | `npm run infra:down:v` | Stop + wipe volumes |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Invalid API env` on startup | Missing or invalid env var | Check `apps/api/.env` against the env table above. `PORT` must be a number, `LOG_LEVEL` must be valid. |
| `connect ECONNREFUSED` on DB | Postgres not running | `npm run infra:ps` to check. `npm run infra:up` to start. |
| `relation "users" does not exist` | Migrations not applied | `npm run db:migrate` |
| `401` on `/v1/me` | No or bad Bearer token | Call `POST /v1/auth/telegram` first with valid initData. |
| `503` on auth | `TELEGRAM_BOT_TOKEN` not set | Add `TELEGRAM_BOT_TOKEN=...` to `apps/api/.env` |
| `400` on marketplace | Invalid `status` value | Use `funding`, `funded`, or `resale` |
| `404` on property | Wrong property ID | Use a seeded slug. Try `GET /v1/marketplace` to list IDs. |
| `409` on buy confirm | Intent expired or already confirmed | Create a new intent via `POST /v1/buys/prepare`. |
| Worker exits immediately | `PAYOUT_WORKER_ENABLED` is `false` | Set to `true`. Or check if `REDIS_URL` is missing. |
| Worker connection error | Redis not running or wrong URL | Set `REDIS_URL=redis://localhost:6379` and start infra. |
| CORS error in Mini App | Wrong `CORS_ORIGIN` | Set to the Mini App origin. Dev: `http://localhost:3000`. |
| `npm run check` fails after API changes | Type error or lint | Run `npm run typecheck:api` and `npm run lint` separately. |

---

## Out of Scope (later phases)

- Public admin audit list
- Wallet bind `POST /wallets/bind`
- On-chain TON settlement (Phase 2+)
- Rate limiting middleware (P4)
- Multi-language support
