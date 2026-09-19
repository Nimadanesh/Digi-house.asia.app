// File responsibility: Financial Model V1 canonical inputs for the FROZEN 24-property
// portfolio. ADDITIVE ONLY — this file adds, removes, renames, merges, splits, or
// regenerates NOTHING: every property fact (identity, ANR, valuation, currency,
// listing charges) is derived verbatim from the frozen sources at module load:
//
//   - `docs/product/rebuild/ESTATE-24-DATA.json` (authoritative dataset: ANR, valuation,
//     currencies, listing taxes/fees, jurisdictions)
//   - `CANONICAL_RECONCILIATION` (runtime propertyId ←→ Rental Escapes Listing ID)
//
// The ONLY hand-authored layer is the locked V1 owner-side tax table (PM decision
// §7: TCI 0%, BVI 0%, Maldives ~10% withholding — EXTENDED by the locked PO
// decision 2026-09-13 "D11 owner-side tax": St. Barthélemy 0% (local-resident
// basis; home-country tax not modeled), Nevada 0% state (federal not modeled),
// California state-top 13.3% (federal not separately modeled — combined often
// higher), plus jurisdiction midpoint assumptions: Sri Lanka 12% (10–14), DR 21%
// (15–27; CONOTUR may reduce), Jamaica 25%, Mexico 27.5% (20–35), Thailand 17.5%
// (0–35), Italy 23.5% (21–26 cedolare), France 32.5% (20–45+), Austria 27.5%
// (0–55). Every entry is status: ASSUMPTION; ranges are applied at their
// midpoint; seek-personal-advice language is mandatory. EUR ANR converts to USD
// via the approved fixed rate (APPROVED_EUR_USD_RATE, 1 EUR = 1.20 USD —
// Option 1 product decision) at the engine boundary. D9 secondary-market items were removed
// from this wave (locked) — nothing here touches them. Any dataset drift
// (missing ANR, missing valuation, unmapped listing, unexpected currency)
// throws loudly — V1 never guesses.
//
// Locked V1 facts re-stated for auditability:
// - Grand 2 BDM Ocean Pool Villa current estimated value = $8,000,000 (single number).
// - Reserve is a modeled allocation, not a realized expense. Valuations are
//   USD-denominated; EUR ANR inputs convert to USD via the approved fixed rate.

import type {
  FinancialModelV1Anr,
  FinancialModelV1Currency,
  FinancialModelV1ExcludedCharge,
  FinancialModelV1OwnerTax,
  FinancialModelV1PropertyInput,
  FinancialModelV1Valuation,
} from "@/types/financial-model-v1";
import { computeFinancialModelV1 } from "../financial-model-v1";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import { ESTATE_24_DATA } from "./estate-24-data";
import { CANONICAL_RECONCILIATION } from "./canonical-24";
import type { Estate24Record } from "@/types/estate-24-data";

