"use client";

// File responsibility: render TonConnect's native connect button (excellent out-of-box UX).
// Phase 3 will restyle to a DigiHouse-native Telegram button; Phase 2 ships the stock TonConnectButton.
import { TonConnectButton } from "@tonconnect/ui-react";
import { cn } from "@/lib/utils";

export function WalletConnectButton({ className }: { className?: string }) {
  return <TonConnectButton className={cn("h-12", className)} />;
}