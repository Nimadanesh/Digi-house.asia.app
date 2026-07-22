# DigiHouse

> Fractional property on TON — a Telegram Mini App to buy, sell, and earn **weekly rental yield** from fractionalized real estate. Small-budget investors buy property shares; owners raise liquidity by selling a percentage. Rent income is paid to shareholders **proportional to their share, weekly**.

Built from scratch (not a clone) on a Next.js 16 · React 19 · Tailwind v4 · shadcn/ui scaffold, targeting Telegram Mini Apps + the TON blockchain.

## Spec docs (read in order before coding)
All live in `docs/research/`:
1. `BRIEF.md` — what & why
2. `REQUIREMENTS.md` — acceptance-criteria-driven requirements (R-IDs)
3. `USER_FLOW.md` — journeys
4. `DESIGN_SYSTEM.md` — authority for every visual decision (tokens in `src/app/globals.css`)
5. `DATA_MODELS.md` — shared TypeScript types
6. `TECH_STACK.md` — exact stack, integration boundaries, decisions log
7. `ROADMAP.md` — phase plan

## Tech Stack
- Next.js 16 (App Router) + TypeScript strict + Tailwind CSS v4 + shadcn/ui + lucide-react
- Framer Motion
- TON: `@tonconnect/ui-react` (connect + send TX)
- Telegram: `@telegram-apps/sdk-react`
- State: TanStack Query + Zustand
- Deploy: Vercel + Telegram Mini App (BotFather)

## Commands
```bash
npm install      # install dependencies
npm run dev      # dev server
npm run build    # production build
npm run lint     # ESLint
npm run typecheck # tsc --noEmit
npm run check    # lint + typecheck + build (MUST be green before a phase is done)
```

## Build phases (ROADMAP.md)
1. **Specifications** (current) — product/tech/design docs approved before any code
2. Foundation — providers, routing shell, native-Telegram design tokens, mock data, Telegram SDK init
3. Components — atomic native-Telegram UI (blocks, cards, order book, balance, earnings timeline)
4. Integration — TonConnect, listings, buy/sell flows, earnings
5. Polish & Deploy — animations, empty/error states, Telegram theming, QA, deploy

## Agent setup
- `AGENTS.md` is the single source of truth for AI coding agents and is read natively by OpenCode.
- `/design-review` (`.opencode/commands/`) audits a screen against `DESIGN_SYSTEM.md`.

## License
MIT