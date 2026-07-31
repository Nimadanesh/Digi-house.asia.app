# DigiHouse — EXECUTION PLAN

> **Daily driver** for VS Code + OpenCode/Grok.  
> **Source of truth for phases:** root [`ROADMAP.md`](./ROADMAP.md) (platform path).  
> **Frontend MVP:** shipped (mock repos). Do not rebuild UI unless a task says so.  
> **Last updated:** 2026-07-29

---

## Progress Tracker

> **Rule:** When a task finishes and acceptance criteria pass, flip `- [ ]` → `- [x]` here **and** update the three status lines at the bottom of this file.  
> Agent command after done: mark tracker + set `Last Completed` / `Next Recommended`.

### Phase 0 — Governance & cutover
- [x] **P0-01** — ADR-001: Settlement modes (`mock` / `hybrid` / `onchain`) + UI badge rules
- [x] **P0-02** — ADR-002: Jetton-per-property factory vs manual deploy
- [x] **P0-03** — ADR-003: Push vs claim distribution; batch/gas limits
- [x] **P0-04** — ADR-004: Key hierarchy (deployer, multisig, hot wallet caps)
- [x] **P0-05** — OpenAPI 3.1 skeleton ↔ `src/lib/api/repos.ts`
- [x] **P0-06** — Threat model v0 (top 15 risks, STRIDE-lite)
- [x] **P0-07** — Env matrix dev/staging/prod (web + api + contracts)
- [x] **P0-08** — ADR index + Phase 0 sign-off (“Phase 0 accepted”)

**Phase 0 gate:** all above `[x]` + human sign-off before any `P1-*`.

### Phase 1 — Backend foundation + API
- [x] **P1-01** — Monorepo + `apps/api` Hono, `/healthz`, structured logger
- [x] **P1-02** — Docker Compose Postgres 16 + Redis
- [x] **P1-03** — Drizzle schema `users`, `wallets`; migration 0001
- [x] **P1-04** — Telegram `initData` validator + unit tests
- [x] **P1-05** — `POST /v1/auth/telegram` + session middleware
- [x] **P1-06** — Properties migrations + seed from mock
- [x] **P1-07** — `GET /v1/marketplace` + filters
- [x] **P1-08** — `GET /v1/properties/:id` 200/404
- [x] **P1-09** — Holdings + `GET /v1/portfolio`
- [x] **P1-10** — `GET /v1/earnings` summary + entries
- [x] **P1-11** — Order book read + place/cancel (authz)
- [x] **P1-12** — `POST /v1/buys/prepare` + `confirm` (hybrid DB settlement)
- [x] **P1-13** — BullMQ `tickPayout` worker (idempotent)
- [x] **P1-14** — `audit_events` on buy/cancel/payout
- [x] **P1-15** — Mini App `HttpRepos` + `NEXT_PUBLIC_DATA_SOURCE`
- [x] **P1-16** — Wire Mini App auth (initData → session)
- [x] **P1-17** — Staging deploy API + BotFather test URL
- [x] **P1-18** — Load smoke on marketplace GET
- [x] **P1-19** — API README (setup / migrate / seed / test)
- [x] **P1-20** — Phase 1 demo runbook `docs/runbooks/phase1-demo.md`

**Phase 1 gate:** all above `[x]` + exit criteria in §4.3 + improvements (rate limit, error handler, atomic cancel, portfolio N+1, schema prep) verified.

### Phase 2 — TON contracts & tokenization *(summarized)*
- [x] **P2** design freeze (jetton factory, distribute/claim) — P2-01…02
- [x] **P2** implement + test jetton + distribution — P2-03…07
- [x] **P2** testnet deploy + TS clients + QA/pause docs — P2-08…12

### Phase 3 — Integration (web + API + chain) *(summarized)*
- [x] **P3** indexer + holdings/earnings from chain events — P3-01…03
- [x] **P3** buy prepare/confirm on real contracts — P3-04…05
- [x] **P3** reconciliation, explorer links, honesty cutover — P3-06…07, P3-10
- [x] **P3** E2E two-wallet payout demo + runbooks — P3-08…09, P3-11…12

