# USER FLOW — DigiHouse

> Primary journeys and the full navigation map. Each step references Requirement IDs from [REQUIREMENTS.md](./REQUIREMENTS.md). Design/visual behavior references [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).
>
> **Design lens:** every user here has **low digital literacy**. Each flow is short enough to be explained out loud in one sentence. We optimize for *“tap the obvious button”*, never “choose the right menu”. Every screen has **one** primary action; ambiguity is a bug.

## Personas
- **Aria** — Investor (small budget, first time; not crypto-savvy). Wants to put a little money in and **see rent arrive every week**.
- **Omid** — Owner (has a property, wants liquidity). Wants to sell a fraction, not the whole house.
- **Sam** — Trader (comfortable with order books). Wants to buy/sell shares for profit or to provide liquidity.

All journeys happen **inside a Telegram Mini App**: launched from a Telegram chat/bot, themed by Telegram, using the Telegram header, `BackButton`, `MainButton`, and haptics. Wallet = TonConnect (Tonkeeper, etc.).

## Simplicity principles (how the flows are designed)
1. **One screen = one decision.** If a screen asks two unrelated things, split it.
2. **Numbers before words.** The money, the weekly yield, and the share % are louder than the marketing copy.
3. **The weekly payout is always visible** from the moment Aria owns anything. It is the reason she opens the app.
4. **Never block the happy path.** Wallet connect, errors, and edge states fork off the main flow, they never interrupt it.
5. **Tap targets ≥ 44px. Confirm via the Telegram MainButton.** Big, full-width, hard to mis-tap.

---

## Global launch & chrome behavior
1. User taps the Mini App entry point in Telegram → Telegram opens the WebView and calls `viewport.expand()` for full height.
2. The app calls `init()` / `restoreInit()`; theme params + safe-area insets are read.
3. The Telegram-provided header (title bar) shows the screen title; on root tabs only the back chevron is hidden, on detail/sheets `BackButton` is shown.
4. The persistent **bottom tab bar** is app-owned (Home · Marketplace · Earnings · Portfolio) and sits above the safe-area inset. Its background is the Telegram block color with a top hairline.
5. The Telegram **MainButton** (bottom, full-width) appears only on screens with a single primary action (Buy confirm, Place Order, Get Started), replacing any in-page duplicate.

---

## Flow 0 — Onboarding (first-time entry)
**User Story**
> *As a first-time visitor, I want to understand what DigiHouse does in under 30 seconds and pick my role with one tap, so I can start exploring without confusion.*

**Steps**
| # | Action | Screen / Element | Req |
|---|---|---|---|
| 1 | Tap Mini App in Telegram | App boots; Telegram SDK inits; dark Telegram theme applied | R-9.1–9.4 |
| 2 | View ≤3 brand-intro slides; **slide 1 must show the weekly-yield hook** ("Own a slice — get rent every week"). Tap **Get Started** (MainButton) | Onboarding | R-1.1 |
| 3 | Pick **Investor** or **Owner** as two large tappable rows in a block; tap **Continue** (MainButton) | Role selection | R-1.2 |
| 4 | Role saved; onboarding marked complete; never shown again unless reset | — | R-1.5 |

**Why it's simple:** two taps (Get Started → role row) and she's in. The rent story lands on slide 1 before any account language.

**Alternates**
- **R-1.4** Telegram name/photo read from SDK; pre-filled, not editable here.
- Returning user → onboarding skipped entirely; goes straight to Home.

---

## Flow 1 — Browse & buy a fraction (the canonical happy path)
**User Story**
> *As Aria, I want to find a property, see exactly how much rent I'll get per week, and buy a share in under a minute — all inside Telegram, without leaving the chat.*

**Steps**
| # | Action | Screen / Element | Req |
|---|---|---|---|
| 1 | Land on **Home**: name shown, balance "$0.00", "My Properties" empty → **Explore Marketplace** CTA (the only big button) | Home (empty) | R-3.4 |
| 2 | Tap **Explore Marketplace** → prompted to **Connect Wallet** → TonConnect sheet → pick Tonkeeper → connect | Marketplace / wallet | R-2.1–2.3 |
| 3 | Address appears in header (`EQ…abcd`); Marketplace list loads (skeleton → cards). **Each card shows estimated weekly yield per share** ("≈ $X / week per share") | Marketplace | R-4.1–4.2, R-4.2a |
| 4 | Tap a Listing card → Property detail; `BackButton` appears | Property detail | R-4.3, R-5.1 |
| 5 | Read financials block + funding bar + **Weekly Yield block row** (rent/month → your projected share → payout day "Every Friday") | Property detail | R-5.2–5.4 |
| 6 | Buy control: choose qty (e.g. 5) → **total cost** (USD + TON estimate) and **live projected weekly yield for that qty** update as she types → tap **Buy** (MainButton: "Buy 5 — $X") | Buy flow | R-5.5, R-7.1 |
| 7 | TonConnect TX confirmation (deep-link to wallet) → approve | Wallet | R-7.1 |
| 8 | Success toast (top, success-tint, haptic) → Home + Portfolio update: balance $X, property card appears showing 5 shares + **pending weekly earnings** | Home/Portfolio | R-3.2–3.3, R-7.1 |

