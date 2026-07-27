"use client";
// File responsibility: native-feel bottom tabs. Minimal subscriptions.
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

export function BottomTabBar() {
  const pathname = usePathname();
  const t = useTranslations("tabs");

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 mx-auto max-w-[480px] px-3 pb-[max(env(safe-area-inset-bottom),8px)] pt-1"
      data-testid="bottom-tab-bar"
      aria-label="Main"
    >
      <div className="grid h-[56px] grid-cols-4 items-center rounded-[16px] border border-border/80 bg-card/95 px-1 backdrop-blur-md">
        {TAB_DEFS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => haptics.selection()}
              className={cn(
                "relative flex h-[48px] flex-col items-center justify-center gap-0.5 rounded-[12px] transition-colors duration-200 ease-out active:scale-[0.97]",
                active ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              {active ? (
                <span className="absolute inset-x-2 top-1 h-[44px] rounded-[12px] bg-primary/10" aria-hidden />
              ) : null}
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} className="relative z-[1]" />
              <span className="relative z-[1] text-[10px] font-medium leading-none">{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