### Phase 4 — Advanced features *(summarized)*
- [x] **P4** P0: bot notify, admin pause, docs vault, tx history, rate limits — P4-01…06
- [ ] **P4** P1+: owner flow, optional USDT, referral, CSV export — P4-07…10

### Phase 5 — Security, testing, mainnet *(summarized)*
- [x] **P5** pen-test + contract audit + E2E — P5-01…03
- [x] **P5** backup drill, mainnet dry-run, status/incident — P5-04…06
- [x] **P5** legal + go/no-go — P5-07…08
- [ ] **P5** allowlist launch + on-call week — P5-09…10

---

## 1. Current Recommended Starting Point

| | |
|---|---|
| **Phase** | **Phase 1 — Backend foundation + API** |
| **Next task** | **Phase 1 gate** — Run exit criteria + sign-off |
| **Why** | All P1 tasks complete. Run the gate checklist and get human sign-off before Phase 2. |
| **Blocked on** | P1-20. |
| **Do not skip** | Keep ADR-001 honesty badges; hybrid settlement until onchain. |

**One-liner for the agent:**  
> `phase 1 gate`

---

## 2. Execution Rules

### 2.1 One small prompt per step
- Work **one task ID at a time** (`P0-01`, then `P0-02`, …).
- Prefer **one deliverable file (or tight set) + verification** per session.
- Do **not** “also start Phase 1” inside a Phase 0 task.
- If a task is too large for one session, split only with a new ID (e.g. `P1-03a`) and note it in this file’s changelog at the bottom.

### 2.2 Read before write
Before coding a task, open (in order as relevant):
1. **Progress Tracker** (this file, top) — confirm task still open  
2. This file’s task row + acceptance criteria  
3. [`ROADMAP.md`](./ROADMAP.md) phase section  
4. [`docs/research/DATA_MODELS.md`](./docs/research/DATA_MODELS.md)  
5. [`src/lib/api/repos.ts`](./src/lib/api/repos.ts) (repo contracts)  
6. [`AGENTS.md`](./AGENTS.md) + skill `telegram-ton-ownership` when touching Mini App boundaries  

### 2.3 Hard boundaries (never violate)
| Rule | Detail |
|---|---|
| UI → hooks → api/ton | Components **never** import `lib/mock`, `lib/ton`, `@tonconnect/*`, `@telegram-apps/*` directly |
| No UI→DB / UI→chain | Even after API exists; only HTTP client behind `getRepo()` |
| Money units | USD = integer **cents**; TON = **nanoTON**; shares = integers |
| Honesty | Simulated paths stay labeled until `SETTLEMENT_MODE=onchain` + real `txHash` |
| Secrets | `.env.local` / secret manager only; never commit keys or bot tokens |
| Spec wins | If code and `docs/research/*` disagree, fix code or update ADR — don’t silently diverge |

### 2.4 Git workflow
```text
branch:  p0/adr-001-settlement-modes   |  p1/api-healthz  |  …
commit:  conventional, one logical change
         feat(api): … | docs(adr): … | test(api): … | chore: …
PR:      optional; keep green CI before merge
never:   force-push main, commit .env*, amend others’ commits
```
- Commit **after** the task’s acceptance criteria pass, not mid-broken state.
- Phase 0 commits are mostly `docs(adr): …`.
- Include Progress Tracker checkbox flip in the same commit when possible.

### 2.5 Testing & quality gates
| When | Gate |
|---|---|
| Touch Mini App | `npm test` (if tests exist for area) + `npm run check` before “done” |
| Touch API (Phase 1+) | API unit/integration tests green + migrate dry-run |
| End of phase | Staging demo script + runbook updated ([ROADMAP §9](./ROADMAP.md)) |
| Design-sensitive UI | `/design-review` vs `docs/research/DESIGN_SYSTEM.md` |

