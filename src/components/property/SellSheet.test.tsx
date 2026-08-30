import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Listing } from "@/types/property";
import { SellSheet } from "@/components/property/SellSheet";
import { useUiStore } from "@/stores/ui.store";

const instantMutate = vi.fn();
const placeOrderMutate = vi.fn();
const instantMock = {
  mutate: instantMutate,
  isPending: false,
  isError: false,
  error: null as Error | null,
};
const placeOrderMock = {
  mutate: placeOrderMutate,
  isPending: false,
  isError: false,
  error: null as Error | null,
};

vi.mock("@/lib/telegram/haptics", () => ({
  haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
}));

vi.mock("@/hooks/useSells", () => ({
  useInstantSell: vi.fn(() => instantMock),
  usePlaceOrder: vi.fn(() => placeOrderMock),
}));

const listing: Listing = {
  id: "prop-x",
  title: "Villa One",
  location: "Y",
  description: "x",
  images: [],
  totalShares: 1000,
  sharePriceUsd: 12_000,
  status: "funding",
  ownerWalletAddress: "EQAtest",
  annualRentUsd: 500_000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 100,
  sharesRemaining: 900,
  fundingProgressRatio: 0.1,
  monthlyYieldRate: 6,
  totalValueUsd: 8_000_000,
  meta: {
    sizeSqm: 72,
    yearBuilt: 2019,
    propertyType: "Apartment",
    rentalStatus: "rented",
    leaseUntil: null,
    activeTenant: true,
    tokenizationDocUrl: "#",
  },
  rentalHistory: [],
};

function renderSheet(onClose = vi.fn()) {
  return render(
    <SellSheet open onClose={onClose} listing={listing} freeShares={10} avgCostUsd={12_000} />,
  );
}

describe("SellSheet — instant sell review → confirm → success", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    instantMock.isPending = false;
    instantMock.isError = false;
    instantMock.error = null;
    placeOrderMock.isPending = false;
    useUiStore.setState({ toast: null });
  });

  it("does not execute the sale before the review step", () => {
    renderSheet();
    expect(screen.queryByTestId("instant-sell-confirm")).not.toBeInTheDocument();
    expect(instantMutate).not.toHaveBeenCalled();
  });

  it("review step itemizes value, 7% fee and net proceeds", () => {
    renderSheet();
    fireEvent.click(screen.getByTestId("instant-sell-review"));
    expect(screen.getByText("Confirm instant sale")).toBeInTheDocument();
    expect(screen.getByText("Fee (7%)")).toBeInTheDocument();
    // 1 share × $120.00 − 7% = $111.60
    expect(screen.getByText("−$8.40")).toBeInTheDocument();
    expect(screen.getByText("$111.60")).toBeInTheDocument();
    expect(instantMutate).not.toHaveBeenCalled();
  });

  it("confirm sells: existing instant mutation with property + shares", () => {
    renderSheet();
    fireEvent.click(screen.getByTestId("instant-sell-review"));
    fireEvent.click(screen.getByTestId("instant-sell-confirm"));
    expect(instantMutate).toHaveBeenCalledWith(
      { propertyId: "prop-x", shares: 1 },
      expect.any(Object),
    );
  });

  it("pending disables confirm and shows Selling…", () => {
    const onClose = vi.fn();
    const view = renderSheet(onClose);
    // Enter review first (pending only exists once the sale is executing).
    fireEvent.click(screen.getByTestId("instant-sell-review"));
    instantMock.isPending = true;
    view.rerender(
      <SellSheet open onClose={onClose} listing={listing} freeShares={10} avgCostUsd={12_000} />,
    );
    const confirm = screen.getByTestId("instant-sell-confirm");
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveTextContent("Selling…");
    fireEvent.click(confirm);
    expect(instantMutate).not.toHaveBeenCalled();
  });

  it("success shows the completion state with the credited amount; Done closes", () => {
    instantMutate.mockImplementation((_input: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    const onClose = vi.fn();
    renderSheet(onClose);
    fireEvent.click(screen.getByTestId("instant-sell-review"));
    fireEvent.click(screen.getByTestId("instant-sell-confirm"));
    expect(screen.getByTestId("instant-sell-success")).toBeInTheDocument();
    expect(screen.getByText("Shares sold")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /done/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("error keeps the user in the review step with a retry path", () => {
    instantMutate.mockImplementation(() => {}); // success/failure of the retry is not the point here
    instantMock.isError = true;
    instantMock.error = new Error("Sale window closed");
    renderSheet();
    fireEvent.click(screen.getByTestId("instant-sell-review"));
    fireEvent.click(screen.getByTestId("instant-sell-confirm"));
    expect(screen.getByTestId("instant-sell-error")).toHaveTextContent("Sale window closed");
    expect(screen.getByTestId("instant-sell-confirm")).toBeEnabled();
  });
});

describe("SellSheet — custom price order placement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({ toast: null });
  });

  it("places the order directly (cancellable action) and confirms via toast", () => {
    placeOrderMutate.mockImplementation((_input: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    const onClose = vi.fn();
    renderSheet(onClose);
    fireEvent.click(screen.getByRole("button", { name: /sell custom price/i }));
    fireEvent.click(screen.getByTestId("custom-sell-confirm"));
    expect(placeOrderMutate).toHaveBeenCalledWith(
      { propertyId: "prop-x", side: "sell", priceUsd: 12_000, quantity: 1 },
      expect.any(Object),
    );
    expect(onClose).toHaveBeenCalled();
    expect(useUiStore.getState().toast?.title).toBe("Sell order placed");
  });
});
