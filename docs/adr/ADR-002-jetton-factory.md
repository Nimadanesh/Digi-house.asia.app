# ADR-002 — Jetton deployment model (per-property master vs factory)

- Status: Accepted
- Date: 2026-07-29
- Deciders: DigiHouse tech lead / team

## Context

DATA_MODELS and ROADMAP §3.5 fix the **token shape**: each property is one TON **jetton master** whose total supply equals `Property.totalShares`; holders use standard jetton wallets; resale leaves the master unchanged.

What is *not* fixed is the **deploy mechanism**:

- Manual / scripted deploy of each `PropertyJettonMaster` (Blueprint + ops), or
- An on-chain **factory** that spawns masters from one admin call

Phase 2 (`P2-01`…`P2-09`) needs a single answer so Blueprint layout, deploy scripts, DB columns (`properties.onchain_master`, `properties.distribution_address`), and API clients do not thrash. Today only a scaffold `ContractBase` exists — no live property contracts.

ADR-001 already states jettons are **not** required in `mock` / `hybrid`; this ADR covers how masters appear when `SETTLEMENT_MODE=onchain`.

## Decision

### 1. Primary choice

| Option | Meaning |
|---|---|
| **A. Manual / scripted per-property deploy** | Ops or CI runs Blueprint deploy once per listing; no on-chain factory |
| B. On-chain factory | Factory contract deploys `PropertyJettonMaster` (+ optional config) from a single admin call |
| C. Hybrid staged | Manual in Phase 2; factory later if volume warrants |

**Chosen: A for Phase 2 MVP-on-chain, with C as the product path** — implement and ship **manual/scripted deploy** now; treat an on-chain factory as **optional Phase 4+** only if listing volume or self-serve owner listing needs it.

**Rationale:**

| Factor | Manual (A) | Factory-first (B) |
|---|---|---|
| Audit surface | One master template + known addresses | Factory + master + init paths; more attack surface early |
| Phase 2 exit | ≥1 testnet jetton is enough for investor demo | Extra contract + tests before first mint |
| Listing volume | Curated properties; few deploys | Factory pays off at high self-serve volume (Phase 4+ owner flow) |
| DB registry | Explicit write of `onchain_master` after deploy | Still need registry; factory event must be indexed reliably |
| Failure recovery | Re-run script against new property row | Factory bugs affect all future listings |

**Token model (fixed — not decided here):**

| Rule | Value |
|---|---|
| Masters per property | **Exactly one** `PropertyJettonMaster` |
| Max / total supply | `Property.totalShares` (integer shares) |
| Holder representation | Standard `PropertyJettonWallet` per holder |
| On-chain identity | Jetton **master address** is canonical on-chain id (DATA_MODELS); off-chain `property.id` stays a stable opaque string |

Deploy mechanism ≠ token model. Factory would still deploy **one master per property**.

### 2. Who deploys

| Role | May deploy jetton master? | May set DB addresses? |
|---|---|---|
| **Deployer / CI key (testnet)** | Yes — Blueprint scripts (`P2-08`) | Yes — via controlled deploy pipeline or ops job writing API/admin |
| **Admin / multisig (later mainnet)** | Yes — after ADR-004 key hierarchy | Yes — admin API only; audit_events required |
| **Property owner (end user)** | **No** for MVP-on-chain (owner listing is Phase 4+) | No |
| **Mini App / user wallet** | **Never** | **Never** |

Hard rules (ROADMAP §3.3):

- UI never deploys contracts and never imports `lib/ton` deploy paths.
- Components never call TonConnect to “create property token.”
- Deploy keys never live in the Mini App bundle or git; CI/secrets manager only (detail in ADR-004).

### 3. DB registry — fields and lifecycle

**Columns (nullable until Phase 2 deploy):**

| Column | Type | Meaning |
|---|---|---|
| `properties.onchain_master` | text null | Jetton master address (`EQ…` / raw friendly) |
| `properties.distribution_address` | text null | Distribution contract address (deploy model: ADR-003; column reserved here) |

**Lifecycle:**

```text
listing created (off-chain, Phase 1)
  → status funding | funded | resale in Postgres
  → [Phase 2] deploy PropertyJettonMaster (script / CI)
  → write properties.onchain_master = <address>
  → [Phase 2] deploy Distribution (pointer only; push/claim = ADR-003)
  → write properties.distribution_address = <address>
  → smoke: mint/transfer path green on testnet
  → SETTLEMENT_MODE=onchain only after addresses set + indexer path ready (Phase 3)
```

**Rules:**

| Rule | Detail |
|---|---|
| Null while mock/hybrid | `onchain_master` / `distribution_address` **may stay null** under `SETTLEMENT_MODE=mock|hybrid`; buy and holdings must work without them (ADR-001) |
| Stable off-chain id | `properties.id` never becomes the chain address; joins use id; chain identity = master when set |
| Idempotency | Once `onchain_master` is non-null, **re-deploy is forbidden** for that row. Correction = new property row + deprecate old, or explicit admin “replace” procedure with audit (not silent overwrite) |
| Dual registry | `deployments/testnet.json` (`P2-08`) = file snapshot for ops/git; **Postgres columns = runtime SoT** for API / indexer / prepare-buy |
| Consistency check | Deploy script or post-step must refuse to mark env `onchain` if any property offered for on-chain buy has null master |

