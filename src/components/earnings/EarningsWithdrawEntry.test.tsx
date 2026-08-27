import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EarningsWithdrawEntry } from "@/components/earnings/EarningsWithdrawEntry";
import { useAuthStore } from "@/stores/auth.store";

vi.mock("@/hooks/useLocks", () => ({
  useMeSummary: () => ({
    data: { balances: { investingUsd: 0, withdrawableUsd: 50_000 } },
  }),
}));

vi.mock("@/hooks/useWithdrawals", () => ({
  useRequestWithdrawal: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    variables: null,
  }),
}));

function setUserNoAddress() {
  useAuthStore.setState({
    user: {
      id: "user-42",
      displayName: "Test User",
      role: "investor",
      walletAddress: null,
      withdrawalAddress: null,
      withdrawalAddressVerified: false,
      onboarded: true,
      profileCompleted: true,
      useTelegramTheme: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  });
}

describe("EarningsWithdrawEntry — secondary Withdraw entry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUserNoAddress();
  });

  it("shows the withdrawable balance and opens the existing withdrawal sheet", () => {
    render(<EarningsWithdrawEntry />);
    expect(screen.getByTestId("earnings-withdraw-block")).toBeInTheDocument();
    expect(screen.getByText("Withdraw to your wallet")).toBeInTheDocument();
    expect(screen.getByTestId("withdrawable-balance")).toHaveTextContent("$500.00");

    fireEvent.click(screen.getByTestId("earnings-withdraw-row"));
    // Reuses the existing WithdrawalRequestSheet flow.
    expect(screen.getByTestId("withdrawal-request-sheet")).toBeInTheDocument();
  });

  it("surfaces the no-address gate inside the sheet until a payout address is saved", () => {
    render(<EarningsWithdrawEntry />);
    fireEvent.click(screen.getByTestId("earnings-withdraw-row"));
    expect(
      screen.getByText("Set a USDT withdrawal address first."),
    ).toBeInTheDocument();
  });
});