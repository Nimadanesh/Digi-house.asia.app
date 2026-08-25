# FRACTIONALLUXE PROGRAM — working file for THIS repo (the Telegram Mini App)

> You are an AI coding agent working in the **app.fractionalluxe** repo (the FractionalLuxe Telegram Mini App on TON). This file is your single source of truth for program work in this repo. It is maintained by the founder's planning session (master plan lives in the site repo, `FL/docs/product-roadmap/`) — do not restructure it; you may only tick checkboxes (`- [ ]` → `- [x]`), update the Resume Here block, and append to the Progress Log.
> **Created:** 2026-08-23 · **Model target:** fast executor models — follow steps literally, verify each "done when", don't improvise.

---

## 0. Resume Here (update after every session)

| Field | Value |
|---|---|
| Current phase | **Phase A complete → Phase I** |
| Next step | I0 (contract verify — needs Postgres; DB runtime checks BLOCKED on this machine, no Docker) |
| Blockers | No Docker on this machine → `infra:up`/`db:migrate`/`db:seed` runtime verify pending (A3 dry-run + tests cover the code path); U1/U3/U4/U6 still open |

## 1. Context you need

- **Product:** FractionalLuxe — fractional ownership of luxury villas (Dubai, Bali, Phuket, Mykonos, Marbella, Maldives). Investors buy shares from **$80** in this Telegram Mini App; the marketing site (`fractionalluxe.com`, separate repo) sends users here via `t.me/<bot>/app?startapp=prop_<propertyId>` deep links.
- **Locked income model (user-confirmed 2026-08-23):** rental income **accrues monthly**. Withdrawals are on request: **1% fee, paid in 4 weekly installments**. All copy must match.
- **Locked brand:** name FractionalLuxe; palette = Telegram azure `#229ED9` + slate ink `#17212B`; logo files provided in step A2. No other visual direction.
- **The propertyId contract:** the 24 property IDs in the manifest (step A3) are shared with the site. Never rename, never invent new IDs.

## 2. DO / DON'T

**DO**
- Read this repo's own `AGENTS.md` / `README.md` / `apps/api/README.md` first and follow its conventions (npm workspaces, Next.js, Postgres+Redis).
- One step at a time: execute → verify "done when" → tick → continue. Minimal diffs; never reformat lines a step doesn't name.
- Run the repo's checks (`npm run check`, tests) at every phase gate and record the result.
- Log every mapping decision you make in A3 — the user reviews them.
- If a verification fails 3 times: `git checkout -- <files>`, mark the step BLOCKED in the log, move to the next unblocked step.
- Append one dated Progress Log entry per session (section 6).

**DON'T**
- **No new dependencies** without explicit user approval.
- **No secrets/tokens in code or docs** (BotFather tokens, DB URLs beyond local dev examples).
- **Never modify payment/settlement/TON logic** beyond what a step explicitly names. If code semantics conflict with the locked income model, document it — don't "fix" it.
- **No fabricated data**: no fake trades that look real; keep the app's existing "simulated" disclosures.
- Don't touch the marketing site repo (you don't have it; the user coordinates).
- Don't `git commit`/`git push` unless the user asked in that session.

## 3. [NEEDS USER] queue (build around, never wait, never invent)

| ID | Item | Affects |
|---|---|---|
| U1 | Production bot username (deep links) | Phase I app steps |
| U3 | Telegram API creds (waitlist notifications) | I6 |
| U4 | KYC approach decision | A7 (documentation only) |
| U6 | Launch mode (public vs invite-only) | Phase I wording |

## 4. Phase A — App Improvements (no user inputs needed)

