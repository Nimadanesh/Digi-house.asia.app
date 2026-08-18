# RESUME — DigiHouse Product Build (Handoff Document)

> **WHO MUST READ THIS:** You are the next engineering agent continuing this repository.
> The previous agent (GLM-5.3) completed Phases A, B, and C of the product build.
> Your job: read this file top-to-bottom ONCE, then read the files it tells you to,
> then continue from **Phase D (PD-01)** in [`PRODUCT-PLAN.md`](./PRODUCT-PLAN.md).
>
> **RULE ZERO:** [`PRODUCT-PLAN.md`](./PRODUCT-PLAN.md) is the single source of truth for
> scope and progress. This file gives you the *awareness* the previous agent had.
> If this file and PRODUCT-PLAN.md ever disagree, PRODUCT-PLAN.md wins — then fix this file.

---

## 1. Project Briefing (what a human collaborator would tell you)

**Product:** DigiHouse (دیجی‌هاوس) — a Telegram Mini App (plus regular web) for **fractional
real-estate investing**. Users buy shares of rented houses, lock shares to earn monthly yield,
and trade shares on a secondary market.

**Business model — MEMORIZE THESE RULES (full spec in PRODUCT-PLAN §0):**

1. **Everything is Web2 and off-chain.** Shares, trades, yield — all database records in
   Postgres. Crypto (USDT on TON) is a **payment rail only**. There is NO on-chain share
   logic and there must never be. Never add blockchain dependencies.
2. **Two phases per property:**
   - **Primary offering** (`status = 'funding'`): fixed share price ($80–150/share by design),
     fixed share count. Users buy via `/v1/buys/*` (TON or USDT payment, verified via TonAPI).
   - **Secondary market** (`status = 'resale'`, reached when supply sells out): price discovered
     by an **order book** (user-to-user limit orders). `funding → resale` is ONE-WAY.
3. **Selling, two paths (§0.3):**
   - **Instant sell** — only while `funding`: platform buys back at list price **− 7% flat**;
     shares return to the primary supply (progress bar decreases). Implemented in Phase C.
   - **Custom-price sell** — a limit sell order. While `funding` it sits with status `queued`
     (not tradable, shares escrowed). When supply hits 0, ALL queued orders of that property
     atomically flip to `open` (Order Activation Trigger — implemented in Phase C).
4. **Yield (§0.4):** each property has a monthly rate **4.5–7.5%** (quality-driven: newer
   house → higher rate). Users **lock** shares to earn; yield accrues from day 1 of locking.
   Monthly payout = invested × rate. Weekly payout = rate − 1 percentage point, paid as
   4 weekly installments. Unlock request stops accrual immediately; shares become sellable
   after 2–3 days (`UNLOCK_MATURATION_MS`, default 3d). Accrued-unpaid is paid out on unlock.
   Example that MUST always hold: $80 share @ 6% → $4.80/mo; 10 shares ($800) → $48/mo → $576/yr.
5. **Fees (§0.5):** per-transaction 9-tier table (see `fee_tiers` / `GET /v1/fees`), plus flat
   7% instant sell. Tier bounds are INCLUSIVE; the top tier is `≥ $10M`; tier 8 max is
   `999_999_999` cents (do NOT reintroduce the 1e9 overlap bug).
6. **Money:** no buy/sell caps. Withdrawals USDT-TON only. Wallet has two balances:
   `investing` (sale proceeds, spendable) and `withdrawable` (yield + withdrawable funds).
7. **Standing rules (§0.0):** (a) every frontend element must exactly match the existing
   design system — no ad-hoc styles; (b) repo must run locally with plain npm scripts AND
   stay deployable (Vercel web + Fly.io API) with Telegram as the primary channel.

---

## 2. Read order (do this BEFORE writing any code)

