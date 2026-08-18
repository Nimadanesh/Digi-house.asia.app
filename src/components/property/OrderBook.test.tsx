import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderBook } from "@/components/property/OrderBook";
import type { OrderBookState } from "@/types/order";

const state: OrderBookState = {
  propertyId: "p1",
  bids: [
    { priceUsd: 24500, quantity: 12, cumulative: 12 },
    { priceUsd: 24000, quantity: 5, cumulative: 17 },
  ],
  asks: [
    { priceUsd: 25800, quantity: 8, cumulative: 8 },
    { priceUsd: 26200, quantity: 3, cumulative: 11 },
  ],
  bestBidUsd: 24500,
  bestAskUsd: 25800,
  lastTradeUsd: 25100,
};

describe("OrderBook — DESIGN_SYSTEM §'Order book'", () => {
  it("renders the 'Order book' section label header", () => {
    render(<OrderBook state={state} />);
    expect(screen.getByText("Order book")).toBeInTheDocument();
  });

  it("renders 'Bids' and 'Asks' column headers", () => {
    render(<OrderBook state={state} />);
    expect(screen.getByText("Bids")).toBeInTheDocument();
    expect(screen.getByText("Asks")).toBeInTheDocument();
  });

  it("renders Price, Qty, AND Cumulative values for each level", () => {
    render(<OrderBook state={state} />);
    // best bid: $245.00, qty 12, cumulative 12
    expect(screen.getByText("$245.00")).toBeInTheDocument();
    expect(screen.getAllByText("12").length).toBeGreaterThanOrEqual(2); // qty + cumulative (both 12)
    // second bid: $240.00, qty 5, cumulative 17
    expect(screen.getByText("$240.00")).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
    // best ask: $258.00, qty 8, cumulative 8
    expect(screen.getByText("$258.00")).toBeInTheDocument();
    expect(screen.getAllByText("8").length).toBeGreaterThanOrEqual(2); // qty + cumulative (both 8)
    expect(screen.getByText("11")).toBeInTheDocument(); // second ask cumulative
  });

  it("the best BID row is tinted --success (text-success) and carries bg-accent", () => {
    render(<OrderBook state={state} />);
    const bestBidPrice = screen.getByText("$245.00");
    expect(bestBidPrice).toHaveClass("text-success");
    // The row wrapping it has bg-accent:
    const row = bestBidPrice.closest("div");
    expect(row?.className).toMatch(/bg-accent(?!\/)/); // bg-accent but NOT bg-accent/40
  });

  it("the best ASK row is tinted --danger (text-danger) and carries bg-accent", () => {
    render(<OrderBook state={state} />);
    const bestAskPrice = screen.getByText("$258.00");
    expect(bestAskPrice).toHaveClass("text-danger");
    const row = bestAskPrice.closest("div");
    expect(row?.className).toMatch(/bg-accent(?!\/)/);
  });

  it("renders a 'Last' price header when a last trade exists (PD-06)", () => {
    render(<OrderBook state={state} />);
    const last = screen.getByTestId("book-last-price");
    expect(last).toHaveTextContent("Last");
    expect(last).toHaveTextContent("$251.00");
  });

  it("omits the 'Last' header when there is no last trade yet", () => {
    render(
      <OrderBook
        state={{ propertyId: "p2", bids: state.bids, asks: state.asks, bestBidUsd: 24500, bestAskUsd: 25800 }}
      />,
    );
    expect(screen.queryByTestId("book-last-price")).not.toBeInTheDocument();
  });

  it("draws a depth bar behind each level (PD-06)", () => {
    render(<OrderBook state={state} />);
    // 4 levels × 1 bar each = 4 depth bars
    expect(screen.getAllByTestId("depth-bar")).toHaveLength(4);
    // bids use the success tint; asks use the danger tint
    const bars = screen.getAllByTestId("depth-bar");
    expect(bars[0]!.className).toMatch(/bg-success\/10/);
    expect(bars[2]!.className).toMatch(/bg-danger\/10/);
  });

  it("an empty order book renders the em-dash placeholder for each side", () => {
    render(<OrderBook state={{ propertyId: "p2", bids: [], asks: [] }} />);
    expect(screen.getAllByText("—").length).toBe(2);
  });
});