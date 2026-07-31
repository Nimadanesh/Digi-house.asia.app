# Allowlist Launch — DigiHouse

> **P5-09:** Server-enforced wallet allowlist for buys and order placement.
> Default: `LAUNCH_MODE=allowlist` with an empty allowlist → **all buys/orders denied** (fail closed).
> Flip to `LAUNCH_MODE=open` to remove the gate entirely.

---

## 1. How it works

| Env var | Values | Default | Effect |
|---|---|---|---|
| `LAUNCH_MODE` | `allowlist` \| `open` | `allowlist` | `allowlist` → only wallets in `ALLOWLIST_WALLETS` can prepare/confirm buys and place orders. `open` → skip check. |
| `ALLOWLIST_WALLETS` | Comma-separated TON user-friendly addresses | unset (empty) | Case-insensitive. Empty set + `allowlist` = all denied. |

**Gated routes:**
- `POST /v1/buys/prepare` — 403 if wallet not allowlisted
- `POST /v1/buys/confirm` — 403 if wallet not allowlisted
- `POST /v1/orders` — 403 if wallet not allowlisted
- `DELETE /v1/orders/:id` — **not gated** (cancelling own order is allowed)

**Error code:** `launch_not_allowlisted` (403)

**Read routes** (marketplace, portfolio, earnings, order-book get) are **never** gated.

---

## 2. Configuration

### 2.1 Setting the allowlist

```bash
# Fly.io staging example:
fly secrets set \
  LAUNCH_MODE=allowlist \
  ALLOWLIST_WALLETS="EQD123...,EQC456...,EQD789..."

# Local dev (.env):
LAUNCH_MODE=allowlist
ALLOWLIST_WALLETS=EQD123...,EQC456...,EQD789...
```

### 2.2 Adding a wallet

1. Get the user's TON wallet address (user-friendly form, e.g. `EQD...`)
2. Append it to the existing `ALLOWLIST_WALLETS` value, comma-separated
3. Deploy the new secret:

```bash
fly secrets set ALLOWLIST_WALLETS="<existing>,<new-wallet>"
```

**Emergency add:** If you don't have the current comma-separated list, first read it from the secrets manager UI, then append the new wallet.

### 2.3 Removing a wallet

1. Remove the wallet address from the comma-separated list
2. Deploy

### 2.4 Flipping to open mode

When the allowlist period is over and the app is ready for open access:

```bash
fly secrets set LAUNCH_MODE=open
```

No need to clear `ALLOWLIST_WALLETS` — it is ignored in `open` mode.

### 2.5 Emergency re-enable allowlist

If a vulnerability is discovered post-launch and buys/orders need immediate restriction:

```bash
fly secrets set LAUNCH_MODE=allowlist ALLOWLIST_WALLETS="<emergency-ops-wallet>"
```

Only wallets in the new allowlist can transact. Existing intents expire per their TTL.

---

## 3. Fail-closed behavior

| Condition | Effect |
|---|---|
| `LAUNCH_MODE=allowlist` + `ALLOWLIST_WALLETS` unset | **All buys/orders denied.** Empty allowlist = no one can transact. |
| `LAUNCH_MODE=allowlist` + wallet not in list | 403 with code `launch_not_allowlisted` |
| User has no wallet connected (`walletAddress` is null) | 403 (wallet is empty string, not in allowlist) |

The API always checks the **wallet address** from the user's profile (set when they connect TonConnect). If the user has not connected a wallet, they are automatically denied regardless of allowlist contents.

---

## 4. Mini App behavior

The Mini App's `ApiError` class (in `src/lib/api/http/client.ts`) captures the error code from the API response. When a 403 with code `launch_not_allowlisted` is returned:

1. The mutation (`useBuyShares`, `useOrderBook.placeOrder`) fails with `ApiError`
2. The page component shows a toast with the error message
3. The `useAllowlistError` hook (if used) maps the code to a user-facing string

Components **never** call the allowlist check directly — they react to the mutation error.

---

## 5. API env table additions

| Variable | S/P | Scope | dev | staging | prod | Notes |
|---|---|---|---|---|---|---|
| `LAUNCH_MODE` | P* | api | `allowlist` (empty list → fail closed) | `allowlist` | `allowlist` (initial) → `open` after P5-10 | *not a secret; still server-owned |
| `ALLOWLIST_WALLETS` | P | api | unset (empty) | comma-separated test wallets | comma-separated launch wallets | Wallet addresses are public, not secrets |

---

**P5-09 deliverable.** Next: P5-10 — on-call week.
