# DigiHouse — MVP → PRODUCT Transformation Plan

> **Source of truth for the product transformation.** Companion to [`EXECUTION-PLAN.md`](./EXECUTION-PLAN.md) (platform baseline) and [`ROADMAP.md`](./ROADMAP.md).
> **Rule:** When a task finishes and acceptance criteria pass, flip `- [ ]` → `- [x]` here **and** update the status lines at the bottom.
> **Last updated:** 2026-08-17

---

## 0. Final Product Spec (locked decisions)

### 0.0 Standing rules (apply to every phase)

1. **Design-system fidelity:** every frontend element must exactly match the existing design system — spacing, margins/padding, colors, typography, radii, and component styling. Reuse existing UI primitives and tokens; no ad-hoc styles.
2. **Local-first, deploy-ready:** the repo must run locally with plain `npm` scripts and stay deployable as-is (Vercel web + Fly.io API) with the Telegram Mini App as the primary channel. No infrastructure assumptions beyond what already exists.

**Business model:** Fully Web2, database-driven. All shares, trades, and reporting are OFF-CHAIN records in Postgres. Crypto (USDT-TON) is a **payment rail only**. Some operations are automated, some are admin-driven.

### 0.1 Listing types

| Type | State | Pricing |
|---|---|---|
| Primary offering | `funding` | Fixed share price, fixed share count. Users buy any quantity while supply lasts. |
| Secondary market | `resale` (primary sold out) | Price discovered by supply/demand via an **order book** (user-to-user trading). |

Transition `funding → resale` is **one-way**. Instant sell exists only while `funding`, so a `resale` property can never return to primary. This invariant must be enforced in code.

### 0.2 Buying

- **Primary:** pick quantity from remaining supply → pay (USDT-TON). Fee per §0.5.
- **Secondary:** place a limit order (price + quantity) into the order book, like any crypto exchange. Fee per §0.5.

### 0.3 Selling

- **Instant sell (primary phase only):** platform is the counterparty and buys back at **share price − 7%**. Returned shares go back into primary supply (progress bar decreases).
- **Custom-price sell:** user creates a sell order at a chosen price.
  - While property is `funding`: order is **`queued`** (not tradable).
  - The moment primary supply reaches 0, all `queued` sell orders for that property atomically become **`active`** in the order book. Buyers are then other users, not the platform.

### 0.4 Yield (rental income)

- Every property carries a monthly yield rate **4.5%–7.5%** (set by admin at seed time; newer/nicer houses → closer to 7.5%).
- User must **LOCK** shares to earn yield. Yield accrues **from day 1 of locking**. Locked shares cannot be sold.
- **Monthly payout:** `principal × rate`, once per month.
- **Weekly payout:** effective rate = `rate − 1pp`, paid in 4 weekly installments of `principal × (rate − 1pp) / 4`.
  - Example: $1,000 at 6% monthly → $60/month; weekly → 5% → $12.5/week.
- **Unlock:** user requests unlock → yield **stops accruing at the request timestamp** → shares become sellable after 2–3 days.
- **Accrued-but-unpaid yield at unlock request: is paid out** (up to `unlock_requested_at`). *(Default decision; flip here if changed.)*
- **Proration:** monthly payouts are pro-rata by days locked within the month. *(Default decision; flip here if changed.)*

### 0.4a Property pricing & display model (implemented 2026-08-16)

Every property follows one coherent chain — all displayed numbers derive from it:

- **Total value** (e.g. $800,000) and **offered amount** (e.g. $200,000) are explicit fields (`total_value_usd`, offered = `totalShares × sharePriceUsd`).
- **Share price** is always **$80–150**; share count = offered ÷ price (e.g. $200k ÷ $80 = 2,500 shares).
- **Monthly yield rate** (4.5–7.5% by quality) applies to invested amount:
  - per share: `price × rate` ($80 @ 6% → **$4.80/mo**)
  - monthly = `invested × rate`; 10 shares = $800 → **$48/mo** → **$576/yr**
  - weekly option = `(rate − 1pp) / 4` per week
  - annual return shown on cards = `rate × 12` (6% → 72% APY)
- Single source of truth for UI math: `src/lib/property-yield.ts` (web) — marketplace cards, property detail, income calculator, and buy sheets all use it, so every number matches everywhere. Seed data (mock + API) is generated from the same chain (verified by `integrity.test.ts`).
- **Commission disclosure**: a fee icon on each property card (and a pill on detail) opens the `FeeScheduleSheet` bottom sheet with the 9-tier §0.5 table + flat 7% instant-sell note; data from `GET /v1/fees` (mock mirrors the same tiers).

### 0.5 Fees (platform commission)

