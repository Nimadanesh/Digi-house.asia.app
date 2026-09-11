# FractionalLuxe — Estate 24 Data (generated companion)

> GENERATED FILE — DO NOT EDIT BY HAND.
> Source of truth: `docs/product/rebuild/ESTATE-24-DATA.json`.
> Regenerate: `node scripts/generate-estate-24-data-md.mjs`.
> Generated: 2026-09-11 · Records: 24

Canonical share-supply model (Final PO Decisions 1–2):
`Total shares = property valuation ÷ $100` · `Base price = $100/share (primary offering)`.
Secondary-market pricing is separate and demand-driven. Profit is monthly;
four transfers are a payment schedule, never weekly profit (Decisions 3–4).
ADR, occupancy, annual revenue, and yield are UNKNOWN unless a record says
otherwise — this companion never invents them.

## Index

| # | Estate | Location | Listing ID | Valuation (approved) | Status |
|---|---|---|---|---|---|
| 1 | Grand 2 BDM Ocean Pool Villa (JOALI Being) | Bodufushi, JOALI Being, Raa Atoll, Maldives | 128862 | $8,000,000 | READY_WITH_GAPS |
| 2 | The Aerial | Buck Island, British Virgin Islands | 126855 | $18,000,000 | READY_WITH_GAPS |
| 3 | Villa Syrene | Sorrento, Amalfi Coast, Italy | 108924 | $12,000,000 | READY_WITH_GAPS |
| 4 | Villa du Cap | Saint-Jean-Cap-Ferrat, French Riviera, France | 123861 | $25,000,000 | READY_WITH_GAPS |
| 5 | Emerald Cay | Silly Creek, Providenciales, Turks and Caicos | 125643 | $28,000,000 | READY_WITH_GAPS |
| 6 | The Branson Beach Estate | Moskito Island, British Virgin Islands | 130393 | $30,000,000 | READY_WITH_GAPS |
| 7 | Chalet Montana | Kitzbühel, Tyrol, Austria | 130901 | $12,000,000 | READY_WITH_GAPS |
| 8 | Villa BDM | Saint Jean Beach, St. Barthélemy | 131293 | $18,000,000 | READY_WITH_GAPS |
| 9 | Trajan Villa at Caesars Palace | Caesars Palace, Las Vegas, Nevada, USA | 128529 | $8,000,000 | READY_WITH_GAPS |
| 10 | Villa La Datcha | Pedregal, Cabo San Lucas, Los Cabos, Mexico | 123320 | $15,000,000 | READY_WITH_GAPS |
| 11 | Villa Galeazzo | Tremezzo, Lake Como, Lombardy, Italy | 109098 | $12,000,000 | READY_WITH_GAPS |
| 12 | Embrace | Gustavia Heights, St. Barthélemy | 127825 | $35,000,000 | READY_WITH_GAPS |
| 13 | ANI Dominican Republic | Cabrera, North Coast, Dominican Republic | 122422 | $50,000,000 | READY_WITH_GAPS |
| 14 | Mita Principe | Ranchos Estates, Punta Mita, Mexico | 129548 | $25,000,000 | READY_WITH_GAPS |
| 15 | La Dolce Vita | Long Bay, Providenciales, Turks and Caicos | 122903 | $32,000,000 | READY_WITH_GAPS |
| 16 | Tranquility | Leeward / Grace Bay area, Providenciales, Turks and Caicos | 126870 | $35,000,000 | READY_WITH_GAPS |
| 17 | Pearls of Long Bay Estate | Long Bay, Providenciales, Turks and Caicos | 130397 | $60,000,000 | READY_WITH_GAPS |
| 18 | Dream Pavilion | Ambergris Cay, Turks and Caicos | 127483 | $20,000,000 | READY_WITH_GAPS |
| 19 | ANI Thailand | Koh Yao Noi, Phang Nga Bay, Thailand | 108856 | $45,000,000 | READY_WITH_GAPS |
| 20 | ANI Sri Lanka | Maliyadda, South Coast, Sri Lanka | 108860 | $50,000,000 | READY_WITH_GAPS |
| 21 | Rio Chico Private Estate | Ocho Rios, Jamaica | 106441 | $25,000,000 | CONFLICTED |
| 22 | Forza Modern | Holmby Hills, Los Angeles, California, USA | 129549 | $18,000,000 | CONFLICTED |
| 23 | Chateau Prestige | Near Saint-Émilion, Bordeaux region, France | 123919 | $15,000,000 | CONFLICTED |
| 24 | Hawksbill | Grace Bay, Providenciales, Turks and Caicos | 122113 | $22,000,000 | CONFLICTED |

---

## 1. Grand 2 BDM Ocean Pool Villa (JOALI Being)

- Location: Bodufushi, JOALI Being, Raa Atoll, Maldives (Bodufushi, JOALI Being, Raa Atoll, Maldives)
- Rental Escapes listing ID: 128862
- Source: https://www.rentalescapes.com/rentals/luxury-villa-rentals-asia/maldives/bodufushi/joali-being/grand-2-bdm-ocean-pool-villa-128862
- Property type: Overwater Villa
- Specs: 5 guests · 2 bd · 2 ba · interior 159 m² · total 382 m² · pool 33 m²
- Nightly rate (observed display): $67,655–$76,458 [RANGE, USD]
  - Notes: Rates inclusive of 10% service charge and 17% Tourism Goods & Service Tax in many published rates. Children over 12 considered adults. No charges for children under 5.
  - Observed: Sep–Oct 2026
