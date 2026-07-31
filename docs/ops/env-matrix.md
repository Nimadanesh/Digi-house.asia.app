# DigiHouse — Environment matrix

- Status: Draft
- Date: 2026-07-29
- Rule: **names + recommended defaults only** — never commit secret values
- Consumers: web (Next.js Mini App), api (Phase 1 Hono), contracts/deploy (Phase 2)
- Source of truth for config names until Zod schemas land (P1-01)

## 1. Legend

| Column | Meaning |
|---|---|
| Variable | Exact env name |
| S/P | **S** = secret (server / secrets manager only); **P** = public (`NEXT_PUBLIC_*` or non-sensitive) |
| Scope | `web` / `api` / `contracts` / `shared` |
| dev | Recommended local value or pattern |
| staging | Recommended staging value or pattern |
| prod | Recommended prod value or pattern |
| Notes | Owner phase/task; `planned` = not in code yet |

Placeholders only: `postgresql://user:***@host:5432/digihouse`, `sm://…`, `EQD…`.

## 2. Cross-cutting defaults (modes)

From [ADR-001](../adr/ADR-001-settlement-modes.md) §5 — do not invent opposite defaults.

| Env | `SETTLEMENT_MODE` | `NEXT_PUBLIC_DATA_SOURCE` | Rationale |
|---|---|---|---|
| **local dev** | `mock` | `mock` (until P1-15; then optional `api` → local API) | Fast demo; no Postgres required |
| **staging** | `hybrid` | `api` | Durable API + honesty chrome still correct |
| **prod (initial)** | `hybrid` (allowlist `onchain` only after Phase 3+ go/no-go) | `api` | No silent mainnet “verifiable” claims |

| Rule | Detail |
|---|---|
| Do not conflate | `DATA_SOURCE` = where **reads** come from; `SETTLEMENT_MODE` = how buy/earnings **settle** and what UI may claim |
| Forbidden combo | `SETTLEMENT_MODE=onchain` + `NEXT_PUBLIC_DATA_SOURCE=mock` (no chain SoT behind mock) |
| Badge rule | `DATA_SOURCE=api` **never** turns off simulated badges alone (ADR-001) |

**Web reading settlement mode:** prefer server-driven policy later (config endpoint). Do **not** require `NEXT_PUBLIC_SETTLEMENT_MODE` in v0; if added for offline UI, it must stay consistent with API and still obey badge gates.

## 3. Web (Mini App) matrix

| Variable | S/P | Scope | dev | staging | prod | Notes |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_DATA_SOURCE` | P | web | `mock` | `api` | `api` | **P1-15** planned; default mock today |
| `NEXT_PUBLIC_API_BASE_URL` | P | web | `http://localhost:8787` | `https://api-staging.example` | `https://api.example` | Required when `DATA_SOURCE=api`; OpenAPI servers |
| `NEXT_PUBLIC_TON_NETWORK` | P | web | `testnet` | `testnet` | `testnet` → `mainnet` only post go/no-go | Exists (`.env.local.example`) |
| `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` | P | web | unset → `${origin}/seo/tonconnect-manifest.json` | absolute HTTPS staging | absolute HTTPS prod | Exists |
| `NEXT_PUBLIC_TON_RELAY_ADDRESS` | P | web | testnet relay or empty (seed owner) | testnet relay | mainnet relay only if buy stub still used | Exists; not a secret key |
| `NEXT_PUBLIC_PAYOUT_TICK_MS` | P | web | `60000` | `60000` or longer | unused if no mock tick | Mock cadence only; ≠ Friday calendar (ADR-003) |
| `NEXT_PUBLIC_TG_BOT_USERNAME` | P | web | optional | staging bot username | prod bot username | No `@`; share links; not the bot **token** |
| `NODE_ENV` | P | web | `development` | `production` | `production` | Host-set |

Web must **never** set: `TELEGRAM_BOT_TOKEN`, `DATABASE_URL`, `SESSION_SECRET`, deployer keys, hot wallet keys.

## 4. API matrix

