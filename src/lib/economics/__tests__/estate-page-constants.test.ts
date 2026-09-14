// Tests for the locked shared disclosure constants (D5/D6/D8/D10/D11):
// exact document list order, six risks, growth band with source + estimate
// flags, historical-performance disclosure, and the tax-advice disclaimer.
import { describe, expect, it } from "vitest";

import {
  ESTATE_DOCUMENTS_AVAILABLE,
  ESTATE_DOCUMENT_TITLES,
  ESTATE_GROWTH_ASSUMPTION,
  ESTATE_HISTORICAL_PERFORMANCE,
  ESTATE_OWNER_TAX_DISCLOSURE,
  ESTATE_RISK_DISCLOSURES,
} from "@/lib/economics/estates/estate-page-constants";

describe("estate-page-constants — D5/D6/D8/D10/D11 locked content", () => {
  it("D5: exactly 10 locked document titles in order, no PDFs available yet", () => {
    expect(ESTATE_DOCUMENT_TITLES.map((d) => d.id)).toEqual(Array.from({ length: 10 }, (_, i) => i + 1));
    expect(ESTATE_DOCUMENT_TITLES[0].title).toBe("Shareholder Agreement (SPV)");
    expect(ESTATE_DOCUMENT_TITLES[9].title).toBe("Exit / Resale & Transfer Procedure");
    expect(ESTATE_DOCUMENTS_AVAILABLE).toBe(false);
  });

  it("D6: exactly six locked risk disclosures with titles and text", () => {
    expect(ESTATE_RISK_DISCLOSURES).toHaveLength(6);
    expect(ESTATE_RISK_DISCLOSURES[5].title).toBe("No guarantee");
    for (const risk of ESTATE_RISK_DISCLOSURES) {
      expect(risk.title.length).toBeGreaterThan(0);
      expect(risk.text.length).toBeGreaterThan(0);
    }
  });

  it("D8: honest historical-performance disclosure lines", () => {
    expect(ESTATE_HISTORICAL_PERFORMANCE.unavailableLine).toMatch(/Not publicly disclosed/);
    expect(ESTATE_HISTORICAL_PERFORMANCE.pendingLine).toMatch(/first 12 months/);
  });

  it("D10: +3–5% p.a. growth assumption, Knight Frank PIRI source, isEstimate", () => {
    expect(ESTATE_GROWTH_ASSUMPTION.minPctPerYear).toBe(3);
    expect(ESTATE_GROWTH_ASSUMPTION.maxPctPerYear).toBe(5);
    expect(ESTATE_GROWTH_ASSUMPTION.displayLabel).toBe("+3% to +5% per year");
    expect(ESTATE_GROWTH_ASSUMPTION.source).toBe("Knight Frank PIRI");
    expect(ESTATE_GROWTH_ASSUMPTION.isEstimate).toBe(true);
    expect(ESTATE_GROWTH_ASSUMPTION.paragraph).toMatch(/Illustrative only, not a forecast/);
  });

  it("D11: investor-facing tax disclosure always carries the not-tax-advice disclaimer", () => {
    expect(ESTATE_OWNER_TAX_DISCLOSURE.paragraph).toMatch(/not tax advice/i);
    expect(ESTATE_OWNER_TAX_DISCLOSURE.paragraph).toMatch(/seek personal advice/i);
    expect(ESTATE_OWNER_TAX_DISCLOSURE.maldivesNote).toMatch(/~10% non-resident withholding/);
  });
});
