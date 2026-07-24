# DESIGN SYSTEM — DigiHouse

> The authority for **every** visual decision. All builder agents MUST conform.
> The mandate: this Mini App must **look and feel indistinguishable from a native Telegram product** —
> official colors, system typography, grouped blocks, hairline separators, Telegram header,
> bottom navigation, MainButton, haptics, safe-area. No invented accents.
>
> Tokens below are wired into `src/app/globals.css` as CSS variables (oklch, Tailwind v4).
> If this file and anything (code, mock, screenshot) disagree, **this file wins**.
>
> **Motion philosophy (from emil-design-eng):** the unseen details compound. Animations should
> be infrequent, fast (mostly under 280ms), use strong custom easings (never default `ease-in`),
> run on `transform`/`opacity` only, and always honor `prefers-reduced-motion`. Orange flags are
> forbidden: shortcuts surface as jank. When in doubt, ship the flat instant version first.

---

## Design Pillars
1. **Native Telegram first.** We use Telegram's own design language — grouped list blocks on a lighter panel over a darker canvas, hairline separators, the system font, the Telegram header, the MainButton — not a generic web card layout.
2. **Trust through clarity.** Finance app: numbers are the hero, generous breathing room, low chrome.
3. **The weekly payout is the emotional hero.** Every screen that touches the user's portfolio must surface the *next payout* or *just-paid* moment with weight. This is the reason the user opens the app — design it like a paycheck arriving, not a list item.
4. **Dark first.** Telegram's blue glows on the dark canvas; light theme is a faithful mirror.
5. **One accent.** Telegram blue (`#3390ec`) drives every action; **green/red are reserved strictly** for finance up/down and bid/ask. No second accent, no neon, no gradients.
6. **One primary action per screen.** Exactly one hero CTA; the Telegram `MainButton` carries it on action screens.

---

## Telegram themeParams mapping
When the user enables **"Use Telegram theme"** (Settings, default OFF — we ship a static Telegram-native palette that already mirrors these values), map the official Telegram `theme_params` onto our tokens:

