# Risk Disclosures — DigiHouse (DRAFT)

> **Status: DRAFT — for counsel review only. Not legal advice.**
> Investors should read these risk factors and consult their own legal, tax, and financial advisors before acquiring fractional shares.

---

## 1. Capital loss

Investment in fractional real-estate shares carries risk of **partial or total capital loss**. Key factors include:

- **Property devaluation** — real-estate values can decline due to market conditions, location-specific events, interest-rate changes, or natural disasters.
- **Illiquidity** — there may be no active secondary market for a given property's shares. An investor may be unable to sell, or may have to sell below purchase price.
- **Rent shortfall** — if a property is vacant or the tenant defaults, rental income may be reduced or eliminated, affecting both yield projections and eventual resale value.

Past performance of any property or market does not guarantee future results.

---

## 2. No guaranteed yield

DigiHouse does **not** guarantee any minimum rental yield, dividend, or return. Projected weekly yield is a mathematical estimate based on the property's declared annual rent and the investor's share ratio. Actual payouts depend on:

- Collected rent (net of property-level expenses)
- Occupancy and tenant payment behavior
- Distribution cadence (see [how-yield-works.md](./how-yield-works.md))

**No statement in the Mini App, marketing materials, or these documents constitutes a promise of profit or assurance against loss.**

---

## 3. Technology risk

The DigiHouse platform depends on several layers of software and infrastructure:

| Layer | Risk |
|---|---|
| Smart contracts (Phase 2+) | Bugs, exploits, or upgrade vulnerabilities in TON jetton or distribution contracts |
| API / backend | Downtime, data corruption, or misconfiguration affecting holdings and earnings records |
| Telegram Mini App | Browser-level or SDK-level issues; Telegram policy changes affecting Mini App availability |
| TON blockchain | Network congestion, reorgs, validator failures, or gas-price spikes |
| Wallet (TonConnect) | User error, phishing, or compromised wallet keys |

DigiHouse uses **mock repositories** for MVP demos (see [ADR-001 §2](../adr/ADR-001-settlement-modes.md#2-required-matrix)). Holdings and earnings data shown in MVP may be simulated and are **not on-chain verifiable** unless explicitly stated per row.

---

## 4. Simulated vs on-chain

Unless a specific earnings row or transaction displays a real TON transaction hash and an explorer link, the displayed data is **simulated**.

- `SETTLEMENT_MODE=mock` or `hybrid` = earnings shown are **simulated**, not on-chain payouts.
- `SETTLEMENT_MODE=onchain` + a non-`simulated:` txHash + buildable explorer URL = that specific row is **on-chain verifiable**.

See [ADR-001 §3](../adr/ADR-001-settlement-modes.md#3-ui-badge--honesty-rules-non-negotiable) for badge rules and [ADR-001 §4](../adr/ADR-001-settlement-modes.md#4-cutover-rules-when-badges-may-hide) for cutover gates.

---

## 5. Securities & geo risk

Fractional shares in real estate may be classified as **securities** (or restricted financial instruments) in certain jurisdictions. DigiHouse makes no representation that:

- The shares offered through the platform are exempt from securities registration in any jurisdiction.
- Purchasers are legally permitted to acquire or hold such shares under local law.

**Important:** The platform does not currently enforce geo-blocking, KYC, or accredited-investor verification (see [ADR-001 §7](../adr/ADR-001-settlement-modes.md#7-jurisdiction--who-can-buy)). These controls are planned for a future phase and are not yet operational.

**Investors should consult their own legal counsel regarding the regulatory status of fractional real-estate investments in their country of residence.**

---

## 6. Deferred KYC & compliance

MVP and early staging operate without identity verification. Users connect a TON wallet (TonConnect) and are not required to submit identity documents for demo use.

Real-money on-chain settlement, property funding, or withdrawal to external wallets may be subject to future KYC / AML / sanctions screening requirements. DigiHouse reserves the right to:

- Restrict access by geography
- Require identity verification before allowing certain transactions
- Freeze or reverse transactions in response to legal or regulatory obligations

---

## 7. Tax treatment

DigiHouse does not provide tax advice. Rental income, capital gains, and token transactions may be taxable events depending on the investor's jurisdiction. Investors should consult a qualified tax professional.

---

## 8. Third-party dependencies

The platform relies on services including but not limited to: Telegram, TON blockchain validators and indexers, TonConnect, cloud infrastructure providers, and third-party API services. DigiHouse is not responsible for failures, outages, or security incidents affecting these dependencies.

---

## 9. No fiduciary duty

DigiHouse acts as a technology platform facilitating fractional real-estate transactions. It does not act as a fiduciary, investment advisor, broker-dealer, or custodian for any investor or property owner.

---

## 10. Changes to these disclosures

These disclosures may be updated at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.

---

**DRAFT — NOT LEGAL ADVICE. FOR COUNSEL REVIEW.**

TM-19 reference: [threat-model-v0.md](../security/threat-model-v0.md)
