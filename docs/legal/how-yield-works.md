# How Yield Works — DigiHouse (DRAFT)

> **Status: DRAFT — for counsel review only. Not legal advice.**
> Transparent explanation of the weekly rental-yield math. Every figure uses integer cents (USD) and integer shares.

---

## 1. Weekly rent from annual rent

Each property has an **annual rent** declared at listing (in USD cents, integer).

```
weeklyRent = floor(annualRentUsd / 52)
```

**Example:** A property with `annualRentUsd = 520000` cents ($5,200.00) produces:

```
weeklyRent = floor(520000 / 52) = 10000 cents ($100.00)
```

`floor` ensures the weekly figure is never a fraction of a cent. The remainder (if any) is handled by dust policy (see §4).

---

## 2. Projected yield per investor

An investor who owns `sharesOwned` shares of a property with `totalShares` outstanding sees:

```
projectedYield(
  weeklyRentUsd: number,   // from §1, integer cents
  sharesOwned: number,      // integer
  totalShares: number       // integer
) = floor(weeklyRentUsd * (sharesOwned / totalShares))
```

**Example:** An investor owns 50 shares of a 10,000-share property with a $100 weekly rent:

```
projectedYield = floor(10000 * (50 / 10000))
               = floor(10000 * 0.005)
               = floor(50)
               = 50 cents ($0.50)
```

All projected figures are formatted with the label `projectedYield` or `thisWeekProjectedUsd` — they are **estimates**, not promises.

---

## 3. Projected ≠ paid

- **Projected weekly yield** is a mathematical estimate based on the property's declared annual rent and your current share count.
- **Paid earnings** are actual distributions that have been processed. They may differ from projections due to:
  - Vacancy or tenant default reducing collected rent
  - Property-level expenses not reflected in the base annual rent figure
  - Timing of share purchase (partial-week holdings)

In MVP default modes (`SETTLEMENT_MODE=mock` or `hybrid`), paid earnings are **simulated** unless a specific row carries a real TON transaction hash and an explorer link.

**Canonical hero copy (always visible on the Earnings screen):**

> simulated weekly payout · on-chain verifiable post-MVP

See [ADR-001 §3](../adr/ADR-001-settlement-modes.md#3-ui-badge--honesty-rules-non-negotiable) for the full badge/honesty rules.

---

## 4. Dust residual (remainder after floor)

Because every holder's share is computed with `floor`, the sum of all holder amounts may be **less than** the total `weeklyRent` by up to N−1 cents (where N = number of holders). This remainder is called **dust**.

**Policy (DATA_MODELS §6, ADR-003):**

Dust accrues to the **holder with the largest share ratio** in that distribution. If tied, insertion order breaks the tie. This ensures:

```
Σ holderAmountUsd == weeklyRentUsd    // exactly
```

No cent is lost.

**MVP dust destination:** In mock mode, dust is conceptually returned to the property treasury or rolled into the next week's pool. Real on-chain dust handling is defined by the Distribution contract (Phase 3+).

---

## 5. Payout cadence

| Phase | Cadence | Mechanism |
|---|---|---|
| MVP (mock) | Every `PAYOUT_TICK_MS` ms (default 60s in dev) | `EarningsRepo.tickPayout()` flips pending → paid; synthetic txHash |
| Hybrid (staging) | Sunday UTC (weekly) | Off-chain worker processes pending distributions |
| On-chain (future) | Sunday UTC | Distribution contract pushes or allows claim per holder |

The payout day is **Sunday UTC** for the distribution week that started the prior Monday (`weekOf`).

---

## 6. Per-row invariants

For every earnings entry, the following equation holds (judge-verifiable):

```
EarningsEntry.amountUsd == floor(
  RentalDistribution.rentPoolUsd * (EarningsEntry.shareRatio)
)
```

where `shareRatio = sharesOwned / RentalDistribution.totalShares` at the time of distribution.

---

## 7. Example walkthrough

| Item | Value |
|---|---|
| Property annual rent | $10,400.00 (1,040,000¢) |
| weeklyRent | `floor(1040000 / 52)` = 20,000¢ ($200.00) |
| totalShares | 5,000 |
| You own | 25 shares |
| shareRatio | 25 / 5,000 = 0.005 (0.5%) |
| **Your projected weekly** | `floor(20000 × 0.005)` = **100¢ ($1.00)** |

If the rent pool for the week is exactly $200.00 and there are three holders owning 50%, 30%, and 20%:

| Holder | shareRatio | amountUsd (floor) |
|---|---|---|
| A (50%) | 0.50 | `floor(20000 × 0.50)` = 10000¢ ($100.00) |
| B (30%) | 0.30 | `floor(20000 × 0.30)` = 6000¢ ($60.00) |
| C (20%, largest → gets dust) | 0.20 | `floor(20000 × 0.20)` = 4000¢ ($40.00) + 0¢ dust = **$40.00** |

Sum = $200.00 exactly. No dust in this example because each floor division landed evenly.

---

## 8. Format helpers

All yield figures in the Mini App use these helpers from `src/lib/format.ts`:

```ts
weeklyRent(annualRentUsd)     // floor(annual / 52)
projectedYield(weekly, owned, total)  // floor(weekly * owned / total)
usd(cents)                    // "$X.XX" with tabular-nums
```

---

**DRAFT — NOT LEGAL ADVICE. FOR COUNSEL REVIEW.**

Cross-references:
- [DATA_MODELS §6](../research/DATA_MODELS.md#6-rental-income-distribution-the-hero-on-chain-entity) — earnings types, proportional invariant, dust policy
- [DATA_MODELS §9 (helpers)](../research/DATA_MODELS.md#display-helpers-srclibformatts) — `weeklyRent`, `projectedYield`
- [ADR-001 §3](../adr/ADR-001-settlement-modes.md#3-ui-badge--honesty-rules-non-negotiable) — honesty badge rules
- [ADR-001 §6](../adr/ADR-001-settlement-modes.md#6-math--units-reference) — math & units
- [ADR-003](../adr/ADR-003-distribution-model.md) — distribution cadence & on-chain dust policy
