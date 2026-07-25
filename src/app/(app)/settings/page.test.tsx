import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/hooks/useTonConnect", () => ({
  useTonConnect: () => ({
    connected: false,
    address: null,
    short: "",
    network: "testnet",
    openModal: vi.fn(),
  }),
}));

import SettingsPage from "@/app/(app)/settings/page";
import { useSettingsStore } from "@/stores/settings.store";

describe("Settings page — honesty contract + theme toggle", () => {
  beforeEach(() => {
    // Reset the Zustand store between tests so useTelegramTheme starts deterministic:
    useSettingsStore.setState({ useTelegramTheme: false });
  });

  it("renders the PAYOUT_DISCLAIMER exactly once at the bottom (MVP honesty contract)", () => {
    render(<SettingsPage />);
    expect(screen.getAllByText("simulated weekly payout · on-chain verifiable post-MVP").length).toBe(1);
  });

  it("renders the three section labels: Wallet / Appearance / About", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Wallet")).toBeInTheDocument();
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
  });

  it("renders the theme Toggle with role=switch and the accessible name 'Use Telegram theme'", () => {
    render(<SettingsPage />);
    const sw = screen.getByRole("switch", { name: "Use Telegram theme" });
    expect(sw).toHaveAttribute("aria-checked", "false");
  });

  it("shows the wallet-connect affordance (not the badge) when disconnected", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Connect a TON wallet")).toBeInTheDocument();
  });
});