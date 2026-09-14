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
  const activeIndex = TAB_DEFS.findIndex(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 mx-auto max-w-[480px] px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5"
      data-testid="bottom-tab-bar"
      aria-label="Main"
    >
      <div
        className={cn(
          "relative grid h-[60px] grid-cols-4 items-stretch overflow-hidden p-1",
          "rounded-[28px] border border-border/70",
          "bg-card",
          "shadow-[0_8px_28px_rgba(0,0,0,0.32)]",
        )}
      >
        {/* ONE shared active indicator: a quarter of the inner bar, same stadium
            shape on every tab — only its X position changes with the active index. */}
        {activeIndex >= 0 ? (
          <span
            aria-hidden
            data-testid="tab-active-pill"
            className="pointer-events-none absolute bottom-1 left-1 top-1 rounded-full bg-primary/12 transition-transform duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{
              width: "calc((100% - 8px) / 4)",
              transform: `translateX(calc(100% * ${activeIndex}))`,
            }}
          />
        ) : null}
        {TAB_DEFS.map(({ href, labelKey, icon: Icon }, i) => {
          const active = i === activeIndex;
          return (
            <Link
              key={href}
              href={href}
              prefetch
              onClick={() => haptics.selection()}
              className={cn(
                "relative flex h-full flex-col items-center justify-center gap-0.5 bg-transparent transition-colors duration-150 ease-out active:scale-[0.97]",
                active ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
              <span className="whitespace-nowrap text-[11px] font-medium leading-none tracking-wide">
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
