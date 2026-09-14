// DEC-014 regression pins — the FactRow pattern (anti-revert):
// 1. ⓘ leads the LABEL side (start), the value side stays pure/right-aligned.
// 2. Tapping the WHOLE row opens the provenance sheet (never icon-only).
// 3. Captions clamp to 3 lines with Show more/less.
// 4. Compact money rule: tab fact rows never render a 7+ digit full figure.
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FactRow } from "./FactRow";
import { EstateV1Thesis } from "@/components/property/EstateV1Thesis";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";

const bigModel = {
  currency: "USD",
  anr: { valueMajor: 97_230.25, provenance: "ESTIMATED", method: "avg of listed nightly rates" },
  conservative: { grossCents: 2_139_065_500, agencyCents: 0, operatorCents: 0, reserveCents: 0, reserveCurrency: "USD", nights: 220, ownerTaxCents: null, netCents: null, ownerProfitCents: null, currency: "USD" },
  base: { grossCents: 2_664_385_850, agencyCents: 0, operatorCents: 0, reserveCents: 0, reserveCurrency: "USD", nights: 273, ownerTaxCents: null, netCents: null, ownerProfitCents: null, currency: "USD" },
  optimistic: { grossCents: 3_189_152_200, agencyCents: 0, operatorCents: 0, reserveCents: 0, reserveCurrency: "USD", nights: 328, ownerTaxCents: null, netCents: null, ownerProfitCents: null, currency: "USD" },
  average: { grossCents: 2_664_201_183, agencyCents: 0, operatorCents: 0, reserveCents: 0, reserveCurrency: "USD", nights: null, ownerTaxCents: null, netCents: null, ownerProfitCents: null, currency: "USD" },
  ownerTax: { kind: "unknown", jurisdiction: "Test" },
  valuation: { valueCents: 800_000_000, provenance: "ESTIMATED" },
  totalShares: 80_000,
  perShare: { annualCents: null, monthlyCents: null, currency: "USD", unknownReason: "Per-share economics are UNKNOWN: owner-side tax is UNKNOWN. Pre-tax profit remains as stated." },
} as unknown as FinancialModelV1PropertyModel;

describe("FactRow — DEC-014 pattern", () => {
  it("leads the label with the ⓘ icon and keeps the value side pure", () => {
    render(<FactRow label="Average nightly rate" value="$37.5K" provenance="estimated" valueTestId="v" />);
    const row = screen.getByTestId("fact-row");
    const label = row.firstElementChild as HTMLElement;
    expect(label.textContent).toContain("Average nightly rate");
    expect(label.querySelector("svg")).not.toBeNull();
    expect(screen.getByTestId("v").textContent).toBe("$37.5K");
  });

  it("opens the provenance sheet when the WHOLE row is tapped", () => {
    render(<FactRow label="Modeled annual revenue" value="$8.3M – $12.3M" provenance="calculated" />);
    fireEvent.click(screen.getByTestId("fact-row"));
    expect(screen.getByTestId("fact-row-sheet")).toBeInTheDocument();
  });

  it("plain rows without provenance are not tappable buttons", () => {
    render(<FactRow label="Sold" value="160" />);
    expect(screen.getByTestId("fact-row").tagName).toBe("DIV");
  });

  it("clamps long captions with Show more/less", () => {
    // jsdom does no layout: stub the measurements the clamp check reads.
    const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
    const realScroll = Object.getOwnPropertyDescriptor(proto, "scrollHeight");
    const realClient = Object.getOwnPropertyDescriptor(proto, "clientHeight");
    Object.defineProperty(proto, "scrollHeight", { configurable: true, get() { return 300; } });
    Object.defineProperty(proto, "clientHeight", { configurable: true, get() { return 60; } });
    try {
      const long = "word ".repeat(200);
      render(<FactRow label="Net" value="Data pending" caption={long} />);
      expect(screen.getByTestId("fact-row-caption")).toHaveClass("line-clamp-3");
      fireEvent.click(screen.getByTestId("fact-row-caption-toggle"));
      expect(screen.getByTestId("fact-row-caption")).not.toHaveClass("line-clamp-3");
      expect(screen.getByTestId("fact-row-caption-toggle")).toHaveTextContent(/Show less/i);
    } finally {
      delete proto.scrollHeight;
      delete proto.clientHeight;
      if (realScroll) Object.defineProperty(proto, "scrollHeight", realScroll);
      if (realClient) Object.defineProperty(proto, "clientHeight", realClient);
    }
  });
});

describe("DEC-014 compact-money rule — tab fact rows never render 7+ digit figures", () => {
  it("EstateV1Thesis renders K/M figures only (no $99,999,999-style wraps)", () => {
    render(<EstateV1Thesis v1={bigModel} onShowIncome={() => {}} />);
    const text = screen.getByTestId("estate-v1-thesis").textContent ?? "";
    // Any money figure with 2+ grouped thousands is a violation of the rule.
    const violations = text.match(/\$\d{1,3}(,\d{3}){2,}/g) ?? [];
    expect(violations, `full-format figures leaked: ${violations.join(", ")}`).toEqual([]);
    expect(screen.getByTestId("thesis-anr").textContent).toBe("$97.2K");
    expect(screen.getByTestId("thesis-revenue").textContent).toBe("$21.4M – $31.9M");
  });
});
