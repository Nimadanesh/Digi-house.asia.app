"use client";

// File responsibility: chip showing the connected wallet's shortened address; tap opens the wallet modal.
// Presentational — all TON surface comes through useTonConnect.
import { useTonConnect } from "@/hooks/useTonConnect";
import { cn } from "@/lib/utils";

export function WalletBadge({ className }: { className?: string }) {
  const { short, connected, network, openModal } = useTonConnect();
  if (!connected) return null;
  return (
    <button
      type="button"
      onClick={openModal}
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-foreground",
        className,
      )}
      aria-label="Manage wallet"
    >
      <span className="size-2 rounded-full bg-success" aria-hidden />
      <span className="tnum">{short}</span>
      <span className="uppercase text-muted-foreground">{network}</span>
    </button>
  );
}