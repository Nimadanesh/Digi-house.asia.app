# DigiHouse — Product & Platform ROADMAP

> **Audience:** founders, investors, engineers  
> **Scope:** path from polished Telegram Mini App frontend → production-ready fractional real estate on TON  
> **Companion docs:** `docs/research/*` (product specs), `AGENTS.md` (frontend rules), `docs/research/ROADMAP.md` (historical frontend build phases)  
> **Last updated:** 2026-07-29 · Phase 0 docs pack ready — sign-off: `docs/ops/phase0-signoff.md`

---

## 1. Project Current State

### What DigiHouse is today
**DigiHouse** is a **Telegram Mini App** for buying fractional property shares and earning **weekly rental yield** on **TON**. The frontend is competition/demo–ready:

| Layer | Status |
|---|---|
| Native-Telegram UI (dark canvas, blocks, tabs, sheets, haptics) | ✅ Shipped |
| Screens: Onboarding, Home, Marketplace, Property, Buy flow, Earnings, Portfolio, Settings | ✅ Shipped |
| i18n (`next-intl`, multi-locale + RTL) | ✅ Shipped |
| TonConnect wallet connect + buy TX stub (synthetic `txHash`) | ✅ Shipped |
| Repository interfaces + mock data (`getRepo()` swap point) | ✅ Shipped |
| TanStack Query + Zustand, performance pass (cache, memo, haptics path) | ✅ Shipped |
| Real backend / database | ❌ Not started |
| Real TON property jettons / distribution contracts | ❌ Scaffold only (`ContractBase`) |
| Legal SPV / KYC / fiat on-ramp | ❌ Out of frontend MVP |

### Architecture today (frontend-only)
```
Telegram WebView
    └── Next.js 16 Mini App (Vercel)
            ├── @telegram-apps/sdk-react  (theme, MainButton, haptics)
            ├── @tonconnect/ui-react      (wallet connect + stub TX)
            ├── TanStack Query           (server cache)
            ├── Zustand                  (UI / settings)
            └── getRepo() ──► src/lib/mock/*   (in-memory seed)
```

**Honest MVP labeling (non-negotiable):** weekly payouts and buy settlement are **simulated**. Copy uses “simulated weekly payout · on-chain verifiable post-MVP”. Real rent → wallet is **post-MVP**.

### What is already designed for the swap-in
- Domain types in `src/types/` mirror `docs/research/DATA_MODELS.md` (App / DB / On-chain layers).
- Repo contracts: `MarketplaceRepo`, `OrderBookRepo`, `PortfolioRepo`, `EarningsRepo`, `TxRepo`.
- Units: money = integer cents; TON = nanoTON; shares = integers.
- Weekly yield math: `weeklyRent = floor(annualRentUsd / 52)`, `projectedYield = floor(weeklyRent × shares / totalShares)`.

---

## 2. Target Final Product

A production DigiHouse that an investor can trust and a VC can diligence:

### Product capabilities
1. **Telegram auth** — verify `initData`, bind Telegram user ↔ TON wallet.
2. **Property listings** — curated / compliance-approved assets with legal docs, photos, APY, funding state.
3. **Primary sale** — buy shares with TON (or stable jetton); mint/transfer property jettons on-chain.
4. **Portfolio** — live holdings from chain + indexed DB; PnL, open orders.
5. **Weekly rental yield (hero)** — every Friday UTC, rent pool distributed **proportional to share**, as real TON (or jetton) transfers with **verifiable tx hashes**.
6. **Secondary market** — limit/market orders (off-chain matching first; optional on-chain book later).
7. **Owner portal** — list % of property, fund rent pool, see raise progress (phase 4+).
8. **Ops & compliance** — admin console, audit logs, KYC gates where required, incident runbooks.
9. **Investor-grade trust** — transparency pages, explorer links, simulated vs on-chain clearly separated until cutover.

