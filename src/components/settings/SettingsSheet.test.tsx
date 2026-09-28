import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useSettingsStore } from "@/stores/settings.store";
import { useUiStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { DEMO_TX_DISCLAIMER, PAYOUT_DISCLAIMER } from "@/lib/constants";

const disconnect = vi.fn();
const push = vi.fn();
const replace = vi.fn();
const backShow = vi.fn();
const backHide = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const backOnClick = vi.fn((..._args: unknown[]) => () => {});
const tonConnected = vi.hoisted(() => ({ value: true }));
const evmState = vi.hoisted(() => ({
  value: {
    address: null as string | null,
    short: "",
    connected: false,
    chainName: null as string | null,
    connecting: false,
    error: null as string | null,
    ready: false,
    connectWallet: vi.fn(),
    disconnect: vi.fn(),
    clearError: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

vi.mock("@/hooks/useTonConnect", () => ({
  useTonConnect: () => ({
    connected: tonConnected.value,
    address: tonConnected.value ? "EQabc" : null,
    short: tonConnected.value ? "EQab…xyz0" : "",
    network: "testnet",
    openModal: vi.fn(),
    disconnect,
    restoring: false,
    send: vi.fn(),
  }),
}));

vi.mock("@/hooks/useEvmWallet", () => ({
  useEvmWallet: () => evmState.value,
}));

vi.mock("@/lib/telegram/haptics", () => ({
  haptics: {
    selection: vi.fn(),
    impact: vi.fn(),
    notification: vi.fn(),
  },
}));

vi.mock("@/hooks/useRecoveryCode", () => ({
  useRecoveryCode: () => ({
    code: "DH-TEST-SEED",
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/telegram/chrome", () => ({
  safeBackButton: {
    show: () => backShow(),
    hide: () => backHide(),
    onClick: (fn: () => void) => backOnClick(fn),
  },
  safeMainButton: {
    setParams: vi.fn(),
    hide: vi.fn(),
    onClick: () => () => {},
  },
}));

import { SettingsSheet } from "@/components/settings/SettingsSheet";

describe("SettingsSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tonConnected.value = true;
    evmState.value = {
      address: null,
      short: "",
      connected: false,
      chainName: null,
      connecting: false,
      error: null,
      ready: false,
      connectWallet: vi.fn(),
      disconnect: vi.fn(),
      clearError: vi.fn(),
    };
    useUiStore.setState({ settingsOpen: true, onboardingReplay: false });
    useSettingsStore.setState({
      displayCurrency: "usd",
      useTelegramTheme: false,
      onboarded: true,
      showDemoBadge: true,
      locale: null,
    });
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
  });

  it("Help & Legal offers a link-only transaction history (no list here)", () => {
    render(<SettingsSheet />);
    fireEvent.click(screen.getByTestId("settings-transaction-history"));
    expect(push).toHaveBeenCalledWith("/transactions");
    expect(screen.queryByTestId("withdrawal-requests")).not.toBeInTheDocument();
  });

  it("disconnected state is status-only: hint text, no connect button (chooser lives on Home)", () => {
    tonConnected.value = false;
    render(<SettingsSheet />);
    expect(screen.getByTestId("settings-wallet-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("settings-connect")).not.toBeInTheDocument();
    expect(screen.queryByTestId("wallet-chooser")).not.toBeInTheDocument();
  });

  it("shows the connected EVM address + network as status (disconnect lives in the chooser)", () => {
    tonConnected.value = false;
    evmState.value = {
      address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      short: "0x742d…f44e",
      connected: true,
      chainName: "Ethereum",
      connecting: false,
      error: null,
      ready: true,
      connectWallet: vi.fn(),
      disconnect: vi.fn(),
      clearError: vi.fn(),
    };
    render(<SettingsSheet />);
    expect(screen.getByText("0x742d…f44e")).toBeInTheDocument();
    expect(screen.getByText("Ethereum")).toBeInTheDocument();
    expect(screen.queryByTestId("settings-evm-disconnect")).not.toBeInTheDocument();
  });

  it("surfaces EVM setup guidance instead of crashing without a Project ID", () => {
    tonConnected.value = false;
    evmState.value = {
      address: null,
      short: "",
      connected: false,
      chainName: null,
      connecting: false,
      error: "setup",
      ready: false,
      connectWallet: vi.fn(),
      disconnect: vi.fn(),
      clearError: vi.fn(),
    };
    render(<SettingsSheet />);
    expect(screen.getByTestId("settings-evm-error")).toHaveTextContent(
      "WalletConnect Project ID",
    );
  });

  it("renders wallet status without a disconnect button when connected", () => {
    render(<SettingsSheet />);
    expect(screen.getByTestId("settings-sheet")).toBeInTheDocument();
    expect(screen.getByText("EQab…xyz0")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /disconnect wallet/i })).not.toBeInTheDocument();
  });

  it("Preferences keeps language and theme (no currency switcher)", () => {
    render(<SettingsSheet />);
    expect(screen.getByTestId("language-selector")).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "USD" })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "TON" })).not.toBeInTheDocument();
  });

  it("shows language row with Auto default and opens picker in configured order", () => {
    render(<SettingsSheet />);
    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByTestId("language-selector")).toBeInTheDocument();
    expect(screen.getByTestId("language-current")).toHaveTextContent(/auto \(telegram\)/i);
    fireEvent.click(screen.getByTestId("language-selector"));
    expect(screen.getByTestId("language-picker-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("language-picker-list")).toBeInTheDocument();
    const options = screen.getAllByTestId(/^lang-option-/);
    // Auto first, then LOCALES: en, ar, ru, de, tr, fr, es, pt, zh, hi, fa, id
    expect(options.map((el) => el.getAttribute("data-testid"))).toEqual([
      "lang-option-auto",
      "lang-option-en",
      "lang-option-ar",
      "lang-option-ru",
      "lang-option-de",
      "lang-option-tr",
      "lang-option-fr",
      "lang-option-es",
      "lang-option-pt",
      "lang-option-zh",
      "lang-option-hi",
      "lang-option-fa",
      "lang-option-id",
    ]);
  });

  it("persists explicit locale choice from picker", () => {
    render(<SettingsSheet />);
    fireEvent.click(screen.getByTestId("language-selector"));
    fireEvent.click(screen.getByTestId("lang-option-fa"));
    expect(useSettingsStore.getState().locale).toBe("fa");
  });

  it("How FractionalLuxe Works sets onboarding replay and navigates", () => {
    render(<SettingsSheet />);
    fireEvent.click(screen.getByRole("button", { name: /how fractionalluxe works/i }));
    expect(useUiStore.getState().onboardingReplay).toBe(true);
    expect(useUiStore.getState().settingsOpen).toBe(false);
    expect(push).toHaveBeenCalledWith("/onboarding");
  });

  it("opens About / Legal nested sheet with disclaimer once", () => {
    render(<SettingsSheet />);
    fireEvent.click(screen.getByRole("button", { name: /about \/ legal/i }));
    expect(screen.getByTestId("about-legal-sheet")).toBeInTheDocument();
    expect(screen.getByText(DEMO_TX_DISCLAIMER)).toBeInTheDocument();
    expect(screen.getAllByText(PAYOUT_DISCLAIMER).length).toBe(1);
  });

  it("Telegram BackButton is shown while open", () => {
    render(<SettingsSheet />);
    expect(backShow).toHaveBeenCalled();
  });

  it("Sign out opens confirmation then signs out and routes to onboarding", () => {
    render(<SettingsSheet />);
    fireEvent.click(screen.getByTestId("settings-sign-out"));
    expect(screen.getByTestId("sign-out-confirm")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("sign-out-confirm-submit"));
    expect(useUiStore.getState().settingsOpen).toBe(false);
    expect(useSettingsStore.getState().onboarded).toBe(false);
    expect(replace).toHaveBeenCalledWith("/onboarding");
  });

  it("Sign out cancel closes confirmation without signing out", () => {
    render(<SettingsSheet />);
    fireEvent.click(screen.getByTestId("settings-sign-out"));
    fireEvent.click(screen.getByTestId("sign-out-confirm-cancel"));
    expect(screen.queryByTestId("sign-out-confirm")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("Back closes the nested language sheet first; Settings stays open", () => {
    render(<SettingsSheet />);
    fireEvent.click(screen.getByTestId("language-selector"));
    expect(screen.getByTestId("language-picker-sheet")).toBeInTheDocument();
    // Latest registered Telegram BackButton handler = the unified stack handler.
    const back = backOnClick.mock.calls.at(-1)?.[0] as (() => void) | undefined;
    act(() => {
      back?.();
    });
    expect(screen.queryByTestId("language-picker-sheet")).not.toBeInTheDocument();
    expect(screen.getByTestId("settings-sheet")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("no disconnect flow lives in Settings anymore (moved to the wallet chooser)", () => {
    render(<SettingsSheet />);
    expect(screen.queryByTestId("settings-disconnect")).not.toBeInTheDocument();
    expect(screen.queryByTestId("disconnect-confirm")).not.toBeInTheDocument();
    expect(disconnect).not.toHaveBeenCalled();
  });
});