- [x] A0 **Setup & baseline.** Fresh clone of this repo; `npm install`; read `AGENTS.md`, `README.md`, `apps/api/README.md`. Start infra if Docker is available (`npm run infra:up` → `db:migrate` → `db:seed`); otherwise note it and skip DB-dependent runtime checks. Record `npm run check` result as the baseline (pre-existing failures are acceptable — list them).
- [x] A1 **Rebrand strings.** "DigiHouse" → "FractionalLuxe" in user-facing UI: `messages/*.json` brand key(s) in all 12 languages (translate the brand consistently — "FractionalLuxe" stays Latin in all locales), `src/app/layout.tsx` metadata, onboarding carousel copy, README title line. Keep env var names, package names, and repo URLs as-is. Done when `grep -rni "digihouse" src/ messages/ --include="*.ts*" --include="*.json"` returns only technical identifiers (env/db/package names), listed in the log.
- [x] A2 **Brand assets.** Import the two logo SVGs the user will place at the repo root (`fl-mark.svg`, `fl-logo.svg` — if absent, stop and log [NEEDS USER]) into `public/` per repo conventions; replace the app's logo/wordmark usages (header, onboarding, loading brand). Audit the app's primary color tokens and align to azure `#229ED9` / ink `#17212B` if trivially different; if the app uses a theming system that makes this non-trivial, log findings and stop that sub-step.
- [x] A3 **Portfolio migration to the 24-property manifest.** *(runtime DB verify BLOCKED: no Docker on this machine — dry-run `npm run db:seed:dryrun -w @digihouse/api` passes with 24/24, statuses funding/funded/resale; unit tests cover the id/price/shares contract)* The user will place `portfolio-manifest.json` at the repo root (exported from the site; if absent, stop and log [NEEDS USER]). Extend/replace the DB seed so exactly these 24 properties exist with identical `propertyId`, `pricePerShare`, `totalShares`; map remaining fields onto the app's property schema (defaults for app-only fields are fine; remove or 1:1-map legacy seed listings — log every decision). Idempotent: seeding twice changes nothing. Verify at runtime (marketplace/API shows 24, correct prices) if DB available; else land code + dry-run script and mark runtime verify BLOCKED. Keep the app's simulated-tape disclosures intact.
- [x] A4 **Income-model copy alignment (COPY ONLY).** Locked model: **monthly accrual; withdrawal on request → 1% fee, 4 weekly installments.** Current app copy says "weekly yield" (`WeeklyYieldCallout`, `messages/*.json`) — change accrual framing to monthly; "weekly" may remain ONLY in withdrawal/installment contexts. Add the withdrawal-terms line to earnings/withdrawal screens ("Withdraw anytime — 1% fee, paid in 4 weekly installments"). Update `messages/en.json` first, then mirror the same keys in all 12 languages (translate meaning; keep number tokens exact; if unsure, keep English and mark `// TODO translate` in the log). If payout/settlement code semantics conflict with the model, document — don't change code. Done when `grep -ri "weekly" messages/en.json` matches only withdrawal contexts.
- [x] A5 **Public read API.** In `apps/api`, add unauthenticated GET endpoints following existing route/middleware patterns (update the route table in `apps/api/README.md`): `GET /public/properties` → `[{ propertyId, title, destination, area, pricePerShare, sharesSold, totalShares, projectedNetYield }]`; `GET /public/properties/:id` → same + `{ recentTrades: [last 5 {price, qty, at}], fundedPct }`. No personal data, no orderbook depth, no writes. Reuse an existing rate-limiter if present; otherwise a simple in-memory token bucket. CORS: `https://fractionalluxe.com` + `http://localhost:3000`, config-driven. Add smoke tests following existing patterns.
- [x] A6 **Waitlist endpoint.** `POST /public/waitlist` `{ email, telegram?, propertyId?, utm? }` → validate email shape, persist (new `waitlist` table via migration, or the existing launch module if it fits), idempotent on email, `{ ok: true }`. No notifications yet (U3). CORS as A5. Test per repo patterns.
- [x] A7 **KYC gap — document only.** Confirm onboarding has no identity verification. Add 3–5 lines to README "Open items": "KYC pending decision U4; auth is Telegram initData only." Nothing else.
- [ ] A8 **Phase gate.** `npm run check` + tests green (baseline exceptions documented). Log A3 mapping decisions summary. Update Resume Here.
  - **2026-08-24 result:** `npm run check` ✅ (0 errors; 3 pre-existing lint warnings in `apps/api/src/e2e/money-path-*.test.ts`), root vitest 361/361 ✅, API vitest 505/505 ✅, `typecheck:api` ✅.
  - **A3 mapping decisions:** id/title/gallery 1:1 · pricePerShare→sharePriceUsd ×100 (cents) · valuationUsd→totalValueUsd ×100 · location=`"{area}, {destination}"` · status deterministic i%3 (funding/funded/resale) · sharesSold deterministic per status (40%/100%/60%) · annualRentUsd=round(valuation×yield%)×100 cents · description generated · meta defaults (sizeSqm 0, yearBuilt 2020, rented) with manifest projections carried verbatim in optional meta fields · monthlyYieldRate via existing yearBuilt rule ("7.26", within 4.5–7.5 check) · rentalHistory empty (no fabricated payments) · one dev owner-wallet placeholder · legacy `prop-*` seed rows deleted at seed time (warn-and-continue if FK-blocked). Seed source swapped to manifest only in production seed (`seed-properties.ts`); `properties-data.ts` fixtures untouched (used by 20+ test files).
  - **A4 note:** payout/settlement code still pays weekly (Sunday schedule) — semantics conflict documented, NOT changed, per DON'T rules. Display figures labeled "/ month" convert the weekly mock figure ×52/12 at the presentation layer.

