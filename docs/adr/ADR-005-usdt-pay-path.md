# ADR-005 — USDT / USD stable jetton pay path (feasibility spike)

- Status: **Accepted** (testnet implementation shipped; mainnet gated)
- Date: 2026-07-30
- Deciders: DigiHouse tech lead / team

> **Update (2026-07-31):** the spike was implemented as **Option A-lite (off-chain settle, on-chain verify)**.
> `/v1/buys/prepare` returns a `jetton_transfer` from the buyer's USDT jetton wallet to
> `ADMIN_USDT_WALLET_ADDRESS`; `/v1/buys/verify-and-settle` verifies the JettonTransfer action
> (master + recipient + amount + payer + ≤30 min) via TonAPI before settling shares. Config:
> `ADMIN_USDT_WALLET_ADDRESS` + `USDT_JETTON_MASTER_ADDRESS` in `apps/api/.env` (see `apps/api/README.md`).
> Mainnet acceptance still requires the legal/go-no-go gates in `docs/ops/mainnet-checklist.md`.

## Context

DigiHouse sells property shares priced and settled in **TON** (nanoTON). However:

- Property values and rental income are denominated in **USD** (cents). Users see USD everywhere in the Mini App; TON is an intermediary.
- Most target investors hold USDT (or another USD stablecoin) rather than TON. Requiring a TON purchase → USDT swap before every buy adds friction and a taxable/tracking event in many jurisdictions.
- ROADMAP §4 (Phase 4) flags **optional USDT pay path** as a value-add for global retail; this ADR is the spike called out in ADR-002 §8 and EXECUTION-PLAN `P4-08`.
- Competitor fractional-RE platforms on other chains often support USDC/USDT as primary payment; TON-native DeFi shows growing USDT circulation via bridges and DEX.

**What this spike is not:** a decision to implement. It evaluates feasibility, risk, and design surface so a go/no-go can be informed.

## Non-goals (explicit)

- **No Mini App USDT button** in this task — UI does not change until ADR Accepted and a follow-up implementation task is cut.
- **No buy-route code changes** — this ADR is read-only spike; no production code in this PR.
- **No contract audit scope** — the spike does not name a specific bridge or jetton standard version to deploy.
- **No on-chain swap integration** — the spike does not require a live DEX integration at this stage.

## Decision

### 1. Recommended posture

**Defer a production USDT pay path to Phase 5+** (post-MVP mainnet). For the MVP:

| Surface | Decision |
|---|---|
| Buy settlement | TON-only via TonConnect (current) |
| Price display | USD always visible; TON equivalent shown after wallet connect (existing format helpers) |
| USDT acceptance | **Not accepted** in MVP buy flow |
| ADR status | **Proposed** — spike documented; implementation gated on mainnet go/no-go |

**Rationale for deferral:**

| Factor | Detail |
|---|---|
| Truth of record | ADR-001 and ADR-002 define TON jetton as the canonical on-chain share representation. A USDT buy path requires an extra translation layer (swap or dual-jetton escrow) that adds audit surface and gas overhead before the core share-jetton loop is proven on testnet. |
| MVP schedule | Phase 2 (contracts) and Phase 3 (integration) still need to ship the TON-native loop. Adding a second payment jetton before the first one works multiplies unknowns. |
| Liquidity risk | USDT on TON relies on bridges (TON → Ethereum, via TonBridge, LayerZero, or similar). Bridge liquidity, downtime, or frozen assets would block buy completion and require fallback logic. |
| Gas estimation | A USDT jetton transfer + a share-jetton mint/transfer in one TON message is feasible but gas costs are higher than a single native TON transfer; worst-case the user needs TON for gas anyway, reducing the UX benefit. |
| Regulatory | Accepting a USD-backed stablecoin for real estate token purchases may trigger different money-transmitter / securities considerations than accepting TON. Legal input is required before production. |

### 2. If accepted later — architectural options

Three viable architectures identified during the spike, ordered by implementation preference:

