// Phase 9 Slice 4 — primary vs secondary market clarity (RED-first).
//
// A first-time user must be able to tell, before any Buy/Sell CTA: whether the
// price is the $100 primary offering, a resale ask, or a last trade — with the
// market context visible, and no weekly-profit framing anywhere.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Listing } from "@/types/property";
import { PropertyHero } from "@/components/property/PropertyHero";
import { PropertyMetricsGrid } from "@/components/property/PropertyMetricsGrid";
import { PropertyStickyCta } from "@/components/property/PropertyStickyCta";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import type { Transaction } from "@/types/transaction";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

const baseMeta = {
  sizeSqm: 72,
  yearBuilt: 2019,
  propertyType: "Apartment",
  rentalStatus: "rented" as const,
  leaseUntil: null,
  activeTenant: true,
  tokenizationDocUrl: "#",
};

const primary: Listing = {
  id: "re-128862",
  title: "Grand",
  location: "Maldives",
  description: "x",
  images: ["/images/properties/p1.png"],
  totalShares: 80000,
  sharePriceUsd: 10000,
  status: "funding",
  ownerWalletAddress: "EQA",
  annualRentUsd: 21570000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 0,
  sharesRemaining: 80000,
  fundingProgressRatio: 0,
  monthlyYieldRate: 7.19,
  totalValueUsd: 800_000_000,
  meta: baseMeta,
  rentalHistory: [],
};

const secondary: Listing = {
  ...primary,
  id: "re-125643",
  status: "resale",
  lastTradeUsd: 8000,
  bestAskUsd: 8160,
};

describe("Slice 4 — hero market context appears before the CTA", () => {
  it("secondary with ask + last trade names both figures", () => {
    render(<PropertyHero listing={secondary} bestAskUsd={8160} onBuy={() => {}} />);
    const ctx = screen.getByTestId("hero-market-context");
    expect(ctx).toHaveTextContent("Ask price");
    expect(ctx).toHaveTextContent("$81.60");
    expect(ctx).toHaveTextContent("Last price");
    expect(ctx).toHaveTextContent("$80.00");
  });

  it("secondary with ask only shows the ask without inventing a last trade", () => {
    const askOnly: Listing = { ...secondary, lastTradeUsd: undefined };
    render(<PropertyHero listing={askOnly} bestAskUsd={8160} onBuy={() => {}} />);
    const ctx = screen.getByTestId("hero-market-context");
    expect(ctx).toHaveTextContent("$81.60");
    expect(ctx.textContent).not.toMatch(/Last price/);
  });

  it("secondary with last trade only shows the last trade without inventing an ask", () => {
    const lastOnly: Listing = { ...secondary, bestAskUsd: undefined };
    render(<PropertyHero listing={lastOnly} onBuy={() => {}} />);
    const ctx = screen.getByTestId("hero-market-context");
    expect(ctx).toHaveTextContent("$80.00");
    expect(ctx.textContent).not.toMatch(/asking/i);
  });

  it("primary shows no resale market context (the $100 offering is the context)", () => {
    render(<PropertyHero listing={primary} onBuy={() => {}} />);
    expect(screen.queryByTestId("hero-market-context")).not.toBeInTheDocument();
  });
});

describe("Slice 4 — metrics price label follows the price basis", () => {
  it("secondary ask-basis reads Ask price", () => {
    render(<PropertyMetricsGrid listing={secondary} currentPriceUsd={8160} v1={null} />);
    expect(screen.getByText("Ask price")).toBeInTheDocument();
    expect(screen.queryByText("Share price")).not.toBeInTheDocument();
  });

  it("secondary last-trade basis reads Last price", () => {
    const lastOnly: Listing = { ...secondary, bestAskUsd: undefined };
    render(<PropertyMetricsGrid listing={lastOnly} currentPriceUsd={8000} v1={null} />);
    expect(screen.getByText("Last price")).toBeInTheDocument();
  });

  it("primary reads Share price and states the $100 primary base", () => {
    render(<PropertyMetricsGrid listing={primary} currentPriceUsd={10000} v1={null} />);
    expect(screen.getByText("Share price")).toBeInTheDocument();
    expect(screen.getByTestId("metrics-primary-note")).toHaveTextContent("$100");
  });
});

describe("Slice 4 — sticky CTA carries the market basis on secondary", () => {
  it("secondary sticky buy names the ask", () => {
    render(<PropertyStickyCta variant="secondary" priceUsd={8160} onBuy={() => {}} />);
    expect(screen.getByTestId("sticky-buy")).toHaveTextContent(/Ask/);
  });

  it("primary sticky buy is unchanged", () => {
    render(<PropertyStickyCta variant="primary" priceUsd={10000} onBuy={() => {}} />);
    expect(screen.getByTestId("sticky-buy")).not.toHaveTextContent(/Ask/);
  });
});

describe("Slice 4 — no weekly-profit framing on transaction rows", () => {
  const tx = (kind: Transaction["kind"]): Transaction => ({
    id: "tx1",
    kind,
    userId: "u1",
    status: "success",
    amountUsd: 1000,
    createdAt: "2026-09-01T00:00:00Z",
    propertyTitle: "Villa",
  });

  it("weekly-schedule payout rows read Yield, never Weekly yield", () => {
    const { container } = render(<TransactionRow transaction={tx("yield_weekly")} />);
    expect(container.textContent).toMatch(/Yield/);
    expect(container.textContent).not.toMatch(/Weekly yield/);
  });

  it("monthly rows keep the compliant Monthly yield label", () => {
    render(<TransactionRow transaction={tx("yield_monthly")} />);
    expect(screen.getByText("Monthly yield")).toBeInTheDocument();
  });
});
