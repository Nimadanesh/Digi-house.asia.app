// File responsibility: Financial Model V1 type layer — the additive projected-economics
// model approved in the Financial Model V1 PM decisions (2026-09-09).
//
// ADDITIVE ONLY: this file introduces a NEW model. It does not modify, re-export, or
// depend on the legacy Slice A economic model (`src/types/estate.ts`,
// `src/lib/economics/estate-economics.ts`) or any settlement/TON logic. Legacy rates
// (17% / 10% / 18% / 12.5% costs, 40/60 allocation) must never appear here.
//
// Locked decisions encoded here:
// - Commercial costs: agency 5%, operator 7.5%, reserve 1.5% of property value.
// - Profit allocation: owner 75% / operator 25%.
// - Scenarios: 220 / 273 / 328 nights on the canonical ANR (never ADR).
// - Share price: $100 nominal → total shares = valuation ÷ 100.
// - No silent EUR→USD conversion. No invented FX, occupancy, ADR, or tax rates.
// - UNKNOWN stays UNKNOWN. Guest-paid charges never reduce modeled profit.
// - Per-share figures are PROJECTED (never guaranteed return / ROI / yield).
//
// Money convention: integer minor units (cents) internally, per repository convention.

/** Rental-currency of a V1 property model. EUR properties are calculated in EUR. */
export type FinancialModelV1Currency = "USD" | "EUR";

/** Canonical ANR scope, preserved verbatim from the approved dataset. */
export type FinancialModelV1AnrScope = "FULL_TABLE" | "HOLIDAY_ONLY" | "MODEL_INPUT";

/**
 * Canonical ANR provenance. OBSERVED_DERIVED = arithmetic mean of distinct observed
 * full-buyout nightlies (never ADR). PM_APPROVED_MODEL_INPUT = explicit product input
 * (never presented as an observed average).
 */
export type FinancialModelV1AnrProvenance = "OBSERVED_DERIVED" | "PM_APPROVED_MODEL_INPUT";

/**
 * Canonical Average Nightly Rate input for one property. Deliberately named ANR —
 * never ADR. The value is the currently approved canonical ANR for the property.
 */
export interface FinancialModelV1Anr {
  /** ANR in MAJOR units as approved (may be fractional, e.g. 97230.25). */
  valueMajor: number;
  currency: FinancialModelV1Currency;
  scope: FinancialModelV1AnrScope;
  provenance: FinancialModelV1AnrProvenance;
  /** Verbatim derivation method from the approved dataset (never ADR). */
  method: string;
  source: string;
}

/**
 * The ONE active valuation per property, in integer minor units (cents).
 * Grand 2 BDM Ocean Pool Villa = $8,000,000 exactly (800_000_000 cents).
 * The legacy $82M figure must never appear as a V1 valuation.
 */
export interface FinancialModelV1Valuation {
  valueCents: number;
  /** Valuations are USD-denominated for all 24 properties in V1. */
  currency: "USD";
  provenance: "ESTIMATED";
  source: string;
}

/**
 * V1 data-classification categories. Only B (villa operating — none approved in V1),
 * D (agency/platform), E (operator), F (reserve), and C (owner-side tax) may reduce
 * modeled profit, and only the explicitly approved lines within them. Category A
 * (guest-paid charges) is informational and NEVER deducted.
 */
export type FinancialModelV1CostClassification =
  | "A_GUEST_PAID"
  | "B_VILLA_OPERATING"
  | "C_OWNER_SIDE_TAX"
  | "D_AGENCY_PLATFORM"
  | "E_OPERATOR"
  | "F_RESERVE";

/**
 * Owner-side tax treatment for one property. Either an approved product-model
 * assumption (rate applied to pre-tax profit, possibly 0) or explicitly UNKNOWN.
 * These are PRODUCT MODEL ASSUMPTIONS, not tax/legal advice.
 */
export type FinancialModelV1OwnerTax =
  | {
      kind: "rate";
      /** Fraction applied to PRE-TAX profit (e.g. 0.10 = ~10% Maldives withholding). */
      rate: number;
      basis: "PRE_TAX_PROFIT";
      status: "ASSUMPTION";
      jurisdiction: string;
      note: string;
    }
  | {
      kind: "unknown";
      jurisdiction: string;
      /** Why the owner-side tax cannot be modeled (e.g. federal treatment unknown). */
      reason: string;
    };

