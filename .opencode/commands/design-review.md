# Design Review

> Audit a screen (or the whole app) against `docs/research/DESIGN_SYSTEM.md` *before* a phase is marked done.
> A screen that "compiles but isn't native-Telegram" is a **fail**. This command is the gate referenced by
> `AGENTS.md`, `ROADMAP.md`, and DESIGN_SYSTEM's own Audit section.
>
> Usage: `/design-review [path-or-screen]` — with no argument, review every screen touched in the current branch.

## Inputs
- Target: a route, component, or "all touched" (default = files changed vs `main`).
- Authority: `docs/research/DESIGN_SYSTEM.md` (single source of truth). If the code and DESIGN_SYSTEM disagree, **DESIGN_SYSTEM wins**.


## Procedure

### 1. Gather
- List the touched files (`git diff --name-only main...HEAD` when "all"), then isolate the screens/components that render UI.
- For each, read the component source AND `src/app/globals.css` token usage. Do not review from memory — open the file.

### 2. Check each item below — FAIL on any ❌

#### Identity & palette
- [ ] Canvas is `--background` (#17212b dark); blocks are `--card` (#232e3c) on the *lighter* panel over the darker canvas — the signature Telegram look.
- [ ] **One accent only**: Telegram blue (`--primary` / `#3390ec`) for every CTA, link, active tab. No second accent, no neon, no gradients on surfaces.
- [ ] **Semantics held**: `--success`/`--danger` used **only** for finance up/down and bid/ask (and Paid/Pending pills). Not for generic "primary".
- [ ] Light theme is a faithful mirror (tokens resolve in `.light`).
- [ ] No web fonts — system stack only (`--font-sans`). No `@import` of Google Fonts etc.

#### Layout & blocks
- [ ] Grouped "blocks": `bg-card rounded-[12px]`, **no border, no drop shadow**. Side gutters 16px; separation by color, not borders.
- [ ] Row separators are `border-t border-border` **inset 16px** (Telegram grouped-list). No full-bleed dividers.
- [ ] Max content width **480px**, centered. **No horizontal scroll** anywhere (verify on a 360px viewport).
- [ ] Safe-area: top inset on header; `pb-[env(safe-area-inset-bottom)]` on the tab bar / MainButton bridge.
- [ ] Tap targets ≥ 44×44. Tappable rows scale to `0.97` on `:active` (120–160ms `--ease-out`).

#### Native chrome
- [ ] Telegram header present (SDK title bar when available, else the spec'd custom `h-[44px] bg-background/95 backdrop-blur`).
- [ ] Bottom tab bar: 4 tabs, `h-[52px]`, `bg-card/95 backdrop-blur`, top hairline, active = `--primary`.
- [ ] `MainButton` carries the screen-primary action on action screens (no duplicate in-page primary button); hidden on root tabs.
- [ ] `BackButton` wired on detail/sheet screens; back-stack per USER_FLOW is correct.

#### Typography & numbers
- [ ] Scale matches DESIGN_SYSTEM (hero `1.625rem/700`, H1 `1.0625rem/600`, H2 `0.9375rem/600`, section label uppercase `.6875rem/600`).
- [ ] **Tabular-nums on EVERY money / share / TON / ratio figure** (`.tnum` / `font-feature-settings: "tnum"`). Non-negotiable.

#### Motion (emil-design-eng checklist)
- [ ] No `transition: all` — exact properties specified.
- [ ] No `scale(0)` entries — start at `scale(0.95)` + `opacity 0`.
- [ ] No `ease-in` on UI — use `--ease-out` / `--ease-in-out` / custom curves.
- [ ] Popovers are origin-aware (`transform-origin: var(--transform-origin)`); modals center.
- [ ] No animation on keyboard-triggered actions.
- [ ] UI animations ≤ 300ms (120–250ms typical); longer only for marketing/onboarding.
- [ ] Hover effects gated behind `@media (hover: hover) and (pointer: fine)`.
- [ ] Toasts/sheets/orders use **transitions** (interruptible), never keyframes.
- [ ] Framer Motion under load: full `transform: "translateX()"` string, not `x`/`y` shorthand, for balance/payout-sensitive animations.
- [ ] Numbers animate on change via `transform` 220ms (no jumps); Funding bar uses `transform: scaleX()` with `transform-origin: left`.
- [ ] Pending→Paid pill crossfades color in 200ms `--ease-out` (**no scale**). Paid entries never bounce.
- [ ] `prefers-reduced-motion` parity: keep opacity/color, drop transform; springs → instant cuts.

#### States
- [ ] Every screen ships: **loaded | loading skeleton | empty | error**.
- [ ] Skeletons match the final shape exactly (no spinner replacing a list).
- [ ] Empty state restates the weekly-yield promise where relevant (Earnings empty: "Own a slice — get rent every Sunday").

#### Honesty (MVP payout claims)
- [ ] No screen claims live on-chain weekly payouts for the MVP. Any "Paid" moment on the hero Earnings screen is visibly marked **simulated** (badge/hint), and the canonical copy reads: **"simulated weekly payout · on-chain verifiable post-MVP"**.
- [ ] No "rent landed in your wallet / undeniable on-chain" framing on hero screens in MVP.

### 3. Report
For each touched screen, emit a verdict: `PASS` or `FAIL` with the failing checklist items and a one-line fix. Append a single overall verdict + the list of files to fix. Link the offending `file_path:line` for every FAIL so the builder can navigate directly.

### 4. Gate
- All PASS → phase may close. Run `npm run check` as the parallel gate.
- Any FAIL → block the phase; do not proceed until fixed and this command re-run.