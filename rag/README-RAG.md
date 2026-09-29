# rag/ — RAG Chatbot Knowledge Base

Everything the FractionalLuxe RAG chatbot knows lives in this folder. **No product code
lives here** — this tree is data, prompts, and one preparation script only.

## Current Status: KNOWLEDGE FOUNDATION REWRITTEN (FIFI-03, 2026-09-29)

The RAG knowledge work resumed as the Fifi program (see `docs/FIFI-ROADMAP-V1.md`,
`docs/FIFI-KNOWLEDGE-CONTRACT-V1.md`, `docs/FIFI-KNOWLEDGE-SCHEMA-V1.md`).

### What FIFI-03 did

- Rewrote the entire active corpus to the locked Tier 1 model (monthly-only locks on
  the full monthly rate, Average = payout basis, withdrawal 1% fee + 4 installments,
  Legacy-labeled history; the retired "optional weekly payouts / 1%-off-yield" wording
  is fully removed from active knowledge).
- Restructured into Canonical (product-docs, app-guide, glossary, faq,
  troubleshooting) / Supporting (research-referenced only) / Generated (`villas/`) /
  Superseded (excluded from ingestion) layers with FIFI-02 schema front matter on
  every active document.
- Added English + Persian sibling records across product-docs, app-guide, glossary
  (30 terms), faq (14 topics), troubleshooting (6 topics), club/referral/card.
- Added the deterministic ingestion manifest (`knowledge-base/ingestion/MANIFEST.md`) —
  the manifest, not a wildcard, governs what is ingested.
- Removed the superseded `preamble/preamble.md` from the tree.

### Still frozen: answer/retrieval slices

- Earnings and Portfolio pages remain mid-redesign; estate-tab docs must be
  re-verified after the Phase 9 refactor lands (FIFI-01 §5).
- The $10k+ purchase-benefits feature is still undesigned — no KB claims exist for it.
- Do not build retrieval/LLM/DecisionEngine until the scheduled slices.

### What is already done and ready
- 24 villa documents cleaned and generated in `knowledge-base/villas/`
- Global preamble with strict rules (`preamble/00-global-rules-and-provenance.md`, rewritten FIFI-03 to the locked model)
- Product documentation rewritten to the current locked business narrative (FIFI-03):
  - FractionalLuxe as branch of Rental Escapes
  - Monthly profit per locked share on the full monthly rate; new locks monthly-only; Legacy history labeled
  - Withdrawal 1% fee + 4 weekly installments (neutral wording; NOT the legacy weekly adjustment)
  - Primary Offering ($100 base) vs Secondary Market
  - 7% primary buyback
  - Lock-to-earn model
  - Platform commissions (pointer to `PRODUCT-PLAN.md` §0.5, never quoted)
- App Guide rewritten to the implementation (route `/property/[id]`, five tabs) in `knowledge-base/app-guide/`
- Glossary (30 terms), FAQ (14 topics), Troubleshooting (6 topics), Club/Referral/Card scope docs — all en + fa siblings
- Ingestion manifest (`knowledge-base/ingestion/MANIFEST.md`) — explicit include/exclude
- System Prompt updated (locked model + brand rule); finalized after UI stabilizes

### Remaining gates (knowledge reconciliation done in FIFI-03)
1. Re-verify estate-tab docs after the Phase 9 refactor lands (FIFI-01 §5)
2. Finish redesign of Earnings and Portfolio pages → update affected KB docs
3. Design and implement the $10k+ purchase benefits feature → author KB docs only from approved sources
4. Finalize System Prompt
5. Set up Flowise + Hybrid RAG retrieval per `knowledge-base/ingestion/MANIFEST.md`
6. Embed the chatbot in the app

Do not continue RAG implementation until the above product work is stable.

## Structure

```
rag/
├── knowledge-base/
│   ├── villas/        # GENERATED: one clean Markdown document per villa (24)
│   ├── product-docs/  # Canonical product/business/economics/club/referral/card docs (en + .fa.md siblings)
│   ├── app-guide/     # App usage guides vs implementation (en + .fa.md siblings)
│   ├── glossary/      # 30 canonical terms (en + .fa.md siblings)
│   ├── faq/           # 14 foundational topics (en + .fa.md siblings)
│   ├── troubleshooting/ # 6 verified topics (en + .fa.md siblings)
│   ├── preamble/      # Global rules + provenance explanation, retrieved with every query
│   └── ingestion/     # MANIFEST.md (governing include/exclude) + Flowise staging notes
├── prompts/
│   └── system-prompt.md   # Master copy of the assistant's system prompt
├── scripts/
│   └── prepare-villa-docs.ts  # Converts ESTATE-24-DATA.json → villas/*.md
└── README-RAG.md
```

## Ground rules

- **Single source of truth for villa facts:** `docs/product/rebuild/ESTATE-24-DATA.json`.
  Never hand-edit generated villa files or invent facts in curated docs — change the data,
  re-run the script.
- **Provenance survives everything.** Every economic figure in a villa document is labeled
  `APPROVED`, `RESEARCH`, or `QUARANTINED (CONFLICTED)`. Unknown values render as
  `Unknown — not established in current data`; they are never guessed, averaged, or filled.
- **Property IDs are contracts.** Filenames and metadata use the canonical
  `re-<listingId>` ids shared with the marketing site. Never rename or invent ids.
- **Income model (locked):** profit per share, paid monthly; shares must be locked to
  earn (average scenario is the payout basis). All chatbot copy must match.
- **Content boundary:** this folder never contains payment/settlement/TON logic, secrets,
  or personal data. Products copy lives in `docs/` and `messages/`; only what the chatbot
  needs to *answer* is mirrored here.

## Rebuilding the villa documents

From the repo root:

```bash
node --experimental-strip-types rag/scripts/prepare-villa-docs.ts
```

Output is deterministic; re-running on unchanged data is a no-op.
