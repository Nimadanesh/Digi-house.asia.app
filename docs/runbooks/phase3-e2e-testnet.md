# Phase 3 — E2E Testnet Demo Runbook

**Full on-chain loop: buy shares with real TON (testnet) and verify settlement + indexer flow.**

> This runbook covers the **Phase 3** E2E testnet verification (P3-08). It supersedes the hybrid-buy steps in the Phase 1 demo runbook for testnet environments.
> For the investor/judge pitch, see [`DEMO.md`](../../DEMO.md) or [`phase3-investor-demo-script.md](./phase3-investor-demo-script.md).

---

## 1. Purpose

Phase 3 delivers the on-chain settlement ladder (mock → hybrid → onchain) and a real testnet buy loop. This runbook verifies:

- **TonConnect** connects to testnet wallet
- **Buy flow** sends a real testnet TON transfer
- **Indexer** watches for the jetton-transfer event and updates holdings
- **Earnings** show `paid` entries with a real (non-simulated) explorer link
- **Honesty badges** follow ADR-001 §4: real txHash → no simulated badge
- **Stuck-buy recovery** is documented (see [`stuck-pending-buy.md`](./stuck-pending-buy.md))

---

## 2. Prerequisites Checklist

### API

- [ ] API deployed with indexer worker: `INDEXER_ENABLED=true`, `INDEXER_POLL_MS=5000`
- [ ] `TON_API_URL` and `TON_API_KEY` set (TonCenter or equivalent testnet endpoint)
- [ ] Database migrated (includes `0010_indexer.sql`)
- [ ] Database seeded (≥1 funding property with `ownerWalletAddress` pointing to a testnet wallet)
- [ ] `NEXT_PUBLIC_TON_NETWORK=testnet` on both API and Mini App
- [ ] Payout worker enabled: `PAYOUT_WORKER_ENABLED=true`
- [ ] Indexer health: `GET /v1/admin/indexer/status` returns 200 with cursor info

### Mini App

- [ ] Mini App deployed with `NEXT_PUBLIC_DATA_SOURCE=api`
- [ ] TonConnect manifest points to testnet (`.env`: `NEXT_PUBLIC_TON_NETWORK=testnet`)
- [ ] `npm run check` green on latest commit

### Wallet (testnet)

- [ ] Tonkeeper (or compatible testnet wallet) installed
- [ ] Wallet configured for testnet (Settings → Network → Testnet)
- [ ] Testnet TON obtained from [@testgiver_ton_bot](https://t.me/testgiver_ton_bot) or [ton.org/testnet](https://ton.org/testnet)

---

## 3. Environment

| Component | Target |
|---|---|
| API | Staging (`https://digihouse-api-staging.fly.dev`) |
| Mini App | Vercel staging → BotFather binding |
| TON Network | **testnet** (`-239`) |
| Explorer | `https://testnet.tonviewer.com` |

```bash
# Verify API health + settlement mode
curl -sS https://digihouse-api-staging.fly.dev/healthz | jq .settlement_mode
# Expected: "hybrid" or "onchain" (not "mock" for real testnet loop)
```

---

## 4. Walkthrough Script

| # | Step | What to verify | Req / ADR |
|---|---|---|---|
| 1 | **Open TMA in Telegram** | App loads with Telegram theme. Telegram header visible. | R-9.1 |
| 2 | **Connect testnet wallet** | TonConnect sheet opens. Pick Tonkeeper (testnet). Address appears in header. | R-2.1 |
| 3 | **Browse marketplace** | ≥1 `funding` property visible. Card shows weekly yield per share. | R-4.1 |
| 4 | **Open property detail** | Financial block, funding bar, **Weekly Yield** block. Note: `ownerWalletAddress` shown (or hidden behind admin badge). | R-5.1 |
| 5 | **Buy shares** | Choose qty (e.g. 3). Total cost updates live. Tap **Buy** on MainButton. | R-7.1 |
| 6 | **Approve TonConnect TX** | TonConnect sheet shows amount, recipient, and TON amount. Approve in wallet. | R-7.1 |
| 7 | **Transaction pending** | Loading spinner / "Confirming…" state. Mini App polls for confirmation. | R-7.1 |
| 8 | **Transaction confirmed** | Success toast (green, haptic). Holding visible in Portfolio. | R-7.1, R-8.1 |
| 9 | **Verify indexer processed event** | Wait ≤10s. Check indexer status: last cursor increased. | P3-03 |
| 10 | **Portfolio shows updated holding** | Navigate to Portfolio tab. Holding card shows correct shares after buy. | R-8.1 |
| 11 | **Earnings — wait for payout tick** | Navigate to Earnings. Wait ≤60s for payout worker. Pending entries become **Paid**. | R-6.1, R-6.6 |
| 12 | **Earnings — no simulated badge** | Paid entry has a real txHash (not `simulated:` prefix). **No** "simulated" capsule on the row. | ADR-001 §4 |
| 13 | **Earnings — explorer link** | Expand a paid entry. Tx hash row shows a clickable link to `testnet.tonviewer.com`. Link opens correct transaction. | ADR-001 §4 |
| 14 | **Home post-payout** | Balance updated. Next payout countdown shows next Sunday. | R-3.1 |

### Headless verification (QA)

```bash
# Indexer status
curl -sS https://digihouse-api-staging.fly.dev/v1/admin/indexer/status | jq .

# Marketplace
curl -sS https://digihouse-api-staging.fly.dev/v1/marketplace | jq '. | length'

# Buy prepare (requires auth + valid body)
# curl -sS -X POST https://digihouse-api-staging.fly.dev/v1/buys/prepare \
#   -H "Authorization: Bearer <token>" \
#   -H "content-type: application/json" \
#   -d '{"propertyId":"prop-xxx","shares":3}' | jq .

# Earnings (requires auth)
# curl -sS https://digihouse-api-staging.fly.dev/v1/earnings \
#   -H "Authorization: Bearer <token>" | jq '.entries[] | {status, txHash}'
```

---

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| TonConnect shows "wrong network" | Wallet not set to testnet | Switch wallet to testnet network. |
| TX fails in wallet | Insufficient testnet TON | Use @testgiver_ton_bot to top up. |
| Buy confirm 400 | Intent expired | Refresh property page and re-submit. |
| Indexer not processing | `INDEXER_ENABLED=false` or wrong `TON_API_URL` | Set `INDEXER_ENABLED=true`. Verify `TON_API_URL` points to a testnet TonCenter endpoint. |
| Paid entry still shows "simulated" | Indexer hasn't processed yet, or db txHash is still `simulated:` | Wait for next indexer poll cycle (≤10s). Check indexer logs. |
| No explorer link on paid entry | txHash is empty or `simulated:` prefix | Verify indexer correctly wrote the real txHash. |
| Portfolio not updating after buy | Indexer handler for jetton-transfer not matching the transaction | Check indexer logs for `jetton-transfer` parse errors. Verify `ownerWalletAddress` on the property matches the recipient wallet. |
| `GET /v1/admin/indexer/status` returns 404 | Admin routes not mounted on staging | Deploy with admin routes enabled. |

---

## 6. Verifications

- [ ] Step 1–14 completed successfully
- [ ] Real (non-simulated) TON transfer executed
- [ ] Indexer picked up the event within ≤10s
- [ ] Holdings updated in Portfolio
- [ ] Earnings paid entry has real txHash with explorer link
- [ ] No `simulated:` badge on paid entries with real txHash
- [ ] Explorer link opens correct transaction on `testnet.tonviewer.com`
- [ ] Honesty helpers (`canShowExplorerLink`, `shouldShowSimulatedBadge`) return correct values for real txHash
- [ ] `npm run check` green

---

## 7. References

| Doc | Path |
|---|---|
| Stuck-buy runbook | [`./stuck-pending-buy.md`](./stuck-pending-buy.md) |
| Investor demo script | [`./phase3-investor-demo-script.md`](./phase3-investor-demo-script.md) |
| ADR-001 — Settlement modes | [`../adr/ADR-001-settlement-modes.md`](../adr/ADR-001-settlement-modes.md) |
| Indexer docs | `apps/api/src/indexer/` README |
| Phase 1 demo runbook | [`./phase1-demo.md`](./phase1-demo.md) |