| Variable | S/P | Scope | dev | staging | prod | Notes |
|---|---|---|---|---|---|---|
| `DATABASE_URL` | **S** | api | `postgresql://postgres:***@localhost:5432/digihouse` | managed URL via SM | managed URL via SM | **P1-02/03**; never commit password |
| `REDIS_URL` | **S** | api | `redis://localhost:6379` | managed Redis SM | managed Redis SM | **P1-02**; workers |
| `TELEGRAM_BOT_TOKEN` | **S** | api | test bot token via `.env` gitignored | staging bot SM | prod bot SM | **P1-04**; initData HMAC; **never** `NEXT_PUBLIC_*` |
| `SESSION_SECRET` / `JWT_SECRET` | **S** | api | long random local | rotated SM | rotated SM | **P1-05**; name either; pick one in impl |
| `SETTLEMENT_MODE` | P* | api | `mock` or `hybrid` if API up | `hybrid` | `hybrid` (initial) | *not a key material secret; still server-owned | ADR-001 |
| `TON_NETWORK` | P* | api | `testnet` | `testnet` | `testnet`/`mainnet` | Align with web `NEXT_PUBLIC_TON_NETWORK` |
| `TON_API_URL` | P* | api | TonAPI testnet base | testnet | mainnet URL | Indexer/RPC base |
| `TONCENTER_API_KEY` / `TON_API_KEY` | **S** | api | optional local | SM | SM | If provider requires key |
| `ADMIN_TON_WALLET_ADDRESS` | P | api | testnet receive wallet or empty | testnet receive wallet | mainnet receive wallet | Buy payments destination (native TON); fallback admin > TON_RELAY_ADDRESS > listing owner |
| `ADMIN_USDT_WALLET_ADDRESS` | P | api | testnet USDT receive wallet or empty | testnet | mainnet USDT receive wallet | USDT (Jetton) buy rail (ADR-005) |
| `USDT_JETTON_MASTER_ADDRESS` | P | api | testnet master `kQDw5tNMBGsM0ZlLGhA9TSV9iX1nMLrfPZ7HnrQMBxgrAhWe` | testnet master | **mainnet** master `EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs` | Must match `TON_API_URL` network; mismatch rejects every settle (`jetton_mismatch`) |
| `TON_USD_PRICE_CENTS` | P* | api | `200` | current rate | current rate | USD→TON for /v1/buys/prepare payable amount |
| `BUY_STUB_NANOTON` | P* | api | `10000000` | unset (rate used) | unset (rate used) | Stub only when rate unset |
| `PAYOUT_TICK_MS` | P* | api | `60000` demo | staging cadence or cron | Friday cron / worker schedule | Hybrid `tickPayout` **P1-13**; not public web |
| `HOT_WALLET_MAX_TON` | P* | api | `0` or unset | `50` interim | policy cap (§6) | Monitor/enforce; ADR-004 |
| `HOT_WALLET_MIN_TON` | P* | api | unset | low-water for alerts | next-Friday need | Optional low-water (ADR-004) |
| `HOT_WALLET_ADDRESS` | P | api | unset | testnet fund address | prod fund address | Public address OK; **key** is separate S |
| `HOT_WALLET_KEY_REF` | **S** | api | unused claim-only | `sm://…` | `sm://…` | Ref only — never raw key in env files committed |
| `CORS_ORIGIN` | P | api | `http://localhost:3000` | staging Mini App origin(s) | prod Mini App origin(s) | Allowlist |
| `PORT` | P | api | `8787` | platform | platform | OpenAPI local server |
| `LOG_LEVEL` | P | api | `debug` | `info` | `info` | P1-01 logger |
| `NOTIFY_EARNINGS_PAID` | P | api | unset (false) | `true` if TELEGRAM_BOT_TOKEN set | `true` | **P4-01** — Telegram notify on earnings paid; fail-open; default false |
| `NODE_ENV` | P | api | `development` | `production` | `production` | |
| `SENTRY_DSN` | **S**† | api | optional | SM | SM | †DSN often treated as semi-public; still keep server-side |

\*P\* = not cryptographic secret but do not put in client bundle.

## 5. Contracts / deploy matrix

| Variable | S/P | Scope | dev | staging | prod | Notes |
|---|---|---|---|---|---|---|
| `TON_NETWORK` | P | contracts | `testnet` | `testnet` | `mainnet` only post go/no-go | Blueprint network |
| `DEPLOYER_KEY_REF` / `DEPLOYER_MNEMONIC` | **S** | contracts | gitignored local or unset | SM / CI OIDC | SM; minimize online | ADR-004; **P2-08**; never in web |
| `BLUEPRINT_CONFIG` / network endpoints | P | contracts | testnet defaults | testnet | mainnet endpoints | Framework-specific names OK |
| Deploy output `deployments/testnet.json` | P | contracts | local path | committed or artifact | mainnet registry separate | Addresses public; not secret |
| DB write after deploy | — | ops | optional | set `onchain_master` via admin | same | ADR-002 lifecycle; not an env var |

Admin pause keys: see ADR-004 roles — stored in SM, not listed as Mini App env.

## 6. Payout / hot-wallet caps (ADR-004)

| Env | Hot wallet max (interim) | Env var guidance |
|---|---|---|
| **dev** | Unused / dust if claim-only | `HOT_WALLET_MAX_TON=0` or omit key |
| **testnet / staging** | **≤ 50 TON** interim | `HOT_WALLET_MAX_TON=50` |
| **prod** | **≤ max(estimated 1-week rent float for live properties, fixed cap in SM)**; JIT top-up | `HOT_WALLET_MAX_TON=<policy>`; prefer lower of need vs hard cap |