| Option | Summary | Pros | Cons |
|---|---|---|---|
| **A. Dual-jetton buy** (preferred) | User sends USDT jetton to an escrow / Sale contract; contract verifies payment, then mints the property jetton to user. Exchange rate determined off-chain (API) at prepare time. | Clean separation; property jetton still canonical SoT; rate is controllable by the platform; no DEX dependency. | Requires a new Sale contract (or upgrade) with USDT jetton acceptance; more audit surface; user must have USDT jetton wallet deployed. |
| **B. Swap-first, then buy** | Front-end routes user through a DEX (e.g. STON.fi, DeDust) to swap USDT → TON, then the existing TON buy path proceeds. | Minimal contract changes; existing buy path untouched; DEX handles rate and liquidity. | Awful UX (two TX approvals + swap + buy); DEX slippage surprises; user pays gas twice; DEX integration maintenance. |
| **C. Hybrid settlement (no on-chain USDT)** | User selects "pay in USDT" in Mini App; API records intent; off-chain settlement converts to TON and completes buy via operator hot wallet. | Zero new contract surface; fast to implement; no bridge risk. | ADR-001 honesty rules apply: this is `hybrid` settlement, not on-chain; cannot claim "USDT pay" is on-chain; operator hot wallet carries custodial risk. |

**Recommendation if Phase 5 picks this up:** Option A (dual-jetton buy) with a dedicated Sale contract that accepts a whitelisted jetton (USDT or USDC via a configurable `allowed_payment_jetton` address). The API supplies the USD-per-share rate at prepare time; the contract verifies `amount_in >= shares × rate` before minting the property jetton.

### 3. What would need to change (if accepted)

| Concern | Required change | Phase |
|---|---|---|
| **Schema** | `buy_intents` gains an optional `payment_jetton_master` column; `transactions` gains `paymentJetton` / `paymentAmount` mirror | P5 (or new P4 task) |
| **Buy-prepare API** | Accept a `paymentMethod: "ton" \| "usdt"` hint; return exchange rate if USDT | P5 |
| **Buy-confirm API** | Accept a `boc` representing USDT transfer (or escrow deposit) rather than TON transfer | P5 |
| **Sale contract** | New or upgraded Sale contract that accepts whitelisted jettons — see Option A above | P5 contracts |
| **UI: Buy flow** | Payment method selector below quantity; TonConnect request may target a jetton transfer instead of TON; new copy for USDT route | P5 Mini App |
| **Rate feed** | Off-chain rate (API converts USD cents → USDT minor units at prepare time); rate source needs reliability requirements | P5 ops |
| **Honesty chrome** | ADR-001 §4 cutover rules apply; USDT-settled buys carry "simulated" badge unless on-chain share mint is also on-chain verifiable | P5 + ADR-001 extension |

### 4. Gas and liquidity risks (explicit)

| Risk | Severity | Mitigation (if implemented) |
|---|---|---|
| **USDT bridge down / frozen** | High — user cannot complete buy via USDT | Fall back to TON-only; clear error message in Mini App; rate API rejects USDT method when bridge oracle reports unhealthy |
| **User has no USDT jetton wallet** | Medium — first USDT receive auto-deploys wallet on TON, but if user sends from CEX the wallet may not exist yet | Require a zero-value "wallet init" notification before buy; or deploy during prepare step (gas cost shown to user) |
| **Rate moves between prepare and confirm** | Medium — user sees one USD price at prepare, pays different USDT amount at confirm | Short prepare TTL (same as current TON path); platform may absorb minor drift or reject stale intent |
| **User needs TON for gas even when paying in USDT** | High — USDT transfer still requires TON for gas; "I have USDT but no TON" is a blocked user | Show gas TON requirement in buy summary; offer a "get TON" CTA (existing pattern) |
| **Double-spend / race** | Medium — user sends USDT but property-jetton mint fails | Sale contract must follow checks-effects-interactions pattern; refund path required; idempotency via nonce/intent ID |

### 5. Honesty and badge implications

