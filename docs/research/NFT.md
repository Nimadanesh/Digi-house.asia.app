# Collectible Position NFT — Architecture & Operations

**Status:** implemented (simulated path) · testnet-ready (TON path, requires your credentials)

The NFT is a **collectible / receipt representation of a user holding** — nothing more.

> **DB source-of-truth rule (locked):** the `holdings` table is the 100% source of truth for
> ownership, yield, buying/selling, the secondary market, withdrawals, balances, accounting
> and settlement. The NFT must NEVER become the source of truth for any of these. The NFT
> contains no financial logic and its mint/transfer can never block, roll back, or affect a
> purchase. **1 holding → max 1 NFT** (enforced by `UNIQUE(holding_key)` and
> `UNIQUE(user_id, property_id)` in `holding_nfts`).

---

## 1. Architecture

```
BUY SETTLEMENT SUCCESS (settle-verified-buy.ts)
   │  holdings.upsert(...)          ← DB = source of truth, unchanged
   ▼
requestNftForHolding()  (best-effort, fire-and-forget, never throws into the buy)
   │  insert holding_nfts row (status pending, wallet = verified payer wallet)
   │  enqueue BullMQ job `mintNft`  (digihouse-nfts queue)
   ▼
nft worker (worker.ts / nft/worker.ts)
   pending → minting → minted → transferring → delivered
   │  any failure → failed (retryable via admin) — the holding is untouched
   ▼
User's wallet shows:  FractionalLuxe — Villa A · 100 Shares · (display only)
```

Components:

| Piece | File(s) |
|---|---|
| Migration + schema | `apps/api/drizzle/0029_holding_nfts.sql`, `apps/api/src/db/schema/holding-nfts.ts` |
| Store (guarded transitions) | `apps/api/src/nft/nft-store.ts` |
| Metadata builder (deterministic, PII-free) | `apps/api/src/nft/metadata.ts` |
| Minter seam (simulated + TON) | `apps/api/src/nft/minter.ts` |
| Settlement hook | `apps/api/src/nft/request.ts` + `settle-verified-buy.ts` |
| Worker (job + recovery sweep) | `apps/api/src/nft/worker.ts` + `worker.ts` |
| API (user + public metadata) | `apps/api/src/routes/nfts.ts` |
| Admin (queue / retry / sweep) | `apps/api/src/routes/admin.ts` |
| Web (portfolio badge + detail block) | `src/types/nft.ts`, `src/hooks/useNfts.ts`, `src/lib/mock/nfts.ts`, portfolio components |

## 2. Lifecycle

`pending → minting → minted → transferring → delivered`, plus `failed` (retryable).

- **pending** — record created at settlement; job enqueued (or waiting for the recovery sweep).
- **minting** — a worker claimed the record (guarded single-statement claim; duplicate workers no-op).
- **minted** — `deploy_item` sent; record stores `nft_item_id`, `nft_address`, `mint_tx_hash`, `metadata_url`.
- **transferring** — worker relayed the standard NFT `transfer` (op 0x5fcc3d14) to the user's wallet.
- **delivered** — record stores `transfer_tx_hash`. Wallet shows the NFT.
- **failed** — stores a sanitized `error_code`/`error_message`; retryable via admin.

Every transition is a guarded `UPDATE … WHERE status = <expected>` — duplicate jobs, duplicate
settlement events, and worker restarts can never double-mint or double-deliver.

## 3. Wallet requirements (delivery destination)

