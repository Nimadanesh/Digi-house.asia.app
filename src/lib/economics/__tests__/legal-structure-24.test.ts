// Tests for the D2/D3/D4 legal layer: Maldives text keyed to villa 1 ONLY,
// generic template + isEstimate for the other 23, insurance TBC fields, the
// locked generic valuer phrase (never a firm name), and the approx valuation
// date. Also pins that no specific firm name leaks into any text.
import { describe, expect, it } from "vitest";

import {
  ESTATE_LEGAL_STRUCTURE,
  getLegalStructureByEstate24Id,
  getLegalStructureByPropertyId,
} from "@/lib/economics/estates/legal-structure-24";

describe("legal-structure-24 — D2/D3/D4 locked data", () => {
  it("covers villas 1–24 exactly once", () => {
    expect(ESTATE_LEGAL_STRUCTURE).toHaveLength(24);
    const ids = ESTATE_LEGAL_STRUCTURE.map((r) => r.estateId).sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
  });

  it("uses the dedicated Maldives text for villa 1 only (CONFIRMED)", () => {
    const maldives = getLegalStructureByEstate24Id(1);
    expect(maldives?.legal.isMaldives).toBe(true);
    expect(maldives?.legal.text).toMatch(/50-year government head-lease/);
    expect(maldives?.legal.isEstimate).toBe(false);
    // The Maldives wording never leaks onto any other villa.
    for (const record of ESTATE_LEGAL_STRUCTURE.filter((r) => r.estateId !== 1)) {
      expect(record.legal.isMaldives, `villa ${record.estateId}`).toBe(false);
      expect(record.legal.text).not.toMatch(/head-lease \(Maldives/);
      expect(record.legal.isEstimate, `villa ${record.estateId}`).toBe(true);
      expect(record.legal.text).toMatch(/dedicated property SPV/);
    }
  });

  it("keeps insurance per-villa insurer/policy year TBC with the standard coverage text", () => {
    for (const record of ESTATE_LEGAL_STRUCTURE) {
      expect(record.insurance.coverage).toMatch(/All-risks property/);
      expect(record.insurance.insurer).toBeNull();
      expect(record.insurance.policyYear).toBeNull();
      expect(record.insurance.isEstimate).toBe(true);
    }
  });

  it("carries the locked D4 valuation method with the generic valuer phrase", () => {
    for (const record of ESTATE_LEGAL_STRUCTURE) {
      expect(record.valuation.valuationDate).toBe("2024-12-31");
      expect(record.valuation.dateIsEstimate).toBe(true);
      expect(record.valuation.dateNote).toMatch(/roll to 31 Dec 2025/);
      expect(record.valuation.valuer).toBe("Independent RICS-registered valuer");
      expect(record.valuation.method).toMatch(/RICS-aligned Market Value/);
    }
  });

  it("never names a specific valuation firm anywhere", () => {
    const blob = JSON.stringify(ESTATE_LEGAL_STRUCTURE);
    expect(blob).not.toMatch(/Knight Frank|CBRE|Savills|JLL/i);
  });

  it("resolves through the runtime propertyId join", () => {
    expect(getLegalStructureByPropertyId("re-128862")?.legal.isMaldives).toBe(true);
    expect(getLegalStructureByPropertyId("re-125643")?.legal.isMaldives).toBe(false);
    expect(getLegalStructureByPropertyId("test-unknown")).toBeNull();
  });
});
