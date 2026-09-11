// Financial Model V1 validation gate.
//
// Covers the 18 REQUIRED VALIDATIONS from the V1 build order, plus exact-math
// spot checks (Grand 2 BDM full chain) and reconciliation identities for all 24
// properties. All expectations are derived from the LOCKED decisions:
//
// - 5% agency / 7.5% operator / 1.5% reserve / 75-25 allocation / $100 share price
// - 220 / 273 / 328 scenario nights on the canonical ANR (never ADR)
// - Grand = $8M exactly = 80,000 shares; no legacy $82M
// - Guest-paid charges excluded; owner-side tax separated; UNKNOWN stays UNKNOWN
// - EUR calculated in EUR with no silent USD FX (no invented FX rate)
//
// The tests prove behavior against the actual modules (not copied copies where
// linkage matters): inputs come from the frozen dataset join, math is recomputed
// here from independent literals, and legacy independence is asserted both
// functionally (Grand V1 shares 80,000 vs legacy fixture 2,500) and structurally
// (no legacy rate/allocation/fixture exports on the V1 modules).

import { describe, expect, it } from "vitest";

import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import {
  V1_ALLOCATION,
  V1_PROJECTION_DISCLAIMER,
  V1_RATES,
  V1_SCENARIO_NIGHTS,
  V1_SHARE_PRICE_DIVISOR,
  V1_TAX_DISCLAIMER,
  computeFinancialModelV1,
  v1AnrToCents,
  v1TotalShares,
} from "../financial-model-v1";
import {
  FINANCIAL_MODEL_V1_INPUTS,
  computeAllFinancialModelV1,
  getFinancialModelV1,
  getFinancialModelV1Input,
} from "../estates/financial-model-v1-inputs";
import { CANONICAL_MARKETPLACE_ESTATES, getCanonicalEstate } from "../estates/canonical-24";
import { ESTATE_24_DATA } from "../estates/estate-24-data";
import * as v1EngineModule from "../financial-model-v1";
import * as v1InputsModule from "../estates/financial-model-v1-inputs";

const GRAND_PROPERTY_ID = "prop-marina-vista-4b";
const GRAND_VALUE_CENTS = 800_000_000; // $8,000,000 — the SINGLE canonical value.
const LEGACY_82M_CENTS = 8_200_000_000; // Must never appear as a V1 valuation.
const LEGACY_GRAND_FIXTURE_SHARES = 2500; // Retired fixture count for Grand.

const ALL_MODELS: readonly FinancialModelV1PropertyModel[] = computeAllFinancialModelV1();
function grand(): FinancialModelV1PropertyModel {
  const model = getFinancialModelV1(GRAND_PROPERTY_ID);
  if (!model) throw new Error("Grand V1 model missing");
  return model;
}

/** Independent V1 math from literals (pins the locked rates, not the engine). */
function expectedChain(gross: number, valuationCents: number, taxRate: number | null) {
  const agency = Math.round(gross * 0.05);
  const operator = Math.round(gross * 0.075);
  const reserve = Math.round(valuationCents * 0.015);
  const preTax = gross - agency - operator - reserve;
  if (taxRate == null) return { agency, operator, reserve, preTax };
  const tax = Math.round(preTax * taxRate);
  const net = preTax - tax;
  const owner = Math.round(net * 0.75);
  return { agency, operator, reserve, preTax, tax, net, owner, operatorShare: net - owner };
}