| Telegram themeParams | Our token | Notes |
|---|---|---|
| `bg_color` (#17212b) | `--background` | App canvas (darkest layer) |
| `text_color` (#ffffff) | `--foreground` | Primary text |
| `hint_color` (#708499) | `--muted-foreground` | Secondary text / placeholder |
| `secondary_bg_color` (#232e3c) | `--card`, `--surface`, `--popover`, `--sidebar` | Grouped **block** panel (raised, lighter than canvas) ← the signature Telegram look |
| `button_color` (#3390ec) | `--primary` | Telegram blue accent |
| `button_text_color` (#ffffff) | `--primary-foreground` | Text on primary |
| `link_color` / `accent_text_color` (#6ab3f3) | (links, chevrons-active, focus accents) | secondary blue for hierarchy |
| `destructive_text_color` (#e53935) | `--destructive`, `--danger` | errors, down |
| `section_bg_color` | `--card` | block bg |
| `section_header_text_color` / `subtitle_text_color` | `--muted-foreground` (uppercase section label) | |
| `header_background_color` | header bg (use Telegram header when present) | |

> Deterministic fallback: if a param is missing, keep the DigiHouse static value. Never let the UI go unstyled.

---

## Color Tokens (oklch — hex source in comments)
### Dark (default; `:root, .dark`)
| Token | oklch | (hex) | Use |
|---|---|---|---|
| `--background` | `oklch(0.225 0.025 256)` | #17212b | App canvas (behind everything) |
| `--card` / `--surface` | `oklch(0.267 0.027 256)` | #232e3c | Grouped **block** / sheet / popover |
| `--surface-2` | `oklch(0.31 0.027 256)` | #2b3744 | Inset/nested row, stepper bg |
| `--muted` | `oklch(0.243 0.026 256)` | #1c2733 | Segmented/inset filler |
| `--foreground` | `oklch(1 0 0)` | #ffffff | Primary text |
| `--muted-foreground` | `oklch(0.588 0.019 250)` | #708499 | Hint/secondary text, placeholders |
| `--primary` | `oklch(0.625 0.177 250)` | #3390ec | Telegram blue — buttons, links, active tab |
| `--primary-foreground` | `oklch(1 0 0)` | #ffffff | Text on primary |
| `--accent` | `oklch(0.625 0.177 250 / 0.14)` | #3390ec/14% | Selected-row tint, best bid/ask highlight |
| `--secondary` | `oklch(0.31 0.027 256)` | #2b3744 | Subtle/secondary button bg |
| `--border` | `oklch(1 0 0 / 0.08)` | #fff 8% | Hairline separators |
| `--input` | `oklch(1 0 0 / 0.1)` | #fff 10% | Field fill |
| `--ring` | `oklch(0.625 0.177 250)` | #3390ec | Focus ring |
| `--success` | `oklch(0.72 0.17 145)` | green | Ask / paid / up (finance only) |
| `--danger` | `oklch(0.62 0.22 25)` | #e53935 | Bid / down / error (finance only) |
| `--warning` | `oklch(0.79 0.16 70)` | amber | Pending earnings |

### Light (`.light`)
| Token | oklch | (hex) | Use |
|---|---|---|---|
| `--background` | `oklch(0.965 0 0)` | #f4f4f5 | Canvas between blocks |
| `--card` / `--surface` | `oklch(1 0 0)` | #ffffff | Block / sheet |
| `--surface-2` | `oklch(0.96 0 0)` | #f4f4f5 | Inset/nested row |
| `--muted` | `oklch(0.93 0 0)` | #ededed | Segmented filler |
| `--foreground` | `oklch(0.18 0.004 256)` | ~#000 | Primary text |
| `--muted-foreground` | `oklch(0.58 0.006 250)` | #707579 | Hint text |
| `--primary` | `oklch(0.58 0.19 250)` | #3390ec | Telegram blue |
| `--border` | `oklch(0 0 0 / 0.08)` | #000 8% | Hairlines |
| `--danger` | `oklch(0.58 0.22 25)` | #e53935 | Bid/down/error |
| `--success` | `oklch(0.6 0.17 145)` | green | Ask/up |

> **Block vs canvas rule (the native Telegram signature):** blocks sit on the *lighter* `secondary_bg` panel and float over the *darker* canvas with **no drop shadow**, separated by side gutters (16px) and rounded corners — never by borders. Internal rows are separated by **inset 16px hairlines**, not full-bleed lines.

### Semantic finance color contract
| Meaning | Token | Where |
|---|---|---|
| Up / profit / ask / paid | `--success` | order book ask, PnL up, Paid pill, payout amount |
| Down / loss / bid / error | `--danger` | order book bid, PnL down, error toast, sell-order rows |
| Pending / scheduled | `--warning` | Pending earnings pill, scheduled distribution |
| Primary action | `--primary` (blue) | all CTAs, active tab, links — *the only accent* |

---

## Typography
- **Font:** the device's **native system font** (SF Pro Text on iOS, Roboto on Android, Segoe UI on Windows) via the `--font-sans` system stack — *not* a web font. Telegram itself renders in the system font; matching it is non-negotiable for "native" feel.
- **Mono/numbers:** system monospace stack (`--font-mono`). Use **tabular-nums** for ALL money/share figures (`.tnum` → `font-feature-settings: "tnum"`).
- Scale (mobile-first) — Telegram wants compact, readable hierarchy:
  | Role | Size / weight | Tracking | Color |
  |---|---|---|---|
  | Hero balance / payout amount | `1.625rem` / 700, tabular | -0.02em | `--foreground` |
  | H1 (screen title — usually the Telegram header) | `1.0625rem` / 600 | -0.01em | `--foreground` |
  | H2 (block/section title) | `0.9375rem` / 600 | 0 | `--foreground` |
  | Section label (uppercase over a block) | `0.6875rem` / 600, uppercase, +0.04em | | `--muted-foreground` |
  | Body / row label | `0.9375rem` / 400 | 0 | `--foreground` |
  | Row value/meta | `0.9375rem` / 500, tabular | 0 | `--foreground` |
  | Tertiary meta | `0.8125rem` / 400 | 0 | `--muted-foreground` |

> Tabular-nums is non-negotiable on every money, share, TON, or ratio figure. Without it, numbers reflow when they change and the app loses its "finance polish" instantly.

---

## Spacing & Layout
- Base unit **4px**. Standard gutters: page `px-4` (16px), intra-block padding `px-4 py-2` (rows), section gap `mt-3` between blocks, `mt-5` between major groups.
- App **max-width 480px**, centered. Outside that width, canvas only.
- **Safe areas:** `pt-[max(env(safe-area-inset-top),0px)]`; the bottom tab bar adds `pb-[env(safe-area-inset-bottom)]`; the MainButton sits just above that inset (Telegram draws it natively when used).
- **Block radius:** `--radius: 0.75rem` (12px). Use `rounded-[12px]` on blocks/sheets; `rounded-[10px]` on primary buttons & inputs; `rounded-full` only for pills/avatars/segmented chips.
- **Block construction:** `bg-card rounded-[12px]` (no border, no shadow), 16px side gutters to the canvas, internal rows separated by `border-t border-border` **inset left by 16px** (Telegram grouped-list separator).

## Elevation
- **Telegram is essentially flat.** Prefer *color separation* (block vs canvas) over shadow.
- Subtle lift only when overlapping: `shadow-[0_2px_12px_rgba(0,0,0,0.18)]` on modals/sheets pulled up.
- Bottom tab bar: top **hairline** `border-t border-border` + `bg-card/95 backdrop-blur` (no shadow).
- No neon, no heavy drop shadows, no gradients on surfaces.

## Iconography
- `lucide-react`, stroke width **1.75** (rounded, Telegram-ish), `currentColor`.
- Sizes: 16 (inline/meta), 20 (row trailing chevrons/actions), 24 (tab bar / hero).
- Chevron rows end with a `ChevronRight` 20px in `--muted-foreground` (Telegram-settings nav feel).
- Brand mark + property/category glyphs: custom SVG in `src/components/icons.tsx` (monochrome, currentColor).

---

## Motion (emil-design-eng principles applied)

### Custom easings (never default CSS easings)
```css
--ease-out:  cubic-bezier(0.23, 1, 0.32, 1);   /* strong ease-out — entries, presses */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* on-screen movement */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);  /* iOS-ish sheet curve */
```
> **Never use `ease-in` on UI animation** — it delays the moment the user is watching most closely, making the interface feel sluggish.

### Duration budget (UI animations stay under 300ms)
| Element | Duration | Easing |
|---|---|---|
| Button / row press feedback | 120–160ms | `--ease-out` |
| Tab switch contents | 180ms | `--ease-out` |
| Toast enter/exit | 200ms / 160ms (exit faster) | `--ease-out` |
| Bottom sheet | spring `{ type: "spring", duration: 0.5, bounce: 0.2 }` | — |
| Number change (balance, payout) | 220ms `transform` only | `--ease-out` |
| Full-card enter on list | fade + 4px up, stagger 40ms | `--ease-out` |
| Marketing/onboarding slide | may be longer | `--ease-in-out` |

### Rules
1. **Animate only `transform` and `opacity`.** Padding/width/height trigger layout & paint — forbidden.
2. **Buttons must scale on press:** `transform: scale(0.97)` on `:active`, 160ms `--ease-out`. This is the *universal* press signal — every tappable element, not just "primary" buttons.
3. **Never animate from `scale(0)`.** Start from `scale(0.95)` + `opacity 0` if you must animate scale.
4. **Popovers are origin-aware** (`transform-origin: var(--transform-origin)`); modals stay `center`.
5. **Toasts/sheets use CSS transitions, not keyframes** — they're triggered rapidly and must be interruptible.
6. **Animate a value change, never let it jump.** Balance, share price, payout amount, funding % — animate the change. A jump reads as a glitch in a finance app.
7. **Framer Motion caveat:** the shorthand `{x, y, scale}` props run on `requestAnimationFrame` and drop frames under load. For animations that must stay smooth when the main thread is busy (balance, payouts), use the full `transform: "translate…"` string.
8. **Hover effects** must be gated: `@media (hover: hover) and (pointer: fine)` — touch devices trigger hover on tap and produce false positives.
9. **`prefers-reduced-motion`** does NOT mean zero motion. Keep opacity and color transitions that aid comprehension; remove transform-based motion. Springs → instant cuts.

### Weekly-payout motion (the hero motion)
- When an `EarningsEntry` flips **Pending → Paid**: the pill crossfades (warning→success) in 200ms, the amount number animates its `transform` from `scale(0.96)` + slightly blurred to `1` in 220ms (the "paycheck deposits" feel). One soft `notificationOccurred('success')` haptic.
- The Home "next payout" countdown may tick each second but must use a CSS `transition` on the digit (not a jump), and **must not** spin or animate continuously — it's a calm countdown.
- Paid entries never bounce. Bounce is for play; payouts are for trust. A small scaled settle + a color crossfade is enough — the rest is the number doing the talking.

### What we do NOT animate
- Pull-to-refresh: the spin animates, but the data swap is instant. No fade-through.
- Tab switches: tab indicator slides (spring, 200ms), content swaps instantly — no cross-fade on entire screens (it reads as slow).
- Order book rows: appear instantly. A redrawn order book is data, not theater.
- Skeleton → content: instant swap. The skeleton already matched the final shape, so nothing moves.

---

## Component Visual Spec (native-Telegram quick reference)

### Grouped "Block" (the core primitive)
`bg-card rounded-[12px]` (no border, no shadow). Contains ≥1 row.
Rows: `min-h-[48px] px-4 gap-2` left label, right value/meta, optional trailing `ChevronRight` (nav) or control. Separator: `border-t border-border` **inset-left 16px** (`mx-4`). Selected/tapped row: `bg-accent`. Section label above a block: uppercase `.muted-foreground`. Whole-row tap → row scales to 0.97 for 120ms.

### Telegram Header (title bar)
Prefer the SDK's native title bar when present; otherwise custom `h-[44px] bg-background/95 backdrop-blur px-4 flex items-center`, centered title 17px/600, leading slot for `BackButton` chevron, trailing for actions (gear/avatar). Top safe-area as page pad.

### Bottom Tab Bar (app-owned)
`fixed bottom-0 inset-x-0 max-w-[480px] mx-auto h-[52px] pb-[env(safe-area-inset-bottom)] bg-card/95 backdrop-blur border-t border-border grid grid-cols-4`. Each tab: icon 24 + label 10px, `gap-1 items-center`. Active = `--primary` (icon + label); inactive = `--muted-foreground`. Tap → `selectionChanged` haptic.

### MainButton (Telegram native)
When a screen has a single primary action, surface it via the Telegram `MainButton`: full-width bottom, `h-[50px]`, `--primary` bg, `--primary-foreground` 600 text 0.9375rem, sits above the safe-area. Hide the app tab bar's chrome conflict (MainButton is bottom-most). Do **not** also render an in-page primary button on those screens.

### Buttons (in-page, when MainButton not used)
- **Primary:** full-width `h-[48px] rounded-[10px] bg-primary text-primary-foreground font-semibold`, text 0.9375rem. Disabled: `bg-secondary text-muted-foreground` (no blue).
- **Secondary:** `bg-secondary text-primary` (Telegram "text button" feel) or outline `border border-border bg-transparent`.
- Tap ≥44×44, press scale 0.97 on `:active` (160ms `--ease-out`).

### Fields / Inputs
`h-[48px] rounded-[10px] bg-input px-3` placeholder `--muted-foreground`, text `--foreground`. Inline validation text below in `--danger`, 0.8125rem. Stepper (qty): `bg-card rounded-[10px]` with − / + 44px hit areas, number tabular centered. The +/− buttons scale 0.97 on press; the number animates on change (220ms transform).

### Status pills
`rounded-full px-2 py-0.5 text-xs font-medium`: Success = `text-success bg-success/12`, Warning = `text-warning bg-warning/12`, Danger = `text-danger bg-danger/10`. Capsule only; no drop shadow. Pending→Paid pill crossfades color in 200ms `--ease-out` (no scale).

### Funding / progress bar
Track `h-[6px] rounded-full bg-surface-2`, fill `bg-primary` (or `bg-success` if fully funded), **width animates 280ms via `transform: scaleX()`**, never `width` (layout-trigger). Set `transform-origin: left`. `%` label right, tabular, animates the numeric value 220ms.

### Order book
Two stacked lists in a block. Bid rows tinted `text-success`, Ask rows `text-danger`; best row bg `--accent`. Columns Price / Qty / Cumulative, right-aligned, `font-mono text-xs tabular-nums`. Mono numbers, hairline rows. Rows are static — no entrance animation.

### Property card (Marketplace)
`bg-card rounded-[12px]` (no border). Thumb `aspect-[16/10] rounded-[12px]` (full-bleed top). Body `p-4`: title H2, location meta (muted), then a 2-col row grid (total price / share price / **estimated weekly yield per share**) tabular, funding progress bar with %. **The weekly-yield figure is the loudest secondary line** — it's the rent story answering "why should I tap this?" Tappable whole-card → detail. Count badge bottom-right on thumb if needed. Card scales 0.98 on press.

### Weekly-yield callout (recurring pattern)
A small inline element that appears on Cards, Property detail, and Portfolio:
- **Look:** one line, `--success` text, tabular-nums, a `CalendarClock` 16px icon left.
- **Copy:** "≈ $X.XX / week per share" or "Next payout: Fri, $X.XX".
- **Motion:** only when the projected amount changes (buy qty change), animate 220ms `--ease-out` on `transform`. Idle state is static.

### My-position block
Block rows: Shares owned, Avg cost, Current value, Unrealized PnL. PnL value colored `--success`/`--danger` with arrow glyph, tabular. PnL sign animates color 200ms when sign flips.

### Balance card (Home hero)
`bg-card rounded-[12px] p-4`: label "Portfolio value" uppercase muted; value XL tabular (`1.625rem/700`); TON estimate below, muted, tabular. **Second block below:** "Next payout" callout (amount XL or near-xl + countdown). No gradient bar (flat). Two blocks, guttered.

### Earnings timeline (the hero screen's body)
Block of rows: each row = thumb 36 + property name + week label (muted) + amount (tabular, H2) + status pill. Separator inset-left 16px. Newest first. No left rail (keep flat Telegram look). **Pending→Paid status flips animate per the "Weekly-payout motion" above.** Tap a row → expandable detail with the proportional-math line ("Rent this week $X × your 0.5% = $Y").

### MVP payout honesty (non-negotiable copy contract)
- **Canonical hero copy**: "simulated weekly payout · on-chain verifiable post-MVP". Shipped exactly once per hero context (Earnings report header/summary area, subdued muted-foreground) — not repeated per row.
- **Paid pill + "simulated" badge:** the success-green `Paid` pill on the hero Earnings screen is paired with a small **"simulated"** hint badge immediately after it — `rounded-full px-1.5 py-0 text-[0.625rem] uppercase tracking-wide bg-muted text-muted-foreground`, capsule only, **no success color** (it's a disclaimer, not a second finance state). Pending pills need no badge.
- **Do not** claim on any MVP screen that rent "landed in your wallet", is on-chain, or is verifiable now. Real on-chain weekly payout distribution is a post-MVP TON Distribution contract (see [DATA_MODELS](./DATA_MODELS.md) §6 on-chain shape).
- The `txHash` shown on a "Paid" entry in the MVP is a **synthetic placeholder** from the mock `EarningsRepo`; disclose this in the expandable detail (tiny muted line: "Simulated payout · tx hash is a placeholder").

### Toast / Snackbar
Top-center, `mt-[max(env(safe-area-inset-top),8px)]`, `bg-card border border-border rounded-[10px] px-4 py-3 text-sm`, icon-led, auto 3s. Success tint = success-colored icon + default card; error = danger-colored icon + danger left border. Enter 200ms `--ease-out`, exit 160ms (faster). Use CSS `@starting-style` for entry when supported. Implementation must be interruptible (transitions, never keyframes).

### Bottom sheet (Sell order, order detail)
`bg-card rounded-t-[16px] pt-2` with drag handle `h-[5px] w-[36px] rounded-full bg-border mx-auto mt-1`. Rows inside are grouped-block rows. Backdrop scrim `bg-black/40`. Telegram `BackButton` closes the sheet.
- **Drag dismiss:** velocity-based; flick faster than ~0.11 dismisses regardless of distance. Damp past top boundary (don't hit an invisible wall). Multi-touch protected (ignore secondary touches mid-drag). Spring `{ duration: 0.5, bounce: 0.2 }` on release.

### Skeletons (no spinner where a list lives)
`bg-surface-2 rounded-[6px]`, animate `pulse` (tw-animate-css), matching the final element's size/shape exactly (card, row, bar). Critically: **never a spinner replacing a list.**

### Empty state
Centered: ~120px monochrome line-illustration in `--muted-foreground`, headline H2, one muted sentence, one **Primary** button (or "Explore Marketplace" → Marketplace tab). The Earnings empty state must **restate the weekly-yield promise** ("Own a slice — get rent every Friday").

---

## Do / Don't
- **DO:** system fonts, tabular numbers, grouped blocks, inset hairlines, one hairline per separation, ≥44px touch targets, MainButton for screen-primary actions, haptics on confirms, press scale 0.97 on every tappable, animate only `transform`/`opacity`, custom easings, reduced-motion parity.
- **DON'T:** multiple accents, neon, gradients, drop shadows on blocks, full-bleed dividers, web-style bordered cards, emoji in UI chrome, horizontal scroll, web fonts, long tables, `ease-in` on UI, `transition: all`, keyframes on rapidly-triggered elements, Framer Motion `x/y` shorthand under load.

## Audit
Run `/design-review` (`.opencode/commands/design-review.md`) on any screen against this file before marking a phase done. A screen that "looks fine but not native-Telegram" is a **fail**. Animation review uses the emil-design-eng checklist:

| Issue | Fix |
|---|---|
| `transition: all` | Specify exact properties |
| `scale(0)` entry | Start `scale(0.95)` + `opacity 0` |
| `ease-in` on UI | `--ease-out` or custom curve |
| `transform-origin: center` on popover | Trigger location / `var(--transform-origin)` |
| Animation on keyboard action | Remove entirely |
| Duration > 300ms on UI | 120–250ms |
| Hover without media query | `@media (hover: hover) and (pointer: fine)` |
| Keyframes on toasts/orders | Use transitions (interruptible) |
| Framer Motion `x`/`y` under load | `transform: "translateX()"` |
| Numbers jumping on change | Animate via `transform` 220ms |
| Pending→Paid pill jumps | Crossfade color 200ms `--ease-out` |