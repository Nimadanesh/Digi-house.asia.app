# ADR-001 — Settlement modes (`mock` / `hybrid` / `onchain`)

- Status: Accepted
- Date: 2026-07-29
- Deciders: DigiHouse tech lead / team

## Context

DigiHouse ships a Telegram Mini App with a full invest → hold → earn loop on **mock repositories**. Backend (Phase 1), jettons (Phase 2), and live distribution (Phase 3) will land later. Without a frozen settlement ladder, teams thrash on:

- Whether holdings / earnings are “real” when Postgres exists but jettons do not
- When UI may drop “simulated” badges or claim explorer-verifiable payouts
- Conflating **where data is read** (`mock` vs HTTP API) with **how settlement works**

ROADMAP risk **“Mock→live honesty failure”** is regulatory/trust damage. This ADR freezes mode semantics, honesty chrome, and cutover gates so P1–P3 cannot invent opposite claims.

Related product rules already live in DESIGN_SYSTEM (MVP payout honesty), USER_FLOW (honest credibility), DATA_MODELS (floor math + dust), TECH_STACK (buy stub + synthetic `txHash`), and the `telegram-ton-ownership` skill.

## Decision

### 1. Mode ladder + env vars

**Settlement mode (authoritative for honesty and write-path behavior):**

```text
SETTLEMENT_MODE ∈ mock | hybrid | onchain
```

Ladder is one-way in product intent: `mock` → `hybrid` → `onchain`. Environments may pin a mode; cutover is explicit ops, not silent.

**Related — do not conflate:**

| Env var | Values | Owns |
|---|---|---|
| `SETTLEMENT_MODE` | `mock` \| `hybrid` \| `onchain` | How buy / holdings / earnings **settle**; what the UI may claim |
| `NEXT_PUBLIC_DATA_SOURCE` | `mock` \| `api` | Where **reads** come from (in-memory mock repos vs HTTP behind `getRepo()`) — Phase 1 (`P1-15`) |

Rules:

- `NEXT_PUBLIC_DATA_SOURCE=api` **never** implies on-chain settlement or badge hide.
- `SETTLEMENT_MODE=onchain` requires API + indexer + contracts; still subject to per-row hash gates (§4).
- Components never read env for chain claims ad hoc; badge helpers / hooks consume a single settlement-aware policy (implemented later; this ADR defines the policy).

### 2. Required matrix

| Concern | `mock` | `hybrid` | `onchain` |
|---|---|---|---|
| **Buy settlement** | In-memory holding update after TonConnect **stub** TX (optional tiny testnet transfer as proof of intent). Shares **not** minted on-chain. | API `prepare` / `confirm` persists holding + app ledger in **Postgres**. TonConnect may still send a stub or payment intent; **no full jetton mint required**. | Prepare/confirm + indexer observe real jetton mint/transfer (or sale contract). Holdings credit only after confirmed chain event. |
| **Holdings source of truth** | Mock `PortfolioRepo` / in-memory seed | **Postgres** holdings projection (API authoritative for UI) | **Jetton balances** via indexer projection; DB is cache; reconciliation job must match chain |
| **Earnings payout mechanism** | Mock `EarningsRepo.tickPayout()` flips `pending` → `paid` on demo cadence (dev default ~60s; product cadence Sunday UTC) | Off-chain worker (`tickPayout` / BullMQ): ledger `pending` → `paid`; audit row; **no** wallet transfer of rent | Distribution contract (push batch and/or claim per ADR-003); indexer writes paid rows from chain events |
| **`EarningsEntry.txHash`** | Synthetic: `"simulated:" + id` | Synthetic `"simulated:…"` **unless** a real chain hash is later attached; hybrid default = synthetic | Real TON BOC / tx hash from distribution transfer or claim |
| **Explorer link allowed?** | **No** (hash is not chain-resolvable) | **No**, unless row has non-`simulated:` hash (rare hybrid edge) | **Yes**, when hash is real and explorer URL can be built for configured network |
| **Demo / Simulated UI badge rules** | Full honesty chrome (§3) | Full honesty chrome unless a **specific row** meets §4 on-chain gates (default: still simulated) | Hero copy may soften only after global gates; per-row simulated badge hides **only** per §4 |
| **Order matching** | Mock / in-memory place-cancel; simulated fills as seeded | API order book; off-chain match; DB fills; **not** on-chain matcher | Off-chain match + on-chain jetton/payment settlement observed by indexer (on-chain book is post-MVP optional) |

**Narrative alignment (ROADMAP):**

