"use client";
// File responsibility: global tab header — avatar, greeting, wallet, settings. Memoized; haptics-only TG.
import { memo, useCallback } from "react";
import Image from "next/image";
import { Settings, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTelegramUser } from "@/hooks/useTelegramUser";
import { useTonConnect } from "@/hooks/useTonConnect";
import { useUiStore } from "@/stores/ui.store";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

function GlobalHeaderInner() {
  const t = useTranslations("header");
  const tCommon = useTranslations("common");
  const { firstName, photoUrl } = useTelegramUser();
  const { connected, openModal } = useTonConnect();
  const openSettings = useUiStore((s) => s.openSettings);
  const initial = firstName.charAt(0).toUpperCase() || "D";

  const onSettingsClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      haptics.selection();
      openSettings();
    },
    [openSettings],
  );

  return (
    <header
      className="relative z-30 shrink-0 bg-background px-4 pt-[max(env(safe-area-inset-top),0px)]"
      data-testid="global-header"
    >
      <div className="flex h-[52px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-surface-2">
            {photoUrl ? (
              <Image src={photoUrl} alt="" fill className="object-cover" sizes="40px" unoptimized />
            ) : (
              <span className="flex size-full items-center justify-center text-sm font-semibold text-primary">
                {initial}
              </span>
            )}
          </div>
          <p className="truncate text-[1.0625rem] font-semibold text-foreground" data-testid="global-greeting">
            {t("greeting", { name: firstName })}{" "}
            <span aria-hidden>👋</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label={connected ? tCommon("walletConnected") : tCommon("connectWallet")}
            onClick={() => {
              haptics.selection();
              openModal();
            }}
            className="relative flex size-11 items-center justify-center rounded-full active:scale-[0.97] transition-transform duration-[120ms] ease-out text-foreground"
            data-testid="global-wallet-btn"
          >
            <Wallet size={22} strokeWidth={1.75} />
            <span
              className={cn(
                "absolute top-2 end-2 size-2 rounded-full ring-2 ring-background",
                connected ? "bg-success" : "bg-muted-foreground/50",
              )}
              data-testid="global-wallet-dot"
              data-connected={connected ? "true" : "false"}
            />
          </button>
          <button
            type="button"
            aria-label={tCommon("settings")}
            onClick={onSettingsClick}
            className="relative z-10 flex size-11 items-center justify-center rounded-full active:scale-[0.97] transition-transform duration-[120ms] ease-out text-foreground"
            data-testid="global-settings-btn"
          >
            <Settings size={22} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  );
}

export const GlobalHeader = memo(GlobalHeaderInner);

/** @deprecated Use GlobalHeader */
export { GlobalHeader as HomeHeader };
