# FractionalLuxe — Phase 9 Implementation Contract

**Branch:** `phase-9-redesign`  
**Status:** Binding for all coding agents  
**Authority order (highest wins):**  
1. Locked Business Rules (`.agent/context/BUSINESS-RULES.md`, `FRACTIONALLUXE-PROGRAM.md`)  
2. This Contract  
3. `PHASE-9-AUDIT-9.0.md`  
4. `PHASE-9-PRODUCT-REDESIGN.md`  
5. `PHASE-9-UI-MAPPING-9.0.md` (reference only)

**Core rule:**  
If implementation conflicts with Audit or locked Business Rules → **stop and surface the conflict**. Do not improvise.

---

## 1. Purpose

This document is the **execution contract** for Phase 9.  
It defines what may change, what must not change, dependency order, and verification requirements.

Phase 9 is a **product/UX redesign**, not a financial-engine refactor.

---

## 2. Mandatory dependency order

No later slice may start before the previous slice is ACCEPTED.

| Order | Slice | Scope |
|------:|-------|--------|
| 1 | **P0 Foundation / Contract** | verification fields, stay types (data-only), unavailable-state helpers, payout semantic/display helpers |
| 2 | **Estate Detail** | highest product priority |
| 3 | **Home** | ownership-first hierarchy |
| 4 | **Estates** (`/marketplace`) | labels, filters, cards |
| 5 | **Income** | rental-income semantics |
| 6 | **My Estates** | ownership collection |
| 7 | **Resale polish** | terminology + entry points (no new market engine) |
| 8 | **Owner Stay shell** | presentation-only |
| 9 | **Trust deepening** | verification/management presentation |
| 10 | **Cross-surface QA** | before any merge proposal |

Do not implement multiple slices in one pass.

---

## 3. Non-negotiable invariants

### 3.1 Routes & shell
- Preserve all existing technical routes. No route renames or new primary routes.
- Preserve Telegram BackButton / MainButton / haptics / sheets / safe-area behavior unless a task explicitly requires a change.
- Bottom nav remains exactly 4 tabs. Only visible labels/icons/i18n may change.

### 3.2 Business / financial logic
**MUST NOT alter outputs of existing financial or business functions.**

Forbidden without a separate, explicitly approved task:
- `yield-math` and any yield calculation
- payout / accrual schedule logic
- withdrawal calculation (fee, installments, net)
- lock / free share rules
- settlement / `settleVerifiedBuy`
- order matching / orderbook engine
- share price calculation
- TON transaction sequence

**Requirement:** before/after tests (or equivalent fixtures) must prove **identical outputs** for unchanged financial functions.

### 3.3 Mock / API parity
- Preserve existing mock repository interfaces and API contracts.
- Do not rewrite the mock system to “make UI green”.
- Property IDs and core fields must remain compatible with the production manifest.
- New Phase 9 fields (verification, stay, etc.) that do not exist in real API/data → model as **unavailable**, never invent production semantics.
- **No new fabricated rental-economics numbers** (occupancy, operating costs, net distributable income, etc.).

### 3.4 Data honesty
- Do not invent missing backend data.
- Prefer explicit unavailable / “Data pending” / disabled states over fake values.
- Actual, Accrued, Expected, and Projected amounts must never be visually conflated.

---

## 4. Income status semantic contract

Single source of meaning for all Income surfaces:

| Status | Meaning | Show amount? | Show date? |
|--------|---------|--------------|------------|
| **Paid** | Actually settled to the user | Yes | Yes |
| **Accrued** | Earned but not yet settled | Yes | Only if source provides it |
| **Expected** | Pending distribution from real schedule/source | Yes | Yes, if source provides it |
| **Projected** | Forward-looking calculation only (estate economics / assumptions) | Yes | No, unless explicitly a projected date from source |

**Rules:**
- `Expected ≠ Projected`. Never treat them as synonyms.
- Never imply guaranteed income.
- APY must not be the hero metric on Income.

---

## 5. Owner Stay — P0 hard constraints

**P0 Owner Stay is presentation-only.**

