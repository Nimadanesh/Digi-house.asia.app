# DigiHouse — Demo & presentation runbook

Competition-ready checklist for judges, investors, and live Telegram demos.

**Deploy steps:** see **[DEPLOY.md](./DEPLOY.md)**.

## What judges should feel

Native Telegram UI · clear numbers · honest “demo / simulated” labels · full loop in under a minute.

## Floating Demo badge

- Default **on**: bottom pill “Demo mode” (opens Settings).  
- Settings → **Show Demo badge** toggle to hide for cleaner investor walks (disclaimers elsewhere remain).  
- Hidden on onboarding and while MainButton owns the chrome.

## Prerequisites

1. Node 20+ and `npm install`
2. `cp .env.local.example .env.local`
3. **HTTPS** origin for TonConnect (Vercel or `npx cloudflared tunnel --url http://localhost:3000`)
4. Absolute URLs in `public/seo/tonconnect-manifest.json` (see DEPLOY.md)
5. Env table:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_TON_NETWORK` | `testnet` (MVP) |
| `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` | Absolute manifest URL |
| `NEXT_PUBLIC_TON_RELAY_ADDRESS` | Testnet buy stub destination |
| `NEXT_PUBLIC_PAYOUT_TICK_MS` | Mock payout tick (`60000`) |
| `NEXT_PUBLIC_TG_BOT_USERNAME` | Share deep links (no `@`) |

## BotFather Mini App

1. `/newbot` or existing bot  
2. `/newapp` → DigiHouse → Web App URL = Vercel HTTPS  
3. Menu button “Open DigiHouse”  
4. Deep link: `https://t.me/<bot_username>/<short_name>`

## 60-second live script

| Time | Action | What to say |
|------|--------|-------------|
| 0:00 | Cold open / clear site data once | First launch onboarding |
| 0:08 | Swipe to slide 3 | Demo disclaimer once |
| 0:12 | Get Started | ~$62k portfolio · $90/wk projected |
| 0:20 | Marketplace | Hot / funding / funded · order books |
| 0:28 | Marina Vista | Trust · rental history · calculator |
| 0:38 | Buy Share → Confirm | TonConnect testnet (or connected wallet) |
| 0:48 | Success → Portfolio | Holdings + open sell order |
| 0:55 | Earnings | Streak · expand one row for math + honesty |

## Recommended screenshots (pitch deck)

Capture on a **dark** Telegram-width (~390px) frame. Suggested order for slides:

| # | Screen | Capture tip |
|---|--------|-------------|
| 1 | Onboarding slide 2 (weekly yield) | Full phone chrome optional |
| 2 | Home | Portfolio hero + next payout + chips |
| 3 | Marketplace | 2 property cards + filter chips |
| 4 | Property detail | Gallery, APY, funding bar mid-scroll |
| 5 | Buy success | Confetti settle + “View Portfolio” |
| 6 | Earnings | Hero amount + streak “weeks in a row” |
| 7 | Portfolio | Allocation + holding + open orders |
| 8 | Settings (optional) | Demo badge toggle visible |

**Tools:** Telegram desktop screenshot, or iOS/Android native share → Files. Avoid browser desktop networking chrome if selling “native Mini App.”

## Seed highlights

- 6 properties · funding / funded / resale  
- Holdings ~**$62k** MTM · **$90/wk** pending (integrity-checked)  
- Open Alfama sell order  
- Paid history + synthetic `simulated:` tx hashes  

## Honesty contract (stage)

- No “rent landed in your wallet” / live on-chain for MVP  
- Canonical: *simulated weekly payout · on-chain verifiable post-MVP*  
- Demo word **once per flow**  

## Pre-demo QA checklist

### Automated (CI)

- [x] `npm test`  
- [x] `npm run check` (lint + typecheck + build)  

### Manual (you — real Telegram)

- [ ] iOS Telegram Mini App open  
- [ ] Android Telegram Mini App open  
- [ ] Desktop WebView layout  
- [ ] TonConnect connect + disconnect  
- [ ] Buy happy path + failed confirm recovery  
- [ ] Settings Demo badge on/off  
- [ ] Share after buy (with bot username)  
- [ ] Manifest + icon 200 on production domain  

### Console

- [ ] No red errors during loop (wallet extension noise on desktop browser is OK)

## Deep links & sharing

| Link | Use |
|------|-----|
| `https://t.me/<bot>/<app>` | Primary pitch URL |
| Vercel URL | Backup / judges without Telegram |
| Buy success Share | `navigator.share` + clipboard; appends bot link if `NEXT_PUBLIC_TG_BOT_USERNAME` set |

## Pitch one-liner

> DigiHouse lets anyone buy a slice of real property inside Telegram, see proportional weekly rent, and exit on a resale market — on TON, with on-chain settlement after the MVP mock ledger.

## Post-MVP (if asked on stage)

Distribution contracts · jetton balances · mainnet · live secondary market.
