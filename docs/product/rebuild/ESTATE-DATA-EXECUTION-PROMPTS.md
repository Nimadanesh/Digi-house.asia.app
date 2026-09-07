# FractionalLuxe — Estate Data & Experience Execution Prompts  

### Purpose
Execute Estate data integration and page refinement in strict, controlled stages so that the Property / Estate page becomes a high-quality investment funnel:

- **Estate** → Desire  
- **Income** → Conviction  
- **Ownership** → Decision  
- **Detail** → Complete & truthful information  

### Critical Rules (apply to every prompt)
- Run **ONE prompt at a time**.
- After finishing a prompt, **stop and report**. Do not continue automatically.
- Never invent data (occupancy, ADR, revenue, yield, investor counts, activity, scarcity, etc.).
- Never change economic formulas, settlement logic, matching engine, buy/sell business rules, or TON payment flow.
- Canonical data from `ESTATE-24-DATA.md` is the single source of truth.
- Prefer clarity, hierarchy, and honest storytelling over persuasive tricks.
- Maintain existing design system (Telegram-native, max-width 480px, dark theme, RTL support).

---

### PROMPT 01 — Repository & Data Audit

Read these files carefully:
- `ESTATE-MARKETING-FUNNEL.md`
- `ESTATE-DATA-CONTRACT.md`
- `ESTATE-24-DATA.md`
- Existing product, business rules, and economics contracts

Inspect the actual codebase.

Answer precisely:

1. Where does canonical Estate data currently live?
2. Where do the 24 Estate identities live?
3. Where are Rental Escapes URLs stored?
4. Where do legacy fixtures still live?
5. Which components already consume canonical data?
6. Which components still consume legacy data?
7. Which property fields already exist in the type system?
8. Which fields from `ESTATE-24-DATA.md` are missing?
9. Which fields are duplicated?
10. Which fields conflict?
11. Which user-visible screens still show legacy Estate facts?

**Do NOT modify any code.**  
**Do NOT create or change data.**  
**Do NOT commit.**

Report findings only in a clear structured format.  
**STOP.**

---

### PROMPT 02 — Adopt & Validate Canonical Estate Dataset

**This is the most important data step.**

Treat `ESTATE-24-DATA.md` as the **authoritative and final** source of truth for all 24 Estates.

Tasks:
1. Import / map the provided 24 Estate records into the canonical data layer of the application.
2. Preserve every value exactly as given (including `null`, ranges, notes, and provenance).
3. Do **not** re-scrape Rental Escapes.
4. Do **not** re-estimate values.
5. Do **not** invent any missing fields.
6. If a TypeScript type requires a field that is absent, mark it properly as `UNKNOWN` or `null` according to the Data Contract.
7. Keep runtime IDs, listing IDs, and source URLs intact.
8. Run validation to confirm all 24 records are correctly loaded and typed.

**Do NOT touch UI.**  
**Do NOT touch economic engines or formulas.**  
**Do NOT touch buy/sell logic.**

Report:
- How many estates were successfully adopted
- Any structural gaps that had to be marked UNKNOWN
- Any conflicts found
- Confirmation that no values were invented or altered

**STOP.**

---

# PROMPT 03 — Canonicalize User-Visible Estate Facts

## Objective

Connect the adopted 24-Estate canonical dataset to the existing user-visible property surfaces.

This prompt is about DATA CANONICALIZATION and PROPERTY FACT INTEGRATION.

Do not redesign the product IA.

Do not redesign the four tabs.

Do not change economic formulas.

Do not change buy/sell/settlement logic.

---

# 1. Read First

Read:

- ESTATE-MARKETING-FUNNEL.md
- ESTATE-DATA-CONTRACT.md
- ESTATE-24-DATA.md
- PRODUCT.md
- BUSINESS-RULES.md
- ESTATE-ECONOMICS-DESIGN-CONTRACT.md

Also inspect the actual current implementation.

---

# 2. Canonical Source Rule

The adopted 24-Estate dataset is the authoritative source for PROPERTY FACTS.

Use it for:

- name
- slug
- location
- property type
- source URL
- listing ID
- images where canonical image mapping exists
- guests
- bedrooms
- bathrooms
- interior size
- total size
- pool size
- land information
- description
- seasonality
- amenities
- services
- nightly rate
- rate type
- rate notes
- observed period
- observed taxes/fees
- research metadata

Do not use legacy fixtures as competing sources for these facts.

---

# 3. Preserve Exact Data Semantics

Do not:

- round source values unnecessarily
- convert currencies
- convert rate types
- create ADR
- create occupancy
- create annual revenue
- create yield
- create appreciation
- invent missing descriptions
- invent property types
- replace null with zero

If the canonical dataset says null, preserve null / UNKNOWN according to the Data Contract.

---

