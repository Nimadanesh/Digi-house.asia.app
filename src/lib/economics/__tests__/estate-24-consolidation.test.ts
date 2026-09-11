// CONSOLIDATION (2026-09-08): pins the Master Extraction Report consolidation layer.
// Verbatim PROMPT 02 fields stay frozen (asserted here by sampling); the seven new
// additive keys carry live rate-table observations, layered valuation, observed
// taxes/fees, stay rules, conflicts, and the consolidation verdict. No ADR, annual
// revenue, yield, ROI, profit, or income may exist anywhere in these records.
import { describe, expect, it } from "vitest";

import { ESTATE_24_DATA } from "../estates/estate-24-data";

const FORBIDDEN_TOP_LEVEL = ["adr", "annualRevenue", "yield", "appreciation"] as const;

describe("CONSOLIDATION: rate-table observations adopted", () => {
  it("attaches exactly one rateTable per estate with a valid status", () => {
    expect(ESTATE_24_DATA).toHaveLength(24);
    for (const e of ESTATE_24_DATA) {
      expect(e.rateTable).toBeDefined();
      expect(["FULL", "HOLIDAY_ONLY", "DEFAULT_ONLY"]).toContain(e.rateTable!.status);
      expect(["USD", "EUR"]).toContain(e.rateTable!.currency);
      expect(e.rateTable!.source).toContain(e.listingId);
    }
  });

  it("preserves every seasonal row for full-buyout configs (spot checks)", () => {
    const byId = Object.fromEntries(ESTATE_24_DATA.map((e) => [e.listingId, e]));
    // Grand 2 BDM: the 4-row live table supersedes the old 2-point display.
    const grand = byId["128862"].rateTable!;
    expect(grand.seasons.filter((s) => s.rooms === "2").map((s) => s.nightly)).toEqual(
      expect.arrayContaining([67655, 76458, 102664, 142144]),
    );
    // Chalet Montana is weekly-priced with derived nightlies.
    const montana = byId["130901"].rateTable!;
    expect(montana.seasons.every((s) => s.pricingBasis === "WEEKLY")).toBe(true);
    expect(montana.seasons.every((s) => typeof s.nightlyDerived === "number")).toBe(true);
    // Trajan / Forza have no seasonal table by source design — default only.
    expect(byId["128529"].rateTable!.seasons).toEqual([]);
    expect(byId["128529"].rateTable!.defaultRate).toMatchObject({ nightly: 25000 });
    expect(byId["129549"].rateTable!.defaultRate).toMatchObject({ nightly: 12000 });
    // La Dolce Vita table is holidays-only.
    expect(byId["122903"].rateTable!.status).toBe("HOLIDAY_ONLY");
  });

  it("derives averageNightlyRate from distinct full-buyout values (never ADR)", () => {
    const byId = Object.fromEntries(ESTATE_24_DATA.map((e) => [e.listingId, e]));
    expect(byId["128862"].rateTable!.averageNightlyRate).toMatchObject({
      value: 97230.25,
      currency: "USD",
      scope: "FULL_TABLE",
      provenance: "OBSERVED_DERIVED",
    });
    expect(byId["122903"].rateTable!.averageNightlyRate!.scope).toBe("HOLIDAY_ONLY");
    // PM-APPROVED MODEL INPUTS (2026-09-09): not table averages, explicitly provenanced.
    expect(byId["128529"].rateTable!.averageNightlyRate).toMatchObject({
      value: 35000,
      currency: "USD",
      scope: "MODEL_INPUT",
      provenance: "PM_APPROVED_MODEL_INPUT",
    });
    expect(byId["129549"].rateTable!.averageNightlyRate).toMatchObject({
      value: 20000,
      currency: "USD",
      scope: "MODEL_INPUT",
      provenance: "PM_APPROVED_MODEL_INPUT",
    });
    for (const e of ESTATE_24_DATA) {
      const anr = e.rateTable!.averageNightlyRate;
      if (anr) {
        expect(anr.inputs.length).toBeGreaterThan(0);
        if (anr.provenance === "OBSERVED_DERIVED") {
          expect(anr.value).toBeCloseTo(
            anr.inputs.reduce((a, b) => a + b, 0) / anr.inputs.length,
            1,
          );
        }
      }
    }
  });
});

