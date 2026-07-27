"use client";

// File responsibility: the DigiHouse-native TON connect button. Presentational — all TON surface
// (openModal dispatch) comes through the sanctioned useTonConnect hook; this component NEVER imports
// @tonconnect/* directly (telegram-ton-ownership hard rule). DESIGN_SYSTEM §"Buttons (in-page)" Primary.
import { useTonConnect } from "@/hooks/useTonConnect";
import { useTelegram } from "@/hooks/useTelegram";
import { cn } from "@/lib/utils";

export function WalletConnectButton({ className }: { className?: string }) {
  const { openModal } = useTonConnect();
  const { haptics } = useTelegram();
  return (
    <button
      type="button"
      onClick={() => {
        haptics.impact("light");
        openModal();
      }}
      className={cn(
        "inline-flex h-[48px] items-center justify-center rounded-[10px] bg-primary px-4 text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out",
        className,
      )}
    >
      Connect
    </button>
  );
}
