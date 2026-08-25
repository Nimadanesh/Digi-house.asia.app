# Property Page Redesign – Complete Specification
**Version:** 1.0  
**Date:** 2026-08-25  
**Status:** Ready for implementation  
**Priority:** Conversion-first + Clean UX for traditional investors + Rich data for advanced users

---

## 1. Goals & Principles

- Primary goal: Maximize conversion to purchase (Buy Shares)
- Target user: Traditional real-estate investors with medium capital + more technical users
- Design philosophy: Apple-level simplicity & beauty + CoinGecko-level data richness
- Platform: Telegram Mini App (max-width ~480px, mobile-first, flat native style)
- Must feel premium, trustworthy and calm (not crypto-casino)

### Strict Constraints (DO NOT VIOLATE)
- No new dependencies without explicit approval (especially charting libraries)
- Charts must be pure SVG (follow existing WeeklyEarningsChart.tsx pattern or diagram-design editorial style)
- Reuse existing components wherever possible:
  - IncomeCalculator.tsx
  - TradeSection / RecentTrades / orderbook mocks
  - Sheet.tsx and other base-ui / shadcn-style primitives
- Do NOT change any calculation logic, API contracts, database schema or yield formulas
- Keep all existing mock data interfaces intact
- Page remains fully Client Component (`"use client"`)
- Respect current design tokens (Tailwind v4 oklch, dark theme)
- Framer Motion is NOT installed – do not use it

---

## 2. Page Variants & User States

### 2.1 Property Status
- **Primary** (`Open for Funding`)
  - Shows funding progress, shares left, single “Buy Shares” CTA
  - No Order Book / no Sell

- **Secondary** (`Resale` / `Fully Funded`)
  - Shows live market data, Order Book, Recent Trades, Buy + Sell CTAs

### 2.2 User Ownership States
The page must adapt based on whether the current user owns shares of this property:

1. **Does NOT own any shares**
2. **Owns unlocked shares**
3. **Owns locked shares** (earning yield)

These states affect:
- Calculator default values
- Visibility of “Lock Shares” actions
- Yield section content
- Sticky CTA text

---

## 3. Overall Page Structure (Top → Bottom)

1. Hero Section (Photo + Status Banner + Title + Hero Metric + Primary CTA)
2. Key Metrics (2×2 grid)
3. Investment Calculator (“How much can I earn?”)
4. Performance Chart (SVG Line chart with tabs)
5. Market Section (only Secondary)
6. Trust & Social Proof strip
7. About + More details
8. Documents
9. Similar Properties
10. Sticky Bottom CTA Bar (always visible)

Use generous whitespace, strong visual hierarchy, and progressive disclosure (Sheets / Bottom Sheets for details).

---

## 4. Phase 1 – What to Build Now (Detailed)

### Phase 1 Scope
Implement the foundational structure and the highest-conversion parts:

- Full page layout skeleton
- Hero Section (both Primary & Secondary)
- Status Banner
- Key Metrics 2×2
- Sticky Bottom CTA
- Basic responsive behavior (max-width 480px)
- Conditional rendering for Primary vs Secondary
- Placeholder sections for later phases (Calculator, Chart, Market, etc.) with correct titles and empty states

**Do not implement Calculator logic, Charts, Order Book, Lock flow, or Sheets yet.**  
Those come in later phases.

### 4.1 Hero Section Spec

**Elements (top to bottom):**
- Back button + “Property” title (existing pattern)
- Large property image (swipeable gallery later)
- Status Banner (full-width, rounded, high contrast)
  - Primary: soft orange/amber background  
    Text: `Open for Funding · {progress}% · {sharesLeft} shares left`
  - Secondary: soft green background  
    Text: `Fully Funded · Live Trading`
- Property name (large, bold)
- Location with pin icon
- Hero Number (very large): `{apy}%`
- Label under it: `Expected Annual Yield`
- Small trust line: `Based on current lease · {months} months on-time payments`
- Primary CTA button (full-width, prominent blue):
  - Primary property: `Buy Shares · ${price}`
  - Secondary property: `Buy at ${bestAsk}` (or current price)

### 4.2 Key Metrics (2×2 Grid)
Four clean cards:
- Price per share
- Weekly Yield per share
- Total Property Value
- Investors count (or Shares sold)

Use existing card styles. Icons optional but keep minimal.

### 4.3 Sticky Bottom CTA
- Always visible at bottom
- Primary: `Buy Shares · ${price}`
- Secondary: two buttons side-by-side or single smart button (`Buy · ${price}` / `Sell`)
- Safe-area aware for Telegram

### 4.4 Conditional Logic
```tsx
const isPrimary = property.status === "open_for_funding" || property.status === "primary";
const isSecondary = !isPrimary;
```

Render different Status Banner, CTA text, and hide Market section when Primary.

---

## 5. Future Phases (Do NOT implement yet – only leave placeholders)

**Phase 2 – Calculator**
- Upgrade existing IncomeCalculator
- Add Conservative / Base / Optimistic segments
- Show monthly + yearly + 3y/5y projections
- Direct “Buy X shares” button inside calculator

**Phase 3 – Performance Chart**
- Pure SVG Line chart (editorial style)
- Tabs: Price | Yield
- Time range selectors: 1M / 6M / 1Y / All

**Phase 4 – Market Section (Secondary only)**
- Best Bid / Best Ask highlight
- Compact Order Book
- Recent Trades
- Reuse existing TradeSection components

**Phase 5 – Trust, About, Documents, Similar**
- Trust strip with checkmarks
- About text + “More details” → Bottom Sheet
- Documents list
- Horizontal Similar Properties

**Phase 6 – Ownership States + Lock Flow**
- Detect if user owns shares
- Show Lock / Unlock actions
- Bottom Sheets for Lock confirmation & yield explanation

**Phase 7 – Buy / Sell Flows + Modals / Sheets**
- Full purchase bottom sheet
- Sell flow
- Success / Error states

**Phase 8 – Polish, Testing, Accessibility**

---

## 6. Technical Guidelines for the Agent

1. Start by creating/updating `src/app/(app)/property/[id]/page.tsx`
2. Extract sections into components under `src/components/property/`:
   - `PropertyHero.tsx`
   - `PropertyMetrics.tsx`
   - `PropertyStickyCta.tsx`
   - etc.
3. Use existing Zustand stores and TanStack Query hooks
4. Keep all monetary calculations exactly as they are today
5. Use current mock data shape
6. Prefer composition over big monolithic files
7. After each phase, the page must remain functional and not break existing routes

---

## 7. How to Proceed (Instructions for Agent)

When the user says “Start Phase 1”:

1. Read this entire file carefully
2. Confirm understanding of constraints
3. Implement only Phase 1 scope
4. Reuse existing components and styles
5. After finishing Phase 1, stop and report:
   - What was created/changed
   - Any questions or blockers
   - Screenshot or description of the current state

Do not move to Phase 2 until explicitly told.

---

## 8. Success Criteria for Phase 1

- Page loads for both Primary and Secondary properties
- Correct Status Banner and CTA appear according to status
- Hero + Metrics + Sticky CTA look clean and premium
- No new dependencies added
- No existing calculation or data logic broken
- Mobile width (≤480px) looks good
- Code is clean and follows current project patterns

---