describe("CONSOLIDATION: valuation layers without silent overwrites", () => {
  it("keeps approved values with research as evidence and legacy quarantined", () => {
    const byId = Object.fromEntries(ESTATE_24_DATA.map((e) => [e.listingId, e]));
    expect(byId["128862"].valuation).toMatchObject({
      approved: { central: 8000000 },
      status: "CONFLICTED",
    });
    expect(byId["128862"].valuation!.legacy).toEqual([
      expect.objectContaining({ value: 82000000, provenance: "CONFLICTED" }),
    ]);
    expect(byId["126855"].valuation).toMatchObject({
      approved: { central: 18000000 },
      status: "ADOPT",
    });
    // Stale-JSON divergence estates stay explicitly conflicted.
    for (const id of ["106441", "129549", "123919", "122113"]) {
      expect(byId[id].valuation!.status).toBe("CONFLICTED");
      expect(byId[id].conflicts!.some((c) => c.id.startsWith("C-VAL"))).toBe(true);
    }
  });
});

describe("CONSOLIDATION: honesty guards", () => {
  it("adopts the live half-bath detail without touching full-bath counts", () => {
    const aerial = ESTATE_24_DATA.find((e) => e.listingId === "126855")!;
    expect(aerial.specs.bathrooms).toBe(17);
    expect(aerial.specs.halfBathrooms).toBe(4);
  });

  it("exposes no derived-economics keys and keeps occupancy null", () => {
    for (const e of ESTATE_24_DATA) {
      expect(e.estimates.occupancy).toBeNull();
      for (const key of FORBIDDEN_TOP_LEVEL) {
        expect(e as unknown as Record<string, unknown>).not.toHaveProperty(key);
      }
      expect(e.stayRules).toBeDefined();
      expect(e.consolidation).toBeDefined();
      expect(e.taxesListing).toBeDefined();
    }
  });

  it("records the consolidation verdict for all 24 estates", () => {
    const statuses = ESTATE_24_DATA.map((e) => e.consolidation!.status);
    expect(statuses.filter((s) => s === "READY_WITH_GAPS")).toHaveLength(20);
    expect(statuses.filter((s) => s === "CONFLICTED")).toHaveLength(4);
    expect(statuses.filter((s) => s === "REQUIRES_SOURCE")).toHaveLength(0);
  });
});

