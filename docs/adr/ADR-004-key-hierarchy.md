# ADR-004 — Key hierarchy & operational custody

- Status: Accepted
- Date: 2026-07-29
- Deciders: DigiHouse tech lead / team

## Context

DigiHouse will hold deployer keys (jetton + distribution), admin pause authority, optional rent-float funding wallets, API session secrets, and Telegram bot tokens. ROADMAP risk **“Hot wallet drain”** and Phase 0 “key management policy” require a frozen hierarchy before Phase 2 deploy scripts and Phase 5 rotation drills.

Constraints already locked:

- **ADR-001:** `onchain` needs real ops keys; `hybrid` still needs API/DB/bot secrets but not large payout float
- **ADR-002:** only Deployer/Admin deploy and set `onchain_master` / `distribution_address`; UI never deploys
- **ADR-003:** claim-based MVP (users pay claim gas); ops **funds** rent pool; Admin **pauses** claims; no unbounded server-side push by default

ROADMAP §3.2: secrets in Doppler / AWS Secrets Manager; never commit deployer keys; hot wallet = payout relay only, **capped**. §3.5: Multisig / Timelock for admin ops.

## Decision

### 1. Key roles table

| Role | Purpose | Testnet | Mainnet | Storage |
|---|---|---|---|---|
| **Deployer** | Blueprint deploy `PropertyJettonMaster` + Distribution; initial admin wiring | Single key or CI OIDC → short-lived credentials | Prefer deploy-then-minimize; multisig/timelock owns upgrades; cold offline after milestone deploys when possible | Secrets manager only — e.g. `DEPLOYER_KEY_REF=sm://…` |
| **Admin / pause** | Pause claims, pause sale/mint, parameter changes, set DB registry addresses via admin API | Dual-key **or** single admin + sealed break-glass | **Multisig and/or timelock** (TON multisig or equivalent — vendor detail in P2) | SM + hardware wallet for signers when practical |
| **Payout / rent float hot wallet** | Fund Distribution contract rent pool (ops); **not** user custody | Small interim cap (§3) | Strict cap (§3); minimal standing balance | SM; separate from deployer when possible |
| **Batch relayer** (future only) | If ADR-003 option B batch push is enabled later | Separate key from rent float | Stricter cap + rate limit | SM; disabled while claim-only |
| **API session signing** | JWT / iron-session (or equivalent) for user sessions after `initData` | Dev secret in local gitignored env | Rotated SM secret | SM |
| **Telegram bot token** | Validate `initData` HMAC; later notify (`P4-01`) | Test bot token | Prod bot token | SM only — never `NEXT_PUBLIC_*` |
| **Indexer / RPC** | Read chain, webhooks (TonAPI etc.) | API keys | API keys | SM |
| **DB / Redis** | Data plane credentials | Local/compose passwords | Managed platform secrets | SM / host platform |
| **User wallets** | TonConnect buy/claim | User-held | User-held | User device only |

**Hard rules:**

- Mini App / browser **never** holds deployer, admin, hot wallet, bot token, session master secrets, or DB credentials
- UI never imports chain admin or deploy paths (ROADMAP §3.3; AGENTS ownership boundary)
- No private keys, mnemonics, or live tokens in git, Docker images, Vercel screenshots, chat, or ADR examples — placeholders only (`sm://…`, `op://…`, `<redacted>`)
- Server never holds user wallet private keys (non-custodial)

### 2. Who can pause

| Surface | Who | How |
|---|---|---|
| **Distribution claims** (ADR-003) | Admin multisig / admin key | On-chain pause flag on Distribution |
| **Primary sale / mint** | Admin | On-chain pause and/or API refuse `prepare`/`confirm` |
| **API global kill** | Ops | Feature flags: force `SETTLEMENT_MODE` away from risky paths, disable mutating routes, maintenance mode |
| **Hybrid ledger tick** | Ops | Pause BullMQ `tickPayout` / kill switch env |
| **Mini App** | N/A for keys | Config/flags only; no secret-bearing pause key in client |

**Incident one-action model (policy):** “**Pause everything**” means, in order:

1. On-chain pause distribution + sale (admin)
2. API kill switch / refuse buys and admin-except health
3. Stop workers that fund or tick payouts
4. Open incident (`P5-06` template); do not unpause until checklist green

