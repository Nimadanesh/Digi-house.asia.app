"use client";

// File responsibility: empty-state shown when no wallet is connected. Presentational.
import { WalletConnectButton } from "./TonConnectButton";
import { useTonConnect } from "@/hooks/useTonConnect";

export function DisconnectedState({ className }: { className?: string }) {
  const { restoring } = useTonConnect();
  return (
    <div className={className}>
      <h2 className="text-lg font-semibold">Connect a TON wallet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {restoring
          ? "Restoring your previous session…"
          : "You need a TON wallet to buy shares and receive weekly rental yield."}
      </p>
      <div className="mt-4 flex justify-center">
        <WalletConnectButton />
      </div>
    </div>
  );
}