- Valuation status: CONFLICTED
- Valuation approved (ESTIMATED): central $8,000,000 · range $8,000,000–$10,000,000 · $8–10M band
- Valuation research (ESTIMATED, MEDIUM): central $13,500,000 · range $9,600,000–$18,000,000
- Legacy quarantined (CONFLICTED): Legacy fixture totalValueUsd = $82,000,000 — Quarantined legacy evidence; must never enter canonical economics or display.
- Rate table: FULL · 4 season(s), observed 2026-09-08
  - ANR $97,230.25 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=2); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Green Tax (FIXED 12 per guest per day USD; unclassified)
  - fee: Damage waiver (non-refundable, up to $2,000) (299 USD/Flat; unclassified)
- Conflicts:
  - [C-RATE-01] rates.nightly scope: Dataset showed Low–Mid only ($67,655–$76,458); live table adds Peak $102,664 + Christmas $142,144. → PM-ADOPTED 2026-09-09: the 4-row live table (Low $67,655 + Mid $76,458 + Peak $102,664 + Christmas $142,144) is the canonical rate set. The prior Low-Mid-only display ($67,655-$76,458) is RETIRED from active evidence (see git history).
  - [C-VAL-01] valuation layers: Approved $8M (band $8–10M) vs research $12–15M central vs legacy $82M fixture. → PM lowest-valid-value rule 2026-09-09: $8M canonical Current Estimated Value confirmed (approved $8-10M band low); research $12-15M stays evidence; $82M quarantined CONFLICTED, never canonical.
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: C-RATE-01 PM-adopted 2026-09-09 (4-row live table canonical; prior range retired)
  - gap: Legacy $82M quarantined as CONFLICTED evidence (permanent)
  - gap: Occupancy/annual revenue intentionally UNKNOWN (ANR is the only rate-derived input)
- Research: confidence MEDIUM · updated 2026-09-05

---

## 2. The Aerial

- Location: Buck Island, British Virgin Islands (Buck Island, Buck Island, British Virgin Islands)
- Rental Escapes listing ID: 126855
- Source: https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/british-virgin-islands/buck-island/the-aerial-126855
- Property type: Private Island Estate
- Specs: 32 guests · 17 bd · 17 ba (+4 half) · interior 2787 m² · total — m² · land 43.5 ha (~43–44 ha private island)
- Nightly rate (observed display): $52,200–$75,800+ [RANGE, USD]
  - Notes: Rates for use of 17 bedrooms hosting up to 32 guests. 7-night minimum during Festive season. Experience inclusive of luxury accommodations and elevated dining with private chef.
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $18,000,000
- Valuation research (ESTIMATED, MEDIUM): central $20,000,000 · range $14,400,000–$26,400,000
- Rate table: FULL · 3 season(s), observed 2026-09-08
  - ANR $64,000 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=17); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Gratuity (PERCENTAGE 5; unclassified)
  - fee: Damage waiver (non-refundable, up to $2,000) (299 USD/Flat; unclassified)
- Conflicts:
  - [C-BATH-02] specs.bathrooms definition: Dataset 17 vs live header '17 + 4½' (17 full + 4 half in detail). → ADOPT 17 full + 4 half as separate fields; both true under different counting.
  - [C-TAX-02] tourism tax provenance: Dataset 10% BVI tax vs listing page showing only 5% gratuity. → 5% OBSERVED (listing); 10% ESTIMATED (jurisdiction rule). Never merged.
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: Occupancy/ADR/annual revenue intentionally UNKNOWN
  - gap: 10% accommodation-tax listing confirmation
- Research: confidence MEDIUM · updated 2026-09-05

---

## 3. Villa Syrene

- Location: Sorrento, Amalfi Coast, Italy (Sorrento, Amalfi Coast, Italy)
- Rental Escapes listing ID: 108924
- Source: https://www.rentalescapes.com/rentals/luxury-vacation-rentals-europe/italy/amalfi-coast/sorrento/villa-syrene-108924
- Property type: Neoclassical Cliff Villa
- Specs: 12 guests · 6 bd · 6 ba · interior — m² · total — m² (Large private garden)
- Nightly rate (observed display): ~€40,000 [APPROXIMATE, EUR]
  - Notes: Cook meal service hours specified. Rates subject to change.
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $12,000,000
- Valuation research (ESTIMATED, MEDIUM): central $14,000,000 · range $9,600,000–$19,200,000
- Rate table: FULL · 1 season(s), observed 2026-09-08
  - ANR $40,000 EUR (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=6); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Tax (as listed) (PERCENTAGE 10; unclassified)
  - fee: Security Deposit (35000 EUR/Flat; unclassified)
- Conflicts:
  - [C-NAME-03] display alias: Canonical short 'Syrene' vs listing full 'Villa Syrene'. → Listing full name is OBSERVED identity; short form is a display alias only, never a rename.
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: Interior/land measurements unavailable
  - gap: Occupancy/ADR/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 4. Villa du Cap

- Location: Saint-Jean-Cap-Ferrat, French Riviera, France (Saint-Jean-Cap-Ferrat, French Riviera, France)
- Rental Escapes listing ID: 123861
- Source: https://www.rentalescapes.com/rentals/luxury-vacation-rentals-europe/france/french-riviera/saint-jean-cap-ferrat/villa-du-cap-123861
- Property type: Mediterranean Luxury Villa
- Specs: 8 guests · 4 bd · 4 ba · interior — m² · total — m² (Exquisitely landscaped grounds with private tennis court)
- Nightly rate (observed display): ~€38,575 [APPROXIMATE, EUR]
  - Notes: Special rates apply for Grand Prix of Monaco, Cannes Film Festival and Christmas.
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $25,000,000
- Valuation research (ESTIMATED, MEDIUM): central $30,000,000 · range $20,000,000–$42,000,000
- Rate table: FULL · 1 season(s), observed 2026-09-08
  - ANR $38,575 EUR (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=0); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Service Charge (PERCENTAGE 8; unclassified)
  - fee: Security Deposit (10000 EUR/Flat; unclassified)