### Non-functional targets
| NFR | Target |
|---|---|
| Security | Wallet-bound sessions, signed Telegram auth, least-privilege keys, audited contracts |
| Availability | API 99.5%+ MVP; 99.9% post-Series seed |
| Latency | API p95 < 300ms (read); buy confirm UX < 15s wallet-dependent |
| Scalability | 10k MAU design; horizontal API workers; indexed chain events |
| Auditability | Every payout row → on-chain tx; immutable event log |
| Compliance posture | Jurisdiction matrix; no “guaranteed yield” claims; SPV/legal off-app |

### Success criteria for “investor demo v2”
- [ ] Real testnet jetton mint on buy  
- [ ] Real testnet weekly distribution to ≥2 wallets  
- [ ] Frontend shows **real** `txHash` with explorer link (no “simulated” badge on that path)  
- [ ] Backend API replaces mock behind `getRepo()` without UI rewrite  
- [ ] Security review checklist green (see Phase 5)  
- [ ] Runbook: deploy, pause distribution, incident response  

---

## 3. Architecture Overview

### 3.1 High-level system
```
┌─────────────────────────────────────────────────────────────────┐
│                     Telegram + TonConnect                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Mini App (Next.js) — presentation only                          │
│  hooks → lib/api client → NEVER lib/ton contracts from UI        │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS + Telegram initData
┌────────────────────────────▼────────────────────────────────────┐
│  API Gateway (Hono / Fastify on Node 22+)                        │
│  Auth · Rate limit · Validation (Zod) · OpenAPI                  │
└───────┬───────────────────┬─────────────────────┬───────────────┘
        │                   │                     │
        ▼                   ▼                     ▼
┌───────────────┐  ┌─────────────────┐  ┌────────────────────┐
│ PostgreSQL    │  │ Redis           │  │ Worker / Cron      │
│ (source of    │  │ sessions,       │  │ Friday payout kick │
│  truth off-   │  │ rate limits,    │  │ order matcher      │
│  chain)       │  │ job queues      │  │ indexer consumer   │
└───────┬───────┘  └─────────────────┘  └─────────┬──────────┘
        │                                         │
        │              ┌──────────────────────────▼──────────┐
        │              │  Chain Indexer (TonAPI / custom)     │
        │              │  jetton transfers, dist events       │
        │              └──────────────────────────┬──────────┘
        │                                         │
        └──────────────────┐        ┌─────────────▼──────────┐
                           │        │  TON (testnet→mainnet)  │
                           │        │  · Property Jetton M     │
                           │        │  · Distribution Contract │
                           │        │  · (optional) OrderBook  │
                           │        │  · Treasury / Relay      │
                           └────────┴─────────────────────────┘
```

### 3.2 Recommended tech stack (production path)

| Concern | Choice | Why |
|---|---|---|
| **API** | **TypeScript + Hono** (or Fastify) monorepo package | Same language as Mini App; tiny cold start; Zod-first |
| **Monorepo** | **pnpm workspaces** or Turborepo: `apps/web`, `apps/api`, `packages/shared`, `contracts/` | Shared types from DATA_MODELS |
| **DB** | **PostgreSQL 16** + **Drizzle ORM** (or Prisma) | Relational fit for holdings/orders/distributions; strong migrations |
| **Cache / queue** | **Redis** + **BullMQ** | Friday jobs, indexer backlog, rate limits |
| **Auth** | Validate Telegram `initData` HMAC; session JWT (httpOnly cookie or Authorization) bound to `telegramUserId` + optional wallet | Standard TMA pattern |
| **Object storage** | S3-compatible (R2 / S3) for property docs & images | CDN-friendly |
| **TON contracts** | **Tact** or **FunC** + Blueprint; `@ton/core` / `@ton/ton` off-chain | Ecosystem standard; Blueprint testnet deploy |
| **Indexing** | TonAPI webhooks + own confirmation poller | Don’t trust single RPC |
| **Secrets** | Doppler / AWS Secrets Manager; **never** commit deployer keys | Hot wallet = payout relay only, capped |
| **Hosting** | Web: **Vercel**; API+workers: **Fly.io / Railway / AWS ECS**; DB: managed Postgres (Neon/RDS) | Clear split of static Mini App vs long-running workers |
| **Observability** | OpenTelemetry + betterstack/grafana; Sentry | Investor diligence expects this |
| **CI** | GitHub Actions: lint, typecheck, unit, contract tests, migrate dry-run | Gate every merge |

