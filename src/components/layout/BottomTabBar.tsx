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
                "relative flex h-[50px] items-center justify-center rounded-[22px] transition-colors duration-150 ease-out active:scale-[0.97]",
                active ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              {/* Content wrapper: centers icon + label and gives the active pill a
                  consistent, tight padding — an even 2px vertical margin to the tab
                  item (46px pill inside the 50px tab) and an equal text-to-pill gap
                  on every tab (fixes the longer "Marketplace" label touching it). */}
              <span className="relative flex flex-col items-center gap-1 px-2.5 py-[5px]">
                {active ? (
                  <span
                    className="absolute inset-0 rounded-[16px] bg-primary/12"
                    aria-hidden
                    data-testid="tab-active-pill"
                  />
                ) : null}
                <Icon size={22} strokeWidth={active ? 2.25 : 1.75} className="relative z-[1]" />
                <span className="relative z-[1] text-[10px] font-medium leading-none tracking-wide">
                  {t(labelKey)}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const BottomTabBar = memo(BottomTabBarInner);
