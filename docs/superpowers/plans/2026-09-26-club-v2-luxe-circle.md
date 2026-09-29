# CLUB V2: Private Network + Co-Own Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native inline execution — user directed execution-only; no commits unless the report demands one, per program rules).

**Goal:** Reconcile normative weights (1/1.25/1.5/2) + 4-night base across code/tests/docs, add Luxe Circle + Shared Properties + Invite-to-Co-Own, and rework `/club` into the concise hierarchy without duplicating the Referral Hub.

**Architecture:** Pure model layer first (`TIER_WEIGHTS` value change; new `types/circle.ts` + `lib/circle/circle-model.ts` prototype source + `lib/coown/co-own-link.ts` estate-scoped link builder), thin hooks (`useLuxeCircle`, `useCoOwnInvite`), presentational components (`circle/LuxeCircleSection`, `circle/CoOwnEstateCard`, `club/ClubReferralEntry`), thin page composition. No new routes. No ledger/settlement/wallet/chain.

**Tech Stack:** Next.js 16 + React 19 + TS strict, Tailwind v4, next-intl (12 locales), TanStack Query/Zustand (existing), vitest + Playwright.

**Spec:** User prompt "FractionalLuxe — CLUB V2" (2026-09-26). Authorities: `docs/PRIVATE-CLUB-REFERRAL-MODEL-V1.md`, `docs/PRIVATE-CLUB-PRODUCT-RULES-V1.md`, `docs/PRIVATE-CLUB-ECONOMICS-V3.md`, `docs/REFERRAL-MODEL-V2.md`, `docs/design/ESTATE-PAGE-STRUCTURE.md` (L0/L1 fixed, L2 tabbed).

## Global Constraints

- Money integer cents; no float money math (weights are probability multipliers, never money).
- No `any`; named exports; 2-space indent; Tailwind only; `tnum` figures; touch ≥44px; reduced-motion honored.
- No new dependencies. No ledger/settlement/attribution-backend/payment/wallet/chain/anti-fraud/tax/booking.
- No fake members, counts, ownership, dates, rewards. Prototype zeros + honest empty states only.
- No second referral system: co-own link carries estate+inviter context for FUTURE attribution only.
- English i18n source of truth; new keys mirrored ×12; RTL-safe; no locale URL segments.
- `npm run check` green; full vitest green; club + referral + property-detail e2e green.
- Do not touch unrelated Club-session WIP; do not commit unless the final report requires it.

## Review Focus

- Fractional weights (1.25/1.5) leaking into money math or integer-only UI — pinned by weights test asserting exact float values + type `Record<…, number>`.
- Co-own link with empty/underscore/weird estateId or missing bot/user → must return null, never a malformed URL — pinned in link tests.
- `navigator.share`/`clipboard` absent — silent fallback, CTA stays enabled — pinned in hook tests.
- German/long-locale overflow on new cards at 360px — pinned by e2e overflow assertions + screenshot review.
- `/club` with loading/error portfolio — Luxe Circle still renders honest zeros — pinned in page test.

---

## File map

Create:
- `src/types/circle.ts` — CircleMember, CircleProperty, LuxeCircleSummary (+isPrototype).
- `src/lib/circle/circle-model.ts` — `getPrototypeCircle(): LuxeCircleSummary` (zeros, empty arrays).
- `src/lib/circle/__tests__/circle-model.test.ts`
- `src/hooks/useLuxeCircle.ts` — returns prototype summary (shape stable for future source).
- `src/hooks/__tests__/useLuxeCircle.test.tsx`
- `src/lib/coown/co-own-link.ts` — `buildCoOwnLink({botUsername, estateId, inviterId}): string | null`, format `https://t.me/<bot>?startapp=coown_<estateId>_ref_<inviterId>`.
- `src/lib/coown/__tests__/co-own-link.test.ts`
- `src/hooks/useCoOwnInvite.ts` — `{coOwnLink, canShare, copied, shareCoOwn, copyCoOwn}` (clipboard/share, silent fallback, 2s copied).
- `src/hooks/__tests__/useCoOwnInvite.test.tsx`
- `src/components/circle/LuxeCircleSection.tsx` — summary counts + shared-properties empty + Invite-to-Co-Own (→ marketplace) + Explore Estates (→ marketplace). testids: `club-circle`, `circle-counts`, `circle-invite`, `circle-shared-empty`, `circle-explore`.
- `src/components/circle/__tests__/LuxeCircleSection.test.tsx`
- `src/components/circle/CoOwnEstateCard.tsx` — props `{estateId, estateTitle}`; primary share + secondary copy. testids: `estate-coown`, `estate-coown-share`, `estate-coown-copy`.
- `src/components/circle/__tests__/CoOwnEstateCard.test.tsx`
- `src/components/club/ClubReferralEntry.tsx` — concise card: new club keys entry title/sub + "Open Referral" → `/referral`. Reuses section testid `club-referral`, CTA testid `club-referral-cta`.
- `docs/CIRCLE-COOWN-V1.md` — Luxe Circle + Co-Own product boundaries (PROTOTYPE, NOT IMPLEMENTED lists).