### 3.3 Separation of concerns (hard rules)
1. **UI never calls chain or DB** — only hooks → API client (same boundary as today’s `getRepo()`).
2. **API owns business rules** — funding caps, KYC gates, order validation, payout math.
3. **Contracts own custody & transfers** — share balances and rent nanoTON; no off-chain “trust me” for balances in production mode.
4. **Indexer is the bridge** — chain events → DB projections; UI reads projections + explorer links.
5. **Money units stay integer** — cents off-chain; nanoTON on-chain; convert only at boundaries with audited rates.
6. **Simulated vs live modes** — feature flag `SETTLEMENT_MODE=mock|hybrid|onchain`; UI badge follows mode.

### 3.4 Core domain services (API)
| Service | Responsibility |
|---|---|
| `AuthService` | initData verify, session issue/revoke |
| `UserService` | profile, wallet bind/unbind, prefs |
| `ListingService` | CRUD listings (admin), public read |
| `PrimarySaleService` | buy intent → prepare TX → confirm via indexer |
| `PortfolioService` | holdings projection, PnL |
| `OrderBookService` | place/cancel/match (off-chain first) |
| `DistributionService` | schedule weeks, compute shares, kick contract / record results |
| `IndexerService` | ingest TON events, idempotent apply |
| `AdminService` | pause, force-sync, audit export |

### 3.5 Smart contract set (target)
| Contract | Role |
|---|---|
| **PropertyJettonMaster** | One jetton master per property; total supply = `totalShares` |
| **PropertyJettonWallet** | Standard jetton wallets per holder |
| **Distribution** | Holds weekly rent nanoTON; `distribute()` or claim-based payout; emits events |
| **Sale/Primary** (optional) | Escrow primary raise; mint on payment; or admin mint + off-chain payment record in hybrid |
| **Treasury** | Platform fee sink (bps) |
| **Multisig / Timelock** | Admin ops (pause, parameter change) |

**MVP-on-chain preference:** start with **claim-based** or **batched distributor** (gas-bounded), not unbounded loops over all holders in one TX.

### 3.6 Weekly yield — production invariant
```
For each property P, week W (Monday 00:00 UTC → Friday payout):
  rentPoolNano = funded amount for W
  for each holder h with balance b:
    amount_h = floor(rentPoolNano * b / totalSupply)
  remainder → treasury or next week (document dust policy; match DATA_MODELS)
  each amount_h → on-chain transfer + EarningsEntry(status=paid, txHash=real)
```

---

## 4. Phase Breakdown

> **Principle:** each phase ends with a **demoable vertical slice**, not a layer cake of unfinished systems.  
> **Estimate bands** assume 2–3 full-stack engineers + 1 contract engineer; calendar time is guidance, not a commitment.

---

### Phase 0 — Governance & cutover plan *(1 week, parallel)*
**Goal:** lock decisions so engineering doesn’t thrash.

**Deliverables**
- [x] Settlement mode ladder: `mock` → `hybrid` → `onchain` → [`docs/adr/ADR-001-settlement-modes.md`](./docs/adr/ADR-001-settlement-modes.md)
- [x] Jurisdiction / “who can buy” policy (even if “testnet only + geo-block later”) → ADR-001 §7
- [x] Key management policy (deployer, payout hot wallet max balance, multisig) → [`docs/adr/ADR-004-key-hierarchy.md`](./docs/adr/ADR-004-key-hierarchy.md)
- [x] OpenAPI draft for repo-shaped endpoints (mirror `MarketplaceRepo` etc.) → [`docs/openapi/digihouse-v0.yaml`](./docs/openapi/digihouse-v0.yaml)
- [x] Threat model v0 (STRIDE lite) → [`docs/security/threat-model-v0.md`](./docs/security/threat-model-v0.md)
- [x] Jetton deploy model → [`docs/adr/ADR-002-jetton-factory.md`](./docs/adr/ADR-002-jetton-factory.md)
- [x] Distribution model → [`docs/adr/ADR-003-distribution-model.md`](./docs/adr/ADR-003-distribution-model.md)
- [x] Env matrix → [`docs/ops/env-matrix.md`](./docs/ops/env-matrix.md)
- [x] ADR index → [`docs/adr/README.md`](./docs/adr/README.md)