# 4. Critical Valuation Rule — Growth Potential

The product has two distinct valuation concepts.

## Current Estimated Value

This is the currently approved FractionalLuxe valuation.

It must remain separate from the research valuation range.

## Growth Potential

Introduce the product concept:

**Growth Potential**

Definition:

> The upper end of the researched valuation range that the Estate may potentially reach.

This is NOT:

- a forecast
- a guaranteed return
- a promised appreciation
- a market prediction
- investment advice

It must be presented as an estimated potential value.

---

## Grand 2 BDM — Specific Rule

For Grand 2 BDM:

Current approved FractionalLuxe valuation:

**$8M–$10M**

Research valuation:

**$9.6M–$18M**

Therefore:

- Keep Current Estimated Value as `$8M–$10M`
- Set Growth Potential upper value to `$18M`
- Preserve `$9.6M–$18M` as research evidence/provenance
- Do NOT replace the current valuation with `$13.5M`
- Do NOT use `$13.5M` as the current product value
- Do NOT display the legacy `$82M` value anywhere

Because Current Estimated Value is a range, do NOT calculate or display a Growth Potential percentage for Grand 2 BDM.

---

# 5. General Growth Potential Rule

For Estates where:

- current FractionalLuxe value is a single numeric value
- research valuation range exists

Growth Potential may be represented as:

Current Estimated Value → Growth Potential

and the percentage may be calculated only when the mathematical basis is unambiguous.

Formula:

Growth Potential % =
(Potential Value - Current Value) / Current Value × 100

The percentage must be explicitly associated with:

**Estimated Growth Potential**

Never label it simply "Return", "ROI", "Profit", or "Expected Return".

If current value is a range, do not calculate the percentage.

If either value is unavailable, do not calculate it.

Do not create a current value merely to enable this calculation.

---

# 6. Where Growth Potential Belongs

Growth Potential is an INVESTMENT STORY concept.

Therefore it may be surfaced in:

- Estate
- Income / investment-return context
- Ownership where relevant to the ownership decision

It may also appear in Detail as a transparent valuation section with provenance.

It must NOT be mixed with:

- rental income
- paid income
- projected income
- accrued income
- secondary-market gain

Growth Potential is a separate valuation concept.

---

# 7. Canonicalize User-Visible Property Facts

Inspect and update the existing property-related view models/components so that user-visible property facts consume the canonical Estate record.

Priority:

1. Estate identity
2. Location
3. Images
4. Property type
5. Physical specifications
6. Description
7. Nightly rate
8. Rate semantics
9. Valuation / Growth Potential

Target surfaces include, where applicable:

- Marketplace
- Estate
- Income
- Ownership
- Detail
- Buy
- Sell
- Similar Properties
- Reserve CTA

Do not force every field into every surface.

Use the four-tab funnel contract to determine relevance.

---

# 8. Legacy Leakage Removal

Find and remove user-visible dependencies on legacy property facts where canonical data exists.

Pay particular attention to:

- legacy property names
- legacy descriptions
- legacy locations
- legacy property types
- legacy nightly rates
- legacy valuation
- legacy APY
- legacy projected income
- fixture-based property labels

Do NOT delete legacy fixtures in this prompt unless they are proven completely unused and removal is explicitly safe.

The objective is to stop them from driving user-visible property facts.

---

# 9. Do Not Touch Economic Engines

Do not modify:

- estate-economics.ts
- scenario-engine.ts
- buy-quote.ts
- sell-quote.ts
- estate-share-model.ts
- estate-plan-engine.ts
- matching engine
- settlement
- TON/payment logic

unless a purely mechanical type/import change is absolutely required.

Do not change formulas.

Do not reconcile economic-model conflicts by inventing values.

---

# 10. Do Not Create Economic Data

This prompt does NOT authorize creation of:

- occupancy
- ADR
- annual revenue
- gross revenue
- net revenue
- owner distributable
- yield
- appreciation history
- market price
- demand
- investor activity

Those remain governed by their existing economic/data contracts.

---

# 11. Provenance

Use the existing provenance system.

At minimum ensure that:

- estimated valuation
- Growth Potential
- source nightly rate
- observed property facts
- derived values

retain appropriate provenance.

Growth Potential must clearly communicate that it is estimated/research-derived.

Do not clutter every card with verbose provenance text.

Use the existing compact provenance pattern.

---

# 12. Validation

After implementation validate all 24 Estates.

Confirm:

- 24 canonical records resolve
- canonical names resolve
- canonical locations resolve
- canonical listing IDs resolve
- source URLs resolve from canonical data
- property facts do not fall back to incorrect legacy fixtures
- nulls remain honest
- rate types remain correct
- currencies remain correct
- no ADR was created
- no occupancy was created
- no revenue was invented
- no legacy $82M valuation is user-visible
- Grand current valuation remains $8M–$10M
- Grand Growth Potential is $18M
- Grand $13.5M remains research evidence, not current valuation
- no Growth Potential percentage appears for Grand

