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
  id: "prop-marina-vista-4b",
  title: "Marina Vista Apt 4B",
  location: "Dubai Marina, UAE",
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

  it("qty step: stepper, quick buttons, live total + weekly", () => {
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
    expect(screen.getByText(/Projected income \/ week/i)).toBeInTheDocument();
    expect(screen.getByText(/Total/)).toBeInTheDocument();
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

  it("summary step: property, qty, total, fees", () => {
    useFees.mockReturnValue({ data: DEFAULT_FEE_TIERS, isLoading: false, isError: false });
    render(<BuySummaryStep listing={listing} qty={10} currency="TON" />);
    expect(screen.getByText("Order summary")).toBeInTheDocument();
    expect(screen.getByText("Marina Vista Apt 4B")).toBeInTheDocument();
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
        propertyTitle="Marina Vista Apt 4B"
        qty={10}
        nowMs={Date.UTC(2026, 6, 22, 10, 0, 0)}
        onClose={onClose}
      />,
    );
    expect(screen.getByTestId("buy-success-message")).toHaveTextContent(
      /You now own 10 shares of Marina Vista Apt 4B/,
    );
    expect(screen.getAllByText(DEMO_TX_DISCLAIMER).length).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: /view portfolio/i }));
    expect(onClose).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/portfolio");
    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
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
