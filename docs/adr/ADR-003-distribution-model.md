# ADR-003 — Weekly rent distribution model (batch push vs claim)

- Status: Accepted
- Date: 2026-07-29
- Deciders: DigiHouse tech lead / team

## Context

Weekly rental yield is DigiHouse’s hero invariant: holders receive rent **proportional to share**, on a **Sunday UTC** cadence, with judge-verifiable math (R-6.6). ROADMAP §3.6 and DATA_MODELS define floor division and dust; ROADMAP §3.5 forbids **unbounded** single-TX holder loops (“Unbounded distribution gas” risk).

Without a frozen model, Phase 1’s off-chain `tickPayout`, Phase 2’s Distribution contract, and Phase 3’s indexer will disagree on:

- Claim vs batch push
- Who pays gas and how partial progress works
- Whether dust goes to largest holder, treasury, or next week
- When `EarningsEntry` may flip to `paid` with a real `txHash`

ADR-001 covers honesty badges and mode ladder; ADR-002 registers `distribution_address`. This ADR freezes **payout mechanics**.

## Decision

### 1. Cadence and calendar

| Field / concept | Rule |
|---|---|
| Distribution week | Monday 00:00 UTC → Sunday 23:59:59 UTC |
| `RentalDistribution.weekOf` | ISO **Monday** date string (`YYYY-MM-DD`) |
| `payoutDay` | That week’s **Sunday** (ISO date) |
| Production kick | Sunday UTC — cron/ops funds pool and opens claim window (or starts batch helper if enabled later) |
| Snapshot | `totalShares` / jetton `totalSupply` and each holder’s eligible balance frozen at **distribution create** (when row leaves draft → `scheduled`) — see §7 mid-week transfers |

**Demo vs production clock:**

| Mode | Clock | Domain model |
|---|---|---|
| `mock` | `NEXT_PUBLIC_PAYOUT_TICK_MS` / in-process tick (default ~60s) | Still emits `weekOf` / `payoutDay` as Monday/Sunday labels on seed rows |
| `hybrid` | BullMQ `tickPayout` (`P1-13`); configurable cadence for staging demos | Same Monday/Sunday fields; **demo tick ≠ production calendar** — runbooks must say so |
| `onchain` | Real Sunday UTC ops/cron | Calendar is authoritative |

UI copy may say “Every Sunday”; never treat a 60s demo tick as a real week in investor materials without labeling demo.

### 2. Math invariant (ROADMAP §3.6 + DATA_MODELS)

Shares/balances are **integers**. Never use floating money in settlement math.

**Off-chain / USD cents (judge-verifiable UI math, R-6.6):**

```text
shareRatio_h = shares_h / totalShares          # totalShares snapshot
amount_h_usd = floor(rentPoolUsd * shares_h / totalShares)
# equivalent: floor(rentPoolUsd * shareRatio_h) with rational care — prefer integer form above
```

Invariant per entry:

```text
EarningsEntry.amountUsd == floor(rentPoolUsd * sharesOwned / totalShares)
```

**On-chain / nanoTON:**

```text
amount_h_nano = floor(rentPoolNano * balance_h / totalSupply)
```

`rentPoolUsd` and `rentPoolNanoTon` are set when the distribution is funded/scheduled; conversion rate policy is display/ops (not re-derived here). UI integrity checks use **USD cents** floor math; explorer proof uses **nanoTON** transfer + real `txHash`.

### 3. Dust policy

ROADMAP §3.6 allows “treasury or next week” but requires matching DATA_MODELS. **Resolution:**

| Domain | Dust policy |
|---|---|
| **Off-chain / hybrid ledger** (`P1-13`, mock, R-6.6) | After all `floor(...)` amounts, remainder cents accrue to the **largest** `shareRatio` holder; ties → **insertion order** (stable). **Required:** `Σ amountUsd == rentPoolUsd` exactly |
| **On-chain nanoTON** | **Same spirit:** after floors, remaining nanoTON assigned to the **largest balance** holder at snapshot (ties: lowest jetton-wallet address bytes as stable tie-break). No silent burn. **Not** defaulted to treasury for MVP-on-chain |

**Rationale for on-chain largest-holder (not treasury):** keeps conservation tests simple (`P2-05`: `sum(payouts) + explicit_dust_line == rentPool`); UI USD and chain nano stay philosophically aligned; treasury skim would need a separate fee bps policy (out of scope).

**Forbidden:** drop dust without accounting; pay “projected” amounts before the pool is funded; round half-up in a way that overspends the pool.

### 4. Primary on-chain mechanism (Phase 2/3 MVP)

| Option | Description |
|---|---|
| **A. Pull / claim** | Contract holds week’s rent pool; each holder **claims** `amount_h`; gas paid by claimer |
| B. Batched push | Ops/relayer pays N holders per TX; multiple batches until complete |
| C. Unbounded single-TX push | **Rejected** — ROADMAP gas risk |

