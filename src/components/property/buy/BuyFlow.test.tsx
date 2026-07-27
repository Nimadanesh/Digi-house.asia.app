import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Listing } from "@/types/property";
import { BuySheet } from "@/components/property/buy/BuySheet";
import { BuyQtyStep } from "@/components/property/buy/BuyQtyStep";
import { BuySummaryStep } from "@/components/property/buy/BuySummaryStep";
import { BuySuccessStep } from "@/components/property/buy/BuySuccessStep";
import { DEMO_TX_DISCLAIMER } from "@/lib/constants";

const push = vi.fn();
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
      <BuyQtyStep listing={listing} qty={10} onQtyChange={onQty} walletConnected />,
    );
    expect(screen.getByTestId("buy-qty")).toHaveTextContent("10");
    fireEvent.click(screen.getByRole("button", { name: "25" }));
    expect(onQty).toHaveBeenCalledWith(25);
    fireEvent.click(screen.getByRole("button", { name: "Max" }));
    expect(onQty).toHaveBeenCalledWith(360);
    expect(screen.getByText(/Est\. weekly yield/i)).toBeInTheDocument();
    expect(screen.getByText(/Total/)).toBeInTheDocument();
  });

  it("qty step: disconnected prompts connect", () => {
    render(
      <BuyQtyStep listing={listing} qty={1} onQtyChange={() => {}} walletConnected={false} />,
    );
    expect(screen.getByRole("button", { name: /connect/i })).toBeInTheDocument();
  });

  it("summary step: property, qty, total, fees", () => {
    render(<BuySummaryStep listing={listing} qty={10} />);
    expect(screen.getByText("Order summary")).toBeInTheDocument();
    expect(screen.getByText("Marina Vista Apt 4B")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Fees")).toBeInTheDocument();
    expect(screen.getByTestId("buy-total")).toBeInTheDocument();
    expect(screen.getByText(/No hidden fees/i)).toBeInTheDocument();
  });

  it("summary step shows sticky error and pending copy", () => {
    const { rerender } = render(
      <BuySummaryStep listing={listing} qty={10} error="transaction rejected" />,
    );
    expect(screen.getByTestId("buy-summary-error")).toHaveTextContent(/transaction rejected/i);
    rerender(<BuySummaryStep listing={listing} qty={10} pending />);
    expect(screen.getByTestId("buy-pending")).toBeInTheDocument();
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
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("buy-qty-step")).toBeInTheDocument();
  });
});
