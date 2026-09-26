# Luxe Circle + Invite to Co-Own V1 — Product Boundaries

> Status: product/UX foundation + prototype data contract. No backend, ledger, settlement, or infrastructure.
> Companion code: `src/types/circle.ts` (contract), `src/lib/circle/circle-model.ts` (prototype source), `src/hooks/useLuxeCircle.ts`, `src/lib/coown/co-own-link.ts`, `src/hooks/useCoOwnInvite.ts`, `src/components/circle/LuxeCircleSection.tsx`, `src/components/circle/CoOwnEstateCard.tsx`.

## 1. Luxe Circle (PROTOTYPE)

Your Luxe Circle is the private network of people and ownership activity connected to you: Ownership → Circle → Shared Properties → Co-Ownership → Access. It is NOT a leaderboard, social feed, affiliate scheme, or MLM hierarchy — no avatars, gamification, or reward badges.

`LuxeCircleSummary` (`src/types/circle.ts`): `memberCount`, `sharedPropertyCount`, `members[]`, `sharedProperties[]`, `isPrototype`. Counts must always equal the record arrays' lengths. `useLuxeCircle()` returns the prototype empty Circle (`memberCount 0`, `sharedProperties []`); the UI renders honest empty states. Swap the return (never the shape) when a real source exists. No counts are fabricated.

## 2. Shared Properties (PROTOTYPE)

Estates the member owns and has shared, or is exploring with Circle members. No real Circle/property relationship data exists yet, so the section shows an elegant empty state ("No shared properties yet") with an Explore Estates entry to `/marketplace`. The contract (`CircleProperty`: `estateId`, `relation`, `memberCount`) is ready for real data.

## 3. Invite to Co-Own (PROTOTYPE)

Product action: "I found an estate we could own together." Entry points: the Estate page card (`estate-coown`, below metrics, above tabs) and the Luxe Circle section (routes to `/marketplace` to pick an estate first). The shared object identifies the estate: `https://t.me/<bot>?startapp=coown_<estateId>_ref_<inviterId>` (`buildCoOwnLink`; null on missing/blank inputs). The future attribution model can know inviter + estate + invite context. NOT implemented: parsing, ledger, attribution settlement, payment, wallet, blockchain, anti-fraud, tax.

## 4. Separation (LOCKED)

- Club Referral: referral mechanics + milestone rewards (points, stays). Canonical home: `/referral`.
- Luxe Circle: social ownership network (members, shared properties). No points, no dollars.
- Co-Own: sharing one specific estate. No points, no dollars.
- Forbidden: points-to-dollar conversion, combined referral balance, multi-level commissions, recursive payouts, MLM hierarchy, fake ownership, fake financial rewards.

## 5. NOT IMPLEMENTED

Ownership Card, Circle Milestones, Private Opportunities, public leaderboard, real referral ledger, real attribution settlement, payment, withdrawal, wallet, blockchain, anti-fraud, tax, real booking, real Circle backend.

## 6. COMPLIANCE-GATED

Co-own invitations must never be presented as investment advice, guaranteed returns, or shared-ownership contracts. Copy stays at "share/explore together" until separately approved.