| # | File | Why |
|---|---|---|
| 1 | `PRODUCT-PLAN.md` | Scope, locked business spec §0, progress checkboxes, phase gates |
| 2 | `AGENTS.md` / `CLAUDE.md` (repo root) | Repo agent rules: layering (UI→hooks→api), money=cents, honesty labels |
| 3 | `EXECUTION-PLAN.md` | Pre-product history (Phases 0–5 of the platform build) |
| 4 | This file, §3–§6 | Conventions + remaining playbook |
| 5 | `apps/api/src/app.ts` | How every route is wired (dependency-injected stores) |
| 6 | `apps/api/src/db/schema/index.ts` | All tables (18 schema files incl. index) |
| 7 | `src/lib/api/repos.ts` | Frontend repo contract — mock AND http must both implement it |
| 8 | `src/components/property/YieldLockSection.tsx` + `SellSheet.tsx` | The newest UI patterns to copy |
| 9 | `docs/adr/ADR-005*.md` | USDT off-chain settle / on-chain verify decision |

Do NOT read the whole repo up front. Read what a task needs.

---

## 3. Current state snapshot (as of handoff)

- **Done:** PRODUCT-PLAN Phases **A** (financial foundation), **B** (locks + yield engine),
  **C** (instant sell + queued custom sells + activation trigger). All boxes ticked there.
- **Next task: PD-01** (order escrow fields) → then PD-02 (matching engine) → …
- **Tests at handoff:** API **383 passing** (47 files), frontend **286 passing** (51 files),
  `tsc` clean ×3 (web/api/shared), `eslint` clean, `next build` clean. If you see fewer
  passing tests than this, something regressed — investigate before building.
- **DB migrations:** `apps/api/drizzle/*.sql` (23 files) + `meta/_journal.json` (21 entries,
  last `0022_phase_c_selling`). Migrations 0001–0018 predate the product build; 0019–0022
  are ours. Two SQL files (0014_referrals, 0015_buy_verification) are intentionally NOT in
  the journal — leave them alone (see G12).
- **Monorepo layout:** root = Next.js 16 web app (`src/`), `apps/api` = Hono API (Drizzle +
  Postgres + Redis/BullMQ), `packages/shared` = tiny shared constants.
- **Key backend modules built by us:** `src/fees/` (tier resolver), `src/money/` (atomic
  dual-balance store), `src/yield/` (locks, math, engine ticks, BullMQ queue),
  `src/sells/` (instant sell, free-shares), instant-sell/lock/sell routes, fee routes,
  `/v1/me/summary`, earnings v2 yield block, `transactions.fee_usd`.
- **Key frontend modules built by us:** `src/lib/property-yield.ts` (ALL display math),
  `src/lib/yield-math.ts`, `FeeScheduleSheet` + `FeeInfoButton`, `YieldLockSection`,
  `LockSheet`/`SellSheet`, portfolio locked/free split, earnings `YieldSummaryCard`,
  `useLocks`/`useSells`/`useFees` hooks, mock + http repos for all of the above.

---

## 4. Architecture conventions (follow EXACTLY — copy existing patterns)

### 4.1 Backend pattern (apps/api)
- **Stores, not ORMs in routes.** Every table gets a store file with an interface +
  `createDbStore(db)` + `createMemoryStore()` (for unit tests without Postgres).
  Examples to copy: `src/sells/instant-sell-store.ts`, `src/yield/lock-store.ts`.
- **Routes** (`src/routes/*.ts`): `createXRoutes(deps)` with DI, mounted in `app.ts` behind
  `if (deps needed)`. Validation → service call → map error codes to HTTP
  (400 validation, 401 via `requireSession`, 403 forbidden/allowlist, 404 not found,
  409 conflict/phase). Copy `src/routes/sells.ts` style.
- **Money = integer cents, ALWAYS.** Fees in basis points. Shares = integers. Never floats
  in DB; `bigint` columns with `{ mode: "number" }`.
- **Race safety = guarded single-statement UPDATE** with `WHERE` conditions + `.returning()`
  (see `tryIncrementSharesSold`, `tryDecrementSharesSold`, `markSoldOut`, BalanceStore.adjust).
  Never read-modify-write.
- **DB CHECK constraints are real.** Example trap: `holdings.shares_owned > 0` — when a
  holding drops to 0 shares you must DELETE the row (`holdings.delete`), not upsert 0.
- **Audit log:** every state change writes `writeAuditEvent`. New actions MUST be added to
  `src/audit/audit-actions.ts` (TS union; the DB has no CHECK on action values — only TS).
