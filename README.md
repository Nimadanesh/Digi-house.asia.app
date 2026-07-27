# DigiHouse

Fractional real estate on **TON** as a **Telegram Mini App** — buy property shares, track a portfolio, and see **simulated** weekly rental yield.

## Quick start

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000 — onboarding once, then Home.

```bash
npm test          # unit / component tests
npm run check     # lint + typecheck + build
```

## Docs

| Doc | Purpose |
|-----|---------|
| **[HANDOVER.md](./HANDOVER.md)** | Full project handoff (features, architecture, demo, future) |
| **[DEPLOY.md](./DEPLOY.md)** | Vercel, env, TonConnect, BotFather |
| **[DEMO.md](./DEMO.md)** | 60s pitch script, screenshots, QA |
| **[docs/PRESENTATION.md](./docs/PRESENTATION.md)** | Deck / QR tips |
| `docs/research/*` | Product specs |

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn · TanStack Query · Zustand · TonConnect · Telegram SDK

## License

MIT