Detailed operator UI is `P4-03`; this ADR only requires the mental model and role ownership.

### 3. Hot wallet max balance + monitoring

Claim-based MVP (ADR-003) means the hot wallet **primarily funds the rent pool**, not per-holder pushes — lower drain surface than a batch pusher. Caps are **interim** until P0-07 env matrix and mainnet checklist tune them.

| Env | Max hot wallet balance (guidance) | Notes |
|---|---|---|
| **local/dev** | Dust / **unused** if claim-only and no live fund script | Prefer empty; no standing float |
| **testnet** | **≤ 50 TON** interim | Enough for demo weeks; label **interim** — revisit after first multi-property testnet |
| **prod** | **≤ max( estimated 1 week rent float for live properties, fixed nanoTON cap in SM config )** | Prefer the **lower** of policy cap vs computed need; top up just-in-time before Friday |

**Also required:**

| Control | Expectation |
|---|---|
| **High-water alert** | Balance **>** configured cap → page/ops alert |
| **Low-water alert** | Balance **<** minimum for next Friday’s funded pools → alert before payoutDay |
| **Failed fund txs** | Monitor and alert (tooling Phase 5 / ops observability) |
| **Minimal balance** | Do not park treasury-scale funds in hot wallet; cold/multisig holds surplus |
| **Future batch relayer** | Separate key; **stricter** cap (e.g. ≤ one batch gas + one holder payout buffer); rate limit; off by default |

Exact alert channels (PagerDuty/etc.) are ops choice; the **requirement** to monitor is binding.

### 4. Custody ladder by environment

| Env | Deployer | Admin | Hot wallet |
|---|---|---|---|
| **dev** | Optional local key file **gitignored**; never committed | Same or shared dev admin | Usually none |
| **staging / testnet** | CI secret or 1Password/Doppler/AWS SM | Dual-control preferred | Capped testnet float |
| **prod** | Deploy via controlled pipeline; minimize standing online deployer; prefer immutable contracts + new deploy over hot upgrade keys where design allows | Multisig and/or timelock | Strict cap; JIT top-up |

### 5. Rotation and break-glass

| Secret / key | Rotation | Compromise response |
|---|---|---|
| **API session signing** | Rotate in SM; invalidate existing sessions (force re-auth via `initData`) | Rotate immediately; revoke sessions; audit recent auth |
| **Telegram bot token** | BotFather reissue + SM update; short dual-run window if webhooks lag | Revoke old token; redeploy API config; audit |
| **Deployer** | Rotate after testnet milestones; mainnet: offline/cold after use when possible | Pause mint/deploy paths; treat on-chain admin handoff per runbook |
| **Hot wallet** | Periodic sweep excess to cold; address rotation rare | **Pause distribution**; sweep remainder to cold/multisig; stop funding scripts; update funding source config; incident template (`P5-06`) |
| **Admin multisig set** | Change set via timelock/multisig policy | Freeze admin ops; break-glass path |
| **Break-glass admin** | Sealed; dual-control; use logged; post-use rotate | Same as admin compromise |

Break-glass: dual-person rule for prod; every use writes `audit_events` (or ops equivalent) with who/when/why.

### 6. “Never in repo / CI” rule

| ❌ Forbidden | ✅ Required |
|---|---|
| Private keys, mnemonics, seed phrases in git | Secret **names** only in `.env.example` / P0-07 env matrix |
| `TELEGRAM_BOT_TOKEN`, DB passwords, JWT secrets as committed values | Values only in SM / platform env / local gitignored `.env.local` |
| Secrets in client `NEXT_PUBLIC_*` (public by definition) | Public: manifest URL, network name, API base URL, feature flags |
| Printing secrets in CI logs | Masked secrets; prefer GitHub Actions **OIDC → cloud SM** |
| Encrypted key files committed “for convenience” | External SM; CODEOWNERS on deploy workflows |
| Sharing keys in chat/ADR/screenshots | Placeholders only |

Phase 5 dependency: secret scanning + dependency audit (`P5` area). A leaked secret is **burned** — rotate, do not only delete from git history.

### 7. Alignment with prior ADRs

| ADR | This hierarchy enforces |
|---|---|
| **ADR-001** | Onchain ops keys for fund/pause/indexer; hybrid still needs bot + API + DB secrets; honesty unchanged by key layout |
| **ADR-002** | Only Deployer/Admin set `onchain_master` / `distribution_address`; Mini App never deploys |
| **ADR-003** | Admin pauses claims; ops funds pool from **capped** hot wallet; **no** server-held user claim keys; batch relayer optional and stricter |

