# FIFI-LIVE-DATA-V1 — Live Data Contract, Provider Boundary & Context-Safe Access

**Status:** CONTRACT + REFERENCE IMPLEMENTATION / AUTHORITATIVE for live access
**Slice:** FIFI-08 (contract + audit + boundary; no external provisioning)
**Date:** 2026-09-29
**Builds on:** all FIFI-01–07 contracts (untouched)

> Fifi learns meaning from static knowledge and current values from approved live
> sources — never the reverse, never mixed, never from mock data masquerading as truth.

---

## 1. Repository Audit (findings)

- **No in-repo API routes, server actions, or DB clients.** All data flows through
  the 13 `Repos` interfaces (`src/lib/api/repos.ts`), served by mock or http
  implementations behind `getRepo()` (`NEXT_PUBLIC_DATA_SOURCE`: `mock`|default,
  `api` + `NEXT_PUBLIC_API_BASE_URL` + Bearer session token).
- **HTTP surface (external backend):** `GET /v1/marketplace, /properties/:id,
  /order-book, /trades, /portfolio, /earnings, /transactions, /documents,
  /locks, /me/summary, /nfts, /fees, /stay` + `POST /v1/orders, /buys/*,
  /locks*, /sells/instant, /withdrawals` + `DELETE /v1/orders/:id`. Earnings
  `tickPayout` has no endpoint (local stub). Club/Referral have no repos
  (local prototypes). Stay mock is always `unavailable`.
- **Identity:** backend derives the caller from the session JWT (`sub`, from
  validated Telegram initData); the frontend never sends a userId. Wallet/EVM
  addresses are unproven client assertions (known GAP-01) — never authorization.
- **Mock semantics:** computed aggregates + mutable demo ledgers + hardcoded
  fixtures + fake latency; settlement semantics differ from HTTP (optimistic vs
  deferred). Mock is demo truth only.

## 2. Architecture

```text
DecisionEngine (needs live?) → LiveDataProvider → approved source (Repos impl)
                                    ↓
                        static KB stays untouched; answer layer combines later
```

`src/lib/fifi/live-data.ts`: capability IDs, registry, request/response/error
contracts, `LiveDataProvider` interface, `RepoLiveDataProvider` (dependency
inversion over existing `Repos` — zero new backend code).

## 3. Capability Registry (10 capabilities)

| Capability | Current Source | Status | User-specific | Auth Required | External Infra Required |
|------------|----------------|--------|---------------|---------------|-------------------------|
| portfolio.summary | PortfolioRepo.summary() | AVAILABLE_WITH_EXISTING_BACKEND | yes | yes | NO (existing http endpoint) |
| portfolio.holdings | summary().holdings | AVAILABLE_WITH_EXISTING_BACKEND | yes | yes | NO |
| earnings.current | summary() native fields | AVAILABLE_WITH_EXISTING_BACKEND | yes | yes | NO |
| earnings.history | summary().entries | AVAILABLE_WITH_EXISTING_BACKEND | yes | yes | NO |
| withdrawal.status | WithdrawalsRepo.list() | AVAILABLE_WITH_EXISTING_BACKEND | yes | yes | NO |
| transaction.status | TxRepo.listTransactions() | AVAILABLE_WITH_EXISTING_BACKEND | yes | yes | NO |
| order.status | OrderBookRepo.get() | AVAILABLE_WITH_EXISTING_BACKEND | yes | yes | NO |
| membership.status | prototype only, no repo | NOT_IMPLEMENTED | yes | yes | n/a (fails closed) |
| referral.status | prototype only, no ledger | NOT_IMPLEMENTED | yes | yes | n/a (fails closed) |
| estate.current | MarketplaceRepo.get() | AVAILABLE_WITH_EXISTING_BACKEND | no | no | NO |

In this checkout (no backend running) all AVAILABLE_* resolve through labeled
`mock-demo` sources; production truth comes from wiring the http repos — no code
change in this layer.

## 4. Request / Response / Error Contracts

Request: capability*, propertyId?, fields?, locale?, requestId? — **no identity
field exists by construction**; subject bound server-side at construction.
Response: repo-native data verbatim (accrued/paid/projected stay structurally
distinct by key names; entry status/dates preserved) + `{provenance, currentness,
source, freshness}`. Mock-computed aggregates → DERIVED; direct store reads →
OBSERVED; freshness honestly `unknown` unless sourced. Errors: unauthenticated,
unauthorized, unavailable, not_implemented, source_error, stale,
invalid_context, insufficient_context, unknown — structured, no prose, no
payloads, no stack traces.

## 5. Authorization & Wallet Boundary

User capabilities require an authenticated server-resolved subject; anonymous →
`unauthenticated`; unresolved → `unauthorized`. Cross-user access is impossible by
construction (no target-user parameter). Wallet data: no keys/seeds/credentials
anywhere; only derived product state flows. Session/JWT mechanics unchanged.

## 6. Estate Classification

Static observed/modeled/derived/unknown facts stay in KB. Only price +
sold/total + status via `estate.current`, labeled DERIVED-current from the
declared source. Canonical 24-identity untouched.

## 7. Mock/Live Firewall

`mock-demo` provider refuses without explicit `allowDemo` opt-in; every success
stamps `source: mock-demo` + `freshness: unknown`. Nothing in this layer can
promote demo data to live truth — production wiring is a deployment fact (http
repos + backend), not a code branch.

## 8. Brand Independence

Capability IDs, interfaces, and logic carry zero display-brand literals
(test-enforced). Rename-safe.

## 9. Infrastructure Required (mandatory report)

- Server required now? **NO** (no routes/actions added; rides existing repos).
- Laya required now? **NO** (live data never depends on models; adapter untouched).
- External API required now? **NO** (http endpoints already exist externally).
- API credentials required now? **NO** (existing session-JWT flow reused).
- Database required now? **NO** (no new persistence).
- Any other paid/external service? **NO**.
- $0/month target holds. Nothing purchased, provisioned, or deployed.

## 10. Verification

16/16 vitest green (isolation-by-construction, auth, registry, firewall, opt-in,
provenance/currentness distinctions, estate labeling, structured failures,
secret-freedom, context preservation, brand independence, stability); `tsc` +
`eslint` clean. Defects fixed in-slice: earnings field mapping now uses native
names (no null placeholders), tx pagination shape, stray-brace syntax.

## 11. Extension Points

Http wiring (deployment), locks capability (if needed), freshness propagation
when backends provide it, field selection enforcement, conversation-scoped
caching — all without interface changes.

---

*End of FIFI-LIVE-DATA-V1. Next: FIFI-09 (do not start automatically).*