Fee tier is determined **per transaction amount** (not cumulative). Instant sell is always a flat 7%.

| # | Transaction amount (USD) | Buy — primary | Buy — secondary | Sell — secondary |
|---|---|---|---|---|
| 1 | 80 – 500 | 3% | 0.9% | 0.9% |
| 2 | 500 – 2,000 | 2.5% | 0.8% | 0.8% |
| 3 | 2,000 – 10,000 | 2% | 0.7% | 0.7% |
| 4 | 10,000 – 50,000 | 1.5% | 0.6% | 0.6% |
| 5 | 50,000 – 200,000 | 1% | 0.5% | 0.5% |
| 6 | 200,000 – 500,000 | 0.8% | 0.4% | 0.4% |
| 7 | 500,000 – 1,000,000 | 0.6% | 0.3% | 0.3% |
| 8 | 1,000,000 – 10,000,000 | 0.4% | 0.2% | 0.2% |
| 9 | ≥ 10,000,000 | 0.01% | 0.1% | 0.1% |
| — | Instant sell (primary only) | — | — | **flat 7%** |

### 0.6 Money & payments

- No buy/sell caps. No fiat rail. Crypto only: **USDT-TON**.
- Users provide a **USDT withdrawal address**; yield is computed off-chain and credited to their in-app wallet.
- Withdrawals: **USDT-TON only**, from the withdrawable balance. Initially fulfilled manually by admin (recorded via admin API).
- Wallet model has two balances:
  - `investing` — proceeds of sales, spendable on new purchases.
  - `withdrawable` — yield + anything the user may withdraw.
- Platform seeds its own orders in the secondary market at launch to make the book look alive (house account, flagged `is_house_account`, never self-matched).

### 0.7 Launch content

6 primary-offering properties + 18 secondary-market properties at launch. Admin operations initially performed in-code / via admin API; manual yield payouts until automated.

### 0.8 Legal

Counsel checklist intentionally deferred (scale-stage item). All other product features proceed.

---

## Progress Tracker

### Phase A — Financial infrastructure
- [x] **PA-01** — Migration: `balances` table (`user_id`, `investing_usd`, `withdrawable_usd`, cents) — `0019_product_foundation.sql`
- [x] **PA-02** — Migration: `fee_tiers` table (9 tiers from §0.5) + seed in migration
- [x] **PA-03** — Pure fee resolver `resolveFee(tiers, amountUsd, op)` + unit tests (tier boundaries, flat instant sell, rounding)
- [x] **PA-04** — `GET /v1/fees` (schedule) + `GET /v1/fees/preview?amountUsd=&op=` + tests
- [x] **PA-05** — Migration: `properties.monthly_yield_rate` numeric(4,2) CHECK 4.5–7.5, backfill via DEFAULT 5.50; seed rows derive rate from yearBuilt (quality). *Payout-period choice moved to `share_locks` in Phase B (per-lock user choice).*
- [x] **PA-06** — Atomic `BalanceStore.adjust()` (guarded single-statement UPDATE, overdraft-safe, DB + memory impls, unit tests). Route-level audit events follow in Phases B–F.

**Phase A gate:** fee resolver covers all 9 tiers; balance mutations atomic + tested.

### Phase B — Share locking & yield engine
- [x] **PB-01** — Migration `0020_share_locks_yield`: `share_locks`, `yield_accruals`, `yield_payments`
- [x] **PB-02** — `POST /v1/locks` (validates free shares; rate+principal snapshotted at lock time; accrual from day 1) + tests
- [x] **PB-03** — `POST /v1/locks/:id/unlock-request` (accrual cutoff at request ts; final payout settles immediately) + tests
- [x] **PB-04** — Unlock maturation via engine tick (`matureDueLocks`, `UNLOCK_MATURATION_MS` default 3d) + tests
- [x] **PB-05** — Yield engine (BullMQ `digihouse-yield` queue, `YIELD_WORKER_ENABLED`): daily idempotent accrual rows with exact per-period distribution (monthly = principal × rate / 30d; weekly = (rate−1pp)/4, 4 weekly payouts); pays through withdrawable balance + ledger; paid accrued-up-to-unlock-request + 21 unit tests
- [x] **PB-06** — `GET /v1/earnings` v2: additive `yield` block (active locks, accrued unpaid, monthly/weekly projections, payments) + tests
- [x] **PB-07** — `GET /v1/me/summary`: dual balances, locked/free shares, current-month yield + tests
- [x] **PB-08** — Frontend: Property page — `YieldLockSection` (rate badge, position split, lock sheet with monthly↔weekly live comparison, per-lock unlock request) — design-system exact
- [x] **PB-09** — Frontend: Portfolio — locked/free stats in summary + `N locked` pill per holding
- [x] **PB-10** — Frontend: Earnings — `YieldSummaryCard` (monthly vs weekly comparison, accrued unpaid, payment rows)
- [x] **PB-11** — Telegram notifications: yield paid (scheduled/final), unlock requested, shares matured (`NOTIFY_YIELD`)

