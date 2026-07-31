# DigiHouse — Threat Model v1

- **Status:** Active (supersedes v0)
- **Date:** 2026-07-30
- **Method:** STRIDE-lite, updated post P5-01 (pen-test) and P5-02 (contract audit prep)
- **Scope:** Mini App + API + TON testnet/mainnet path (Phases 0–5)
- **Out of scope:** full formal verification, nation-state APT playbooks, physical office security

---

## 1. Changes from v0

| Change | Reason |
|---|---|
| TM-25 (new) | P5-02: No contract code in tree yet — supply-chain of future FunC/Tact dependencies not reviewed |
| TM-23→24 | P5-01: Pen-test findings (clipboard URL sharing, CSV formula injection) added as risks |
| TM-07 severity unchanged | P5-01 confirmed honesty/badge bypass remains high-impact; no new vector found |
| All TM severity/likelihood reviewed | Post pen-test: no residual downgraded without new controls |
| §7 Residual risks updated | Some v0 residuals now partially addressed (secrets rotation drill, supply-chain policy) |
| v0 status note added | `docs/security/threat-model-v0.md` marked Superseded |

---

## 2. Risk register

| ID | Threat | STRIDE | Asset | Sev | Like | Mitigation | Task / ADR / Evidence |
|---|---|---|---|---|---|---|---|
| TM-01 | **initData forgery / replay** — fake or expired Telegram auth → forged session | S | Sessions, ledger | H | M | HMAC verify bot token; reject bad/expired `auth_date`; fail closed; token never in client | P1-04, P1-05, ADR-004; pen-test P5-01 PASS |
| TM-02 | **IDOR on orders** — `DELETE /v1/orders/{id}` cancels another user's order | T/E | Orders | H | M | Authorize maker == session user; 403 tests; never trust client `userId` | P1-11, OpenAPI; pen-test P5-01 PASS |
| TM-03 | **IDOR on portfolio/earnings** — read or act on another user's books | I/T | Holdings, earnings | H | M | Caller-scoped queries only; no userId path param for self resources | P1-09, P1-10; pen-test P5-01 PASS |
| TM-04 | **Buy confirm IDOR / intent hijack** — confirm another user's `intentId` or forge confirm without prepare | T/E | Holdings, float | H | M | Bind intent to session; one-time intent; expiry; 409 on reuse | P1-12; pen-test P5-01 PASS |
| TM-05 | **Hot wallet drain** — stolen payout/fund key or unlimited top-up | E/T | Rent float | H | M | Caps, minimal balance, monitoring, separate keys, pause on incident; secrets rotation drill | ADR-004, P0-07, P5-05/06, secrets-rotation-drill.md |
| TM-06 | **Indexer lag / missed events** — double credit, stuck pending, chain≠DB | T/R | Holdings, earnings | H | M | Idempotent event_id; reconciliation job; resync tools; don't mark paid without event | P3-01…03, P3-06 |
| TM-07 | **Honesty / badge bypass** — UI claims on-chain while mock/hybrid; hide simulated without real hash | T/I | Trust | H | H | ADR-001 gates; design-review; SETTLEMENT_MODE + real txHash + explorer URL required; E2E earnings-honesty spec | ADR-001, P3-10, design-review, e2e/tests/earnings-honesty.spec.ts |
| TM-08 | **Rate abuse** — spam `placeOrder`, auth, `prepareBuy`; scrape marketplace | D | API availability, UX | M | H | Rate limits per IP/user; auth backoff; optional CAPTCHA later | P4-05 area, P1-18 smoke |
| TM-09 | **Unbounded distribution gas** — single-TX push all holders returns | D | Payouts, relayer | H | L | Claim-based MVP; forbid unbounded loop; batch max if ever enabled | ADR-003, P2-04, P2-07 |
| TM-10 | **Mock→live honesty failure** — product markets "live rent" while ledger is DB-only | I | Trust, legal | H | M | Mode ladder; QA exit criteria; no silent cutover on `DATA_SOURCE=api` | ADR-001, Phase 1/3 exit |
| TM-11 | **Session theft (XSS / token leak)** — steal bearer from JS or storage | S/I | Sessions | H | M | Prefer httpOnly cookie; CSP; no token in logs; short TTL; XSS hygiene; pen-test PASS on storage XSS | P1-05, P1-16, P5-01 |
| TM-12 | **TonConnect phishing / wrong manifest** — user signs hostile payload | S/T | User funds | H | M | Correct manifest URL; prepare shows clear amounts; testnet default; user education | TECH_STACK, P1-12, P3-04 |
| TM-13 | **Insider malicious mint / pause abuse** — admin mints shares or unpauses fraud | E/T | Supply, trust | H | L | Multisig/timelock mainnet; audit_events; dual-control; access tests; pause key holders named | ADR-004, P1-14, P2-06, P4-03 |
| TM-14 | **Underfunded pool marked paid** — earnings flip without rent funded | T | Earnings honesty | H | M | ADR-003 underfunded block; no paid without fund/claim event | ADR-003, P1-13, P3-03 |
| TM-15 | **Synthetic txHash as "explorer-real"** — link `simulated:` to tonviewer | I | Trust | M | H | Explorer only if non-`simulated:` + buildable URL (ADR-001 §4) | ADR-001, P3-07 |
| TM-16 | **Secrets in git / client bundle** — bot token or keys in `NEXT_PUBLIC_*` or repo | I/E | All secrets | H | M | SM only; secret scan; never public env for secrets; rotate if leaked; rotation drill executed | ADR-004, P0-07, P5-05, secrets-rotation-drill.md |
| TM-17 | **Open or unauth tickPayout** — public/worker route flips all pending→paid | T/E | Earnings ledger | H | M | Worker-only; no Mini App route; internal auth/network; idempotency key | P1-13, OpenAPI note |
| TM-18 | **CSRF on cookie sessions** — cross-site state-changing calls | T | Orders, buys | M | M | SameSite cookies; CSRF token or bearer-preferred for mutations | P1-05, P1-16 |
| TM-19 | **Legal/geo mischaracterization of "shares"** — product treated as unregistered security in a geo | — | Continuity | H | M | Counsel; disclosures; geo/KYC gates later; no guaranteed-yield claims; risk-disclosures.md drafted | ROADMAP §7, P5-07, ADR-001 §7, docs/legal/ |
| TM-20 | **Single RPC / reorg blindness** — wrong confirmations, false mint credit | T | Holdings | M | M | Don't trust single RPC; confirmation depth policy; recon | P3-01, P3-06 |
| TM-21 | **Supply-chain npm compromise** — malicious dependency in web/api | E/T | Full stack | H | L | Lockfiles; CI audit; pin versions; minimal deps; supply-chain policy active | P5 supply-chain scan, docs/security/supply-chain.md |
| TM-22 | **Batch relayer key abuse** (if ADR-003 B enabled later) — drain via push path | E/D | Float | H | L | Separate key; stricter cap; rate limit; off by default | ADR-003/004, P2-07 |
| TM-23 | **Clipboard URL sharing** — property/image URLs with session or internal identifiers leaked via copy-paste | I | Data leakage | M | M | P5-01 finding: clipboards are OS-controlled; mitigated by no secrets in URLs; no session tokens in share links | P5-01 pen-test: accepted residual |
| TM-24 | **CSV formula injection** — exported earnings/portfolio CSV opens in spreadsheet with formula execution | T | Data integrity | M | M | P5-01 finding: escape formula prefixes (`=`, `+`, `-`, `@`); validated | P5-01 pen-test: fixed |
| TM-25 | **Contract dependency audit gap** — FunC/Tact dependencies not yet reviewed (no contract code in tree) | E/T | Jetton supply, distribution | H | M | Pre-audit checklist identifies gap; audit SOW scoped; no mainnet deploy until audit complete | P5-02, pre-audit-checklist.md, audit-sow.md |