- Conflicts:
  - [C-ROOMS-04] table rooms artifact: Flat-rate row carries rooms='0' while listing detail has 4 bedrooms. → Ignore rooms=0 for capacity; '0' is a rate-config artifact, preserved as observed.
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: Interior/land measurements unavailable
  - gap: GP/Cannes/Christmas special amounts on-inquiry by source design
  - gap: Occupancy/ADR/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 5. Emerald Cay

- Location: Silly Creek, Providenciales, Turks and Caicos (Silly Creek, Providenciales, Turks and Caicos)
- Rental Escapes listing ID: 125643
- Source: https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/turks-and-caicos/providenciales/silly-creek/emerald-cay-125643
- Property type: Private Island Estate
- Specs: 16 guests · 8 bd · 8 ba · interior 2787 m² · total 2787 m² · land 2.1 ha (2+ ha private man-made island)
- Nightly rate (observed display): $35,714–~$50,000 [RANGE, USD]
  - Notes: Rates are dynamic. Price listed is a starting rate.
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $28,000,000
- Valuation research (ESTIMATED, MEDIUM): central $31,500,000 · range $22,400,000–$42,000,000
- Rate table: FULL · 3 season(s), observed 2026-09-08
  - ANR $44,285.67 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=8); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Tax (as listed) (PERCENTAGE 12; unclassified)
  - tax: Service Charge (PERCENTAGE 10; unclassified)
  - fee: Security Deposit (10000 USD/Flat; unclassified)
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: Bed-level configuration unavailable
  - gap: Table coverage ends 2026-05-30 for High season
  - gap: Occupancy/ADR/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 6. The Branson Beach Estate

- Location: Moskito Island, British Virgin Islands (Moskito Island, Moskito Island, British Virgin Islands)
- Rental Escapes listing ID: 130393
- Source: https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/british-virgin-islands/moskito-island/the-branson-beach-estate-130393
- Property type: Private Island Estate (3 connected villas)
- Specs: 22 guests · 11 bd · 11 ba · interior — m² · total — m² · land 125 ha (125-acre Moskito Island; three standalone villas (Headland, Mangrove, Beach))
- Nightly rate (observed display): ~$35,000 [APPROXIMATE, USD]
  - Notes: Inquire for Thanksgiving and Festive season. Environmental and tourism levy $10/pp on arrival. $50 departure tax/pp.
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $30,000,000
- Valuation research (ESTIMATED, MEDIUM): central $35,000,000 · range $24,000,000–$48,000,000
- Rate table: FULL · 4 season(s), observed 2026-09-08
  - ANR $41,687.5 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=11); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: BVI Hotel Tax (PERCENTAGE 3; unclassified)
  - tax: Service Fee (PERCENTAGE 2.5; unclassified)
- Conflicts:
  - [C-RATE-06] rates.nightly scope: Dataset ~$35,000 (Low only) vs live Low 33,250–35,000 + High 48,000–50,500. → PM-ADOPTED 2026-09-09: the live table (Low $33,250-$35,000 + High $48,000-$50,500, +5.2% YoY High observed) is canonical. The prior ~$35,000 Low-only approximation is RETIRED from active evidence (see git history).
  - [C-TAX-06] tourism tax value: Dataset 10% BVI standard vs listing-observed BVI Hotel Tax 3% + Service Fee 2.5%. → Listing 3%+2.5% OBSERVED wins; 10% stays research ESTIMATED.
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: C-RATE-06 PM-adopted 2026-09-09 (live table canonical; prior approximation retired)
  - gap: Festive/Thanksgiving amounts on-inquiry (source design)
  - gap: Occupancy/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 7. Chalet Montana

- Location: Kitzbühel, Tyrol, Austria (Kitzbühel, Tyrol, Austria)
- Rental Escapes listing ID: 130901
- Source: https://www.rentalescapes.com/rentals/luxury-vacation-rentals-europe/austria/tyrol/kitzbuhel/chalet-montana-130901
- Property type: Luxury Chalet
- Specs: 16 guests · 8 bd · 9 ba · interior — m² · total — m²
- Nightly rate (observed display): ~€27,571 [APPROXIMATE, EUR]
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $12,000,000
- Valuation research (ESTIMATED, MEDIUM): central $15,000,000 · range $9,600,000–$21,600,000
- Rate table: FULL · 3 season(s), observed 2026-09-08
  - ANR $28,785.72 EUR (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=8); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Accommodation Tax (PERCENTAGE 3; ADOPT)
  - fee: Damage waiver (non-refundable, up to $2,000) (299 EUR/Flat; unclassified)
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: Accommodation Tax 3% adopted as PM-APPROVED COUNTRY RULE 2026-09-09 (listing TAXES block absent)
  - gap: Interior/land measurements unavailable
  - gap: Occupancy/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 8. Villa BDM