Modify:
- `src/lib/club/club-economics.ts:17-22` — TIER_WEIGHTS → `{private: 1, private_plus: 1.25, elite: 1.5, signature: 2}`; header comment "integer arithmetic only" → "integer cents; weights are probability multipliers".
- `src/lib/club/__tests__/club-economics.test.ts:18-25,64-68` — expect 1/1.25/1.5/2; describe text "normative V1 weights".
- `src/app/(app)/club/page.tsx` — order: Header, Card, Stay, Benefits, **LuxeCircleSection**, Escape, **ClubReferralEntry**, NextUnlock, Tiers; drop ReferralSection/Progress imports+usage.
- Delete: `src/components/club/ClubReferralSection.tsx`, `src/components/club/ClubReferralProgress.tsx` (verify zero other importers first).
- `src/app/(app)/club/page.test.tsx` — rewrite ladder blocks: concise entry renders (Open Referral href), `club-referral-progress` + `referral-milestone` absent on /club, circle section renders zeros, hierarchy order extended.
- `src/components/property/PropertyDetail.tsx:164-167` — insert `<CoOwnEstateCard estateId={listing.id} estateTitle={estateVm.identity?.name ?? listing.title} />` between metrics grid and tabs.
- `src/components/property/PropertyDetail.test.tsx` — assert card renders between metrics and tabs (add to renderDetail flow).
- `e2e/tests/club.spec.ts:48` — expect "Open Referral"; add circle empty-state + no-ladder + overflow assertions.
- `e2e/tests/property-detail.spec.ts` — assert `estate-coown` visible (append to an existing test, no new test).
- `messages/*.json` ×12 — new `circle` namespace (14 keys) + 3 `club.referralEntry*` keys.
- Docs (one-line reconciliations, see Task 1).
- `src/components/layout/Header.tsx` — no change (titles already correct).

## Interfaces

- Consumes: `usePortfolio` (club default tab, unchanged), `useAuthStore` + `env.botUsername` (invite links), `usd` (existing), `haptics`, `ROUTES.marketplace/referral`.
- Produces:
  - `TIER_WEIGHTS = { private: 1, private_plus: 1.25, elite: 1.5, signature: 2 }` (type `Record<Exclude<ClubTierId,"standard">, number>`)
  - `getPrototypeCircle(): LuxeCircleSummary` → `{ memberCount: 0, sharedPropertyCount: 0, members: [], sharedProperties: [], isPrototype: true }`
  - `useLuxeCircle(): LuxeCircleSummary`
  - `buildCoOwnLink({botUsername, estateId, inviterId}): string | null`
  - `useCoOwnInvite(estateId: string): { coOwnLink: string | null; canShare: boolean; copied: boolean; shareCoOwn(): Promise<void>; copyCoOwn(): Promise<void> }`
- i18n keys (`circle` ns): circleTitle, circleSub, circleMembers ("{count} Members"), circleShared ("{count} Shared Properties"), circleSharedTitle, circleSharedEmpty, circleSharedSub, circleExplore, circleInvite, coOwnTitle, coOwnSub, coOwnShare, coOwnCopy, coOwnCopied, coOwnSignIn. (`club` ns): referralEntryTitle, referralEntrySub, referralOpen.

---

### Task 1: Phase 0 — weights + docs reconciliation (TDD)

- [ ] **Step 1: failing test** — edit `club-economics.test.ts:18-25,64-68` to expect `1/1.25/1.5/2` + describe "normative V1 weights (locked 2026-09-26)". Run file → FAIL (3 assertions).
- [ ] **Step 2: implement** — `club-economics.ts:17-22` values + header comment fix. Re-run → PASS.
- [ ] **Step 3: grep** `1/2/4/8|private_plus: 2|toBe(2)|toBe(4)|toBe(8)` in src+docs → must be zero active references (only supersede notes allowed).
- [ ] **Step 4: docs** — one-line edits:
  - Referral-V1:43: `weights 1/2/4/8 unchanged` → `weights 1.0/1.25/1.5/2.0 (normative V1, locked 2026-09-26; supersedes 1/2/4/8)`.
  - Product-Rules:87: `Candidate weights (PROVISIONAL — BUSINESS APPROVAL REQUIRED)` → `Normative V1 weights (LOCKED 2026-09-26): …`; :176 table row PROVISIONAL → LOCKED.
  - Product-Rules:12: `3-night standard / 4-night off-peak upgrade` → `4-night standard`; R-A2 (:92): `3-night standard; 4-night off-peak upgrade conditional…` → `4-night standard`; :100: `3 consecutive nights` → `4 consecutive nights`, `483 awards` → `362 awards (+2 remainder)`; :104: prefix `SUPERSEDED 2026-09-26 by locked 4-night base — `; :173 table: `3-night awards | 483` → `4-night awards | 362 (+2 remainder)`.
  - V3:17 recommendation + :19 §26-answer(5) + :82 + :161 P9: prefix `SUPERSEDED 2026-09-26 (locked 4-night base stay) — ` (leave analysis tables as evidence).
  - Closure:24,106,119 (weights rows): append `LOCKED 2026-09-26 as 1.0/1.25/1.5/2.0`; :25-26,51,101,164 (3-night rows): prefix `SUPERSEDED 2026-09-26 (locked 4-night base) — `.
  - Decision-Pack:20,33,73 (3-night rows): same SUPERSEDED prefix.
  - V3:134: `placeholders for Product Rules` → `normative V1 weights locked 2026-09-26`.