Optional nano form for scripts: `HOT_WALLET_MAX_NANO` (= TON × 1e9) — pick one unit in P1 impl and document here.

Monitoring (ADR-004): alert if balance **>** max or **<** min next-Friday need. Claim-based distribution (ADR-003) keeps hot wallet as **fund pool**, not per-holder pusher.

## 7. Where values live

| Env | Web | API | Contracts |
|---|---|---|---|
| **dev** | `.env.local` gitignored (from `.env.local.example`) | `.env` gitignored + Docker Compose | gitignored key or none |
| **staging** | Vercel/host env (public `NEXT_PUBLIC_*` only) | Fly/Railway/ECS + secrets manager | CI secret / SM for deploy job |
| **prod** | Host env public vars only | **SM** + platform env injection | SM; offline deployer when possible |

| Store | Use for |
|---|---|
| Git | Names in this matrix + `.env*.example` only |
| Doppler / AWS SM / platform secrets | All **S** values |
| Vercel “Environment Variables” | Web **P** only; never bot token |

## 8. Anti-patterns

| ❌ Forbidden | Why |
|---|---|
| Secret in `NEXT_PUBLIC_*` | Bundled to every client (TM-16) |
| `TELEGRAM_BOT_TOKEN` on Vercel public / web project | Session forgery (TM-01) |
| `SETTLEMENT_MODE=onchain` + `DATA_SOURCE=mock` | No chain SoT |
| Assuming `DATA_SOURCE=api` turns badges off | Violates ADR-001 |
| Real keys, tokens, or passwordful URLs **in this file** | Burned forever if committed |
| Committing `.env.local` / `.env` with secrets | Same |
| Sharing deployer key with hot wallet on prod | Blast radius (ADR-004) |
| Exposing `tickPayout` via public env-toggled URL | TM-17 |

## 9. Open questions

1. Single name `SESSION_SECRET` vs `JWT_SECRET` — freeze at P1-05.
2. Whether web needs a public settlement echo (`NEXT_PUBLIC_SETTLEMENT_MODE` vs `/v1/config`) — prefer API config later.
3. Exact prod `HOT_WALLET_MAX_TON` formula owner (ops vs finance) before mainnet.
4. Staging hostname finals (replace `*.example` placeholders at deploy).
5. Sentry DSN classification (public browser vs server-only).

## 10. References

- [ADR-001 — Settlement modes](../adr/ADR-001-settlement-modes.md) — mode defaults §5
- [ADR-003 — Distribution](../adr/ADR-003-distribution-model.md) — tick vs Friday
- [ADR-004 — Key hierarchy](../adr/ADR-004-key-hierarchy.md) — secrets, caps
- [threat-model-v0.md](../security/threat-model-v0.md) — TM-01, TM-05, TM-16
- [TECH_STACK.md](../research/TECH_STACK.md) — Mini App env names
- [`.env.local.example`](../../.env.local.example) — current web public vars
- [digihouse-v0.yaml](../openapi/digihouse-v0.yaml) — API base URL
- [ROADMAP.md](../../ROADMAP.md) — `DATABASE_URL`, `REDIS_URL`, `TELEGRAM_BOT_TOKEN`, `TON_*`
- [EXECUTION-PLAN.md](../../EXECUTION-PLAN.md) — P0-07 acceptance

## 11. Prod dry-run verified

Verified during P5-05 testnet dry-run ([mainnet-dry-run.md](../runbooks/mainnet-dry-run.md)).

| Variable | Prod value | Dry-run verified | Date | Initials |
|---|---|---|---|---|
| `SETTLEMENT_MODE` | `hybrid` | | | |
| `NEXT_PUBLIC_TON_NETWORK` | `testnet` (→mainnet only post P5-09) | | | |
| `NEXT_PUBLIC_DATA_SOURCE` | `api` | | | |
| `CORS_ORIGIN` | `https://<prod-mini-app-origin>` | | | |
| `TELEGRAM_BOT_TOKEN` | SM (prod bot) | | N/A — use test bot for dry-run | |
| `SESSION_SECRET` | SM (≥32 char random) | | N/A — rotated per drill | |
| `ADMIN_API_SECRET` | SM (≥32 char random) | | N/A — rotated per drill | |
| `DATABASE_URL` | SM (managed Postgres) | | N/A — staging DB for dry-run | |
| `HOT_WALLET_MAX_TON` | policy cap per ADR-004 §3 | | N/A — testnet cap ≤50 TON | |
| `PAYOUT_WORKER_ENABLED` | `false` (initial) | | | |
| `TON_NETWORK` (API) | `testnet` | | | |

Fill the table with date and operator initials after each dry-run. Do not copy secret values into this file. N/A entries remain blank when the env was not exercised in the dry-run.
