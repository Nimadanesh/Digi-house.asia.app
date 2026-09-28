"use client";
// File responsibility tested: global chooser host — store-driven open/close, TON picks
// → TonConnect modal, EVM picks → wagmi flow, TON disconnect behind confirm.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useUiStore } from "@/stores/ui.store";

const mocks = vi.hoisted(() => ({
  tonConnected: { value: false },
  openModal: vi.fn(),
  tonDisconnect: vi.fn(),
  evmConnectForWallet: vi.fn(),
  evmDisconnect: vi.fn(),
  evmState: {
    value: {
      address: null as string | null,
      short: "",
      connected: false,
      chainName: null as string | null,
      connecting: false,
      connectingTo: null as string | null,
      error: null as string | null,
      connectForWallet: null as unknown as (...args: unknown[]) => void,
      disconnect: null as unknown as () => void,
    },
  },
}));
mocks.evmState.value.connectForWallet = mocks.evmConnectForWallet;
mocks.evmState.value.disconnect = mocks.evmDisconnect;
const { tonConnected, openModal, tonDisconnect, evmConnectForWallet, evmDisconnect, evmState } =
  mocks;

vi.mock("@/hooks/useTonConnect", () => ({
  useTonConnect: () => ({
    connected: tonConnected.value,
    address: tonConnected.value ? "EQabc" : null,
    short: tonConnected.value ? "EQab…xyz0" : "",
    network: "testnet",
    openModal,
    disconnect: tonDisconnect,
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

import { WalletChooserHost } from "@/components/wallet/WalletChooserHost";

describe("WalletChooserHost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tonConnected.value = false;
    evmState.value = {
      address: null,
      short: "",
      connected: false,
      chainName: null,
      connecting: false,
      connectingTo: null,
      error: null,
      connectForWallet: evmConnectForWallet,
      disconnect: evmDisconnect,
    };
    useUiStore.setState({ walletChooserOpen: true });
  });

  it("TON picks close the chooser and open the TonConnect modal", () => {
    render(<WalletChooserHost />);
    fireEvent.click(screen.getByTestId("wallet-pick-tonkeeper"));
    expect(openModal).toHaveBeenCalledTimes(1);
    expect(useUiStore.getState().walletChooserOpen).toBe(false);
  });

  it("shows the connected TON account with a confirmed disconnect", async () => {
    tonConnected.value = true;
    tonDisconnect.mockResolvedValue(undefined);
    render(<WalletChooserHost />);
    expect(screen.getByTestId("wallet-connected-ton")).toHaveTextContent("EQab…xyz0");
    fireEvent.click(screen.getByTestId("wallet-disconnect-ton"));
    expect(screen.getByTestId("disconnect-confirm")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByTestId("disconnect-confirm-confirm"));
    });
    expect(tonDisconnect).toHaveBeenCalledTimes(1);
  });

  it("disconnects EVM directly without a confirm sheet", () => {
    evmState.value = {
      address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      short: "0x742d…f44e",
      connected: true,
      chainName: "Ethereum",
      connecting: false,
      connectingTo: null,
      error: null,
      connectForWallet: evmConnectForWallet,
      disconnect: evmDisconnect,
    };
    render(<WalletChooserHost />);
    fireEvent.click(screen.getByTestId("wallet-disconnect-evm"));
    expect(evmDisconnect).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("disconnect-confirm")).not.toBeInTheDocument();
  });
});