- **Idempotence:** payment/payout paths claim-then-write (unique keys like
  `transactions.buy_intent_id`, `yield_accruals(lock_id, day)`, `yield_payments(lock,period)`,
  `instant_sells.id`). Reuse this pattern for the matching engine (PD-02).
- **Notifications:** optional `notify: { botToken }` dep, enabled when
  `TELEGRAM_BOT_TOKEN` && `NOTIFY_YIELD`. ALWAYS fail-open (try/catch, never block the
  money operation). Use `sendTelegramMessage` from `src/notify/telegram-notify.ts`.
- **Workers:** BullMQ pattern in `src/yield/queue.ts` + `worker.ts` (kill-switch env flag,
  concurrency 1, boot tick). The maturation + accrual + payout engine runs there.
- **Env:** add flags to `src/env.ts` schema AND the `.transform()` return object AND — see
  gotcha G5 — to every test `testEnv()` fixture.

### 4.2 Frontend pattern (src/)
- **Repo contract first:** new capability = add to `src/lib/api/repos.ts` → implement in
  `src/lib/api/http/http-repos.ts` → implement a mock in `src/lib/mock/*` → wire into
  `src/lib/mock/index.ts` barrel + `src/lib/api/getRepo.ts`. All four, always, so the demo
  works without a backend (`NEXT_PUBLIC_DATA_SOURCE=mock` is the default).
- **Hooks:** thin `useQuery`/`useMutation` wrappers (`staleTime: 60_000`), invalidation lists
  in mutations. Copy `src/hooks/useLocks.ts` / `useSells.ts`.
- **Money math:** NEVER compute yield/fees inline in components. Use `src/lib/property-yield.ts`
  (per-share and per-position figures) and `src/types/fees.ts` (`bpsToPct`). This is what
  keeps marketplace cards, property detail, and buy/sell sheets numerically identical.
- **Design system — non-negotiable tokens** (see `docs/research/DESIGN_SYSTEM.md`, it wins
  over everything): card = `bg-card rounded-[12px]` + `p-4`; list rows =
  `min-h-[48px] mx-4 border-t border-border first:border-t-0`; section title =
  `text-[0.9375rem] font-semibold`; mini labels = `text-[0.625rem] uppercase tracking-wide
  text-muted-foreground`; ALL money gets `.tnum` + `usd()`; pills =
  `rounded-full px-2 py-0.5 text-xs font-medium` with `/12` tints; buttons =
  `h-[44-52px] rounded-[10-12px] bg-primary text-[0.9375rem] font-semibold` +
  `active:scale-[0.97] transition-transform duration-[120ms] ease-out`; green/red ONLY for
  finance up/down; bottom sheets = the shared `Sheet` component (portal, `labelledBy`).
  Steppers/segmented buttons: copy from `BuyQtyStep.tsx` / `SellSheet.tsx` verbatim.
- **i18n:** next-intl, catalogs `messages/<locale>.json` ×12. There is NO per-key fallback:
  any new `t()` key must be added to ALL 12 files or non-English users see raw keys.
  Inside buy/sell sheets the established convention is hardcoded English (like BuyQtyStep) —
  keep that convention rather than half-translating.
- **Tests mock hooks:** components using react-query hooks are tested with
  `vi.mock("@/hooks/useX", ...)` blocks. Copy the mock block from
  `src/components/property/PropertyDetail.test.tsx`.

---

## 5. The Rulebook — MUST / MUST-NOT (obey every one)

**MUST:**
1. Start every work session by reading the Status block + unticked boxes in PRODUCT-PLAN.md.
2. Write tests with every task (memory stores, colocated `*.test.ts`). A task without tests
   is NOT done.
3. After every task: run §6 verification pipeline, tick the PRODUCT-PLAN box, update the
   Status block (Current phase / Last completed / Next recommended).
4. Keep marketplace/detail/buy/sell numbers consistent by deriving them from
   `property-yield.ts` — never hand-compute a yield figure in a component.
5. Guard money mutations race-safely (single guarded UPDATE) and idempotently.
6. Keep both implementations (mock + http) in sync for any repo change.
7. Preserve the `funding → resale` one-way invariant and the "instant sell only in funding"
   rule in every new code path.