### 2.6 Agent / OpenCode habits
- Announce task ID at start: `Working P0-01`.
- Prefer **edit existing files** over new trees until monorepo scaffold (P1-01).
- Max ~350 lines per file; split rather than God-files.
- After task: update **Progress Tracker** + bottom status lines; paste **Done checklist** (see §5); wait for next ID.
- Do not mark phase complete without exit criteria from ROADMAP.

### 2.7 Definition of Done (every task)
1. Acceptance criteria below are met  
2. Linked files exist and are referenced from ROADMAP/ADR index if docs  
3. No new boundary violations  
4. Verification command run (or N/A for pure ADR with human review)  
5. Progress Tracker `- [x]` for this ID + bottom status lines updated  
6. Git commit (if user asked) or ready-to-commit summary  

---

## 3. Detailed Breakdown of Phase 0

**Goal:** Lock decisions so engineering doesn’t thrash.  
**Calendar:** ~1 week (parallel OK).  
**Exit:** Written ADR set in `docs/adr/`; team signed off. **No production API code required.**

### 3.1 Directory to create
```text
docs/adr/
  README.md                 # index + status legend
  ADR-001-settlement-modes.md
  ADR-002-jetton-factory.md
  ADR-003-distribution-model.md
  ADR-004-key-hierarchy.md
docs/openapi/
  digihouse-v0.yaml         # skeleton OpenAPI 3.1
docs/security/
  threat-model-v0.md
docs/ops/
  env-matrix.md
```

### 3.2 ADR template (use for every ADR)
```markdown
# ADR-00N — Title

- Status: Proposed | Accepted | Superseded
- Date: YYYY-MM-DD
- Deciders: …

## Context
## Decision
## Consequences
## Alternatives considered
## References
```

### 3.3 Task table (Phase 0)

| ID | Task | Est. | Depends on | Primary output |
|---|---|---|---|---|
| **P0-01** | Settlement modes + UI badge rules | 2–3 h | — | `docs/adr/ADR-001-settlement-modes.md` |
| **P0-02** | Jetton-per-property factory vs manual deploy | 1–2 h | — | `docs/adr/ADR-002-jetton-factory.md` |
| **P0-03** | Push vs claim distribution; batch/gas limits | 2–3 h | P0-01 (mode ladder) | `docs/adr/ADR-003-distribution-model.md` |
| **P0-04** | Key hierarchy (deployer, multisig, hot wallet caps) | 2 h | — | `docs/adr/ADR-004-key-hierarchy.md` |
| **P0-05** | OpenAPI 3.1 skeleton ↔ `src/lib/api/repos.ts` | 3–4 h | P0-01 | `docs/openapi/digihouse-v0.yaml` |
| **P0-06** | Threat model v0 (top 15 risks, STRIDE-lite) | 2–3 h | P0-01, P0-04 | `docs/security/threat-model-v0.md` |
| **P0-07** | Env matrix dev/staging/prod (web + api + contracts) | 1–2 h | P0-01, P0-04 | `docs/ops/env-matrix.md` |
| **P0-08** | ADR index + Phase 0 sign-off checklist | 1 h | P0-01…07 | `docs/adr/README.md` + sign-off section |

*P0-08 is the phase gate (not listed as a separate line in ROADMAP §5 but required for “team signed off”).*

### 3.4 Phase 0 task details

#### P0-01 — ADR-001 Settlement modes
**Must decide:**
- Mode ladder: `mock` → `hybrid` → `onchain` (env: `SETTLEMENT_MODE`)
- What each mode means for: buy settlement, holdings source of truth, earnings `txHash`, UI “Demo / Simulated” badge
- Cutover rules (when badge hides; never hide without real explorer hash)
- Default per env (dev=`mock`, staging=`hybrid`, prod starts `hybrid` or allowlist)

**Acceptance:**
- [ ] ADR file complete with Status `Proposed` (or `Accepted` after human OK)
- [ ] Explicit table: Mode × Buy × Holdings × Earnings × Badge
- [ ] References DATA_MODELS dust/floor rules and honest MVP copy

