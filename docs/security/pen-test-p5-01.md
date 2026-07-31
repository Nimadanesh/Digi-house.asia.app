# P5-01 Pen-test: Auth and IDOR

- **Date**: 2026-07-30
- **Scope**: API auth bypass, session fixation, IDOR on orders/portfolio/earnings/transactions/buys
- **Method**: Automated regression suite (`apps/api/src/security/pen-*.test.ts`) + manual checklist below
- **Wallet bind ATO**: Route does not exist — documented as **GAP** (see § Gaps)
- **Secrets rotation drill**: Exercised in P5-05/P5-06 (link forward)

---

## Results matrix

| Threat | TM-ID | Test file | Status | Notes |
|--------|-------|-----------|--------|-------|
| **initData forgery** — invalid hash | TM-01 | `pen-auth.test.ts` | **PASS** | 401 returned |
| **initData replay** — expired auth_date | TM-01 | `pen-auth.test.ts` | **PASS** | 401 returned (>24h) |
| **initData empty / malformed** | TM-01 | `pen-auth.test.ts` | **PASS** | 400 returned |
| **initData wrong bot token** | TM-01 | `pen-auth.test.ts` | **PASS** | 401 returned |
| **initData valid** — happy path | TM-01 | `pen-auth.test.ts` | **PASS** | 200 + token |
| **Bearer missing** on private route | TM-11 | `pen-auth.test.ts` | **PASS** | 401 on every private route |
| **Garbage Bearer** token | TM-11 | `pen-auth.test.ts` | **PASS** | 401 |
| **Token from wrong signing secret** | TM-11 | `pen-session.test.ts` | **PASS** | 401 |
| **Expired JWT** | TM-11 | `pen-session.test.ts` | **PASS** | 401 |
| **No fixation via `?userId=`** | TM-02/03 | `pen-session.test.ts` | **PASS** | Session userId always wins |
| **IDOR: B cancel A order** | TM-02 | `pen-idor.test.ts` | **PASS** | 403 |
| **IDOR: B reads A portfolio** | TM-03 | `pen-idor.test.ts` | **PASS** | Holdings scoped to caller |
| **IDOR: B reads A earnings** | TM-03 | `pen-idor.test.ts` | **PASS** | Entries scoped to caller |
| **IDOR: B reads A transactions** | TM-03 | `pen-idor.test.ts` | **PASS** | Tx scoped to caller |
| **IDOR: B confirms A buy intent** | TM-04 | `pen-idor.test.ts` | **PASS** | 404 (not 200) |
| **IDOR: B sends userId in body** | TM-04 | `pen-idor.test.ts` | **PASS** | Intent bound to session |
| **Wallet bind ATO** | — | — | **GAP** | Route not implemented; see § Gaps |
| **CSRF** (cookie session) | TM-18 | — | **N/A** | Bearer-only; no cookie session deployed |
| **Rate-limit fail-closed** | — | existing rate-limit tests | **PASS** | Redis rate limiter fail-closed (Plan 003) |

---

## Protected route inventory

| Method | Path | Auth middleware | Test coverage |
|--------|------|----------------|---------------|
| POST | `/v1/auth/telegram` | Rate-limit (IP, 10/min) | `pen-auth.test.ts` |
| GET | `/v1/me` | `requireSession` | `pen-auth.test.ts`, `pen-session.test.ts` |
| GET | `/v1/portfolio` | `requireSession` | `pen-auth.test.ts`, `pen-idor.test.ts`, `pen-session.test.ts` |
| GET | `/v1/portfolio/export.csv` | `requireSession` | (covered by portfolio.test.ts) |
| GET | `/v1/earnings` | `requireSession` | `pen-auth.test.ts`, `pen-idor.test.ts`, `pen-session.test.ts` |
| GET | `/v1/transactions` | `requireSession` | `pen-auth.test.ts`, `pen-idor.test.ts`, `pen-session.test.ts` |
| POST | `/v1/orders` | `requireSession` + rate-limit | `pen-auth.test.ts` |
| DELETE | `/v1/orders/:id` | `requireSession` | `pen-auth.test.ts`, `pen-idor.test.ts` |
| POST | `/v1/buys/prepare` | `requireSession` + rate-limit | `pen-auth.test.ts`, `pen-idor.test.ts` |
| POST | `/v1/buys/confirm` | `requireSession` | `pen-auth.test.ts`, `pen-idor.test.ts` |
| GET | `/v1/properties/:id/documents` | Public | — |
| GET | `/v1/properties/:id/documents/:docId/url` | `requireSession` + holding check | `documents.test.ts` |
| GET | `/v1/marketplace` | Public | — |
| GET | `/v1/properties/:id` | Public | — |
| GET | `/v1/properties/:id/order-book` | Public | — |
| ALL | `/v1/admin/*` | `requireAdminSecret` | `admin.test.ts` |

---

## Gaps

### GAP-01: Wallet bind route not implemented
- **Risk**: No API endpoint to bind a TON wallet address to a user account. Wallet address is currently stored on the `users` table (`walletAddress` column), and set only by client during onboarding. An attacker with session access could in theory set any address via the client.
- **Mitigation**: The `walletAddress` field on `UserPublic` is `string | null` and the client-set value during onboarding is the only write path. No wallet-bind API route exists to exploit.
- **Recommendation**: Implement `POST /wallets/bind` with TonConnect proof (signed message) per ROADMAP Phase 1.3. See ADR-004 for key hierarchy.

### GAP-02: No external penetration test
- **Risk**: Automated regression covers known threat model vectors but does not replace a human-led pen-test with creative chained attacks.
- **Recommendation**: Engage external pen-test firm or bug bounty program (budgeted in Phase 5.1 ROADMAP).

### GAP-03: No CSRF protection (bearer-only deployment)
- **Risk**: Currently no cookie-based session is deployed — all auth uses `Authorization: Bearer <JWT>` header. CSRF is not applicable to the bearer-only pattern but would be required if cookie sessions are introduced.
- **Recommendation**: If cookie sessions are added, enforce `SameSite=Strict` and consider CSRF tokens per TM-18.

---

## Findings requiring code fix

**None.** All automated tests PASS. Pre-existing vulnerabilities addressed prior to this pen test:
- SEC-03: `publicUrl` bypassing signed URL TTL (Plan 008, `f7a3205`)
- SEC-06: Document download lacking shareholding check (Plan 009, `b4d162b`)
- SEC-01: CSV formula injection (Plan 001, `9286095`)
- SEC-02: Missing `draft` in DB CHECK constraint (Plan 002, `ea85d7b`)

---

## Test execution

```bash
# Run full API test suite including pen tests
npm run test -w @digihouse/api

# Run pen tests only
npx vitest run apps/api/src/security/ --workspace @digihouse/api
```

---

## Sign-off

- **P5-01 automated pen-test suite**: PASS
- **Threat model coverage**: TM-01, TM-02, TM-03, TM-04, TM-11, TM-18
- **Remaining work**: External pen-test (P5-01 scope), contract audit (P5-02)
- **Prepared for threat-model-v1.md**: Supersedes v0 after P5-01; residual risks documented above.
