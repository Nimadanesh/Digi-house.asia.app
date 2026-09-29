# FractionalLuxe Private Club — Referral Growth Model V1

> **Status:** product model + UI foundation. No ledger, backend, settlement, or infrastructure.
> **Provenance:** LOCKED (approved §-task decisions) · CONFIGURABLE (assumptions) · BLOCKED (requires future systems).
> **Companion code:** `src/lib/club/club-economics.ts` (single source of truth), `ClubReferralProgress`, `useReferrals` (prototype-zero state).

---

## 1. Qualified referral (LOCKED definition)

A referral counts **iff**: the invited person is new, reaches ≥ $10,000 investment, and becomes Club-eligible. Clicks, invitations sent, registrations, incomplete onboarding, and sub-$10K users never count. Only `isQualifiedReferral()` may increment progress in a future engine.

## 2. Milestone ladder (LOCKED structure, CONFIGURABLE values)

| Successful referrals | Cumulative points | Stay enhancement | Experience unlock |
|---:|---:|---|---|
| 1 | 1 | +0 (4 nights) | — |
| 3 | 4 | +1 (5 nights) | — |
| 5 | 7 | +2 (6 nights) | — |
| 7 | 11 | +3 (7 nights) | — |
| 10 | 16 | capped 7 nights | **Private Plus Experience Layer** |

Values live in `REFERRAL_LADDER`; UI reads them, never hardcodes them.

## 3. Stay-enhancement mapping (LOCKED bounds)

`referralStayNights(count)` = 4 + highest-reached additional nights, hard-capped at 7, always integer. Progression: 0–1 → 4 · 3–4 → 5 · 5–6 → 6 · 7+ → 7. The 10-referral milestone adds the experience layer, **not** an 8th night. Remainder policy: none (integer mapping has no remainder by construction).

## 4. Private Plus Experience Layer (LOCKED semantics)

At 10 qualified referrals the member unlocks Private Plus **experience** benefits while remaining financially classified by actual investment (`resolveExperienceTier()` maps private→private_plus for display/recognition only; all other tiers map to themselves). A $12K investor with 10 referrals is PRIVATE financially, Plus-layer experientially. No portfolio data is rewritten.

## 5. Points vs benefits (conceptual firewall)

- **Referral Points** = achievement/progression unit (non-monetary, non-transferable, no cash value).
- **Stay enhancement** = experience benefit (bounded 4→7 nights).
- **Experience layer** = recognition benefit.
- **Investment tier** = actual invested amount only.
- UI copy rules: "Private Experience / Referral Point" allowed; "cashback / ROI / guaranteed return / commission / profit" forbidden (enforced by copy review; unit test guards cashback framing on Club surfaces). The removed "Club Lifestyle Value" concept must not reappear in referral copy.

## 6. Economic invariants (LOCKED)

Base 4 whole nights · max 7 whole nights · never fractional · no unlimited liability (finite pool + caps + expiry govern fulfillment) · no financial return · no tier change · no Plus-layer tier change · Standard excluded · qualification gate · availability/allocation supremacy · peak rules unchanged · no pool expansion · 1,450 days unchanged · 4-night base unchanged · weights 1.0/1.25/1.5/2.0 (normative V1, locked 2026-09-26; supersedes 1/2/4/8).

## 7. Prototype state (CONFIGURABLE stand-in)

`useReferrals()` returns `{ successfulReferrals: 0, isPrototype: true }` — the ladder renders honestly locked with the existing invite flow as CTA. Swap the return (never the shape) when a real source exists. No counts are fabricated.

## 8. What is NOT implemented (BLOCKED)

Ledger, database, attribution engine, code generation/tracking, settlement/payout, payment, blockchain, anti-fraud, production invite accounting, concierge fulfillment, service catalog prices, season research consumption (registry exists; wiring deferred), lottery execution, booking engine.

## 9. Future dependencies

Real referral source + attribution confirmation; service catalog with approved values; season-calendar wiring for stay fulfillment; lottery engine integration (`tierWeight` already available); monitoring for gaming; legal review of reward framing; copy approval for milestone names.