#### P0-02 — ADR-002 Jetton factory
**Must decide:** one jetton master per property vs single factory; who deploys; how `properties.onchain_master` is set.

**Acceptance:**
- [ ] Clear choice + rationale  
- [ ] Impact on Phase 2 deploy scripts named  
- [ ] Rejected alternative documented  

#### P0-03 — ADR-003 Distribution model
**Must decide:** push batch vs pull/claim; max holders/batch; dust → treasury or next week; Friday UTC alignment with DATA_MODELS.

**Acceptance:**
- [ ] Formula matches ROADMAP §3.6 + `floor` rules  
- [ ] Gas/batch limit stated  
- [ ] Failure modes (underfunded pool, partial batch) listed  

#### P0-04 — ADR-004 Key hierarchy
**Must decide:** deployer key, admin multisig/timelock, payout hot wallet **max balance**, rotation, who can pause.

**Acceptance:**
- [ ] Key roles table  
- [ ] Cap + monitoring expectation for hot wallet  
- [ ] “Never in repo / CI” rule explicit  

#### P0-05 — OpenAPI skeleton
**Mirror repos** (`src/lib/api/repos.ts`):

| Method | Path | Repo |
|---|---|---|
| GET | `/v1/marketplace` | `MarketplaceRepo.list` |
| GET | `/v1/properties/{id}` | `MarketplaceRepo.get` |
| GET | `/v1/properties/{id}/order-book` | `OrderBookRepo.get` |
| POST | `/v1/orders` | `OrderBookRepo.placeOrder` |
| DELETE | `/v1/orders/{id}` | `OrderBookRepo.cancelOrder` |
| GET | `/v1/portfolio` | `PortfolioRepo.summary` |
| GET | `/v1/earnings` | `EarningsRepo.summary` (+ entries as needed) |
| POST | `/v1/buys/prepare` | buy intent |
| POST | `/v1/buys/confirm` | confirm / boc |
| POST | `/v1/auth/telegram` | auth (not in repo; required) |

**Acceptance:**
- [ ] OpenAPI 3.1 YAML validates (spectral/swagger-cli or equivalent note)  
- [ ] Schemas name shared types from DATA_MODELS (Listing, PortfolioSummary, …)  
- [ ] Auth security scheme stubbed  
- [ ] 401/404 examples on mutating + get-by-id  

#### P0-06 — Threat model v0
**Acceptance:**
- [ ] ≥15 risks with severity (H/M/L)  
- [ ] Covers: initData forgery, IDOR orders/portfolio, hot wallet drain, indexer lag, honesty/badge bypass, rate abuse  
- [ ] Each risk has a mitigation pointing at a later phase task when possible  

#### P0-07 — Env matrix
**Acceptance:**
- [ ] Table: variable × dev × staging × prod for web, api, contracts  
- [ ] Includes: `DATABASE_URL`, `REDIS_URL`, `TELEGRAM_BOT_TOKEN`, `SETTLEMENT_MODE`, `NEXT_PUBLIC_DATA_SOURCE`, `TON_NETWORK`, payout caps  
- [ ] Marks secrets vs public  

#### P0-08 — Sign-off
**Acceptance:**
- [x] `docs/adr/README.md` lists all ADRs + status  
- [x] Checklist: P0-01…07 done; open questions empty or ticketed (`docs/ops/phase0-signoff.md`)  
- [x] Human says **“Phase 0 accepted”** in chat or PR *(2026-07-29)*  

### 3.5 Phase 0 exit criteria (from ROADMAP)
- [x] Settlement mode ladder documented → ADR-001  
- [x] Jurisdiction / who-can-buy policy noted → ADR-001 §7  
- [x] Key management policy accepted → ADR-004  
- [x] OpenAPI draft exists → `docs/openapi/digihouse-v0.yaml`  
- [x] Threat model v0 exists → `docs/security/threat-model-v0.md`  
- [x] **Phase 0 accepted** — Phase 1 authorized (`do P1-01`)  

