# CLUB UI Corrections + Ownership Card / Share Ownership — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native inline execution — execution-only directive precedent; no commits unless the report requires one).

**Goal:** Fix authed/logged-out invite CTAs, restyle the estate Private Member Benefit into the standard section pattern, and ship an honest Ownership Card + Share Ownership reusing the estate share infrastructure.

**Architecture:** Auth-state split (`isLoggedIn` vs link-possible) in the two estate/referral share hooks via one shared `useShareActions(link)` base; estate-scoped link builder gains explicit `context: "coown" | "ownership"` (one generator, two distinguishable prefixes); presentational `OwnershipCard` gated on real `ownedShares > 0`; `ClubEstateBlock` relaid out vertically with identical copy/testids/CTA.

**Tech Stack:** Next.js 16 + React 19 + TS strict, Tailwind v4, next-intl ×12, vitest + Playwright.

**Spec:** User prompt "CLUB UI CORRECTIONS + OWNERSHIP CARD / SHARE OWNERSHIP" (2026-09-26). Existing auth flow = recovery-code login (`/recovery-login`, cf. SettingsSheet recovery row).

## Global Constraints

- No `any`; named exports; 2-space indent; Tailwind only; `tnum`; touch ≥44px; reduced-motion honored.
- No new dependencies. No ledger/settlement/attribution-backend/payment/wallet/chain/anti-fraud/tax/booking.
- No fake ownership, amounts, yields, dates, members, counts. No referral mechanics in Ownership Card. No second referral system. No Lifestyle Value.
- English source of truth; mirror ×12; RTL-safe.
- `npm run check` green; full suite green; club + referral + property-detail e2e green.
- Don't touch unrelated WIP (portfolio page etc.); minimal diffs.

## Review Focus

- Logged-in + missing botUsername: invite CTA stays active and fails silently (dev-only state) — pinned by hook test with empty botUsername.
- Logged-out click must reach the real auth flow (`/recovery-login` href), not a dead button — pinned by href assertions.
- `ownedShares = 0` vs `> 0` boundary (negative clamps to hidden) — pinned in card tests.
- Estate-identity leak: share URL/text must carry the viewed estateId, never a hardcoded id — pinned with distinct fixture ids.
- German CTA wrapping at 360px on estate cards — pinned by e2e overflow + screenshot review.

---

## File map

Create:
- `src/hooks/useShareActions.ts` — base `{link}` → `{copied, share, copy}` (share-first, clipboard fallback, silent catch, 2s copied).
- `src/hooks/useShareOwnership.ts` — `useShareOwnership(estateId, estateTitle)` → `{shareLink, canShare, isLoggedIn, copied, shareOwnership, copyOwnership}` (context `"ownership"`).
- `src/hooks/__tests__/useShareOwnership.test.tsx`
- `src/components/circle/OwnershipCard.tsx` — props `{estateId, estateTitle, location, ownedShares}`; null when `ownedShares <= 0`. testids: `estate-ownership`, `estate-ownership-share`, `estate-ownership-copy`.
- `src/components/circle/__tests__/OwnershipCard.test.tsx`

Modify:
- `src/lib/coown/co-own-link.ts` — add `context?: "coown" | "ownership"` (default `"coown"`); prefix map `{coown: "coown", ownership: "own"}` → `…?startapp=own_<estate>_ref_<inviter>`.
- `src/lib/coown/__tests__/co-own-link.test.ts` — add ownership-context cases (existing cases unchanged).
- `src/hooks/useCoOwnInvite.ts` — rebase onto `useShareActions` (same public shape + `isLoggedIn`); explicit `context: "coown"`.
- `src/hooks/useInviteLink.ts` — add `isLoggedIn` to return (logic otherwise untouched).
- `src/hooks/__tests__/useInviteLink.test.tsx`, `useCoOwnInvite.test.tsx` — add `isLoggedIn` + empty-bot treatment assertions.
- `src/components/referral/ReferralInviteCta.tsx`, `ReferralHero.tsx` — logged-out → active Link `/recovery-login` (referral `signInToInvite`); logged-in → active invite button (never disabled sign-in); hide secondary share when logged-out.
- `src/components/circle/CoOwnEstateCard.tsx` — same auth split (circle `coOwnSignIn` link; logged-in active card).
- `src/components/settings/SettingsSheet.tsx` — invite row logged-out → active Link `/recovery-login` (same testid/label); logged-in unchanged behavior.
- `src/components/club/ClubEstateBlock.tsx` — vertical ICON/TITLE/DESC/CTA layout (same copy/testids/CTA href, `p-5`, full-width CTA).
- `src/components/property/PropertyDetail.tsx` — insert `<OwnershipCard … ownedShares={ownedShares} />` between metrics grid and co-own card (owned-only render).
- Tests with hook mocks (`referral/page.test`, `CoOwnEstateCard.test`) — add `isLoggedIn: true` to mock returns.
- `SettingsSheet.test.tsx` — logged-out invite row asserts enabled href `/recovery-login` (router `push` mock already exists).
- `PropertyDetail.test.tsx` — owned fixture shows card; zero-owned hides it (check renderDetail ownedShares first).
- `messages/*.json` ×12 — `circle` += ownerLabel/ownerStatement/ownerShare/ownerCopy/ownerCopied/ownerSignIn/shareText(`I own a piece of {estate} on FractionalLuxe`).
- `e2e/tests/property-detail.spec.ts` — co-own still visible; ownership card asserted only if e2e mock owns the fixture estate (decide at runtime; unit covers otherwise).
- `docs/CIRCLE-COOWN-V1.md` — add Ownership Card + ownership-share context section.

