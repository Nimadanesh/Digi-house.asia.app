# FractionalLuxe Referral Model V2 — Referral Hub

> **Route:** `/referral` — the single source of truth for referral discovery, explanation, progress, rewards, and invitation actions.
> **Status labels used below:** LOCKED · CONFIGURABLE · PROTOTYPE · NOT IMPLEMENTED · COMPLIANCE-GATED.

## 1. Referral Hub purpose

One dedicated first-class page ends the fragmented experience (Home Invite previously opened the Settings sheet). All referral entry points — Home Invite, Club referral benefit, any Invite/Refer CTA — route to `/referral`. The page presents two visually distinct referral paths (Standard / Club) behind a discovery switcher, with the default tab derived from membership (Standard user → Standard, Club member → Club).

## 2. Standard referral model (CONFIGURABLE + COMPLIANCE-GATED)

Source: `src/lib/referral/standard-referral-model.ts`. The inviter refers a person who enters the Standard pathway; the reward depends on the invitee's eventual investment amount. Rates are stored as integer basis points; reward math is integer-only: `rewardCents = floor((investedCents × rateBps + 5000) / 10000)`.

## 3. Standard reward bands (CONFIGURABLE + COMPLIANCE-GATED)

`STANDARD_REFERRAL_BANDS` (cents, inclusive):

| Invitee investment | Inviter reward rate |
|---|---:|
| $0 – $9,999 (0 – 999,999¢) | 5% (500 bps) |
| $10,000 – $24,999 (1,000,000 – 2,499,999¢) | 7.5% (750 bps) |
| $25,000 – $99,999 (2,500,000 – 9,999,999¢) | 10% (1000 bps) |

Percentages are a proposed referral reward/credit — never cash, yield, ROI, or guaranteed profit. UI copy uses "Referral reward / Illustrative referral reward".

## 4. Reward credit usage restriction (LOCKED product intent)

Reward value is credited to the inviter's FractionalLuxe account and may be used ONLY to purchase villa shares. It cannot be withdrawn as cash. Shares bought with reward credit follow the normal investment model and the normal economic participation of that villa investment.

## 5. 6-month share lock (CONFIGURABLE)

`REFERRAL_REWARD_SHARE_LOCK_MONTHS = 6`. Reward credit → villa share purchase → acquired share subject to the applicable 6-month lock → after expiry, withdrawal eligibility follows normal platform rules. Never phrased as "referral money becomes cash after 6 months".

## 6. ≥$100K custom state (LOCKED behavior)

`getStandardReferralReward()` returns `{ kind: "custom" }` for invitee investments ≥ $100,000 (≥ 10,000,000¢). The UI shows "Custom / Contact Club". The 10% band is never extrapolated. No $100K+ percentage exists.

## 7. Club referral model V1 (LOCKED — reused, not reinvented)

Source of truth: `docs/PRIVATE-CLUB-REFERRAL-MODEL-V1.md` (+ `PRODUCT-RULES-V1.md`); code lives in the single Club source `src/lib/club/club-economics.ts`, which the Referral Hub Club view reads directly — there is exactly one Club referral implementation. Qualified referral = new person + ≥ $10,000 investment + Club-eligible. Milestones (cumulative points): 1→1, 3→4, 5→7, 7→11, 10→16. Stay enhancement: base 4 nights → up to 7 (1→4, 3→5, 5→6, 7→7, 10→7 + Private Plus Experience Layer). At 10 referrals the member unlocks the experience layer via `resolveExperienceTier()` (display/recognition only) — financial tier never changes (a $12K investor remains PRIVATE).

## 8. Separation between Standard and Club rewards (LOCKED)

- Standard: investment-linked referral reward credit (dollars).
- Club: referral points + stay enhancement + experience layer (points, nights).
- Never a combined "Referral Balance". Points are non-monetary, non-transferable, no cash value. Standard credits never convert to Club points and vice versa. Verified by `referral-separation.test.ts`.

## 9. Routing (LOCKED)

- `ROUTES.referral = "/referral"`. Off-tab route (tab bar unchanged: Home/Marketplace/Earnings/Portfolio).
- Home Invite (action row + For-you card) → `/referral` (was: Settings sheet).
- Club Referral section CTA → `/referral` (pending: no Club page exists in this worktree yet; applies on merge with `feat/private-club-uiux`).
- No referral CTA opens Settings. Settings keeps its copy-link utility row (now powered by the shared `useInviteLink` hook).

## 10. UI hierarchy

Hero (`REFERRAL` eyebrow, "Invite. Grow. Unlock more.", Invite-a-Friend + How-It-Works) → Standard/Club segmented switcher → per-view content. Standard: reward ladder (3 bands + $100K+ custom note) → 3-step how-it-works → lock panel → Invite/Share CTAs (max 2 labeled examples: $20K→$1,500, $50K→$5,000). Club: qualified-referrals/points/stay progress → milestone ladder → stay enhancement (4→7) → Plus-layer + tier-unchanged note → Invite-a-Club-Member CTA. First viewport (480×840): label, headline, short explanation, switcher, start of model, primary CTA — full ladder below the fold. Desktop (1280×800): two-column (reward/progress left, how-it-works/CTA right).

## 11. Prototype-only boundaries (PROTOTYPE)

Invite-link generation is mocked client-side (`useInviteLink`: builds `t.me/<bot>?startapp=ref_<userId>`, clipboard/share with silent fallback). `useReferralProgress()` returns `{ successfulReferrals: 0, isPrototype: true }` — the ladder renders honestly locked. No counts fabricated.

## 12. Future backend dependencies (NOT IMPLEMENTED)

Real referral ledger, account crediting, reward-funded purchases, withdrawals/settlement, wallet/blockchain transfers, production attribution, anti-fraud, tax, booking/concierge fulfillment. Swap `useReferralProgress` return (never its shape) when a real source exists.

## 13. Compliance-gated status (COMPLIANCE-GATED)

The Standard investment-linked reward model is a proposed commercial configuration and must NOT be presented as a live financial entitlement until separately approved for production. Code and copy carry prototype/configuration boundaries ("Illustrative referral reward"); forbidden framing: guaranteed return, ROI, yield, cashback, cash withdrawal, profit.
