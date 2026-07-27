# DigiHouse — Project Handover

**Status:** Polished · demo-ready · competition-grade MVP  
**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · TonConnect · Telegram Mini Apps SDK  
**Date:** July 2026

---

## 1. Executive summary

**DigiHouse** is a Telegram Mini App for fractional real-estate ownership on **TON**. Users browse properties, buy shares with a wallet connect flow, track portfolio value, and see **simulated weekly rental yield** proportional to ownership. The product UI is intentionally indistinguishable from native Telegram (colors, grouped lists, MainButton/BackButton, haptics). The MVP uses a **mock data layer** with honesty labels (“demo / simulated”) so investors and judges can experience the full loop without mainnet contracts. The codebase is ownership-strict, tested, production-build clean, and documented for deploy via Vercel + BotFather.

---

## 2. Key features implemented

| Area | Status | Notes |
|------|--------|--------|
| **Onboarding** | Done | ≤3 slides, trust line on last slide, MainButton “Get Started”, skip, replay from Settings |
| **Home** | Done | Greeting, portfolio hero, next payout, my-property chips, featured listing |
| **Marketplace** | Done | Search, filter chips, property cards, empty/filter-empty/error/loading |
| **Property detail** | Done | Gallery, metrics, income calculator, about, trust, rental history, order book |
| **Buy flow** | Done | Bottom sheet qty → summary → success; MainButton chrome; sticky errors; share |
| **Earnings** | Done | Hero, chart, streak, expandable integrity math + one demo disclaimer |
| **Portfolio** | Done | Summary, allocation, holdings sheet, open orders |
| **Settings** | Done | Bottom sheet: wallet, currency note, language, theme toggle, **demo badge toggle**, how-it-works, about/legal |
| **Demo badge** | Done | Floating “Demo mode” pill (hidable) |
| **Wallet** | Done | TonConnect via hook boundary; connect/disconnect; simulated TX hashes |
| **4 UI states** | Done | Skeleton / empty / error+retry / loaded on major screens |
| **Error boundaries** | Done | `app/error.tsx`, `app/global-error.tsx` |
| **Deploy docs** | Done | `DEPLOY.md`, `DEMO.md`, this file |

---

## 3. Architecture & code guidelines

### Ownership guard (non-negotiable)

- **One responsibility per file** (~350-line soft limit).  
- **UI never imports** `lib/ton`, `lib/mock`, or `@tonconnect/*` / `@telegram-apps/*` directly.  
- Dependency direction: **UI → hooks → (api | ton) → types**.  
- Money: integer **USD cents** / **nanoTON**; format via `src/lib/format.ts`.  
- MVP payouts: projected fields named `…Projected…`; copy must remain honest (“simulated”).

### Folder map

```
src/
  app/           # App Router pages + error boundaries
  components/    # Presentational UI (settings, property, earnings, …)
  hooks/         # useTelegram, useTonConnect, data hooks
  lib/api|mock|ton|telegram/  # repos, mocks, chain, SDK adapters
  stores/        # Zustand (settings persist, UI chrome flags)
  types/         # leaf types
docs/research/   # product specs (source of truth for product)
```

### State

- **TanStack Query** — server/mock cache (`usePortfolio`, `useMarketplace`, …).  
- **Zustand** — settings (persist) + UI (`settingsOpen`, `mainButtonActive`, `onboardingReplay`).  
- **Telegram / TON** — only through `useTelegram()` / `useTonConnect()`.

### Telegram patterns

- MainButton / BackButton via safe chrome wrappers (localhost no-ops).  
- Haptics on tabs, cards, steppers, retries, buy confirm.  
- Theme: DigiHouse palette by default; optional “Use Telegram theme”.

---

## 4. How to run & deploy

### Local development

```bash
cp .env.local.example .env.local
npm install
npm run dev          # http://localhost:3000
npm test
npm run check        # lint + typecheck + build
```

### Production build

```bash
npm run build
# optional standalone Node server:
node .next/standalone/server.js
```

### Deploy (short)

1. Push to GitHub → **Vercel** import (see `DEPLOY.md`).  
2. Set env vars from `.env.local.example` (`NEXT_PUBLIC_TON_NETWORK=testnet`).  
3. Patch `public/seo/tonconnect-manifest.json` with absolute HTTPS URLs.  
4. BotFather `/newapp` → Web App URL = Vercel domain.  
5. Optional: `NEXT_PUBLIC_TG_BOT_USERNAME` for post-buy share links.

