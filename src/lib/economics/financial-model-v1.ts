// File responsibility: Financial Model V1 calculation engine — the ONE canonical
// implementation of the locked V1 formulas. Pure, deterministic, UI-independent.
//
// Locked model (per scenario):
//   Gross = ANR × scenario nights
//   Pre-Tax = Gross − Agency 5% − Operator 7.5% − Reserve 1.5% of property value
//   Net = Pre-Tax − Owner-Side Tax
//   Owner = 75% of Net · Operator = Net − Owner (remainder, always reconciles)
// Average model: mean gross → same chain evaluated once at the averaged gross.
// Per-share: owner-average ÷ total shares; monthly = annual ÷ 12 (smoothed).
//
// ADDITIVE ONLY: no legacy economics, settlement, TON, or UI code is touched or
// imported. Retired rates (17%/10%/18%/12.5%, 40/60) appear nowhere here.
//
// Rounding policy (documented, deterministic): integer minor units throughout.
// Each percentage line is rounded ONCE with half-up (Math.round — all V1 amounts
// are non-negative). Net subtracts the ROUNDED lines so published lines reconcile
// exactly. The gross average is the half-up-rounded mean of the three scenario
// grosses. Monthly per-share is the half-up-rounded annual ÷ 12.

import type {
  FinancialModelV1Currency,
  FinancialModelV1PropertyInput,
  FinancialModelV1PropertyModel,
  FinancialModelV1ScenarioKey,
  FinancialModelV1ScenarioResult,
} from "@/types/financial-model-v1";

/** Nominal share price divisor: total shares = property value ÷ $100. */
export const V1_SHARE_PRICE_DIVISOR = 100;

/** Locked V1 commercial rates. These REPLACE all previous cost rates. */
export const V1_RATES = {
  /** 5% of gross — agency / rental escapes / OTA (replaces 18%). */
  agency: 0.05,
  /** 7.5% of gross — operator operating cost (replaces 12.5%). */
  operator: 0.075,
  /** 1.5% of current estimated property value — modeled reserve allocation. */
  reserve: 0.015,
} as const;

/** Locked V1 profit allocation. Retires all previous 40/60 allocations. */
export const V1_ALLOCATION = {
  /** 75% of net profit — owner side. */
  owner: 0.75,
} as const;

/** Locked V1 model scenarios: conservative / base / optimistic nights. */
export const V1_SCENARIO_NIGHTS: Record<FinancialModelV1ScenarioKey, number> = {
  conservative: 220,
  base: 273,
  optimistic: 328,
} as const;

/**
 * Product-model-assumption disclaimer. Every V1 tax figure is a product modeling
 * input — never tax or legal advice, never a statement of realized cost.
 */
export const V1_TAX_DISCLAIMER =
  "Owner-side tax figures are FractionalLuxe product model assumptions, not tax or legal advice.";

/**
 * Projection disclaimer. V1 per-share figures are PROJECTED — never a guaranteed
 * return, ROI, yield, profit guarantee, or expected return. Monthly is Annual ÷ 12.
 */
export const V1_PROJECTION_DISCLAIMER =
  "Projected figures only: not a guaranteed return, ROI, yield, profit guarantee, or expected return. Monthly is a smoothed annualized presentation (Annual ÷ 12).";

/**
 * Reserve methodology note. The reserve is a modeled reserve allocation (1.5% of
 * the current estimated property value), not a confirmed realized expense.
 */
export const V1_RESERVE_NOTE =
  "Reserve is a modeled reserve allocation (1.5% of current estimated property value), not a confirmed realized expense.";

/** Half-up rounding to integer minor units (all V1 amounts are non-negative). */
function roundCents(x: number): number {
  return Math.round(x);
}

/** ANR major units → integer minor units (half-up, once, at the input boundary). */
export function v1AnrToCents(valueMajor: number): number {
  return roundCents(valueMajor * 100);
}

/** Total shares = property value ÷ $100 (valuation is integer cents). */
export function v1TotalShares(valuationCents: number): number {
  return valuationCents / (V1_SHARE_PRICE_DIVISOR * 100);
}

interface V1ChainInput {
  grossCents: number;
  currency: FinancialModelV1Currency;
  valuationCents: number;
  ownerTax: FinancialModelV1PropertyInput["ownerTax"];
}

/**
 * The single V1 profit chain, evaluated at one gross figure. Shared by the three
 * scenarios and the average (which evaluates the same chain at the averaged gross),
 * so every column is produced by identical arithmetic.
 */
