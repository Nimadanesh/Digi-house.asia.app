"use client";
// File responsibility: the ONLY EVM surface area components may call.
// Hard boundary (same rule as useTonConnect): components import useEvmWallet,
// never wagmi/viem directly. Wraps wagmi v2 account/connect/disconnect plus the
// WalletConnect QR modal for mobile pairing. Lifecycle guarantees:
// - repeat taps on the connected wallet are a no-op success (wagmi throws
//   ConnectorAlreadyConnectedError otherwise);
// - switching wallets disconnects first (no stale-connector state);
// - a newer tap supersedes a pending attempt (no pileups, no leaked listeners);
// - every attempt carries a timeout so pairing can never hang forever.
// Empty Project ID = clear setup message instead of a crash.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useChains } from "wagmi";
import {
  findConnector,
  canPairEvm,
  getEvmConfig,
  resolveEvmTarget,
  type EvmConnectorKind,
  type EvmTarget,
} from "@/lib/evm/config";
import { openWalletConnectModal, closeWalletConnectModal } from "@/lib/evm/wallet-modal";
import { evmDebug } from "@/lib/evm/debug";
import { haptics } from "@/lib/telegram/haptics";

export interface EvmWalletState {
  address: string | null;
  short: string;
  connected: boolean;
  /** Human chain name (e.g. "Ethereum") or null while disconnected. */
  chainName: string | null;
  connecting: boolean;
  /** Display name of the wallet being connected, while an attempt is live. */
  connectingTo: string | null;
  /** User-facing error (setup/connect failures); null when healthy. */
  error: string | null;
  /** True when EVM pairing is configured (Project ID present). */
  ready: boolean;
  connectWallet: (kind: EvmConnectorKind) => void;
  /** Extension-aware connect for a registry wallet id (injected-first, QR fallback). */
  connectForWallet: (walletId: string, label?: string) => void;
  disconnect: () => void;
  clearError: () => void;
}

/** QR pairing gives the user two minutes before we call it stuck. */
const ATTEMPT_TIMEOUT_MS = 120_000;

function shortAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

type QrSub = { provider: { removeListener?: (event: string, cb: (uri: string) => void) => void }; handler: (uri: string) => void } | null;