- Location: Saint Jean Beach, St. Barthélemy (Saint Jean Beach, Saint Jean, St. Barthélemy)
- Rental Escapes listing ID: 131293
- Source: https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/st-barthelemy/saint-jean/villa-bdm-131293
- Property type: Beachfront Villa
- Specs: 14 guests · 7 bd · 8 ba · interior — m² · total — m² (Direct path to St-Jean Beach)
- Nightly rate (observed display): ~$25,714 [APPROXIMATE, USD]
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $18,000,000
- Valuation research (ESTIMATED, MEDIUM): central $21,500,000 · range $14,400,000–$30,000,000
- Rate table: FULL · 17 season(s), observed 2026-09-08
  - ANR $38,333.34 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=7); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Tourism Tax (PERCENTAGE 5; unclassified)
  - tax: Service Charge (PERCENTAGE 10; unclassified)
  - fee: Damage waiver (non-refundable, up to $2,000) (299 USD/Flat; unclassified)
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: Display should cite Low–High–Holiday span, not Low alone
  - gap: Interior/land measurements unavailable
  - gap: Occupancy/ADR/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 9. Trajan Villa at Caesars Palace

- Location: Caesars Palace, Las Vegas, Nevada, USA (Las Vegas, Caesars Palace, Nevada, USA)
- Rental Escapes listing ID: 128529
- Source: https://www.rentalescapes.com/rentals/luxury-vacation-rentals-usa/nevada/las-vegas/caesars-palace/trajan-128529
- Property type: Resort Villa
- Specs: 6 guests · 3 bd · 3.5 ba · interior 966 m² · total 966 m² (10,400 ft² Tuscan-themed villa)
- Nightly rate (observed display): from ~$25,000 [STARTING_FROM, USD]
  - Notes: Rates are dynamic. Contact for exact pricing.
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $8,000,000
- Valuation research (ESTIMATED, MEDIUM): central $10,000,000 · range $6,400,000–$14,400,000
- Rate table: DEFAULT_ONLY · 0 season(s), observed 2026-09-08
  - ANR $35,000 USD (PM_APPROVED_MODEL_INPUT; PM-APPROVED MODEL INPUT (2026-09-09): $35,000 nightly product input for Trajan Villa at Caesars Palace. NOT an observed Rental Escapes table average (listing is default-only dynamic pricing). Never ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - fee: Damage waiver (non-refundable, up to $2,000) (299 USD/Flat; unclassified)
- Conflicts:
  - [C-ANR-09] averageNightlyRate: Listing is default-only dynamic pricing (from ~$25,000); no seasonal table exists by source design. → PM-APPROVED MODEL INPUT 2026-09-09: ANR = $35,000 USD. Not an observed table average; provenance PM_APPROVED_MODEL_INPUT distinguishes it from OBSERVED_DERIVED ANRs.
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: Seasonal table absent by source design (ANR $35,000 is PM-approved model input, not table-derived)
  - gap: Lodging-tax listing amount unavailable
  - gap: Occupancy/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 10. Villa La Datcha

- Location: Pedregal, Cabo San Lucas, Los Cabos, Mexico (Pedregal, Cabo San Lucas, Los Cabos, Mexico)
- Rental Escapes listing ID: 123320
- Source: https://www.rentalescapes.com/rentals/luxury-vacation-rentals-mexico/los-cabos/cabo/pedregal/villa-la-datcha-123320
- Property type: Beachfront Estate
- Specs: 20 guests · 10 bd · 10 ba · interior — m² · total — m² (Three interconnected buildings, beachfront)
- Nightly rate (observed display): $23,750–$43,750 [RANGE, USD]
  - Notes: Closed 15 Aug–15 Oct for hurricane season. Rates based on four nights; alternate pricing for longer stays.
  - Observed: Sep–Oct 2026 (note seasonal closure)
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $15,000,000
- Valuation research (ESTIMATED, MEDIUM): central $17,500,000 · range $12,000,000–$24,000,000
- Rate table: FULL · 4 season(s), observed 2026-09-08
  - ANR $37,500 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=10); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Tax (as listed) (PERCENTAGE 20; unclassified)
  - fee: Damage waiver (non-refundable, up to $2,000) (299 USD/Flat; unclassified)
- Conflicts:
  - [C-RATE-10] rates.nightly values: Dataset $23,750–$43,750 (four-night basis note) vs live Standard $35,000 / holiday $40,000 — no row matches either endpoint. → PM-ADOPTED 2026-09-09: the live table (Standard $35,000 + holidays $40,000) is canonical. The prior $23,750-$43,750 four-night basis is RETIRED from active evidence (see git history).
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: C-RATE-10 PM-adopted 2026-09-09 (live Standard/holiday table canonical; four-night basis retired)
  - gap: Closure-window (15 Aug-15 Oct) pricing unavailable
  - gap: Occupancy/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 11. Villa Galeazzo

- Location: Tremezzo, Lake Como, Lombardy, Italy (Tremezzo, Lake Como, Lombardy, Italy)
- Rental Escapes listing ID: 109098
- Source: https://www.rentalescapes.com/rentals/luxury-vacation-rentals-europe/italy/lombardy/lake-como/galeazzo-109098
- Property type: Historic Palazzo
- Specs: 12 guests · 6 bd · 6 ba · interior — m² · total — m² (Formal garden + large rear garden with pool; private mooring)
- Nightly rate (observed display): $18,000–$24,000 [RANGE, USD]
  - Notes: City tax per person per night cash on site. Security Deposit = 20% of total cost. Pets not allowed.
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $12,000,000
- Valuation research (ESTIMATED, MEDIUM): central $15,000,000 · range $9,600,000–$21,600,000
- Rate table: FULL · 4 season(s), observed 2026-09-08
  - ANR $18,000 EUR (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=6); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Tax (as listed) (PERCENTAGE 10; unclassified)