**Exit:** written ADR set in `docs/adr/`; team signed off via **`Phase 0 accepted`** (2026-07-29) — checklist [`docs/ops/phase0-signoff.md`](./docs/ops/phase0-signoff.md). **Phase 1 unlocked** → `do P1-01`.

---

### Phase 1 — Backend Foundation + API  
**Goal:** replace mock with a real API + Postgres while frontend keeps working via `getRepo()` HTTP adapter.  
**Est.:** 3–5 weeks

#### 1.1 Platform skeleton
- Monorepo: `apps/api`, `packages/shared` (types from DATA_MODELS), `apps/web` (existing Mini App)
- Hono/Fastify app: health, metrics, structured logging
- Config via env schema (Zod): `DATABASE_URL`, `REDIS_URL`, `TELEGRAM_BOT_TOKEN`, `TON_*`
- Docker Compose: Postgres + Redis for local dev

#### 1.2 Database schema (v1)
Tables (align with DATA_MODELS):
- `users`, `wallets`
- `properties`, `property_media`, `property_documents`
- `holdings`, `orders`, `order_fills`
- `rental_distributions`, `earnings_entries`
- `transactions` (app-level ledger)
- `audit_events`
- Migrations with Drizzle/Prisma; seed script from current mock seed

#### 1.3 Auth
- `POST /auth/telegram` — validate `initData`, upsert user, issue session
- Middleware: require session on mutating routes
- Wallet bind: `POST /wallets/bind` with TonConnect proof (or signed message)

#### 1.4 Public + private API (parity with repos)
| Method | Path | Maps to |
|---|---|---|
| GET | `/v1/marketplace` | `MarketplaceRepo.list` |
| GET | `/v1/properties/:id` | `MarketplaceRepo.get` |
| GET | `/v1/properties/:id/order-book` | `OrderBookRepo.get` |
| GET | `/v1/portfolio` | `PortfolioRepo.summary` |
| GET | `/v1/earnings` | `EarningsRepo.summary` |
| POST | `/v1/orders` | place order (auth) |
| DELETE | `/v1/orders/:id` | cancel |
| POST | `/v1/buys/prepare` | build unsigned intent / deep-link payload |
| POST | `/v1/buys/confirm` | attach boc / wait indexer (hybrid) |

#### 1.5 Frontend adapter
- Implement `HttpRepos` behind `getRepo()` when `NEXT_PUBLIC_DATA_SOURCE=api`
- Keep mock path for Storybook / offline demos
- Auth header / cookie wiring in `Providers`

#### 1.6 Ops baseline
- OpenAPI published; Postman/Bruno collection
- CI: migrate + API tests
- Staging deploy (Fly/Railway) + staging Mini App URL in BotFather test bot

**Exit criteria**
- [ ] Mini App on staging uses API (not mock) for all reads  
- [ ] Buy still hybrid/mock settlement but **persists holdings in Postgres**  
- [ ] Earnings list from DB; Friday job can flip pending→paid **off-chain** with audit row  
- [ ] Load smoke: 100 concurrent GETs healthy  
- [ ] No secrets in repo; `npm run check` + API test suite green  

---

### Phase 2 — TON Smart Contracts & Tokenization  
**Goal:** deploy testnet contracts that represent shares and can pay weekly rent.  
**Est.:** 4–6 weeks (overlaps late Phase 1)