describe("V1 validation 1: all 24 frozen properties", () => {
  it("produces exactly 24 V1 inputs and 24 V1 models", () => {
    expect(FINANCIAL_MODEL_V1_INPUTS).toHaveLength(24);
    expect(ALL_MODELS).toHaveLength(24);
  });

  it("preserves the frozen portfolio: same 24 runtime propertyIds, no add/remove/rename", () => {
    const canonicalIds = new Set(CANONICAL_MARKETPLACE_ESTATES.map((e) => e.propertyId));
    expect(canonicalIds.size).toBe(24);
    const inputIds = FINANCIAL_MODEL_V1_INPUTS.map((i) => i.propertyId);
    expect(new Set(inputIds).size).toBe(24);
    for (const id of inputIds) {
      expect(canonicalIds.has(id), `V1 must preserve frozen runtime id ${id}`).toBe(true);
    }
  });

  it("maps every dataset listing to exactly one runtime propertyId", () => {
    expect(ESTATE_24_DATA).toHaveLength(24);
    for (const record of ESTATE_24_DATA) {
      const input = FINANCIAL_MODEL_V1_INPUTS.find((i) => i.rentalEscapesListingId === record.listingId);
      expect(input, `listing ${record.listingId} must have exactly one V1 input`).toBeDefined();
      expect(input?.name).toBe(record.name);
    }
  });
});

describe("V1 validation 2: one active valuation per property", () => {
  it("every property carries exactly one positive integer valuation in cents", () => {
    for (const input of FINANCIAL_MODEL_V1_INPUTS) {
      expect(Number.isInteger(input.valuation.valueCents)).toBe(true);
      expect(input.valuation.valueCents).toBeGreaterThan(0);
      expect(input.valuation.currency).toBe("USD");
      expect(input.valuation.provenance).toBe("ESTIMATED");
    }
  });

  it("V1 valuations match the approved dataset figure and the canonical layer figure", () => {
    for (const record of ESTATE_24_DATA) {
      const input = getFinancialModelV1Input(RUNTIME_ID_OF(record.listingId));
      const expected = Math.round((record.valuation.approved.central ?? 0) * 100);
      expect(input?.valuation.valueCents).toBe(expected);
      const canonical = getCanonicalEstate(RUNTIME_ID_OF(record.listingId));
      expect(canonical?.fractionalLuxe.valuationUsd.value).toBe(input?.valuation.valueCents);
    }
  });
});

function RUNTIME_ID_OF(listingId: string): string {
  const input = FINANCIAL_MODEL_V1_INPUTS.find((i) => i.rentalEscapesListingId === listingId);
  if (!input) throw new Error(`no V1 input for listing ${listingId}`);
  return input.propertyId;
}

describe("V1 validations 3–5: Grand $8M, 80,000 shares, no $82M", () => {
  it("Grand current estimated value is exactly $8,000,000 (single number, no range)", () => {
    expect(grand().valuation.valueCents).toBe(GRAND_VALUE_CENTS);
    expect(grand().valuation.currency).toBe("USD");
  });

  it("Grand total shares are exactly 80,000 ($8M ÷ $100)", () => {
    expect(grand().totalShares).toBe(80_000);
  });

  it("legacy $82M appears in NO V1 valuation", () => {
    for (const model of ALL_MODELS) {
      expect(model.valuation.valueCents).not.toBe(LEGACY_82M_CENTS);
    }
  });
});

describe("V1 validation 6: $100 share price", () => {
  it("share divisor is $100 and every property uses valuation ÷ $100", () => {
    expect(V1_SHARE_PRICE_DIVISOR).toBe(100);
    for (const model of ALL_MODELS) {
      expect(model.totalShares).toBe(model.valuation.valueCents / (100 * 100));
      expect(model.totalShares).toBe(v1TotalShares(model.valuation.valueCents));
    }
  });
});

describe("V1 validations 7–9: 5% agency, 7.5% operator, 1.5% reserve", () => {
  it("locked rate constants are exactly 0.05 / 0.075 / 0.015", () => {
    expect(V1_RATES).toEqual({ agency: 0.05, operator: 0.075, reserve: 0.015 });
  });

  it("every scenario deducts exactly agency 5% + operator 7.5% + reserve 1.5%", () => {
    for (const model of ALL_MODELS) {
      for (const scenario of [model.conservative, model.base, model.optimistic, model.average]) {
        const expected = expectedChain(scenario.grossCents, model.valuation.valueCents, 0);
        expect(scenario.agencyCents).toBe(expected.agency);
        expect(scenario.operatorCents).toBe(expected.operator);
        expect(scenario.reserveCents).toBe(expected.reserve);
        expect(scenario.reserveCurrency).toBe("USD");
      }
    }
  });
});

