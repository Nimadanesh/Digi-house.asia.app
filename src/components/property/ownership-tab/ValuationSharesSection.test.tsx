// TDD RED — Ownership → Valuation & shares shows NO per-share percentage
// caption (it lives on the hero share-price row now). The cell itself plus
// estate value / reference / total shares stay intact.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { getFinancialModelV1 } from "@/lib/economics/estates/financial-model-v1-inputs";
import { ValuationSharesSection } from "@/components/property/ownership-tab/ValuationSharesSection";

describe("ValuationSharesSection — no duplicated per-share percentage", () => {
  it("renders the 1/N fraction without any % caption; other facts intact", () => {
    const v1 = getFinancialModelV1("re-128862") ?? null;
    expect(v1).not.toBeNull();
    render(<ValuationSharesSection v1={v1} />);
    // NOTE: the % caption is a sibling span of the value span, so assertions
    // run against the whole section (pre-change it contains "0.0013%").
    const section = screen.getByTestId("ownership-valuation");
    expect(section).toHaveTextContent("1 / 80,000");
    expect(section).not.toHaveTextContent("%");
    expect(screen.getByTestId("ownership-valuation-value")).toBeInTheDocument();
    expect(screen.getByTestId("ownership-valuation-reference")).toBeInTheDocument();
    expect(screen.getByTestId("ownership-valuation-shares")).toBeInTheDocument();
  });
});
