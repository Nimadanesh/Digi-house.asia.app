import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WithdrawalRequestSheet } from "@/components/settings/WithdrawalRequestSheet";
import { useAuthStore } from "@/stores/auth.store";

const mutate = vi.fn();

vi.mock("@/hooks/useLocks", () => ({
  useMeSummary: () => ({ data: { balances: { investingUsd: 0, withdrawableUsd: 50_000 } } }),
}));

vi.mock("@/hooks/useWithdrawals", () => ({
  useRequestWithdrawal: () => ({ mutate, isPending: false, error: null }),
}));

vi.mock("@/lib/telegram/haptics", () => ({
  haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
}));

function setUser(withdrawalAddress: string | null) {
  useAuthStore.setState({
    user: {
      id: "user-42",
      displayName: "Test User",
      role: "investor",
      walletAddress: null,
      withdrawalAddress,
      withdrawalAddressVerified: false,
      onboarded: true,
      profileCompleted: true,
      useTelegramTheme: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  });
}

describe("WithdrawalRequestSheet — PE-08", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUser("EQHq2VsN7yKwTp8rUy4mL0kHbZ6sAeF4oVgB8uTr9pXkMdH5");
  });

  it("shows the withdrawable balance and payout address", () => {
    render(<WithdrawalRequestSheet open onClose={() => {}} />);
    expect(screen.getByText("Withdrawable")).toBeInTheDocument();
    expect(screen.getByText("$500.00")).toBeInTheDocument();
    expect(screen.getByText("Payout address")).toBeInTheDocument();
  });

  it("Max fills the withdrawable amount and submit sends cents", () => {
    render(<WithdrawalRequestSheet open onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("withdrawal-request-max"));
    // $500 → 50_000 cents
    expect(screen.getByTestId("withdrawal-request-amount")).toHaveValue(500);
    fireEvent.click(screen.getByTestId("withdrawal-request-submit"));
    expect(mutate).toHaveBeenCalledWith(
      { amountUsd: 50_000 },
      expect.any(Object),
    );
  });

  it("blocks an amount above the withdrawable balance", () => {
    render(<WithdrawalRequestSheet open onClose={() => {}} />);
    fireEvent.change(screen.getByTestId("withdrawal-request-amount"), {
      target: { value: "600" },
    });
    expect(
      screen.getByText("Maximum withdrawable is $500.00."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("withdrawal-request-submit"));
    expect(mutate).not.toHaveBeenCalled();
  });

  it("gates on a saved withdrawal address", () => {
    setUser(null);
    render(<WithdrawalRequestSheet open onClose={() => {}} />);
    expect(
      screen.getByText("Set a USDT withdrawal address first."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("withdrawal-request-submit")).toBeDisabled();
  });
});