---

## 3. STRIDE coverage checklist

| Letter | Covered by |
|---|---|
| **S** Spoofing | TM-01, TM-11, TM-12 |
| **T** Tampering | TM-02–04, TM-06, TM-07, TM-14, TM-17, TM-18, TM-20, TM-24, TM-25 |
| **R** Repudiation | TM-06 (audit/recon); mitigated by P1-14 `audit_events` |
| **I** Info disclosure | TM-03, TM-07, TM-15, TM-16, TM-19, TM-23 |
| **D** DoS | TM-08, TM-09, TM-22 |
| **E** Elevation | TM-02, TM-04, TM-05, TM-13, TM-17, TM-21, TM-25 |

---

## 4. Residual risk and acceptance

| Residual | v0 disposition | v1 update | Revisit |
|---|---|---|---|
| User signs wrong TonConnect payload | Accepted — reduce via prepare UX | Unchanged | P3 buy path UX |
| Multisig not ready on day-one testnet | Accepted — staged ladder ADR-004 | Unchanged. Gate mainnet P5-08 go/no-go | P5-08 sign-off |
| Legal characterization of "shares" | Accepted — counsel Phase 5 | **Partially addressed:** risk-disclosures.md drafted (P5-07). Needs counsel sign-off. | Counsel sign-off §F |
| Supply-chain zero-days | Accepted — P5 scans + pins | **Partially addressed:** supply-chain policy active (P5-01). npm deps scanned. Contract deps TBD (TM-25). | P5-02 audit, ongoing |
| Single-geo regulatory surprise | Open Q5 | Unchanged. Geo allowlist policy owner TBD (counsel-review-checklist.md §1). | Counsel review |
| Clipboard URL data leakage (TM-23) | — (new) | **Accepted residual.** No secrets in URLs. URL content = public property data. | None |
| Contract dependency audit gap (TM-25) | — (new) | **Accepted residual.** No contract code in tree yet. Pre-audit checklist filed; SOW scoped. No mainnet until audit. | P5-02 completion |