export function useEvmWallet(): EvmWalletState {
  const config = getEvmConfig();
  const account = useAccount();
  const chainId = useChainId();
  const chains = useChains();
  const { connectAsync, reset, isPending: wagmiPending, error: connectError } = useConnect();
  const { disconnect, disconnectAsync } = useDisconnect();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const attemptRef = useRef(0);
  const qrSub = useRef<QrSub>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const address = account.address ?? null;
  const connected = account.isConnected && address != null;
  const chainName = useMemo(
    () => chains.find((c) => c.id === chainId)?.name ?? null,
    [chains, chainId],
  );

  const clearQr = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const sub = qrSub.current;
    qrSub.current = null;
    if (sub) {
      try {
        sub.provider.removeListener?.("display_uri", sub.handler);
      } catch {
        /* ignore */
      }
    }
    void closeWalletConnectModal();
  }, []);

  // Close the QR modal once pairing resolves either way.
  useEffect(() => {
    if (account.isConnected || connectError) {
      clearQr();
    }
  }, [account.isConnected, connectError, clearQr]);

  // Surface wagmi connect errors in user-facing form (derived, never mirrored state).
  const wagmiError = connectError
    ? connectError instanceof Error
      ? connectError.message
      : "Connection failed"
    : null;

  const runTargetRef = useRef<(target: EvmTarget | Promise<EvmTarget>, label?: string) => void>(
    () => {},
  );
  const runTarget = useCallback(
    (target: EvmTarget | Promise<EvmTarget>, label?: string) => {
      // Step A — cancel anything pending and start completely fresh: new
      // attempt id, wagmi mutation reset (a stuck isPending can never survive
      // a new tap), QR torn down, error cleared.
      const id = ++attemptRef.current;
      const alive = () => attemptRef.current === id;
      reset();
      clearQr();
      setError(null);
      setBusy(true);
      setConnectingTo(label ?? null);

      const timerSet = () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          if (!alive()) return;
          attemptRef.current++;
          clearQr();
          setBusy(false);
          setConnectingTo(null);
          setError("timeout");
          evmDebug("attempt timed out", { id });
          void haptics.notification("error");
        }, ATTEMPT_TIMEOUT_MS);
      };

      const drive = (t: EvmTarget) => {
        evmDebug("attempt started", {
          id,
          targetId: t.type === "unavailable" ? "unavailable" : t.id,
          targetType: t.type,
          connected,
          currentConnector: account.connector?.id ?? null,
        });
        if (t.type === "unavailable") {
          setBusy(false);
          setConnectingTo(null);
          setError("setup");
          evmDebug("attempt unavailable — no pairable path", { id });
          return;
        }

        // Repeat taps on the connected wallet are a no-op success — wagmi would
        // otherwise throw ConnectorAlreadyConnectedError on the second click.
        if (connected && account.connector?.id === t.id) {
          setBusy(false);
          setConnectingTo(null);
          evmDebug("already connected to target — no-op success", { id, target: t.id });
          void haptics.notification("success");
          return;
        }

        timerSet();

        // Mobile QR pairing needs the display_uri subscription (showQrModal is
        // false — we render QR through our own modal). Narrowed here so the
        // connector instance below typechecks for both target variants.
        const qrConnector =
          t.type === "connector" && t.id === findConnector(config, "walletconnect")?.id
            ? t.connector
            : null;

        void (async () => {
          try {
            // Step B — an active connection is fully cleared before the new
            // handshake (never reuse the previous connector).
            if (connected) {
              evmDebug("disconnecting previous connector before switch", {
                id,
                from: account.connector?.id ?? null,
                to: t.id,
              });
              try {
                await disconnectAsync();
                evmDebug("previous connector disconnected", { id });
              } catch {
                /* best-effort reset; the fresh handshake decides */
              }
              reset();
              if (!alive()) return;
            }
            // Mobile QR pairing: the walletConnect connector emits display_uri
            // (showQrModal is false — we render it through our own modal).
            if (qrConnector) {
              try {
                const provider = (await qrConnector.getProvider()) as unknown as {
                  on: (event: string, cb: (uri: string) => void) => void;
                  removeListener?: (event: string, cb: (uri: string) => void) => void;
                };
                const onUri = (uri: string) => {
                  if (alive()) void openWalletConnectModal(uri);
                };
                qrSub.current = { provider, handler: onUri };
                provider.on("display_uri", onUri);
              } catch {
                /* provider subscription is best-effort; connect proceeds */
              }
            }
            evmDebug("calling connectAsync", { id, target: t.id });
            const connectorArg =
              t.type === "connector" ? t.connector : t.create;
            await connectAsync({ connector: connectorArg });
            if (!alive()) return;
            evmDebug("connectAsync resolved", { id, target: t.id });
            void haptics.notification("success");
          } catch (e) {
            if (!alive()) return;
            const msg = e instanceof Error ? e.message : "";
            evmDebug("connectAsync threw", { id, target: t.id, message: msg });
            // wagmi race guard (belt-and-braces next to the pre-check above).
            if (/already connected/i.test(msg)) return;
            // No extension for an injected target → fall back to QR pairing.
            if (/ProviderNotFound|no provider|not found|not installed|not detected/i.test(msg)) {
              const wc = findConnector(config, "walletconnect");
              if (wc && t.id !== wc.id) {
                evmDebug("provider missing — falling back to WalletConnect QR", { id });
                runTargetRef.current(
                  Promise.resolve({ type: "connector", id: wc.id, connector: wc } as const),
                );
                return;
              }
              setError("setup");
              return;
            }
            // User rejection is routine — stay quiet; real failures surface.
            if (!/rejected|denied|cancelled|closed|dismissed/i.test(msg)) {
              setError(msg || "connect");
              void haptics.notification("error");
            }
          } finally {
            if (alive()) {
              clearQr();
              setBusy(false);
              setConnectingTo(null);
            }
          }
        })();
      };

      // Async resolution (EIP-6963 discovery) stays inside the attempt so a
      // newer tap supersedes it — never connects a stale wallet.
      if (target instanceof Promise) {
        void target.then((t) => {
          if (alive()) drive(t);
        });
      } else {
        drive(target);
      }
    },
    [account.connector, clearQr, config, connectAsync, connected, disconnectAsync, reset],
  );

  useEffect(() => {
    runTargetRef.current = runTarget;
  }, [runTarget]);

  const connectWallet = useCallback(
    (kind: EvmConnectorKind) => {
      if (kind === "walletconnect" && !canPairEvm()) {
        setError("setup");
        return;
      }
      const connector = findConnector(config, kind);
      if (!connector) {
        setError("setup");
        return;
      }
      runTarget({ type: "connector", id: connector.id, connector });
    },
    [config, runTarget],
  );

  const connectForWallet = useCallback(
    (walletId: string, label?: string) => {
      evmDebug("wallet tapped", { walletId });
      runTarget(resolveEvmTarget(config, walletId), label ?? walletId);
    },
    [config, runTarget],
  );

  const disconnectWallet = useCallback(() => {
    // Cancel any pending UI before tearing down the connection.
    attemptRef.current++;
    clearQr();
    reset();
    setBusy(false);
    setConnectingTo(null);
    setError(null);
    disconnect();
  }, [clearQr, disconnect, reset]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(
    () => () => {
      attemptRef.current++;
      clearQr();
    },
    [clearQr],
  );

  return useMemo(
    () => ({
      address,
      short: address ? shortAddress(address) : "",
      connected,
      chainName: connected ? chainName : null,
      connecting: busy || wagmiPending,
      connectingTo,
      error: error ?? wagmiError,
      ready: canPairEvm(),
      connectWallet,
      connectForWallet,
      disconnect: disconnectWallet,
      clearError,
    }),
    [
      address,
      connected,
      chainName,
      busy,
      wagmiPending,
      connectingTo,
      error,
      wagmiError,
      connectWallet,
      connectForWallet,
      disconnectWallet,
      clearError,
    ],
  );
}