- Conflicts:
  - [C-RATE-11] rates.nightly scope: Dataset $18,000–$24,000 vs live Low €12,000 + Mid €18,000 + High €24,000. → PM-ADOPTED 2026-09-09: the live table (Low EUR 12,000 + Mid EUR 18,000 + High EUR 24,000) is canonical. The prior $18,000-$24,000 dataset-only span is RETIRED from active evidence (see git history).
  - [C-FEE-11] deposit/city-tax provenance: Dataset 20%-of-total deposit + ~€3 city tax vs live page (Tax 10% only, no Other-Fees section). → Keep as research EVIDENCE; do not present as listing-observed.
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: C-RATE-11 PM-adopted 2026-09-09 (live table incl. Low EUR 12,000 canonical; prior span retired)
  - gap: C-FEE-11 deposit/city-tax stays research evidence (not listing-observed)
  - gap: Interior/land measurements unavailable
  - gap: Occupancy/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 12. Embrace

- Location: Gustavia Heights, St. Barthélemy (Gustavia Heights, Gustavia, St. Barthélemy)
- Rental Escapes listing ID: 127825
- Source: https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/st-barthelemy/gustavia/embrace-127825
- Property type: Contemporary Luxury Villa
- Specs: 10 guests · 5 bd · 5 ba · interior — m² · total — m² (Three levels with ocean views and sunsets)
- Nightly rate (observed display): ~$21,428 [APPROXIMATE, USD]
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $35,000,000
- Valuation research (ESTIMATED, MEDIUM): central $40,000,000 · range $28,000,000–$54,000,000
- Rate table: FULL · 17 season(s), observed 2026-09-08
  - ANR $38,571.43 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=5); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Tourism Tax (PERCENTAGE 5; unclassified)
  - tax: Service Charge (PERCENTAGE 10; unclassified)
  - fee: Damage waiver (non-refundable, up to $2,000) (299 USD/Flat; unclassified)
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: Display should cite span, not Low alone
  - gap: Interior/land measurements unavailable
  - gap: Occupancy/ADR/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 13. ANI Dominican Republic

- Location: Cabrera, North Coast, Dominican Republic (Cabrera, North Coast, Dominican Republic)
- Rental Escapes listing ID: 122422
- Source: https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/dominican-republic/cabrera/ani-dominican-republic-122422
- Property type: Private Resort (All-Inclusive)
- Specs: 28 guests · 14 bd · 14 ba · interior — m² · total — m² · land 4.2 ha (4.2-acre (also noted 1.7 ha in sources – CONFLICTED) private peninsula)
- Nightly rate (observed display): ~$27,000 [APPROXIMATE, USD]
  - Notes: All-inclusive. Kosher packages available.
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $50,000,000
- Valuation research (ESTIMATED, MEDIUM): central $60,000,000 · range $40,000,000–$84,000,000
- Rate table: FULL · 27 season(s), observed 2026-09-08
  - ANR $32,666.67 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=14); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Tax (as listed) (PERCENTAGE 18; unclassified)
  - tax: Service Charge (PERCENTAGE 10; unclassified)
  - fee: Damage waiver (non-refundable, up to $2,000) (299 USD/Flat; unclassified)
- Conflicts:
  - [C-LAND-13] specs land size: 4.2 acres claimed vs 1.7 ha in source text (4.2 ac ≈ 1.7 ha — likely unit confusion). → Keep CONFLICTED with note; do not merge without a source re-check.
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: C-LAND-13 single-value decision pending (kept CONFLICTED)
  - gap: Interior measurements unavailable
  - gap: Occupancy/ADR/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 14. Mita Principe

- Location: Ranchos Estates, Punta Mita, Mexico (Ranchos Estates, Punta Mita, Mexico)
- Rental Escapes listing ID: 129548
- Source: https://www.rentalescapes.com/rentals/luxury-vacation-rentals-mexico/punta-mita/ranchos-estates/mita-principe-129548
- Property type: Beachfront Estate
- Specs: 18 guests · 9 bd · 9 ba · interior 2323 m² · total 2323 m² (25,000 ft² on prime beach)
- Nightly rate (observed display): ~$20,000 [APPROXIMATE, USD]
  - Notes: Security Deposit = one night. F&B deposit $150/pp/day. 15% service charge on final bill. Resort fee for facilities.
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $25,000,000
- Valuation research (ESTIMATED, MEDIUM): central $30,000,000 · range $20,000,000–$42,000,000
- Rate table: FULL · 5 season(s), observed 2026-09-08
  - ANR $30,000 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=9); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Tax (as listed) (PERCENTAGE 16; unclassified)
  - tax: Service Fee (PERCENTAGE 10; unclassified)
  - tax: Admin Fee (PERCENTAGE 10; unclassified)
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: F&B-bill mechanics footnote needs listing re-confirmation
  - gap: Land measurements unavailable
  - gap: Occupancy/ADR/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 15. La Dolce Vita

