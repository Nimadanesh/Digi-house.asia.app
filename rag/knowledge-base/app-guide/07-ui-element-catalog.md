---
docId: fifi.product.app-guide.ui-element-catalog.v1
docType: app-guide
domain: product
title: "UI element catalog — what visible controls mean"
locale: en
source: implementation audit (Home, Marketplace, Earnings, Club, layout components)
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-30
lastVerified: 2026-09-30
retrievalEligibility: eligible
answerAuthority: authoritative
---

# UI Element Catalog

This guide teaches Fifi to recognize the small pieces of the interface, not only the names of pages. When a user asks “what is this?”, explain the visible element first, then its purpose and the next useful action.

## Home: small elements

### Your Balance
The large number under **Your Balance** is the main balance/value figure presented in the Home hero. When the account has holdings, the hero also presents rental-income information below it.

### Estates count pill
When holdings exist, the small rounded pill below the hero shows how many estates are represented in the user's holdings. Tapping it opens the related estate summary.

### Invest / Invite / Club actions
Home has three equal circular actions:
- **Invest** opens Marketplace.
- **Invite** opens the referral area.
- **Club** opens the private Club area.

The icon is a visual shortcut; the text label underneath tells you its purpose.

### For You card
The **For You** card highlights one featured estate when one is available. It shows a villa image, name, location, share price, and a chevron indicating that the card opens the villa page.

### Invite card
The Home invite card is a compact invitation shortcut. It uses a person-plus icon, an invitation message, and an **Invite** button. The button opens the referral area.

### My Estates
**My Estates** is a short Home preview of owned estates. It shows up to three estate rows/chips and a quiet **All my estates** link to Portfolio. The preview is intentionally short; Portfolio is the full ownership view.

### More estates text
If the user owns more estates than the Home preview displays, a small line tells them how many additional estates are not shown in the preview. It is a count, not another hidden card list.

### Activity
The rounded **Activity / View all** row is a shortcut to the transaction/activity area. **View all** means “open the complete activity list.”

### Trust footer
The small muted text at the bottom is a reassurance/disclosure element. It is intentionally quiet and should be explained as supporting information, not as a button.

## Marketplace: small elements

### Search field
The Marketplace search field lets the user search the estate list. The magnifying-glass icon indicates search. When text has been entered, the **X** button clears the search.

### Filter chips
The horizontal rounded chips narrow the estate list by category. The selected chip is visually highlighted. The chips are horizontally scrollable when they do not all fit.

Current filter concepts are:
- **All** — no category filter;
- **Featured** — featured estates;
- **New** — newer offerings;
- **Income** — income-oriented category;
- **Owner Stay** — estates associated with owner-stay presentation;
- **Resale** — secondary/resale context.

These labels describe the app's filtering categories; they are not promises about performance.

### Sort control
The sort control opens a bottom sheet with selectable sorting choices. The current choice has a checkmark.

The available sort concepts are:
- **Curated**;
- **Rental income**;
- **Entry price**;
- **Newest**;
- **Estate value**.

Selecting a row applies the sort and closes the sheet.

### Bottom sheet
A **bottom sheet** is a panel that slides up from the bottom without taking the user to a new page. It is used for focused choices such as sorting.

## Shared interaction details

### Chevron
A right-pointing chevron generally signals that an item can be opened or that there is another view/detail behind it. In right-to-left languages the direction is mirrored.

### Haptic feedback
Some selectable controls provide a small device haptic response when tapped. The haptic is feedback that the interaction was registered; it does not change the financial meaning of the action.

### Loading skeleton
A skeleton is a temporary placeholder shown while content is loading. It is not missing data and should not be interpreted as a value of zero.

### Empty state
An empty state appears when there is currently nothing to show in that section. It should explain what is empty and, where documented, provide the next useful action.

### Error state
An error state means the app could not load or complete the relevant operation. The user should follow the action offered by the screen, such as retrying or returning to a safe area.

## How Fifi should answer UI questions

For a question such as “این دکمه چیه؟”, answer in this order:

1. **What it is:** name the visible control in simple words.
2. **What it does:** describe its immediate effect.
3. **Why it exists:** explain the user's practical reason for seeing it.
4. **What happens next:** name the destination or next step when documented.

Do not answer a UI question by exposing implementation names, component names, internal identifiers, retrieval terminology, or other engineering details.


## Earnings: small elements

### Received in total
This is the total of income that has been marked as paid. It should not be confused with projected or accrued income.

### Next payout
This area gives the next payout timing when the app has a value to show. A displayed expected amount is a projection, not a guarantee.

### Distribution journey
The distribution journey explains the path an amount can move through: **Accrued → Eligible → Requested → Scheduled → Paid out**. A stage that has not been reached is not evidence that the money is lost; it simply has not reached that stage.

### Payments
The Payments section lists individual income payment entries. The summary above it can show how many payments have been received compared with the total number of entries.

### Income by estate
This section groups displayed income by villa/estate. Selecting an estate row can take the user to that estate's page.

### Income comparison bar
When shown, the horizontal bar compares the contribution of the displayed estates to the total shown in that section. It is a visual comparison, not a separate income calculation.

### Yield summary
The Yield summary can show **accrued unpaid income**, **projected monthly income**, and **locked shares**. These are separate pieces of information and should not be added together unless the app explicitly provides a total.

### No locks
If there are no active locked shares, the Yield area explains that there are currently no locked shares rather than displaying a fabricated earning amount.