**Chosen: A — pull / claim for MVP-on-chain.**

**Rationale:** gas scales with active claimers (not silent O(holders) on a hot wallet); simpler contract surface for first audit; matches ROADMAP “claim-based or batched”; two-wallet demo (`P3-08`) is two claim TXs, not a custom batcher. Optional **batched push helper** may be added later (Phase 4+) if claim UX friction or ops needs auto-pay — must still be gas-bounded (§8), never option C.

**Claim rules (A):**

| Topic | Rule |
|---|---|
| Open | After pool funded ≥ sum of floor amounts (+ dust assignable); status → `distributing`; claim window opens at/after `payoutDay` 00:00 UTC (ops may open same Sunday) |
| Close | Default window: **7 days** after open (through next Thursday 23:59 UTC), configurable by admin later |
| Unclaimed after window | **Roll into next week’s rent pool** for that property (increase next `rentPoolNano`); mark entry `pending`→ special status or keep pending with UI “rolled — claim closed”; do **not** fake `paid`. Audit row required |
| Who pays gas | **Holder** on claim TX |
| Double-claim | On-chain claimed bitmap / per-holder flag; second claim fails |
| Amount source | Snapshot balances at distribution create (§7); not live balance at claim time |

**Batched push (deferred B) — if added later, must include:**

| Topic | Interim rule |
|---|---|
| `MAX_HOLDERS_PER_BATCH` | **50** interim (conservative); **finalize in P2-07** gas report at 10/50/100 |
| Holder order | Stable sort by jetton wallet address ascending |
| Progress | `distributing` + cursor (last paid address or index); idempotent resume |
| Relayer | Hot wallet caps per ADR-004 |

### 5. Mode matrix (ADR-001)

| Mode | Who runs payout | `EarningsEntry` flip | `txHash` |
|---|---|---|---|
| `mock` | In-process `EarningsRepo.tickPayout` | `pending`→`paid` in memory | `"simulated:" + id` |
| `hybrid` | BullMQ `tickPayout` (`P1-13`) off-chain only | DB `pending`→`paid` + `audit_events` | Synthetic `"simulated:…"` or null; badges stay simulated |
| `onchain` | Fund Distribution → open claim (or later batch) → **indexer** | `paid` only after confirmed claim/payout chain event | Real hash; badge hide only per ADR-001 §4 |

Hybrid **never** moves rent nanoTON to user wallets. On-chain **never** marks paid from cron alone without chain evidence.

### 6. Lifecycle (on-chain path)

```text
scheduled     → RentalDistribution created; entries pending; pool not yet sufficient
                 OR pool funded and waiting for payoutDay
distributing  → claim window open (A) OR batch N in progress (future B)
completed     → all snapshot holders paid/claimed OR window closed and unclaimed rolled
                 + dust settled; no further claims for this weekOf
```

| Step | Actor | DB / chain |
|---|---|---|
| 1. Create distribution | Admin/cron | `rental_distributions` `scheduled`; precompute pending `earnings_entries` with floor amounts + dust assignment |
| 2. Fund pool | Owner/ops | Ton to `distribution_address`; record `rentPoolNanoTon` |
| 3. Open claims | Ops/cron Sunday | Status `distributing`; emit/open claim |
| 4. Holder claims | User wallet | On-chain transfer out; event with property/week/amount |
| 5. Index | Indexer `P3-03` | Set `earnings_entries.tx_hash`, status `paid` |
| 6. Close | Cron after window | Unclaimed → next pool; status `completed` when settled |

Map: `rental_distributions.status` ∈ `scheduled` | `distributing` | `completed` (DATA_MODELS).

### 7. Failure modes

| Failure | Detection | User-visible | Ops action |
|---|---|---|---|
| **Underfunded rent pool** | `balance < required floors + dust` before open | No `paid` rows; entry stays `pending`; UI error/hint **underfunded** (Phase 3 error states) | Fund contract; do not open claims; alert |
| **Partial batch success** (future B) | Batch TX fails mid-list | Paid subset only those with tx; others pending | Resume cursor; idempotent retry; never double-pay |
| **Claim after window** | Contract reject | UI: claim closed / rolled to next week | None automatic; user waits next distribution |
| **Indexer lag** | Event not yet applied | Entry `pending` until indexed; ADR-001 honesty; no explorer until hash | Reconciliation `P3-06`; re-index |
| **Holder balance changed mid-week** | Transfers after snapshot | Payout uses **snapshot at distribution create**, not claim-time balance | Document in UI help; secondary market does not rewrite past week |
| **Zero holders / zero supply** | Snapshot empty or `totalShares==0` | No entries; distribution no-op | Audit row; mark `completed` or cancel scheduled |
| **Contract paused** | Pause flag (ADR-004) | Claims/distribute disabled; pending unchanged | Admin unpause; incident runbook |
| **Double tick (hybrid)** | Idempotency key `propertyId#weekOf` | No double paid amounts | `P1-13` must be double-run safe |
| **Claim fails (gas/user abort)** | No success event | Stays pending; user retries | Support only if contract stuck |