#### 2.1 Contract design freeze
- ADR: jetton-per-property vs single factory  
- ADR: push distribution vs pull/claim  
- Fee bps, pause, upgrade policy (prefer immutable + new deploy)  
- Test vectors for dust / rounding (match DATA_MODELS floor rules)

#### 2.2 Implement & test
- Blueprint project under `contracts/`
- Unit tests: mint, transfer, distribute/claim, pause, unauthorized reject
- Fuzz/property tests for conservation: `sum(payouts) + dust == rentPool`
- Gas benchmarks for N holders (document max batch size)

#### 2.3 Deploy pipeline
- Testnet deploy scripts; address registry in DB `properties.onchain_master`, `properties.distribution_address`
- Multisig or dual-key for admin on testnet
- Block explorer deep-link templates in shared config

#### 2.4 Off-chain contract clients
- `packages/ton-sdk` or `apps/api/src/ton/`: encode ops, parse events
- No UI imports — only API workers / confirm handlers

**Exit criteria**
- [ ] ≥1 property jetton live on testnet  
- [ ] Distribution contract funded and successfully pays ≥2 holders  
- [ ] Written verification guide for investors (explorer steps)  
- [ ] External or internal audit checklist completed (even if informal peer review)  

---

### Phase 3 — Integration (Frontend + Backend + Blockchain)  
**Goal:** end-to-end loop on testnet: connect → buy shares → hold jettons → receive weekly payout → see real tx in Earnings.  
**Est.:** 4–6 weeks

#### 3.1 Indexer
- Subscribe / poll jetton transfers & distribution events  
- Idempotent handlers (`event_id` unique)  
- Rebuild holdings from chain (reconciliation job nightly)

#### 3.2 Buy path (hybrid → on-chain)
1. Client: `prepareBuy` → receives payload (tonconnect messages)  
2. User signs via TonConnect  
3. API: observe tx via indexer → mint/transfer shares **or** detect jetton credit  
4. Portfolio & marketplace funding bars update from projections  

#### 3.3 Weekly distribution path
1. Admin/cron: create `rental_distributions` row `scheduled`  
2. Fund distribution contract (owner/ops)  
3. Worker kicks `distribute` / opens claim window  
4. Indexer writes `earnings_entries` + real `tx_hash`  
5. Mini App: drop “simulated” badge when `SETTLEMENT_MODE=onchain` and entry has real hash  

#### 3.4 Frontend honesty cutover
- Feature flag per environment  
- Explorer links on Earnings expand row  
- Error states: pending chain, failed tx, underfunded rent pool  

#### 3.5 Secondary market (MVP)
- Off-chain order book matching in API  
- Settlement: jetton transfer + TON/stable payment observed by indexer  
- Cancel / partial fill states already modeled in types  

**Exit criteria**
- [ ] Judge/investor script: 10-minute demo on testnet with **two phones/wallets**  
- [ ] Proportional math integrity test passes on-chain + DB  
- [ ] Reconciliation: chain balances == DB holdings (alert if not)  
- [ ] Frontend production build points at staging API + testnet  

---

### Phase 4 — Advanced Features & Polish  
**Goal:** product depth for real users and owner-side story.  
**Est.:** 4–8 weeks (prioritize ruthlessly)

#### 4.1 P0 (should ship before broad users)
- [ ] Push notifications via Telegram bot (payout received, order filled)  
- [ ] Transaction history screen (all `transactions` kinds)  
- [ ] Document vault (offering memo PDF, risk disclosure)  
- [ ] Admin console (list property, pause sale, trigger distribution)  
- [ ] Rate limits + abuse controls on order placement  
- [ ] Improved empty/error/offline states; retry queues  

#### 4.2 P1 (differentiation)
- [ ] Owner listing flow (apply → compliance review → publish)  
- [ ] Stablecoin jetton payment option (USDT/USDC on TON) if liquidity warrants  
- [ ] Portfolio CSV export / tax lot basics (cost basis)  
- [ ] Referral deep links (`t.me/bot?startapp=`)  
- [ ] Price oracle policy doc (TON/USD display only vs settlement asset)  

