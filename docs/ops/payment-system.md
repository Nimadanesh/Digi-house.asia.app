# Payment System — Operator Guide

Operator-facing guide for the buy payment feature (native TON + USDT rails), how to test it
on testnet, how to switch networks, and what to check before enabling it on staging/mainnet.

Related docs: [`apps/api/README.md`](../../apps/api/README.md) (env table + route reference),
[`docs/ops/env-matrix.md`](./env-matrix.md), [`docs/ops/mainnet-checklist.md`](./mainnet-checklist.md),
[`DEPLOY.md`](../../DEPLOY.md) §7 (network switch).

---

## 1. Overview

A buy is four steps, identical for both rails:

1. **Prepare** — `POST /v1/buys/prepare` (Bearer). Validates property/quantity/price, computes the
   payable amount, stores an intent, and returns the exact TonConnect message to send.
   - **TON rail:** native transfer to `ADMIN_TON_WALLET_ADDRESS` for the payable nanoTON
     (`totalUsd` cents → nanoTON at `TON_USD_PRICE_CENTS`).
   - **USDT rail:** a `jetton_transfer` from the **buyer's** USDT jetton wallet (derived from the
     connected wallet via `get_wallet_address`) to `ADMIN_USDT_WALLET_ADDRESS`, for
     `totalUsd × 10⁴` base units (USDT = 6 decimals), with 0.1 TON gas.
2. **Send** — the Mini App sends the message via TonConnect and gets a real wallet-signed `txHash`.
3. **Confirm** — `POST /v1/buys/confirm` (Bearer) records the `txHash` against the intent.
   **No shares/ledger changes happen here.**
4. **Verify + settle** — `POST /v1/buys/verify-and-settle` (Bearer, polled every 3s up to ~30s)
   checks the payment on-chain (TonAPI) and only then issues shares. Already-settled intents return
   `settled` idempotently.

> `NEXT_PUBLIC_DATA_SOURCE=mock` (the Mini App default) settles optimistically in-memory and does
> **not** verify on-chain. Real, verified settlement requires `NEXT_PUBLIC_DATA_SOURCE=api`.

---

## 2. Required environment variables

All API vars are read by `apps/api/src/env.ts`. Never commit secrets — keep real values in
`apps/api/.env` (gitignored) / the deploy platform's secrets manager.

### API (`apps/api/.env`)

| Variable | Default | Required for | Notes |
|---|---|---|---|
| `ADMIN_TON_WALLET_ADDRESS` | — | TON rail | Receive wallet for native-TON buy payments. Fallback order: admin > `TON_RELAY_ADDRESS` > listing owner. Required for real (non-stub) settlement |
| `ADMIN_USDT_WALLET_ADDRESS` | — | USDT rail | Receive wallet for USDT (Jetton) buy payments. A regular TON wallet (its jetton wallet receives the USDT) |
| `USDT_JETTON_MASTER_ADDRESS` | — | USDT rail | USDT master contract. **Must match `TON_API_URL`'s network** — see §3 for addresses. A mismatched master rejects every settle (`jetton_mismatch`) |
| `TON_API_URL` | `https://testnet.tonapi.io` | both rails | On-chain lookup for verification. Mainnet: `https://tonapi.io` |
| `TON_API_KEY` | — | both rails | TonAPI key (`Authorization: Bearer`). Required on mainnet; recommended on testnet |
| `TON_USD_PRICE_CENTS` | `200` | TON rail | USD→TON rate (cents per TON) used by prepare to derive the payable nanoTON |
| `BUY_STUB_NANOTON` | `10000000` | dev only | 0.01 TON fallback **only** when `TON_USD_PRICE_CENTS` is unset |
| `BUY_INTENT_TTL_SECONDS` | `900` | both rails | Intent expiry (15 min) |
| `TON_RELAY_ADDRESS` | — | legacy | Legacy receive fallback for dev/test setups without an admin wallet |
| `DATABASE_URL` | — | both rails | Postgres — must be migrated (§4) |
| `CORS_ORIGIN` | — | both rails | Must include the Mini App origin |

### Web (`.env.local`, Vercel for staging/mainnet)

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_DATA_SOURCE` | `api` | Required for verified settlement |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8787` (dev) / staging/prod API URL | |
| `NEXT_PUBLIC_TON_NETWORK` | `testnet` | `mainnet` only post go/no-go |

---

## 3. Switching between testnet and mainnet

Everything must point at the **same network**. A testnet master against mainnet TonAPI (or vice
versa) fails every settlement.

