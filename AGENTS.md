# ACTIVE WORK: FractionalLuxe program — read FRACTIONALLUXE-PROGRAM.md before any task.
Work its checkboxes in order; tick as you verify; update its Resume Here + Progress Log.
Never modify payment/settlement logic beyond steps it explicitly names.

# FractionalLuxe Agent Operating System

This repository is operated as a product team, not as a code-generation queue.

## Before every task
1. Read `FRACTIONALLUXE-PROGRAM.md` for active phase, locked decisions, blockers, and execution order.
2. Read the relevant product/spec documents before making product or UX decisions.
3. Read `.agent/TEAM.md` and `.agent/ORCHESTRATOR.md` when the task is non-trivial or ambiguous.
4. Identify the desired outcome, scope, constraints, acceptance criteria, and risk before coding.

## Ambiguity rule
Do not silently guess when multiple plausible interpretations would materially change behavior, scope, data, architecture, or risk.
- If repository context strongly supports one low-risk interpretation, state it briefly and proceed.
- If the ambiguity is material, ask one focused question before changing code.
- Never ask the user to restate information that is already documented in the repository.

## Engineering behavior
- Think before coding.
- Simplicity first.
- Make surgical changes.
- Do not invent product requirements.
- Do not add dependencies without explicit approval.
- Do not perform unrelated refactors or formatting churn.
- Verify the intended behavior, not merely compilation.

## Team responsibilities
- Product intent/scope → `.agent/roles/product-lead.md`
- UX/design → `.agent/roles/product-designer.md`
- Architecture → `.agent/roles/tech-lead.md`
- Implementation → `.agent/roles/senior-engineer.md`
- Verification → `.agent/roles/qa-engineer.md`
- Security/financial logic → `.agent/roles/security-finance.md`
- Production/release → `.agent/roles/release-engineer.md`

The same coding agent may perform multiple roles for small tasks, but it must preserve these responsibility boundaries.

## Product identity
The user-facing product is **FractionalLuxe** and the app domain is **`app.fractionalluxe.com`**. `DigiHouse` may remain in technical identifiers where changing it would create unnecessary risk or break an existing contract. Do not mass-rename technical identifiers merely for branding.

## Product context and invariants
- `.agent/context/PRODUCT.md` — product identity, model, principles, scope.
- `.agent/context/BUSINESS-RULES.md` — locked business and financial rules.
- `FRACTIONALLUXE-PROGRAM.md` — active execution plan and locked program decisions.

If these conflict with a source-of-truth spec, stop and surface the conflict; do not silently choose.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# DigiHouse — Fractional Property on TON (Telegram Mini App)

## What This Is
A Telegram Mini App to buy, sell, and earn **weekly rental yield** from fractionalized real estate on the **TON** blockchain. Small-budget investors buy property shares; owners raise liquidity by selling a percentage. Rent income is paid to shareholders **proportional to their share, weekly**.

This repo started from a Next.js + shadcn/ui + Tailwind v4 scaffold. We are **NOT cloning** any site — we build from scratch against the spec docs below.

## ⚠️ STRICT DESIGN RULE (non-negotiable)
The entire UI/UX must **look and feel indistinguishable from native Telegram**:
- Official Telegram colors (dark canvas `#17212b`, lighter block `#232e3c`, Telegram blue `#3390ec`, hint `#707499`…), expressed as oklch tokens in `src/app/globals.css`.
- **System font** (SF Pro / Roboto / Segoe UI) — never a web font.
- **Grouped "blocks"** on the lighter panel over the darker canvas, hairline **inset** row separators, **flat** (no drop shadows on blocks), Telegram-style buttons, the Telegram **header**, **bottom tab bar**, the **MainButton**, and **haptics**.
- Dark mode first; Telegram blue is the only accent; green/red are reserved for finance up/down and bid/ask.
- `DESIGN_SYSTEM.md` is the single visual authority. A screen that compiles but isn't native-Telegram is a **fail**.

## Build discipline
- We work **phase by phase** (ROADMAP.md). **Phase 1 = Specifications.** Do NOT build any UI, pages, or components until the docs are approved and you're explicitly told to proceed to Foundation.
- When given the go-ahead, Foundation must land before Components.
- Wire everything through documented integration boundaries — components never call TonConnect/mock directly; they go through hooks.
- Run `npm run check` + a `/design-review` on touched screens at the end of each phase. Both must be green before a phase is "done".