**The emotional beat:** step 6 is where Aria sees "you'll earn ≈ $Y every Friday" *before* she confirms. The price isn't a cost — it's a paycheck she's buying.

**Alternate branches**
- **R-2.4** Wallet not connected at step 6 → Buy disabled, "Connect Wallet" CTA replaces the button.
- **R-7.5** TX rejected / insufficient balance → red error toast, error haptic, no state change; form unchanged and re-usable.
- **R-9.6** Slow network → financials block shows a shaped skeleton, never a blank gap.

---

## Flow 2 — Weekly rental income *(the hero flow; most exciting)*
**User Story**
> *As Aria, I want to open the app each week and see that rent has actually landed in my wallet — proportional to my share — so I trust the system and keep my money in.*

**This flow is the product's heartbeat.** It must feel like the moment a paycheck arrives.

**Steps**
| # | Action | Screen | Req |
|---|---|---|---|
| 1 | **Weekly cadence trigger** — every Friday 00:00 UTC (MVP: mock scheduler; future: on-chain job). For each property with rent that week, distribute rent × `shareRatio` to every shareholder. | — | R-6.1 |
| 2 | Aria opens the app → a small unread dot appears on the **Earnings** tab; Home's **next payout** crossed to **just paid** | Home → Earnings | R-3.3b |
| 3 | Tap **Earnings** → top entry "Week of Jul 25" appears, status **Paid**, amount (USD + TON, tabular), and her **share %** (e.g. 0.5%) | Earnings | R-6.1–6.2 |
| 4 | Header summary updates: **"This week +$X.XX"** and **"All-time $Y"** with a payout countdown to next Friday | Earnings | R-6.3 |
| 5 | Entry expands (tap) to show: property thumb, week, share %, amount, and the **"Rent/month of this property"** so the math is provably proportional: `rent × share% = my payout` | Earnings | R-6.6 |
| 6 | Portfolio "Total earnings" updates; Home "My Properties" cards show updated **pending (next week)** | Portfolio / Home | R-8.1, R-3.3a |

**Why it's exciting**
- **Frequency.** A weekly cadence means she gets a reason to come back 52 times a year, not once.
- **Proportional proof.** The screen literally shows `rent × your share% = what you got`. No fine print.
- **Honest credibility.** Every "Paid" entry on the hero screen is **visibly marked `simulated`** (badge + canonical copy "simulated weekly payout · on-chain verifiable post-MVP"). The entry exposes `txHash` as a **mock placeholder**, and proportional math (`rent × share% = payout`) is judge-verifiable now. **Real on-chain** weekly payout distribution is a post-MVP TON Distribution contract (DATA_MODELS §6 on-chain shape).

**Alternates**
- **R-6.4** No holdings → Earnings shows empty state + Marketplace CTA, with the weekly-yield promise restated. Never fake data.
- **Pending** entries show a **warning** pill instead of success; the projected amount is still shown so the rhythm is visible ahead of time.
- **R-7.6** Open of a "Paid" entry → light `impactOccurred` haptic, a small celebration, never a full-screen takeover.

---

## Flow 3 — Sell a fraction (place a resting sell order)
**User Story**
> *As Aria, I want to turn some of my shares back into money whenever I want, without hunting for a buyer — I just set my price and let it sit until someone buys.*

**Steps**
| # | Action | Screen | Req |
|---|---|---|---|
| 1 | Aria opens Property detail of a holding → **Sell** control is visible (she holds shares) | Property detail | R-5.6 |
| 2 | Tap **Sell** → bottom sheet opens (qty stepper, price/share field, live total) | Sell sheet | R-7.2 |
| 3 | Confirm → **Place Sell Order** (MainButton) → sheet closes with success toast | Sell sheet | R-7.2 |
| 4 | Order appears in the order book (danger-red ask row) + "Open Orders" in Portfolio | Property detail / Portfolio | R-5.7, R-8.3 |
| 5 | Later, Sam's matching buy fills Aria's order → balance updates; earnings on her remaining shares continue | Portfolio | R-7.2 |
| 6 | (Aria may cancel the open order from Portfolio → "Open Orders" before it fills) | Portfolio | R-7.3 |

