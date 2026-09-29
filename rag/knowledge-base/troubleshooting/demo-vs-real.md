---
docId: fifi.troubleshooting.troubleshooting.demo-vs-real.v1
docType: troubleshooting
domain: troubleshooting
title: "How to tell demo data from real product data"
locale: en
source: implementation audit FIFI-01
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
---

# Demo Data vs Real Data

## What does Demo mode mean?

The current build includes a **Demo mode** indicator so users can tell that parts of the experience are being demonstrated rather than treated as a live production transaction history.

Paid rows or price history that are explicitly marked **simulated** are demonstration data. They should not be treated as real historical payments or market history.

## What is still meaningful in demo mode?

Demo mode does not mean that every number on every screen is fake.

Property facts, configured calculations, and displayed product states remain tied to their configured sources unless the screen explicitly labels something as Demo or simulated.

## How do I check?

Look at the label next to the figure or activity.

- **Demo / simulated** → demonstration data.
- No such label → use the product's stated source and status; Fifi should explain any provenance or uncertainty that matters to the user.

If a figure looks inconsistent with its label, ask Fifi about that specific figure or report it through support.
