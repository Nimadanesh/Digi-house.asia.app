# Phase 3 Hero-First Subset — Design

> Spec for Phase 3's hero-first subset: Marketplace + Property detail + Buy flow + Earnings hero.
> Ships the canonical happy path (USER_FLOW Flow 1) and the hero flow (USER_FLOW Flow 2) end-to-end
> so the weekly-yield loop is demonstrable judge-ready.
>
> Status: **Approved** 2026-07-24. Written against `HEAD = ff81591` (Phase 2 foundation complete).
> Stacks on the Phase 2 foundation (commits `b34cbfb`..`ff81591`) without touching `lib/ton/**`,
> `lib/telegram/**`, `lib/api/**`, or `lib/mock/**` contracts beyond a single small enhancement
> to `MockTxRepo.buy()` (Task 1) so it actually persists the new share count + Transaction.
>
> Execution approach: **Approach A — vertical, feature-by-feature** (each task ships a screen that
> boots inside the existing AppShell; the weekly-yield loop grows demonstrably with each task).
>
> Execution method: **Subagent-Driven Development** (fresh implementer subagent per task + task
> reviewer + fix subagents + final whole-branch review), same as Phase 2.

## 1. Goal

Deliver USER_FLOW Flow 1 (Browse & Buy) + Flow 2 (Weekly Rental Income) so the product's
heroic promise — *own a slice, see rent arrive every Friday* — is end-to-end demonstrable:
Aria connects a Tonkeeper testnet wallet, browses a property with visible per-share weekly
yield, taps a card, sets a quantity, sees the live projected weekly yield for that qty,
confirms via Telegram MainButton + Tonkeeper deep-link, gets a success toast (honestly
labeled "simulated"), and ~60 seconds later (the mock cadence) the Earnings screen shows
the rent arrive — proportional, paid, with the simulated badge on the pill and the
proportional-math line exposed as judge-verifiable proof.

Closes these requirements (all Must unless marked):
- **R-3.3b [HERO]** — Home's next weekly-payout block (amount + countdown).
- **R-4.1, R-4.2, R-4.2a [HERO]** — Marketplace vertical list, card content, per-card projected weekly yield callout.
- **R-4.3** — tap card → Property detail.
- **R-4.4 (Should)** — filter chips (All / Funding / Funded / Resale) if the cost is cheap in Task 2.
- **R-5.1–5.4 [R-5.4 HERO]** — Property detail hero image + financials Block + funding bar + the Weekly-Yield block row with live-qty math.
- **R-5.5** — inline Buy control (qty stepper + total USD+TON + live projected weekly yield) + MainButton confirm.
- **R-5.7** — read-only Order Book (bids green / asks red / best row `bg-accent`).
- **R-6.1, R-6.2 [HERO]** — Earnings weekly timeline, each entry with thumb + week label + amount USD+TON + share % + Paid/Pending pill.
- **R-6.3** — Earnings summary block: all-time + this-week-projected + payout countdown.
- **R-6.4** — Earnings empty state when no holdings.
- **R-6.6 [HERO]** — proportional math is exact AND displayed; never contradicts Property detail projected yield for the same holding size.
- **R-7.1** — Buy flow: qty → review total + projected weekly yield → TonConnect TX confirm → success toast → invalidate Home + Portfolio + Earnings.
- **R-7.4** — validation: qty ≤ remaining, qty ≥ 1, no negative.
- **R-7.5** — failed-TX states (rejected / insufficient / network) → top error toast, error haptic, no state change.
- **R-7.6 (Should)** — haptic feedback on confirm + on error.
- **Weekly-yield integrity check** (REQUIREMENTS §"Acceptance criteria conventions") — for any holding size, Home next-payout ≡ Property detail projected yield ≡ Earnings paid amount. Disagreement = MVP fail. Landed as the **Task 6 final gate** (a vitest, not a per-task burden).

## 2. Non-goals (explicitly deferred to Phase 4)

- **Sell sheet + Place Sell Order** (R-5.6, R-7.2) — Phase 4.
- **Cancel open order from Portfolio** (R-7.3) — Phase 4.
- **Portfolio screen real content** beyond a read-only summary (the placeholder stays a skeleton; Phase 4 fills the holdings list + open-orders UI).
- **Dedicated Transaction history screen/page** — Phase 4. (Buy still produces a `Transaction` row via `MockTxRepo.buy()` surfaced in the success toast; no history list yet.)
- **Onboarding** (R-1) — dedicated later phase.
- **My-position block on Property detail** (R-5.8) — Phase 4.
- **Price sparkline** (R-5.9) — Phase 5 polish.
- **Pull-to-refresh** (R-4.6) and **search** (R-4.5) — Phase 4 polish. TanStack Query already invalidates on `tickPayout`, so the list effectively self-refreshes on the mock cadence.
- **Framer Motion Pending→Paid crossfade** — Phase 5 polish (DESIGN_SYSTEM §"Weekly-payout motion"). Phase 3 swaps instant on tick.
- **Toast entrance/exit micro-animation beyond CSS transitions** — Phase 5.

