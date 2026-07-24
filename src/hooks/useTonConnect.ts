"use client";

// File responsibility: the ONLY TON surface area components may call.
// Hard boundary (per telegram-ton-ownership skill): components import useTonConnect,
// never @tonconnect/* or lib/ton/* directly.
//
// Wraps TonConnect UI hooks + the sendTx service into one typed facade. Keeps
// MVP honesty intact: any "send" returns a SendTxResult with a synthetic txHash
// ("simulated:<id>"); real on-chain settlement is post-MVP.
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
  /** Build + send a buy-style transaction. Result carries a synthetic MVP txHash. */
  send: (input: BuyMessageInput) => Promise<SendTxResult>;
}

export function useTonConnect(): TonConnectState {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress(true); // user-friendly
  const restored = useIsConnectionRestored();

  const connected = Boolean(address);

  async function send(input: BuyMessageInput): Promise<SendTxResult> {
    const request = buildBuyMessage(input);
    return sendTx(tonConnectUI, request);
  }

  async function disconnect(): Promise<void> {
    if (!tonConnectUI) return;
    await tonConnectUI.disconnect();
  }

  function openModal(): void {
    void tonConnectUI?.openModal();
  }

  return {
    address: address || null,
    short: address ? shortAddress(address, { prefix: 6, suffix: 4 }) : "",
    connected,
    restoring: !restored,
    network: env.network,
    openModal,
    disconnect,
    send,
  };
}