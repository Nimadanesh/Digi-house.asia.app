---
name: telegram-ton-ownership
description: Use when writing, editing, reviewing, or approving code in a Telegram Mini App + TON blockchain project — guards against God Components/files, tight coupling, layer violations, and overpromising on-chain MVP payouts. Trigger on any new file, file growth past ~350 lines, UI component reaching into TON/wallet logic, or any review/merge/phase-gate decision.
---

# Telegram-TON File Ownership Guard

## Overview
**Core principle:** Every file owns **one** responsibility. No God Components, God Services, God Stores, or God Utils. Wallet/chain logic is isolated behind service files; UI stays presentational; MVP payout claims stay **honestly labeled as simulated**.

Ownership is a **hard red line** for this project. Be polite but firm. "Looks fine, just one file doing five things" is still a fail.

## When to Use
- You're about to write, edit, or generate a new file in `src/`.
- A file is growing past ~350 lines, or a single export/hook/component is gaining a 5th+ responsibility.
- You see a UI component importing from `src/lib/ton`, `src/lib/mock`, or calling TonConnect directly instead of through a hook.
- A doc/screen says weekly payouts are "on-chain", "in your wallet", "verifiable now", or "undeniable" for the MVP.
- Before approving a PR / marking a phase done / running `/design-review`.

## The Hard Rules (never violate)

### 1. File Ownership Principle
- Every file has **one** clear responsibility. One sentence should describe what it owns.
- **No God Components / God Services / God Stores / God Utils.** If a file's name needs "And" or "/" it's probably two files.
- **Soft limit: 350 lines.** Approaching it → propose a split **before** crossing. Hard limit: 500 (a split is then mandatory, not optional).
- One default export per component file; co-located small sub-pieces only if they share the single responsibility.

### 2. Layered Architecture — strict separation
| Layer | Lives in | May import | Must NOT import |
|---|---|---|---|
| **UI / Presentation** | `src/components/**`, `src/app/**` | hooks, `types/`, `lib/format.ts`, `lib/utils.ts`, `components/ui` | `lib/ton/**`, `lib/mock/**`, `lib/api/**` directly |
| **Business logic / Hooks** | `src/hooks/**` | `lib/api/**` (repos), `types/`, `lib/format.ts` | `lib/ton/**` senders (go via hooks), `lib/mock/**` |
| **Data access / TON** | `src/lib/api/**` (repos), `src/lib/ton/**`, `src/lib/mock/**` | `types/`, `@tonconnect/ui-react`, `@ton/core` | `components/**`, `app/**`, React |
| **Utils / Helpers** | `src/lib/format.ts`, `src/lib/utils.ts` | `types/` | anything domain-specific, DOM, React |
| **Types / Constants** | `src/types/**` | nothing (leaf layer) | anything |
| **Config** | `src/lib/*/config.ts`, `.env.local` | `types/` | domain code |

**Dependency direction is one-way:** UI → hooks → (api | ton) → types. A lower layer never imports a higher one. **Components never call TonConnect/mock directly — they go through hooks** (this is the documented integration boundary in AGENTS.md and TECH_STACK.md).

### 3. MVP Payout Honesty (non-negotiable)
- Simulated vs real on-chain must be **visibly distinguishable** on every screen that touches payouts.
- Use the projected naming: `thisWeekProjectedUsd` (not `thisWeekUsd`), `projectedNextWeekUsd`, `projectedYield`. A field that is *projected*, never call *paid*.
- Canonical hero copy: **"simulated weekly payout · on-chain verifiable post-MVP"**. Paid pill on the hero Earnings screen is paired with a small **"simulated"** badge (muted, not a second finance color).
- Never claim on an MVP screen that rent "landed in your wallet", is on-chain, or is verifiable now. `txHash` in MVP is a **synthetic placeholder** — disclose it in the entry detail.
- Real on-chain weekly payout distribution is a **post-MVP** TON Distribution contract (see `DATA_MODELS.md` §6 on-chain shape).

### 4. TON + Telegram Specific Rules
- Wallet & blockchain logic lives **only** in `src/lib/ton/**` (`useTonConnect`, `sendTx`, manifest) and is reached via hooks — never from a component.
- UI components stay **purely presentational** when possible: props in, callbacks out. Side-effects (TX, navigation, haptics) live in hooks/containers.
- Telegram SDK wiring (`@telegram-apps/sdk-react`) lives in `src/lib/telegram/**`; components consume it through `useTelegram()` — never call the SDK raw.
- Money as **integer minor units (cents)**; TON as **nanoTON**; route all formatting through `src/lib/format.ts` (`usd`, `ton`, `pct`, `weeklyRent`, `projectedYield`…). Never `parseFloat` money in a component.

