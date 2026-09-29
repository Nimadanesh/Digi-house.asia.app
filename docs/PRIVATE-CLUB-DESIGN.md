# FractionalLuxe Private Club — Glassmorphism Design System

> Visual source of truth for the Private Club redesign. Scope is visual only: no product logic, data, routes, economics, copy, or navigation changes.

## 1. Design Intent

Private Club is a distinct private layer inside FractionalLuxe: **premium, exclusive, calm, modern, airy, sophisticated, tactile, dark, glass-layered**.

The target is premium 2025–2026 dark Glassmorphism: translucent surfaces, controlled blur, luminous edges, subtle ambient light, layered depth, restrained blue, and tiny champagne accents.

Luxury comes from **restraint, hierarchy, material quality, and spacing**, not decoration.

Avoid: cyberpunk, casino, neon-heavy, gold-heavy, noisy, generic glass UI, giant typography, excessive gradients, excessive animation.

## 2. Product Invariants — NEVER CHANGE

Keep exactly as implemented:

- `/club` route
- membership tier thresholds and state logic
- benefit definitions and unlock progression
- Club section order and content
- CTA destinations and behavior
- data flow
- referral behavior
- `/card`
- Marketplace, Estate, Portfolio, Earnings behavior
- BottomTabBar and TABS
- navigation architecture

**Club is NOT a bottom navigation tab.**

This document is a visual source of truth, not a product specification.

## 3. Material Hierarchy

Use four glass levels. Do not make every surface equally strong.

### L0 — Background

```css
background: #070B14;
```

Atmosphere may use extremely subtle radial washes:

```css
background:
  radial-gradient(circle at 18% 8%, rgba(75,139,255,.11), transparent 34%),
  radial-gradient(circle at 88% 28%, rgba(212,175,119,.045), transparent 30%),
  #070B14;
```

No loud gradient and no animated background.

### L1 — Subtle Glass

```css
background: rgba(255,255,255,.045);
backdrop-filter: blur(22px);
-webkit-backdrop-filter: blur(22px);
border: 1px solid rgba(255,255,255,.075);
box-shadow:
  0 10px 30px rgba(0,0,0,.18),
  inset 0 1px 0 rgba(255,255,255,.035);
```

### L2 — Standard Glass

```css
background: rgba(255,255,255,.065);
backdrop-filter: blur(28px);
-webkit-backdrop-filter: blur(28px);
border: 1px solid rgba(255,255,255,.11);
box-shadow:
  0 16px 42px rgba(0,0,0,.24),
  inset 0 1px 0 rgba(255,255,255,.045);
```

### L3 — Highlighted Glass

For current membership, next unlock, selected/important surfaces:

```css
background: linear-gradient(
  135deg,
  rgba(75,139,255,.12),
  rgba(255,255,255,.065) 48%,
  rgba(255,255,255,.045)
);
backdrop-filter: blur(32px);
-webkit-backdrop-filter: blur(32px);
border: 1px solid rgba(75,139,255,.28);
box-shadow:
  0 18px 50px rgba(0,0,0,.28),
  0 0 28px rgba(75,139,255,.075),
  inset 0 1px 0 rgba(255,255,255,.065);
```

### L4 — Hero Glass

Reserved for the membership card:

```css
background: linear-gradient(
  135deg,
  rgba(20,37,68,.72),
  rgba(255,255,255,.075) 52%,
  rgba(12,23,43,.68)
);
backdrop-filter: blur(36px);
-webkit-backdrop-filter: blur(36px);
border: 1px solid rgba(255,255,255,.16);
box-shadow:
  0 24px 70px rgba(0,0,0,.34),
  0 0 42px rgba(75,139,255,.09),
  inset 0 1px 0 rgba(255,255,255,.075);
```

No continuous shimmer.

## 4. Color Tokens

```text
Background       #070B14
Luxury Blue      #4B8BFF
Champagne Gold   #D4AF77
Primary Text     #FFFFFF
Secondary Text   #A0A8B8
Unlocked         #34D399
```

Glass:

```text
Glass 1          rgba(255,255,255,.045)
Glass 2          rgba(255,255,255,.065)
Glass 3          rgba(255,255,255,.08)
Glass Strong     rgba(255,255,255,.12)
Border           rgba(255,255,255,.11)
Border Soft      rgba(255,255,255,.075)
Highlight        rgba(255,255,255,.18)
```

Rules:

- Blue = action, active/current, progress.
- Gold = tiny exclusivity detail only; never dominant.
- Emerald = unlocked state only; no neon glow.
- Do not flood the page with blue.