- Location: Long Bay, Providenciales, Turks and Caicos (Long Bay, Providenciales, Turks and Caicos)
- Rental Escapes listing ID: 122903
- Source: https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/turks-and-caicos/providenciales/long-bay/la-dolce-vita--122903
- Property type: Beachfront Mansion
- Specs: 18 guests · 9 bd · 9 ba · interior — m² · total — m² (12,300+ ft² interior; 430 ft private beach)
- Nightly rate (observed display): DYNAMIC [DYNAMIC, USD]
  - Notes: Exact dates required for pricing.
  - Observed: Dynamic
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $32,000,000
- Valuation research (ESTIMATED, HIGH): central $32,000,000 · range $25,600,000–$38,400,000
- Rate table: HOLIDAY_ONLY · 2 season(s), observed 2026-09-08
  - ANR $31,500 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=9); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Tax (as listed) (PERCENTAGE 12; ADOPT)
  - tax: Service Charge (PERCENTAGE 10; unclassified)
  - tax: Facility Fee (PERCENTAGE 5; unclassified)
  - fee: Damage waiver (non-refundable, up to $2,000) (299 USD/Flat; unclassified)
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: Standard-season rates absent - table is holidays-only by source design (ANR scope HOLIDAY_ONLY)
  - gap: Tax 12% ADOPTED as listing-observed (Rental Escapes TAXES block)
  - gap: Interior measurements unavailable
  - gap: Occupancy/annual revenue intentionally UNKNOWN
- Research: confidence HIGH · updated 2026-09-05

---

## 16. Tranquility

- Location: Leeward / Grace Bay area, Providenciales, Turks and Caicos (Leeward / Grace Bay, Providenciales, Turks and Caicos)
- Rental Escapes listing ID: 126870
- Source: https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/turks-and-caicos/providenciales/leeward/tranquility--126870
- Property type: Oceanfront Estate
- Specs: 22 guests · 11 bd · 13 ba · interior — m² · total — m² · land 11 ha (11 acres landscaped grounds; 8-bed main house + 3-bed guest house)
- Nightly rate (observed display): ~$21,500 [APPROXIMATE, USD]
  - Notes: Security deposit equal to one night's stay.
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $35,000,000
- Valuation research (ESTIMATED, MEDIUM): central $40,000,000 · range $28,000,000–$54,000,000
- Rate table: FULL · 12 season(s), observed 2026-09-08
  - ANR $30,625 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=11); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Tax (as listed) (PERCENTAGE 12; unclassified)
  - tax: Service Charge (PERCENTAGE 10; unclassified)
- Conflicts:
  - [C-SEASON-16] season labels: Peak $21,500 equals Low $21,500 (label-only distinction on source). → Preserved as listed with note; ANR uses distinct values once.
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: Display should cite span, not Low alone; Peak=Low label artifact noted
  - gap: Interior measurements unavailable
  - gap: Occupancy/ADR/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 17. Pearls of Long Bay Estate

- Location: Long Bay, Providenciales, Turks and Caicos (Long Bay, Providenciales, Turks and Caicos)
- Rental Escapes listing ID: 130397
- Source: https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/turks-and-caicos/providenciales/long-bay/pearls-of-long-bay-estate-130397
- Property type: Beachfront Estate (3 villas)
- Specs: 56 guests · 28 bd · 28 ba · interior — m² · total — m² (Each villa ~12,000 ft²; 450 ft beachfront)
- Nightly rate (observed display): ~$28,100 [APPROXIMATE, USD]
  - Notes: No pets. Non-smoking.
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $60,000,000
- Valuation research (ESTIMATED, MEDIUM): central $70,000,000 · range $48,000,000–$96,000,000
- Rate table: FULL · 6 season(s), observed 2026-09-08
  - ANR $36,758.33 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=28); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Tax (as listed) (PERCENTAGE 12; unclassified)
  - tax: Service Charge (PERCENTAGE 10; unclassified)
  - fee: Security Deposit (2000 USD/Flat; unclassified)
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: Interior total unavailable (per-villa only)
  - gap: Partial-villa bands unavailable (full-estate observed only)
  - gap: Occupancy/ADR/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 18. Dream Pavilion

- Location: Ambergris Cay, Turks and Caicos (Ambergris Cay, Ambergris Cay, Turks and Caicos)
- Rental Escapes listing ID: 127483
- Source: https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/turks-and-caicos/ambergris-cay/dream-pavilion-127483
- Property type: Private Island Villa
- Specs: 14 guests · 6 bd · 6 ba · interior — m² · total — m² (Largest residence on private island; private beach cove)
- Nightly rate (observed display): ~$18,029 [APPROXIMATE, USD]
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $20,000,000
- Valuation research (ESTIMATED, MEDIUM): central $24,000,000 · range $16,000,000–$33,600,000
- Rate table: FULL · 6 season(s), observed 2026-09-08
  - ANR $22,988 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=6); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - fee: Damage waiver (non-refundable, up to $2,000) (299 USD/Flat; unclassified)
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: Tax-block listing confirmation unavailable (12% is rule-only)
  - gap: Interior/land measurements unavailable
  - gap: Occupancy/ADR/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 19. ANI Thailand

- Location: Koh Yao Noi, Phang Nga Bay, Thailand (Koh Yao Noi, Phang Nga Bay, Thailand)
- Rental Escapes listing ID: 108856
- Source: https://www.rentalescapes.com/rentals/luxury-villa-rentals-asia/thailand/koh-yaonoi/phang-ngabay/ani-thailand-108856
- Property type: Private Resort (All-Inclusive)
- Specs: 20 guests · 10 bd · 10 ba · interior — m² · total — m² · land 2 ha (~2 ha (half a hectare noted in some text – use 2 ha from original research))
- Nightly rate (observed display): ~$22,000 [APPROXIMATE, USD]
  - Notes: Additional guests may be permitted at extra fee.
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $45,000,000
- Valuation research (ESTIMATED, MEDIUM): central $52,500,000 · range $36,000,000–$72,000,000
- Rate table: FULL · 15 season(s), observed 2026-09-08
  - ANR $27,666.67 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=10); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Tax (as listed) (PERCENTAGE 8.7; unclassified)
  - tax: Service Charge (PERCENTAGE 10; unclassified)
  - fee: Damage waiver (non-refundable, up to $2,000) (299 USD/Flat; unclassified)