### 8. Consequences → named later tasks

| Task | Impact |
|---|---|
| **P0-06** | Threat model: key theft, insider mint, hot wallet drain, pause bypass |
| **P0-07** | Env matrix: secret **names**, public vs secret, caps per env |
| **P1-04 / P1-05** | Bot token + session secret from env/SM only |
| **P2-06** | Access control tests: non-admin mint/pause fail |
| **P2-08** | Deploy scripts read keys from env/SM only; no hardcoded keys |
| **P2-12** | Emergency pause procedure runbook (maps to §2 one-action model) |
| **P4-03** | Admin pause UI (ops), still no keys in browser |
| **P5-01 / P5-05** | Pen-test + secrets rotation drill |
| **P5-06** | Incident templates include hot wallet compromise |
| **P5-08** | Go/no-go includes key custody checklist |

### 9. Alternatives considered

| Alternative | Why rejected |
|---|---|
| **Single god-key** (deploy + admin + payout) | Blast radius = total loss; fails basic custody |
| **Hot wallet = unlimited treasury** | Direct “Hot wallet drain” realization |
| **Server custodial user wallets** | Out of product model; regulatory and theft magnet |
| **Multisig-everything on day-one testnet** | Overkill slows Phase 2; staged ladder (§4) is enough |
| **Single-key forever on mainnet** | Underkill; rejected for prod admin and large float |
| **Committing encrypted key files in-repo** | Still leaks with passphrase / history; SM is the standard |
| **Admin keys in Mini App “for convenience”** | Violates UI boundary; trivial extract |

### 9. Admin API path prefix & auth (P4-03)

| Decision | Detail |
|---|---|
| **Path prefix** | All admin ops live under `/v1/admin/*` — separate from user routes. |
| **Auth mechanism** | `X-Admin-Key` header matching `ADMIN_API_SECRET` env var (server-only). |
| **Session token rejection** | User JWTs are rejected on admin routes (admin middleware runs first, only checks header). |
| **Optional mount** | If `ADMIN_API_SECRET` is unset, the entire admin route group is not mounted — no 404 leak. |
| **Future allowlist** | `ADMIN_TELEGRAM_IDS` (optional) for Telegram-based admin identification. |

### 10. Out of scope

| Topic | Where |
|---|---|
| Full legal entity / bank / qualified custodian | Legal / Phase 5 compliance |
| Exact multisig vendor (Ton multisig vs external MPC) | Direction: multisig/timelock on mainnet admin; detail in P2 deploy docs |
| OpenAPI admin auth schemes | P0-05 (admin ≠ user session) |
| Implementing pause in contracts | P2-04 / P2-06 |
| Env matrix full tables | P0-07 |
| Real key material | Nowhere in repo |

## Consequences

**Positive:** clear blast-radius boundaries; claim model + caps reduce float at risk; pause ownership is unambiguous for incidents.

**Negative / cost:** multisig and SM setup before mainnet; JIT funding needs monitoring; dual-control slows emergency response unless break-glass is rehearsed (`P2-12`, `P5-05`).

**Must not:** put secrets in `NEXT_PUBLIC_*`; share deployer with hot wallet on mainnet without documented exception; leave uncapped float online “for convenience.”

## References

- [ADR-001 — Settlement modes](./ADR-001-settlement-modes.md)
- [ADR-002 — Jetton deployment](./ADR-002-jetton-factory.md) — deployer/admin; UI never deploys
- [ADR-003 — Distribution model](./ADR-003-distribution-model.md) — claim, fund pool, pause
- [ROADMAP.md](../../ROADMAP.md) — §3.2 secrets; §3.5 multisig/timelock; Phase 0 key policy; P2-12 pause; Phase 5 rotation; risk Hot wallet drain
- [EXECUTION-PLAN.md](../../EXECUTION-PLAN.md) — P0-04 acceptance; secrets hard boundary
- [docs/research/TECH_STACK.md](../research/TECH_STACK.md) — env key **names** (public Mini App vars)
- Future: `docs/ops/env-matrix.md` (P0-07), `docs/security/threat-model-v0.md` (P0-06)
