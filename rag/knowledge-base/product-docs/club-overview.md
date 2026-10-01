---
docId: fifi.club.product-doc.club-overview.v1
docType: product-doc
domain: club
title: "Club — what it is, membership levels, and current scope"
locale: en
source: implementation audit FIFI-01 (club page, club-tiers.ts, club-status.ts, club-benefits.ts); docs/PRIVATE-CLUB-PRODUCT-RULES-V1.md; docs/PRIVATE-CLUB-ECONOMICS.md
sourceTier: 1
status: ACTIVE
defaultProvenance: MIXED
effectiveDate: 2026-10-01
lastVerified: 2026-10-01
retrievalEligibility: eligible
answerAuthority: authoritative
---

# Club — What It Is, Membership Levels, and Current Scope

## What is the Club?

The **FractionalLuxe Club** is a private membership layer inside the product. It is designed for users who want a more exclusive relationship with FractionalLuxe beyond the core investment experience.

The Club is organized into membership levels. Higher levels unlock or prioritize additional Club benefits; they do **not** automatically mean guaranteed investment returns, guaranteed villa nights, or unlimited access.

The current levels are:

| Level | Investment threshold |
|---|---:|
| **Standard** | $0+ |
| **Private** | $10,000+ |
| **Private+** | $25,000+ |
| **Elite** | $100,000+ |
| **Signature** | $500,000+ |

These thresholds describe the current product tier model. A user's actual current tier is **live account data** and must not be inferred from the Knowledge Base.

## What does the Club include?

The current product defines six benefit areas:

- **Villa Stay** — access to the Club stay experience, subject to the separate stay-pool and availability rules.
- **Priority Access** — earlier or prioritized access where the product explicitly provides it.
- **Private Escape** — the Club's private-escape experience concept, subject to published scope and available inventory.
- **Concierge** — a concierge service layer; the exact operational scope, SLA, and request limits must be published before Fifi describes them as guaranteed service.
- **Private Club Card** — a Club membership benefit represented in the product.
- **Referral Rewards** — a referral-related Club benefit concept; personal reward status or payable amounts are live/prototype information and must not be invented.

## What changes between the levels?

The current product progression is:

- **Standard:** preview-only access to the Club experience.
- **Private:** unlocks the core Club benefit set shown by the product, including villa/escape access, priority access, Club Card, and referral-related benefits.
- **Private+:** adds the concierge layer.
- **Elite:** adds higher-status/priority positioning; it does **not** create a guaranteed number of villa nights.
- **Signature:** the highest status level, with the most exclusive positioning; it does **not** create unlimited or guaranteed stay inventory.

The Club therefore sells **access, priority, and membership status**, not a fixed quantity of investment returns.

## Villa stays: an important distinction

The Club stay system is based on a **finite shared pool**, not unlimited free stays.

Current product rules define:

- Club-eligible tiers: **Private, Private+, Elite, Signature**.
- Standard is preview-only and does not enter the stay pool.
- One season entry is an eligibility/participation unit, **not a night, not money, and not a guarantee**.
- The current rule structure uses one award per member per season.
- The standard award structure is **4 consecutive nights**, while peak awards are capped at **3 nights**.
- Exact inventory, peak calendar, some booking windows, and several operating parameters remain provisional or unavailable.

These rules are product-rule definitions. They should not be presented as proof that a particular member currently has a stay available.

## What is live vs prototype?

The Club UI and tier model are present in the current product prototype.

However, the stay runtime is currently an **honest unavailable/backend-absent stub**. Fifi must therefore distinguish between:

1. **Club product rules** — what the membership system is designed to mean.
2. **Current UI/prototype scope** — what the app can display today.
3. **A user's actual entitlement or availability** — live data that must come from the appropriate product/backend layer.

Fifi must never turn a product rule into a claim that a specific user can book a villa right now.

## What is not currently established?

Do not invent:

- guaranteed villa-night quantities;
- unlimited stays;
- peak-holiday availability;
- current member entitlement;
- personal tier status;
- booking confirmation;
- concierge response guarantees;
- referral payout amounts;
- Club credits with cash value;
- partner or experience costs;
- unapproved discounts or financial rewards.

Where the required information is not available, Fifi should say that it is **not currently established** or that the user's current status requires live account data.

## Simple answer

If a user asks **"What is the Club?"**, Fifi should explain it like this:

> The Club is FractionalLuxe's private membership layer. It gives eligible members access to additional experiences, priority benefits, and higher membership status. There are five levels — Standard, Private, Private+, Elite, and Signature — starting at $0, $10K, $25K, $100K, and $500K respectively. Some Club features, especially stays and concierge, have separate availability and operational rules, so membership level alone does not mean unlimited or guaranteed access.

**Next action:** Open **Club** to view the membership levels and benefits shown by the current product.
