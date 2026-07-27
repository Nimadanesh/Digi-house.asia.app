"use client";
// File responsibility: the Telegram-style header bar — title on nested routes + reliable back chevron.
// Always shows an in-app back control on nested routes (property, etc.) so UX works even when
// native Telegram BackButton is unavailable; pairs with page-level tg.backButton.show().
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useTelegram } from "@/hooks/useTelegram";
import { cn } from "@/lib/utils";

const TITLES: Record<string, string> = {
  "/home": "DigiHouse",
  "/marketplace": "Marketplace",
  "/earnings": "Earnings",
  "/portfolio": "Portfolio",
  "/settings": "Settings",
  "/onboarding": "Welcome",
};

const ROOT_PATHS = new Set(["/home", "/marketplace", "/earnings", "/portfolio", "/settings", "/onboarding"]);

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { haptics } = useTelegram();
  const title = TITLES[pathname] ?? (pathname.startsWith("/property/") ? "Property" : "DigiHouse");
  const isRoot = ROOT_PATHS.has(pathname);
  // Nested routes always get an in-app back control (native Telegram BackButton is additive).
  const showBack = !isRoot;

  return (
    <header
      className="h-[calc(44px+max(env(safe-area-inset-top),0px))] shrink-0 bg-background/95 backdrop-blur px-4 pt-[max(env(safe-area-inset-top),0px)]"
      data-testid="app-header"
    >
      <div
        className={cn(
          "relative flex h-[44px] items-center",
          isRoot ? "justify-start" : "justify-center",
        )}
      >
        {showBack ? (
          <button
            type="button"
            onClick={() => {
              haptics.selection();
              router.back();
            }}
            aria-label="Back"
            data-testid="header-back"
            className="absolute left-0 flex items-center justify-center size-[44px] -ml-2 active:scale-[0.97] transition-transform duration-[120ms] ease-out text-foreground"
          >
            <ChevronLeft size={24} strokeWidth={1.75} />
          </button>
        ) : null}
        <span
          className={cn(
            "text-[1.0625rem] font-semibold text-foreground",
            !isRoot && "text-center",
          )}
          data-testid="header-title"
        >
          {title}
        </span>
      </div>
    </header>
  );
}