**Alternates**
- **R-7.4** Try to sell qty > owned → field error under the stepper, Place Order disabled.
- **R-2.4** Wallet disconnected → Sell hidden / disabled with "Connect Wallet".

---

## Flow 4 — Dashboard (Home) daily return
**User Story**
> *As Aria, I want a single screen that shows what I own, what it's worth, and when my next rent arrives — so I don't have to dig.*

**Steps**
| # | Action | Screen | Req |
|---|---|---|---|
| 1 | Open app → **Home** loads from portfolio repo (skeleton → filled) | Home | R-3.1–3.3 |
| 2 | Header: name + avatar. Big balance: total value (USD) + TON estimate | Home | R-3.1–3.2 |
| 3 | **Next payout block** prominently shown: "Next rent Friday — +$X.XX" with countdown | Home | R-3.3b |
| 4 | "My Properties" cards: thumb, title, shares owned / total, value, pending weekly earnings | Home | R-3.3a |
| 5 | Tap any card → Property detail; tap **Earnings** tab → Flow 2 timeline | Home | R-3.3 |

**Alternates**
- **R-3.4** No holdings → friendly illustration + "Explore Marketplace" CTA (the only big action).
- **R-2.4** Wallet disconnected → header shows "Connect" instead of address; cards still render read-only.

---

## Flow 5 — Trader provides liquidity (resting bid)
**User Story**
> *As Sam, I want to place a buy order below the best ask and let it rest until a seller hits my price, so I provide liquidity for a profit.*

**Steps**
| # | Action | Screen | Req |
|---|---|---|---|
| 1 | Sam connects wallet → Marketplace → opens a funded property's detail | Wallet / Property | R-2.1, R-5 |
| 2 | Inspects order book → **Buy** control → switches to "limit" intent → places a buy order below best ask (a bid) | Property detail | R-5.7, R-7.2 |
| 3 | Bid rests in the book (success-green row) → cancel anytime from Portfolio → "Open Orders" | Portfolio | R-7.3, R-8.3 |
| 4 | Later, a seller matches → fill → holdings appear, balance updates | Portfolio | R-7.2 |

---

## Flow 6 — Owner lists a property (Should / stubbed in MVP)
**User Story**
> *As Omid, I want to offer a percentage of my property to investors so I can raise cash without selling my home.*

**Steps**
| # | Action | Screen | Req |
|---|---|---|---|
| 1 | Omid onboards, selects **Owner** role | Role selection | R-1.2 |
| 2 | "List a Property" CTA (prominent because of role) → form (block rows: title, location, image, total price, shares, share price) → submit → mock Listing created | List form | R-10.1 |
| 3 | Omid sees it in Marketplace; "Owner dashboard" block shows funded %, raised amount | Marketplace | R-10.2 |
| 4 | As shares sell, raised capital accrues → "Withdraw" to TON wallet (Could) | Owner dashboard | R-10.2 |

---

## Flow 7 — Empty / error / edge states (cross-cutting)
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
│   next payout   └► Property Detail          + open orders  │
│   my cards              ├─ hero / description               │
│                         ├─ financials (block rows)         │
│                         ├─ Weekly Yield block ◄── HERO     │
│                         ├─ funding bar                      │
│                         ├─ order book (bids/asks)           │
│                         ├─ Buy control  ◄── MainButton      │
│                         └─ Sell control ◄── bottom sheet     │
│   ◄─ Settings (from header gear, not a tab)                │
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
- **Weekly payout arrives / "Paid" entry opened** → `notificationOccurred('success')` (a small celebration).
- TX error / validation block → `notificationOccurred('error')`.
- No haptics if the SDK reports no support or reduced-motion is on.

## Flow-to-Requirement traceability (audit aid)
| Flow | Covers | Hero? |
|---|---|---|
| 0 Onboarding | R-1.* | pitch |
| 1 Browse & Buy | R-2–5, R-7.1 | yes (yield at buy) |
| 2 Weekly Rental Income | R-6.*, R-3.3b | **THE hero** |
| 3 Sell | R-5.6, R-7.2–7.4 | — |
| 4 Dashboard return | R-3.*, R-8.1 | yes (next payout) |
| 5 Trader bid | R-5.7, R-7.3 | — |
| 6 Owner list | R-10.* | — |
| 7 Edge/error | R-2.4, R-7.5, R-9.5 | — |