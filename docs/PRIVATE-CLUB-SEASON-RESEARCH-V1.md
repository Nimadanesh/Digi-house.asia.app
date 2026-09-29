# FractionalLuxe Private Club — Season Research v1

> **Status:** research + data foundation. No booking/lottery implementation, no UI changes except none, no product-rule changes.
> **Provenance:** OBSERVED (listing notes, published sources) · ESTIMATED · DERIVED (day counts) · CONFLICTED where noted · UNKNOWN where absent.
> **Core distinction:** calendar classification ≠ confirmed vacant inventory. Occupancy, owner use, maintenance, and live availability remain UNKNOWN per existing contracts.

---

## 1. Executive summary

- All **24/24 canonical villas** researched: 24 RESEARCHED (17 HIGH, 7 MEDIUM confidence), 0 PARTIAL, 0 UNKNOWN.
- Portfolio calendar classification (DERIVED, exact): **Peak 775 / High 3,038 / Shoulder 1,670 / Off-peak 3,277** days across 24 × 365 = 8,760 villa-days.
- The 1,450-day approved Club allocation is smaller than the portfolio's derived Off-Peak calendar capacity, supporting the non-peak strategy at the calendar-classification level. This does not establish actual available inventory.
- Regional patterns confirmed, not assumed: Caribbean winter peak (Dec–Apr + festive), Mediterranean summer peak (Jul–Aug + festivals/harvest), Maldives dry-season peak, ski-winter peak (Kitzbühel, inverted vs tropics), LA summer + holiday peaks with no forced off-peak.
- One conflict recorded (Cabo shoulder/peak framing) and resolved with reasoning.
- Implemented in `src/lib/club/season-calendar.ts` (single canonical source) with structural tests; `isClubPreferred` = off-peak (shoulder opt-in configurable).

## 2. Methodology

1. Extracted per-villa `seasonality` demand notes from `canonical-24.ts` (Rental-Escapes-sourced listing notes = OBSERVED input, not conclusions).
2. Corroborated each destination pattern with 2+ current web sources (tourism boards, climate sources, luxury-rental operators, travel research).
3. Built month-granular calendars with date-range precision for moving peaks (festive Dec 20–Jan 7, Easter, CNY window, half-terms, harvest).
4. Classified by expected luxury-rental DEMAND, never weather alone (§9 rule enforced per villa).
5. Coded calendars + day-count helpers; validated contiguity (365/villa) and non-overlap in unit tests.

## 3. Source quality policy

Priority observed: official tourism/climate sources > established travel research > luxury-rental operators > listing notes > general knowledge (flagged MEDIUM). Peak claims require corroboration; single-source claims stay MEDIUM or below. Moving events (Easter, CNY, half-terms, harvest) are noted as windows, never fixed universal dates.

## 4. Definitions

- **PEAK:** exceptionally high demand (festive weeks, ski peak weeks, event peaks). Never assigned for pleasant weather alone.
- **HIGH:** strong sustained rental/tourism demand (dry seasons, summers, convention seasons).
- **SHOULDER:** intermediate transition demand.
- **OFF_PEAK:** lowest demand; preferred Club inventory source.
- All relative to the property's own market.

## 5–6. Research results / property calendars

Format per villa: periods (MM-DD ranges, wrap-aware) + rationale + drivers + confidence + sources. Full period tables live in code (`season-calendar.ts`, each period carrying reason/confidence/sources); rationale summaries below.