MUST NOT create:
- availability / inventory logic
- booking / reservation / payment flows
- calendar engine
- date picker
- nights counter
- availability calculation
- API mutations
- fake request IDs
- fake confirmations
- fake blackout dates

**Allowed in P0 only:**
- Privilege explanation copy
- Entitlement display when real data exists
- Honest unavailable / disabled state when data does not exist
- Entry points that lead to explanation (not to a working booking system)

Any booking-capable Owner Stay is out of scope for Phase 9 P0.

---

## 6. Buy flow — allowed vs forbidden

### Allowed
- Visual step order (per Product Redesign §8)
- Labels and explanatory copy
- Ownership-first framing (“How much would you like to own?”)
- Owner Stay unavailable step (presentation only)
- Summary presentation and success-screen copy (celebrate ownership, not crypto)

### Forbidden
- Changes to TON transaction sequence
- Settlement logic
- Price calculation
- Share calculation
- Lock logic
- Backend mutation contract
- Any change that alters payment outcomes

---

## 7. Global product constraints (from redesign)

- Property identity precedes financial metrics.
- One dominant CTA per screen.
- No speculative / trading-terminal aesthetic, crypto neon, fake urgency, or yield-first hierarchy.
- Visible language: Estate, ownership share(s), Income / rental income, Resale, My Estates.  
  Never primary UI: trading, exchange, yield farming, tokens (as product narrative).
- Viewport target remains 480px-first (Telegram Mini App).

---

## 8. Explicit non-goals (do not add)

- DAO / governance
- Leverage / lending
- Yield farming / staking
- Social / copy trading
- Leaderboards
- NFT marketplace (as product surface)
- Crypto price ticker as hero
- Artificial scarcity / urgency
- Full hospitality marketplace
- Route migrations for naming only

---

## 9. Definition of Done (every slice)

A slice is ACCEPTED only when all of the following hold:

- [ ] Scope limited to the assigned slice only
- [ ] No forbidden financial/business logic changes (outputs identical)
- [ ] No invented data; unavailable states used where required
- [ ] Routes and Telegram interaction patterns preserved
- [ ] Relevant unit/component tests pass
- [ ] Playwright / visual checks for touched screens at **480×840** where applicable
- [ ] Changed files, tests run, screenshots/audit notes, and known limitations reported
- [ ] No merge to `main`

---

## 10. Stop rules (immediate halt)

Stop and report instead of guessing if:

1. Required backend/mock data does not exist and cannot be honestly marked unavailable  
2. Current business rules conflict with the redesign  
3. Ownership/financial semantics of a component are unclear  
4. A route migration appears necessary  
5. A change would break buy / sell / withdraw / lock paths  
6. Playwright reveals a non-isolated regression  
7. The task would require unrelated refactoring  
8. Mock and API contracts would diverge in a way that invents production semantics  

Rollback to the last accepted slice; do not pile unrelated fixes.

---

## 11. Agent handoff template (use per slice)

> Read in order:  
> 1) `PHASE-9-IMPLEMENTATION-CONTRACT.md` (this file)  
> 2) `PHASE-9-AUDIT-9.0.md`  
> 3) `PHASE-9-PRODUCT-REDESIGN.md`  
> 4) Relevant section of UI Mapping (reference only)  
>
> Inspect existing implementation before editing.  
> Implement **only** the assigned slice.  
> Preserve routes, business rules, Telegram behavior, and transaction semantics.  
> Do not invent missing data. Do not perform unrelated refactors.  
> Prove financial function outputs unchanged where applicable.  
> Run relevant tests and 480×840 visual checks for touched screens.  
> Report: changed files, tests, screenshots/audit results, limitations, commit-ready status.  
> Do not merge to `main`.

---

## 12. Progress discipline

- Work only on `phase-9-redesign` until explicit approval to merge.
- Never force-push; never rewrite history.
- Prefer small commits per accepted slice.
- Do not mix unrelated cleanup with Phase 9 work.

**Next action after this contract is accepted:**  
Execute **Slice 1 — P0 Foundation / Contract** only.