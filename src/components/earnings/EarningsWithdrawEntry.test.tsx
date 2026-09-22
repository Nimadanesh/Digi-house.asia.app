import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EarningsWithdrawEntry } from "@/components/earnings/EarningsWithdrawEntry";
import { useMeSummary } from "@/hooks/useLocks";
import { useAuthStore } from "@/stores/auth.store";

vi.mock("@/hooks/useLocks", () => ({
  useMeSummary: vi.fn(() => ({
    data: { balances: { investingUsd: 0, withdrawableUsd: 50_000 } },
  })),
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

describe("EarningsWithdrawEntry — sticky Withdraw bar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUserNoAddress();
    vi.mocked(useMeSummary).mockReturnValue({
      data: { balances: { investingUsd: 0, withdrawableUsd: 50_000 } },
    } as never);
  });

  function setScrollY(y: number) {
    Object.defineProperty(window, "scrollY", { value: y, writable: true, configurable: true });
  }

  it("shows the withdrawable balance and opens the existing withdrawal sheet", () => {
    render(<EarningsWithdrawEntry />);
    expect(screen.getByTestId("earnings-withdraw-block")).toBeInTheDocument();
    expect(screen.getByText("Withdraw")).toBeInTheDocument();
    expect(screen.getByTestId("withdrawable-balance")).toHaveTextContent("available: $500.00");

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

  it("stays hidden at the top and slides in past 1.5× hero height", () => {
    const heroRef = { current: { offsetHeight: 400 } as HTMLElement };
    setScrollY(0);
    render(<EarningsWithdrawEntry heroRef={heroRef} />);
    expect(screen.getByTestId("earnings-withdraw-entry")).toHaveClass("opacity-0");

    setScrollY(601);
    fireEvent.scroll(window);
    expect(screen.getByTestId("earnings-withdraw-entry")).toHaveClass("opacity-100");
    expect(screen.getByTestId("earnings-withdraw-entry")).not.toHaveClass("opacity-0");

    setScrollY(100);
    fireEvent.scroll(window);
    expect(screen.getByTestId("earnings-withdraw-entry")).toHaveClass("opacity-0");
  });

  it("disables the button when nothing is withdrawable", () => {
    vi.mocked(useMeSummary).mockReturnValue({
      data: { balances: { investingUsd: 0, withdrawableUsd: 0 } },
    } as never);
    render(<EarningsWithdrawEntry />);
    expect(screen.getByTestId("earnings-withdraw-row")).toBeDisabled();
  });
});