## Interfaces

- `buildCoOwnLink({botUsername, estateId, inviterId, context?})`: `"coown"` → `…coown_<estate>_ref_<inviter>`; `"ownership"` → `…own_<estate>_ref_<inviter>`; null on blank inputs.
- `useShareActions(link: string | null): { copied, shareLink: link, shareText? no—share(url, text?) }` — decided: `share(title, text, url)` + `copy(text)` primitives? Simpler: base takes `{text, url}` and exposes `{copied, share, copy}`. useCoOwnInvite/useShareOwnership compose text per context.
- `useShareOwnership(estateId, estateTitle)` returns `{ shareLink, canShare, isLoggedIn, copied, shareOwnership, copyOwnership }`.
- Auth split contract (all four surfaces): `!isLoggedIn` → active Link `ROUTES.recoveryLogin`; logged-in → active action button; no disabled sign-in ever.

---

### Task 1: Auth CTA split (TDD)

- [ ] **Step 1: failing tests** — `useInviteLink.test`: `isLoggedIn` false without user / true with user; empty-bot + logged-in → `canShare/canInvite` false but `isLoggedIn` true. `useCoOwnInvite.test`: same. `CoOwnEstateCard.test` mock: add `isLoggedIn: true`. `referral/page.test` mock: add `isLoggedIn: true`. Run → FAIL (unknown `isLoggedIn`).
- [ ] **Step 2: implement** — `useShareActions.ts`; rebase `useCoOwnInvite`; extend `useInviteLink` return; rewrite the four surfaces' branching; Settings row → Link. Re-run touched suites → PASS.

### Task 2: Estate benefit restyle (verify-first)

- [ ] **Step 1: characterize** — run existing estate-tab/club-estate assertions → PASS baseline; screenshot 480×840 current block.
- [ ] **Step 2: implement** — vertical `ClubEstateBlock` (icon → title → desc → full-width CTA, `p-5`, same copy/testids/href). Add DOM-order test (title precedes desc precedes CTA). Re-run → PASS + screenshot compare.

### Task 3: Ownership share contract + card (TDD)

- [ ] **Step 1: failing tests** — link ownership-context cases; `useShareOwnership` suite (logged-out null/false; share prefers navigator.share with `own_` URL + estate text; copy writes text+URL; copied 2s; silent w/o clipboard); `OwnershipCard` suite (hidden at 0/negative; shows estate name/location; no `$`/yield/points text; share/copy call fns; sign-in link when anonymous).
- [ ] **Step 2: implement** — builder context param; `useShareOwnership`; `OwnershipCard`; insert in PropertyDetail; extend PropertyDetail.test. Re-run → PASS.

### Task 4: i18n ×12 + e2e + docs + QA

- [ ] Circle +7 keys ×12 via splice script; parity check.
- [ ] e2e updates; fresh screenshots /referral (logged-out state), estate benefit, ownership card, /club @480×840 & 1280×800; fix issues found.
- [ ] `docs/CIRCLE-COOWN-V1.md` ownership section.

### Task 5: Final verification + report

- [ ] Full suite; `npm run check`; rebuild + restart :3000; e2e vs :3000; diff self-review; report A–M.

## Ledger

- [x] Setup: HEAD 900e069; plan saved here.
- [x] Task 1: complete — auth split green (hooks + 4 surfaces + settings).
- [x] Task 2: complete — estate benefit vertical restyle + order test green.
- [x] Task 3: complete — ownership context + card + placement green.
- [ ] Task 1: complete (tests: …)
- [ ] Task 2: complete (tests: …)
- [ ] Task 3: complete (tests: …)
- [x] Task 4: complete — i18n parity OK; e2e updated; CIRCLE-COOWN-V1.md.
- [x] Task 5: complete — full suite 1304 green; check green; screenshots reviewed; :3000 rebuilt+restarted; e2e 12/12 vs :3000. Committed 1cf0e76.

## Rulings

- R1: Logged-out invite → Link `/recovery-login` (the existing auth flow), not a new auth UI. Cost if wrong: one href.
- R2: Logged-in + unbuildable link (dev-only missing bot) → active CTA that silently no-ops; never a disabled sign-in. Cost if wrong: negligible (production always configures bot).
- R3: One link generator with explicit `context` param (not a second generator); `own_` prefix keeps ownership-share distinguishable from co-own/referral attribution. Cost if wrong: format migration.
- R4: Portfolio placement deferred (portfolio page is parallel-session WIP); estate placement is canonical per spec preference #1. Cost if wrong: follow-up slice.
- R5: No verified-owner pill (optional per spec; avoids new copy + overclaim). Cost if wrong: one pill later.
- R6: Inline execution without review pause (standing execution-only precedent).