- [ ] **Step 5: verify** — full vitest file + grep zero-active-refs.

### Task 2: Circle + co-own models/hooks (TDD)

- [ ] **Step 1: failing tests** — `circle-model.test.ts` (prototype zeros, empty arrays, isPrototype true, frozen shape keys), `useLuxeCircle.test.tsx` (returns prototype, no throw without user), `co-own-link.test.ts` (builds `https://t.me/Bot?startapp=coown_re-1_ref_u1`; null on empty estateId/bot/inviter; null on whitespace), `useCoOwnInvite.test.tsx` (link shape via mocked env+auth; copy writes link + 2s copied; silent without clipboard; share prefers navigator.share). Run → FAIL (modules missing).
- [ ] **Step 2: implement** `types/circle.ts`, `lib/circle/circle-model.ts`, `hooks/useLuxeCircle.ts`, `lib/coown/co-own-link.ts`, `hooks/useCoOwnInvite.ts`. Re-run → PASS.

### Task 3: Luxe Circle UI + Club hierarchy (TDD)

- [ ] **Step 1: failing tests** — `LuxeCircleSection.test.tsx` (renders title/sub, `0 Members · 0 Shared Properties`, empty shared block + Explore Estates href `/marketplace`, Invite-to-Co-Own href `/marketplace`, no `referral-milestone`, honest zero text), club `page.test.tsx` updates (entry renders Open Referral href; `club-referral-progress` + `/club` `referral-milestone` absent; `club-circle` present after benefits in order). Run → FAIL.
- [ ] **Step 2: implement** `LuxeCircleSection.tsx`, `ClubReferralEntry.tsx`; edit `club/page.tsx` order; delete the two old components (verify importers zero first); update `club/page.test.tsx`. Re-run → PASS.

### Task 4: Estate Co-Own entry (TDD)

- [ ] **Step 1: failing tests** — `CoOwnEstateCard.test.tsx` (renders title context, share invokes `navigator.share` with estate URL containing estateId, copy writes link, copied feedback, sign-in label when anonymous, ≥44px targets), `PropertyDetail.test.tsx` addition (card between `metrics-grid` and `property-tabs`). Run → FAIL.
- [ ] **Step 2: implement** `CoOwnEstateCard.tsx`; insert in `PropertyDetail.tsx:164-167`. Re-run → PASS.

### Task 5: i18n ×12 + e2e + docs

- [ ] Add `circle` ns (14 keys) + 3 `club.referralEntry*` keys to en, mirror ×11, parity script → OK.
- [ ] e2e: `club.spec.ts:48` → "Open Referral"; add circle empty/no-ladder/overflow assertions; `property-detail.spec.ts` +1 co-own visibility assertion. Run club+referral+property-detail vs dev :3100 (never :3000 prod).
- [ ] Write `docs/CIRCLE-COOWN-V1.md` (concepts, prototype boundaries, NOT IMPLEMENTED list, separation rules).

### Task 6: Final verification + report

- [ ] Full vitest green; `npm run check` green; fresh screenshots /club + /referral + estate card @480×840 & 1280×800, reviewed, no overflow; fix issues found.
- [ ] Rebuild + restart :3000 prod from this tree; e2e vs :3000; self-review diff; report A–K.

## Ledger

- [x] Setup: sunny-star HEAD a513feb; other-session WIP unchanged; plan saved here.
- [x] Task 1: complete — weights 36/36 green; docs reconciled (V3, Product-Rules, Closure, Decision-Pack, Referral-V1); zero active old refs.
- [ ] Task 2: complete (tests: …)
- [ ] Task 3: complete (tests: …)
- [ ] Task 4: complete (tests: …)
- [ ] Task 5: complete (tests: …)
- [ ] Task 6: complete (tests: …)

## Rulings

- R1: Circle "Invite to Co-Own" without estate context links to `/marketplace` (pick an estate first) — navigation, not a fake invite. Cost if wrong: one href change.
- R2: No `/referral` changes this slice — Hub stays canonical and un-overloaded. Cost if wrong: none.
- R3: Reuse `club-referral` / `club-referral-cta` testids on the concise entry — preserves e2e intent (only copy assertions change). Cost if wrong: testid rename.
- R4: Inline execution without review pause (execution-only directive precedent). Cost if wrong: rework.
- R5: Co-own link format `coown_<estateId>_ref_<userId>` — prototype only, parser explicitly NOT built. Cost if wrong: format migration later.