## 5. Phase I & T — app-side steps (after user inputs / after Phase A)

- [ ] I0 **Contract verify.** Manifest IDs in DB == site manifest (24, prices match). Re-run after any seed change.
- [ ] I4 **startapp deep-link routing.** Parse `initData.start_param` (`prop_<propertyId>`, optionally `~utm_<source>`) → route straight to that property; unknown/absent → normal home. Follow app navigation conventions; add a unit test with a fake initData payload.
- [ ] I6 **Waitlist verify (live).** With the API deployed and U3 pending: confirm a POST lands in the table; notifications stay OFF until U3.
- [ ] T2 **App regression sweep.** Repo checks green; `db:seed` twice → still exactly 24 with matching prices; `/public/properties` returns 24, CORS headers present, unauthenticated writes rejected; manual matrix (with user): t.me link on Android/iOS/Desktop → onboarding → testnet wallet → deep-linked property → buy sheet shows the RIGHT villa → cancel cleanly; sell sheet + orderbook render.
- [ ] T3 **Funnel assist.** Support the end-to-end testnet run (site → app): onboarding completes, buy sheet price correct, abort before transfer. Log timestamps.
- [ ] T6 **Sign-off.** All app-side boxes ticked → report to the user for launch sign-off.

## 6. Progress Log

> One dated entry per session. Never delete entries.

- **2026-08-23** — Program file created (mirrored from the site-repo master plan; income model corrected to monthly accrual + 1%-fee/4-weekly-installment withdrawals). No code changes yet.
- **2026-08-24** — **Phase A complete (A0–A8).**
  - A0: baseline `npm run check` green; Docker unavailable → DB runtime checks skipped/flagged.
  - A1: "DigiHouse" → "FractionalLuxe" across all 12 locales + layout metadata, global-error, header titles, onboarding slides, share sheet, README title. Remaining grep hits are technical identifiers only (`digihouse-settings`, `digihouse_api_token`, traceId prefix).
  - A2: `fl-mark.svg`/`fl-logo.svg` imported to `public/images/`; legacy `public/seo/icon.svg` replaced with the FL mark; webmanifest + TonConnect manifest renamed; primary tokens + hardcoded accents aligned azure `#229ED9` / ink `#17212B` (`#3390ec` retained only in Telegram themeParams mirrors/comments). No raster logo usages existed to replace — wordmarks are text.
  - A3: seed now sources the 24-property manifest (`manifest-data.ts`, dry-run via `db:seed:dryrun`); idempotent upsert + legacy-row prune; contract unit tests added. Runtime DB verify BLOCKED (no Docker).
  - A4: copy aligned to monthly accrual in all 12 languages (+ new `withdrawalTerms` key); withdrawal terms line on earnings card and withdrawal-request sheet; weekly payout code left as-is (documented).
  - A5: unauthenticated `GET /public/properties[/:id]` (dollars, site convention), memory token-bucket rate limit, `PUBLIC_CORS_ORIGINS` env, smoke tests.
  - A6: `POST /public/waitlist` — validated, idempotent (`waitlist` table, migration `0027_waitlist.sql`, hand-written after drizzle-kit produced a bogus full-schema diff), tests green.
  - A7: KYC gap documented in README "Open items".
  - A8: phase gate green — see checklist above.