---

# 13. QA

Run:

- unit tests
- typecheck
- lint
- build
- relevant E2E tests

Also inspect rendered UI at:

- 480×840 LTR
- 480×840 FA RTL

Check:

- no horizontal overflow
- no raw translation keys
- no broken images
- no incorrect property identity
- no misleading valuation language

---

# 14. Reporting

Report:

1. Files changed
2. Number of Estates successfully canonicalized
3. Legacy dependencies removed from user-visible property facts
4. Fields still unresolved
5. Valuation handling
6. Growth Potential handling
7. Tests
8. Visual QA
9. Any deviations from this prompt

Do NOT commit.

STOP after the report.

---

### PROMPT 04 — Build the Detail Tab as the Complete Information Surface

Using `ESTATE-MARKETING-FUNNEL.md` as the product contract, rebuild **only the Detail tab**.

Goal:  
Make Detail the complete, trustworthy, non-persuasive reference surface for the property.

It must surface all available canonical information:
- Full identity & location
- Property type
- Physical specifications (guests, bedrooms, bathrooms, sizes, land notes…)
- Full description + seasonality
- Amenities (all categories)
- Services (included / staff / extra-cost)
- Rates with exact semantics and notes
- Taxes & fees
- Valuation + provenance + confidence
- Source URL and research metadata

Rules:
- Detail is informational, never sales-oriented.
- Never add scarcity, urgency, social proof, or marketing claims.
- Unknown values must remain clearly “Data pending” or equivalent.
- Use existing design system and provenance components.
- Test at 480×840 and RTL.

**Do not change the other three tabs yet.**  
Report what was added and how unknown states are handled.  
**STOP.**

---

### PROMPT 05 — Refine Estate / Income / Ownership for the Funnel

Using `ESTATE-MARKETING-FUNNEL.md`, refine the three conversion tabs **without redesigning the information architecture from scratch**.

Goals:
- **Estate tab** → Create Desire (“I want this asset”)
- **Income tab** → Build Conviction (“The economics make sense”)
- **Ownership tab** → Support Decision (“I can see myself owning this”)

Actions:
1. Ensure each tab only shows information that serves its role.
2. Move pure reference information to Detail where appropriate.
3. Improve visual hierarchy, spacing, and storytelling.
4. Make the progression feel natural and trustworthy.
5. Keep all numbers honest and provenance-aware.

Hard constraints:
- No new economic assumptions
- No fake data, urgency, scarcity, or activity
- No formula changes
- No duplicate economic engines

Test at 480×840 and RTL.  
Report the main improvements made to each tab.  
**STOP.**

---

### PROMPT 06 — Provenance & Truthfulness Audit

Audit every user-visible Estate-related fact across all surfaces.

For each important number or claim check:
- nightly rate
- valuation
- size / specs
- property type
- projected income
- share price
- funding state
- fees
- buy / sell totals
- income figures

Classify provenance correctly:
`OBSERVED` | `ESTIMATED` | `DERIVED` | `CONFLICTED` | `UNKNOWN`

Fix only presentation and labeling issues.  
Remove any remaining misleading legacy values.  
Pay special attention to:
- Projected vs Accrued vs Paid
- Property valuation vs offering amount
- Source nightly rate vs ADR
- Observed vs estimated economics

Do not change any formulas.  
Run tests and report all fixes.  
**STOP.**

---

### PROMPT 07 — Full Estate Experience QA

Perform final quality assurance on all 24 Estates.

#### Data Integrity
- Exact identity and correct Rental Escapes URL
- No legacy leakage
- No conflicting visible values
- Correct rate semantics
- Proper provenance
- Honest unknown states

#### Funnel Quality
- **Estate**: Does it create genuine investment interest?
- **Income**: Does it clearly explain the economic story?
- **Ownership**: Does it clarify what ownership means and the next action?
- **Detail**: Is it complete and free of marketing manipulation?

#### Technical
- TypeScript & lint clean
- Unit tests + E2E passing
- 480×840 viewport
- RTL support
- No horizontal overflow
- No raw i18n keys
- No console errors

#### Business Integrity
Confirm zero changes were made to:
- Economic formulas
- Settlement / matching
- Payment flow
- TON logic
- Buy / Sell business rules

Produce a final report with:
1. PASS / FAIL
2. Files changed
3. Data coverage
4. Remaining unknowns
5. Any conflicts
6. Visual / UX issues
7. Business-rule risks

**Do NOT commit unless explicitly instructed.**

---

This version significantly reduces the risk of the agent inventing or overwriting good data, while keeping a clear path toward a high-quality, trustworthy, and conversion-oriented Property page.