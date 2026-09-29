---
docId: fifi.product.answer-quality.audit.v1
docType: audit
domain: product
title: "Fifi Answer Quality Audit v1"
locale: en
sourceTier: 1
status: ACTIVE
defaultProvenance: DERIVED
effectiveDate: 2026-09-30
lastVerified: 2026-09-30
retrievalEligibility: eligible
answerAuthority: authoritative
---

# Fifi Answer Quality Audit v1

## Completed

- Reworked core FAQ answers around direct, human explanations.
- Reworked the five core product documents and the Club, Referral, and Card overviews.
- Reworked the Estate app guide to the current five-tab structure.
- Expanded the UI element catalog with visible elements across Home, Marketplace, Estate, Portfolio, Earnings, and common sheets/overlays.
- Expanded Persian UI knowledge alongside the English catalog.
- Added few-shot response examples covering product, UI, financial terminology, current-data, ambiguity, and safety cases.
- Connected the few-shot examples from the Fifi system prompt.
- Preserved internal metadata fields while removing internal retrieval/authority language from user-facing explanations.

## Product-answer standard

A good answer should:

1. answer first;
2. explain what the thing is;
3. explain why it appears or what it does;
4. give a useful example when appropriate;
5. distinguish general meaning from current personal data;
6. provide the nearest useful next step;
7. never invent undocumented facts.

## UI coverage target

The app guide is intentionally moving beyond major features. It should describe small visible elements as well, including labels and metrics, buttons and CTAs, chips and filters, sorting controls, chevrons and navigation cues, progress indicators, cards and summaries, tabs, sheets and confirmations, empty/loading/error states, order-book and trade elements, lock/sell/buy controls, wallet chooser, and Club/Referral presentation elements.

When a new visible product element is added, the Knowledge Foundation should be updated in the same development cycle or before Fifi is expected to explain it.

## Verification pass — 2026-09-30

The answer-quality review found and corrected several cases of internal assistant language leaking into retrievable human-facing knowledge:

- removed direct "Fifi should..." wording from core product explanations;
- removed internal/live-data wording from transaction and troubleshooting explanations;
- removed assistant/meta wording from Club and Referral product explanations;
- aligned Persian product documents with the human-facing standard;
- corrected the ANR/ADR few-shot example so ANR is described as Average Nightly Rate;
- simplified conflict and estimated-value explanations so they describe the user-facing meaning rather than the knowledge machinery.

The architecture/contract documents remain intentionally technical. They are not part of the human-facing answer corpus.

## Remaining verification work

This audit does not claim that every rendered pixel or every transient UI state has been exhaustively catalogued. Before the first real Fifi model integration, the implementation should be re-inspected for:

- newly added UI elements not represented in the UI catalog;
- copy that differs from the knowledge wording;
- hidden or conditional controls;
- mobile-only or desktop-only elements;
- empty, loading, error, and confirmation states;
- EN/FA semantic parity;
- raw localization keys or legacy brand names;
- current routes and navigation action IDs.

## Data boundary

Static knowledge explains meaning. Current or personal values must come from the live product layer. Current price, availability, Portfolio holdings, Earnings, transaction state, withdrawal state, membership state, and referral state must not be invented from static documents.

## Infrastructure status

Knowledge and deterministic decision/retrieval/answer layers do not by themselves require a server, Laya deployment, external API credential, or paid model. Those requirements should be revisited when real model/live integrations begin.

## Gate

Do not merge this branch into main until the remaining implementation inspection, EN/FA parity checks, ingestion rebuild, deterministic evaluation, and final UI/answer-quality QA pass.
