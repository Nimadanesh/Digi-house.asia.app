"use client";
// File responsibility: native-feel bottom tabs — floating capsule, Telegram-adjacent radius.
import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, Store, Wallet, PieChart } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

const TAB_DEFS = [
  { href: ROUTES.home, labelKey: "home" as const, icon: Home },
  { href: ROUTES.marketplace, labelKey: "marketplace" as const, icon: Store },
  { href: ROUTES.earnings, labelKey: "earnings" as const, icon: Wallet },
  { href: ROUTES.portfolio, labelKey: "portfolio" as const, icon: PieChart },
] as const;

function BottomTabBarInner() {
  const pathname = usePathname();
  const t = useTranslations("tabs");

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 mx-auto max-w-[480px] px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5"
      data-testid="bottom-tab-bar"
      aria-label="Main"
    >
      <div
        className={cn(
          "grid h-[60px] grid-cols-4 items-center px-1.5",
          "rounded-[28px] border border-border/70",
          "bg-card",
          "shadow-[0_8px_28px_rgba(0,0,0,0.32)]",
        )}
      >
        {TAB_DEFS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              prefetch
              onClick={() => haptics.selection()}
              className={cn(
                "relative flex h-[50px] flex-col items-center justify-center gap-1 rounded-[22px] transition-colors duration-150 ease-out active:scale-[0.97]",
                active ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              {active ? (
                <span
                  className="absolute inset-x-1.5 top-1 h-[46px] rounded-[20px] bg-primary/12"
                  aria-hidden
                />
              ) : null}
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} className="relative z-[1]" />
              <span className="relative z-[1] text-[10px] font-medium leading-none tracking-wide">
                {t(labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const BottomTabBar = memo(BottomTabBarInner);
