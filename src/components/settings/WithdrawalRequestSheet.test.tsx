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
    mutate.mockImplementation(() => {});
    setUser("EQHq2VsN7yKwTp8rUy4mL0kHbZ6sAeF4oVgB8uTr9pXkMdH5");
  });

  it("shows the withdrawable balance and payout address", () => {
    render(<WithdrawalRequestSheet open onClose={() => {}} />);
    expect(screen.getByText("Withdrawable")).toBeInTheDocument();
    expect(screen.getByText("$500.00")).toBeInTheDocument();
    expect(screen.getByText("Payout address")).toBeInTheDocument();
  });

  it("Max fills the amount; review itemizes the 1% fee and net before any mutation", () => {
    render(<WithdrawalRequestSheet open onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("withdrawal-request-max"));
    // $500 → 50_000 cents
    expect(screen.getByTestId("withdrawal-request-amount")).toHaveValue(500);

    // Form submit only advances to the review step — no mutation yet.
    fireEvent.click(screen.getByTestId("withdrawal-request-submit"));
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByTestId("withdrawal-request-confirm")).toBeInTheDocument();
    expect(screen.getByText("Fee (1%)")).toBeInTheDocument();
    expect(screen.getByText("−$5.00")).toBeInTheDocument();
    expect(screen.getByText("$495.00")).toBeInTheDocument();
    expect(screen.getByText("4 weekly installments")).toBeInTheDocument();

    // Confirming executes the same mutation contract as before.
    fireEvent.click(screen.getByTestId("withdrawal-request-confirm"));
    expect(mutate).toHaveBeenCalledWith(
      { amountUsd: 50_000 },
      expect.any(Object),
    );
  });

  it("success shows the completion state; Done closes the sheet", () => {
    mutate.mockImplementation((_input: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    const onClose = vi.fn();
    render(<WithdrawalRequestSheet open onClose={onClose} />);
    fireEvent.click(screen.getByTestId("withdrawal-request-max"));
    fireEvent.click(screen.getByTestId("withdrawal-request-submit"));
    fireEvent.click(screen.getByTestId("withdrawal-request-confirm"));
    expect(screen.getByTestId("withdrawal-request-success")).toBeInTheDocument();
    expect(screen.getByText("Withdrawal requested")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("withdrawal-request-done"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("blocks an amount above the withdrawable balance before the review step", () => {
    render(<WithdrawalRequestSheet open onClose={() => {}} />);
    fireEvent.change(screen.getByTestId("withdrawal-request-amount"), {
      target: { value: "600" },
    });
    expect(
      screen.getByText("Maximum withdrawable is $500.00."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("withdrawal-request-submit"));
    expect(screen.queryByTestId("withdrawal-request-confirm")).not.toBeInTheDocument();
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

  it("back from review keeps the entered amount and does not mutate", () => {
    render(<WithdrawalRequestSheet open onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("withdrawal-request-max"));
    fireEvent.click(screen.getByTestId("withdrawal-request-submit"));
    fireEvent.click(screen.getByTestId("withdrawal-request-back"));
    expect(screen.getByTestId("withdrawal-request-amount")).toHaveValue(500);
    expect(mutate).not.toHaveBeenCalled();
  });
});