- Conflicts:
  - [C-LAND-19] specs land note: ~2 ha vs 'half a hectare' text fragment. → Keep ~2 ha with CONFLICTED note; unresolved wording.
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: C-LAND-19 wording unresolved (kept CONFLICTED note)
  - gap: Interior measurements unavailable
  - gap: Occupancy/ADR/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 20. ANI Sri Lanka

- Location: Maliyadda, South Coast, Sri Lanka (Maliyadda, South Coast, Sri Lanka)
- Rental Escapes listing ID: 108860
- Source: https://www.rentalescapes.com/rentals/luxury-villa-rentals-asia/sri-lanka/maliyadda/ani-sri-lanka-108860
- Property type: Private Coastal Resort (All-Inclusive)
- Specs: 30 guests · 15 bd · 15 ba · interior — m² · total — m² · land 5 ha (Garden ~5 ha; two main villas (Monara & Divia))
- Nightly rate (observed display): ~$27,000 [APPROXIMATE, USD]
  - Notes: 7-night minimum over Easter/Passover.
  - Observed: Sep–Oct 2026
- Valuation status: ADOPT
- Valuation approved (ESTIMATED): central $50,000,000
- Valuation research (ESTIMATED, MEDIUM): central $57,500,000 · range $40,000,000–$78,000,000
- Rate table: FULL · 25 season(s), observed 2026-09-08
  - ANR $32,666.67 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=15); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Government Taxes (PERCENTAGE 22.16; unclassified)
  - tax: Service Charge (PERCENTAGE 13; unclassified)
- Consolidation: READY_WITH_GAPS (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: Interior measurements unavailable
  - gap: Occupancy/ADR/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 21. Rio Chico Private Estate

- Location: Ocho Rios, Jamaica (Ocho Rios, Ocho Rios, Jamaica)
- Rental Escapes listing ID: 106441
- Source: https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/jamaica/ocho-rios/rio-chico-private-estate-106441
- Property type: Clifftop Private Estate
- Specs: 24 guests · 12 bd · 12 ba · interior — m² · total — m² · land 14 ha (14-acre estate with multiple pools including ocean-edge and Dunn’s River natural pool)
- Nightly rate (observed display): ~$23,179 [APPROXIMATE, USD]
  - Notes: Dynamic rates. Staff gratuity 10–15% of villa rate. Security Deposit $10,000 refundable.
  - Observed: Sep–Oct 2026
- Valuation status: CONFLICTED
- Valuation approved (ESTIMATED): central $25,000,000
- Valuation research (ESTIMATED, MEDIUM): central $30,000,000 · range $20,000,000–$42,000,000
- Rate table: FULL · 27 season(s), observed 2026-09-08
  - ANR $25,710.75 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=12); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - fee: Security Deposit (10000 USD/Flat; unclassified)
- Conflicts:
  - [C-VAL-21] valuation central/range: Approved $30M / research $20–42M vs JSON $25M / $16–36M (stale layer). → PM lowest-valid-value rule 2026-09-09: approved central set to research-band low $25M ($25-35M). Estimates layer ($25M / $16-36M) versioned as stale divergence (see git history).