#### 4.3 P2 (post-traction)
- [ ] On-chain order book or intent-based settlement  
- [ ] Multi-sig treasury dashboards  
- [ ] Fiat on-ramp partner (guarded by KYC)  
- [ ] Mobile performance budgets continuous in CI  

**Exit criteria (P0 only for phase gate)**
- [ ] Ops can run a full week without engineers manually editing DB  
- [ ] Bot notifications live for payout  
- [ ] Admin can pause everything in one action  

---

### Phase 5 — Security, Testing, Deployment  
**Goal:** production readiness and mainnet go/no-go.  
**Est.:** 3–5 weeks continuous hardening + a dedicated freeze week

#### 5.1 Security
- [ ] External **smart contract audit** (budget line item)  
- [ ] API pen-test or bug bounty private  
- [ ] Telegram auth bypass tests; session fixation tests  
- [ ] Wallet bind account-takeover scenarios  
- [ ] Secrets rotation drill  
- [ ] Dependency scanning (Snyk/GitHub) + lockfile policy  
- [ ] Threat model v1 signed off  

#### 5.2 Testing pyramid
| Layer | Coverage target |
|---|---|
| Unit (API services, math) | Critical paths 90%+ |
| Contract tests | All ops + invariants |
| Integration (API+DB+Redis) | Buy, cancel, distribute |
| E2E (Playwright against staging TMA) | Happy paths + payout badge |
| Load | Read-heavy marketplace; write bursts on open sale |
| Chaos | Indexer downtime, Redis flush, partial chain reorg policy |

#### 5.3 Deployment
- [ ] Environments: `dev` / `staging` / `prod`  
- [ ] Blue-green or rolling API; immutable contract addresses per property  
- [ ] Mainnet checklist: liquidity, legal, support, pause keys, status page  
- [ ] Backup/restore Postgres tested  
- [ ] RTO/RPO defined  

#### 5.4 Compliance & investor pack
- [ ] Risk disclosures in-app  
- [ ] “How yield works” public page with math  
- [ ] Architecture diagram + this ROADMAP in data room  
- [ ] Incident response & customer support SLA  

**Exit criteria (mainnet go/no-go)**
- [ ] Audit findings resolved or accepted with risk register  
- [ ] Staging ran ≥2 consecutive real Friday distributions without incident  
- [ ] On-call rotation + runbooks  
- [ ] Legal counsel sign-off for target geos  
- [ ] Feature flag plan for gradual rollout (wallet allowlist → open)  

---

## 5. Detailed Task List  
*(Small, agent-ready prompts — execute in order within each phase)*

### Phase 0 — Decisions
| ID | Prompt / task | Status |
|---|---|---|
| P0-01 | Write ADR-001: Settlement modes (`mock`/`hybrid`/`onchain`) and UI badge rules | done |
| P0-02 | Write ADR-002: Jetton-per-property factory vs manual deploy | done |
| P0-03 | Write ADR-003: Push vs claim distribution; max holders per batch | done |
| P0-04 | Write ADR-004: Key hierarchy (deployer, admin multisig, payout hot wallet caps) | done |
| P0-05 | Draft OpenAPI 3.1 skeleton matching `src/lib/api/repos.ts` methods | done |
| P0-06 | Threat model v0: list top 15 risks with severity | done |
| P0-07 | Define env matrix table (dev/staging/prod) for web + api + contracts | done |
| P0-08 | ADR index + Phase 0 sign-off pack (`docs/ops/phase0-signoff.md`) | **accepted** 2026-07-29 |

