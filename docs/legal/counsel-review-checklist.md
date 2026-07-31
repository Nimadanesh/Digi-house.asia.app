# Counsel Review Checklist — DigiHouse (DRAFT)

> **Status: DRAFT — items identified for counsel review. Not legal advice.**
>
> Engineer-prepared list of open legal/compliance items that require counsel sign-off before public deployment.
> Each item must be marked **PASS** or **ACTION REQUIRED** with counsel's notes below.

---

## 1. Geo allowlist policy owner

- [ ] **Who decides which jurisdictions are permitted?**
  - Current status: no geo-blocking implemented (MVP / staging).
  - Future: API-level allowlist + KYC gates (planned Phase 5+; see [ADR-001 §7](../adr/ADR-001-settlement-modes.md#7-jurisdiction--who-can-buy)).
- [ ] **Sanctions / OFAC screening required?** If yes, vendor or build decision needed.
- [ ] **Counsel notes:**

---

## 2. Entity / SPV language

- [ ] **What legal entity owns each property?** Does the platform use an SPV (special-purpose vehicle) per property?
- [ ] **Does "share" mean equitable title, beneficial interest, or contractual revenue-share?** The term "share" in the Mini App should match the legal structure.
- [ ] **Disclaimers needed?** e.g., "You are not purchasing legal title to the property."
- [ ] **Counsel notes:**

---

## 3. Marketing claims scan

- [ ] **Review the following documents for prohibited or over-reaching language:**

| Document | Review status |
|---|---|
| [risk-disclosures.md](./risk-disclosures.md) | / |
| [how-yield-works.md](./how-yield-works.md) | / |
| [README.md](./README.md) | / |
| In-app About/Legal sheet (i18n) | / |

- [ ] **Forbidden patterns to flag:**
  - "Guaranteed yield," "risk-free," "profit assured"
  - "Rent landed in your wallet" (for simulated/MVP modes)
  - "On-chain verified" without meeting [ADR-001 §4](../adr/ADR-001-settlement-modes.md#4-cutover-rules-when-badges-may-hide) gates
- [ ] **Does the hero copy `simulated weekly payout · on-chain verifiable post-MVP` satisfy local disclosure requirements?**
- [ ] **Counsel notes:**

---

## 4. In-app vs website placement

- [ ] **Where should the final legal disclosures live?**

| Option | Pros | Cons |
|---|---|---|
| In-app native Telegram screen | Available immediately inside the app; consistent UX | Requires development; version-locked |
| Public website (static pages) | Counsel-controlled; no app deploy cycle | User must leave the Mini App |
| Downloadable PDF linked from app | Standard for legal docs; version-tracked | Requires hosting; PDF reader UX outside app |

- [ ] **Decision:** 
- [ ] **Counsel notes:**

---

## 5. Other open items

- [ ] **Tax disclosure:** is the "rental income" description accurate for the chosen legal structure?
- [ ] **Data privacy:** does the Mini App's data collection (Telegram user ID, wallet address, holdings) require a privacy notice?
- [ ] **Terms of Service:** separate from these disclosures — is a ToS needed before public launch?
- [ ] **Counsel notes:**

---

## 6. Sign-off

| Item | Value |
|---|---|
| Counsel name | |
| Counsel firm | |
| Review date | |
| Overall assessment | PASS / CONDITIONAL PASS / FURTHER REVIEW NEEDED |
| Conditions (if any) | |
| Signature | |

---

**DRAFT — NOT LEGAL ADVICE. FOR COUNSEL REVIEW.**

Cross-references:
- [ADR-001 §7 — Jurisdiction / who can buy](../adr/ADR-001-settlement-modes.md#7-jurisdiction--who-can-buy)
- [threat-model TM-19 — Legal/geo mischaracterization](../security/threat-model-v0.md)
- [risk-disclosures.md](./risk-disclosures.md)
- [how-yield-works.md](./how-yield-works.md)