describe("V1 validation 10: 75/25 allocation", () => {
  it("allocation constant is 75% owner and every known net splits owner + operator = net", () => {
    expect(V1_ALLOCATION).toEqual({ owner: 0.75 });
    for (const model of ALL_MODELS) {
      for (const scenario of [model.conservative, model.base, model.optimistic, model.average]) {
        if (scenario.netCents == null) {
          expect(scenario.ownerProfitCents).toBeNull();
          expect(scenario.operatorProfitCents).toBeNull();
          continue;
        }
        expect(scenario.ownerProfitCents).toBe(Math.round(scenario.netCents * 0.75));
        expect(scenario.operatorProfitCents).toBe(scenario.netCents - (scenario.ownerProfitCents ?? 0));
        expect((scenario.ownerProfitCents ?? 0) + (scenario.operatorProfitCents ?? 0)).toBe(scenario.netCents);
      }
    }
  });
});

describe("V1 validation 11: guest-paid taxes excluded from profit", () => {
  it("every excluded charge is marked never-deducted with source terminology preserved", () => {
    let total = 0;
    for (const model of ALL_MODELS) {
      expect(model.excludedCharges.length).toBeGreaterThan(0);
      for (const charge of model.excludedCharges) {
        expect(charge.deducted).toBe(false);
        expect(charge.classification).toBe("A_GUEST_PAID");
        expect(charge.name.length).toBeGreaterThan(0);
        total += 1;
      }
    }
    expect(total).toBeGreaterThan(24);
  });

  it("refundable deposits and guest-paid fees travel as excluded charges", () => {
    const names = ALL_MODELS.flatMap((m) => m.excludedCharges.map((c) => c.name));
    expect(names).toContain("Security Deposit");
  });

  it("pre-tax equals gross minus ONLY the three modeled lines (nothing else deducted)", () => {
    for (const model of ALL_MODELS) {
      for (const scenario of [model.conservative, model.base, model.optimistic, model.average]) {
        if (scenario.preTaxCents == null) continue;
        expect(scenario.preTaxCents).toBe(
          scenario.grossCents - scenario.agencyCents - scenario.operatorCents - scenario.reserveCents,
        );
      }
    }
  });
});

describe("V1 validation 12: owner-side tax separated from guest-paid taxes", () => {
  it("Maldives withholding is ~10% on PRE-TAX profit (Grand)", () => {
    const tax = grand().ownerTax;
    expect(tax.kind).toBe("rate");
    if (tax.kind !== "rate") throw new Error("Grand owner tax must be a rate");
    expect(tax.rate).toBe(0.1);
    expect(tax.basis).toBe("PRE_TAX_PROFIT");
    expect(tax.status).toBe("ASSUMPTION");
    for (const scenario of [grand().conservative, grand().base, grand().optimistic, grand().average]) {
      expect(scenario.ownerTaxCents).toBe(Math.round((scenario.preTaxCents ?? 0) * 0.1));
      expect(scenario.netCents).toBe((scenario.preTaxCents ?? 0) - (scenario.ownerTaxCents ?? 0));
    }
  });

  it("zero-rate assumptions (T&C, BVI) yield zero tax with net equal to pre-tax", () => {
    const zeroTaxModels = ALL_MODELS.filter((m) => m.ownerTax.kind === "rate" && m.ownerTax.rate === 0);
    // 6× Turks & Caicos + 2× BVI.
    expect(zeroTaxModels).toHaveLength(8);
    for (const model of zeroTaxModels) {
      for (const scenario of [model.conservative, model.base, model.optimistic, model.average]) {
        expect(scenario.ownerTaxCents).toBe(0);
        expect(scenario.netCents).toBe(scenario.preTaxCents);
      }
    }
  });

  it("tax figures carry the product-assumption disclaimer (never tax advice)", () => {
    expect(V1_TAX_DISCLAIMER).toMatch(/not tax.*advice/i);
  });
});

