# E2E Tests — Playwright

## Prerequisites

- Node.js 20+
- Chromium (installed via `npx playwright install chromium`)

## Quick start (local)

### Terminal 1 — API

```bash
cd apps/api
cp .env.example .env
# Edit .env: ensure TELEGRAM_BOT_TOKEN and SESSION_SECRET are set
npm run dev:api
```

### Terminal 2 — Mini App

```bash
# Set env for api mode + dev token
export NEXT_PUBLIC_DATA_SOURCE=api
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
export NEXT_PUBLIC_DEV_TOKEN=<jwt-from-mint>

npm run dev
```

### Mint a DEV_TOKEN

```bash
# One-time: mint a JWT for the seeded user
npx tsx e2e/helpers/mint-jwt.ts
# Copy the output into NEXT_PUBLIC_DEV_TOKEN
```

### Run tests

```bash
npm run test:e2e          # headless
npm run test:e2e:ui       # Playwright UI mode
```

## Running against staging

1. Deploy API + Mini App to staging
2. Set `PLAYWRIGHT_BASE_URL=https://staging.vercel.app`
3. Set `PLAYWRIGHT_API_URL=https://api-staging.fly.dev`
4. Note: staging may require CORS + HTTPS. Playwright Chromium works on `https://` URLs without Telegram WebView limitations.

## Telegram WebView caveats

Playwright Chromium is **not** a Telegram WebView. Tests that rely on:
- `@telegram-apps/sdk` init (Telegram WebView-specific APIs)
- TonConnect injection (wallet browser extension)
- Telegram theme params from the native client

…will not work outside a real TMA. The E2E suite is for **UI logic and rendering verification**, not for Telegram-native behavior.

## Honesty (non-negotiable)

The `earnings-honesty.spec.ts` file asserts that `PAYOUT_DISCLAIMER` text is visible and that no false on-chain claims appear. Never remove or soften these assertions — they protect against regulatory/trust failures (ADR-001).
