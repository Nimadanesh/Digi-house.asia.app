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