- Consolidation: CONFLICTED (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: C-VAL-21 PM lowest-value rule applied 2026-09-09 (approved $25M); estimates layer versioned as stale divergence
  - gap: Listing TAXES block unavailable (GCT is rule-only)
  - gap: Interior measurements unavailable
  - gap: Occupancy/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 22. Forza Modern

- Location: Holmby Hills, Los Angeles, California, USA (Holmby Hills, Los Angeles, California, USA)
- Rental Escapes listing ID: 129549
- Source: https://www.rentalescapes.com/rentals/luxury-vacation-rentals-usa/california/los-angeles-california/holmby-hills/forza-modern-129549
- Property type: Modern Architectural Estate
- Specs: 12 guests · 6 bd · 10.5 ba · interior — m² · total — m² (3-level modern estate with valley/mountain views)
- Nightly rate (observed display): from ~$12,000 [STARTING_FROM, USD]
  - Notes: Dynamic rates. Exit Cleaning $2,000. Pool Heat $500/day optional. Security Deposit $50,000 refundable.
  - Observed: Dynamic
- Valuation status: CONFLICTED
- Valuation approved (ESTIMATED): central $18,000,000
- Valuation research (ESTIMATED, MEDIUM): central $23,000,000 · range $14,400,000–$33,600,000
- Rate table: DEFAULT_ONLY · 0 season(s), observed 2026-09-08
  - ANR $20,000 USD (PM_APPROVED_MODEL_INPUT; PM-APPROVED MODEL INPUT (2026-09-09): $20,000 nightly product input for Forza Modern. NOT an observed Rental Escapes table average (listing is default-only dynamic pricing). Never ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Tax (as listed) (PERCENTAGE 14; unclassified)
  - fee: Exit Cleaning Fee (2000 USD/Flat; unclassified)
  - fee: Pool Heat (500 USD/Per day; unclassified)
  - fee: Security Deposit (50000 USD/Flat; unclassified)
- Conflicts:
  - [C-ANR-22] averageNightlyRate: Listing is default-only dynamic pricing (from ~$12,000); no seasonal table exists by source design. → PM-APPROVED MODEL INPUT 2026-09-09: ANR = $20,000 USD. Not an observed table average; provenance PM_APPROVED_MODEL_INPUT distinguishes it from OBSERVED_DERIVED ANRs.
  - [C-VAL-22] valuation central/range: Approved $23M / research $14.4–33.6M vs JSON $30M / $20–42M (stale layer). → PM lowest-valid-value rule 2026-09-09: approved central set to research-band low $18M ($18-28M). Estimates layer ($30M / $20-42M) versioned as stale divergence (see git history).
- Consolidation: CONFLICTED (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: C-VAL-22 PM lowest-value rule applied 2026-09-09 (approved $18M); estimates layer versioned as stale divergence
  - gap: C-ANR-22 ANR $20,000 PM-approved model input (seasonal table absent by source design)
  - gap: Services/staff unlisted; interior measurements unavailable
  - gap: Occupancy/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 23. Chateau Prestige

- Location: Near Saint-Émilion, Bordeaux region, France (Near Saint-Émilion, Southwest France / Bordeaux, France)
- Rental Escapes listing ID: 123919
- Source: https://www.rentalescapes.com/rentals/luxury-vacation-rentals-europe/france/southwest-france/bordeaux/chateau-prestige-123919
- Property type: Historic Château
- Specs: 24 guests · 11 bd · 11 ba · interior — m² · total — m² · land 37 ha (37 hectares of fenced vineyards)
- Nightly rate (observed display): ~€11,815 [APPROXIMATE, EUR]
  - Notes: Local Tourist Tax not included. No smoking in bedrooms/castle. Security Deposit €10,000 refundable.
  - Observed: Sep–Oct 2026
- Valuation status: CONFLICTED
- Valuation approved (ESTIMATED): central $15,000,000
- Valuation research (ESTIMATED, MEDIUM): central $18,500,000 · range $12,000,000–$26,400,000
- Rate table: FULL · 1 season(s), observed 2026-09-08
  - ANR $11,815 EUR (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=0); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Service Charge (PERCENTAGE 8; unclassified)
  - fee: Security Deposit (10000 EUR/Flat; unclassified)
- Conflicts:
  - [C-VAL-23] valuation central/range: Approved $18.5M / research $12–26.4M vs JSON $15M / $9.6–21.6M (stale layer). → PM lowest-valid-value rule 2026-09-09: approved central set to research-band low $15M ($15-22M). Estimates layer ($15M / $9.6-21.6M) versioned as stale divergence (see git history).
  - [C-ROOMS-23] table rooms artifact: Flat-rate row carries rooms='0' while listing detail has 11 bedrooms. → Ignore rooms=0 for capacity; preserved as observed.
- Consolidation: CONFLICTED (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: C-VAL-23 PM lowest-value rule applied 2026-09-09 (approved $15M); estimates layer versioned as stale divergence
  - gap: rooms=0 rate-config artifact noted
  - gap: Commune-specific taxe de sejour amount variable
  - gap: Occupancy/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

---

## 24. Hawksbill

- Location: Grace Bay, Providenciales, Turks and Caicos (Grace Bay, Providenciales, Turks and Caicos)
- Rental Escapes listing ID: 122113
- Source: https://www.rentalescapes.com/rentals/luxury-villa-rentals-caribbean/turks-and-caicos/providenciales/grace-bay/hawksbill-122113
- Property type: Beachfront Estate
- Specs: 18 guests · 8 bd · 8 ba · interior — m² · total — m² · land 4 ha (4 acres tropical gardens; multiple buildings (main + guest + beach house))
- Nightly rate (observed display): ~$16,500 [APPROXIMATE, USD]
  - Notes: Security Deposit $10,000 refundable.
  - Observed: Sep–Oct 2026
- Valuation status: CONFLICTED
- Valuation approved (ESTIMATED): central $22,000,000
- Valuation research (ESTIMATED, MEDIUM): central $26,000,000 · range $17,600,000–$36,000,000
- Rate table: FULL · 14 season(s), observed 2026-09-08
  - ANR $22,783.33 USD (OBSERVED_DERIVED; Mean of the DISTINCT full-buyout nightly values from the Rental Escapes rate table (rooms=8); weekly-priced rows enter as weekly/7 DERIVED. Not ADR.)
- Occupancy / annual revenue / yield: UNKNOWN by contract (no invented economics).
- Listing-observed charges (disclosure only, never deducted — see V1 excludedCharges):
  - tax: Tax (as listed) (PERCENTAGE 12; unclassified)
  - tax: Service Charge (PERCENTAGE 10; unclassified)
  - fee: Security Deposit (10000 USD/Flat; unclassified)
- Conflicts:
  - [C-VAL-24] valuation central/range: Approved $26M / research $17.6–36M vs JSON $28M / $20–38.4M (stale layer). → PM lowest-valid-value rule 2026-09-09: approved central set to research-band low $22M ($22-30M). Estimates layer ($28M / $20-38.4M) versioned as stale divergence (see git history).
  - [C-SEASON-24] season labels: Low = Mid = $16,500 (label-only distinction on source). → Preserved as listed; ANR uses distinct values once.
- Consolidation: CONFLICTED (2026-09-09; master-extraction-report-2026-09-08; pm-decisions-2026-09-09)
  - gap: C-VAL-24 PM lowest-value rule applied 2026-09-09 (approved $22M); estimates layer versioned as stale divergence
  - gap: Interior measurements unavailable
  - gap: Occupancy/annual revenue intentionally UNKNOWN
- Research: confidence MEDIUM · updated 2026-09-05