## 3. Architecture

Pure UI on top of the Phase 2 foundation. **No new `lib/ton`, `lib/telegram`, or `lib/api`
files.** One small enhancement to `lib/mock/transaction.ts` (`MockTxRepo.buy()` actually
persists the new share count + pushes a `Transaction` with synthetic `txHash`) — Task 1,
single-file change. New components live under `src/components/{property,earnings,common}/`;
new hooks under `src/hooks/`.

### Buy → optimistic update data flow

```
BuyControl.confirm
  → useTelegram().haptics.impactOccurred('medium')
  → useBuyShares.mutateAsync({ propertyId, quantity, priceUsdPerShare })
      ├─ useTonConnect().send({ toFriendlyAddress: property.ownerWalletAddress,
      │                       nanoTon: toNanoSafe("0.01"),         // testnet stub
      │                       memo: `buy ${quantity} shares of ${propertyId}` })
      │   └─ returns SendTxResult { ok, boc?, txHash: "simulated:<uuid>", error? }
      ├─ on SendTxResult.ok === true:
      │     await getRepo().tx.buy({ propertyId, quantity, priceUsdPerShare })
      │       └─ hardened MockTxRepo.buy():
      │            • pushes Transaction{ ..., status:"success",
      │                                 txHash: makeSyntheticTxHash() }
      │            • mutates investor's Holding for propertyId:
      │                sharesOwned += quantity
      │                avgCostUsd   = weighted-avg
      │                currentValueUsd = sharesOwned * property.sharePriceUsd
      │                shareRatio = sharesOwned / property.totalShares
      │                pendingWeekEarningsUsd = weeklyRent(property.annualRentUsd) * shareRatio
      │            • returns the new Transaction
      │     qc.invalidateQueries(["portfolio"])
      │     qc.invalidateQueries(["earnings"])
      │     qc.invalidateQueries(["marketplace"])
      │     qc.invalidateQueries(["property", propertyId])
      │     qc.invalidateQueries(["orderBook", propertyId])
      │     haptics.notificationOccurred('success')
      │     toast.success("Buy confirmed (simulated)")   ← honest label, never "on-chain"
      └─ on SendTxResult.ok === false or thrown:
            haptics.notificationOccurred('error')
            toast.error(result.error ?? "Buy failed")
            BuyControl form unchanged, re-usable
```

No persistent DB. The mock lives in memory and resets to seed on refresh — acceptable
per Phase 2's "MVP uses in-memory mock" decision.

### MVP honesty contracts (non-negotiable, enforced throughout)

1. **`mock/transaction.ts`** stamps `makeSyntheticTxHash()` on every `Transaction` produced
   by `buy()`. No real-looking hash. EVER.
2. **`constants.ts`** already owns `PAYOUT_DISCLAIMER = "simulated weekly payout ·
   on-chain verifiable post-MVP"` — the Earnings page renders it exactly once.
3. **`StatusPill`** (Phase 2 built) supports `simulated` prop; the Paid pill on the
   Earnings screen is rendered with `simulated` so the muted `"simulated"` capsule appears
   as a sibling, never finance-colored.
4. **Buy success toast** text is `"Buy confirmed (simulated)"`. Never "on-chain",
   "in your wallet", "verifiable", "settled". The `SendTxResult.txHash` returned from
   a buy is the synthetic `"simulated:<uuid>"`; the toast may reference it as "tx:
   simulated:…" but not as a real hash.
5. **EarningsEntryRow expandable detail** shows `Rent this week $X × your 0.5% = $Y`
   + a muted disclosure `"Simulated payout · tx hash is a placeholder"`.
6. The `thisWeekProjectedUsd` naming (not `thisWeekUsd`) is used consistently.

## 4. Tech choices (faithful to TECH_STACK.md)