### 4. Mint / supply rules (pointer-level)

Not a full opcode spec (that is `P2-02` / `docs/contracts/property-jetton.md`).

| Topic | Rule |
|---|---|
| Cap | `totalSupply` / max supply = `Property.totalShares` |
| Primary sale (`onchain`) | Mint or transfer from master / optional Sale helper only up to remaining shares; **no double-mint** vs DB `shares_sold` / funding bar — indexer + API must enforce conservation |
| Hybrid | No jetton mint required; DB holdings only (ADR-001) |
| Burns | **Not allowed** except post-MVP owner redemption (DATA_MODELS) |
| Resale | Master unchanged; only jetton wallet transfers; order book off-chain first (Phase 3 matcher) |
| Admin mint | Restricted to deployer/admin roles; non-admin mint fails (`P2-06` access tests) |

### 5. Impact on Phase 2 (and related) tasks

| Task | Impact of this ADR |
|---|---|
| **P2-01** | Blueprint layout under `contracts/`; jetton master + wallet templates; **no factory contract** in initial tree |
| **P2-02** | `docs/contracts/property-jetton.md` — message ops for master/wallet only; factory ops out of scope |
| **P2-03** | Implement `PropertyJettonMaster` (mint, transfer notify) as standalone deployable |
| **P2-04** | Distribution separate deploy; address stored beside master (model ADR-003) |
| **P2-05…07** | Tests/gas against single-master instances; no factory init vectors |
| **P2-08** | Per-property deploy scripts; write `deployments/testnet.json` **and** instruct DB update of `onchain_master` / `distribution_address` |
| **P2-09** | TS client wrappers in **API package only** (deploy/mint helpers); Mini App never imports them |
| **P1-06 / schema** | Nullable `onchain_master`, `distribution_address` on `properties` |
| **P3-02 / P3-04** | Indexer + buy prepare resolve master from **DB**, not hardcoded; null master → reject on-chain buy |
| **Phase 4+** | If factory ADR later: additive contract; does not rewrite token model |

### 6. Relationship to ADR-001

| `SETTLEMENT_MODE` | Jetton requirement |
|---|---|
| `mock` | No `onchain_master` required; mock holdings |
| `hybrid` | No mint required; Postgres SoT; master may be null |
| `onchain` | Deployed master (+ distribution per ADR-003) required for properties in the on-chain path; holdings from jetton balances via indexer |

**UI honesty:** never claim or display jetton balances / explorer share proofs while `onchain_master` is null. Buy toast stays simulated until on-chain share settlement (ADR-001).

### 7. Alternatives considered

| Alternative | Why rejected |
|---|---|
| **Single shared jetton for all properties** | Breaks per-property `totalShares`, rent pools, and funding status; violates DATA_MODELS |
| **Factory-first (B) for Phase 2** | Extra audit surface and schedule risk before first testnet jetton; listing volume does not justify it yet |
| **User-deployed masters from Mini App** | Violates UI→chain separation; key and gas UX unsafe; owner listing is Phase 4+ under admin controls |
| **Off-chain id as on-chain address** | TON addresses are not app UUIDs; canonical on-chain id must be master address after deploy |
| **Always require master from Phase 1** | Conflicts with ADR-001 hybrid path and blocks API-first delivery |

### 8. Out of scope

| Topic | Where |
|---|---|
| Push vs claim distribution, batch/gas, dust on-chain | **ADR-003** |
| Deployer caps, multisig, hot wallet limits | **ADR-004** |
| Full message opcodes / TEPs details | **P2-02** (`docs/contracts/property-jetton.md`) |
| USDT / stable payment jetton | Phase 4 spike (`P4-08`) |
| On-chain order book | Optional later; not deploy model |
| Implementing Blueprint or any contract code | Phase 2 tasks — **not** this ADR |

## Consequences

**Positive**

- Phase 2 can ship one audited master template and scripted deploys without factory complexity.
- Clear DB lifecycle unblocks P1 schema nullables and P3 indexer address lookup.
- Aligns with curated listing ops and ADR-001 hybrid-without-jettons.

**Negative / follow-ups**

- High listing volume will need ops automation or a later factory ADR.
- Dual registry (JSON file + DB) needs a short runbook step so they do not drift (`P2-08` / Phase 3 runbooks).
- Owner self-serve listing cannot deploy tokens until Phase 4+ policy exists.

**Must not**

- Add factory contracts in P2-01 “just in case.”
- Let Mini App or random users set `onchain_master`.
- Enable `SETTLEMENT_MODE=onchain` for a property with null master.

## References

- [ADR-001 — Settlement modes](./ADR-001-settlement-modes.md) — hybrid needs no mint; onchain requires chain SoT
- [ROADMAP.md](../../ROADMAP.md) — §3.3 separation; §3.5 contract set; Phase 2 deploy → `onchain_master` / `distribution_address`; P2-01…P2-09; Phase 3 buy path
- [docs/research/DATA_MODELS.md](../research/DATA_MODELS.md) — one jetton master per property; supply = `totalShares`; `FractionTokenWallet`; burns; canonical id
- [EXECUTION-PLAN.md](../../EXECUTION-PLAN.md) — P0-02 acceptance
- [src/lib/ton/contracts/ContractBase.ts](../../src/lib/ton/contracts/ContractBase.ts) — scaffold only; not a live property contract