function v1ProfitChain(
  key: FinancialModelV1ScenarioResult["key"],
  nights: number | null,
  chain: V1ChainInput,
): FinancialModelV1ScenarioResult {
  const { grossCents, currency, valuationCents, ownerTax } = chain;
  const agencyCents = roundCents(grossCents * V1_RATES.agency);
  const operatorCents = roundCents(grossCents * V1_RATES.operator);
  const reserveCents = roundCents(valuationCents * V1_RATES.reserve);
  // No approved FX exists: a USD-denominated reserve can never be subtracted from
  // a non-USD gross. The downstream chain stays UNKNOWN rather than converting.
  const reserveSubtractable = currency === "USD";

  if (!reserveSubtractable) {
    return {
      key,
      nights,
      currency,
      grossCents,
      agencyCents,
      operatorCents,
      reserveCents,
      reserveCurrency: "USD",
      reserveSubtractable: false,
      preTaxCents: null,
      ownerTaxCents: null,
      netCents: null,
      ownerProfitCents: null,
      operatorProfitCents: null,
      unknownReason:
        "Pre-tax profit is UNKNOWN: the 1.5% reserve is denominated in USD while rental income is in " +
        `${currency}, and no approved FX rate exists. Gross, agency, and operator figures remain as stated.`,
    };
  }

  const preTaxCents = grossCents - agencyCents - operatorCents - reserveCents;

  if (ownerTax.kind === "unknown") {
    return {
      key,
      nights,
      currency,
      grossCents,
      agencyCents,
      operatorCents,
      reserveCents,
      reserveCurrency: "USD",
      reserveSubtractable: true,
      preTaxCents,
      ownerTaxCents: null,
      netCents: null,
      ownerProfitCents: null,
      operatorProfitCents: null,
      unknownReason:
        `Net profit is UNKNOWN: owner-side tax is UNKNOWN (${ownerTax.jurisdiction} — ${ownerTax.reason}). ` +
        "Pre-tax profit remains as stated.",
    };
  }

  const ownerTaxCents = roundCents(preTaxCents * ownerTax.rate);
  const netCents = preTaxCents - ownerTaxCents;
  // Owner rounds half-up; operator takes the remainder so owner + operator = net exactly.
  const ownerProfitCents = roundCents(netCents * V1_ALLOCATION.owner);
  const operatorProfitCents = netCents - ownerProfitCents;

  return {
    key,
    nights,
    currency,
    grossCents,
    agencyCents,
    operatorCents,
    reserveCents,
    reserveCurrency: "USD",
    reserveSubtractable: true,
    preTaxCents,
    ownerTaxCents,
    netCents,
    ownerProfitCents,
    operatorProfitCents,
    unknownReason: null,
  };
}

/**
 * Evaluate one V1 scenario: Gross = ANR × scenario nights, then the profit chain.
 * These are MODEL SCENARIOS, not observed occupancy.
 */
export function computeV1Scenario(
  input: FinancialModelV1PropertyInput,
  key: FinancialModelV1ScenarioKey,
): FinancialModelV1ScenarioResult {
  const anrCents = v1AnrToCents(input.anr.valueMajor);
  const nights = V1_SCENARIO_NIGHTS[key];
  const grossCents = anrCents * nights;
  return v1ProfitChain(key, nights, {
    grossCents,
    currency: input.anr.currency,
    valuationCents: input.valuation.valueCents,
    ownerTax: input.ownerTax,
  });
}

/**
 * Evaluate the V1 average model: mean of the three scenario grosses (rounded once,
 * half-up), then the identical profit chain at that averaged gross.
 */
export function computeV1Average(
  input: FinancialModelV1PropertyInput,
  scenarios: Record<FinancialModelV1ScenarioKey, FinancialModelV1ScenarioResult>,
): FinancialModelV1ScenarioResult {
  const grossCents = roundCents(
    (scenarios.conservative.grossCents + scenarios.base.grossCents + scenarios.optimistic.grossCents) / 3,
  );
  return v1ProfitChain("average", null, {
    grossCents,
    currency: input.anr.currency,
    valuationCents: input.valuation.valueCents,
    ownerTax: input.ownerTax,
  });
}

/**
 * THE one canonical V1 entry point per property. Produces scenarios + average +
 * per-share economics. Guest-paid charges travel on the input for disclosure and
 * are never consulted by the arithmetic.
 */
export function computeFinancialModelV1(input: FinancialModelV1PropertyInput): FinancialModelV1PropertyModel {
  const conservative = computeV1Scenario(input, "conservative");
  const base = computeV1Scenario(input, "base");
  const optimistic = computeV1Scenario(input, "optimistic");
  const average = computeV1Average(input, { conservative, base, optimistic });
  const totalShares = v1TotalShares(input.valuation.valueCents);

  // Per-share output boundary: annual rounds half-up to integer cents; monthly is
  // the smoothed presentation of that ROUNDED annual (÷ 12, rounded half-up).
  const annualCents =
    average.ownerProfitCents == null ? null : roundCents(average.ownerProfitCents / totalShares);

  const perShare =
    average.ownerProfitCents == null || annualCents == null
      ? {
          currency: input.anr.currency,
          annualCents: null,
          monthlyCents: null,
          unknownReason:
            "Per-share economics are UNKNOWN because the average owner profit is UNKNOWN" +
            `${average.unknownReason ? `: ${average.unknownReason}` : "."}`,
          projectionLabel: "Projected" as const,
        }
      : {
          currency: input.anr.currency,
          annualCents,
          // Smoothed annualized presentation: Annual ÷ 12 (rounded once, half-up).
          monthlyCents: roundCents(annualCents / 12),
          unknownReason: null,
          projectionLabel: "Projected" as const,
        };

  return {
    propertyId: input.propertyId,
    rentalEscapesListingId: input.rentalEscapesListingId,
    name: input.name,
    currency: input.anr.currency,
    anr: input.anr,
    valuation: input.valuation,
    ownerTax: input.ownerTax,
    totalShares,
    conservative,
    base,
    optimistic,
    average,
    perShare,
    excludedCharges: input.excludedCharges,
  };
}