The NFT is delivered to **the wallet verified with the successful payment** — `buy_intents.paid_by_wallet`
(snapshot at prepare from the authenticated session's bound wallet). If that is null, it falls back to the
user's current `users.wallet_address` at settlement time. The address is **snapshotted** on the NFT record;
a later wallet change does not re-route (deliberate: the verified payer wallet is the receipt's destination).

**Existing wallet-binding/security model is unchanged.** A connected wallet never proves permanent
ownership of the Telegram user; the server-side session is the auth boundary, exactly as before.
A server-side wallet-binding hardening for NFT delivery is a future item (see §10).

## 4. Minter configuration

Two modes via `NFT_MINTER_MODE`:

- **`simulated`** (default) — no blockchain interaction. Produces synthetic ids/hashes so the full
  lifecycle, UI and tests work end-to-end. **SIMULATED** — never claim these are real on-chain NFTs.
- **`ton`** — real TON **testnet** minting. Requires your credentials (see §5). When required env is
  missing, `createTonNftMinter` returns `null` and records fail cleanly with
  `minter_not_configured` (retryable once configured). We never guess credentials.

Minted item addresses are serialized with the **testOnly flag matching the configured network**
(`NFT_NETWORK`, default `testnet`) — a testnet NFT is never displayed as a mainnet-form friendly
address in wallets/explorers. The network config is the source of truth for serialization.

## 5. Testnet setup (REQUIRES USER CONFIGURATION — I stopped here)

To switch real minting on, you must provide (do **not** paste secrets into chat or the repo):

1. **Create a testnet minter wallet** (e.g. Tonkeeper testnet, ton.org testnet faucet). Fund it with
   testnet TON (~1 TON is plenty for a few mints).
2. **Export its 24-word mnemonic** and set `NFT_MINTER_MNEMONIC` (env only).
3. **Deploy a testnet NFT collection** (standard Getgems-style `nft_collection` with off-chain content)
   from that wallet. Set `NFT_COLLECTION_ADDRESS` to its friendly address.
4. **(Optional but recommended)** a Toncenter testnet API key → `TONCENTER_API_KEY`.
   `TONCENTER_API_URL` already defaults to `https://testnet.toncenter.com/api/v2/jsonRPC`.

Env vars (all in `.env.local` / the API's secret infra — never in the repo):

| Var | Purpose | Default |
|---|---|---|
| `NFT_WORKER_ENABLED` | Kill switch for the NFT worker | off |
| `NFT_TICK_MS` | Recovery sweep cadence | 60 000 |
| `NFT_MINTER_MODE` | `simulated` \| `ton` | `simulated` |
| `NFT_NETWORK` | Network the minter operates on — source of truth for testOnly address serialization | `testnet` |
| `NFT_MINTER_MNEMONIC` | **SECRET** — minter wallet mnemonic | — |
| `NFT_COLLECTION_ADDRESS` | Deployed testnet collection address | — |
| `TONCENTER_API_URL` | Toncenter JSON-RPC endpoint | testnet default |
| `TONCENTER_API_KEY` | Optional Toncenter key | — |
| `NFT_METADATA_BASE_URL` | Public base for metadata URLs | `http://localhost:8787` |
| `NFT_JOB_ATTEMPTS` | BullMQ mint attempts (backoff) | 3 |
| `NFT_STALE_PENDING_MS` | Pending records older than this are re-enqueued | 5 min |
| `NFT_STALE_ACTIVE_MS` | Stuck minting/transferring older than this → failed(timeout) | 30 min |

**Secret handling:** the mnemonic exists only in env; it is never logged, never stored in the DB,
never committed. Audit/log payloads carry the NFT id and addresses, not credentials.

## 6. Retry & failure behavior

- **Transient failure** (RPC timeout, socket error) on a non-final attempt → the claim is released
  (mint failure → back to `pending`; transfer failure → back to `minted`, never re-mint) and BullMQ
  retries with backoff.
- **Final attempt failure** → record `failed` with a sanitized code (`rpc_timeout`, `mint_failed`,
  `invalid_wallet`, `minter_not_configured`, `minter_insufficient_funds`, `timeout`).
- **Recovery sweep** (repeatable job + worker boot): re-enqueues stale `pending` records (API restarted
  before enqueue, lost jobs) and fails records stuck in `minting`/`transferring` past
  `NFT_STALE_ACTIVE_MS`.
- **Admin retry** — `POST /v1/admin/nfts/:id/retry` (x-admin-key): `failed → pending` + re-enqueue.
  `POST /v1/admin/nfts/sweep` runs the recovery pass on demand. No user-facing mint endpoints.
- **Purchase is never affected** — the hook is wrapped in try/catch that only logs.

### Double-mint protection on retry (check-before-mint)

The mint path is made **idempotent-as-possible without an on-chain registry**:

1. **Before broadcasting**, the worker persists the *expected* on-chain facts (`nft_item_id` +
   `mint_tx_hash`) via `persistMintExpectation` while the record is still `minting`. If that write
   fails, the mint **aborts — nothing is sent**.
2. **On every (re)run** where a record carries persisted mint facts, the worker queries the item's
   `get_nft_data` on-chain (`itemStatus`):
   - **Item exists** → the previous mint landed (crash after broadcast but before `markMinted`, or a
     retried transfer failure) → the record **adopts** the existing item (`nft.mint_recovered` audit)
     and skips minting — **no second NFT**.
   - **Item does not exist** → the previous attempt never broadcast → mint fresh.
3. **`retry()` preserves** `nft_item_id` / `nft_address` / `mint_tx_hash` (only errors/attempts are
   reset) so the reconciliation above has the facts it needs; a transfer-failure retry therefore
   re-uses the minted item instead of minting again.

**Remaining limitation:** reconciliation relies on the *expected* facts having been persisted before
broadcast. A crash in the narrow window **between** the on-chain send and that write (or a collection
that was reset/redeployed between attempts) cannot be reconciled automatically — the record goes
`failed` and an operator verifies on-chain state before retrying. This is inherent to a stateless
collectible (no on-chain registry, by design) and cannot be fully closed without one.

## 7. Metadata

Stable URL: `{NFT_METADATA_BASE_URL}/nft-metadata/{nftId}.json` — a public, rate-limited GET
(same in-memory bucket as `/public`). Deterministic JSON: `name: "FractionalLuxe — {Property}"`,
description with the "display only / DB is the record" disclaimer, and attributes Brand / Property /
Location / Shares / Position (the **public NFT id** — never the internal user id). No Telegram id,
email, auth data, private financial figures, or keys. Movable to immutable storage later without
schema changes (the URL is stored per record).

## 8. API surface

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /v1/nfts` | session | caller's NFTs + property/holding info |
| `GET /v1/nfts/:id` | session (owner-only, 404 otherwise) | single NFT |
| `GET /nft-metadata/:id.json` | none (rate-limited) | wallet/explorer metadata |
| `GET /v1/admin/nfts` | `x-admin-key` | NFT queue + status filter |
| `POST /v1/admin/nfts/:id/retry` | `x-admin-key` | failed → pending + re-enqueue |
| `POST /v1/admin/nfts/sweep` | `x-admin-key` | run recovery sweep now |

## 9. Implementation status

| Capability | Status |
|---|---|
| DB `holding_nfts` table, 1:1 constraint, guarded transitions | **IMPLEMENTED** |
| Settlement hook (best-effort, buy never blocked) | **IMPLEMENTED** (tested) |
| Lifecycle worker + recovery sweep + idempotency | **IMPLEMENTED** (tested) |
| Double-mint protection (pre-broadcast expectation + check-before-mint reconcile) | **IMPLEMENTED** (tested) |
| Testnet-correct address serialization (`NFT_NETWORK` → testOnly) | **IMPLEMENTED** (tested) |
| Deterministic PII-free metadata + public endpoint | **IMPLEMENTED** (tested) |
| User + admin API (auth, owner-scoping, retry, sweep) | **IMPLEMENTED** (tested) |
| Web portfolio badge + detail block + disclaimer | **IMPLEMENTED** (tested) |
| Simulated minter (demo/tests) | **IMPLEMENTED** |
| TON testnet minter (standard opcodes, wallet signing) | **IMPLEMENTED — REQUIRES USER CONFIGURATION** (minter wallet + collection) |
| Explorer links | **IMPLEMENTED** (testnet tonviewer) |
| Mainnet minting | **NOT YET IMPLEMENTED** (testnet only by design) |
| Immutable metadata storage (IPFS/AR) | **NOT YET IMPLEMENTED** (URL is storage-agnostic) |
| Server-side wallet-binding hardening | **NOT YET IMPLEMENTED** (documented limitation §10) |

## 10. Known limitations

- **Partially-completed mint/transfer:** if the worker dies mid-mint, the sweep marks the record
  `failed(timeout)`; an orphan item *may* exist on-chain. The DB record is the authority for the
  user's receipt. Retry now reconciles via `itemStatus` and adopts the orphan item when it exists
  (see §6). The only unresolvable window is a crash *between* the on-chain send and the
  pre-broadcast expectation write (or a redeployed/reset collection) — operator verifies on-chain
  state before retrying. Fully closing this would require an on-chain registry, which is out of
  scope by design.
- **Wallet changes after purchase:** the NFT is delivered to the wallet verified with the payment.
  A user who changes wallets later keeps the NFT in the original wallet (the receipt's point).
- **Mainnet:** not enabled. Switch requires a mainnet collection + funded mainnet minter + explorer
  base URL config — deliberately left for the launch gate.