---

## 4. Numbered Task List for Phase 1

**Goal:** Real API + Postgres; Mini App keeps working via `HttpRepos` behind `getRepo()` when `NEXT_PUBLIC_DATA_SOURCE=api`.  
**Est.:** 3–5 weeks.  
**Prerequisite:** Phase 0 accepted.  
**Settlement during P1:** hybrid/mock — holdings & earnings **persist in Postgres**; buy need not be full on-chain yet.

### 4.1 Target layout (after P1-01)
```text
apps/
  web/          # existing Mini App (move or package boundary)
  api/          # Hono (or Fastify) + workers
packages/
  shared/       # types mirroring DATA_MODELS / OpenAPI
contracts/      # empty until Phase 2
docs/           # adr, openapi, runbooks (unchanged home)
```

### 4.2 Tasks

| ID | Task | Est. | Depends | Acceptance criteria |
|---|---|---|---|---|
| **P1-01** | Scaffold monorepo + `apps/api` Hono app, `GET /healthz`, pino (or equivalent) structured logger | 3–4 h | P0-08 | `pnpm`/`npm` workspace boots; `curl localhost:$PORT/healthz` → 200 JSON; README snippet for api dev; CI stub optional |
| **P1-02** | Docker Compose: Postgres 16 + Redis; `make up` or npm script documented | 2 h | P1-01 | `docker compose up -d` healthy; connection strings in `.env.example`; no secrets committed |
| **P1-03** | Drizzle (or Prisma) schema `users`, `wallets`; migration `0001` | 3 h | P1-02 | Migrate applies clean on empty DB; types exportable to `packages/shared` or api; columns align DATA_MODELS User |
| **P1-04** | Telegram `initData` validator + unit tests (valid / invalid / expired) | 3 h | P1-01 | Tests fail closed on bad hash/expiry; uses `TELEGRAM_BOT_TOKEN` from env in tests via fixture; no network |
| **P1-05** | `POST /v1/auth/telegram` + session middleware (JWT or iron-session) | 4 h | P1-03, P1-04 | Valid initData → session; protected route 401 without session; upsert user row |
| **P1-06** | Migrations `properties` (+ media if needed) + seed from mock seed | 4 h | P1-03 | ≥6 properties; funding/funded/resale represented; seed idempotent script |
| **P1-07** | `GET /v1/marketplace` + status/query filters; contract tests vs shared types | 3 h | P1-06 | Response matches `Listing[]` shape; filters work; OpenAPI path implemented |
| **P1-08** | `GET /v1/properties/:id` 200/404 | 1–2 h | P1-07 | Unknown id → 404 problem+json or agreed error shape |
| **P1-09** | Holdings + `GET /v1/portfolio` matching `PortfolioSummary` | 4 h | P1-05, P1-06 | Auth required; empty portfolio valid; cents/shares integers |
| **P1-10** | `GET /v1/earnings` summary + entries; pending/paid | 4 h | P1-09 | ≥4 weekly entries in seed path; floor math documented in test |
| **P1-11** | Order book read + place/cancel with authz (own orders only) | 5 h | P1-05, P1-08 | IDOR test: user B cannot cancel user A; book read public or auth per OpenAPI |
| **P1-12** | `POST /v1/buys/prepare` + `confirm` (DB-only settlement in hybrid) | 6 h | P1-09, P0-01 | prepare returns client payload; confirm persists holding + tx ledger row; respects funding caps |
| **P1-13** | BullMQ worker `tickPayout` (off-chain pending→paid) + idempotency key | 5 h | P1-02, P1-10 | Double-run safe; audit-friendly; configurable cadence env |
| **P1-14** | `audit_events` writer on buy / cancel / payout | 2–3 h | P1-12, P1-13 | Every mutating path inserts audit row with actor + payload hash/summary |
| **P1-15** | Mini App `HttpRepos` + `NEXT_PUBLIC_DATA_SOURCE=mock\|api` in `getRepo()` | 5 h | P1-07…12 | mock still default for local demo; `api` hits staging/local; **no** component imports HTTP directly |
| **P1-16** | Wire auth from Mini App (pass initData once; store session cookie/header) | 4 h | P1-05, P1-15 | Cold start authenticates; 401 → reconnect path; localhost dev bypass documented if any |
| **P1-17** | Staging deploy API + BotFather test Mini App URL | 3–4 h | P1-15, P1-16 | Public HTTPS healthz; Mini App loads marketplace from API |
| **P1-18** | Load smoke (autocannon) on marketplace GET | 2 h | P1-17 | Script in repo; 100 concurrent GETs documented result; no crash |
| **P1-19** | API README: setup, migrate, seed, test, env | 2 h | P1-02…14 | New engineer can go green in <30 min following doc only |
| **P1-20** | Phase 1 demo script + checklist `docs/runbooks/phase1-demo.md` | 2 h | P1-17 | Script: open TMA → list → property → buy hybrid → portfolio → earnings pending/paid after tick |