8. Ask the PRODUCT-PLAN gate question before declaring a phase done.

**MUST-NOT:**
1. No on-chain logic, no new TON contract work, no fiat rails. USDT-TON payment only.
2. No floats for money. No ad-hoc CSS that deviates from §4.2 tokens.
3. Never modify applied migrations. Always add a new numbered one + journal entry.
4. Never let notifications break a money operation (fail-open only).
5. Never skip the frontend mock implementation — local-first is a standing rule (§0.0).
6. Never weaken or delete existing tests to make yours pass. If a product rule changed an
   old expectation, update the old test AND leave a one-line comment saying why.
7. Never add a DB column without checking how existing rows are backfilled (see 0021 style).

---

## 6. Verification pipeline (run after EVERY task — non-negotiable)

From repo root (`miniApp/`):

```bash
npm run typecheck            # web tsc
npm run typecheck:api        # api tsc   (vitest does NOT typecheck — see G2)
npm run typecheck:shared
npm run lint                 # eslint, must be clean (warnings count as failures)
npm test                     # frontend vitest — must be all green
npm run test -w @digihouse/api   # api vitest — must be all green
npm run build                # only before declaring a phase complete
```

**Definition of done (per task):** code + tests written; all six checks green;
PRODUCT-PLAN box ticked; Status block updated. **Definition of done (per phase):**
all boxes ticked + the phase gate sentence satisfied + `next build` green.

---

## 7. Gotchas the previous agent already paid for (do NOT re-pay)

- **G1 — CRLF:** most repo files have Windows CRLF line endings. When patching with
  Python/scripts, load with `newline=""`, normalize `raw.replace("\r\n","\n")`, patch with
  `\n` anchors, then write back with `\r\n`. String replaces that "silently did nothing"
  were almost always CRLF mismatches.
- **G2 — vitest ≠ typecheck:** vitest (esbuild) strips types without checking. Tests can be
  green while `tsc` fails. ALWAYS run both.
- **G3 — drizzle journal:** migrations are hand-written SQL + a hand-edited
  `meta/_journal.json` entry `{idx, version:"7", when:<ms>, tag, breakpoints:true}`.
  Edit the journal with a JSON parser, not string replace (CRLF). Keep `when` increasing.
- **G4 — shared rate limiter:** `slidingWindowRateLimit` keeps MODULE-level state shared by
  all tests in a file — the 10th request 429s. Inject `rateLimiter: async (_c, next) => next()`
  in route deps when testing (see `src/routes/sells.test.ts`).
- **G5 — env fixtures:** adding an env var means adding it to ~11 `testEnv()` objects in API
  test files or every `createApp` test fails typecheck. Grep for `ALLOWLIST_WALLETS: undefined,`
  to find them all.
- **G6 — i18n count:** new keys go into ALL 12 `messages/*.json` (script it with Python +
  `json.dump(ensure_ascii=False, indent=2)`).
- **G7 — fee tier boundary:** tier 8 upper bound is `999_999_999` cents; tier 9 starts at
  `1_000_000_000` and is unbounded. Bounds are inclusive. Don't reintroduce overlap.
- **G8 — `funded` status:** legacy sold-out properties may still have `status='funded'`.
  Treat `funded` like `resale` for ORDER purposes (book open, sells go straight to `open`),
  but like sold-out for BUYS via `/v1/buys` (rejected — not `funding`). `markSoldOut`
  transitions funding/funded → resale.