## How to Enforce (procedure)

### On writing / editing a file
1. **Name the responsibility** in one sentence. If you can't, stop — the file is doing too much.
2. **Check imports** against the layer table. A wrong-direction import is a violation even if it compiles.
3. **Check line count.** ≥350 → flag and propose the split. ≥500 → block.
4. **Scan for payout claims.** Any "Paid"/"on-chain"/"verifiable" copy → confirm it carries the simulated disclaimer or is explicitly post-MVP.

### When a file is too large — propose a split
Don't just say "split it." Give a concrete strategy:
- A component with 5 sub-sections → extract each section to its own file, keep the parent as a layout that composes them.
- A hook doing fetch + transform + tx + toast → split into `useXQuery`, `useXMutate`, with TX in `lib/ton` and toast in the hook caller.
- A util file with 4 unrelated helpers → 4 files (or move to where each is used if single-caller).
- A store with UI state + domain state + persistence → split into a UI store and a persisted domain store.

### Before approving / phase-gate
Run this checklist; **any fail blocks the change**:
- [ ] Every touched file: single responsibility stated, <350 lines (or justified split plan).
- [ ] No UI file imports `lib/ton`, `lib/mock`, or `lib/api` directly.
- [ ] No lower layer imports a higher layer.
- [ ] No `any`; money/TON use the branded helpers or correct integer units.
- [ ] All payout copy on MVP screens is honestly labeled "simulated"; projected fields use `…Projected` naming; Paid pill has the simulated badge where required.
- [ ] `/design-review` passes (this skill is the structural partner to that visual gate).

## Quick Reference — violation signatures

| Signature | Violation | Fix |
|---|---|---|
| `Component.tsx` imports `@tonconnect/ui-react` | Layer leak | Move to a hook in `src/hooks/**`; component consumes the hook |
| `useX.ts` imports `lib/mock/**` | Repo bypass | Go through `lib/api/**` repo interface + TanStack Query |
| `Component.tsx` > 400 lines | God Component | Extract sub-sections by responsibility |
| Field `thisWeekUsd` for a projection | Misleading naming | Rename to `thisWeekProjectedUsd` |
| Screen: "rent landed in your wallet" | Overpromise | Add "simulated" disclaimer / post-MVP framing |
| `lib/format.ts` importing React | Util overreach | Move to a hook; utils stay pure |
| `src/types/**` importing anything | Leaf violation | Types depend on nothing; use branded primitives only |
| `store.ts` holds UI flags + holdings + persistence | God Store | Split UI store vs domain store; persistence via middleware |

## Rationalizations — STOP (these mean block the change)

| Excuse | Reality |
|---|---|
| "It's just one more helper in this util" | One more is why utils become God utils. Move it to its single caller or a new file. |
| "The component's cleaner if it calls TonConnect here" | Cleaner for you now = layer violation for everyone later. Go through a hook. |
| "It's only 420 lines, mostly JSX" | Past the soft limit. JSX counts. Propose the split. |
| "Users won't notice it says 'paid' instead of 'simulated'" | Judges and auditors will. Honesty copy is a hard contract, not marketing. |
| "I'll split it in the next phase" | You won't. Split **before** merging. Ownership is a red line, not a backlog item. |
| "It's a hook, so it can import the mock" | Hooks import **repos**, not mock. The repo wraps mock. Swap-in is one-folder otherwise. |
| "Projected vs paid — same thing for the demo" | Not the same. `thisWeekProjectedUsd` is projection; paid is paid. Don't blur them. |
| "We'll fix the disclaimer later" | Later never comes. Block now. |

**Red flags — abort and restructure:**
- About to import `lib/ton/**` or `lib/mock/**` from `components/**` or `app/**`.
- About to name a projected/paid field ambiguously.
- About to add a 5th responsibility to one file.
- About to write "on-chain" / "verifiable" / "in your wallet" in MVP copy.

All of these mean: **stop, restructure, re-check.**

## What to say to the partner
When the skill is invoked (or "enable ownership guard" is said), remind: *"Ownership guard active — single responsibility per file, UI never reaches into TON/mock, MVP payouts labeled simulated, 350-line soft limit. Flag any violation before merge."* Then proceed, blocking any change that breaks a hard rule. Be polite; firm. No exceptions for "it's just a quick change."