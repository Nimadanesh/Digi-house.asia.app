"use client";
// File responsibility tested: EVM facade mapping + connection lifecycle
// (repeat-tap no-op, switch resets, loser attempts go quiet, timeout, routing).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEvmWallet } from "@/hooks/useEvmWallet";

const WC = { id: "walletConnect" };
const MM = { id: "metaMaskSDK", uid: "mm-uid-1" };
const MM_NAMED = { id: "metaMask" };
const CB_SDK = { id: "coinbaseWalletSDK" };
const INJ = { id: "injected" };

const wagmiState = vi.hoisted(() => ({
  address: undefined as string | undefined,
  isConnected: false,
  connector: null as { id: string; uid?: string } | null,
  chainId: 1,
  connecting: false,
  connectError: null as Error | null,
  connectAsync: vi.fn(),
  disconnect: vi.fn(),
  disconnectAsync: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({
    address: wagmiState.address,
    isConnected: wagmiState.isConnected,
    connector: wagmiState.connector,
  }),
  useChainId: () => wagmiState.chainId,
  useChains: () => [{ id: 1, name: "Ethereum" }],
  useConnect: () => ({
    connectAsync: wagmiState.connectAsync,
    isPending: wagmiState.connecting,
    error: wagmiState.connectError,
    reset: wagmiState.reset,
  }),
  useDisconnect: () => ({
    disconnect: wagmiState.disconnect,
    disconnectAsync: wagmiState.disconnectAsync,
  }),
}));

const flags = vi.hoisted(() => ({ pair: true }));

vi.mock("@/lib/evm/config", async (importOriginal) => {
  const real =
    await importOriginal<typeof import("@/lib/evm/config")>();
  return {
    ...real,
    getEvmConfig: () => ({ connectors: [WC, MM_NAMED, MM, CB_SDK, INJ] }),
    canPairEvm: () => flags.pair,
  };
});

vi.mock("@/lib/evm/wallet-modal", () => ({
  openWalletConnectModal: vi.fn(),
  closeWalletConnectModal: vi.fn(),
}));

vi.mock("@/lib/telegram/haptics", () => ({
  haptics: { selection: vi.fn(), impact: vi.fn(), notification: vi.fn() },
}));

import { haptics } from "@/lib/telegram/haptics";

const successNotification = vi.mocked(haptics.notification);

