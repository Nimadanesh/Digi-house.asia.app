---
docId: fifi.product.product-doc.estate-page-structure.v1
docType: product-doc
domain: product
title: "Estate page structure — the five tabs and what each section is for"
locale: en
source: src/components/property/PropertyDetail.tsx; src/components/property/PropertyTabs.tsx; implementation audit FIFI-01
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
related:
  - fifi.product.app-guide.estate-page-tabs.v1
---

# Estate Page Structure — The Five Tabs

How the estate detail page is organized. Verified against the implementation
(FIFI-01 audit). Route: **`/property/[id]`**.

## Page anatomy (top → bottom)

```text
┌────────────────────────────────────────────┐
│ L0  FIXED TOP SECTION (above the fold)     │
│ L1  FIXED 4-STAT SECTION (always visible)  │
├────────────────────────────────────────────┤
│ L2  TABS                                   │
│   Tab 1 — Estate, labeled "Overview"       │
│   Tab 2 — Income                           │
│   Tab 3 — Ownership                        │
│   Tab 4 — Earn                             │
│   Tab 5 — Details                          │
└────────────────────────────────────────────┘
```

## Fixed sections above the tabs

**L0 — Top section:** photo gallery, villa name, location, current
share price + total shares with the ownership fraction ("1 share ≈ 1/N of the estate"),
funding progress bar ("X% funded · N shares left"), estate value (the conservative
approved valuation plus the "Est. Growth" upper end), the Buy button, and the helper
line "Lock shares to earn monthly profit — Average scenario is the payout basis".

**L1 — Fixed 4-stat section** (always visible between top section and tabs):

| Stat | What it is |
|---|---|
| **Monthly income** | Projected per-share monthly, **Average scenario (payout basis)** |
| **Proj. / year** | Projected per-share annual, **Average scenario (payout basis)** |
| **Avg. nightly rate** | The estate's **ANR** — never ADR |
| **Est. growth** | Upper end of the valuation range (conservative value → upper end shown as growth potential) — estimated, non-annualized, with source; never a per-year forecast |

Consistency rule: Monthly income and Proj. / year always equal the **Average scenario
figures** in the Income tab. Unknown figures render an honest pending state — never $0,
never invented numbers.

## Tab 1 — Estate ("Overview" label)

*Job: make the user want this specific estate.*

1. **Why this estate** — short description (the canonical record's short description)
   plus key highlights from the record's own data or approved editorial copy — never
   invented.
2. **Key Specs** — clean rows: type, size (indoor + outdoor), guests/bedrooms/bathrooms.
   Fields without data are omitted or shown as pending rows — never blank guesses.
3. **Amenities** — icon grid from the record's amenity lists.
4. **Location** — exact location text, island/resort area description, transfer details
   only where sourced (labeled confirmed vs approximate); text-only. The external
   "Reserve" link to the source listing lives here.

## Tab 2 — Income

*Job: show, honestly, how the estate makes money and what a share earns.*

1. **Rental basis** — **ANR** as the large number with its derivation line (mean of
   full-buyout listed rates — **not ADR**); Average-scenario payout-basis note;
   historical occupancy stays an honest pending row (occupancy and ADR are Unknown
   for all 24 villas).
2. **Projected revenue scenarios** — scenarios plus the **Average (= payout basis)**,
   Average expanded by default; each card shows modeled nights, whole-villa gross
   revenue, and per-share income (year + month, monthly profit on locked shares).
3. **Modeled costs** — expandable rows with basis **and** amount: Agency/Rental
   Escapes/OTA (5% of gross), Operator (7.5% of gross), Reserve (1.5% of property value,
   with an honest unknown note where currency differs). No invented "other costs" line.
4. **Excluded charges** — guest-paid items (Green Tax, damage waiver, tourism taxes)
   with a check mark and "Not deducted from your income".
5. **Net economics ("Your net income")** — summary card: net distributable income,
   **75% owner share**, owner-side tax (estimated, with assumption; *not tax advice*),
   and per-share net income (year, then month as the largest figure). Projected
   vocabulary only.

## Tab 3 — Ownership

*Job: make the ownership decision clear.*

1. **Valuation & shares grid** — estate value (conservative approved valuation;
   range shown with the upper end as "Est. Growth"), reference value per share, total
   shares, ownership per share (exact percentage).
2. **Growth potential** — the upper end of the valuation range + source caption.
   Never annualized, never a forecast, never rental income.
3. **Exit & liquidity** — secondary-market status when data exists. Shares locked in the
   yield program earn monthly profit but are not sellable until unlocked; unlocked
   shares are sellable but earn nothing. Never claim "sell anytime" over locked shares,
   never claim unlocked shares earn income.
4. **Position preview** — "If you invest today": share stepper, investment amount
   (share price × quantity), projected monthly income scaled by quantity (Average scenario),
   and the mandatory "Projected figures only" footer.
5. **Important risks** — risk disclosures in simple language.

## Tab 4 — Earn

*Job: the yield tab.*

- Lock shares here to start earning; locked state and accrued income shown per holding.
- Payout rhythm: **monthly**, on the full monthly rate; Average scenario is the payout
  basis. Preserved historical weekly records are labeled Legacy.
- Unlock entry lives here too — unlocked shares stop earning and become sellable.

## Tab 5 — Details

*Job: the factual record — only what has a real source.*

1. **Operator** — the rental operator/agency facts and assigned villa specialist.
2. **Legal & structure** — SPV/leasehold text where it exists, insurance (pending where
   unsourced), valuation date + method (no firm names).
3. **Documents** — the available document list (titles only until real PDFs exist).
4. **Distribution & tax** — monthly profit per locked share (Average scenario is the
   payout basis), the honest schedule line, and the investor-facing tax disclosure
   ("not tax advice").
5. **Historical performance** — **rendered only when real data exists.** No real
   historical dataset exists; simulated data must never pose as history.

## Cross-cutting rules

- Buy/Sell buttons and flows, the external Reserve link, buy/sell sheets, lock/unlock,
  sticky header and bottom CTA are preserved behaviors — the structure reorganizes
  *information*, not transaction logic.
- One valuation, one share price, one share count — identical across top section, 4-stat
  section, Income tab (Average), and Ownership tab.
- Projected is never Paid/Accrued; ANR is never ADR; unknown stays unknown.
- A Research estimate is never the official number; CONFLICTED/QUARANTINED means the
  official valuation is Unknown.
