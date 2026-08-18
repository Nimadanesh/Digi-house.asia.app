import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth.store";
import { WithdrawalAddressSection } from "@/components/settings/WithdrawalAddressSection";
import { shortAddr } from "@/lib/format";

const ADDRESS = "EQHq2VsN7yKwTp8rUy4mL0kHbZ6sAeF4oVgB8uTr9pXkMdH5";

const saveAddress = vi.fn();

vi.mock("@/hooks/useWithdrawalAddress", () => ({
  useWithdrawalAddress: () => ({ saveAddress, pending: false, error: null }),
}));

vi.mock("@/lib/telegram/haptics", () => ({
  haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
}));

function setUser(over: {
  withdrawalAddress?: string | null;
  withdrawalAddressVerified?: boolean;
} = {}) {
  useAuthStore.setState({
    user: {
      id: "user-42",
      displayName: "Test User",
      role: "investor",
      walletAddress: null,
      withdrawalAddress: over.withdrawalAddress ?? null,
      withdrawalAddressVerified: over.withdrawalAddressVerified ?? false,
      onboarded: true,
      profileCompleted: true,
      useTelegramTheme: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  });
}

describe("WithdrawalAddressSection — PE-01", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveAddress.mockResolvedValue(undefined);
    setUser();
  });

  it("shows the empty state with a Not verified pill", () => {
    render(<WithdrawalAddressSection />);
    expect(screen.getByText("USDT withdrawal address")).toBeInTheDocument();
    expect(screen.getByText("No address set")).toBeInTheDocument();
    expect(screen.getByText("Not verified")).toBeInTheDocument();
  });

  it("shows the shortened saved address and Verified pill when verified", () => {
    setUser({ withdrawalAddress: ADDRESS, withdrawalAddressVerified: true });
    render(<WithdrawalAddressSection />);
    expect(
      screen.getByText(shortAddr(ADDRESS, { prefix: 6, suffix: 6 })),
    ).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.queryByText("Not verified")).not.toBeInTheDocument();
  });

  it("saves a valid address from the edit form", () => {
    render(<WithdrawalAddressSection />);
    fireEvent.click(screen.getByTestId("settings-withdrawal-edit"));
    fireEvent.change(screen.getByTestId("settings-withdrawal-address"), {
      target: { value: ADDRESS },
    });
    fireEvent.click(screen.getByTestId("settings-withdrawal-save"));
    expect(saveAddress).toHaveBeenCalledWith(ADDRESS);
  });

  it("blocks clearly-invalid input client-side and shows the error", () => {
    render(<WithdrawalAddressSection />);
    fireEvent.click(screen.getByTestId("settings-withdrawal-edit"));
    fireEvent.change(screen.getByTestId("settings-withdrawal-address"), {
      target: { value: "not-an-address" },
    });
    fireEvent.click(screen.getByTestId("settings-withdrawal-save"));
    expect(screen.getByText("Enter a valid TON address")).toBeInTheDocument();
    expect(saveAddress).not.toHaveBeenCalled();
  });

  it("surfaces the server-side error message when the save fails", async () => {
    saveAddress.mockRejectedValue(new Error("invalid TON address"));
    render(<WithdrawalAddressSection />);
    fireEvent.click(screen.getByTestId("settings-withdrawal-edit"));
    fireEvent.change(screen.getByTestId("settings-withdrawal-address"), {
      target: { value: ADDRESS },
    });
    fireEvent.click(screen.getByTestId("settings-withdrawal-save"));
    expect(await screen.findByText("invalid TON address")).toBeInTheDocument();
  });

  it("cancel closes the form without saving", () => {
    render(<WithdrawalAddressSection />);
    fireEvent.click(screen.getByTestId("settings-withdrawal-edit"));
    expect(screen.getByTestId("settings-withdrawal-form")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("settings-withdrawal-cancel"));
    expect(
      screen.queryByTestId("settings-withdrawal-form"),
    ).not.toBeInTheDocument();
    expect(saveAddress).not.toHaveBeenCalled();
  });
});