### Phase 1 — Backend & API
| ID | Prompt / task |
|---|---|
| P1-01 | Scaffold monorepo with `apps/api` Hono app, healthz, pino logger |
| P1-02 | Add Docker Compose Postgres 16 + Redis; document `make up` |
| P1-03 | Add Drizzle schema for `users`, `wallets`; migration 0001 |
| P1-04 | Implement Telegram `initData` validator + unit tests (valid/invalid/expired) |
| P1-05 | `POST /v1/auth/telegram` + session middleware (JWT or iron-session) |
| P1-06 | Migrations for `properties` + seed from `src/lib/mock/seed/properties.ts` |
| P1-07 | `GET /v1/marketplace` + filters; contract tests vs shared types |
| P1-08 | `GET /v1/properties/:id` 404/200 |
| P1-09 | Holdings + portfolio summary endpoint; match `PortfolioSummary` type |
| P1-10 | Earnings summary + entries; pending/paid status |
| P1-11 | Order book read + place/cancel with authz (own orders only) |
| P1-12 | `POST /v1/buys/prepare` + `confirm` (DB-only settlement in hybrid) |
| P1-13 | BullMQ worker: `tickPayout` job (off-chain flip) with idempotency key |
| P1-14 | Audit log table writer on buy/cancel/payout |
| P1-15 | Implement `HttpRepos` in Mini App; env flag `NEXT_PUBLIC_DATA_SOURCE` |
| P1-16 | Wire auth from Mini App (pass initData once; store session) |
| P1-17 | Staging deploy API + point BotFather test app |
| P1-18 | Load smoke script (k6/autocannon) on marketplace GET |
| P1-19 | API README: local setup, migrate, seed, test |
| P1-20 | Phase 1 demo script + checklist in `docs/runbooks/phase1-demo.md` |

### Phase 2 — Contracts
| ID | Prompt / task |
|---|---|
| P2-01 | Init Blueprint project `contracts/`; CI job for `blueprint test` |
| P2-02 | Specify message ops in `docs/contracts/property-jetton.md` |
| P2-03 | Implement PropertyJettonMaster (mint, transfer notify) |
| P2-04 | Implement Distribution (deposit rent, claim or batch pay) |
| P2-05 | Conservation tests: dust + sum payouts |
| P2-06 | Access control tests: non-admin mint/pause fail |
| P2-07 | Gas report for 10/50/100 holders |
| P2-08 | Deploy scripts to testnet; save addresses to `deployments/testnet.json` |
| P2-09 | TS client wrappers in API package for deploy ops |
| P2-10 | Manual QA checklist with Tonviewer links |
| P2-11 | Internal review checklist (or schedule external audit SOW) |
| P2-12 | Document emergency pause procedure |

### Phase 3 — Integration
| ID | Prompt / task |
|---|---|
| P3-01 | Indexer service skeleton: cursor store, retry, dead-letter |
| P3-02 | Ingest jetton transfer events → update `holdings` |
| P3-03 | Ingest distribution payment events → `earnings_entries.tx_hash` |
| P3-04 | Buy prepare returns TonConnect messages calling real contracts |
| P3-05 | Confirm path waits for indexer (timeout + pending UI) |
| P3-06 | Reconciliation cron: chain supply vs DB `shares_sold` |
| P3-07 | Frontend: explorer link component; hide simulated badge when real hash |
| P3-08 | E2E testnet script: two wallets buy + one distribution |
| P3-09 | Off-chain matcher: full fill jetton+payment observation |
| P3-10 | Feature flag `SETTLEMENT_MODE` end-to-end |
| P3-11 | Runbook: stuck pending buy |
| P3-12 | Investor demo video script (testnet) |

### Phase 4 — Advanced
| ID | Prompt / task |
|---|---|
| P4-01 | Telegram bot notify on `earnings paid` |
| P4-02 | Admin UI: create property, upload media to R2 |
| P4-03 | Admin: pause primary sale + pause distribution |
| P4-04 | In-app documents list + signed URL download |
| P4-05 | Tx history screen using `/v1/transactions` |
| P4-06 | Rate limit placeOrder (Redis token bucket) |
| P4-07 | Owner application form + admin approve workflow |
| P4-08 | Optional USDT jetton pay path (spike → ADR) |
| P4-09 | Referral startapp param attribution |
| P4-10 | Portfolio export CSV |

