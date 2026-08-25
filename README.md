# FractionalLuxe

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

## API + local infra

npm workspaces: Mini App at **repo root**; API at `apps/api`; shared stub at `packages/shared`. Full move to `apps/web` is deferred.

```bash
npm install
npm run dev:api          # http://localhost:8787
curl -sS http://localhost:8787/healthz
npm run typecheck:api
```

**Postgres 16 + Redis** (Docker; does not start legacy Next compose services):

```bash
npm run infra:up         # docker-compose.infra.yml
npm run infra:ps
# DATABASE_URL=postgresql://digihouse:digihouse@localhost:5432/digihouse  (DEV ONLY)
# REDIS_URL=redis://localhost:6379
npm run infra:down
npm run infra:down:v     # wipe volumes
```

Full setup, env table, route table, and troubleshooting: [`apps/api/README.md`](./apps/api/README.md).  
Env examples: [`.env.example`](./.env.example), [`apps/api/.env.example`](./apps/api/.env.example).

```bash
npm run db:migrate       # after infra:up + apps/api/.env (users + wallets + properties)
npm run db:seed          # 24 FractionalLuxe manifest listings (idempotent)
```

## Open items

- KYC pending decision (U4) — no identity verification exists today; auth is Telegram initData only.
- Production bot username (deep links), launch mode, and waitlist notifications are pending user inputs.

## Docs

| Doc | Purpose |
|-----|---------|
| **[HANDOVER.md](./HANDOVER.md)** | Full project handoff (features, architecture, demo, future) |
| **[EXECUTION-PLAN.md](./EXECUTION-PLAN.md)** | Phase tracker / next task |
| **[DEPLOY.md](./DEPLOY.md)** | Vercel, env, TonConnect, BotFather |
| **[DEMO.md](./DEMO.md)** | 60s pitch script, screenshots, QA |
| **[apps/api/README.md](./apps/api/README.md)** | API setup, env table, route table, testing, troubleshooting |
| **[docs/PRESENTATION.md](./docs/PRESENTATION.md)** | Deck / QR tips |
| `docs/research/*` | Product specs |
| `docs/adr/*` | Architecture decisions |

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn · TanStack Query · Zustand · TonConnect · Telegram SDK · Hono API (`apps/api`)

## License

MIT