## 5. Geometry and Spacing

```text
Hero card:       24–28px radius
Major cards:     20–24px
Benefit tiles:   18–20px
Rows:            16–20px
Controls:        12–16px
Pills:           999px
```

Preferred spacing rhythm:

```text
4   micro
8   compact
12  small
16  standard
20  card padding
24  section spacing
28  hero breathing room
32  major separation
```

The Club should feel airy. Do not fill every available pixel.

## 6. Typography

Keep the existing application font. Do not add a new font.

- Eyebrow: small, refined, slightly tracked, silver.
- Section titles: medium/semibold, white.
- Hero tier: strongest hierarchy, semibold/bold.
- Secondary: silver but always readable.
- Numbers: crisp and legible; never oversized financial-dashboard typography.

## 7. Header

Preserve all current information: PRIVATE CLUB, current tier, invested amount, progress, next-tier state/amount, Signature completion state.

Visual treatment:

- generous top spacing
- refined eyebrow
- elegant tier title
- thin progress track
- subtle blue fill and glow
- no oversized number treatment

Progress:

```css
height: 4px;
border-radius: 999px;
background: rgba(255,255,255,.075);
```

Fill:

```css
background: linear-gradient(90deg,#4B8BFF,rgba(75,139,255,.72));
box-shadow: 0 0 14px rgba(75,139,255,.24);
```

## 8. Membership Card

This is the visual hero: a premium digital membership card, not a generic dashboard card.

Preserve all existing content and Mastercard/card visual language. Do not invent card numbers, expiry, benefits, financial values, or status data.

Use L4 glass, subtle blue depth, one tiny champagne detail, luminous edge, generous empty space.

The card should feel expensive because of material, lighting and restraint.

## 9. Benefits

Exactly six, grouped exactly as currently implemented:

**ACCESS**
- Villa Stay
- Priority Access

**EXPERIENCES**
- Private Escape
- Concierge

**MEMBERSHIP**
- Private Club Card
- Referral Rewards

Use compact glass tiles with icon circles, title, existing state/status, and existing description where present.

Unlocked:
- subtle blue icon treatment
- `#34D399` status text
- no neon

Locked:
- subdued glass
- lock indicator
- readable text
- state must not depend on color alone

## 10. Sheets

Benefit, tier and escape sheets keep their existing information architecture and behavior.

Use dark translucent glass, 28–36px blur, subtle border, large radius, refined close control, clear hierarchy.

Preserve Esc/backdrop close, accessibility, haptics, and existing actions.

## 11. Private Escape

Make this the emotional centerpiece without changing functionality.

Use L3/L4 glass, larger radius, deeper shadow, and an approved existing image only if already available. Do not add an external image API/dependency.

Existing `Create a Gift` remains a clear blue tactile CTA.

No booking, dates, payments, or invented economics.

## 12. Referral

Use a clean horizontal glass card:

```text
icon | title + description | action
```

It may stack on narrow screens. Keep the existing referral flow. No reward amounts, percentages, credits, or new mechanics.

## 13. Next Unlock

Use L3 glass.

Hierarchy:

```text
Next level
Amount remaining
Existing message
Explore Estates
```

CTA is blue and clear. Do not invent benefit/economic claims.

## 14. Membership Levels

Use stacked premium glass rows.

Current:
- L3
- subtle blue edge
- CURRENT badge
- slightly brighter surface

Past:
- L1/L2
- check icon
- subdued but readable

Future:
- L1/L2
- lock icon
- no misleading checkmark

Do not dim future tiers until they become unreadable.

## 15. Tier Sheets

Same glass language. Current tier gets stronger blue emphasis; future tiers stay subdued and locked. Do not invent content.

## 16. Buttons

Primary:

```css
background: #4B8BFF;
color: #FFFFFF;
border-radius: 14px;
box-shadow: 0 8px 24px rgba(75,139,255,.20);
```

Secondary:

```css
background: rgba(255,255,255,.065);
border: 1px solid rgba(255,255,255,.11);
color: #FFFFFF;
```

Do not make every button blue.

## 17. Icons

Keep the existing icon system. No new icon library.

Prefer clean outline icons, consistent stroke weight, soft-rounded geometry. Avoid 3D icons, emoji, detailed illustrations and glowing icon clusters.

## 18. Glass Fallback

If backdrop blur is unsupported, readability wins:

```css
background: rgba(16,25,42,.92);
```

Use progressive enhancement:

```css
background: rgba(16,25,42,.92);

@supports (backdrop-filter: blur(20px)) {
  background: rgba(255,255,255,.065);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
}
```

