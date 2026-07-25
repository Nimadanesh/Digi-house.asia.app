import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyPositionBlock } from "@/components/portfolio/MyPositionBlock";
import type { Holding } from "@/types/position";

const upHolding: Holding = {
  propertyId: "p1",
  sharesOwned: 60,
  avgCostUsd: 25000, // $250.00/share
  currentValueUsd: 60 * 26000, // $15,600.00 total (appreciated)
  pendingWeekEarningsUsd: 1500,
  shareRatio: 0.075,
};

const downHolding: Holding = {
  propertyId: "p2",
  sharesOwned: 75,
  avgCostUsd: 10000, // $100.00/share
  currentValueUsd: 75 * 9500, // $7,125.00 total (depreciated)
  pendingWeekEarningsUsd: 1875,
  shareRatio: 0.075,
};

describe("MyPositionBlock — PnL honesty contract", () => {
  it("an appreciated holding renders PnL in --success with a '+' prefix (tabular-nums)", () => {
    render(<MyPositionBlock holding={upHolding} propertyName="Bayside Marina Penthouse" />);
    // PnL = 60*26000 - 60*25000 = 60000 cents = $600.00
    const pnl = screen.getByText(/\$600\.00/);
    expect(pnl).toHaveClass("text-success");
    expect(pnl).toHaveClass("tnum");
    // The wrapping span's textContent is "+$600.00":
    const pnlSpan = pnl.closest("span");
    expect(pnlSpan?.textContent).toMatch(/^\+\$600\.00$/);
  });

  it("a depreciated holding renders PnL in --danger with a '\u2212' (U+2212 MINUS) prefix", () => {
    render(<MyPositionBlock holding={downHolding} propertyName="Alfama Terrace" />);
    // PnL = 75*9500 - 75*10000 = -37500 cents = -$375.00
    const pnl = screen.getByText(/\$375\.00/);
    expect(pnl).toHaveClass("text-danger");
    expect(pnl).toHaveClass("tnum");
    const pnlSpan = pnl.closest("span");
    // U+2212 MINUS SIGN, NOT a hyphen-minus:
    expect(pnlSpan?.textContent).toMatch(/^\u2212\$375\.00$/);
  });

  it("renders the property name as a bold header row", () => {
    render(<MyPositionBlock holding={upHolding} propertyName="Bayside Marina Penthouse" />);
    const name = screen.getByText("Bayside Marina Penthouse");
    expect(name).toHaveClass("font-semibold", "text-foreground");
  });

  it("renders Shares owned / Avg cost / Current value rows with tabular-nums on every figure", () => {
    render(<MyPositionBlock holding={upHolding} propertyName="Bayside" />);
    // sharesOwned = 60
    expect(screen.getByText("60")).toHaveClass("tnum");
    // avgCostUsd = 25000 cents = $250.00
    expect(screen.getByText("$250.00")).toHaveClass("tnum");
    // currentValueUsd = 60*26000 = 1,560,000 cents = $15,600.00 (toLocaleString groups with comma)
    expect(screen.getByText("$15,600.00")).toHaveClass("tnum");
  });
});