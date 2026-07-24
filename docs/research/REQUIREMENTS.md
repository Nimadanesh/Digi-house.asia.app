# REQUIREMENTS — DigiHouse

> Each requirement has an ID (`R-…`), acceptance criteria, and the screen it maps to.
> "Must" = MVP gate. "Should" = stretch. "Could" = post-MVP.
> Native-Telegram look & feel is a **Must** for every screen — see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).
>
> **The hero invariant:** *an investor who owns a fraction receives rental income proportional to that fraction, paid weekly.* Requirements tagged **[HERO]** enforce it explicitly.

## Glossary
- **Property** — a real-estate asset fractionalized on-chain.
- **Share / Fraction** — the smallest ownable unit of a Property. Integer count; 1 share = smallest unit.
- **Listing** — a Property offered for fractional sale on the Marketplace.
- **Order Book** — buy/sell orders for a Property's shares (secondary market).
- **Earnings / Yield** — rental income paid to a shareholder, proportional to share, weekly. *The product's reason to exist.*
- **Payout Week** — a fixed weekly cadence (simulated in MVP) at which pending earnings flip to "Paid" and land in the wallet, driving the hero screen.
- **Block** — a Telegram "grouped list" container (raised panel on `secondary_bg`) holding stacked rows separated by hairlines. The signature UI primitive of this app.

---

## R-1 Onboarding & Role
- **R-1.1 (Must)** First-launch onboarding: ≤3 brand-intro slides, then a "Get Started" Telegram-style primary button. Slides **must** surface the weekly-yield hook on slide 1 ("Own a slice — get rent every week").
- **R-1.2 (Must)** Role selection: **Investor** or **Owner** as two large tappable rows in a Telegram-style block. Choice stored in user profile (local + backend-ready).
- **R-1.3 (Must)** Role is switchable from Settings; it changes which tabs/CTAs are prominent (Owner gets a "List a Property" entry).
- **R-1.4 (Should)** Telegram user data (name, photo) is read via the SDK and pre-filled; not editable during onboarding.
- **R-1.5 (Must)** Onboarding state persisted, so it never repeats after completion unless reset.
- **R-1.6 (Must — pitch)** A single, plain-English explainer of how proportional weekly yield works is reachable from onboarding (e.g. "Own 1% → get 1% of the rent, every Friday"). The investor must understand the deal before seeing the Marketplace.

## R-2 Wallet (TonConnect)
- **R-2.1 (Must)** "Connect TON Wallet" CTA using `@tonconnect/ui-react` (TonConnect button), rendered as a Telegram-style full-width primary button.
- **R-2.2 (Must)** On connect, read and display the user's TON address in short form (`EQ…abcd`), tabular-nums.
- **R-2.3 (Must)** Persist connection across reloads (`TonConnectUIProvider restoreConnection`); don't flash "Connect" after restore.
- **R-2.4 (Must)** Show a "Disconnected" state with CTA on Home and Marketplace when no wallet; Buy/Sell are disabled until connected.
- **R-2.5 (Could)** Support multiple wallets (Tonkeeper, MyTonWallet, etc.) via the manifest.

## R-3 Home Screen
- **R-3.1 (Must)** Header: user display name (from Telegram) + avatar/initials; respects Telegram header styling.
- **R-3.2 (Must)** Portfolio balance in USD — starts at `$0.00`, becomes the sum of owned shares' current value. Displayed XL, tabular-nums, with a TON estimate.
- **R-3.3 (Must)** Section "My Properties" — cards of properties the user holds shares in.
- **R-3.3a (Must)** Each card shows: property thumb, title/address, shares owned / total, current estimated value, and **pending weekly earnings** with the next payout countdown.
- **R-3.3b (Must — HERO)** Home prominently surfaces the **next weekly payout** (amount + countdown to payout). It is the emotional reason the user returns to the app.
- **R-3.4 (Must)** Empty state: friendly Telegram-style illustration + "Explore Marketplace" primary CTA.
- **R-3.5 (Must)** Bottom navigation: Home, Marketplace, Earnings, Portfolio (Settings via the header). See [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) for tab bar spec.