## 19. Responsive Rules

Canonical mobile: **480×840**. Desktop verification: **1280×800**.

Requirements:

- zero horizontal overflow
- no clipping
- no text collisions
- no CTA clipping
- safe-area support
- stable scrolling
- intentional spacing

At narrow widths, reflow instead of merely shrinking everything. Benefit grids may reduce columns; referral may stack; card internals may reflow.

## 20. Bottom Navigation

Do not change tab count, labels, destinations, architecture, or active-state logic.

Club remains a route, not a tab.

A route-scoped glass presentation is acceptable only if it does not alter global navigation behavior.

## 21. Motion

Allowed: existing transitions, subtle press feedback, sheet transitions, subtle opacity/scale, existing haptics.

Avoid shimmer, infinite glow, floating cards, animated gradients, parallax, particles and excessive spring animation.

## 22. Accessibility

- touch targets >=44px
- adequate contrast
- no color-only state communication
- progressbar semantics
- accessible buttons
- accessible sheet close
- keyboard/Escape support
- readable locked/current/unlocked states

If glass reduces contrast, increase opacity. Never sacrifice accessibility for visual effect.

## 23. Performance

Do not add UI libraries, animation libraries, image APIs or external dependencies.

Use existing primitives and CSS. Avoid unnecessary nested blur layers.

Priority if performance conflicts with visuals:

1. readability
2. interaction
3. layout
4. glass effect

## 24. Scope Isolation

The Glassmorphism system is Club-specific.

Do not globally restyle Home, Marketplace, Estate, Portfolio, Earnings, Card, global buttons, global sheets, or global navigation unless an existing component already supports a safe route-scoped variant.

## 25. Canonical CSS Reference

```css
:root {
  --club-bg: #070B14;
  --club-blue: #4B8BFF;
  --club-gold: #D4AF77;
  --club-white: #FFFFFF;
  --club-silver: #A0A8B8;
  --club-emerald: #34D399;

  --club-glass-1: rgba(255,255,255,.045);
  --club-glass-2: rgba(255,255,255,.065);
  --club-glass-3: rgba(255,255,255,.08);
  --club-glass-strong: rgba(255,255,255,.12);
  --club-border: rgba(255,255,255,.11);
  --club-border-soft: rgba(255,255,255,.075);
  --club-highlight: rgba(255,255,255,.18);

  --club-radius-sm: 14px;
  --club-radius-md: 18px;
  --club-radius-lg: 22px;
  --club-radius-xl: 28px;

  --club-blur-sm: 22px;
  --club-blur-md: 28px;
  --club-blur-lg: 32px;
  --club-blur-xl: 36px;

  --club-shadow-sm:
    0 10px 30px rgba(0,0,0,.18),
    inset 0 1px 0 rgba(255,255,255,.035);

  --club-shadow-md:
    0 16px 42px rgba(0,0,0,.24),
    inset 0 1px 0 rgba(255,255,255,.045);

  --club-shadow-lg:
    0 18px 50px rgba(0,0,0,.28),
    0 0 28px rgba(75,139,255,.075),
    inset 0 1px 0 rgba(255,255,255,.065);

  --club-shadow-hero:
    0 24px 70px rgba(0,0,0,.34),
    0 0 42px rgba(75,139,255,.09),
    inset 0 1px 0 rgba(255,255,255,.075);
}
```

## 26. Visual QA Gate

Before PASS, inspect the entire Club as one product:

### Overall
- premium
- exclusive
- calm
- airy
- unmistakably FractionalLuxe
- more special than ordinary app surfaces

### Glass
- visibly translucent
- blur visible but controlled
- subtle borders
- soft shadows
- clear material hierarchy
- no plastic appearance

### Color
- deep navy background
- blue primarily for action/current state
- gold extremely restrained
- emerald only for unlocked
- no crypto/casino/neon feel

### Layout
- generous breathing room
- consistent radii
- consistent spacing
- obvious hierarchy
- no crowded cards

### Responsive
- 480×840
- 1280×800
- no overflow
- no clipping
- no overlap

### Accessibility
- >=44px targets
- states not color-only
- readable contrast
- sheet close works
- keyboard/Escape works

Fix obvious visual defects before PASS. Do not wait for separate UI review.

## 27. Final Principle

> **SAME PRODUCT. SAME CONTENT. SAME LOGIC. SAME DATA. SAME NAVIGATION. DISTINCT PREMIUM VISUAL LANGUAGE.**

The user should feel that they have entered a private layer of FractionalLuxe through material, depth, spacing, lighting, typography, and restraint — not through loud marketing or excessive decoration.
