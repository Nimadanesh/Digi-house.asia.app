# USER FLOW — DigiHouse

> Primary journeys and the full navigation map. Each step references Requirement IDs from [REQUIREMENTS.md](./REQUIREMENTS.md). Design/visual behavior references [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

## Personas
- **Aria** — Investor (small budget, first time). Wants weekly passive yield.
- **Omid** — Owner (has a property, wants liquidity). Wants to sell a fraction.
- **Sam** — Trader (buys/sells shares on the order book). Wants to speculate / provide liquidity.

All journeys happen **inside a Telegram Mini App**: launched from a Telegram chat/bot, themed by Telegram, using the Telegram header, `BackButton`, `MainButton`, and haptics. Wallet = TonConnect (Tonkeeper, etc.).

---

## Global launch & chrome behavior
1. User taps the Mini App entry point in Telegram → Telegram opens the WebView and calls `viewport.expand()` for full height.
2. The app calls `init()` / `restoreInit()`; theme params + safe-area insets are read.
3. The Telegram-provided header (title bar) shows the screen title; on root tabs only the back chevron is hidden, on detail/sheets `BackButton` is shown.
4. The persistent **bottom tab bar** is app-owned (Home · Marketplace · Earnings · Portfolio) and sits above the safe-area inset. Its background is the Telegram block color with a top hairline.
5. The Telegram **MainButton** (bottom, full-width) appears only on screens with a single primary action (Buy confirm, Place Order, Get Started), replacing any in-page duplicate.

---

## Flow 1 — First-time Investor buys a share (the canonical happy path)
| # | Action | Screen / Element | Req |
|---|---|---|---|
| 1 | Tap Mini App in Telegram | App boots; Telegram SDK inits; dark Telegram theme applied | R-9.1–9.4 |
| 2 | View ≤3 brand-intro slides; tap **Get Started** (MainButton) | Onboarding | R-1.1 |
| 3 | Pick **Investor** role row in a block; tap **Continue** | Role selection | R-1.2 |
| 4 | Land on **Home**: name shown, balance "$0.00", "My Properties" empty → **Explore Marketplace** CTA | Home (empty) | R-3.4 |
| 5 | Tap **Explore Marketplace** → see a "Connect Wallet" prompt → tap → TonConnect sheet → pick Tonkeeper → connect | Marketplace / wallet | R-2.1–2.3 |
| 6 | Address appears in header (`EQ…abcd`); Marketplace list loads (skeleton → cards) | Marketplace | R-4.1–4.2 |
| 7 | Tap a Listing card → Property detail; `BackButton` appears | Property detail | R-4.3, R-5.1 |
| 8 | Read financials block + funding bar + order book | Property detail | R-5.2–5.6 |
| 9 | Buy control: choose qty (e.g. 5) → review total $X (≈Y TON) → tap **Buy** (MainButton: "Buy 5 — $X") | Buy flow | R-5.4, R-7.1 |
| 10 | TonConnect TX confirmation (deep-link to wallet) → approve | Wallet | R-7.1 |
| 11 | Success toast (top, success-tint, haptic) → Home + Portfolio update: balance $X, property card appears with 5 shares + pending earnings | Home/Portfolio | R-3.2–3.3, R-7.1 |

### Flow 1 — alternate branches
- **R-2.4** Wallet not connected at step 9 → Buy disabled, shows "Connect Wallet" CTA in place of the button.
- **R-7.5** TX rejected/insufficient balance → red error toast, haptic error, no state change; form re-usable.
- **R-9.6** Slow network → the financials block shows a shaped skeleton, never a blank gap.

---

## Flow 2 — Weekly earnings distribution (happy path)
| # | Action | Screen | Req |
|---|---|---|---|
| 1 | Sunday 00:00 UTC — earnings credited (backend job; MVP: mock trigger/idle notification) | — | R-6.1 |
| 2 | Aria opens app → **Earnings** tab → new "Week of …" entry at top, status **Paid**, amount (USD + TON, tabular) | Earnings | R-6.1–6.2 |
| 3 | Header summary "This week" + "All-time" update; Portfolio "Total earnings" updates | Earnings/Portfolio | R-6.3, R-8.1 |
| 4 | Entry shows **share %** so Aria sees the yield is proportional to her 5/1000 shares | Earnings | core mechanism |
| 5 | Tap entry → (optional) expand to show property + week details | Earnings | R-6 |

### Flow 2 — alternates
- **R-6.4** No holdings at all → Earnings shows empty state + Marketplace CTA (no fake data).
- **Pending** entries show a **warning** pill instead of success; projected amount still shown.

---

## Flow 3 — Sell an existing share via a resting order
| # | Action | Screen | Req |
|---|---|---|---|
| 1 | Aria opens Property detail of a holding → **Sell** control is visible (she holds shares) | Property detail | R-5.5 |
| 2 | Tap **Sell** → bottom sheet opens (qty stepper, price/share field, live total) | Sell sheet | R-7.2 |
| 3 | Confirm → **Place Sell Order** (MainButton) → sheet closes with success toast | Sell sheet | R-7.2 |
| 4 | Order appears in the order book (danger-red ask row) + "Open Orders" in Portfolio | Property detail / Portfolio | R-5.6, R-8.3 |
| 5 | Sam's matching buy fills Aria's order → balance updates; earnings on her remaining shares continue | Portfolio | R-7.2 |
| 6 | (Aria may cancel the open order from Portfolio → "Open Orders" before it fills) | Portfolio | R-7.3 |

### Flow 3 — alternates
- **R-7.4** Try to sell qty > owned → field error, Place Order disabled.
- **R-2.4** Wallet disconnected → Sell hidden/disabled with "Connect Wallet".

---

## Flow 4 — Trader provides liquidity (resting bid)
| # | Action | Screen | Req |
|---|---|---|---|
| 1 | Sam connects wallet → Marketplace → opens a funded property's detail | Wallet / Property | R-2.1, R-5 |
| 2 | Inspects order book → **Buy** control → switches to "limit" intent → places a **buy order below best ask** (a bid) | Property detail | R-5.6, R-7.2 |
| 3 | Bid rests in the book (success-green row) → cancel anytime from Portfolio → "Open Orders" | Portfolio | R-7.3, R-8.3 |
| 4 | Later, a seller matches → fill → holdings appear, balance updates | Portfolio | R-7.2 |

---

## Flow 5 — Owner lists a property (Should / stubbed)
| # | Action | Screen | Req |
|---|---|---|---|
| 1 | Omid onboards, selects **Owner** role | Role selection | R-1.2 |
| 2 | "List a Property" CTA (prominent because of role) → form (block rows: title, location, image, total price, shares, share price) → submit → mock Listing created | List form | R-10.1 |
| 3 | Omid sees it in Marketplace; "Owner dashboard" block shows funded %, raised amount | Marketplace | R-10.2 |
| 4 | As shares sell, raised capital accrues → "Withdraw" to TON wallet (Could) | Owner dashboard | R-10.2 |

---

## Flow 6 — Empty / error / edge states (cross-cutting)
- **No holdings** → Home & Earnings show empty state + Marketplace CTA *(R-3.4, R-6.4)*.
- **Wallet disconnected** → Marketplace Buy/Sell disabled with a "Connect Wallet" CTA; Property detail surfaces the same *(R-2.4)*.
- **TX rejected / insufficient balance / network down** → top red error toast, error haptic, no state change *(R-7.5)*.
- **List load fails** → error card with **Retry** (Telegram-style); card replaces only the failed block, not the whole screen *(R-9.5)*.
- **No network at launch** → onboarding still renders (static); first async screen shows error + retry.
- **Address bar / horizontal scroll** → none allowed anywhere *(R-9.5)*.

---

## Navigation map (MVP)
```
TELEGRAM CLIENT CHROME
┌──────────────────────────────────────────────────────────┐
│  Telegram header (title bar) — app title; ↔ BackButton    │   (R-9.4)
│  └ hides back chevron on root tabs, shows on details       │
├──────────────────────────────────────────────────────────┤
│                                                            │
│   ROOT SCREEN (one of 4 tabs)                              │
│                                                            │
│   [Home]        [Marketplace]      [Earnings]    [Portfolio]│   (R-3.5)
│   balance       listing cards       timeline    holdings   │
│   my cards      └► Property Detail          + open orders  │
│                       ├─ hero / description                 │
│                       ├─ financials (block rows)            │
│                       ├─ funding bar                        │
│                       ├─ order book (bids/asks)             │
│                       ├─ Buy control  ◄── MainButton        │
│                       └─ Sell control ◄── bottom sheet      │
│   ◄─ Settings (from header gear, not a tab)                 │
│                  ├─ role switch                             │
│                  ├─ Telegram-theme toggle                   │
│                  └─ disconnect wallet                       │
│                                                            │
├──────────────────────────────────────────────────────────┤
│ BOTTOM TAB BAR (app-owned, Telegram-styled):               │
│   Home · Marketplace · Earnings · Portfolio                 │   (R-3.5)
│   (+ Owner role surfaces a "List" CTA)                     │
├──────────────────────────────────────────────────────────┤
│ MainButton (native, full-width): appears only on screens    │
│ with a single primary action (Get Started, Buy, Place Sell) │   (R-9.4)
└──────────────────────────────────────────────────────────┘
```

### Route ↔ screen ↔ primary action
| Route | Screen | Primary action | MainButton? | BackButton? |
|---|---|---|---|---|
| `/` | redirect → `/home` (or `/onboarding` first run) | — | no | no |
| `/onboarding` | brand intro → role | Get Started / Continue | yes | no |
| `/home` | Home | Explore Marketplace (only when empty) | no | no |
| `/marketplace` | Marketplace | (tap a card) | no | no |
| `/marketplace/property/[id]` | Property detail | Buy (or Sell sheet) | yes (confirm) | yes |
| `/earnings` | Earnings report | (read; choose owned property) | no | no |
| `/portfolio` | Portfolio | Cancel open order | no | no |
| `/settings` | Settings | (toggles) | no | no |
| `/settings/list` *(Owner Should)* | List a property form | Submit | yes | yes |

### Tab back-stack rules (native feel)
- Selecting a tab resets that tab to its root (no deep nested stack kept when switching tabs).
- Tapping `BackButton`/system back within a tab pops that tab's stack; at root of a tab, back does nothing (the Mini App stays open).
- Opening Property detail pushes onto the current tab's stack; `BackButton` is visible only when the stack depth > 1.
- The bottom tab bar is always visible on tab roots; sheets/modals cover it with a scrim while open.

### Haptics map (every journey)
- Tab switch → `selectionChanged`.
- Pull-to-refresh trigger → `impactOccurred('light')`.
- Buy/Place-Order confirm → `impactOccurred('medium')` + `notificationOccurred('success')` on done.
- TX error / validation block → `notificationOccurred('error')`.
- No haptics if the SDK reports no support or reduced-motion is on.