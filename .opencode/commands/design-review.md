---
description: "Audit the current screen/file against DESIGN_SYSTEM.md before declaring a phase done"
---

# Design Review — DigiHouse

Perform a focused visual & spec consistency review BEFORE marking a build phase complete.

## Inputs
- Read `docs/research/DESIGN_SYSTEM.md` (the authority).
- Read `docs/research/REQUIREMENTS.md` for the R-IDs the screen must satisfy.
- Read `src/app/globals.css` for the live tokens.

## Check each screen/component the user just touched against:
1. **Tokens** — only colors/spacing/radii/motion defined in DESIGN_SYSTEM.md or `globals.css`. No hardcoded hex/neon. TON blue is the single accent; green/red only for bid/ask & up/down.
2. **Typography** — Geist sans, Geist Mono for numbers; tabular-nums on every money/share figure (add `tnum` class).
3. **Layout** — max-width ≤480px, centered, `px-4`; safe-area top/bottom; no horizontal scroll; ≥44px touch targets.
4. **One primary action** per screen; secondary actions muted.
5. **States shipped** — loaded, loading skeleton, empty (with Marketplace CTA where required), error.
6. **Money** — stored/typed in integer minor units; displayed via `src/lib/format.ts` (`usd`, `ton`, `shortAddr`, `pct`). No float math in components.
7. ** UIKit discipline** — shadcn primitives reused; no duplicated `ui/` components; novel SVGs live in `src/components/icons.tsx`.
8. **Integration boundaries** — wallet via `useTonConnect`; data via TanStack Query hooks; mock layer only via repo interface (`src/lib/api`). Components never import `@tonconnect/*` or `src/lib/mock/*` directly.

## Output
Report per file: PASS or a bullet list of concrete fixes (file:line, token to use). Then, if fixes are trivial, apply them. Do NOT declare the phase done until every touched screen PASSES and `npm run check` is green.