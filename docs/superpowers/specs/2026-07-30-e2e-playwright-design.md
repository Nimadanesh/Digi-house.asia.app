# E2E Playwright Suite — Design

**Phase**: P5-03
**Date**: 2026-07-30
**Status**: Approved

## Auth strategy

Use `NEXT_PUBLIC_DEV_TOKEN` for all authed specs (portfolio, transactions). The `AuthProvider` already has a code path at `src/lib/api/AuthProvider.tsx:49` that reads `env.devToken`, sets the token via `setApiAccessToken()`, and marks status=authenticated.

**JWT minting**: A node script `e2e/helpers/mint-jwt.ts` imports the API's `signSessionToken` + `FIXTURE_BOT_TOKEN` to produce a valid JWT for the seeded demo user. The output goes into a `.env.e2e` file as `NEXT_PUBLIC_DEV_TOKEN`. This script is documented in `e2e/README.md` and is a one-time manual step, not part of CI.

**Shell/marketplace specs** do not require auth — they work under `NEXT_PUBLIC_DATA_SOURCE=mock` or `api` and verify public UI.

**Bot token**: Stays API-only. The mint script reads `TELEGRAM_BOT_TOKEN` from env (or uses the fixture token `test-bot-token-p1-04-not-real` for local dev). Never logged, never in `NEXT_PUBLIC_*`.

## Config

- `playwright.config.ts` at repo root
- Chromium only (MVP)
- Viewport 480×840 (Telegram Mini App)
- 2 workers, 30s timeout per test
- `PLAYWRIGHT_BASE_URL` env (default `http://localhost:3000`)
- No `webServer` — two-terminal runbook (API + Mini App)

## Test files

| File | Auth | Key assertions |
|---|---|---|
| `smoke-shell.spec.ts` | No | App loads, 4 tabs render, no crash, 480px viewport |
| `marketplace.spec.ts` | No | ≥1 property card with weekly yield, detail opens, Buy control visible |
| `earnings-honesty.spec.ts` | Optional | `PAYOUT_DISCLAIMER` text present, no false on-chain claims, simulated badge where applicable |
| `portfolio.spec.ts` | **Yes** | Holdings list or empty-state CTA, /transactions if route exists |

## Selector rules

1. `getByRole` / `getByText` first
2. `data-testid` only when aria insufficient (existing pattern in `LanguageSelector.tsx`)
3. Black-box UI — no scraping internal store/React state

## Commands

- `npm run test:e2e` → `playwright test`
- `npm run test:e2e:ui` → `playwright test --ui`

## Honesty rules (non-negotiable)

- Assert `PAYOUT_DISCLAIMER` constant from `src/lib/constants.ts`
- Fail if any text claims "landed in wallet" or "on-chain verified" as present-tense paid fact
- Do not assert simulated badges that don't exist in current DESIGN_SYSTEM

## References

- ADR-001 §3 (UI badge rules), §4 (cutover gates)
- `src/lib/constants.ts` — `PAYOUT_DISCLAIMER`
- `src/lib/api/AuthProvider.tsx` — DEV_TOKEN code path
- `apps/api/src/auth/test-fixtures.ts` — initData HMAC helper
- ROADMAP Phase 5.2 testing pyramid
