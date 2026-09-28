import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useUiStore } from "@/stores/ui.store";

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <span data-testid="img">{props.alt}</span>,
}));
vi.mock("@/hooks/useTelegramUser", () => ({
  useTelegramUser: () => ({ firstName: "Demo", photoUrl: undefined, isDemo: true }),
}));
const tonConnected = vi.hoisted(() => ({ value: false }));
const evmConnected = vi.hoisted(() => ({ value: false }));

vi.mock("@/hooks/useTonConnect", () => ({
  useTonConnect: () => ({
    connected: tonConnected.value,
    openModal: vi.fn(),
  }),
}));
vi.mock("@/hooks/useEvmWallet", () => ({
  useEvmWallet: () => ({ connected: evmConnected.value }),
}));
vi.mock("@/hooks/useTelegram", () => ({
  useTelegram: () => ({
    haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
  }),
}));

import { GlobalHeader } from "@/components/layout/GlobalHeader";

describe("GlobalHeader → Settings open", () => {
  beforeEach(() => {
    useUiStore.setState({ settingsOpen: false, walletChooserOpen: false });
    tonConnected.value = false;
    evmConnected.value = false;
  });

  it("settings button calls openSettings", () => {
    render(<GlobalHeader />);
    fireEvent.click(screen.getByTestId("global-settings-btn"));
    expect(useUiStore.getState().settingsOpen).toBe(true);
  });

  it("wallet button opens the chooser", () => {
    render(<GlobalHeader />);
    fireEvent.click(screen.getByTestId("global-wallet-btn"));
    expect(useUiStore.getState().walletChooserOpen).toBe(true);
  });

  it("wallet dot is dim when nothing is connected", () => {
    render(<GlobalHeader />);
    const dot = screen.getByTestId("global-wallet-dot");
    expect(dot).toHaveAttribute("data-connected", "false");
    expect(dot.getAttribute("class")).toContain("bg-muted-foreground/50");
  });

  it("wallet dot turns green on TON connect", () => {
    tonConnected.value = true;
    render(<GlobalHeader />);
    const dot = screen.getByTestId("global-wallet-dot");
    expect(dot).toHaveAttribute("data-connected", "true");
    expect(dot.getAttribute("class")).toContain("bg-success");
  });

  it("wallet dot turns green on EVM-only connect", () => {
    evmConnected.value = true;
    render(<GlobalHeader />);
    const dot = screen.getByTestId("global-wallet-dot");
    expect(dot).toHaveAttribute("data-connected", "true");
    expect(dot.getAttribute("class")).toContain("bg-success");
  });
});
