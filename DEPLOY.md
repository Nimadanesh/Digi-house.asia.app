# DigiHouse — Deployment Guide

Production deploy for Telegram Mini App (competition / investor demo).

## 1. Prerequisites

- Node **20+**
- GitHub repo connected (or ZIP upload)
- Vercel account (recommended)
- Telegram account for BotFather
- Tonkeeper / another TON wallet on **testnet** for the buy demo

```bash
npm install
npm test
npm run check   # MUST be green before deploy
```

## 2. Environment variables

Copy locally:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Value |
|----------|----------|--------|
| `NEXT_PUBLIC_TON_NETWORK` | Yes | `testnet` for MVP (`mainnet` only post-MVP) |
| `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` | Recommended after first deploy | `https://<your-domain>/seo/tonconnect-manifest.json` |
| `NEXT_PUBLIC_TON_RELAY_ADDRESS` | Optional | Testnet wallet for 0.01 TON buy stub |
| `NEXT_PUBLIC_PAYOUT_TICK_MS` | Optional | `60000` (live “next payout” tick in demo) |
| `NEXT_PUBLIC_TG_BOT_USERNAME` | Recommended | Bot username **without** `@` (share links) |

Set the same keys in **Vercel → Project → Settings → Environment Variables** (Production + Preview).

## 3. TonConnect manifest (critical)

File: `public/seo/tonconnect-manifest.json`

After you know the public HTTPS URL, replace placeholders:

```json
{
  "url": "https://YOUR_PROJECT.vercel.app",
  "name": "DigiHouse",
  "iconUrl": "https://YOUR_PROJECT.vercel.app/seo/icon.svg",
  "termsOfUseUrl": "https://YOUR_PROJECT.vercel.app",
  "privacyPolicyUrl": "https://YOUR_PROJECT.vercel.app"
}
```

- All URLs must be **absolute HTTPS**
- `iconUrl` must load without auth (commit `public/seo/icon.svg`)
- Runtime fallback: app resolves relative `/seo/tonconnect-manifest.json` via `window.location.origin` (`src/lib/ton/manifest.ts`) — still patch the JSON for wallet store listing consistency

## 4. Deploy on Vercel (recommended)

```bash
# From repo root
npx vercel
# Production:
npx vercel --prod
```

Or: Vercel Dashboard → Import Git repo → Framework **Next.js** → Deploy.

Confirm:

- [ ] `https://…vercel.app` loads Home / Onboarding  
- [ ] `https://…/seo/tonconnect-manifest.json` returns JSON  
- [ ] `https://…/seo/icon.svg` returns 200  

### Framework notes

- Next.js **App Router** + `output: "standalone"` is already set in `next.config.ts` (Docker-friendly)
- No server DB required — mock repos run client-side for MVP

## 5. Telegram BotFather Mini App

1. Open `@BotFather` → `/newbot` (or reuse bot)  
2. `/newapp` → select bot  
3. Title: **DigiHouse**  
4. Description: *Fractional real estate on TON. Buy shares, earn simulated weekly rent.*  
5. Photo: 640×360+ (export icon or property screenshot)  
6. **Web App URL:** `https://YOUR_PROJECT.vercel.app`  
7. Optional short name → deep link:  
   `https://t.me/<bot_username>/<short_name>`

Also set:

- `/setmenubutton` → text “Open DigiHouse” → same Web App URL  
- `/setdomain` if BotFather asks for the app domain  

## 6. Custom hosting (non-Vercel)

```bash
npm run build
# Node standalone:
node .next/standalone/server.js
# or serve static export only if you later switch output (not current config)
```

Requirements:

- HTTPS + valid certificate  
- Serve `public/` assets at site root  
- SPA-style routes: Next server handles `/home`, `/property/[id]`, etc.

## 7. Network switch (testnet → mainnet)

**Do not flip for the university demo** unless contracts and legal copy are ready.

1. Set `NEXT_PUBLIC_TON_NETWORK=mainnet`  
2. Update relay / owner addresses  
3. Revisit honesty copy — on-chain payoutsare still post-MVP unless contracts ship  

## 8. Post-deploy smoke test

| Step | Expect |
|------|--------|
| Cold open in Telegram iOS | Onboarding or Home |
| Cold open Android | Same |
| Desktop Telegram WebView | Layout ≤480px centered |
| Connect wallet | TonConnect modal, testnet |
| Buy Share → Confirm | Success step or honest error + sticky summary |
| Settings → Show Demo badge | Toggle floating pill |
| Buy success → Share | Includes `t.me/<bot>` if username set |

## 9. Rollback

Vercel → Deployments → … → Promote previous production deployment.

---

See also: **[DEMO.md](./DEMO.md)** (pitch script + screenshots) · **[README.md](./README.md)**