## R-4 Marketplace
- **R-4.1 (Must)** Vertical list of Listing cards (single column, mobile-first).
- **R-4.2 (Must)** Each card shows: thumbnail, title, location, total price, **share price**, shares sold/total, a funding progress bar, and **projected weekly yield per share** so the value prop is visible *before* tapping.
- **R-4.2a (Must — HERO)** Marketplace cards show **estimated weekly yield** for a share (Yieldhooks line): "≈ $X / week per share." This makes the rent story sell itself on the browse screen.
- **R-4.3 (Must)** Tap card → Property detail (Telegram back button appears).
- **R-4.4 (Should)** Filter chips: All / Funding / Fully Funded / Resale, as Telegram-style segmented control in a block.
- **R-4.5 (Should)** Search by title/location (Telegram-style search field in the header).
- **R-4.6 (Must)** Pull-to-refresh on the list with native-feeling spin.

## R-5 Property Detail
- **R-5.1 (Must)** Hero image, title, location, full description.
- **R-5.2 (Must)** Financials as a Telegram block (rows): total price, shares offered/sold/remaining, share price.
- **R-5.3 (Must)** Funding progress bar (% sold).
- **R-5.4 (Must, HERO)** A **"Weekly Yield" block row** that shows: rent/month, your projected share if you buy N shares, payout day (e.g. "Every Friday"). The math must reflect the user's chosen buy quantity live.
- **R-5.5 (Must)** Inline **Buy** control — quantity stepper + total cost (USD + TON estimate) + live projected weekly yield for that qty, confirm via TonConnect TX. Confirm uses the Telegram `MainButton` when available.
- **R-5.6 (Must)** **Sell** control visible only if the user holds shares → opens a sell-order bottom sheet (qty, price/share).
- **R-5.7 (Must)** **Order Book** — two stacked columns/lists of open buy (success-green) and sell (danger-red) orders: price, qty, cumulative; best bid/ask highlighted with the `accent` tint.
- **R-5.8 (Should)** My-position block: shares owned, avg cost, current value, unrealized PnL (green/red).
- **R-5.9 (Could)** Price sparkline (secondary-market last trades).

## R-6 Earnings Report *(the hero screen)*
- **R-6.1 (Must)** Timeline (newest first) of **weekly** earnings per owned property. The cadence reads as weekly, not "transactions."
- **R-6.2 (Must)** Each entry: property thumb, **week label**, yield amount (USD + TON, tabular), **share %**, and status pill (Paid = success, Pending = warning).
- **R-6.3 (Must)** Header summary block: **total earned (all-time)**, **this week's projected**, and a **payout countdown** to the next weekly distribution.
- **R-6.4 (Must)** Empty state: no holdings → CTA to Marketplace with the weekly-yield promise restated.
- **R-6.5 (Should)** Filter by property (single-select block rows).
- **R-6.6 (Must — HERO)** Proportional math must be **exact and displayed**: each entry shows `share%` and `=$amount` and never contradicts the Property detail's projected weekly yield for the same holding size. This is the judge-checkable proof point.

## R-7 Buy / Sell & Order Placement
- **R-7.1 (Must)** Buy flow: choose quantity → review total (and projected weekly yield) → TonConnect TX confirmation → success toast → invalidate/update Home + Portfolio + Earnings.
- **R-7.2 (Must)** Sell flow: place a **sell order** (qty, price/share) → rests in order book until matched. (MVP: matching is simulated/backend-driven; not a real on-chain matcher.)
- **R-7.3 (Must)** Cancel an open order from Portfolio → "Open Orders".
- **R-7.4 (Must)** Validation: can't buy more than remaining; can't sell more than owned; can't sell below 1 unit; can't set negative prices. Inline error text under fields.
- **R-7.5 (Must)** Error states for failed TX (rejected, insufficient balance, network) shown as Telegram-style top error toast; no state change.
- **R-7.6 (Should)** Haptic feedback (`impactOccurred`) on confirm, and `notificationOccurred('error')` on failure.