**Phase B gate:** full flow buy → lock → accrue → unlock request (yield stops) → matured → sellable, e2e-tested.

### Phase C — Selling (primary phase)
- [x] **PC-01** — Migration `0022_phase_c_selling`: `orders` gain `queued` status; `instant_sells` table; `transactions.fee_usd`
- [x] **PC-02** — `POST /v1/sells/instant` + `settleInstantSell` service (funding-only, list price − 7% flat, race-safe supply return via guarded `tryDecrementSharesSold`, net → investing balance, ledger row with fee) + 6 unit tests + 3 route tests
- [x] **PC-03** — Custom sell via `POST /v1/orders`: sell on `funding` → status `queued` (excluded from the book, shares escrowed); buy on `funding` → 409 `invalid_phase` (primary buys go through `/v1/buys`); free-shares validation = owned − locked − active-order escrow + tests
- [x] **PC-04** — Order Activation Trigger inside `settleVerifiedBuy`: on sellout → one-way `markSoldOut` (funding/funded → resale) + atomic `activateQueuedForProperty` (single guarded UPDATE, idempotent); instant-sell bounce-back can never re-queue + tests
- [x] **PC-05** — One-way invariants enforced at service level: `tryDecrementSharesSold` only in `funding` and never below 0; `markSoldOut` never leaves `resale`; instant sell 409s on resale/funded
- [x] **PC-06** — Frontend: `SellSheet` on Property page (Instant mode: −7% breakdown, net, funding-only guard; Custom mode: price input, queued notice "goes live when the primary sells out"), Sell button in the yield section, `Queued` pill on portfolio open orders; mock + http repos, `useInstantSell`/`usePlaceOrder`
- [x] **PC-07** — Telegram notifications: instant sell settled (amount + fee credited), sell order queued, queued orders activated on sellout

**Phase C gate:** instant sell returns shares to primary and never breaks order activation; queued→active is atomic.