- **G9 — audit list order:** `audit.listByResource` returns newest-first.
- **G10 — QueryClient in tests:** any component calling react-query hooks needs a provider
  or a `vi.mock` of the hook module in tests. For always-mounted-but-rarely-open sheets,
  defer data-fetching hooks into a child rendered only when open (pattern:
  `FeeScheduleSheet`'s `FeesContent`).
- **G11 — Holdings CHECK:** `holdings.shares_owned > 0` — zero-share holdings must be
  deleted (`holdings.delete`), never upserted with 0.
- **G12 — migration journal history quirks:** entries 0008 (duplicate) and a stray trailing
  brace were repaired at 0019-time; there are also two SQL files (0014_referrals,
  0015_buy_verification) intentionally absent from the journal. Leave them alone.

---

## 8. Playbook — remaining work, task by task

> For each task: WHAT (from PRODUCT-PLAN) + HOW (files, patterns, traps).
> Effort estimates assume you follow the patterns; do tasks in order within a phase.

### Phase D — Secondary market order book (YOU START HERE: PD-01)

**State at handoff:** the book exists read-only (`build-order-book.ts` aggregates `open`
orders); orders are placed/cancelled but NEVER matched; no escrow columns; no trades.
Phase C added `queued` status + activation. `funded`/`resale` properties accept orders.

- **PD-01 — Order escrow fields (migration 0023).** Add columns to `orders` (or a sibling
  `order_escrows` table — prefer columns: `escrowed_usd bigint` for buys, sells escrow
  shares implicitly). Decide the model: a BUY order must escrow money (debit user
  `investing` balance on placement, refund on cancel/expiry); a SELL order escrows shares
  (already validated logically via `sumActiveSellShares` — keep that, matching will move
  shares atomically). Update schema ts + stores + journal entry (G3). Tests: place →
  balance drops; cancel → refund.
- **PD-02 — Matching engine.** New `src/orders/match-engine.ts`: pure function
  `match(openOrders, incomingOrder) → trades[]` (price-time priority, partial fills)
  + a service that persists: for each trade, move shares (seller holding − , buyer holding +),
  move money (buyer escrow → seller investing minus sell fee, buyer pays buy fee from escrow),
  write `transactions` rows with `fee_usd` (tier fees via `resolveFee`, op =
  buy_secondary/sell_secondary), update `filledQuantity`/status, mark best prices. Run it
  after every order placement on `resale` properties. Idempotence: unique trade id per
  (maker order id, taker order id, fill index). Concurrency: the whole settle of one match
  round must be sequential per property (BullMQ worker or in-process mutex per propertyId;
  simplest correct: run matching inside a single serialised code path per property).
  This is the hardest task in the project — write the pure matcher FIRST with exhaustive
  unit tests (crossing, partial, self-trade prevention, price-time order), then the
  persistence service.
- **PD-03 — House account.** Add `is_house_account boolean` to orders (migration with
  PD-01's). House orders are seeded by admin (PE-06) to provide book liquidity. Rules:
  never self-match two house orders; house fills still write ledger rows but the
  `userId` is the configured house user id (`HOUSE_ACCOUNT_USER_ID` env, add to env + G5).
- **PD-04 — Order book v2.** Extend `build-order-book.ts` + `GET /v1/properties/:id/order-book`:
  aggregated depth (already), `lastTradeUsd` (needs a `trades` table — create it in PD-02:
  `trades(id, property_id, price_usd, quantity, maker_order_id, taker_order_id,
  buyer_user_id, seller_user_id, fee_buyer_usd, fee_seller_usd, created_at)`), recent
  trades list endpoint `GET /v1/properties/:id/trades`.
- **PD-05 — Live updates.** SSE endpoint (`GET /v1/properties/:id/order-book/stream`) or
  polling with `staleTime: 5_000`. SSE on Hono is straightforward (`streamSSE`). Frontend:
  `useOrderBook` gains live mode; invalidate on placement. Keep polling fallback.
- **PD-06 — Property page (resale state) UI.** Two-sided book (bids DESC green / asks ASC
  red, existing `OrderBook.tsx` is the base — extend with depth bars `bg-success/10` /
  `bg-danger/10`), limit buy form + limit sell form (reuse SellSheet's custom mode patterns),
  recent trades list. All numbers via `usd()` + `.tnum`. Fee preview via `useFees`.
- **PD-07 — Marketplace tabs.** `funding` ↔ `resale` filter chips (filter infra already in
  `src/lib/marketplace-filter.ts`), card shows last price + progress per §0.4a.
- **PD-08 — Cancel rules.** Cancel open AND queued (already allowed), refund buy escrow
  atomically, release sell escrow (logical). Tests for partial-fill cancels (refund only
  unfilled remainder).

### Phase E — Withdrawals & admin operations

- **PE-01 — USDT withdrawal address.** Users table or new `withdrawal_addresses` table
  (address + verified flag). `POST /v1/me/withdrawal-address` + validation (TON address
  format via `@ton/core` Address.parse). Frontend: Settings section (Row pattern) — i18n ×12.
- **PE-02 — Withdrawals.** `withdrawals(id, user_id, amount_usd, address, status:
  requested|approved|rejected|paid, tx_hash, created_at)`. `POST /v1/withdrawals` debits
  `withdrawable` atomically at request time (refund on reject). `GET /v1/withdrawals` mine.
- **PE-03 — Admin withdrawal queue.** Extend `src/routes/admin.ts` (secret-header auth
  already exists): list/filter, approve/reject, mark-paid (tx_hash). Audit actions
  `admin.withdraw.*`. Notify user on each transition (fail-open).
- **PE-04 — Manual yield payout.** Admin endpoint that runs the same math as the engine
  (`tickYieldPayouts`) for one user/all — reuse the service, don't duplicate math.
- **PE-05 — Seed 6 primary + 18 secondary properties.** Extend
  `apps/api/src/db/seed/properties-data.ts` (keep the §0.4a consistency chain — every
  property: totalValue > offered, price $80–150, rate by yearBuilt, annualRent pool =
  offered × rate × 12). Mirror in `src/lib/mock/seed/properties.ts`. Script the numbers
  and sanity-check with the pattern in `src/lib/__tests__/integrity.test.ts`.
- **PE-06 — House account order seeding.** Admin endpoint or seed script placing house
  orders around last price on secondary books (is_house_account, see PD-03).
- **PE-07 — Unlock admin controls.** Admin trigger for `matureDueLocks` + per-lock manual
  mature (edge-case recovery).
- **PE-08 — Settings UI** for withdrawal address + withdrawal request list (Row/Block
  patterns, StatusPill for states).
- **PE-09 — Transactions page** new kinds: instant sell rows (exist: kind 'sell'),
  secondary trades, fee line display (`feeUsd`), withdrawal rows; filter chips.

### Phase F — Hardening & launch

- **PF-01/PF-02 — E2E paths.** Playwright (`e2e/` dir exists). Path 1: buy primary → lock →
  weekly yield tick (mock time) → unlock request → mature → instant sell → shares back.
  Path 2: buy → custom sell queued → sellout → activation → user-to-user match → withdrawal
  request → admin mark-paid.
- **PF-03 — Audit coverage.** Verify every state change emits an audit event; add missing
  ones (match settlements!). Grep `writeAuditEvent` calls vs. money paths.
- **PF-04 — Concurrency tests.** Deliberate parallel calls: oversell primary (two settles
  race), double-match, escrow refund vs. cancel race. Memory stores + Promise.all;
  assert invariants (supply bounds, balance non-negative, share conservation).
- **PF-05 — Ops.** Alerting on failed yield ticks + failed matches (BullMQ failed-job
  handler already logs; add a metric/notify). Update `docs/runbooks/`.
- **PF-06 — Launch review.** Walk `docs/ops/mainnet-checklist.md`, staging deploy
  (`docs/ops/staging-deploy.md`), demo runbook refresh, then the go/no-go.

---

## 9. Working style for this repo (read twice)

1. **One task at a time.** Read the task here + its PRODUCT-PLAN line → implement backend
   (schema → store → service → route → tests) → frontend (types → repos contract → http →
   mock → hooks → components → i18n → tests) → run §6 pipeline → tick the box.
2. **Copy, don't invent.** For every new file, find the closest existing sibling and mirror
   its structure, naming, comment style, and test layout. The codebase is intentionally
   uniform — keep it that way.
3. **If a task is ambiguous,** choose the option consistent with §1 business rules and note
   the decision in the PRODUCT-PLAN line (one sentence) rather than stopping to ask.
4. **If tests break unexpectedly,** find the WHY first (G1–G12 covers most causes) before
   changing expectations.
5. **Commit-worthy checkpoint = one ticked box.** The user reads PRODUCT-PLAN.md to know
   where things stand — keep it current after EVERY task, not at phase end.

*Handoff written by GLM-5.3 on 2026-08-16, after message #19 of the product build and the
completion of Phases A–C (A: financial foundation, B: locks & yield, C: selling).*
