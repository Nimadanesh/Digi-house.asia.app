# Phase 3 — Investor Demo Script

**60-second live pitch of fractional real estate on TON with on-chain settlement (testnet).**

> This script is designed for a live demo to investors, judges, or partners. It assumes the app is already deployed and the wallet is pre-connected on a testnet device.
> For the full E2E testnet walkthrough, see [`phase3-e2e-testnet.md`](./phase3-e2e-testnet.md).

---

## Setup (pre-demo checklist)

- [ ] Device has Tonkeeper (testnet) installed with testnet TON balance
- [ ] Wallet is pre-authorized for the Mini App
- [ ] Mini App open at the Home screen
- [ ] A `funding` property is visible in the Marketplace
- [ ] Payout tick is imminent (<30s away) or already triggered
- [ ] API + indexer healthy (run `curl <api>/healthz` and `curl <api>/v1/admin/indexer/status`)

---

## Script (60 seconds)

### 0–10s: The problem

> "Real estate is the world's largest asset class — but you need $100k+ to enter. Most people can't diversify, can't sell a bedroom, and can't earn rental income on small amounts. DigiHouse changes that."

Show the Marketplace with 6+ properties. Scroll through quickly.

### 10–20s: The product — fractional property, real yield

> "DigiHouse lets anyone buy a fraction of a rental property — starting at $5. Your share earns a proportional slice of the weekly rent. Every Friday, the payout lands in your wallet."

Tap a funding property. Show: financial block, weekly yield per share, funding bar.

> "This property costs $200k. With $25, you own 0.0125% — and you earn $5/week in rent. No mortgage, no paperwork, no management."

### 20–35s: The buy flow — real TON transfer

> "Let's buy. Choose 5 shares — cost is ~$25, or about 5 TON at testnet rates. Tap Buy."

Tap **Buy** on MainButton. Show the TonConnect sheet with the amount.

> "This is a real TON transfer — testnet now, mainnet post-MVP. Approve in your wallet."

Approve in Tonkeeper.

> "The transaction broadcasts to TON. The app waits for confirmation. This is not simulated — it's a real L1 transaction."

Wait for success toast (green, haptic).

### 35–45s: Portfolio — holding appears

> "Your holding is live. 5 shares of the Bayside Marina Penthouse. See the shares, the average cost, the projected weekly yield. You can track this anytime in the Portfolio tab."

Show Portfolio tab. Tap the holding card.

### 45–55s: Earnings — real txHash, on-chain verifiable

> "Now let's see what happens when rent gets paid."

Navigate to Earnings tab.

> "The payout worker runs every minute. When it fires, pending entries flip to Paid. And because this is a real on-chain transaction — not a simulation — there's no 'simulated' badge. Instead, you see a link to Tonviewer."

Expand a paid entry. Point to the explorer link.

> "This link goes to the live transaction on testnet.tonviewer.com. Anyone can verify the payout happened on-chain. That's the honesty contract — no smoke and mirrors."

Tap the explorer link. Show the Tonviewer page with the transaction detail.

### 55–60s: Close

> "DigiHouse: fractional property, real rent yield, on-chain honest. Phase 3 delivers the testnet loop; mainnet and secondary market are next. Questions?"

---

## Key talking points

| Topic | One-liner |
|---|---|
| The gap | "Real estate is the biggest asset class most people can't access." |
| Fractional ownership | "Buy a slice for $5 — earn proportional rent." |
| Weekly yield | "Rent is distributed every Friday. No quarterly waiting." |
| TON settlement | "Testnet today, mainnet post-MVP — real L1 transactions." |
| Honesty contract | "No simulated badges when the TX is real. Explorer-verifiable." |
| Liquidity (future) | "Phase 4 adds a secondary market. Sell your shares anytime." |
| MVP scope | "One property, testnet, hybrid settlement. Full onchain post-MVP." |

---

## FAQ (prep for Q&A)

**Q: Is this live on mainnet?**

A: Testnet for now. All TON transfers are real L1 testnet transactions. Mainnet deployment follows Phase 4 (secondary market) audit.

**Q: Are rental yields guaranteed?**

A: No. Rental income depends on property occupancy and market conditions. Weekly payouts are proportional to actual rent collected. Past payouts don't guarantee future returns.

**Q: How is the rent distributed?**

A: A payout worker computes each holder's share = `rentPool × shareRatio` and records the distribution. On-chain payout (jetton transfer) is post-MVP.

**Q: Can I sell my shares?**

A: Not yet. The secondary market (Phase 4) adds limit orders, order book, and peer-to-peer trading.

**Q: What's the fee?**

A: MVP: 0% — we want to prove the model. Future: a small spread on secondary trades.

**Q: Is my wallet safe?**

A: The Mini App never holds your keys. TonConnect handles signing. Transactions are limited to the exact buy amount — no infinite approvals.

---

## Demo pitfalls to avoid

- ❌ Don't try to connect a mainnet wallet — the app is on testnet
- ❌ Don't approve a TX then navigate away — wait for confirmation
- ❌ Don't skip the explorer link — it's the core honesty demonstration
- ❌ Don't promise mainnet — say "testnet now, mainnet post-MVP"
- ⚠️ If the indexer is down: show the simulated badge behavior instead (ADR-001 fallback)
- ⚠️ If the payout tick doesn't fire: show a pre-loaded paid entry with explorer link from seeded data

---

## References

| Doc | Path |
|---|---|
| E2E testnet demo | [`./phase3-e2e-testnet.md`](./phase3-e2e-testnet.md) |
| Stuck-buy runbook | [`./stuck-pending-buy.md`](./stuck-pending-buy.md) |
| Phase 1 demo runbook | [`./phase1-demo.md`](./phase1-demo.md) |
| ADR-001 — Settlement modes | [`../adr/ADR-001-settlement-modes.md`](../adr/ADR-001-settlement-modes.md) |
| Main DEMO.md | [`../../DEMO.md`](../../DEMO.md) |
