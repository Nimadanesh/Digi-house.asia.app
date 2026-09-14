import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Listing } from "@/types/property";
import { BuySheet } from "@/components/property/buy/BuySheet";
import { BuyQtyStep } from "@/components/property/buy/BuyQtyStep";
import { BuySummaryStep } from "@/components/property/buy/BuySummaryStep";
import { BuySuccessStep } from "@/components/property/buy/BuySuccessStep";
import { DEMO_TX_DISCLAIMER } from "@/lib/constants";
import { DEFAULT_FEE_TIERS } from "@/lib/mock/fees";

const push = vi.fn();

const useFees = vi.fn();
vi.mock("@/hooks/useFees", () => ({
  useFees: () => useFees(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn() }),
}));

vi.mock("@/hooks/useTonConnect", () => ({
  useTonConnect: () => ({
    connected: true,
    openModal: vi.fn(),
    address: "EQxxx",
    short: "EQxx…",
    restoring: false,
    network: "testnet",
    disconnect: vi.fn(),
    send: vi.fn(),
  }),
}));

vi.mock("@/hooks/useTelegram", () => ({
  useTelegram: () => ({
    haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
  }),
}));

const listing: Listing = {
  id: "re-128862",
  title: "Grand 2 BDM Ocean Pool Villa (JOALI Being)",
  location: "Bodufushi, JOALI Being, Raa Atoll, Maldives",
  description: "Waterfront one-bedroom.",
  images: ["/images/properties/p1.png"],
  totalShares: 1000,
  sharePriceUsd: 12500,
  status: "funding",
  ownerWalletAddress: "EQAtest",
  annualRentUsd: 520000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 640,
  sharesRemaining: 360,
  fundingProgressRatio: 0.64,
    monthlyYieldRate: 6.25,
    totalValueUsd: 8_000_000,
  meta: {
    sizeSqm: 72,
    yearBuilt: 2019,
    propertyType: "Apartment",
    rentalStatus: "rented",
    leaseUntil: "2026-12-31",
    activeTenant: true,
    tokenizationDocUrl: "#tokenization-demo",
  },
  rentalHistory: [],
};

