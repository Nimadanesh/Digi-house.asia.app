# J-Space Workspace Ledger

## Goal
Change every weekly profit/payment/payout-day reference from Friday to Sunday across the DigiHouse repo — code logic, copy, i18n, configs, comments, docs — including onboarding page 2 → "See your share every Sunday in Earnings". No remaining payout-related "Friday"/"Fri". Leave unrelated Fridays (none found). Verify with grep + typecheck + tests before shipping.

## Core
- Day-of-week logic: getUTCDay() 5 (Friday) → 0 (Sunday); rename nextFridayParts→nextSundayParts, daysUntilFri→daysUntilSun, nextFriMs→nextSunMs
- Copy: "Friday"→"Sunday", abbreviation "Fri"→"Sun" (payout-day contexts only)
- i18n: 11 languages × 2 keys (onboarding.yield.subtitle + home.buyFirstShareHint)
- Exclude tool snapshots: .mimosa/hook-state/*, .superpowers/sdd/*.diff (generated artifacts, not project source)

## Verified
- ✓01 Source logic: format.ts nextSundayParts uses (0 - day + 7) % 7; format.test.ts dates rebased to Sunday; rename fri→sampleNow so no "Fri" token remains — verified by: grep clean + format.test.ts 17 passed
- ✓02 Copy + i18n: onboarding-slides.ts + en.json + 11 translations updated (subtitle + buyFirstShareHint); "Fri"→"Sun" in PayoutCountdown/BuySuccessStep — verified by: grep -E "friday|\bfri\b" → CLEAN (excluding tool snapshots)
- ✓03 Docs/configs: sed Friday→Sunday + Fri→Sun across adr/research/ops/runbooks/legal/superpowers/ROADMAP/EXECUTION-PLAN/HANDOVER + env examples + .opencode; superpowers plan snippet day-index 4→0 fixed — verified by: grep clean + spot-check DESIGN_SYSTEM/ADR-003/DATA_MODELS/ROADMAP
- ✓04 Gates green: typecheck (web+api+shared) exit 0; lint 0 errors (3 pre-existing warnings in untouched e2e files); npm test 361 passed; test:api 490 passed

## Open

## Next
- ship: report every changed file with before/after text