| Scenario | Badge rule (derived from ADR-001) |
|---|---|
| User pays in USDT; property jetton minted on-chain | Same as TON on-chain: simulated badge hides only when ADR-001 §4 gates pass (real hash, explorer URL, `SETTLEMENT_MODE=onchain`) |
| User pays in USDT; settlement is hybrid (off-chain conversion) | Must carry simulated/full honesty chrome per ADR-001 hybrid rules — "USDT payment processed (simulated)" |
| Mini App shows USDT as payment option but buy settles off-chain | UI must label clearly: "USDT payment via platform settlement — not on-chain" |

**Hard rule extension:** The payment jetton used does not change the honesty rules. A USDT buy is not inherently more "real" than a TON buy. Settlement mode and per-row hash gates are the only honesty authorities (ADR-001 §4).

### 6. Relationship to existing ADRs

| ADR | Relationship |
|---|---|
| **ADR-001** | USDT path does not alter the settlement ladder. The `SETTLEMENT_MODE` and badge rules apply identically regardless of which jetton the user pays in. A new `paymentJetton` field on transactions is data, not a new mode. |
| **ADR-002** | Jetton-per-property model is unchanged. The property jetton remains the canonical share representation. USDT is a *payment* jetton, not a new share token. No new master type needed. |
| **ADR-003** | Distribution remains in TON (rent pool in TON or USD-converted). USDT buy does not imply USDT distribution — mixing payment and payout jetton is a separate decision not spiked here. |
| **ADR-004** | If Option C (hybrid settlement with operator conversion) is used, the hot wallet that converts USDT → TON must fall under the caps and monitoring rules in ADR-004. |

## Consequences

**If deferred (this ADR's recommendation):**

- **Positive:** Phase 2/3 focus stays on the core TON-native loop; no extra contract or audit scope before mainnet.
- **Negative:** Early adopters must hold TON to buy; may reduce conversion from Telegram users who only have USDT.

**If accepted in Phase 5:**

| Obligation | Task |
|---|---|
| Sale contract accepting whitelisted payment jetton | P5 contracts (new) |
| `buy_intents` and `transactions` schema migration | P5 API |
| Buy-prepare/confirm API support for `paymentMethod` | P5 API |
| Mini App buy flow payment method selector | P5 Mini App |
| Rate feed and gas estimation for USDT path | P5 ops |
| Updated honesty chrome rules (ADR-001 extension) | P5 docs |

**Explicit non-requirement for implementation:** No change to property jetton (ADR-002), no change to distribution (ADR-003), no change to USDT distribution. These are separate decisions.

## Alternatives considered

| Alternative | Why not preferred |
|---|---|
| **Multi-jetton factory that accepts any jetton** | Over-engineered before first payment path proven; gas cost and audit surface too high for MVP |
| **Accept USDT only via off-ramp (CEX integration)** | Relies on third-party API; KYC at CEX level; not self-custodial; contradicts TonConnect ethos |
| **Pegged "DigiHouse USD" internal token** | Requires its own liquidity, audit, and trust; no advantage over established stablecoins |
| **Skip stable payment entirely until regulatory clarity** | Viable for MVP; this ADR defers to Phase 5 which is effectively this alternative with documentation |

## References

- [ADR-001 — Settlement modes](./ADR-001-settlement-modes.md) — mode ladder, badge rules, cutover gates
- [ADR-002 — Jetton factory](./ADR-002-jetton-factory.md) — per-property master model; USDT spike noted as P4-08 in §8
- [ROADMAP.md](../../ROADMAP.md) — §4 Phase 4 advanced features; P4-08 USDT jetton pay path
- [EXECUTION-PLAN.md](../../EXECUTION-PLAN.md) — P4-08 task reference
- TON bridge / USDT on TON: https://ton.org/bridges — TON bridge ecosystem (external; referenced for spike completeness, not endorsed)
- [docs/research/TECH_STACK.md](../research/TECH_STACK.md) — existing buy stub; TonConnect integration boundary
- [docs/research/DATA_MODELS.md](../research/DATA_MODELS.md) — share and payment units; transaction record shape

