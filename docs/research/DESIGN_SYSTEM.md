# DESIGN SYSTEM — DigiHouse

> The authority for **every** visual decision. All builder agents MUST conform.
> The mandate: this Mini App must **look and feel indistinguishable from a native Telegram product** —
> official colors, system typography, grouped blocks, hairline separators, Telegram header,
> bottom navigation, MainButton, haptics, safe-area. No invented accents.
>
> Tokens below are wired into `src/app/globals.css` as CSS variables (oklch, Tailwind v4).
> If this file and anything (code, mock, screenshot) disagree, **this file wins**.

---

## Design Pillars
1. **Native Telegram first.** We use Telegram's own design language — grouped list blocks on a lighter panel over a darker canvas, hairline separators, the system font, the Telegram header, the MainButton — not a generic web card layout.
2. **Trust through clarity.** Finance app: numbers are the hero, generous breathing room, low chrome.
3. **Dark first.** Telegram's blue glows on the dark canvas; light theme is a faithful mirror.
4. **One accent.** Telegram blue (`#3390ec`) drives every action; **green/red are reserved strictly** for finance up/down and bid/ask. No second accent, no neon, no gradients.
5. **One primary action per screen.** Exactly one hero CTA; the Telegram `MainButton` carries it on action screens.

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

---

## Typography
- **Font:** the device's **native system font** (SF Pro Text on iOS, Roboto on Android, Segoe UI on Windows) via the `--font-sans` system stack — *not* a web font. Telegram itself renders in the system font; matching it is non-negotiable for "native" feel.
- **Mono/numbers:** system monospace stack (`--font-mono`). Use **tabular-nums** for ALL money/share figures (`.tnum` → `font-feature-settings: "tnum"`).
- Scale (mobile-first) — Telegram wants compact, readable hierarchy:
  | Role | Size / weight | Tracking | Color |
  |---|---|---|---|
  | Large balance (Home hero) | `1.625rem` / 700, tabular | -0.02em | `--foreground` |
  | H1 (screen title — usually the Telegram header) | `1.0625rem` / 600 | -0.01em | `--foreground` |
  | H2 (block/section title) | `0.9375rem` / 600 | 0 | `--foreground` |
  | Section label (uppercase over a block) | `0.6875rem` / 600, uppercase, +0.04em | | `--muted-foreground` |
  | Body / row label | `0.9375rem` / 400 | 0 | `--foreground` |
  | Row value/meta | `0.9375rem` / 500, tabular | 0 | `--foreground` |
  | Tertiary meta | `0.8125rem` / 400 | 0 | `--muted-foreground` |

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

## Motion
- Framer Motion. Durations 200–280ms, ease `[0.32,0.72,0,1]` (iOS-ish).
- Row tap: opacity/scale to 0.96 for 120ms (Telegram row press feel); release → bounce back.
- List mount: fade + 4px up, stagger 40ms.
- Bottom sheet: spring `{ damping: 34, stiffness: 380 }`, drag-handle dismiss down.
- Number changes (balance/price): animate value via `motion` 220ms; never jump.
- Respect `prefers-reduced-motion` (instant cuts, no spring).

---

## Component Visual Spec (native-Telegram quick reference)

### Grouped "Block" (the core primitive)
`bg-card rounded-[12px]` (no border, no shadow). Contains ≥1 row.
Rows: `min-h-[48px] px-4 gap-2` left label, right value/meta, optional trailing `ChevronRight` (nav) or control. Separator: `border-t border-border` **inset-left 16px** (`mx-4`). Selected/tapped row: `bg-accent`. Section label above a block: uppercase `.muted-foreground`.

### Telegram Header (title bar)
Prefer the SDK's native title bar when present; otherwise custom `h-[44px] bg-background/95 backdrop-blur px-4 flex items-center`, centered title 17px/600, leading slot for `BackButton` chevron, trailing for actions (gear/avatar). Top safe-area as page pad.

### Bottom Tab Bar (app-owned)
`fixed bottom-0 inset-x-0 max-w-[480px] mx-auto h-[52px] pb-[env(safe-area-inset-bottom)] bg-card/95 backdrop-blur border-t border-border grid grid-cols-4`. Each tab: icon 24 + label 10px, `gap-1 items-center`. Active = `--primary` (icon + label); inactive = `--muted-foreground`. Tap → `selectionChanged` haptic.