- **`mock`** — today’s Mini App. Demo-complete loop; maximum honesty labeling.
- **`hybrid`** — Phase 1 default on staging: durable API + Postgres; buy/earnings persist without claiming jetton or rent-in-wallet truth.
- **`onchain`** — Phase 3+: chain is SoT for balances and payouts; badges hide only with explorer-capable hashes.

### 3. UI badge / honesty rules (non-negotiable)

Lock these strings and behaviors (DESIGN_SYSTEM + ownership guard + shipped Mini App copy):

| Surface | Rule |
|---|---|
| **Canonical hero copy** | Exactly once per hero context (Earnings header/summary): `simulated weekly payout · on-chain verifiable post-MVP` |
| **Paid pill** | Green **Paid** + muted **simulated** capsule sibling (`bg-muted text-muted-foreground`, not a second finance color) while the row is not fully on-chain-verified per §4 |
| **Expandable entry** | Disclose synthetic hash, e.g. `Simulated payout · tx hash is a placeholder`; show proportional math `Rent this week $X × your Y% = $Z` |
| **Buy toast** | `Buy confirmed (simulated)` when buy is not on-chain share settlement (`mock` / typical `hybrid`) |
| **Floating Demo mode pill** | Settings-toggleable (`showDemoBadge`); navigates to Settings; **orthogonal** to per-entry simulated badges — product chrome for “seed / demo environment,” not a substitute for payout honesty |
| **Forbidden claims** | Never claim rent “landed in your wallet”, is on-chain, or is verifiable **unless** §4 allows it for that surface/row |
| **Projected naming** | Fields stay `…Projected…` / `projectedYield` / `thisWeekProjectedUsd` — never label projected as paid |

Pending pills need no simulated badge. Paid without §4 gates always carries simulated chrome.

### 4. Cutover rules (when badges may hide)

**Hard gates — all required to hide per-entry simulated badge on an earnings row:**

1. `SETTLEMENT_MODE=onchain`, **and**
2. `txHash` is a **real** chain hash (does **not** start with `simulated:`), **and**
3. An explorer URL can be built for the configured TON network from that hash.

**Additional rules:**

| Rule | Detail |
|---|---|
| Global hero disclaimer | May soften/remove only when product policy says environment is fully on-chain **and** remaining unpaid/synthetic paths are impossible or clearly segmented; default: keep until ops sign-off on Phase 3 cutover |
| Floating Demo pill | Hide/soften only via **product settings** (user toggle) or explicit env product flag — **does not** remove legal/honesty copy or per-entry simulated badges |
| Data source alone | **Never** hide honesty chrome solely because `NEXT_PUBLIC_DATA_SOURCE=api` |
| Buy toast | Drop “(simulated)” only when buy path mints/transfers shares on-chain and confirm is indexer-backed (`onchain` buy path) |
| Explorer links | Render only when gate (2)+(3) pass for that row |
| Partial cutover | Mixed ledgers allowed temporarily: some rows real hash (badge off + explorer), others synthetic (badge on). UI is **per-row**, not all-or-nothing |

### 5. Default per environment

| Env | `SETTLEMENT_MODE` | `NEXT_PUBLIC_DATA_SOURCE` | Rationale |
|---|---|---|---|
| **local dev** | `mock` | `mock` (until `P1-15`; then optional `api` against local API) | Fast demo loop; no Postgres required |
| **staging** | `hybrid` | `api` | Prove durable API + honesty still correct with real HTTP |
| **prod (initial)** | `hybrid` (or allowlisted `onchain` after Phase 3+ go/no-go) | `api` | No silent mainnet “verifiable” claims before contracts + audit + legal gates |

Prod must not default to `onchain` until Phase 5 go/no-go. Allowlist (wallets/properties/networks) may enable `onchain` on testnet/staging first.

### 6. Math / units (reference)

Do not re-derive; implementations must match:

| Unit | Rule |
|---|---|
| Money | Integer **cents** (USD minor units) |
| TON | **nanoTON** |
| Shares | Integers |
| Weekly rent | `weeklyRent = floor(annualRentUsd / 52)` |
| Projected holder yield | `projectedYield = floor(weeklyRentUsd × sharesOwned / totalShares)` |
| Paid entry amount | `amountUsd == floor(rentPoolUsd × shareRatio)` with `shareRatio = sharesOwned / totalShares` |

**Production invariant:** ROADMAP §3.6 (Sunday UTC week; floor per holder; remainder policy documented).