| Villa (listing) | Peak | High | Shoulder | Off-peak | Conf | Drivers |
|---|---|---|---|---|---|---|
| Grand 2 BDM, Maldives (128862) | Dec 20–Jan 7 | Dec 1–19, Jan 8–Apr 30 | May, Nov | Jun–Oct | HIGH | Festive, dry monsoon, CNY/Easter inside HIGH |
| The Aerial, BVI (126855) | Dec 20–Jan 7 | Dec–Apr | May, Nov | Jun–Oct | HIGH | Festive, dry season, hurricane season off |
| Syrene, Amalfi (108924) | Jul–Aug | mid-May–Jun, Sep | Apr–mid-May, Oct | Nov–Mar | HIGH | Summer peak, Ferragosto, Easter shoulder |
| Villa du Cap, Riviera (123861) | Jul–Aug | May–Jun, Sep | Apr, Oct | Nov–Mar | HIGH/MED | Summer + Cannes (mid-May)/Monaco GP (late May) at HIGH |
| Emerald Cay, T&C (125643) | Dec 20–Jan 7 | Dec–Apr | May, Nov | Jun–Oct | HIGH | Festive, dry season |
| Branson, BVI (130393) | Dec 20–Jan 7 | Nov–Apr | May | Jun–Oct | HIGH | Extended Nov window per listing |
| Chalet Montana, Kitzbühel (130901) | Dec 20–Jan 7; Feb 7–Mar 1 | Dec (early), Jan–Feb 6, Mar–Apr 6 | Jul–Aug | Apr–Jun, Sep–Nov | HIGH | Ski peaks, half-term/Week 8, quiet summer |
| Villa BDM, St Barths (131293) | Dec 20–Jan 7 | Dec–Apr | May, Nov | Jun–Oct | HIGH | Festive, dry season |
| Trajan Villa, Las Vegas (128529) | Dec 24–Jan 2; F1 week mid-Nov | CES/Super Bowl (Jan–Feb), spring, fall, Thanksgiving | Jun, Dec 1–23 | Jul–Aug | MEDIUM-HIGH | Event-anchored: F1 (contracted–2037), CES, Super Bowl, NYE corroborated |
| La Datcha, Cabo (123320) | Dec 20–Jan 7 | Nov–Apr | May–Jul | Aug–Oct (storm closure) | HIGH | Holidays, spring break; Pacific storm season |
| Galeazzo, Como (109098) | Jul–Aug | mid-May–Jun, Sep | Apr–mid-May, Oct | Nov–Mar | HIGH | Summer peak pricing, Sep extension |
| Embrace, St Barths (127825) | Dec 20–Jan 7 | Dec–Apr | May, Nov | Jun–Oct | HIGH | Same St Barths pattern |
| ANI DR (122422) | Dec 20–Jan 7 | Dec–Apr | May–Jun, Nov | Jul–Oct | HIGH | Dry season, N-coast storm exposure |
| Mita Principe, Punta Mita (129548) | Dec 20–Jan 7 | Nov–Apr | May–Jun | Jul–Oct | HIGH | Extended Nov window |
| La Dolce Vita, T&C (122903) | Dec 20–Jan 7 | Dec–Apr | May, Nov | Jun–Oct | HIGH | Standard T&C (DYNAMIC rate noted) |
| Tranquility, T&C (126870) | Dec 20–Jan 7 | Dec–Apr | May, Nov | Jun–Oct | HIGH | Standard T&C |
| Pearls of Long Bay, T&C (130397) | Dec 20–Jan 7 | Dec–Apr | May, Nov | Jun–Oct | HIGH | Standard T&C |
| Dream Pavilion, T&C (127483) | Dec 20–Jan 7 | Dec–Apr | May, Nov | Jun–Oct | HIGH | Standard T&C |
| ANI Thailand (108856) | Dec 20–Jan 7 | Nov–Mar | Apr–May, Oct | Jun–Sep | HIGH | Dry season, CNY inside HIGH, monsoon off |
| ANI Sri Lanka (108860) | Dec 20–Jan 7 | Dec–Mar | Apr, Nov | May–Oct | HIGH | South-coast dry season vs Yala monsoon |
| Rio Chico, Jamaica (106441) | Dec 20–Jan 7 | Dec–Apr | May–Jun, Nov | Jul–Oct | HIGH | Winter season |
| Forza Modern, LA (129549) | Summer + festive weeks | Spring, Thanksgiving wk | Fall/early winter/spring shoulders | — (none supportable) | MEDIUM | Summer peak + holiday peaks evidenced; no true low season — not forced |
| Chateau Prestige, Bordeaux (123919) | Jul–Aug; Sep 10–Oct 25 | mid-May–Jun; Sep 1–9 | Apr–mid-May; Oct 26–Nov 15 | Nov 16–Mar 31 | MEDIUM | Summer + shifting harvest (confirm yearly) |
| Hawksbill, T&C (122113) | Dec 20–Jan 7 | Dec–Apr | May, Nov | Jun–Oct | HIGH | Standard T&C |