### Demo vs “real” TON

| Mode | Behavior |
|------|----------|
| **Default (MVP)** | Mock repos + simulated yield + synthetic `txHash` (`simulated:…`). TonConnect can still send a tiny testnet TX stub if configured. |
| **Network flag** | `NEXT_PUBLIC_TON_NETWORK=testnet` \| `mainnet` — wallet network only. |
| **Post-MVP** | Swap `src/lib/mock` for live APIs/contracts behind the same repo interfaces; keep honesty UI until distribution is live. |

Do **not** market MVP yield as on-chain settled.

---

## 5. Demo scripts

### 60-second pitch

1. Cold open → onboarding → trust line on slide 3 → **Get Started**.  
2. Home: ~$62k portfolio, $90/wk projected, Demo pill visible.  
3. Marketplace → **Marina Vista** → trust + rent history.  
4. **Buy Share** → qty → Confirm (wallet if available).  
5. Success → Portfolio (holdings + open order) → Earnings (streak + expand one row).

### 3-minute deep dive

1. **Problem / product** (15s): fractional RE inside Telegram.  
2. **Onboarding honesty** (20s): demo disclaimer placement.  
3. **Home numbers** (30s): projected vs paid language.  
4. **Property trust** (30s): tenant, lease, rental history once-disclaimer.  
5. **Buy transparency** (40s): fees $0, total math, confirming state, failure sticky error if shown.  
6. **Earnings integrity** (30s): expand row — share × pool = payout.  
7. **Settings** (15s): theme toggle, hide Demo badge, How DigiHouse Works replay.  
8. **Roadmap ask** (20s): mock ledger → jettons + Friday distribution contracts.

Full props list: `DEMO.md`. Deploy detail: `DEPLOY.md`.

---

## 6. Future improvements (honest backlog)

- Real backend + auth (Telegram `initData` verification).  
- On-chain fraction jettons + weekly distribution contracts.  
- Live order book / cancel open sell (today: seed display + “Sell coming soon”).  
- Real property media pipeline (higher-res photography).  
- Multi-language, display-currency switch for all heroes.  
- Owner “list a property” flow (spec Should).  
- Notifications for weekly payout.  
- Mainnet + compliance copy, KYC if required.  
- Analytics / funnel for growth.  
- E2E Playwright against Telegram mock env.

---

## 7. Testing & quality status

| Metric | Value |
|--------|--------|
| Automated tests | **174** (Vitest + Testing Library) |
| Pass rate | **100%** on last full run |
| Gates | `npm run check` = lint + `tsc` + production build |
| Integrity | `src/lib/__tests__/integrity.test.ts` (detail yield ≡ paid entries) |

### Known limitations (demo nature)

- Yield and most ledger state is **seed/mock**, not irreversible chain state.  
- Property images are generated gradients suitable for UI (swap Adder real assets for press).  
- TonConnect needs **HTTPS** deploy (or tunnel) inside Telegram.  
- Physical iOS/Android smoke is a manual post-deploy checklist (`DEMO.md`).  
- Secondary market sell is not executable in MVP UI.

---

## 8. Key documents index

| File | Audience |
|------|----------|
| `HANDOVER.md` (this file) | Everyone: status + handoff |
| `README.md` | Quick start |
| `DEPLOY.md` | Engineers deploying |
| `DEMO.md` | Pitch / QA |
| `docs/PRESENTATION.md` | Slides / QR |
| `docs/research/*` | Spec authority |
| `AGENTS.md` | Coding agents |

---

## 9. Maintainer checklist (day-one)

- [ ] Read `docs/research/BRIEF.md` + `REQUIREMENTS.md`  
- [ ] `npm test` && `npm run check`  
- [ ] Run app; open Settings; flip both toggles (theme + demo badge)  
- [ ] Confirm ownership: no new UI → `lib/ton` imports  
- [ ] Before any “paid on-chain” copy: re-read ownership skill MVP honesty rules  

---

**Handoff statement:** DigiHouse MVP is an image-complete, test-backed Telegram-native product shell with a credible investor demo loop and a clean boundary for swapping mocks to real TON infrastructure. Ship deployable HTTPS + BotFather binding; keep simulated labels until the distribution contract is live.