**Dust policy:** DATA_MODELS — after summing all `floor(rentPoolUsd × shareRatio)`, remainder accrues to the **largest holder** (ties: insertion order) so `ΣamountUsd == rentPoolUsd` exactly. On-chain nanoTON dust policy is refined in ADR-003; must not contradict the cents invariant off-chain.

Format helpers: `src/lib/format.ts` (`usd`, `ton`, `weeklyRent`, `projectedYield`, …).

### 7. Jurisdiction / who can buy

**Phase 0 note (not a legal memo):**

- MVP and early staging target **testnet / demo** use and internal/investor demos.
- **Who can buy (initial):** any connected Telegram user with a TonConnect wallet in allowed environments; no KYC in app for mock/hybrid demo paths.
- **Later:** geo-block, allowlists, and/or KYC gates land via API business rules (ROADMAP Phase 4–5) before broad mainnet primary sales.
- Marketing and UI must not promise regulated securities treatment, guaranteed yield, or unrestricted global access.

### 8. Consequences

**Must implement because of this ADR:**

| Phase / task | Obligation |
|---|---|
| **P1-12** buy prepare/confirm | Hybrid DB settlement; buy toast remains simulated; no jetton mint required |
| **P1-13** `tickPayout` worker | Off-chain pending→paid; synthetic `txHash` unless real hash supplied |
| **P1-15** `HttpRepos` + `NEXT_PUBLIC_DATA_SOURCE` | Swap reads only; does not change badge policy |
| **Phase 1 exit** | `SETTLEMENT_MODE` / honesty badges still accurate per this ADR |
| **P3 indexer / buy / distribution** | Real hashes; explorer links; per-row badge hide only under §4 |
| **P3-10** | `SETTLEMENT_MODE` wired end-to-end |
| **P0-07** env matrix | Document both env vars across web/api |
| **QA / design-review** | Fail any screen that claims on-chain/verifiable/in-wallet without §4 |

**Positive:** single vocabulary for backend, contracts, and UI; auditors can map claims to mode.

**Negative / cost:** hybrid feels “real” (persistent DB) but still labeled simulated — product must educate; two env vars require discipline in runbooks.

## Alternatives considered

| Alternative | Why rejected |
|---|---|
| Single boolean `IS_DEMO` / `NEXT_PUBLIC_DEMO` | Collapses data-source, settlement, and chrome; cannot express hybrid-with-API honestly |
| Silent cutover when API ships | Causes Mock→live honesty failure; users/judges think DB paid = on-chain |
| Claim on-chain while DB-only | Violates DESIGN_SYSTEM, ownership skill, and trust NFR |
| Hide badges when `DATA_SOURCE=api` | Conflates read path with settlement; forbidden by §4 |
| Three unrelated flags per screen | Thrash and inconsistent copy; one ladder + per-row hash gates is enough |
| Always show simulated forever | Blocks honest Phase 3 demo with real explorer links; cutover must exist with hard gates |

## References

- [ROADMAP.md](../../ROADMAP.md) — §3.3 separation of concerns; §3.6 weekly yield invariant; Phase 0 ladder; Phase 3 honesty cutover; risk Mock→live honesty failure
- [EXECUTION-PLAN.md](../../EXECUTION-PLAN.md) — P0-01 acceptance; P1-12/13/15; Phase 1 exit honesty gate
- [docs/research/DATA_MODELS.md](../research/DATA_MODELS.md) — units; `weeklyRent` / `projectedYield`; proportional invariant; dust policy; `EarningsEntry.txHash`; on-chain shape §6
- [docs/research/DESIGN_SYSTEM.md](../research/DESIGN_SYSTEM.md) — MVP payout honesty copy contract
- [docs/research/USER_FLOW.md](../research/USER_FLOW.md) — Flow 2 honest credibility
- [docs/research/TECH_STACK.md](../research/TECH_STACK.md) — buy stub; synthetic `"simulated:" + id`; `getRepo()` boundary
- [src/lib/api/repos.ts](../../src/lib/api/repos.ts) — repository contracts (swap boundary)
- Mock earnings behavior — `EarningsRepo.tickPayout()` + synthetic hashes (see `src/lib/mock` / types `EarningsEntry.txHash`)
- [src/components/common/DemoModeBadge.tsx](../../src/components/common/DemoModeBadge.tsx) — floating Demo mode pill (settings-orthogonal)
- [DEMO.md](../../DEMO.md) — demo script honesty lines
- Skill `telegram-ton-ownership` — MVP payout honesty hard rules