| Setting | Testnet | Mainnet |
|---|---|---|
| `TON_API_URL` | `https://testnet.tonapi.io` | `https://tonapi.io` |
| `USDT_JETTON_MASTER_ADDRESS` | `kQDw5tNMBGsM0ZlLGhA9TSV9iX1nMLrfPZ7HnrQMBxgrAhWe` (USDTTT) | `EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs` (USDT) |
| `TON_API_KEY` | optional | **required** |
| `ADMIN_TON_WALLET_ADDRESS` | testnet wallet | mainnet wallet |
| `ADMIN_USDT_WALLET_ADDRESS` | testnet wallet | mainnet wallet |
| `NEXT_PUBLIC_TON_NETWORK` | `testnet` | `mainnet` |

Steps to switch:

1. Update the API env values above and the Mini App `NEXT_PUBLIC_TON_NETWORK`.
2. Apply migrations: `npm run db:migrate` (must include `0017_buy_payer_guard`).
3. Smoke-test a real payment on the new network before enabling for users (see §4 sequence).

---

## 4. Testing a real payment on testnet — operator sequence

1. **Start infra + DB**
   ```bash
   npm run infra:up
   npm run db:migrate
   ```
2. **Configure API env** — `apps/api/.env` with testnet values: `ADMIN_TON_WALLET_ADDRESS`,
   `ADMIN_USDT_WALLET_ADDRESS`, `USDT_JETTON_MASTER_ADDRESS` (USDTTT testnet master),
   `TON_API_URL=https://testnet.tonapi.io`. (Template: `apps/api/.env.example`.)
3. **Configure Mini App env** — `.env.local`: `NEXT_PUBLIC_DATA_SOURCE=api`,
   `NEXT_PUBLIC_API_BASE_URL=http://localhost:8787`, `NEXT_PUBLIC_TON_NETWORK=testnet`.
4. **Fund wallets with testnet assets**
   - `ADMIN_TON_WALLET_ADDRESS`: testnet TON (e.g. from a testnet faucet) so its balance visibly
     increases after a test buy.
   - Test buyer wallet: testnet TON (gas for both rails) **and** testnet USDT (USDTTT) for the
     USDT rail.
5. **Start services**
   ```bash
   npm run dev:api      # API on :8787
   npm run dev          # Mini App on :3000
   ```
6. **Test the TON rail** — open the Mini App in Telegram, connect the testnet wallet, buy shares on
   a `funding` property, pay in TON, confirm in-wallet.
7. **Test the USDT rail** — same flow, select **USDT** in the currency selector, confirm in-wallet.
8. **Verify the outcome** (see §5) via the Mini App (Portfolio / Transactions), the API
   (`GET /v1/portfolio`, `GET /v1/transactions`), and a testnet explorer using the returned `txHash`.

---

## 5. What success looks like

- `POST /v1/buys/verify-and-settle` returns `200 { status: "settled", txHash, ... }` after the
  frontend finishes polling (≤ ~30s).
- **Shares issued:** property `shares_sold` increased by the quantity; the buyer's holding exists
  in `GET /v1/portfolio` with the correct `sharesOwned` and weighted-average cost.
- **Ledger row:** `GET /v1/transactions` shows one `kind: "buy"`, `status: "success"` row with the
  real on-chain `txHash` (TON: `tonAmount`; USDT: `tokenAmount` in base units).
- **Admin wallet credited:** on-chain balance of `ADMIN_TON_WALLET_ADDRESS` (TON rail) or
  `ADMIN_USDT_WALLET_ADDRESS`'s USDT jetton wallet (USDT rail) increased by the paid amount —
  verifiable on a testnet explorer by the `txHash`.

---

## 6. Common failure reasons

Retryable statuses (`pending_confirmation`) — the frontend keeps polling:

| Reason | Meaning | Action |
|---|---|---|
| `tx_not_found` | Transaction not indexed/seen yet | Wait — retry |
| `api_unavailable` | TonAPI transport/5xx error | Wait — retry; check `TON_API_URL`/`TON_API_KEY` |

Final statuses (`verification_failed`) — shares are **not** issued; user sees a friendly message:

| Reason | Meaning | Action |
|---|---|---|
| `tx_failed` | Transaction bounced/aborted on-chain | Investigate the tx on-chain |
| `tx_too_old` | Payment older than the 30-min window | User must start a fresh buy |
| `destination_mismatch` | TON funds went to a different address than prepare returned | Check admin address config |
| `amount_insufficient` | Paid less than the expected amount | Check rate / qty mismatch |
| `payer_mismatch` | Transaction did not originate from the connected (session) wallet | User must pay from the connected wallet |
| `no_jetton_transfer` | No JettonTransfer action in the event trace | Verify it was a USDT transfer |
| `jetton_mismatch` | Token sent is not the configured USDT master | Fix `USDT_JETTON_MASTER_ADDRESS` (network mismatch!) |
| `recipient_mismatch` | USDT did not reach the expected admin wallet | Check `ADMIN_USDT_WALLET_ADDRESS` |