| Concern | Choice | Rationale |
|---|---|---|
| Async cache | TanStack Query v5 (Phase 2 wired) | New hooks wrap `useQuery` + `useMutation`. No new provider. |
| Styling | Tailwind v4 + existing DESIGN_SYSTEM tokens | No new tokens. Reuses `Block/Row/Skeleton/EmptyState/StatusPill`. |
| Animation | CSS transitions only (Framer Motion deferred to Phase 5) | Per DESIGN_SYSTEM "CSS transitions for toasts/orders/list items". |
| Wallet | `useTonConnect().send()` (Phase 2 built) | Reuses the as-built 0.01 TON testnet stub + synthetic `txHash`. No `lib/ton` changes. |
| Telegram chrome | `useTelegram().mainButton` + `haptics` (Phase 2 built) | `MainButtonBridge` already hides the button on all routes — Phase 3 Property detail overrides per-route via `mainButton.setParams({text, isEnabled})` + `onClick`. |
| Math/format | `format.usd/ton/weeklyRent/projectedYield/shortAddr/pct/weekLabel` (Phase 2 built) | Plus one small new pure helper `format.payoutCountdown(nowMs): string` → `"in 3d 4h"` (Task 1 TDD). |
| Haptics | `useTelegram().haptics` (Phase 2 built) | Per USER_FLOW §"Haptics map": Buy confirm `impactOccurred('medium')` + `notificationOccurred('success')` on done; error toast `notificationOccurred('error')`; Paid entry open `notificationOccurred('success')`. Tab switches already wired. |

## 5. File structure (ownership-justified — one concern per file, ≤350 lines soft)

### New components (all presentational; data via hooks)
```
src/components/property/
  PropertyCard.tsx           # list variant: thumb + title + location + funding bar + yield callout; whole-card tap
  FundingBar.tsx             # h-[6px] track + fill via transform: scaleX() (no width animation)
  PropertyDetail.tsx         # composition: hero image + Block financials + WeeklyYieldCallout + FundingBar + OrderBook + BuyControl
  OrderBook.tsx              # read-only bids/asks lists in a Block; best row bg-accent; success/danger rows
  BuyControl.tsx             # qty stepper (44px +/- hit areas) + total (USD+TON) + live projected weekly yield
  WeeklyYieldCallout.tsx     # recurring inline element: "≈ $X / week per share" | "Next payout: Fri, $X"
src/components/earnings/
  EarningsTimeline.tsx       # Block of rows (thumb + property + week + amount + StatusPill); newest first
  EarningsSummaryBlock.tsx   # header summary: all-time USD + this-week-projected + payout countdown
  EarningsEntryRow.tsx       # one row + tap-expandable proportional-math line + simulated disclosure
  PayoutCountdown.tsx        # the next-Friday countdown (subscribes to usePayoutCountdown ticker)
src/components/common/
  Toast.tsx                  # NEW top-center toast (success/error variants); presentational; interruptible CSS transitions
```

### New hooks
```
src/hooks/
  useBuyShares.ts            # useMutation: send TX -> on ok call getRepo().tx.buy -> invalidate + toast/haptics via callbacks
  useProperty.ts             # useQuery(["property", id], () => getRepo().marketplace.get(id)) ; composes useOrderBook(id)
  usePayoutCountdown.ts      # 1s ticker state returning ms-to-next-Friday-UTC; pure hook, no network
  index.ts                    # barrel — add the 3 new hooks
```

### Modified files
```
src/lib/mock/transaction.ts  # HARDEN MockTxRepo.buy(): persist new share count + push Transaction (Task 1)
src/lib/format.ts            # add payoutCountdown(nowMs): string (Task 1, TDD)
src/lib/format.test.ts       # add payoutCountdown tests (Task 1, TDD)
src/app/(app)/marketplace/page.tsx         # useMarketplace -> PropertyCard list / EmptyState / DisconnectedState / retry
src/app/(app)/property/[id]/page.tsx       # useProperty -> PropertyDetail composition
src/app/(app)/earnings/page.tsx            # useEarnings -> EarningsSummaryBlock + EarningsTimeline + PAYOUT_DISCLAIMER
src/app/(app)/home/page.tsx                # usePortfolio -> balance block + PayoutCountdown + my-properties mini-cards / EmptyState
```

### No new files in
`lib/ton/**`, `lib/telegram/**`, `lib/api/**`, `lib/query/**`, `stores/**`, `public/**`.
The phase reuses the foundation as-built.

## 6. Execution order — 6 tasks

Each task ends with: `npm run check` (lint + typecheck + build) green; one commit per task
(with surgical fix commits appended if reviews find Critical/Important findings); review
gate: implementer subagent → task reviewer → fix-if-needed → re-review → mark complete.

