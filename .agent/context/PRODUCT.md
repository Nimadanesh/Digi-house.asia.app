# FractionalLuxe Product Context

## Product identity
- Product: **FractionalLuxe**
- App: **`app.fractionalluxe.com`**
- Current repository name: `Digi-house.asia.app` (do not rename repository identifiers unless explicitly requested).
- The app is a Telegram Mini App for investing in / acquiring economic positions connected to luxury hospitality Estates.

## Rebuild economic model
The current rebuild is **Estate-first**, not APY-first.

An Estate is the underlying luxury hospitality asset. Fractionalization is the access mechanism; hospitality operations are the value-creation engine; the Marketplace is the capital-allocation and liquidity layer; portfolio growth is the long-term business flywheel.

Two economic product types may exist and must remain distinct:
- **Ownership-backed position:** participation in Estate economics with potential operating-income participation and potential asset/market-value appreciation.
- **Non-ownership yield position:** capital provided for a defined return relationship without Estate ownership.

Do not present these two positions as interchangeable.

## Current 24-Estate catalog
- Exactly 24 property IDs are defined by the shared manifest/report for the current rebuild catalog.
- Property IDs are cross-repository contracts and must not be renamed or invented.
- The core Estate identity must preserve the real source property fields: **photos, name, location, and nightly rental price**.
- The supplied 24-property report is the working source for the current property catalog.

## Data truth model
Agents must distinguish four data classes:
1. **Observed/sourced** — supported by the supplied property data or an identified source.
2. **Estimated** — explicitly estimated values used for modeling, such as the report's estimated asset-value ranges.
3. **Unknown** — information unavailable or explicitly unavailable in the source report.
4. **Product model** — values/rules introduced by FractionalLuxe for the target product experience.

Never convert unknown data into invented numbers. Never present estimates or product-model assumptions as historical facts.

## Marketplace role
The Marketplace is the user's capital-allocation decision environment. It must help users understand:
- what the Estate is;
- how its hospitality economics work;
- what economic position is available;
- what the entry terms are;
- how liquidity/secondary trading works; and
- why this Estate differs from another.

Yield is one attribute, not the identity of the Estate.

## Income vocabulary
- Paid = actually distributed/received.
- Accrued = economically recognized but not yet paid.
- Expected = upcoming amount expected under known terms.
- Projected = modelled estimate.
- Rental income = operating cash flow from hospitality activity.
- Appreciation = change in asset/market value.

Do not collapse these into one generic return number.

## Product-design policy
For the current company-review build, legal/regulatory/compliance considerations are **out of scope as product constraints** and must not be used to water down the intended experience. Build the product as the target product is intended to work; the company can adapt the approved product to its final operating/legal structure later.

This does **not** permit fabrication of factual property or market data.

## Product principles
- Estate first.
- Trust through data clarity.
- Meaningful economic differentiation between Estates.
- Yield contextualized by the underlying business.
- One clear primary action per screen.
- Native Telegram behavior and interaction patterns are mandatory for the app.
- Product-model/simulated economics must be distinguishable from sourced property facts.
- Agents must not invent unresolved economic rules.

## Scope discipline
The rebuild source of truth and explicit product decisions are authoritative. Do not silently revive legacy business rules simply because they already exist in code.

If implementation requires an unresolved economic decision, surface it as a product decision before locking behavior.

## Rebrand rule
User-facing brand is FractionalLuxe. Technical identifiers may remain DigiHouse where changing them would create unnecessary risk or break contracts. Rename technical identifiers only when explicitly required and verified.