### 4.3 Phase 1 exit criteria (must all pass)
- [ ] Staging Mini App uses **API** for all reads (not mock)  
- [ ] Buy hybrid/mock settlement but **holdings persist in Postgres**  
- [ ] Earnings from DB; Friday/job flip pending→paid **off-chain** with audit row  
- [ ] Load smoke healthy  
- [ ] No secrets in repo; web `npm run check` + API test suite green  
- [ ] `SETTLEMENT_MODE` / honesty badges still accurate per ADR-001  

### 4.4 Phase 1 dependency sketch
```text
P1-01 → P1-02 → P1-03 → P1-06 → P1-07 → P1-08
                P1-04 → P1-05 ─┬→ P1-09 → P1-10 → P1-13
                               ├→ P1-11
                               └→ P1-12 → P1-14
P1-07…12 → P1-15 → P1-16 → P1-17 → P1-18
P1-14 + P1-17 → P1-19 → P1-20 (phase gate)
```

---

## 5. How to Request Next Step

### 5.1 Commands (say exactly)

| You say | Agent does |
|---|---|
| `do P0-01` | Execute only that task; mark tracker `[x]`; stop with Done checklist |
| `do P1-07` | Same for Phase 1 |
| `status` | Read Progress Tracker + bottom lines; print phase / last / next |
| `review P0-03` | Read-only review of that task’s output vs acceptance |
| `phase 0 gate` | Verify all P0 boxes `[x]` + ask for human “Phase 0 accepted” |
| `phase 1 gate` | Run exit criteria checklist; no Phase 2 until green |

### 5.2 Optional modifiers
- `do P1-03 --dry-run` — plan files/commands only, no writes  
- `do P0-05 --detail` — allow longer explanation (default stays short)  
- `do P1-15 --tests-first` — TDD where applicable  

### 5.3 Done checklist (agent posts after each task)
```text
DONE <ID>
- Files: …
- Verify: <command + result>
- AC: all checked | gaps: …
- Tracker: Progress Tracker [x] + bottom status updated
- Next: <ID> — <one line>
```

### 5.4 Recommended sequence (copy-paste queue)
```text
do P0-01
do P0-02
do P0-03
do P0-04
do P0-05
do P0-06
do P0-07
do P0-08
phase 0 gate
# after "Phase 0 accepted":
do P1-01
do P1-02
…
do P1-20
phase 1 gate
```

### 5.5 Later phases (IDs only — detail in ROADMAP)
| Phase | IDs | Start when |
|---|---|---|
| 2 Contracts | P2-01 … P2-12 | Phase 1 exit green (overlap OK after P1-06) |
| 3 Integration | P3-01 … P3-12 | P2 testnet pay + P1 HttpRepos |
| 4 Advanced | P4-01 … P4-10 | Phase 3 E2E loop |
| 5 Security/launch | P5-01 … P5-10 | Before mainnet |