## Portfolio: small elements

### Portfolio summary
The summary area gives a quick view of the portfolio, while the holding cards below provide estate-level detail.

### Holding card
A holding card represents one estate in the portfolio. It can show the number of shares, displayed value, and gain/loss information.

### Allocation bar
The Allocation bar visually shows how the portfolio is distributed among estates. It helps answer “How much of my portfolio is in each estate?”

### Holding detail sheet
Tapping a holding can open a detail sheet with more information about that position without leaving the Portfolio page.

### Locked / free shares
Where shown, **Locked** means shares currently participating in the earning program. **Free** means shares not locked and therefore available for eligible sale flows.

### Idle shares
An Idle Shares message highlights shares that are currently not locked. It can point the user toward the Earn flow when the relevant action is available.

### Open Orders
Open Orders contains buy or sell orders that have not filled yet. An open order is different from a completed transaction.

## Property page: small elements

### Photo gallery
The gallery lets the user browse the villa images. Selecting an image can open a larger image view.

### Compact top bar
The compact property header keeps the estate identity available while the user moves through the page.

### Funding ring
The circular funding indicator gives a compact visual view of Primary Offering progress. The percentage in its center is the readable progress value.

### Funding bar
The larger funding bar gives the same kind of offering-progress context in a more prominent format. It answers how much of the Primary Offering has been sold.

### Property metrics grid
The metrics grid can show **Monthly Income**, **Annual**, **Average Nightly Rate**, and **Est. Growth**. These values have different meanings: income figures relate to the model, ANR relates to the rental-rate basis, and Est. Growth is a forward-looking estimate.

### Icon points
Small icon-and-label points summarize selected property facts or highlights. They are quick-scan information, not separate financial metrics.

### About section
The About area provides the property's descriptive information and helps answer what the villa is like beyond its headline numbers.

### Income calculator
The Income calculator lets the user change the number of shares and see the corresponding displayed income estimate. The **minus** and **plus** buttons change the share quantity; the numeric field allows direct quantity entry.

### Scenario selector
The calculator can show **Conservative, Base, and Optimistic** scenario choices. A selected scenario is the scenario currently displayed by the calculator. If multiple scenarios use the same configured values in a prototype, Fifi should not describe them as meaningfully different.

### Your Position
For an owned estate, the Position area can show **Total shares, Locked shares, Free shares, Accrued income, and displayed position value**.

### Lock button
The Lock button starts the flow for placing eligible free shares into the earning program.

### Sell button
The Sell button starts the selling flow when selling is available for the current estate and position. Locked shares must first be unlocked.

### Current ownership value per share
In the resale area, this is the displayed current value per share used by the market summary. It is a current market-context figure, not a guarantee of a future sale price.

### Best asking price
The Best Asking Price is the lowest visible price at which a seller is currently asking to sell, when an ask exists.

### Best offer
The Best Offer is the highest visible price a buyer is currently offering, when a bid exists.

### Spread
The Spread is the difference between the displayed best asking price and best offer when both are available.

### Order Book
The Order Book lists visible buy and sell interest at different prices. It helps the user understand the current order flow.

### Recent Trades
Recent Trades shows recent executed trades when trade data is available. Demo-labelled activity must be understood as demonstration data.

### Sticky Buy / Sell bar
After the main hero is no longer visible, a sticky action bar keeps the relevant Buy or Buy/Sell actions available without requiring the user to scroll back to the top.

### Scarcity line
During a Primary Offering, a small line above the sticky Buy button can show how many shares remain at the displayed base price. It describes remaining offering inventory, not sales speed or future price movement.

## Property tabs: what each tab is for

### Estate / Overview
Answers: **What is this villa?** It contains the property's core facts, highlights, description, location, amenities, and other overview information.

### Income
Answers: **How is rental income modeled?** It explains the rental-rate basis, scenarios, modeled nights, revenue, costs, and the resulting income presentation.

### Ownership
Answers: **What does my share represent?** It focuses on estate value, shares, ownership position, growth presentation, and market/exit context.

### Earn
Answers: **How do I use my shares in the earning program?** It is where eligible shares can be locked or unlocked and where the lock state and accrued income are presented.

### Details
Answers: **What supporting information is available?** It contains operator, structural/legal notes, valuation information, documents, and disclosures where available.

## Common sheets and overlays

### Buy sheet
The Buy sheet collects the purchase quantity and shows the purchase summary before the user confirms and approves the wallet transaction.

### Sell sheet
The Sell sheet collects the quantity and selling terms for an eligible sale flow.

### Lock sheet
The Lock sheet is the focused control for choosing how many eligible shares to lock.

### Sort sheet
The Sort sheet lets the user choose how Marketplace results are ordered. A checkmark indicates the current choice.

### Fee schedule sheet
The Fee Schedule sheet explains the applicable buy/sell commission schedule rather than requiring the user to remember rates.

### Confirmation sheet
A confirmation sheet asks the user to review an action before it is submitted. It is a final check, not a new transaction by itself.

### Image lightbox
An image lightbox enlarges a selected property photo so details can be viewed more comfortably.

### Wallet chooser
The wallet chooser is the interface used to select a supported wallet connection route when a transaction requires a wallet.

## Fifi coverage rule

If a user points to a visible element and asks “What is this?”, Fifi should first identify the element using the wording visible to the user, then explain its purpose, then describe the immediate result of interacting with it when that behavior is documented. If the element's behavior is not documented, explain its visible meaning without inventing an action.
