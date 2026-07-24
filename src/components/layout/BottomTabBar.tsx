"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABS } from "@/lib/constants";
import { useTelegram } from "@/hooks/useTelegram";
import { cn } from "@/lib/utils";

export function BottomTabBar() {
  const pathname = usePathname();
  const { haptics } = useTelegram();
  return (
    <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] h-[calc(52px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-card/95 backdrop-blur border-t border-border grid grid-cols-4">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={() => haptics.selection()}
            className={cn("flex flex-col items-center justify-center gap-1", active ? "text-primary" : "text-muted-foreground")}
          >
            <Icon size={24} strokeWidth={1.75} />
            <span className="text-[10px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}