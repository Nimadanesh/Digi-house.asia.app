import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useSettingsStore } from "@/stores/settings.store";
import { useUiStore } from "@/stores/ui.store";
import { DEMO_TX_DISCLAIMER, PAYOUT_DISCLAIMER } from "@/lib/constants";

const disconnect = vi.fn();
const push = vi.fn();
const backShow = vi.fn();
const backHide = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const backOnClick = vi.fn((..._args: unknown[]) => () => {});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock("@/hooks/useTonConnect", () => ({
  useTonConnect: () => ({
    connected: true,
    address: "EQabc",
    short: "EQab…xyz0",
    network: "testnet",
    openModal: vi.fn(),
    disconnect,
    restoring: false,
    send: vi.fn(),
  }),
}));

vi.mock("@/lib/telegram/haptics", () => ({
  haptics: {
    selection: vi.fn(),
    impact: vi.fn(),
    notification: vi.fn(),
  },
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
    useUiStore.setState({ settingsOpen: true, onboardingReplay: false });
    useSettingsStore.setState({
      displayCurrency: "usd",
      useTelegramTheme: false,
      onboarded: true,
      showDemoBadge: true,
      locale: null,
    });
  });

  it("renders wallet status and disconnect when connected", () => {
    render(<SettingsSheet />);
    expect(screen.getByTestId("settings-sheet")).toBeInTheDocument();
    expect(screen.getByText("EQab…xyz0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disconnect wallet/i })).toBeInTheDocument();
  });

  it("offers display currency USD / TON", () => {
    render(<SettingsSheet />);
    expect(screen.getByRole("radio", { name: "USD" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "TON" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "TON" }));
    expect(useSettingsStore.getState().displayCurrency).toBe("ton");
  });

  it("shows language row with Auto default and opens picker sheet", () => {
    render(<SettingsSheet />);
    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByTestId("language-selector")).toBeInTheDocument();
    expect(screen.getByTestId("language-current")).toHaveTextContent(/auto \(telegram\)/i);
    fireEvent.click(screen.getByTestId("language-selector"));
    expect(screen.getByTestId("language-picker-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("lang-option-auto")).toBeInTheDocument();
    expect(screen.getByTestId("lang-option-en")).toBeInTheDocument();
    expect(screen.getByTestId("lang-option-fa")).toBeInTheDocument();
    expect(screen.getByTestId("lang-option-zh")).toBeInTheDocument();
  });

  it("persists explicit locale choice from picker", () => {
    render(<SettingsSheet />);
    fireEvent.click(screen.getByTestId("language-selector"));
    fireEvent.click(screen.getByTestId("lang-option-fa"));
    expect(useSettingsStore.getState().locale).toBe("fa");
  });

  it("How DigiHouse Works sets onboarding replay and navigates", () => {
    render(<SettingsSheet />);
    fireEvent.click(screen.getByRole("button", { name: /how digihouse works/i }));
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

  it("shows a single demo-mode badge", () => {
    render(<SettingsSheet />);
    expect(screen.getByTestId("settings-demo-badge")).toHaveTextContent(/demo mode/i);
  });

  it("can toggle Show Demo badge off", () => {
    render(<SettingsSheet />);
    const sw = screen.getByRole("switch", { name: "Show Demo badge" });
    expect(sw).toHaveAttribute("aria-checked", "true");
    fireEvent.click(sw);
    expect(useSettingsStore.getState().showDemoBadge).toBe(false);
  });
});
