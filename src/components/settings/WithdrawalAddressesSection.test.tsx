"use client";
// File responsibility tested: address book add / delete / promote-to-primary; honest pills.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth.store";
import { useSettingsStore } from "@/stores/settings.store";
import { WithdrawalAddressesSection } from "@/components/settings/WithdrawalAddressesSection";
import { shortAddr } from "@/lib/format";

const ADDRESS = "EQHq2VsN7yKwTp8rUy4mL0kHbZ6sAeF4oVgB8uTr9pXkMdH5";
const EVM = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
const EVM2 = "0x0000000000000000000000000000000000000001";

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

describe("WithdrawalAddressesSection — multi-address book", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveAddress.mockResolvedValue(undefined);
    setUser();
    useSettingsStore.setState({ addressBook: [] });
  });

  it("shows the empty state when no primary exists", () => {
    render(<WithdrawalAddressesSection />);
    expect(screen.getByTestId("settings-addresses")).toBeInTheDocument();
    expect(screen.getByText("No address set")).toBeInTheDocument();
  });

  it("primary shows Edit + Copy actions and its network", () => {
    setUser({ withdrawalAddress: ADDRESS, withdrawalAddressVerified: true });
    render(<WithdrawalAddressesSection />);
    expect(
      screen.getByText(shortAddr(ADDRESS, { prefix: 6, suffix: 6 })),
    ).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("Primary")).toBeInTheDocument();
    expect(screen.getByText("TON")).toBeInTheDocument();
    expect(screen.getByTestId("settings-primary-edit")).toBeInTheDocument();
    expect(screen.getByTestId("settings-primary-copy")).toBeInTheDocument();
  });

  it("primary edit saves through saveAddress", () => {
    setUser({ withdrawalAddress: ADDRESS });
    render(<WithdrawalAddressesSection />);
    fireEvent.click(screen.getByTestId("settings-primary-edit"));
    fireEvent.change(screen.getByTestId("settings-primary-input"), {
      target: { value: ADDRESS },
    });
    fireEvent.click(screen.getByTestId("settings-primary-save"));
    expect(saveAddress).toHaveBeenCalledWith(ADDRESS);
  });

  it("adds an EVM address with its selected network", () => {
    render(<WithdrawalAddressesSection />);
    fireEvent.click(screen.getByTestId("settings-address-add"));
    fireEvent.change(screen.getByTestId("settings-address-input"), {
      target: { value: EVM },
    });
    fireEvent.change(screen.getByTestId("settings-address-network"), {
      target: { value: "ethereum" },
    });
    fireEvent.click(screen.getByTestId("settings-address-save"));
    expect(useSettingsStore.getState().addressBook).toEqual([
      { address: EVM, network: "ethereum" },
    ]);
    // Saved locally only — the account primary is untouched.
    expect(saveAddress).not.toHaveBeenCalled();
    expect(screen.getByText("Ethereum")).toBeInTheDocument();
  });

  it("blocks mismatched address/network pairs client-side", () => {
    render(<WithdrawalAddressesSection />);
    fireEvent.click(screen.getByTestId("settings-address-add"));
    fireEvent.change(screen.getByTestId("settings-address-input"), {
      target: { value: "not-an-address" },
    });
    fireEvent.click(screen.getByTestId("settings-address-save"));
    expect(screen.getByText("Enter a valid TON address")).toBeInTheDocument();
    expect(useSettingsStore.getState().addressBook).toHaveLength(0);
  });

  it("promotes a book entry to primary via saveAddress", () => {
    useSettingsStore.setState({
      addressBook: [{ address: EVM2, network: "ethereum" }],
    });
    render(<WithdrawalAddressesSection />);
    fireEvent.click(screen.getByText("Use as primary"));
    expect(saveAddress).toHaveBeenCalledWith(EVM2);
  });

  it("deletes a book entry without touching the account", () => {
    useSettingsStore.setState({
      addressBook: [{ address: EVM2, network: "ethereum" }],
    });
    render(<WithdrawalAddressesSection />);
    fireEvent.click(screen.getByLabelText("Delete address"));
    expect(useSettingsStore.getState().addressBook).toHaveLength(0);
    expect(saveAddress).not.toHaveBeenCalled();
  });
});