## R-8 Portfolio
- **R-8.1 (Must)** Aggregate block: total value, total invested, **total earnings (all-time + this week)**, # holdings.
- **R-8.2 (Must)** Holdings list (name, shares, value, **+earnings this week**).
- **R-8.3 (Must)** Open-orders list with cancel action.
- **R-8.4 (Should)** Allocation breakdown (horizontal bar by property).

## R-9 Platform / Non-Functional (native Telegram)
- **R-9.1 (Must)** Mobile-first; safe-area aware (top inset, notch, Telegram bottom inset). `env(safe-area-inset-*)` everywhere it matters.
- **R-9.2 (Must)** Read Telegram theme params (`bg_color`, `text_color`, `hint_color`, `button_color`, `button_text_color`, `secondary_bg_color`, `link_color`, `destructive_text_color`) and map them to the design tokens — **only** when the user enables "Use Telegram theme" in Settings (default: the DigiHouse Telegram-native palette, which already mirrors these values). See [DESIGN_SYSTEM](./DESIGN_SYSTEM.md).
- **R-9.3 (Must)** Native-Telegram look: system fonts, grouped blocks on `secondary_bg` with hairline row separators, hairline section borders, no heavy drop shadows, flat finance aesthetic.
- **R-9.4 (Must)** Use Telegram client chrome when available: the SDK header/title bar, `BackButton` on detail/sheets, `MainButton` for the primary confirm (Buy/Place Order). Hide on root tabs.
- **R-9.5 (Must)** Max content width **480px**, centered. No horizontal scroll anywhere.
- **R-9.6 (Must)** No layout shift on data load — every async area shows a skeleton in the exact shape of its content; never a spinner replacing a list.
- **R-9.7 (Must)** Every screen ships: loaded | loading skeleton | empty | error.
- **R-9.8 (Must)** Haptics: tab switches (`selectionChanged`), confirm/`impactOccurred`, errors/`notificationOccurred`, disabled where `prefers-reduced-motion`/no haptics support.
- **R-9.9 (Must)** Dark mode primary; light mode parity. Reduced-motion respected.
- **R-9.10 (Must)** TypeScript strict, **no `any`**, ESLint clean, `tsc` clean, `next build` clean (`npm run check`).
- **R-9.11 (Must)** All copy in **English** (MVP). Farsi i18n is post-MVP.
- **R-9.12 (Must)** Mock data layer behind a clear repository interface so the TON/backend swap-in is a one-folder change.
- **R-9.13 (Must — pitch)** Performance budget: first meaningful paint on a cached Telegram cold start under 1.5s on a mid-range phone; weekly-yield numbers, not chrome, are the first thing the eye lands on.

## R-10 Owner (stubbed in MVP)
- **R-10.1 (Should)** "List a Property" entry (Owner role) — form (block rows): title, location, images, total price, share count, share price. Submit → mock Listing created.
- **R-10.2 (Could)** Owner dashboard: funded %, raised amount, withdraw to wallet.

## Acceptance criteria conventions
- "**Must**" requirements are the gate for "MVP done". All **[HERO]**-tagged requirements are Must.
- Each screen ships: loaded | loading skeleton | empty | error.
- Every monetary value displays both USD and a TON estimate, tabular-nums.
- "Looks native Telegram" is a pass/fail gate — audited via the `/design-review` command against [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).
- **Weekly-yield integrity check (judge-verifiable):** for any holding size, `Home next payout`, `Property detail projected yield`, and `Earnings report paid entry` must all agree numerically. Disagreement = MVP fail.