### 8. Gas / batch limits

| Rule | Value |
|---|---|
| Unbounded loop over all holders in one TX | **Forbidden** |
| MVP path | Claim (A) — per-TX work O(1) holder |
| Interim batch max (if B enabled) | `MAX_HOLDERS_PER_BATCH = 50` until measured |
| Finalization gate | **P2-07** gas report for **10 / 50 / 100** holders sets production batch size and may confirm claim-only is enough |
| Relayer balance | Capped per ADR-004; claim path minimizes relayer spend |

### 9. Consequences → named tasks

| Task | Impact |
|---|---|
| **P1-10** | Earnings API returns pending/paid; floor math in tests |
| **P1-13** | Idempotent off-chain `tickPayout`; dust → largest holder; synthetic hash; Sunday-week fields even if demo cadence |
| **P2-04** | Distribution contract: deposit rent, **claim** API, pause, snapshot week id |
| **P2-05** | Conservation: `sum(payouts) + dust == rentPool` (USD fixture + nanoTON) |
| **P2-07** | Gas benchmarks; finalize batch size only if B pursued |
| **P3-03** | Indexer claim/payout events → `tx_hash` + `paid` |
| **P3-06** | Reconciliation chain vs DB |
| **P3-08** | Two-wallet real claim demo on testnet |
| **UI Earnings** | Integrity line R-6.6; badges/explorer per ADR-001; underfunded/pending chain states |

### 10. Alternatives considered

| Alternative | Decision |
|---|---|
| **C. Unbounded push all holders one TX** | **Rejected** — gas DoS / unpredictable fees (ROADMAP risk) |
| **B. Batched push as MVP default** | **Deferred** — more relayer key risk and cursor complexity before first real payout demo; revisit after P2-07 / UX feedback |
| **Off-chain-only forever** | **Rejected** — blocks investor “real rent + explorer hash” story (Phase 3 exit) |
| **Dust always burned** | **Rejected** — breaks `Σ == pool` judge check unless UI lies |
| **Dust → treasury by default** | **Rejected for MVP** — fee policy separate; largest-holder matches DATA_MODELS |
| **Dust → next week only (on-chain)** | Deferred as optional; unclaimed-after-window already rolls; funded dust uses largest holder |
| **Pay projected before pool funded** | **Rejected** — creates fake paid / insolvency |
| **Live balance at claim time** | **Rejected** — mid-week sellers would steal or lose week’s rent unfairly; snapshot is fairer |

### 11. Out of scope

| Topic | Where |
|---|---|
| Jetton deploy / `onchain_master` | ADR-002 |
| Who signs fund/pause; hot wallet caps | ADR-004 |
| Full opcodes / Tact-FunC detail | P2-02 / P2-04 |
| Bot notify “rent arrived” | P4-01 |
| USDT rent asset | Phase 4 spike |
| Implementing workers or contracts | Phase 1–3 tasks — not this ADR |

## Consequences

**Positive:** single math + dust story from mock through chain; claim path avoids unbounded gas; hybrid can ship durable ledger without wallets receiving TON rent.

**Negative / cost:** users must claim (gas + UX step); unclaimed roll needs clear UI; two-wallet demo requires both wallets to claim.

**Must not:** mark on-chain `paid` without chain event; open claims when underfunded; use float division in settlement; enable unbounded distribute.

## References

- [ADR-001 — Settlement modes](./ADR-001-settlement-modes.md) — mode matrix, badges, synthetic vs real `txHash`
- [ADR-002 — Jetton deployment](./ADR-002-jetton-factory.md) — `distribution_address` registry; one master per property
- [ROADMAP.md](../../ROADMAP.md) — §3.5 Distribution; §3.6 invariant; Phase 3 §3.3 path; unbounded gas risk; P1-13, P2-04/05/07, P3-03/08
- [docs/research/DATA_MODELS.md](../research/DATA_MODELS.md) — `RentalDistribution`, floor invariant, largest-holder dust, Monday/Sunday fields
- [docs/research/USER_FLOW.md](../research/USER_FLOW.md) — Flow 2 weekly cadence + honest simulated labeling
- [EXECUTION-PLAN.md](../../EXECUTION-PLAN.md) — P0-03 acceptance
- Mock: `EarningsRepo.tickPayout` — in-memory pending→paid + `simulated:` hash (hybrid analogue offline)
