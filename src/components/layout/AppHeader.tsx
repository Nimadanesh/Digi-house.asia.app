"use client";
// File responsibility: shared bottom-tab header — circular avatar (opens SettingsSheet),
// search capsule (flex-1), existing TonConnect wallet control. Rendered by AppShell on
// every bottom-tab route. Search submits to the Marketplace route with ?query=; while
// ON Marketplace it rewrites the same ?query= in place (no navigation) so the page's
// existing filter query follows the header capsule. No greeting, no gear.
import { Suspense, useCallback, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTelegramUser } from "@/hooks/useTelegramUser";
import { useTonConnect } from "@/hooks/useTonConnect";
import { useUiStore } from "@/stores/ui.store";
import { haptics } from "@/lib/telegram/haptics";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function HeaderSearch() {
  const t = useTranslations("home");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState("");
  const isMarketplace = pathname === ROUTES.marketplace;
  const value = isMarketplace ? (searchParams.get("query") ?? "") : draft;

  return (
    <form
      method={isMarketplace ? undefined : "get"}
      action={isMarketplace ? undefined : ROUTES.marketplace}
      onSubmit={(e) => {
        haptics.selection();
        if (isMarketplace) e.preventDefault();
      }}
      className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-surface-2 px-4"
      data-testid="home-nav-search"
    >
      <button
        type="submit"
        aria-label={t("searchPlaceholder")}
        className="flex shrink-0 items-center justify-center text-muted-foreground"
      >
        <Search size={18} strokeWidth={1.75} aria-hidden />
      </button>
      <input
        type="search"
        name="query"
        value={value}
        onChange={(e) => {
          if (isMarketplace) {
            const raw = e.target.value;
            router.replace(
              raw.trim()
                ? `${ROUTES.marketplace}?query=${encodeURIComponent(raw)}`
                : ROUTES.marketplace,
              { scroll: false },
            );
          } else {
            setDraft(e.target.value);
          }
        }}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        className="min-w-0 flex-1 bg-transparent text-[0.9375rem] text-foreground placeholder:text-muted-foreground outline-none"
      />
    </form>
  );
}

export function AppHeader() {
  const tCommon = useTranslations("common");
  const { firstName, photoUrl } = useTelegramUser();
  const { connected, openModal } = useTonConnect();
  const openSettings = useUiStore((s) => s.openSettings);
  const initial = firstName.charAt(0).toUpperCase() || "D";

  const onAvatarClick = useCallback(() => {
    haptics.selection();
    openSettings();
  }, [openSettings]);

  return (
    <header
      className="relative z-30 shrink-0 px-4 pt-[max(env(safe-area-inset-top),0px)]"
      data-testid="home-navbar"
    >
      <div className="flex h-[52px] items-center gap-2.5">
        <button
          type="button"
          onClick={onAvatarClick}
          aria-label={tCommon("settings")}
          data-testid="home-nav-avatar"
          className="relative size-10 shrink-0 overflow-hidden rounded-full bg-surface-2 active:scale-[0.97] transition-transform duration-[120ms] ease-out"
        >
          {photoUrl ? (
            <Image src={photoUrl} alt="" fill className="object-cover" sizes="40px" unoptimized />
          ) : (
            <span className="flex size-full items-center justify-center text-sm font-semibold text-primary">
              {initial}
            </span>
          )}
        </button>

        <Suspense
          fallback={
            <div aria-hidden className="h-10 min-w-0 flex-1 rounded-full bg-surface-2" />
          }
        >
          <HeaderSearch />
        </Suspense>

        <button
          type="button"
          aria-label={connected ? tCommon("walletConnected") : tCommon("connectWallet")}
          onClick={() => {
            haptics.selection();
            openModal();
          }}
          data-testid="home-nav-wallet"
          className="relative flex size-11 shrink-0 items-center justify-center rounded-full text-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
        >
          <Wallet size={22} strokeWidth={1.75} />
          <span
            className={cn(
              "absolute top-2 end-2 size-2 rounded-full ring-2 ring-background",
              connected ? "bg-success" : "bg-muted-foreground/50",
            )}
            data-testid="home-nav-wallet-dot"
            data-connected={connected ? "true" : "false"}
          />
        </button>
      </div>
    </header>
  );
}