HTTP-level errors (not verification):

| Code | Status | Meaning |
|---|---|---|
| `tx_hash_reused` | 409 | The `txHash` was already consumed by another intent (replay guard) |
| `not_confirmed` | 409 | Intent not confirmed yet |
| `no_tx_hash` | 409 | Intent has no recorded payment |
| `verification_unconfigured` | 409 | Missing destination / amount / jetton config on the intent or env |
| `payment_method_unavailable` | 409 | USDT rail not configured or no wallet connected |
| `sale_paused` / `validation_error` / `not_found` | 409 / 400 / 404 | Listing or intent-level validation |

---

## 7. Security notes

- **Double-settlement protection.** Settling atomically claims the intent `confirmed → settled`
  (`markSettled`) before any write; `transactions.buy_intent_id` is UNIQUE, so a second ledger row
  for the same intent fails.
- **Replay protection.** A wallet-signed `txHash` may be consumed by **at most one** intent. Both
  `confirm` and `verify-and-settle` reject a hash already used by another intent
  (`409 tx_hash_reused`), backed by a partial unique index on `buy_intents.tx_hash`
  (migration `0017_buy_payer_guard`).
- **Payer check.** The connected wallet is frozen on the intent at prepare
  (`buy_intents.paid_by_wallet`). TON verification requires the transaction to originate from that
  account; USDT verification requires the transfer to originate from that owner's jetton wallet
  (`get_wallet_address`). Otherwise `verification_failed (payer_mismatch)`.
- **Immutable expectations.** Expected amount and destination are written only at prepare;
  `confirm` accepts only `boc` + `txHash` and cannot alter them.
- **Recency.** Payments older than 30 minutes are rejected (`tx_too_old`).
- **Network consistency.** `USDT_JETTON_MASTER_ADDRESS` must match `TON_API_URL`'s network, or every
  USDT settlement fails closed (`jetton_mismatch`).

---

## 8. Payment System Readiness Checklist

Operator checks before, during, and after enabling the payment system on staging/mainnet.

- [ ] Environment variables set — `ADMIN_TON_WALLET_ADDRESS`, `ADMIN_USDT_WALLET_ADDRESS`,
      `USDT_JETTON_MASTER_ADDRESS`, `TON_API_URL`, `TON_API_KEY`, `TON_USD_PRICE_CENTS` (see §2)
- [ ] `NEXT_PUBLIC_DATA_SOURCE=api` + `NEXT_PUBLIC_API_BASE_URL` set on the Mini App
- [ ] `USDT_JETTON_MASTER_ADDRESS` matches the network of `TON_API_URL`
- [ ] Database migrations applied (`npm run db:migrate` incl. `0017_buy_payer_guard`)
- [ ] Admin TON/USDT receive wallets funded and reachable
- [ ] **Testnet TON payment succeeds end-to-end** (settled, holding + ledger row, admin balance up)
- [ ] **Testnet USDT payment succeeds end-to-end** (settled, `tokenAmount` ledger row, admin balance up)
- [ ] **Replay protection verified** — reusing a settled intent's `txHash` on a new confirm returns
      `409 tx_hash_reused`
- [ ] **Payer-mismatch protection verified** — paying from a wallet other than the connected one
      returns `verification_failed (payer_mismatch)`
- [ ] **Double-settlement verified** — calling `verify-and-settle` twice issues shares only once
- [ ] Frontend currency selector (TON/USDT) works and error messages are shown (e.g.
      `verification_failed`, USDT-unavailable fallback, timeout copy)
- [ ] **Ready for staging / mainnet:** yes/no — blockers listed below

Remaining blockers (as of this writing):
- Mainnet is gated by the legal / go-no-go review in `docs/ops/mainnet-checklist.md` and
  `docs/ops/mainnet-go-no-go.md` — do not enable `SETTLEMENT_MODE=onchain` or mainnet URLs before
  sign-off.
- Known limitation: in a rare concurrent-oversell race, `markSettled` can claim before
  `tryIncrementSharesSold` fails — the intent would be marked settled without shares. It fails
  loudly (logged `buy.settle.failed`, HTTP 409) but a cross-store DB transaction is the eventual fix.