**Critical path (investor story):**  
`P1-15` (API in app) → `P2-08` (testnet contracts) → `P3-08` (two-wallet payout demo).

---

## 6. Quick reference

| Doc | Role |
|---|---|
| [`ROADMAP.md`](./ROADMAP.md) | Full platform strategy, risks, team |
| [`docs/research/*`](./docs/research/) | Product/design/data specs |
| [`docs/research/ROADMAP.md`](./docs/research/ROADMAP.md) | Historical frontend build phases (done) |
| [`HANDOVER.md`](./HANDOVER.md) | Current frontend baseline |
| [`AGENTS.md`](./AGENTS.md) | Agent coding rules for Mini App |
| [`src/lib/api/repos.ts`](./src/lib/api/repos.ts) | Repo contracts API must mirror |
| **This file** | What to do **today** + Progress Tracker |

---

## 7. Changelog

| Date | Change |
|---|---|
| 2026-07-28 | Initial EXECUTION-PLAN from ROADMAP Phase 0–5 |
| 2026-07-28 | Added Progress Tracker + bottom status lines |
| 2026-07-29 | P0-01…P0-08 docs pack complete; awaiting `Phase 0 accepted` |
| 2026-07-29 | Phase 0 last-check polish: ROADMAP links, §1 gate pointer, sign-off pack |
| 2026-07-29 | **Phase 0 accepted** (chat); ADR-002…004 Accepted; Phase 1 unlocked |
| 2026-07-29 | P1-01: npm workspaces + `@digihouse/api` Hono `/healthz` + `@digihouse/shared` |
| 2026-07-29 | P1-02: `docker-compose.infra.yml` Postgres 16 + Redis; `npm run infra:*` |
| 2026-07-29 | P1-03: Drizzle `users`+`wallets`, migration 0001, `db:migrate` |
| 2026-07-29 | P1-04: `validateInitData` HMAC + vitest (valid/invalid/expired) |
| 2026-07-29 | P1-05: auth telegram + JWT session + GET /v1/me + upsert users |
| 2026-07-29 | P1-06: properties schema 0002 + idempotent seed (≥6, all statuses) |
| 2026-07-29 | P1-07: GET /v1/marketplace + status/query filters + Listing mapper |
| 2026-07-29 | P1-08: GET /v1/properties/:id 200/404 (reuse mapListing) |
| 2026-07-29 | P1-09: holdings 0003 + GET /v1/portfolio (auth, empty OK) |
| 2026-07-29 | P1-10: earnings 0004 + GET /v1/earnings (pending/paid, floor tests) |
| 2026-07-29 | P1-11: orders 0005 + order-book GET + place/cancel IDOR tests |
| 2026-07-29 | P1-12: buy_intents+transactions 0006; prepare/confirm hybrid settle |
| 2026-07-29 | P1-13: payout_ticks 0007 + tickPayout core/worker (idempotent) |
| 2026-07-29 | P1-14: audit_events 0008 + writer on confirm/cancel/tick |
| 2026-07-29 | P1-15: HttpRepos + getRepo mock|api switch + session-token stub + env DATA_SOURCE/API_BASE_URL |
| 2026-07-29 | P1-16: AuthProvider + useApiAuth + 401 handling + auth-events + devToken bypass |
| 2026-07-29 | P1-17: API Dockerfile, fly.toml, staging-deploy runbook, env comments |
| 2026-07-29 | P1-18: smoke script + results doc; TM-08 baseline |
| 2026-07-29 | P1-19: API README overhaul (env table, route table, quick start, troubleshooting, cross-refs) |
| 2026-07-29 | P1-20: Phase 1 demo runbook (walkthrough 11 steps, QA checklist, math integrity, exit criteria) |

---

*Next: `phase 1 gate`*

---

**Current Phase:** Phase 5 — Security, testing, mainnet  
**Last Completed Task:** P5-08 — Go/no-go meeting checklist + threat-model-v1  
**Next Recommended Task:** Human meeting: Phase 5 go/no-go. If Go: P5-09 allowlist launch.
