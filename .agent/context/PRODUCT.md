# FractionalLuxe Product Context

## Product identity
- Product: **FractionalLuxe**
- App: **`app.fractionalluxe.com`**
- Current repository name: `Digi-house.asia.app` (do not rename repository identifiers unless explicitly requested).
- The app is a Telegram Mini App for fractional ownership of luxury villas.

## Product model
Users invest in fractionalized luxury real estate and hold shares in properties. The product currently targets luxury destinations including Dubai, Bali, Phuket, Mykonos, Marbella, and Maldives.

The locked income model in `FRACTIONALLUXE-PROGRAM.md` is:
- rental income accrues monthly;
- withdrawals are requested by the user;
- withdrawal fee is 1%;
- withdrawal is paid in 4 weekly installments.

Do not reinterpret this as weekly accrual/yield. Existing settlement implementation conflicts are documented and must not be changed unless an explicit program step authorizes it.

## Entry point
The marketing site is separate from this repository. It sends users to the app using Telegram Mini App deep links. The shared `propertyId` contract is defined by the 24-property manifest and IDs must not be renamed or invented.

## Product principles
- Trust through clarity.
- Numbers are primary; avoid decorative chrome.
- One clear primary action per screen.
- Native Telegram behavior and interaction patterns are mandatory for the app.
- Financial states and simulated data must be clearly represented.
- Product decisions must be evidence-based; agents must not invent business rules.

## Scope discipline
The repository's current program file is the active execution plan. Follow its phases and gates. Do not jump ahead simply because an implementation seems useful.

## Rebrand rule
User-facing brand is FractionalLuxe. Technical identifiers may remain DigiHouse where changing them would create unnecessary risk or break contracts. Rename technical identifiers only when explicitly required and verified.