/** Listing IDs whose jurisdiction carries an APPROVED owner-side tax model input. */
const OWNER_TAX_BY_LISTING_ID: Readonly<Record<string, FinancialModelV1OwnerTax>> = {
  // Maldives — ~10% non-resident withholding assumption on PRE-TAX profit.
  "128862": {
    kind: "rate",
    rate: 0.1,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Maldives",
    note: "~10% non-resident withholding assumption applied to pre-tax profit. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  // British Virgin Islands — 0% personal/corporate income-tax assumption.
  // Property tax is a separate layer and remains UNKNOWN (not modeled here).
  "126855": {
    kind: "rate",
    rate: 0,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "British Virgin Islands",
    note: "0% personal/corporate income-tax assumption. Property tax is separate and UNKNOWN. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  "130393": {
    kind: "rate",
    rate: 0,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "British Virgin Islands",
    note: "0% personal/corporate income-tax assumption. Property tax is separate and UNKNOWN. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  // Turks and Caicos — 0% rental-income-tax assumption.
  "125643": {
    kind: "rate",
    rate: 0,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Turks and Caicos",
    note: "0% rental-income-tax assumption. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  "122903": {
    kind: "rate",
    rate: 0,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Turks and Caicos",
    note: "0% rental-income-tax assumption. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  "126870": {
    kind: "rate",
    rate: 0,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Turks and Caicos",
    note: "0% rental-income-tax assumption. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  "130397": {
    kind: "rate",
    rate: 0,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Turks and Caicos",
    note: "0% rental-income-tax assumption. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  "127483": {
    kind: "rate",
    rate: 0,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Turks and Caicos",
    note: "0% rental-income-tax assumption. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  "122113": {
    kind: "rate",
    rate: 0,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Turks and Caicos",
    note: "0% rental-income-tax assumption. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  // Saint Barthélemy — D11 locked (2026-09-13): 0% local income-tax assumption
  // (resident basis). Non-resident owners are taxed in their home country —
  // home-country tax is NOT modeled here.
  "131293": {
    kind: "rate",
    rate: 0,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Saint Barthélemy",
    note: "0% local income-tax assumption (resident basis); non-resident owners are taxed in their home country — home-country tax not modeled. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  "127825": {
    kind: "rate",
    rate: 0,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Saint Barthélemy",
    note: "0% local income-tax assumption (resident basis); non-resident owners are taxed in their home country — home-country tax not modeled. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  // USA / Nevada — D11 locked: 0% state income-tax assumption; federal tax
  // still applies and is NOT modeled (parallel to the pre-D11 state-layer rule).
  "128529": {
    kind: "rate",
    rate: 0,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "USA / Nevada",
    note: "0% state income-tax assumption (Nevada); federal tax still applies and is not modeled. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  // USA / California — D11 locked: state top marginal up to 13.3% applied;
  // federal is not separately modeled — combined effective is often higher.
  "129549": {
    kind: "rate",
    rate: 0.133,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "USA / California",
    note: "State top marginal rate up to 13.3% applied; federal tax still applies and is not separately modeled — combined effective is often higher. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  // ── D11 midpoint assumptions (ranges applied at midpoint, per locked rule) ──
  // Italy — 21–26% band (cedolare secca regime). EUR ANR converts via the
  // approved fixed rate (1 EUR = 1.20 USD — Option 1 product decision).
  "108924": {
    kind: "rate",
    rate: 0.235,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Italy",
    note: "21–26% band on net rental income (cedolare secca regime); midpoint applied. EUR ANR converts via the approved fixed rate (1 EUR = 1.20 USD). Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  "109098": {
    kind: "rate",
    rate: 0.235,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Italy",
    note: "21–26% band on net rental income (cedolare secca regime); midpoint applied. EUR ANR converts via the approved fixed rate (1 EUR = 1.20 USD). Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  // France — 20–45%+ progressive band (after abatement).
  "123861": {
    kind: "rate",
    rate: 0.325,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "France",
    note: "20–45%+ progressive band (after abatement); midpoint applied. EUR ANR converts via the approved fixed rate (1 EUR = 1.20 USD). Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  "123919": {
    kind: "rate",
    rate: 0.325,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "France",
    note: "20–45%+ progressive band (after abatement); midpoint applied. EUR ANR converts via the approved fixed rate (1 EUR = 1.20 USD). Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  // Austria — 0–55% progressive band.
  "130901": {
    kind: "rate",
    rate: 0.275,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Austria",
    note: "0–55% progressive band; midpoint applied. EUR ANR converts via the approved fixed rate (1 EUR = 1.20 USD). Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  // Dominican Republic — 15–27% band; CONOTUR exemption may reduce to 0%.
  "122422": {
    kind: "rate",
    rate: 0.21,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Dominican Republic",
    note: "15–27% band on net rental income; midpoint applied. CONOTUR exemption may reduce the effective rate to 0%. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  // Jamaica — ~25% non-resident assumption.
  "106441": {
    kind: "rate",
    rate: 0.25,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Jamaica",
    note: "~25% non-resident assumption on net rental income. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  // Mexico — 20–35% band (ISR + IVA effects).
  "123320": {
    kind: "rate",
    rate: 0.275,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Mexico",
    note: "20–35% band on net rental income (ISR + IVA effects); midpoint applied. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  "129548": {
    kind: "rate",
    rate: 0.275,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Mexico",
    note: "20–35% band on net rental income (ISR + IVA effects); midpoint applied. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  // Thailand — 0–35% progressive band (effective usually higher).
  "108856": {
    kind: "rate",
    rate: 0.175,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Thailand",
    note: "0–35% progressive band; midpoint applied (effective is usually higher). Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
  // Sri Lanka — 10–14% band.
  "108860": {
    kind: "rate",
    rate: 0.12,
    basis: "PRE_TAX_PROFIT",
    status: "ASSUMPTION",
    jurisdiction: "Sri Lanka",
    note: "10–14% band on net rental income; midpoint applied. Product model assumption, not tax/legal advice. Seek personal tax advice.",
  },
};

function unknownOwnerTax(record: Estate24Record): FinancialModelV1OwnerTax {
  const { country, region } = record.location;
  const jurisdiction = region ? `${country} / ${region}` : country;
  return {
    kind: "unknown",
    jurisdiction,
    reason:
      "No approved property-specific owner-tax input exists and the jurisdiction treatment is UNKNOWN. " +
      "Product model assumption pending, not tax/legal advice.",
  };
}

function buildAnr(record: Estate24Record): FinancialModelV1Anr {
  const anr = record.rateTable.averageNightlyRate;
  if (!anr) {
    throw new Error(`[financial-model-v1] missing canonical ANR for listing ${record.listingId} — V1 never guesses ANR.`);
  }
  const currency = record.rateTable.currency;
  if (currency !== "USD" && currency !== "EUR") {
    throw new Error(`[financial-model-v1] unexpected ANR currency "${currency}" for listing ${record.listingId}.`);
  }
  const scope = anr.scope;
  if (scope !== "FULL_TABLE" && scope !== "HOLIDAY_ONLY" && scope !== "MODEL_INPUT") {
    throw new Error(`[financial-model-v1] unexpected ANR scope "${scope}" for listing ${record.listingId}.`);
  }
  return {
    // Canonical ANR value — preserved as approved, never renamed to ADR.
    valueMajor: anr.value,
    currency: currency as FinancialModelV1Currency,
    scope,
    provenance: anr.provenance,
    method: anr.method,
    source: `ESTATE-24-DATA rateTable.averageNightlyRate (listing ${record.listingId})`,
  };
}

function buildValuation(record: Estate24Record): FinancialModelV1Valuation {
  // The ONE active valuation number per property: the approved layer figure.
  const central = record.valuation.approved.central;
  if (central == null) {
    throw new Error(`[financial-model-v1] missing approved valuation for listing ${record.listingId} — V1 never guesses value.`);
  }
  return {
    valueCents: Math.round(central * 100),
    currency: "USD",
    provenance: "ESTIMATED",
    source: `ESTATE-24-DATA valuation.approved (listing ${record.listingId}; PM lowest-valid-value rule)`,
  };
}

/**
 * Listing-observed taxes/fees carried for DISCLOSURE ONLY. Every entry is marked
 * `deducted: false`: guest-paid charges (accommodation/tourist taxes, service
 * charges, deposits, waivers) must never reduce villa rental income in V1.
 * Source terminology is preserved verbatim; revenue treatment travels in `detail`.
 */
function buildExcludedCharges(record: Estate24Record): readonly FinancialModelV1ExcludedCharge[] {
  const out: FinancialModelV1ExcludedCharge[] = [];
  for (const tax of record.taxesListing.taxes) {
    const amount =
      tax.kind === "PERCENTAGE"
        ? `${tax.value}%`
        : `${tax.value}${tax.unit ? ` ${tax.unit}` : ""}${tax.currency ? ` ${tax.currency}` : ""}`;
    out.push({
      name: tax.name,
      detail: `${amount} — listing-observed tax${tax.status ? ` (${tax.status})` : ""}; revenue treatment: ${tax.revenueTreatment ?? "UNKNOWN"} — excluded from villa profit.`,
      classification: "A_GUEST_PAID",
      deducted: false,
    });
  }
  for (const fee of record.taxesListing.fees) {
    const flags = [
      fee.refundable ? "refundable" : null,
      fee.optional ? "optional" : null,
      fee.unit ? `per ${fee.unit}` : null,
    ]
      .filter(Boolean)
      .join(", ");
    out.push({
      name: fee.name,
      detail: `${fee.amount} ${fee.currency} flat${flags ? ` (${flags})` : ""}${fee.status ? ` — ${fee.status}` : ""}; revenue treatment: ${fee.revenueTreatment ?? "UNKNOWN"} — excluded from villa profit.`,
      classification: "A_GUEST_PAID",
      deducted: false,
    });
  }
  return out;
}

function buildInput(record: Estate24Record, propertyId: string): FinancialModelV1PropertyInput {
  return {
    propertyId,
    rentalEscapesListingId: record.listingId,
    name: record.name,
    anr: buildAnr(record),
    valuation: buildValuation(record),
    ownerTax: OWNER_TAX_BY_LISTING_ID[record.listingId] ?? unknownOwnerTax(record),
    excludedCharges: buildExcludedCharges(record),
  };
}

/** Runtime propertyId ←→ Listing ID join (no copied mapping — single source). */
const RUNTIME_BY_LISTING_ID: Readonly<Record<string, string>> = Object.fromEntries(
  CANONICAL_RECONCILIATION.map((r) => [r.rentalEscapesListingId, r.propertyId]),
);

/**
 * The 24 canonical V1 inputs, in dataset order. Building them validates the frozen
 * portfolio join: exactly 24 records, each mapped to exactly one runtime propertyId.
 */
function buildAllInputs(): readonly FinancialModelV1PropertyInput[] {
  if (ESTATE_24_DATA.length !== 24) {
    throw new Error(`[financial-model-v1] frozen portfolio violated: expected 24 records, found ${ESTATE_24_DATA.length}.`);
  }
  return ESTATE_24_DATA.map((record) => {
    const propertyId = RUNTIME_BY_LISTING_ID[record.listingId];
    if (!propertyId) {
      throw new Error(`[financial-model-v1] listing ${record.listingId} has no runtime propertyId — portfolio mapping incomplete.`);
    }
    return buildInput(record, propertyId);
  });
}

/** Canonical V1 inputs for all 24 frozen properties. */
export const FINANCIAL_MODEL_V1_INPUTS: readonly FinancialModelV1PropertyInput[] = buildAllInputs();

/** Lookup helper: V1 input by stable runtime propertyId. */
export function getFinancialModelV1Input(propertyId: string): FinancialModelV1PropertyInput | undefined {
  return FINANCIAL_MODEL_V1_INPUTS.find((i) => i.propertyId === propertyId);
}

/** Convenience: fully evaluated V1 model for one property. */
export function getFinancialModelV1(propertyId: string): FinancialModelV1PropertyModel | undefined {
  const input = getFinancialModelV1Input(propertyId);
  return input ? computeFinancialModelV1(input) : undefined;
}

/** Convenience: fully evaluated V1 models for all 24 properties. */
export function computeAllFinancialModelV1(): readonly FinancialModelV1PropertyModel[] {
  return FINANCIAL_MODEL_V1_INPUTS.map(computeFinancialModelV1);
}