describe("V1 validation 13: UNKNOWN remains UNKNOWN", () => {
  it("unknown-tax properties expose null net/owner/operator with a stated reason", () => {
    const unknownTaxModels = ALL_MODELS.filter((m) => m.ownerTax.kind === "unknown");
    expect(unknownTaxModels.length).toBeGreaterThan(0);
    for (const model of unknownTaxModels) {
      // USD unknown-tax properties keep known pre-tax; EUR ones are mixed-currency.
      for (const scenario of [model.conservative, model.base, model.optimistic, model.average]) {
        expect(scenario.ownerTaxCents).toBeNull();
        expect(scenario.netCents).toBeNull();
        expect(scenario.ownerProfitCents).toBeNull();
        expect(scenario.operatorProfitCents).toBeNull();
        expect(scenario.unknownReason).toBeTruthy();
      }
      expect(model.perShare.annualCents).toBeNull();
      expect(model.perShare.monthlyCents).toBeNull();
      expect(model.perShare.unknownReason).toBeTruthy();
    }
  });

  it("St. Barthélemy, Nevada, and California are UNKNOWN (never defaulted to 0%)", () => {
    const jurisdictions = new Set(
      ALL_MODELS.filter((m) => m.ownerTax.kind === "unknown").map((m) =>
        m.ownerTax.kind === "unknown" ? m.ownerTax.jurisdiction : "",
      ),
    );
    expect(jurisdictions.has("Saint Barthélemy")).toBe(true);
    expect(jurisdictions.has("USA / Nevada")).toBe(true);
    expect(jurisdictions.has("USA / California")).toBe(true);
  });

  it("unknown states never leak NaN into any numeric field", () => {
    for (const model of ALL_MODELS) {
      const numerics = [
        model.totalShares,
        model.conservative.grossCents,
        model.base.grossCents,
        model.optimistic.grossCents,
        model.average.grossCents,
      ];
      for (const n of numerics) {
        expect(Number.isFinite(n)).toBe(true);
      }
    }
  });
});

describe("V1 validation 14: EUR calculations never silently use USD FX", () => {
  const eurModels = () => ALL_MODELS.filter((m) => m.currency === "EUR");

  it("EUR properties calculate in EUR with a non-subtractable USD reserve", () => {
    // Syrene, Villa du Cap, Chalet Montana, Galeazzo, Chateau Prestige.
    expect(eurModels()).toHaveLength(5);
    for (const model of eurModels()) {
      expect(model.anr.currency).toBe("EUR");
      for (const scenario of [model.conservative, model.base, model.optimistic, model.average]) {
        expect(scenario.currency).toBe("EUR");
        expect(scenario.reserveCurrency).toBe("USD");
        expect(scenario.reserveSubtractable).toBe(false);
        // No mixed-currency subtraction: downstream stays UNKNOWN.
        expect(scenario.preTaxCents).toBeNull();
        expect(scenario.netCents).toBeNull();
        expect(scenario.unknownReason).toMatch(/no approved FX/i);
        // EUR-side lines are pure EUR math (ANR cents × nights, 5%, 7.5%).
        const anrCents = v1AnrToCents(model.anr.valueMajor);
        const nights = scenario.nights ?? 0;
        if (scenario.key !== "average") {
          expect(scenario.grossCents).toBe(anrCents * nights);
        }
        expect(scenario.agencyCents).toBe(Math.round(scenario.grossCents * 0.05));
        expect(scenario.operatorCents).toBe(Math.round(scenario.grossCents * 0.075));
      }
      expect(model.perShare.annualCents).toBeNull();
    }
  });

  it("USD properties keep a subtractable reserve and known pre-tax", () => {
    for (const model of ALL_MODELS.filter((m) => m.currency === "USD")) {
      for (const scenario of [model.conservative, model.base, model.optimistic, model.average]) {
        expect(scenario.reserveSubtractable).toBe(true);
        expect(scenario.preTaxCents).toBe(
          scenario.grossCents - scenario.agencyCents - scenario.operatorCents - scenario.reserveCents,
        );
      }
    }
  });
});