### Task 1 — Mock buy persistence + new pure helpers (TDD) + Toast primitive + hooks foundation
**Files:** `src/lib/mock/transaction.ts` (modify), `src/lib/format.ts` + `src/lib/format.test.ts` (extend), `src/hooks/usePayoutCountdown.ts` (new), `src/hooks/useBuyShares.ts` (new), `src/hooks/useProperty.ts` (new), `src/hooks/index.ts` (extend barrel), `src/components/common/Toast.tsx` (new).
- Harden `MockTxRepo.buy()` so it actually persists to the in-memory seed:
  - Read the investor's existing `Holding` for `propertyId` from `seed.holdings` (or create a new one if first buy).
  - Mutate `sharesOwned += quantity`; recompute `avgCostUsd` (weighted average), `currentValueUsd = sharesOwned * property.sharePriceUsd`, `shareRatio = sharesOwned / property.totalShares`, `pendingWeekEarningsUsd = weeklyRent(property.annualRentUsd) * shareRatio`.
  - Push a new `Transaction{ ..., kind:"buy", status:"success", txHash: makeSyntheticTxHash() }` into `seed.transactions`.
  - Return the new `Transaction`.
  - Add unit test asserting the mutation took effect + `txHash` starts with `"simulated:"`.
- Add `format.payoutCountdown(nowMs: number, opts?: { nowOnFriday?: string }) -> string` (TDD): for the weekly Friday-UTC payout, returns `"in 3d 4h"` (d≥1 → days+hours; <1 day → hours only; <1 hour → minutes). Pure; freeze `Date.now` in the test.
- Add `usePayoutCountdown()` hook: `useState(nowMs)`, `useEffect` `setInterval` 1000ms; returns the countdown string via `format.payoutCountdown`. SSR-safe (no `window` access).
- Add `useBuyShares()` mutation hook per §3 data flow above. The hook takes an `onSuccess`/`onError` callback (Toast + haptic wiring stays in the caller component so the hook stays pure about side-effects beyond the TX itself).
- Add `useProperty(propertyId)` hook: `useQuery(["property", propertyId], () => getRepo().marketplace.get(propertyId), { enabled: Boolean(propertyId) })`. (Order book comes from the existing `useOrderBook`.)
- Extend the hooks barrel.
- Add `Toast.tsx` presentational component: top-center, `mt-[max(env(safe-area-inset-top),8px)]`, `bg-card border border-border rounded-[10px] px-4 py-3 text-sm` (exact DESIGN_SYSTEM §"Toast / Snackbar"), success/error variants distinguish by icon + the `border-l-2 border-l-success|danger` accent, auto-dismiss 3s (caller controls mount/unmount via a small store OR via TanStack Query's mutation callbacks; pick the simpler one — caller-controlled mount, no Zustand store), interruptible CSS `transition` (no keyframes). The toast's content is provided via props `{ tone: "success"|"error"; title: string; sub?: string }`.
- Commit message: `feat(phase3): mock buy persists + payoutCountdown + Toast primitive + buy/property hooks`.

### Task 2 — Marketplace list page
**Files:** `src/components/property/{PropertyCard,FundingBar,WeeklyYieldCallout}.tsx` (new), `src/app/(app)/marketplace/page.tsx` (replace placeholder).
- `FundingBar`: per DESIGN_SYSTEM "Funding / progress bar" — `h-[6px] rounded-full bg-surface-2` track + `bg-primary` fill (or `bg-success` when fully funded), **width animates 280ms via `transform: scaleX()`** with `transform-origin: left`. The `%` label right, tabular, the numeric value animating via a 220ms transform (Phase 5 polish — Phase 3 ships static number). Pure presentational: props `{ progress: number (0..1); funded?: boolean }`.
- `WeeklyYieldCallout`: `--success` text, tabular, `CalendarClock` 16px icon left (lucide-react), `≈ $X / week per share` per R-4.2a. Pure: props `{ weeklyPerShare: number }`.
- `PropertyCard`: per DESIGN_SYSTEM "Property card (Marketplace)" — `bg-card rounded-[12px]` no border; thumb `aspect-[16/10] rounded-[12px]` (full-bleed top); body `p-4`; title H2 (`0.9375rem/600`); location meta (muted); 2-col row grid (total price / share price / estimated weekly yield per share) tabular; funding bar with %; `WeeklyYieldCallout` is the loudest secondary line; whole-card tap → `Link href={ROUTES.property(property.id)}` (router push). Card scales 0.98 on press (DESIGN_SYSTEM "press scale on every tappable"). Props: `{ listing: Listing }`; uses `format.usd/weeklyRent/projectedYield/pct`.
- Replace `marketplace/page.tsx`:
  - `useMarketplace()` returning `{ data, isLoading, isError, refetch }`.
  - `isLoading` → list of `{Array.from({ length: 6 }).map(...)}` of skeleton card-shaped Blocks (matching the card's final shape per R-9.6).
  - `isError` → Block with a "Retry" Telegram-style button calling `refetch()` (R-9.5).
  - `data` length 0 → `EmptyState` "No properties yet" + message "New listings land every week." (no Marketplace CTA here — we ARE the Marketplace; the Phase-2 placeholder's CTA was wrong because it would self-link).
  - `data` → `<div className="mt-3 space-y-3">{data.map(p => <PropertyCard ... />)}</div>`.
  - Wallet-disconnected → header still shows the page; `BuyControl` inside Property detail handles its own disable. (Phase 3 Marketplace itself does NOT gate on wallet — R-2.4 specifically scopes Buy/Sell disabling, not browse.)
  - Filter chips (R-4.4 Should): if cheap in the same task, a `Block` with segmented control (4 chip rows: All / Funding / Funded / Resale) wired to `useMarketplace({ status })`. If it grows the task over ~80 lines, defer to a small follow-up — review-gate decides.
- BackButton: not visible on `/marketplace` (root tab rule from USER_FLOW §"Route ↔ screen").
- Commit message: `feat(phase3): Marketplace list - PropertyCard + FundingBar + WeeklyYieldCallout`.

### Task 3 — Property detail page (read-only + BuyControl shell, no Buy wiring)
**Files:** `src/components/property/{PropertyDetail,OrderBook,BuyControl}.tsx` (new), `src/app/(app)/property/[id]/page.tsx` (replace placeholder).
- `OrderBook`: per DESIGN_SYSTEM "Order book" — two stacked lists in a Block. Bid rows tinted `text-success`, Ask rows `text-danger`; best row `bg-accent`. Columns Price / Qty / Cumulative, right-aligned, `font-mono text-xs tabular-nums`. Mono numbers; hairline rows. Rows are static — no entrance animation. Props: `{ state: OrderBookState }`. Read-only (no tap→fill buy in Phase 3 except via BuyControl's own stepper; tap-to-fill is Phase 4 polish).
- `BuyControl`: per DESIGN_SYSTEM "Stepper (qty)" + the inline Buy form. Visible only if `status === "funding"` OR `status === "resale"` (RESALE of Primary shares — for Phase 3 resale orders come from the seeded buy side; user does NOT place resting sell orders yet — that's Phase 4). Local `useState` qty (1..remaining). Stepper: `bg-card rounded-[10px]` Block with `−`/`+` 44px hit areas; number tabular centered, animates on change (220ms — Phase 3 ships instant, Phase 5 animates). Below: total cost (USD via `format.usd(quantity * sharePriceUsd)` + TON estimate via `format.ton(usdToNanoEstimate(quantity * sharePriceUsd, tonPrice))` (need a TON price constant — read from env or default; document in code that this is a display estimate, not a real quote). Below: live **WeeklyYieldCallout** with `weeklyPerShare = projectedYield(weeklyRent(annualRentUsd), quantity, totalShares)` — the hero beat (R-5.5 + R-5.4 [HERO]). The confirm button is an in-page full-width Telegram primary per DESIGN_SYSTEM "Buttons"; in Phase 3 it's wired to the MainButton in Task 4, so Task 3 leaves it visible-but-disabled until wallet connected and MainButton wired. Validation R-7.4: inline `text-danger` text under the stepper if `qty < 1 || qty > remaining`; the in-page confirm button is `disabled` when invalid. Bottom of BuyControl: if wallet disconnected, render the `WalletConnectButton` (Phase 2 built) instead of the stepper: "Connect Wallet" CTA (R-2.4).
- `PropertyDetail`: composition. Hero image (`aspect-[16/10] rounded-[12px]`), title H2, location meta; Block of `Row`s for financials (total price / shares offered + sold + remaining / share price) tabular; **the Weekly-Yield block row** with `rent/month → projected weekly yield for current buy qty → payout day "Every Friday"`; FundingBar; read-only OrderBook; BuyControl.
- Replace `property/[id]/page.tsx`: `useProperty(id)` → `{ data, isLoading, isError }`; render `PropertyDetail` with all states (loading = shaped Block skeletons in the same shapes as the final rows; error = Block with retry → `refetch`). Pass the `propertyId` for the order book `useOrderBook(propertyId)` so OrderBook is fresh.
- `BackButton` shown (via `useTelegram().backButton.show()` on mount of this detail page; hide on unmount).
- Commit message: `feat(phase3): Property detail - PropertyDetail + OrderBook + BuyControl shell (read-only)`.

### Task 4 — Buy flow + MainButton + optimistic update
**Files:** `src/components/property/BuyControl.tsx` (modify — wire confirm), `src/app/(app)/property/[id]/page.tsx` (modify — register MainButton via `useTelegram`).
- `BuyControl` confirm path: calls `onConfirm({ quantity })` prop; the page wires `onConfirm` to actually call `useBuyShares.mutateAsync({ propertyId, quantity, priceUsdPerShare: property.sharePriceUsd })`.
- `useBuyShares` per §3: send TX → on ok `getRepo().tx.buy()` → invalidate `portfolio`/`earnings`/`marketplace`/`property`/`orderBook` queries.
- Page registers MainButton per-route: on mount, `mainButton.setParams({ text: "Buy N — $X.XX", color: ...primary, textColor: white, isEnabled: qtyValid })` + `onClick(() => onConfirm())`. Show MainButton when wallet connected AND status funding/resale AND qty ≥1 AND qty ≤ remaining; hide otherwise (use `useTelegram().mainButton.hide()` in cleanup).
- Haptics per USER_FLOW "Haptics map": `impactOccurred('medium')` on tap; `notificationOccurred('success')` on done; `notificationOccurred('error')` on failure.
- Toast: success variant with `"Buy confirmed (simulated)"` per the MVP-honesty contract. Error variant with the `SendTxResult.error` string. Toast is mounted by the page (a small `useState<{tone,title,sub}|null>` + `<Toast>` element) — when non-null it auto-dismisses after 3s via its own `setTimeout` + `transition` (interruptible). No Zustand store needed; toast state is local to the page.
- Navigation after success: keep the user on Property detail (the FundingBar now reflects new `sharesSold`/`progress`); the toast confirms the buy. USER_FLOW Flow 1 step 8 says "Home + Portfolio update" — handled by TanStack Query invalidation (the next Home/Portfolio visit is fresh).
- Commit message: `feat(phase3): Buy flow - MainButton confirm + useBuyShares + toast + haptics + optimistic invalidation`.

### Task 5 — Earnings hero page
**Files:** `src/components/earnings/{EarningsSummaryBlock,EarningsTimeline,EarningsEntryRow,PayoutCountdown}.tsx` (new), `src/app/(app)/earnings/page.tsx` (replace placeholder).
- `PayoutCountdown`: subscribes to `usePayoutCountdown()` and renders `"Next payout in Xd Yh"` or similar muted-tabular, per DESIGN_SYSTEM "Weekly-yield callout" / "the Home next payout countdown may tick each second but must use a CSS `transition` on the digit (not a jump), and must not spin or animate continuously — it's a calm countdown". Phase 3 ships a calming single-line readout: `Next payout Fri · in 3d 4h` (Friday-weekday + duration). No continuous animation; update each second but visually render a single line (digit changes can momentarily transition, Phase 5 polishes).
- `EarningsSummaryBlock`: Block of rows. Top row: `All-time earned` `text-foreground` tabular + `--success` icon. Second row: `This week projected` muted-foreground + a `Warning`-tinted `StatusPill` `pending` per design-system and the seeded pending EarningsEntry. Third row: `PayoutCountdown`. The summary must surface the canonical `PAYOUT_DISCLAIMER` once immediately above it as a muted `<p className="px-1 text-xs text-muted-foreground">` (kept from Phase 2's placeholder; Task 5 preserves the placement).
- `EarningsEntryRow`: per DESIGN_SYSTEM "Earnings timeline" — Block of rows (newest first, no left rail). Each row: thumb 36 + property name + week label (muted) + amount (tabular, H2-ish `0.9375rem/600`) + StatusPill. Paid pill rendered with `simulated` prop so the muted sibling capsule appears. Tap row → expandable detail: property thumb, week, share %, amount, and the proportional-math line `Rent this week $X × your 0.5% = $Y` (the judge-verifiable truth — R-6.6), plus a muted disclosure `"Simulated payout · tx hash is a placeholder"`. The expand uses a CSS height transition (interruptible). On first expand, fire `haptics.notificationOccurred('success')` (USER_FLOW §"R-7.6" — small celebration, never full-screen).
- `EarningsTimeline`: composes `EarningsEntryRow`s in a single `Block`, newest first. Each row's separator is `border-t border-border mx-4 first:border-t-0 first:mx-0` (the standard Row hairline — `EarningsEntryRow` reuses the `Row` primitive internally).
- Replace `earnings/page.tsx`: `useEarnings()` (interval ticks → on `paidEntries>0` invalidates → entries flip paid with synthetic txHash + simulated badge) → render `PAYOUT_DISCLAIMER` + `EarningsSummaryBlock` + `EarningsTimeline`. Loading → shaped Skeleton. `entries.length === 0` (no holdings) → `EmptyState` title "No earnings yet" + message "Own a slice — get rent every Friday" + action `<WalletConnectButton>` or a `Link href={ROUTES.marketplace}` "Explore Marketplace" primary button (the weekly-yield promise restated per R-6.4). The seed has a non-empty investor with earnings, so the timeline renders immediately in MVP; the empty branch still ships for code coverage.
- `BackButton` NOT shown (root tab).
- Commit message: `feat(phase3): Earnings hero - timeline + Paid pill simulated badge + summary + payout countdown`.

### Task 6 — Home + weekly-yield integrity gate (final gate)
**Files:** `src/app/(app)/home/page.tsx` (replace placeholder), `src/lib/__tests__/integrity.test.ts` (new).
- Home page per R-3 and USER_FLOW Flow 4: `usePortfolio()` → `{ data, isLoading, isError }`.
  - `isLoading` → shaped Skeleton blocks (balance block + next-payout block + 2 my-property cards).
  - `isError` → retry Block.
  - `data` empty (zero holdings) → `EmptyState` title "Welcome to DigiHouse" + message "Buy a slice of a property — earn rent every Friday." + primary `Link` to Marketplace "Explore Marketplace" (R-3.4).
  - `data` with holdings:
    - Big balance block (DESIGN_SYSTEM §"Balance card (Home hero)"): `bg-card rounded-[12px] p-4`; label "Portfolio value" uppercase muted; value `1.625rem/700` tabular via `format.usd(totalValueUsd)`; TON estimate below, muted, tabular via `format.ton(usdToNanoEstimate(totalValueUsd, tonPrice))`.
    - **Next-payout block** (R-3.3b [HERO]): a Block with `PayoutCountdown` + the sum of pending week earnings from the existing `useEarnings()`. Read pending entries from `summary.entries.filter(e => e.status === "pending")`, sum their amounts, surface as `"Next rent Friday · +$X.XX"`.
    - **My Properties** mini-cards: subsbet of `PropertyCard` (or a dedicated `MyPropertyCardRow` if `PropertyCard` grows too big — YAGNI says reuse and pass a `variant: "list"|"mini"` prop; decide in the plan based on line count). Each mini-card: thumb 36 + title + "shares owned / total" + value + **pending weekly earnings** (the seeded pending amounts). Tap → Property detail.
- Weekly-yield integrity test (the judge gate):
  - New `src/lib/__tests__/integrity.test.ts` — a vitest that:
    - Iterates `seed.holdings` (or a representative subset).
    - For each holding: compute `Home next-payout contribution = pendingWeekEarningsUsd`.
    - Compute `Property detail projected yield for same holding size = projectedYield(weeklyRent(property.annualRentUsd), holding.sharesOwned, property.totalShares)`.
    - Compute `Earnings paid entry amount per paid EarningsEntry for same property = entry.amountUsd` (for the most recent paid week; if multiple paid weeks, assert all of them match the projection — proportional math invariant per R-6.6 + DATA_MODELS §6).
    - Assert all three agree (integer minor units). **Any disagreement = test fails → MVP fail per REQUIREMENTS §"Acceptance criteria conventions".**
    - This is a pure-math test, no React; runs in <50ms; gates the phase.
- Final gate: `npm run check` (lint + typecheck + build) + `npm test` (adds 3+ tests across Tasks 1 + 6) + `/design-review` (run mentally the `.opencode/commands/design-review.md` checklist against all four touched screens: Marketplace, Property detail, Earnings, Home). Specifically verify: 4 tabs intact, no horizontal scroll at 360/480, system font, tabular-nums on every money figure, no drop shadows on blocks, the `PAYOUT_DISCLAIMER` rendered once on Earnings, the simulated badge on every Paid pill, no "on-chain now" copy anywhere.
- Commit message: `feat(phase3): Home real content + weekly-yield integrity gate (Phase 3 final gate)`.

## 7. Ownership self-audit — per `telegram-ton-ownership` skill

| Plan item | Ownership check | Verdict |
|---|---|---|
| All new components import only `hooks/`, `types/`, `lib/format`, `lib/utils`, `lib/constants`, other `components/` | No `lib/ton`, `lib/mock`, `lib/api`, `lib/telegram`, `@tonconnect`, `@telegram-apps` direct imports from components. | PASS |
| `useBuyShares` reaches `useTonConnect().send()` + `getRepo().tx.buy()` | Hook coordinates two services; that's the hook layer's job. No component touches either. | PASS |
| `MockTxRepo.buy()` enhancement touches only `lib/mock/transaction.ts` (and `lib/mock/seed/holdings.ts` if the mutated state lives there — decide in plan) | One file = single concern (TxRepo impl). ≤80 lines. | PASS |
| New `Toast` is presentational, in `components/common/` | No `useState`/`useEffect` beyond what Toast needs (3s auto-dismiss); no hooks/data imports. | PASS |
| No new `lib/ton` or `lib/telegram` files | Phase 3 reuses the as-built foundation; no SDK/wallet work. | PASS |
| Largest foreseen file: `PropertyDetail.tsx` ~120 lines (composition); rest <80 | All under 350 soft / 500 hard. | PASS |
| MVP honesty: disclaimer on Earnings, simulated badge on Paid pill, synthetic txHash on every paid entry + every buy tx, no "on-chain now" copy | Enforced in `constants.ts` (existing) + `StatusPill` (supports simulated, Phase 2 built) + `useBuyShares` (reuses `makeSyntheticTxHash()` via the mock path) + Buy toast text "Buy confirmed (simulated)". | PASS |
| Weekly-yield integrity check (R-6.6) is a final-gate vitest, not a per-task burden | Task 6 ships the gate test under `src/lib/__tests__/integrity.test.ts`. | PASS |
| `thisWeekProjectedUsd` naming consistency | Used by `EarningsSummaryBlock` reading `summary.thisWeekProjectedUsd` from the existing `seedEarningsSummary()` computed field; nothing renamed. | PASS |

No hard-rule violations.

## 8. Verification gates

- After every task: `npm run check` (lint + typecheck + build) green + `npm test` all green.
- After every task: implementer subagent + task reviewer per `subagent-driven-development`.
- After Task 6: `npm run check` + `npm test` (33 prior + 3 new = ≥36 green) + `/design-review` PASS on the 4 touched screens (Marketplace, Property detail, Earnings, Home) using `.opencode/commands/design-review.md`.
- Manual smoke (final): connect Tonkeeper testnet wallet → Marketplace list renders with per-card weekly yield → tap a property → set qty 5 → see live projected weekly yield update → tap MainButton "Buy 5 — $<total>" → Tonkeeper deep-link approve → success toast "Buy confirmed (simulated)" → Home balance + my-property card appear → wait `NEXT_PUBLIC_PAYOUT_TICK_MS` (default 60s) → Earnings tab → top pending entry flips to Paid with simulated badge → expand row → proportional-math line `"Rent $X × your 0.5% = $Y"` displays. **The weekly-yield loop closes.**

## 9. Spec self-review (post-write)

- **Placeholder scan:** No `TBD`, `TODO`, `FIXME` anywhere; one noted `decide-in-plan` (filter chips cheap-or-defer in Task 2; clear policy written in-task).
- **Internal consistency:** Tasks 1–6 each map to a section of this spec (§3 data flow, §5 files, §6 execution); MVP-honesty contract referenced consistently; the `thisWeekProjectedUsd` field name used throughout matches the Phase 2 type mirror exactly; the Phase 4 deferral list (§2) lists every requirement not in the closed list (§1) so no commitment slips.
- **Scope check:** 6 tasks, vertical-feature order, each produces a screen that boots independently; total surface single-phase-sized, single-spec-sized. No need for sub-project decomposition.
- **Ambiguity check:** (a) "read-only order book" vs "tap-to-fill" — resolved: read-only in Phase 3, tap-to-fill deferred to Phase 4. (b) "filter chips" — resolved: include if cheap in Task 2, defer if >80 lines; in-task policy documented. (c) "Toast store vs page-local state" — resolved: page-local (no Zustand, simplest path). (d) "MyPropertyCardRow vs PropertyCard variant" — resolved: attempt reuse with `variant` prop first; split if PropertyCard crosses the 350 soft limit, store the decision in the plan's task notes.