describe("PM DECISIONS 2026-09-09: canonical finalization gate", () => {
  const byId = () => Object.fromEntries(ESTATE_24_DATA.map((e) => [e.listingId, e]));

  it("24/24 estates carry an ANR with explicit provenance (never ADR)", () => {
    for (const e of ESTATE_24_DATA) {
      const anr = e.rateTable!.averageNightlyRate;
      expect(anr, `${e.listingId} ANR present`).not.toBeNull();
      expect(["OBSERVED_DERIVED", "PM_APPROVED_MODEL_INPUT"]).toContain(anr!.provenance);
      // The method may disclaim ADR ("Never ADR") but must never label the value ADR.
      expect(anr!.method).not.toMatch(/is (the )?ADR|ADR of/i);
    }
  });

  it("rate conflicts resolve to the higher/current sets with old ranges retired", () => {
    const by = byId();
    expect(by["128862"].rateTable!.seasons.map((s) => s.nightly)).toEqual(
      expect.arrayContaining([67655, 76458, 102664, 142144]),
    );
    expect(by["130393"].rateTable!.averageNightlyRate!.inputs).toEqual(
      expect.arrayContaining([33250, 35000, 48000, 50500]),
    );
    expect(by["123320"].rateTable!.averageNightlyRate!.inputs).toEqual([35000, 40000]);
    expect(by["109098"].rateTable!.averageNightlyRate!.inputs).toEqual([12000, 18000, 24000]);
    for (const [id, cid] of [
      ["128862", "C-RATE-01"],
      ["130393", "C-RATE-06"],
      ["123320", "C-RATE-10"],
      ["109098", "C-RATE-11"],
    ] as const) {
      const c = by[id].conflicts!.find((x) => x.id === cid)!;
      expect(c.treatment).toContain("PM-ADOPTED 2026-09-09");
      expect(c.treatment).toContain("RETIRED");
    }
    expect(by["128862"].consolidation!.status).toBe("READY_WITH_GAPS");
    expect(by["130393"].consolidation!.status).toBe("READY_WITH_GAPS");
    expect(by["123320"].consolidation!.status).toBe("READY_WITH_GAPS");
    expect(by["109098"].consolidation!.status).toBe("READY_WITH_GAPS");
  });

  it("Current Estimated Value follows the lowest-valid-value rule (Grand $8M, no $82M)", () => {
    const by = byId();
    const expected: Record<string, number> = {
      "128862": 8000000, "126855": 18000000, "108924": 12000000, "123861": 25000000,
      "125643": 28000000, "130393": 30000000, "130901": 12000000, "131293": 18000000,
      "128529": 8000000, "123320": 15000000, "109098": 12000000, "127825": 35000000,
      "122422": 50000000, "129548": 25000000, "122903": 32000000, "126870": 35000000,
      "130397": 60000000, "127483": 20000000, "108856": 45000000, "108860": 50000000,
      "106441": 25000000, "129549": 18000000, "123919": 15000000, "122113": 22000000,
    };
    for (const [id, central] of Object.entries(expected)) {
      expect(by[id].valuation!.approved.central, id).toBe(central);
    }
    for (const e of ESTATE_24_DATA) {
      expect(e.valuation!.approved.central, `${e.listingId} no $82M`).not.toBe(82000000);
      for (const leg of e.valuation!.legacy) {
        expect(leg.provenance).toBe("CONFLICTED");
      }
    }
    expect(by["128862"].valuation!.legacy).toEqual([
      expect.objectContaining({ value: 82000000, provenance: "CONFLICTED" }),
    ]);
  });

  it("tax names stay source-specific with #7 3% country rule and #15 12% adopted", () => {
    const by = byId();
    const acc = by["130901"].taxesListing!.taxes.find((t) => t.name === "Accommodation Tax")!;
    expect(acc).toMatchObject({ kind: "PERCENTAGE", value: 3, status: "ADOPT" });
    expect(acc.source).toContain("PM-APPROVED COUNTRY RULE");
    const t15 = by["122903"].taxesListing!.taxes.find((t) => t.value === 12)!;
    expect(t15).toMatchObject({ name: "Tax (as listed)", status: "ADOPT" });
    expect(t15.source).toContain("Rental Escapes listing");
  });

  it("guest-paid taxes/fees are never treated as villa operating costs", () => {
    for (const e of ESTATE_24_DATA) {
      for (const t of e.taxesListing!.taxes) {
        expect(t.revenueTreatment ?? "UNKNOWN", `${e.listingId} tax ${t.name}`).not.toBe("VILLA_COST");
      }
      for (const f of e.taxesListing!.fees) {
        expect(f.revenueTreatment ?? "UNKNOWN", `${e.listingId} fee ${f.name}`).not.toBe("VILLA_COST");
        if (f.name === "Security Deposit") {
          expect(f.revenueTreatment).toBe("GUEST_PAID");
        }
      }
    }
  });

  it("introduces no derived-economics fields", () => {
    for (const e of ESTATE_24_DATA as unknown as Record<string, unknown>[]) {
      for (const key of ["annualRevenue", "occupancy", "yield", "appreciation", "adr", "profit", "roi"]) {
        expect(key in e, key).toBe(false);
      }
    }
  });
});