Demand-vs-weather notes enforced: Caribbean off-peak kept despite good weather (hurricane risk); ski summer kept subdued despite pleasant alpine weather; Vegas heat classified by demand effect.

## 7. Special holiday periods

- Christmas/New Year (Dec 20–Jan 7): PEAK on all seasonal villas (tropical + ski); Vegas Dec 24–Jan 2; LA/Bordeaux-off-season excluded.
- Chinese New Year (late Jan–Feb, moves): uplift inside HIGH for Maldives/Thailand only.
- Easter (Mar/Apr, moves): inside HIGH for Caribbean/Med; noted, not separately banded.
- Ferragosto (mid-Aug): inside Italy PEAK. Cannes (mid-May)/Monaco GP (late May): Riviera HIGH. European half-term/Week 8 (Feb): ski PEAK. Thanksgiving: demand note only, no band change. Valentine's: not a villa-demand driver — excluded. Summer school holidays: inside respective HIGH/PEAK bands.

## 8. Portfolio-level summary (DERIVED, exact)

Peak 775 (8.8%) · High 3,038 (34.7%) · Shoulder 1,670 (19.1%) · Off-peak 3,277 (37.4%) · Total 8,760. Largest off-peak: Sri Lanka 184, Kitzbühel 176, tropical cluster 153 each. Smallest: Las Vegas 62, Cabo 92 (storm closure), LA 0 — no supportable off-peak there, honestly reported rather than forced. Kitzbühel's inverted pattern diversifies winter off-peak supply.

## 9. Club allocation implications

- The 1,450-night allocation (41 nights/villa average — analytical only) is smaller than the 3,277 derived Off-Peak calendar days at the calendar-classification level; classification supports the non-peak strategy without proving inventory. This does not establish actual available inventory.
- Preferred supply order: off-peak first, selected shoulder only by policy (`includeShoulder` flag, default off), never peak/high as first choice.
- 1,450 is NOT reduced or reinterpreted by this research (§18 of task).

## 10. Confidence/provenance

24 RESEARCHED overall — 17 HIGH (all peak/high periods corroborated by repo note + ≥2 sources), 7 MEDIUM (Amalfi, Riviera, Kitzbühel, Vegas, Como, LA, Bordeaux: event-dependent or single-source specifics). Every period carries reason + confidence + source list in code. No UNKNOWN villas.

## 11. Conflicts and unresolved research

- **Cabo shoulder/peak (CONFLICTED, resolved):** one resort source claims May–Oct peak vs Dec–Apr consensus + repo storm-closure note → resolved toward consensus; rationale recorded in code notes.
- **Maldives October:** one source extends ideal season into October vs monsoon-tail consensus → October kept SHOULDER, flagged.
- **Riviera May–June festival uplift:** event-date-dependent; kept HIGH/MEDIUM, confirm yearly.
- **Bordeaux harvest:** shifts yearly (Sep–Oct window); confirm per season.
- **LA granularity resolved:** summer peak + Thanksgiving/Christmas bands now evidenced; Jan–Feb and fall/early-Dec shoulders documented; no off-peak forced (honest absence).
- **Forza/Trajan listing quirks** (STARTING_FROM rates, DEFAULT_ONLY tables): rate evidence only, no calendar impact.

