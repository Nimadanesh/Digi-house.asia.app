# DigiHouse — Visual QA Checklist (pre-competition)

> Run this checklist in the Telegram Beta WebApp iframe (or the `@BotFather` Preview Button) on an
> actual device/simulator before judging. The dev environment mocks the Telegram SDK — these items
> can only be verified in real Telegram.

## 1. Viewport sweep — no horizontal scroll, safe-area respected

For EACH of the 5 tabs + Property detail, resize the WebApp to 360 / 390 / 480 px widths and confirm:

- [ ] **No horizontal scroll** on any screen (use the WebApp width slider or device simulator).
- [ ] **Header**: bar height grows by the iOS safe-area inset; the centered title doesn't clip.
- [ ] **Bottom tab bar**: 4 labels visible, active tab = `--primary` (Telegram blue), inactive = muted gray.
- [ ] **Block gutters**: every `bg-card` block sits 16px (px-4) from the canvas edge on both sides.

### Per-screen
- [ ] **Home**: balance hero `1.625rem/700` + `tracking-[-0.02em]` reads crisp; "Next rent" hero is neutral (NOT green); my-properties mini-cards align thumb + name + pending (warning) text.
- [ ] **Marketplace**: skeleton thumb matches the real card `aspect-[16/10]` on first load; PropertyCard funding % row + FundingBar render; WeeklyYieldCallout reads `≈ $X.XX / week per share` in `--success`.
- [ ] **Property detail**: BackButton chevron appears in the TG header and navigates back; MainButton shows "Buy N — $X.XX" in Telegram blue (#3390ec) at the bottom; the app tab bar is HIDDEN while MainButton is shown; OrderBook renders 3 columns (Price/Qty/Cumulative) with the best bid `text-success` + `bg-accent` strip and best ask `text-danger` + `bg-accent`.
- [ ] **Earnings**: disclaimer renders at the top of the scroll area; hero "This week projected" `1.625rem/700` neutral `--foreground` with the Pending pill in `--warning`; a Paid entry shows the muted "simulated" badge; expanding an entry aligns the disclosure content under the property NAME (not the thumb); the disclosure "Simulated payout · tx hash is a placeholder" line renders.
- [ ] **Portfolio**: "Total earnings" value is GREEN (`--success`) — honest (paid sum); "Next payout" is neutral; my-position PnL shows ArrowUp + `+` in `--success` for an appreciated holding; open-orders block (if any) renders.
- [ ] **Settings**: disclaimer renders at the bottom; the theme Toggle has `role=switch` accessible name "Use Telegram theme"; toggling it (Appearance → ON) live-applies the Telegram color scheme (the app re-reads `themeParams`).

## 2. Real-Telegram behavior smoke

- [ ] **BackButton** on Property detail: tapping the on-screen TG back chevron returns to the previous tab/route (Sprint A C1 wired `router.back()`).
- [ ] **MainButton** on Property detail Buy screen: tapping "Buy N — $X.XX" triggers a TonConnect modal (testnet). Confirm the modal opens and, on confirm/reject, the toast renders ("Buy confirmed (simulated)" / "Buy failed"). Haptic fires on impact + notification. Confirm the button is Telegram blue (#3390ec) regardless of the user's live-theme toggle (this Task 5's polish).
- [ ] **Haptics**: tab switches fire `selectionChanged`; Buy confirm fires `impact("medium")` + `notification("success")` or `note("error")`.
- [ ] **Viewport expand**: the WebApp expands on mount (no scroll bounce on the bottom safe-area).
- [ ] **Theme**: with the Telegram theme toggle OFF, the app stays DigiHouse static dark; ON, the app re-themes to the user's Telegram palette — BUT the MainButton Buy retains `#3390ec` (Task 5 pins it).
- [ ] **Orientation change** (mobile): no layout collapse; the MainButton stays bottom-most; blocks re-gutter.

## 3. Known things to eyeball (unit tests can't catch these)

- [ ] **OrderBook best-row accent band**: the `bg-accent -mx-4 px-4` strip spans full-width inside the Block's `overflow-hidden` rounded corners — no horizontal overflow, the strip meets the center divider cleanly.
- [ ] **Earnings disclosure alignment**: the 48px lead spacer puts the disclosure content exactly under the property name; the hairline stays flush across the 16px inset.
- [ ] **FundingBar**: the scaleX fill animates 280ms left-to-right on first reveal; under `prefers-reduced-motion` it renders instantly (no animation).
- [ ] **Toast**: the Buy toast enters 200ms ease-out, exits 160ms (faster); top-center, `mt-[max(env(safe-area-inset-top),8px)]`; auto-dismisses in 3s.
- [ ] **Skeleton → content swap**: instant (no cross-fade on entire screens). The skeleton matches the final shape so nothing jumps.

## 4. Honest-copy spot-checks (re-verify nothing regressed)

- [ ] Earnings top: `"simulated weekly payout · on-chain verifiable post-MVP"` renders ONCE.
- [ ] Settings bottom: the same disclaimer renders ONCE.
- [ ] Portfolio: NO disclaimer (per design).
- [ ] Buy toast text: `"Buy confirmed (simulated)"` (never `"Buy confirmed"` alone — the `(simulated)` suffix is the honesty contract).
- [ ] Paid Earnings entry: `"Paid"` pill + muted `"simulated"` capsule; expanding shows `"Simulated payout · tx hash is a placeholder"`.
- [ ] No screen anywhere claims rent "landed in your wallet", is "on-chain", or is "verifiable now".

---

## Appendix — unit-test coverage (post Sprint D, 89/89 green)

Pure-logic (vitest):
- `format.test.ts` — `usd`/`ton`/`shortAddr`/`pct`/`weekLabel`/`weeklyRent`/`projectedYield`/`payoutCountdown`
- `lib/mock/__tests__/{seed,transaction}.test.ts` — mock data shapes + buy mutation
- `lib/ton/__tests__/{address,nano,network,sendTx}.test.ts` — TON address/nano/network/sendTx
- `lib/__tests__/integrity.test.ts` — weekly-yield R-6.6 integrity (projected === paid for same holding+week)
- `stores/__tests__/ui.store.test.ts` — `mainButtonActive` flag

Component render (RTL + jsdom):
- `__sanity__/sanity.test.tsx` — harness proof
- `StatusPill.test.tsx` — Paid pill + muted simulated badge + warning/danger variants
- `EarningsEntryRow.test.tsx` — paid vs Pending disclosure, simulated txHash line, `tnum`
- `MyPositionBlock.test.tsx` — PnL up `text-success`/`+` vs down `text-danger`/U+2212 `−`
- `OrderBook.test.tsx` — 3-column render incl Cumulative, best-row `bg-accent`(?!/), semantic tints
- `FundingBar.test.tsx` — `scaleX` + `transform-origin: left` + `var(--ease-tg-out)` token, `funded` color, clamp
- `EmptyState.test.tsx` — 120px Building2 glyph, H2 `text-[0.9375rem] font-semibold`
- `Toggle.test.tsx` — `role="switch"` + `aria-checked`, `bg-primary`/`bg-surface-2`, click flips onChange
- `WalletBadge.test.tsx` — renders null when disconnected

Page integration (mocked hooks):
- `earnings/page.test.tsx` — `PAYOUT_DISCLAIMER` once; hero `$33.75` `tnum`; 4 states
- `portfolio/page.test.tsx` — Total earnings `text-success` (honest paid), Next payout `text-foreground` + `not.toHaveClass("text-success")` (CORE honesty gate), NO disclaimer, 4 states
- `settings/page.test.tsx` — `PAYOUT_DISCLAIMER` once; section labels; Toggle a11y