### Phase 5 — Security & launch
| ID | Prompt / task |
|---|---|
| P5-01 | Pen-test auth and IDOR on orders/portfolio |
| P5-02 | Contract audit engagement + fix sprint |
| P5-03 | Playwright E2E critical paths on staging |
| P5-04 | Backup restore drill (Postgres) |
| P5-05 | Mainnet deploy dry-run on fork/testnet clone |
| P5-06 | Status page + incident template |
| P5-07 | Legal disclosures copy review |
| P5-08 | Go/no-go meeting checklist sign-off |
| P5-09 | Mainnet allowlist launch |
| P5-10 | Post-launch monitoring week (on-call) |

---

## 6. Dependency graph (what blocks what)

```
Phase 0 ADRs
    │
    ▼
Phase 1 API + DB  ──────────────►  Frontend HttpRepos
    │
    ├──────────────┐
    ▼              ▼
Phase 2 Contracts   Indexer design
    │              │
    └──────┬───────┘
           ▼
     Phase 3 E2E testnet loop
           │
           ▼
     Phase 4 product depth
           │
           ▼
     Phase 5 audit + mainnet
```

**Critical path for investor story:** P1-15 (API in app) → P2-08 (testnet contracts) → P3-08 (two-wallet payout demo).

---

## 7. Risk register (top items)

| Risk | Impact | Mitigation |
|---|---|---|
| Unbounded distribution gas | Payouts fail at scale | Batched/claim design (ADR-003) |
| Mock→live honesty failure | Regulatory / trust damage | Mode flag + UI badges; QA gate |
| Hot wallet drain | Loss of rent float | Caps, multisig, monitoring, minimal balance |
| Indexer lag / missed events | Wrong balances | Reconciliation + manual resync tools |
| Legal characterization of shares | Cease product in a geo | Counsel early; geo gates; disclosures |
| TonConnect UX friction | Drop-off on buy | Prepare/confirm UX; clear errors; testnet faucet guide |
| Scope creep (fiat, KYC, full DEX) | Never ship | Phase 4 P0 freeze; YAGNI |

---

## 8. Team & resourcing (suggested)

| Role | Focus |
|---|---|
| Tech lead / architect | ADRs, boundaries, reviews |
| Backend eng ×1–2 | API, DB, workers, indexer |
| Contract eng ×1 | Tact/FunC, tests, deploy |
| Frontend eng ×1 | HttpRepos, flags, explorer UX |
| DevOps (fractional) | Envs, secrets, observability |
| Counsel (external) | Disclosures, structure |
| Auditor (external) | Phase 5 contracts |

---

## 9. Definition of Done (platform)

A phase is **done** only when:
1. Automated tests for that phase’s critical path are green in CI  
2. Staging demo script succeeds without engineer DB edits  
3. Runbook updated  
4. Security checklist items for that phase checked  
5. `SETTLEMENT_MODE` and honesty copy still accurate  
6. No new UI→chain or UI→DB bypasses  

---

## 10. Immediate next actions (start this week)

1. **Approve this ROADMAP** and Phase 0 ADR topics.  
2. Create monorepo skeleton + `apps/api` health endpoint.  
3. Freeze OpenAPI for read endpoints (marketplace, property, portfolio, earnings).  
4. Implement Telegram auth + Postgres `users`.  
5. Point staging Mini App at API reads while keeping buy on hybrid/mock.  

---

## 11. Document control

| Version | Date | Notes |
|---|---|---|
| 1.0 | 2026-07-28 | Initial production roadmap from polished frontend baseline |

**Related**
- Product brief: `docs/research/BRIEF.md`  
- Requirements: `docs/research/REQUIREMENTS.md`  
- Data & on-chain shapes: `docs/research/DATA_MODELS.md`  
- Frontend stack: `docs/research/TECH_STACK.md`  
- Frontend phase history: `docs/research/ROADMAP.md`  

---

*DigiHouse — Own a slice. Earn every week. Build so the rent can show up for real.*