## Read these docs BEFORE writing code (in order)
1. `docs/research/BRIEF.md` — what & why, principles, MVP scope
2. `docs/research/REQUIREMENTS.md` — acceptance-criteria requirements (R-IDs); native-Telegram NFRs
3. `docs/research/USER_FLOW.md` — detailed journeys + navigation map + back-stack + haptics
4. `docs/research/DESIGN_SYSTEM.md` — **authority for every visual decision** (tokens live in `src/app/globals.css`)
5. `docs/research/DATA_MODELS.md` — shared TypeScript types + repository contracts; mirror into `src/types/`
6. `docs/research/TECH_STACK.md` — exact stack, versions, integration boundaries, decisions log
7. `docs/research/ROADMAP.md` — phased plan; `npm run check` green each phase

If something here and the spec docs disagree, the **spec docs win** (then update AGENTS.md).

## Tech Stack (summary — full: TECH_STACK.md)
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript strict
- **Styling:** Tailwind CSS v4 (oklch tokens) + shadcn/ui (base-nova) + lucide-react
- **Animation:** Framer Motion
- **Wallet/Chain:** `@tonconnect/ui-react` (connect + send TX); `@ton/core` when needed
- **Telegram:** `@telegram-apps/sdk-react` (init, theme, viewport, back/MainButton, haptics)
- **State:** TanStack Query (server cache) + Zustand (local UI)
- **Data:** mock repository layer (`src/lib/mock`) behind repo interfaces — real TON/backend swap-in later
- **Deploy:** Vercel + Telegram Mini App (BotFather)

## Commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
- `npm run check` — lint + typecheck + build (MUST be green before any phase is "done")

## Code Style
- TypeScript strict, **no `any`**
- Named exports; PascalCase components; camelCase utils/hooks
- Tailwind utility classes only (no inline styles); 2-space indent
- Mobile-first; max app width 480px; safe-area aware; **no horizontal scroll**
- Money as **integer minor units (cents)**; TON as **nanoTON**; use `src/lib/format.ts` helpers (`usd`, `ton`, `shortAddr`, `pct`, `weekLabel`)
- Tabular-nums for all money/share figures
- English copy only (MVP)

## Design Principles
- **Native Telegram first** — see the STRICT DESIGN RULE above
- **Trust through clarity** — numbers are the hero, low chrome, generous whitespace
- **One accent** (Telegram blue); semantic green/red only for bid/ask and up/down
- **One primary action** per screen; ≥44px touch targets; MainButton carries screen-primary actions
- **Flat** — hairlines + color separation, not shadows
- Every screen ships: loaded | loading skeleton | empty | error states
- Respect `prefers-reduced-motion"`

## Project Structure (target)
```
src/
  app/
    layout.tsx, page.tsx, providers.tsx
    (app)/ home marketplace property/[id] earnings portfolio settings
  components/
    ui/ (shadcn, restyled native-Telegram) layout/ property/ earnings/ wallet/ common/ icons.tsx
  hooks/
  lib/
    utils.ts format.ts query/ api/ mock/ ton/ telegram/
  stores/
  types/
public/ images/properties/ seo/
docs/research/  # spec docs (source of truth)
```

## MOST IMPORTANT NOTES
- Build **phase by phase** (ROADMAP.md). Foundation must land before Components.
- Always wire new deps through the documented integration boundaries (TECH_STACK.md) — don't call TonConnect/mock directly from components; go through hooks.
- The mock layer must cover every UI state: ≥6 properties (funding/funded/resale), holdings, ≥4 weekly earnings, ≥1 open order, a failed/pending tx example.
- Append new tech decisions to the **Decisions log** in TECH_STACK.md (don't silently switch libs).
- Do NOT commit secrets. Use `.env.local` for any BotFather/TonConnect endpoints.

## Agent OS references
- Team charter: `.agent/TEAM.md`
- Orchestrator: `.agent/ORCHESTRATOR.md`
- Product context: `.agent/context/PRODUCT.md`
- Business rules: `.agent/context/BUSINESS-RULES.md`
- Role definitions: `.agent/roles/`
- Protocols: `.agent/protocols/`