### Phase D — Secondary market order book
- [x] **PD-01** — Migration `0023_phase_d_matching`: `orders.escrowed_usd` (buy orders hold notional + tier fee), `orders.is_house_account`, `trades` fill ledger. Buy escrow debited on placement, refunded on cancel/terminal. Tests: place → balance drops; cancel → refund.
- [x] **PD-02** — Matching engine: pure `match-engine.ts` (price-time priority, partial fills, maker-price execution, self-trade + house-vs-house prevention) + `settle-matches.ts` persistence (atomic share/money settlement, tier fees both sides, replay-proof trade key, per-property mutex). 16 unit + route tests.
- [x] **PD-03** — House-account orders: `is_house_account` flag + never self-matched (engine + DB CHECK). Seeding of book liquidity is admin work → PE-06.
- [x] **PD-04** — `GET /v1/properties/:id/order-book` v2 (aggregated depth + `lastTradeUsd`) + `GET /v1/properties/:id/trades`; marketplace listings carry `lastTradeUsd` (PD-07). Tests.
- [x] **PD-05** — SSE endpoint `GET /v1/properties/:id/order-book/stream` (server) + frontend live mode: `useOrderBook`/`useTrades` poll every 5s (polling fallback — mock has no SSE, keeps both impls in sync).
- [x] **PD-06** — Frontend: Property page (resale/funded) — `TradeSection` with two-sided book + depth bars + last-price header, `LimitBuySheet` (fee preview + escrow total), recent trades list; sell via existing `SellSheet` custom mode. *Decision: no full price chart — last-price header + recent-trades list cover the market picture without a charting dependency (matches the handoff's PD-06 scope).*
- [x] **PD-07** — Frontend: Marketplace — `primary` ↔ `secondary` filter chips + `lastTradeUsd` on cards (resale cards show "Last price" instead of the offering price). i18n ×12.
- [x] **PD-08** — Cancellation rules: cancel open AND queued; buy escrow refunded atomically (route + store) + frontend cancel button on portfolio open orders. Tests incl. partial-fill refund path.

**Phase D gate:** user-to-user trades settle atomically with correct tier fees; book survives concurrent orders.

### Phase E — Withdrawals & admin operations
- [x] **PE-01** — USDT withdrawal address management (save/change) on Settings + `POST /v1/me/withdrawal-address` + tests. *Address lives on `users` (`withdrawal_address` + verified flag); format validated via `@ton/core` `Address.parse`; any change resets the verified flag — admin verification ships with the PE-03 queue.*
- [x] **PE-02** — `POST /v1/withdrawals` (from withdrawable balance only) + `GET /v1/withdrawals` + tests. *Atomic debit at request time; refund-on-reject implemented + tested in the service (admin routes land with PE-03); ledger `transactions` row (kind `withdraw`) written per request.*
- [x] **PE-03** — Admin withdrawal queue: list/filter/approve/reject/mark-paid (manual USDT fulfillment) + tests. *Transitions are guarded single-statement updates (race-safe — reject refunds exactly once); mark-paid flips the ledger row to success with the tx hash; audit `admin.withdraw.*` + fail-open Telegram notify on each transition.*
- [x] **PE-04** — Admin: manual yield payout flow (`POST /v1/admin/yield/payout`, scoped to one user or all) + tests. *Runs the same engine math as the worker (`tickYieldAccrual` + `tickYieldPayouts`) — no duplicated math; idempotent (payment insert is the claim); audit `admin.yield_payout`.*
- [x] **PE-05** — Seed 6 primary + 18 secondary properties with yield rates per §0.7 (API `properties-data.ts` + mock `properties.ts` mirror). *18 new listings generated with the §0.4a consistency chain (totalValue > offered, price $80–150, rate by yearBuilt, annualRent = offered × rate × 12) and gated by new integrity tests.*
- [x] **PE-06** — Admin: house-account order seeding for secondary books. *`POST /v1/admin/properties/:id/house-orders/seed` places a two-sided house book around the reference price (last trade, else offering price) — `levels` bids below + `levels` asks above at `spreadPct` steps, each `qtyPerLevel` shares, all `is_house_account` (never self-matched); runs matching after each so it can take liquidity; audit `admin.house_order_seed`. The single-order `house-orders` endpoint was refactored onto the shared `placeHouseOrder` helper.*
- [x] **PE-07** — Admin: unlock approval / maturation controls (2–3 day window). *`POST /v1/admin/locks/mature` runs the same `matureDueLocks` engine pass the worker uses (matures only `unlock_requested` locks past the window, idempotent, audit `admin.lock_mature`); `POST /v1/admin/locks/:id/mature` force-matures a single lock bypassing the window (edge-case recovery, guarded `markMatured`, audit `admin.lock_mature_manual`, fail-open notify). `unlockMaturationMs` threaded into admin deps.*
- [x] **PE-08** — Frontend: Settings — withdrawal address, withdrawal requests + status. *Withdrawal address block (PE-01, edit + verified pill) and the request list with StatusPill per state were already in place; this adds the missing **request form** — `WithdrawalRequestSheet` (withdrawable balance from `useMeSummary`, whole-dollar amount + Max, client-side validation, `useRequestWithdrawal` mutation, no-address gate) opened from a “Request withdrawal” row in `WithdrawalRequestsSection`. i18n ×12.*
- [x] **PE-09** — Frontend: Transactions — new kinds (instant_sell, secondary trades, yield monthly/weekly, withdrawal) with fee lines + filters. *Ledger `kind` expanded (migration 0026) to `instant_sell`/`trade_buy`/`trade_sell`/`yield_monthly`/`yield_weekly`; write paths (instant sell, matching, yield engine) updated so the page renders distinct kinds + `feeUsd` fee lines + filter chips without heuristics. Legacy `sell`/`earnings` retained for pre-existing rows and folded into the trade/yield filters.*

**Phase E gate:** withdrawal round-trip and manual yield payout work end-to-end via admin API.

### Phase F — Hardening & launch
- [ ] **PF-01** — E2E: buy primary → lock → weekly yield → unlock request → matured → instant sell → shares back to primary
- [ ] **PF-02** — E2E: buy primary → custom sell (queued) → primary sells out → order active → user-to-user match → withdrawal
- [ ] **PF-03** — Audit events for every state change (locks, unlocks, instant sells, order activation, matches, withdrawals)
- [ ] **PF-04** — Concurrency/oversell tests (primary buy, matching engine, escrow refunds)
- [ ] **PF-05** — Ops: monitoring/alerting on settlement & yield jobs; runbook updates
- [ ] **PF-06** — Demo/staging runbook refresh; launch review (go/no-go); allowlist launch

**Phase F gate:** both E2E money paths green on staging; launch checklist signed off.

---

## Status

- **Current phase:** Phase F — Hardening & launch (Phase E complete)
- **Last completed:** PE-09 (Transactions kinds + fee lines + filters) — 2026-08-17
- **Next recommended:** PF-01
