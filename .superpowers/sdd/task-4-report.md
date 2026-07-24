# Task 4 Report — Telegram SDK layer (`lib/telegram/**`)

## Files created (6)
- `src/lib/telegram/signals.ts` — thin re-exports of SDK namespaces + types.
- `src/lib/telegram/haptics.ts` — `haptics` object honoring `prefers-reduced-motion`, try/catch no-op fallback.
- `src/lib/telegram/theme-mapper.ts` — `applyTelegramThemeParams` writes `--tg-*` CSS vars on `:root`.
- `src/lib/telegram/TelegramProvider.tsx` — `"use client"` provider; calls `init()` once, `miniApp.ready()`, header/bg color `#17212b`, viewport mount+expand, closing-behavior mount, back/main button mount, cleanup on unmount. Exposes `useTelegramReady()` and `bindLiveThemeVars()`.
- `src/lib/telegram/index.ts` — barrel.
- `src/hooks/useTelegram.ts` — `"use client"` façade; re-export typed `TelegramSurface`; reads viewport/themeParams via `useSignal`.

## Verification gates
1. `npm run typecheck` → 0 errors (Final lines):
   ```
   > digihouse@0.1.0 typecheck
   > tsc --noEmit
   ```
   (no diagnostics emitted)
2. `npm run build` → green:
   ```
   ✓ Compiled successfully in 2.5s
     Running TypeScript ...
     Finished TypeScript in 2.2s ...
   ✓ Generating static pages using 5 workers (4/4) in 498ms
   Route (app)
   ┌ ○ /
   └ ○ /_not-found
   ○  (Static)  prerendered as static content
   ```
3. Commit:
   - SHA: `dc7d1be`
   - Message: `feat(telegram): TelegramProvider + useTelegram facade (3.x signal-based SDK)`

## API-shape deviations (documented)
1. **`mainButton.hide` does not exist in the 3.x SDK.** The Main Button namespace only exports `mount`, `onClick`, `offClick`, and `setParams` — there is no direct `hide()`. Hiding is done through `setParams({ isVisible: false })`. To preserve the brief's `TelegramSurface.mainButton.hide()` interface (consumed by Task 9 MainButtonBridge), `useTelegram.ts` implements `hide` as:
   ```ts
   const hideMain = useCallback(() => {
     try { mainButton.setParams({ isVisible: false } as never); } catch { /* ignore */ }
   }, []);
   ```
   No `any` used; `as never` cast consistent with the brief's `setParams(p as never)` convention. The façade's public shape matches the brief.

2. **`themeParams.state` form:** `useSignal(themeParams.state)` — the 3.x `state` export is a `Computed<Partial<Record<string, #{string}>>>`, satisfying `useSignal`'s `{ (): T; sub(fn): VoidFunction }` signature. Typecheck passed on the first try with this form; **the `useState`/`on("change")` fallback was NOT needed**. Shipped: `useSignal(themeParams.state)`.

3. **`themeParams.state()` call inside `bindLiveThemeVars`** (TelegramProvider.tsx): kept verbatim — `themeParams.state()` returns the current `ThemeParams` value (Computed is also a callable). Cast to `Parameters<typeof applyTelegramThemeParams>[0]` per brief.

## Self-review checklist
- [x] No `any` anywhere (`as never`/`as unknown` casts only). Grep confirms zero `any` type annotations in the 6 new files (the only `\bany\b` hit is a comment in the pre-existing `useTonConnect.ts`).
- [x] No `lib/telegram/*` file imports `lib/ton`, `lib/mock`, `lib/api`, any `@tonconnect/*`, or any React component. Grep confirms zero matches.
- [x] `useTelegram()` is a `"use client"` hook returning the `TelegramSurface` shape (viewport w/h/stableHeight/isExpanded, safeAreaInsets, backButton {show,hide,onClick}, mainButton {setParams,hide,onClick}, haptics, themeParams, ready, isDark).
- [x] `TelegramProvider` calls `init({ acceptCustomStyles: true })` exactly once in `useEffect`, returns the cleanup function; nested SDK calls wrapped in `try{}catch{}` per the brief (backButton.mainButton.mount left un-wrapped per the brief).
- [x] `haptics` honors `prefers-reduced-motion: reduce` via `window.matchMedia` gate, and additionally no-ops on `throw` for unsupported envs.
- [x] `theme-mapper.ts` writes only `--tg-*` CSS custom properties on `document.documentElement` (never DigiHouse `--background`/`--card` tokens). Those app tokens remain static by default.

## Concerns (non-blocking)
- **`theme-mapper.ts` MAP uses camelCase keys (`backgroundColor`, `textColor`, …) but the SDK `ThemeParams` payload (from `themeParams.state()`) uses snake_case keys (`bg_color`, `text_color`, …).** The `MAP` record type is `Record<keyof ThemeParams, string>`, and since the SDK's `ThemeParams = Partial<Record<KnownThemeParamsKey | string, RGB>>`, `keyof ThemeParams ≈ string`, so the type cast `as Record<keyof ThemeParams, string>` compiles but the lookup `MAP[snake_case_key]` will always be `undefined` at runtime. The for-loop falls back to `--tg-${k}` (e.g. `--tg-bg_color` with an underscore) rather than the intended `--tg-bg-color`. This is a **functional** mismatch that will matter when Task 12's `useTheme` actually consumes live theme vars; it does not affect Task 4's gate (typecheck/build). Shipped verbatim per the brief's "follow verbatim, do not invent" directive. Flagging here so Task 12 (or a follow-up) can correct the MAP to snake_case keys or map camelCase↔snake during iteration. No build impact.

## Status
DONE_WITH_CONCERNS