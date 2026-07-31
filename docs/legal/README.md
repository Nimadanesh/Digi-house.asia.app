# DigiHouse — Legal & Compliance (DRAFT)

> **Status: DRAFT — for counsel review only. Not legal advice.**
>
> These documents are engineer-prepared drafts for DigiHouse's fractional real-estate Mini App.
> They are not final and do not create legally binding representations.
>
> Counsel must review, edit, and approve before any public-facing use.

## Contents

| Document | Description |
|---|---|
| [risk-disclosures.md](./risk-disclosures.md) | Risk factors for investors: capital loss, tech risk, no guaranteed yield, geo/ securities status, simulated vs on-chain |
| [how-yield-works.md](./how-yield-works.md) | Transparent math: weekly rent calculation, proportional share, floor division, dust policy, projected vs paid distinction |
| [counsel-review-checklist.md](./counsel-review-checklist.md) | Review items counsel must sign off on: geo allowlist, entity structure, marketing claims, placement, blank sign-off |

## In-app placement

The Mini App's **Settings → Help → About / Legal** sheet currently carries core honesty and disclaimer text (simulated payout, financial advice, copyright):

- `src/components/settings/AboutLegalSheet.tsx` — i18n-hosted disclaimers (engineer draft, subject to counsel revision)
- Property detail page: `src/components/documents/PropertyDocumentsList.tsx` — offering memoranda and financials (per-property, not general legal copy)

Counsel should decide whether these disclosure documents live:
- In-app as native Telegram screens (new route or sheet),
- On a public website (static HTML or GitHub Pages), or
- As downloadable PDFs linked from the app.

## Cross-references

- [ADR-001 §7 — Jurisdiction / who can buy](../adr/ADR-001-settlement-modes.md#7-jurisdiction--who-can-buy)
- [DATA_MODELS §6 — Earnings math & proportional invariant](../research/DATA_MODELS.md#6-rental-income-distribution-the-hero-on-chain-entity)
- [DATA_MODELS §9 — Format helpers (weeklyRent, projectedYield)](../research/DATA_MODELS.md#display-helpers-srclibformatts)
- [threat-model TM-19 — Legal/geo mischaracterization of shares](../security/threat-model-v0.md)
- [ADR-001 §3–4 — Honesty ladder & badge rules](../adr/ADR-001-settlement-modes.md#3-ui-badge--honesty-rules-non-negotiable)