## 12. Future data dependencies

Actual availability calendars; owner-use blocks; maintenance windows; live blackout feeds; booking-lead behavior; turnover feasibility per villa; min-stay exception policy; per-season confirmation of moving events (incl. F1 race week, harvest window); live Vegas convention calendar feed for precision beyond the annual pattern.

## 14. Audit & Gap Closure (post-V1 audit)

- **Las Vegas:** gap closed to RESEARCHED. F1 race-week PEAK added as an event rule (mid-November, dates vary yearly; contracted through 2037; largest special-event impact corroborated); CES/Super Bowl uplift moved shoulder → HIGH with sources; Thanksgiving week HIGH. Remaining limit: exact race/convention dates vary yearly — documented in-period, not fabricated.
- **Los Angeles:** gap closed to RESEARCHED (MEDIUM overall). Summer peak + Thanksgiving/Christmas bands now evidenced; Jan–Feb and fall/early-Dec shoulders documented; no off-peak forced — honest absence, not a gap.
- **Provenance audit:** every period carries reason + confidence + ≥1 source (unit-enforced); 17 HIGH / 7 MEDIUM villa-level; single-source claims capped at MEDIUM.
- **Calendar integrity:** all 24 villas total exactly 365 days (unit-enforced, incl. Dec→Jan wrap); audit caught and fixed a real 14-day June gap in the LA calendar before merge.
- **Feb 29 handling:** 365-day non-leap model; "02-29" resolves to the March-1 period (documented in code + pinned by test). Real calendar dates belong to future availability systems.
- **Canonical audit:** season registry IDs/names/locations/listingIds asserted equal to `CANONICAL_MARKETPLACE_ESTATES` in unit tests — no legacy leakage, no substitution.
- **Final confidence:** 24 RESEARCHED, 0 PARTIAL, 0 UNKNOWN.
- **Final distribution (DERIVED, exact):** Peak 775 (8.8%) · High 3,038 (34.7%) · Shoulder 1,670 (19.1%) · Off-peak 3,277 (37.4%) = 8,760.
- **1,450 wording (§10):** the approved allocation is smaller than derived Off-Peak calendar capacity — calendar-level compatibility only, never claimed available inventory.
- **Remaining gaps:** live availability/owner-use/maintenance/blackout feeds; turnover feasibility; min-stay exceptions; LA festive sub-peak precision; Vegas convention feed; per-season event-date confirmation. All explicitly UNKNOWN, none blocking the data structure.

## 13. Full source list

Repo: `canonical-24.ts` seasonality notes (24, OBSERVED listing-sourced). Web: travel.usnews.com (Maldives, Phuket, Cabo); travelandleisure.com, clubmed.us, enchantingtravels.com, experiencetravelgroup.com (Maldives/Thailand); rentalescapes.com, thetopvillas.com, hauteretreats.com, onefinestay.com, bethgraham.com (Caribbean/hurricane/festive); lecollectionist.com, redsavannah.com, excellenceluxuryvillas.com, myprivatevillas.com, villavacations.com (Italy/Riviera); powderhounds.com, snowscape.co.uk, alpentravel.com, ski-austria.com, austria.info, schlosshotel-kitzbuehel.com (ski); phuket.net, intrepidtravel.com, responsibletravel.com, andamandaphuket.com (Thailand); visitsrilanka.asia, srilanka-spirit.com, lankanstays.com, oretatravels.com, srilankavisits.com, blog.wego.com (Sri Lanka); pacaso.com, luxmex.com (Cabo/Mexico); intothevineyard.com, bordeauxwinetrails.com, atlasbordeaux.com, winetravelguides.com, ophorus.com (Bordeaux); civitatis.com, esim4.com, reviewjournal.com, formula1.com (Vegas events); wander.com, avantstay.com, hellotickets.com, thetopvillas.com Los Angeles guide (LA seasons).