/**
 * A guest-paid / listing-observed charge carried for disclosure only. It is NEVER
 * deducted from villa rental income in V1. Source terminology is preserved verbatim.
 */
export interface FinancialModelV1ExcludedCharge {
  /** Exact name from the source (never merged/renamed). */
  name: string;
  detail: string;
  classification: "A_GUEST_PAID";
  /** Always false in V1: excluded charges never reduce modeled profit. */
  deducted: false;
}

/** Scenario keys: the three locked model scenarios plus their mean. */
export type FinancialModelV1ScenarioKey = "conservative" | "base" | "optimistic";

/**
 * One evaluated V1 scenario. Amounts are integer minor units in `currency`, EXCEPT
 * `reserveCents` which is denominated in `reserveCurrency` (the valuation currency).
 * When the reserve currency differs from the rental currency, no approved FX exists,
 * so `subtractable` is false and every downstream figure is UNKNOWN (null) with
 * `unknownReason` set — rather than silently converting currencies.
 */
export interface FinancialModelV1ScenarioResult {
  key: FinancialModelV1ScenarioKey | "average";
  /** Scenario nights (220 / 273 / 328). The average uses mean gross, not a night count. */
  nights: number | null;
  currency: FinancialModelV1Currency;
  /** ANR × scenario nights (integer cents). */
  grossCents: number;
  /** 5% of gross (D — agency/platform). Integer cents, half-up. */
  agencyCents: number;
  /** 7.5% of gross (E — operator). Integer cents, half-up. */
  operatorCents: number;
  /** 1.5% of property value, in `reserveCurrency` (F — reserve, modeled allocation). */
  reserveCents: number;
  reserveCurrency: "USD";
  /** False when reserveCurrency !== currency (no approved FX → cannot subtract). */
  reserveSubtractable: boolean;
  /** Gross − agency − operator − reserve. Null when reserve is not subtractable. */
  preTaxCents: number | null;
  /** Owner-side tax on pre-tax profit. Null when pre-tax or the tax is unknown. */
  ownerTaxCents: number | null;
  /** Net = pre-tax − owner tax. Null when either side is unknown. */
  netCents: number | null;
  /** 75% of net (rounded half-up). Null when net is unknown. */
  ownerProfitCents: number | null;
  /** Net − owner profit (remainder, so allocation always reconciles). */
  operatorProfitCents: number | null;
  /** Set whenever any downstream figure is unknown (mixed currency / unknown tax). */
  unknownReason: string | null;
}

/** Full V1 model for one property: three scenarios + the average + per-share. */
export interface FinancialModelV1PropertyModel {
  propertyId: string;
  rentalEscapesListingId: string;
  name: string;
  currency: FinancialModelV1Currency;
  anr: FinancialModelV1Anr;
  valuation: FinancialModelV1Valuation;
  ownerTax: FinancialModelV1OwnerTax;
  /** Valuation ÷ $100. Unitless share count (no FX involved). */
  totalShares: number;
  conservative: FinancialModelV1ScenarioResult;
  base: FinancialModelV1ScenarioResult;
  optimistic: FinancialModelV1ScenarioResult;
  average: FinancialModelV1ScenarioResult;
  perShare: FinancialModelV1PerShare;
  /** Guest-paid / listing charges disclosed but never deducted. */
  excludedCharges: readonly FinancialModelV1ExcludedCharge[];
}

/**
 * Per-share economics from the AVERAGE owner profit. PROJECTED figures only —
 * never guaranteed return, ROI, yield, profit guarantee, or expected return.
 * Monthly is a smoothed annualized presentation (annual ÷ 12).
 */
export interface FinancialModelV1PerShare {
  currency: FinancialModelV1Currency;
  /** Owner average profit ÷ total shares. Null when the average is unknown. */
  annualCents: number | null;
  /** Annual ÷ 12 (smoothed presentation). Null when annual is unknown. */
  monthlyCents: number | null;
  /** Set when per-share cannot be computed (unknown average). */
  unknownReason: string | null;
  projectionLabel: "Projected";
}

/** Complete input for evaluating one property under V1. */
export interface FinancialModelV1PropertyInput {
  propertyId: string;
  rentalEscapesListingId: string;
  name: string;
  anr: FinancialModelV1Anr;
  valuation: FinancialModelV1Valuation;
  ownerTax: FinancialModelV1OwnerTax;
  excludedCharges: readonly FinancialModelV1ExcludedCharge[];
}