describe("V1 validation 15: 220/273/328 scenario nights", () => {
  it("locked night counts and gross = ANR × nights for every property and scenario", () => {
    expect(V1_SCENARIO_NIGHTS).toEqual({ conservative: 220, base: 273, optimistic: 328 });
    for (const model of ALL_MODELS) {
      const anrCents = v1AnrToCents(model.anr.valueMajor);
      expect(model.conservative.nights).toBe(220);
      expect(model.base.nights).toBe(273);
      expect(model.optimistic.nights).toBe(328);
      expect(model.conservative.grossCents).toBe(anrCents * 220);
      expect(model.base.grossCents).toBe(anrCents * 273);
      expect(model.optimistic.grossCents).toBe(anrCents * 328);
      // Average uses mean gross, not a night count.
      expect(model.average.nights).toBeNull();
      expect(model.average.grossCents).toBe(
        Math.round((model.conservative.grossCents + model.base.grossCents + model.optimistic.grossCents) / 3),
      );
    }
  });
});

describe("V1 validation 16: ANR semantics preserved", () => {
  it("ANR preserves currency, scope, provenance, and method — never ADR", () => {
    for (const input of FINANCIAL_MODEL_V1_INPUTS) {
      const record = ESTATE_24_DATA.find((r) => r.listingId === input.rentalEscapesListingId);
      expect(record).toBeDefined();
      expect(input.anr.valueMajor).toBe(record?.rateTable.averageNightlyRate?.value);
      expect(input.anr.currency).toBe(record?.rateTable.currency);
      expect(input.anr.scope).toBe(record?.rateTable.averageNightlyRate?.scope);
      expect(input.anr.provenance).toBe(record?.rateTable.averageNightlyRate?.provenance);
      expect(input.anr.method).toBe(record?.rateTable.averageNightlyRate?.method);
      expect(input.anr.method).toMatch(/Not ADR|Never ADR/);
    }
  });

  it("HOLIDAY_ONLY and MODEL_INPUT scopes survive verbatim", () => {
    const byListing = Object.fromEntries(FINANCIAL_MODEL_V1_INPUTS.map((i) => [i.rentalEscapesListingId, i]));
    expect(byListing["122903"].anr.scope).toBe("HOLIDAY_ONLY");
    expect(byListing["122903"].anr.provenance).toBe("OBSERVED_DERIVED");
    for (const listingId of ["128529", "129549"]) {
      expect(byListing[listingId].anr.scope).toBe("MODEL_INPUT");
      expect(byListing[listingId].anr.provenance).toBe("PM_APPROVED_MODEL_INPUT");
    }
  });

  it("no V1 model exposes an ADR field", () => {
    for (const model of ALL_MODELS) {
      expect("adr" in model).toBe(false);
      expect("adrUsd" in model).toBe(false);
      expect("ADR" in model).toBe(false);
    }
  });
});