describe("Buy flow steps", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("qty step: stepper, quick buttons, live total + monthly projection", () => {
    const onQty = vi.fn();
    render(
      <BuyQtyStep
        listing={listing}
        qty={10}
        onQtyChange={onQty}
        walletConnected
        currency="TON"
        onCurrencyChange={() => {}}
      />,
    );
    expect(screen.getByTestId("buy-qty")).toHaveTextContent("10");
    fireEvent.click(screen.getByRole("button", { name: "25" }));
    expect(onQty).toHaveBeenCalledWith(25);
    fireEvent.click(screen.getByRole("button", { name: "Max" }));
    expect(onQty).toHaveBeenCalledWith(360);
    expect(screen.getByText(/Projected income \/ month/i)).toBeInTheDocument();
    // Slice 2: Grand V1 $16.25/share/mo → 10 shares = $162.50/mo.
    expect(screen.getByTestId("buy-est-monthly")).toHaveTextContent("$162.50");
    expect(screen.getByText(/Total/)).toBeInTheDocument();
  });

  it("qty step: V1-unknown villa shows pending WITH the reason (never a fixture figure)", () => {
    // D11 owner-tax table locked 2026-09-13: the only remaining V1-unknowns are
    // EUR mixed-currency villas (no-FX rule) — Chalet Montana (re-130901).
    const unknownVilla: Listing = {
      ...listing,
      id: "re-130901",
      sharesRemaining: 360,
    };
    render(
      <BuyQtyStep
        listing={unknownVilla}
        qty={10}
        onQtyChange={() => {}}
        walletConnected
        currency="TON"
        onCurrencyChange={() => {}}
      />,
    );
    expect(screen.getByTestId("buy-est-monthly")).toHaveTextContent("Data pending");
    expect(screen.getByTestId("buy-est-monthly")).toHaveTextContent(/EUR/);
  });

  it("qty step: disconnected prompts connect", () => {
    render(
      <BuyQtyStep
        listing={listing}
        qty={1}
        onQtyChange={() => {}}
        walletConnected={false}
        currency="TON"
        onCurrencyChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /connect/i })).toBeInTheDocument();
  });

  it("qty step: no placeholder wallet-balance row (honest UI)", () => {
    render(
      <BuyQtyStep
        listing={listing}
        qty={1}
        onQtyChange={() => {}}
        walletConnected
        currency="TON"
        onCurrencyChange={() => {}}
      />,
    );
    expect(screen.queryByText(/Wallet balance/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/chain linked/i)).not.toBeInTheDocument();
    // The real state rows remain.
    expect(screen.getByTestId("buy-available")).toBeInTheDocument();
  });

  it("qty step: currency selector defaults to TON and switches to USDT", () => {
    const onCurrency = vi.fn();
    const { rerender } = render(
      <BuyQtyStep
        listing={listing}
        qty={10}
        onQtyChange={() => {}}
        walletConnected
        currency="TON"
        onCurrencyChange={onCurrency}
      />,
    );
    expect(screen.getByRole("button", { name: "Pay with TON" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Pay with USDT" }));
    expect(onCurrency).toHaveBeenCalledWith("USDT");
    // USDT total is shown as the USD value in the selected currency.
    rerender(
      <BuyQtyStep
        listing={listing}
        qty={10}
        onQtyChange={() => {}}
        walletConnected
        currency="USDT"
        onCurrencyChange={onCurrency}
      />,
    );
    expect(screen.getByRole("button", { name: "Pay with USDT" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("buy-qty-total")).toHaveTextContent("$1,250.00 USDT");
  });

  it("qty step: USDT option disabled + note shown when unavailable", () => {
    render(
      <BuyQtyStep
        listing={listing}
        qty={10}
        onQtyChange={() => {}}
        walletConnected
        currency="TON"
        onCurrencyChange={() => {}}
        usdtAvailable={false}
      />,
    );
    expect(screen.getByRole("button", { name: "Pay with USDT" })).toBeDisabled();
    expect(screen.getByTestId("usdt-unavailable-note")).toBeInTheDocument();
  });

  it("qty step: lock-to-earn footnote names the earning requirement", () => {
    render(
      <BuyQtyStep
        listing={listing}
        qty={10}
        onQtyChange={() => {}}
        walletConnected
        currency="TON"
        onCurrencyChange={() => {}}
      />,
    );
    expect(screen.getByTestId("buy-lock-note")).toHaveTextContent(
      "Buy shares first, then lock them",
    );
  });

  it("qty step: out-of-range quantity shows the invalid message", () => {
    render(
      <BuyQtyStep
        listing={listing}
        qty={999}
        onQtyChange={() => {}}
        walletConnected
        currency="TON"
        onCurrencyChange={() => {}}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("between 1 and 360");
  });

  it("summary step: property, qty, total, fees", () => {
    useFees.mockReturnValue({ data: DEFAULT_FEE_TIERS, isLoading: false, isError: false });
    render(<BuySummaryStep listing={listing} qty={10} currency="TON" />);
    expect(screen.getByText("Order summary")).toBeInTheDocument();
    expect(screen.getByText("Grand 2 BDM Ocean Pool Villa (JOALI Being)")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Fees")).toBeInTheDocument();
    expect(screen.getByTestId("buy-total")).toBeInTheDocument();
    expect(screen.getByText(/Total includes the primary-market commission/i)).toBeInTheDocument();
  });

  it("summary step: shows the USDT total including the primary commission when paying with USDT", () => {
    useFees.mockReturnValue({ data: DEFAULT_FEE_TIERS, isLoading: false, isError: false });
    render(<BuySummaryStep listing={listing} qty={10} currency="USDT" />);
    expect(screen.getByTestId("buy-pay-with")).toHaveTextContent("USDT");
    // $1,250.00 principal at the $500–$2,000 tier (2.5%) → $31.25 commission → $1,281.25 payable.
    expect(screen.getByTestId("buy-fees")).toHaveTextContent("$31.25");
    expect(screen.getByTestId("buy-total")).toHaveTextContent("$1,281.25 USDT");
  });

  it("summary step: fees fall back to $0 when the tier list is unavailable", () => {
    useFees.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<BuySummaryStep listing={listing} qty={10} currency="USDT" />);
    expect(screen.getByTestId("buy-fees")).toHaveTextContent("$0.00");
    expect(screen.getByTestId("buy-total")).toHaveTextContent("$1,250.00 USDT");
  });

  it("summary step: location, ownership, and assumptions disclosure", () => {
    useFees.mockReturnValue({ data: DEFAULT_FEE_TIERS, isLoading: false, isError: false });
    render(<BuySummaryStep listing={listing} qty={10} currency="TON" />);
    expect(screen.getByText("Bodufushi, JOALI Being, Raa Atoll, Maldives")).toBeInTheDocument();
    // 10 / 1000 shares = 1.0% (same pct() formatting as the qty step).
    expect(screen.getByTestId("buy-ownership")).toHaveTextContent("10 shares · 1.0% of the estate");
    // Slice 2: summary monthly matches the qty step (single presentation layer).
    expect(screen.getByTestId("buy-summary-monthly")).toHaveTextContent("$162.50");
    fireEvent.click(screen.getByTestId("buy-assumptions-toggle"));
    expect(screen.getByTestId("buy-assumptions-content")).toHaveTextContent(
      "Projection uses the estate's projected monthly income per share",
    );
    expect(screen.getByTestId("buy-assumptions-content")).toHaveTextContent(
      "Buy shares first, then lock them",
    );
    expect(screen.getByTestId("buy-assumptions-content")).toHaveTextContent(
      "Investment plans are not configured",
    );
  });

  it("summary step: values follow the listing, never Grand-specific figures", () => {
    useFees.mockReturnValue({ data: DEFAULT_FEE_TIERS, isLoading: false, isError: false });
    // D11 locked 2026-09-13: the pending reason assertion uses Chalet Montana
    // (re-130901, EUR mixed-currency — the remaining V1-unknown class).
    const unknownVilla: Listing = {
      ...listing,
      id: "re-130901",
      title: "Chalet Montana",
      location: "Kitzbühel, Austria",
      sharePriceUsd: 9500,
      monthlyYieldRate: 7.19,
      totalShares: 1600,
    };
    render(<BuySummaryStep listing={unknownVilla} qty={8} currency="TON" />);
    expect(screen.getByText("Chalet Montana")).toBeInTheDocument();
    expect(screen.getByText("Kitzbühel, Austria")).toBeInTheDocument();
    // 8 × $95.00 = $760.00 principal; $500–$2k tier (2.5%) → $19.00 fee.
    expect(screen.getByTestId("buy-fees")).toHaveTextContent("$19.00");
    expect(screen.getByTestId("buy-total")).toHaveTextContent("$779.00");
    expect(screen.getByTestId("buy-ownership")).toHaveTextContent("8 shares · 0.5% of the estate");
    fireEvent.click(screen.getByTestId("buy-assumptions-toggle"));
    expect(screen.getByTestId("buy-assumptions-content")).toHaveTextContent(
      "Projection uses the estate's projected monthly income per share",
    );
    // Chalet Montana (V1-unknown, EUR) shows pending, never a fixture figure.
    expect(screen.getByTestId("buy-summary-monthly")).toHaveTextContent("Data pending");
    // The pending state carries its human-readable reason.
    expect(screen.getByTestId("buy-summary-monthly")).toHaveTextContent(/EUR/);
  });

  it("summary step: no raw i18n keys leak into labels", () => {
    useFees.mockReturnValue({ data: DEFAULT_FEE_TIERS, isLoading: false, isError: false });
    const { container } = render(<BuySummaryStep listing={listing} qty={10} currency="TON" />);
    const text = container.textContent ?? "";
    for (const key of ["buySummaryTitle", "buySummaryProperty", "buyOwnership", "buyAssumptionsTitle", "totalLabel"]) {
      expect(text).not.toContain(key);
    }
  });

  it("summary step shows sticky error and pending copy", () => {
    const { rerender } = render(
      <BuySummaryStep listing={listing} qty={10} currency="TON" error="transaction rejected" />,
    );
    expect(screen.getByTestId("buy-summary-error")).toHaveTextContent(/transaction rejected/i);
    rerender(<BuySummaryStep listing={listing} qty={10} currency="TON" pending />);
    expect(screen.getByTestId("buy-pending")).toBeInTheDocument();
    expect(screen.getByText(/Confirming in your wallet/i)).toBeInTheDocument();
  });

  it("summary step: pending + verifying shows on-chain confirmation copy", () => {
    render(<BuySummaryStep listing={listing} qty={10} currency="TON" pending verifying />);
    expect(screen.getByTestId("buy-pending")).toHaveTextContent(/Confirming on blockchain/i);
  });

  it("success step: congrats message, disclaimer once, portfolio + share", () => {
    const onClose = vi.fn();
    render(
      <BuySuccessStep
        propertyTitle="Grand 2 BDM Ocean Pool Villa (JOALI Being)"
        qty={10}
        nowMs={Date.UTC(2026, 6, 22, 10, 0, 0)}
        onClose={onClose}
      />,
    );
    expect(screen.getByTestId("buy-success-message")).toHaveTextContent(
      /You now own 10 shares of Grand 2 BDM Ocean Pool Villa \(JOALI Being\)/,
    );
    expect(screen.getAllByText(DEMO_TX_DISCLAIMER).length).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: /view portfolio/i }));
    expect(onClose).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/portfolio");
    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
  });

  it("success step: no raw i18n keys leak into copy", () => {
    const { container } = render(
      <BuySuccessStep propertyTitle="Grand 2 BDM Ocean Pool Villa (JOALI Being)" qty={10} onClose={() => {}} />,
    );
    const text = container.textContent ?? "";
    for (const key of ["buySuccessTitle", "buySuccessMessage", "buySuccessNextPayout", "buySuccessEverySunday"]) {
      expect(text).not.toContain(key);
    }
    expect(screen.getByText(/Every Sunday/)).toBeInTheDocument();
  });

  it("BuySheet hosts the active step inside a dialog when open", () => {
    render(
      <BuySheet
        open
        onClose={() => {}}
        listing={listing}
        step="qty"
        qty={5}
        onQtyChange={() => {}}
        walletConnected
        currency="TON"
        onCurrencyChange={() => {}}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("buy-qty-step")).toBeInTheDocument();
  });
});
