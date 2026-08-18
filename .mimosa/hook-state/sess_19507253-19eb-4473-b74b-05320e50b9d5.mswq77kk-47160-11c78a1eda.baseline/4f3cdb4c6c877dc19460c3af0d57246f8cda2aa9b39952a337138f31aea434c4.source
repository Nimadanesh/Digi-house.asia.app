"use client";

// File responsibility: the ONLY TON surface area components may call.
// Hard boundary (per telegram-ton-ownership skill): components import useTonConnect,
// never @tonconnect/* or lib/ton/* directly.
//
// Wraps TonConnect UI hooks + the sendTx service into one typed facade. The payment path returns a
// REAL txHash derived from the wallet-signed boc; "simulated:<id>" hashes exist only in the mock data
// path (src/lib/mock). On-chain share settlement remains post-MVP.
import { useCallback, useMemo } from "react";
import {
  useTonConnectUI,
  useTonAddress,
  useIsConnectionRestored,
} from "@tonconnect/ui-react";
import { env } from "@/lib/env";
import { sendTx, buildBuyMessage } from "@/lib/ton/sendTx";
import { shortAddress } from "@/lib/ton/address";
import type { BuyMessageInput, SendTxResult } from "@/types/ton";

export interface TonConnectState {
  /** User-friendly TON address when connected, else null. */
  address: string | null;
  /** Shortened address for chips/badges; "" when disconnected. */
  short: string;
  connected: boolean;
  /** True while a previous session is being restored on mount. */
  restoring: boolean;
  network: "testnet" | "mainnet";
  /** Open the TonConnect wallet-picker modal. */
  openModal: () => void;
  /** Disconnect the active wallet. */
  disconnect: () => Promise<void>;
  /** Build + send a buy-style transaction. Result carries the real wallet-signed txHash. */
  send: (input: BuyMessageInput) => Promise<SendTxResult>;
}

export function useTonConnect(): TonConnectState {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress(true); // user-friendly
  const restored = useIsConnectionRestored();

  const connected = Boolean(address);
  const short = address ? shortAddress(address, { prefix: 6, suffix: 4 }) : "";

  const send = useCallback(
    async (input: BuyMessageInput): Promise<SendTxResult> => {
      const request = buildBuyMessage(input);
      return sendTx(tonConnectUI, request);
    },
    [tonConnectUI],
  );

  const disconnect = useCallback(async (): Promise<void> => {
    if (!tonConnectUI) return;
    await tonConnectUI.disconnect();
  }, [tonConnectUI]);

  const openModal = useCallback((): void => {
    void tonConnectUI?.openModal();
  }, [tonConnectUI]);

  return useMemo(
    () => ({
      address: address || null,
      short,
      connected,
      restoring: !restored,
      network: env.network,
      openModal,
      disconnect,
      send,
    }),
    [address, short, connected, restored, openModal, disconnect, send],
  );
}