describe("V1 validation 17: no retired rates used", () => {
  it("V1 modules export no legacy cost/allocation identifiers", () => {
    for (const key of Object.keys({ ...v1EngineModule, ...v1InputsModule })) {
      expect(key).not.toMatch(/ESTATE_COST_RATES|ESTATE_ALLOCATION_RATES/i);
      expect(key).not.toMatch(/tourismTax|serviceCharge|agencyRentalOta|operatorOperating|greenTax/i);
      expect(key).not.toMatch(/ownerProfit|operatorProfit|travelAgency/i);
    }
  });

  it("V1 Grand economics differ structurally from the retired 40/60 + 18% model", () => {
    // Under retired allocation the owner would take 40% of net; V1 takes 75%.
    const net = grand().average.netCents ?? 0;
    expect(net).toBeGreaterThan(0);
    expect(grand().average.ownerProfitCents).toBe(Math.round(net * 0.75));
    expect(grand().average.ownerProfitCents).not.toBe(Math.round(net * 0.4));
  });
});

describe("V1 validation 18: no legacy fixture/manifest share economics", () => {
  it("Grand V1 shares (80,000) are independent of the retired fixture count (2,500)", () => {
    const canonical = getCanonicalEstate(GRAND_PROPERTY_ID);
    expect(canonical?.fractionalLuxe.existingFixture.totalShares).toBe(LEGACY_GRAND_FIXTURE_SHARES);
    expect(grand().totalShares).toBe(80_000);
    expect(grand().totalShares).not.toBe(LEGACY_GRAND_FIXTURE_SHARES);
  });

  it("every property's shares are purely valuation-derived", () => {
    for (const model of ALL_MODELS) {
      // Shares are purely valuation-derived; coincidence with a fixture count is
      // only acceptable when the valuation math itself produces it.
      expect(model.totalShares).toBe(model.valuation.valueCents / 10_000);
    }
  });
});

describe("V1 exact-math spot checks: Grand 2 BDM full chain (cents)", () => {
  const g = () => grand();

  it("conservative (220 nights)", () => {
    const s = g().conservative;
    expect(s.grossCents).toBe(2_139_065_500);
    expect(s.agencyCents).toBe(106_953_275);
    expect(s.operatorCents).toBe(160_429_913);
    expect(s.reserveCents).toBe(12_000_000);
    expect(s.preTaxCents).toBe(1_859_682_312);
    expect(s.ownerTaxCents).toBe(185_968_231);
    expect(s.netCents).toBe(1_673_714_081);
    expect(s.ownerProfitCents).toBe(1_255_285_561);
    expect(s.operatorProfitCents).toBe(418_428_520);
  });

  it("average (mean gross → identical chain)", () => {
    const s = g().average;
    expect(s.grossCents).toBe(2_660_867_842);
    expect(s.agencyCents).toBe(133_043_392);
    expect(s.operatorCents).toBe(199_565_088);
    expect(s.reserveCents).toBe(12_000_000);
    expect(s.preTaxCents).toBe(2_316_259_362);
    expect(s.ownerTaxCents).toBe(231_625_936);
    expect(s.netCents).toBe(2_084_633_426);
    expect(s.ownerProfitCents).toBe(1_563_475_070);
    expect(s.operatorProfitCents).toBe(521_158_356);
  });

  it("per-share is PROJECTED annual ÷ shares with smoothed monthly (Annual ÷ 12)", () => {
    expect(g().perShare.projectionLabel).toBe("Projected");
    // 1,563,475,070 ÷ 80,000 = 19,543.438… → 19,543; 19,543 ÷ 12 → 1,629.
    expect(g().perShare.annualCents).toBe(19_543);
    expect(g().perShare.monthlyCents).toBe(1_629);
    expect(g().perShare.monthlyCents).toBe(Math.round((g().perShare.annualCents ?? 0) / 12));
    expect(V1_PROJECTION_DISCLAIMER).toMatch(/not a guaranteed return/i);
    expect(V1_PROJECTION_DISCLAIMER).toMatch(/Annual ÷ 12/);
  });
});

describe("V1 engine purity", () => {
  it("is deterministic: same input → identical model", () => {
    const input = getFinancialModelV1Input(GRAND_PROPERTY_ID);
    if (!input) throw new Error("Grand input missing");
    expect(computeFinancialModelV1(input)).toEqual(computeFinancialModelV1(input));
  });
});
