"use client";
// File responsibility: global wallet chooser host — mounts the chooser sheet once
// (AppShell) and wires both rails: TON picks → TonConnect modal, EVM picks →
// wagmi flow, TON disconnect behind the existing confirm sheet. Presentational
// sheet stays dumb; all side effects live here.
import { useCallback, useState } from "react";
import { WalletChooserSheet, type ListedWallet } from "@/components/wallet/WalletChooserSheet";
import { ConfirmActionSheet } from "@/components/common/ConfirmActionSheet";
import { useTonConnect } from "@/hooks/useTonConnect";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { useUiStore } from "@/stores/ui.store";
import { haptics } from "@/lib/telegram/haptics";

export function WalletChooserHost() {
  const open = useUiStore((s) => s.walletChooserOpen);
  const close = useUiStore((s) => s.closeWalletChooser);
  const tonc = useTonConnect();
  const evm = useEvmWallet();
  /** TON disconnect is consequential (buy/payouts need it) → confirm first. */
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const onDisconnect = useCallback(async () => {
    if (disconnecting) return;
    haptics.impact("medium");
    setDisconnecting(true);
    try {
      await tonc.disconnect();
      setDisconnectOpen(false);
    } finally {
      setDisconnecting(false);
    }
  }, [disconnecting, tonc]);

  const onPickTon = useCallback(
    () => {
      close();
      tonc.openModal();
    },
    [close, tonc],
  );

  const onPickEvm = useCallback(
    (wallet: ListedWallet) => {
      close();
      evm.connectForWallet(wallet.id, wallet.name);
    },
    [close, evm],
  );

  return (
    <>
      <WalletChooserSheet
        open={open}
        onClose={close}
        onPickTon={onPickTon}
        onPickEvm={onPickEvm}
        tonAccount={tonc.connected ? { short: tonc.short } : null}
        evmAccount={
          evm.connected && evm.address
            ? { short: evm.short, chain: evm.chainName ?? "" }
            : null
        }
        onDisconnectTon={() => {
          haptics.selection();
          setDisconnectOpen(true);
        }}
        onDisconnectEvm={() => {
          haptics.selection();
          evm.disconnect();
        }}
      />
      <ConfirmActionSheet
        open={disconnectOpen}
        onClose={() => setDisconnectOpen(false)}
        title="Disconnect wallet"
        description="You'll need to reconnect to buy shares or receive payouts. Your investments aren't affected."
        details={[{ label: "Wallet", value: tonc.short ?? "" }]}
        confirmLabel="Disconnect"
        pendingLabel="Disconnecting…"
        pending={disconnecting}
        onConfirm={() => void onDisconnect()}
        testId="disconnect-confirm"
      />
    </>
  );
}
