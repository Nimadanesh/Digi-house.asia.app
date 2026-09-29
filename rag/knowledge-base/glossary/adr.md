---
docId: fifi.glossary.glossary.adr.v1
docType: glossary
domain: glossary
title: "ADR"
locale: en
source: rag/knowledge-base/preamble/00-global-rules-and-provenance.md §5
sourceTier: 1
status: ACTIVE
defaultProvenance: UNKNOWN
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
entities:
  - {kind: glossary-term, id: adr}
related:
  - fifi.glossary.glossary.anr.v1
  - fifi.glossary.glossary.occupancy.v1
---

# ADR (Average Daily Rate)

**FractionalLuxe meaning:** revenue ÷ nights actually sold — an occupancy-driven
metric. The current dataset has **no occupancy data**, so **no ADR can exist in
answers** (always Unknown). Never label ANR as ADR; never derive an
occupancy-implied nightly rate from ANR.

**Related:** ANR, Occupancy.
