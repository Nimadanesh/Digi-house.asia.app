"use client";

// File responsibility: temporary Phase-2 TON-foundation smoke screen at the root route.
// Proves wallet connect/disconnect works end-to-end. The parallel foundation subset will
// replace this with a redirect to /home once the AppShell + tabs land.
import { WalletConnectButton } from "@/components/wallet/TonConnectButton";
import { WalletBadge } from "@/components/wallet/WalletBadge";
import { DisconnectedState } from "@/components/wallet/DisconnectedState";
import { useTonConnect } from "@/hooks/useTonConnect";

export default function Home() {
  const { connected, network, address } = useTonConnect();
  return (
    <main className="mx-auto flex min-h-svh max-w-[480px] flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">DigiHouse</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fractional property on TON · {network} · Phase 2 TON foundation wired
        </p>
      </div>
      {connected ? (
        <div className="flex flex-col items-center gap-3">
          <WalletBadge />
          <p className="max-w-xs text-xs text-muted-foreground tnum">
            Connected: {address}
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Wallet connect works end-to-end. The Telegram SDK, mock data layer,
            and AppShell + tabs are wired by the parallel Phase 2 foundation
            subset.
          </p>
          <WalletConnectButton />
        </div>
      ) : (
        <DisconnectedState />
      )}
    </main>
  );
}