### MainButton (Telegram native)
When a screen has a single primary action, surface it via the Telegram `MainButton`: full-width bottom, `h-[50px]`, `--primary` bg, `--primary-foreground` 600 text 0.9375rem, sits above the safe-area. Hide the app tab bar's chrome conflict (MainButton is bottom-most). Do **not** also render an in-page primary button on those screens.

### Buttons (in-page, when MainButton not used)
- **Primary:** full-width `h-[48px] rounded-[10px] bg-primary text-primary-foreground font-semibold`, text 0.9375rem. Disabled: `bg-secondary text-muted-foreground` (no blue).
- **Secondary:** `bg-secondary text-primary` (Telegram "text button" feel) or outline `border border-border bg-transparent`.
- Tap ≥44×44, no shadow, small press scale.

### Fields / Inputs
`h-[48px] rounded-[10px] bg-input px-3` placeholder `--muted-foreground`, text `--foreground`. Inline validation text below in `--danger`, 0.8125rem. Stepper (qty): `bg-card rounded-[10px]` with − / + 44px hit areas, number tabular centered.

### Status pills
`rounded-full px-2 py-0.5 text-xs font-medium`: Success = `text-success bg-success/12`, Warning = `text-warning bg-warning/12`, Danger = `text-danger bg-danger/10`. Capsule only; no drop shadow.

### Funding / progress bar
Track `h-[6px] rounded-full bg-surface-2`, fill `bg-primary` (or `bg-success` if fully funded), width animated 280ms. `%` label right, tabular.

### Order book
Two stacked lists in a block. Bid rows tinted `text-success`, Ask rows `text-danger`; best row bg `--accent`. Columns Price / Qty / Cumulative, right-aligned, `font-mono text-xs tabular-nums`. Mono numbers, hairline rows.

### Property card (Marketplace)
`bg-card rounded-[12px]` (no border). Thumb `aspect-[16/10] rounded-[12px]` (full-bleed top). Body `p-4`: title H2, location meta (muted), then a 2-col row grid (total price / share price) tabular, funding progress bar with % . Tappable whole-card → detail. Count badge bottom-right on thumb if needed.

### My-position block
Block rows: Shares owned, Avg cost, Current value, Unrealized PnL. PnL value colored `--success`/`--danger` with arrow glyph, tabular.

### Balance card (Home hero)
`bg-card rounded-[12px] p-4`: label "Portfolio value" uppercase muted; value XL tabular (`1.625rem/700`); TON estimate below, muted, tabular. No gradient bar (flat). One block, guttered.

### Earnings timeline
Block of rows: each row = thumb 36 + property name + week label (muted) + amount (tabular, H2) + status pill. Separator inset-left 16px. Newest first. No left rail (keep flat Telegram look).

### Toast / Snackbar
Top-center, `mt-[max(env(safe-area-inset-top),8px)]`, `bg-card border border-border rounded-[10px] px-4 py-3 text-sm`, icon-led, auto 3s. Success tint = success-colored icon + default card; error = danger-colored icon + danger left border. Slide-down 200ms.

### Bottom sheet (Sell order, order detail)
`bg-card rounded-t-[16px] pt-2` with drag handle `h-[5px] w-[36px] rounded-full bg-border mx-auto mt-1`. Rows inside are grouped-block rows. Backdrop scrim `bg-black/40`. Telegram `BackButton` closes the sheet.

### Skeletons (no spinner where a list lives)
`bg-surface-2 rounded-[6px]`, animate `pulse` (tw-animate-css), matching the final element's size/shape exactly (card, row, bar).

### Empty state
Centered: ~120px monochrome line-illustration in `--muted-foreground`, headline H2, one muted sentence, one **Primary** button (or "Explore Marketplace" → Marketplace tab).

---

## Do / Don't
- **DO:** system fonts, tabular numbers, grouped blocks, inset hairlines, one hairline per separation, ≥44px touch targets, MainButton for screen-primary actions, haptics on confirms.
- **DON'T:** multiple accents, neon, gradients, drop shadows on blocks, full-bleed dividers, web-style bordered cards, emoji in UI chrome, horizontal scroll, web fonts, long tables.

## Audit
Run `/design-review` (`.opencode/commands/design-review.md`) on any screen against this file before marking a phase done. A screen that "looks fine but not native-Telegram" is a **fail**.