**v1 acceptance:** This register reflects knowledge after pen-test and contract audit prep. It is sufficient for the P5-08 go/no-go meeting. It is **not** a formal security audit or legal opinion.

---

## 5. Required risks deep-dive (updated)

### TM-07 — Honesty / badge bypass (unchanged from v0)

Post P5-01 pen-test: no new bypass vector found. E2E `earnings-honesty.spec.ts` asserts simulated badge presence in hybrid mode. Continue enforcing ADR-001 §4 gates in design-review.

### TM-23 — Clipboard URL sharing (new, P5-01 finding)

- **Path:** Property detail, share, or image URLs copied to clipboard may contain internal identifiers or query parameters.
- **Blast radius:** Low — no secrets or session tokens in DigiHouse URLs (verified P5-01).
- **Detection:** N/A — accepted residual.
- **Mitigation:** Ensure URL generation never includes session/secret data. Already compliant.

### TM-24 — CSV formula injection (new, P5-01 finding — fixed)

- **Path:** Earnings or portfolio CSV export rows starting with `=`, `+`, `-`, `@` executed as formulas when opened in spreadsheet software.
- **Blast radius:** Data integrity — malformed CSV could leak data in spreadsheet context.
- **Detection:** CSV import warnings in spreadsheet software.
- **Mitigation:** Escape leading formula characters; use tab-separated or quoted fields. **Fixed in P5-01.**

### TM-25 — Contract dependency audit gap (new, P5-02 finding)

- **Path:** Future FunC/Tact contracts import third-party libraries not audited by P5-02.
- **Blast radius:** Jetton mint, distribution, or pause logic compromised via dependency.
- **Detection:** Supply-chain review at audit time.
- **Mitigation:** Pre-audit checklist identifies gap (item G.1); audit SOW scoped to review all dependencies. No mainnet until audit pass.

---

## 6. References

- [threat-model-v0.md](./threat-model-v0.md) — superseded by this document
- [pen-test-p5-01.md](./pen-test-p5-01.md) — P5-01 pen-test findings
- [audit-findings-register.md](./audit-findings-register.md) — P5-02 audit findings register
- [pre-audit-checklist.md](./pre-audit-checklist.md) — P5-02 pre-audit checklist
- [supply-chain.md](./supply-chain.md) — P5-01 supply-chain policy
- [ADR-001](../adr/ADR-001-settlement-modes.md) — settlement honesty / badges
- [ADR-004](../adr/ADR-004-key-hierarchy.md) — keys, caps, secrets
- [mainnet-go-no-go.md](../ops/mainnet-go-no-go.md) — P5-08 go/no-go pack
- [EXECUTION-PLAN.md](../../EXECUTION-PLAN.md) — P0-06 acceptance, P5 tracker