describe("useEvmWallet — EVM facade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    wagmiState.address = undefined;
    wagmiState.isConnected = false;
    wagmiState.connector = null;
    wagmiState.chainId = 1;
    wagmiState.connecting = false;
    wagmiState.connectError = null;
    // mockReset (not just clear): drains once-queues so no stub leaks across tests.
    wagmiState.connectAsync.mockReset();
    wagmiState.connectAsync.mockResolvedValue(undefined);
    wagmiState.disconnectAsync.mockReset();
    wagmiState.disconnectAsync.mockResolvedValue(undefined);
    flags.pair = true;
    delete (window as unknown as Record<string, unknown>).ethereum;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports disconnected with no address", () => {
    const { result } = renderHook(() => useEvmWallet());
    expect(result.current.connected).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.chainName).toBeNull();
  });

  it("maps a connected account to short address + chain name", () => {
    wagmiState.address = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
    wagmiState.isConnected = true;
    const { result } = renderHook(() => useEvmWallet());
    expect(result.current.connected).toBe(true);
    expect(result.current.short).toBe("0x742d…f44e");
    expect(result.current.chainName).toBe("Ethereum");
  });

  it("repeat tap on the connected wallet is a no-op success (no reconnect)", async () => {
    wagmiState.address = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
    wagmiState.isConnected = true;
    wagmiState.connector = { id: "metaMask", uid: "mm-uid-9" };
    const { result } = renderHook(() => useEvmWallet());
    await act(async () => {
      result.current.connectWallet("metamask");
    });
    expect(wagmiState.connectAsync).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("switching wallets disconnects first (no stale-connector state)", async () => {
    wagmiState.address = "0xabc";
    wagmiState.isConnected = true;
    wagmiState.connector = { id: "metaMaskSDK", uid: "mm-uid-1" };
    const order: string[] = [];
    wagmiState.disconnectAsync.mockImplementation(async () => {
      order.push("disconnect");
    });
    wagmiState.connectAsync.mockImplementation(async () => {
      order.push("connect");
    });
    const { result } = renderHook(() => useEvmWallet());
    act(() => {
      result.current.connectForWallet("trust");
    });
    // EIP-6963 discovery window (350ms) runs before the handshake.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(order).toEqual(["disconnect", "connect"]);
  });

  it("a superseded attempt goes quiet (single success signal)", async () => {
    let resolveFirst!: () => void;
    const first = new Promise<void>((r) => {
      resolveFirst = r;
    });
    wagmiState.connectAsync
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useEvmWallet());
    let second!: Promise<void>;
    act(() => {
      void result.current.connectForWallet("trust");
      second = (async () => {
        result.current.connectForWallet("trust");
      })();
    });
    await act(async () => {
      await second;
      await new Promise((r) => setTimeout(r, 450));
    });
    await act(async () => {
      resolveFirst();
    });
    expect(
      successNotification.mock.calls.filter((c) => c[0] === "success"),
    ).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it("a hanging attempt times out with a clear error (no infinite connecting)", async () => {
    vi.useFakeTimers();
    wagmiState.connectAsync.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useEvmWallet());
    act(() => {
      result.current.connectForWallet("trust");
    });
    expect(result.current.connecting).toBe(true);
    await act(async () => {
      // Discovery window (350ms) + the 120s attempt timeout (async advancer
      // lets the discovery continuation run before the attempt timer).
      await vi.advanceTimersByTimeAsync(120_500);
    });
    expect(result.current.connecting).toBe(false);
    expect(result.current.error).toBe("timeout");
  });

  it("unannounced wallets fall back to WalletConnect QR (never a sibling extension)", async () => {
    (window as unknown as Record<string, unknown>).ethereum = {};
    const { result } = renderHook(() => useEvmWallet());
    act(() => {
      result.current.connectForWallet("trust");
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(wagmiState.connectAsync).toHaveBeenCalledWith(
      expect.objectContaining({ connector: WC }),
    );
    delete (window as unknown as Record<string, unknown>).ethereum;
  });

  it("other EVM wallets go straight to WalletConnect QR (never generic injected)", async () => {
    // Even with an extension present, Rainbow must NOT resolve to the shared
    // injected entry (that opens whichever wallet owns window.ethereum).
    (window as unknown as Record<string, unknown>).ethereum = {};
    const { result } = renderHook(() => useEvmWallet());
    act(() => {
      result.current.connectForWallet("rainbow");
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(wagmiState.connectAsync).toHaveBeenCalledWith(
      expect.objectContaining({ connector: WC }),
    );
    delete (window as unknown as Record<string, unknown>).ethereum;
  });

  it("routes the announced Trust provider (never a sibling extension)", async () => {
    const trustProvider = { request: vi.fn() };
    const { result } = renderHook(() => useEvmWallet());
    act(() => {
      result.current.connectForWallet("trust");
    });
    // EIP-6963 answer arrives while discovery listens (350ms window).
    window.dispatchEvent(
      new CustomEvent("mipd#announceProvider", {
        detail: {
          info: { rdns: "com.trustwallet.app", name: "Trust Wallet" },
          provider: trustProvider,
        },
      }),
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(wagmiState.connectAsync).toHaveBeenCalledTimes(1);
    const target = wagmiState.connectAsync.mock.calls[0]?.[0]?.connector;
    expect(typeof target).toBe("function");
    expect(result.current.error).toBeNull();
  });

  it("falls back to WalletConnect QR without an extension", async () => {
    const { result } = renderHook(() => useEvmWallet());
    act(() => {
      result.current.connectForWallet("trust");
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(wagmiState.connectAsync).toHaveBeenCalledWith(
      expect.objectContaining({ connector: WC }),
    );
  });

  it("missing extension provider falls back to QR instead of hanging", async () => {
    (window as unknown as Record<string, unknown>).ethereum = {};
    const err = new Error("ProviderNotFoundError: no provider");
    Object.defineProperty(err, "name", { value: "ProviderNotFoundError" });
    wagmiState.connectAsync
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useEvmWallet());
    act(() => {
      result.current.connectForWallet("metamask");
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 450));
    });
    expect(wagmiState.connectAsync).toHaveBeenCalledTimes(2);
    expect(wagmiState.connectAsync.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({ connector: WC }),
    );
    expect(result.current.error).toBeNull();
    delete (window as unknown as Record<string, unknown>).ethereum;
  });

  it("connectWallet routes through the resolved connector", async () => {
    const { result } = renderHook(() => useEvmWallet());
    await act(async () => {
      result.current.connectWallet("walletconnect");
    });
    expect(wagmiState.connectAsync).toHaveBeenCalledTimes(1);
  });

  it("disconnect delegates to wagmi", () => {
    const { result } = renderHook(() => useEvmWallet());
    act(() => {
      result.current.disconnect();
    });
    expect(wagmiState.disconnect).toHaveBeenCalledTimes(1);
  });

  it("MetaMask taps use the official SDK connector (never a sibling)", async () => {
    (window as unknown as Record<string, unknown>).ethereum = {};
    const { result } = renderHook(() => useEvmWallet());
    act(() => {
      result.current.connectForWallet("metamask");
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(wagmiState.connectAsync).toHaveBeenCalledWith(
      expect.objectContaining({ connector: expect.objectContaining({ id: "metaMaskSDK" }) }),
    );
    delete (window as unknown as Record<string, unknown>).ethereum;
  });

  it("Coinbase taps use the official SDK connector", async () => {
    (window as unknown as Record<string, unknown>).ethereum = {};
    const { result } = renderHook(() => useEvmWallet());
    act(() => {
      result.current.connectForWallet("coinbase");
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(wagmiState.connectAsync).toHaveBeenCalledWith(
      expect.objectContaining({ connector: expect.objectContaining({ id: "coinbaseWalletSDK" }) }),
    );
    delete (window as unknown as Record<string, unknown>).ethereum;
  });

  it("every tap resets wagmi mutation state first (no stuck connecting)", async () => {
    const { result } = renderHook(() => useEvmWallet());
    act(() => {
      result.current.connectForWallet("trust");
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(wagmiState.reset).toHaveBeenCalled();
  });

  it("shows which wallet is being connected", async () => {
    const { result } = renderHook(() => useEvmWallet());
    act(() => {
      result.current.connectForWallet("trust", "Trust Wallet");
    });
    expect(result.current.connectingTo).toBe("Trust Wallet");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(result.current.connectingTo).toBeNull();
  });
});
