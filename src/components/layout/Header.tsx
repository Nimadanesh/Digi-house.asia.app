"use client";
// File responsibility: the Telegram-style header bar — centered title, leading back-chevron
// fallback only when running OUTSIDE Telegram (the native BackButton covers it inside TG),
// trailing slot reserved for future actions. DESIGN_SYSTEM §"Telegram Header".
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useTelegram } from "@/hooks/useTelegram";

const TITLES: Record<string, string> = {
  "/home": "DigiHouse",
  "/marketplace": "Marketplace",
  "/earnings": "Earnings",
  "/portfolio": "Portfolio",
  "/settings": "Settings",
};

const ROOT_PATHS = new Set(["/home", "/marketplace", "/earnings", "/portfolio", "/settings"]);

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready } = useTelegram();
  const title = TITLES[pathname] ?? (pathname.startsWith("/property/") ? "Property" : "DigiHouse");
  // Show the in-app back chevron only outside Telegram (native BackButton handles it inside TG)
  // and only on non-root routes (detail/sheet).
  const showBack = !ready && !ROOT_PATHS.has(pathname);
  return (
    <header className="h-[calc(44px+max(env(safe-area-inset-top),0px))] shrink-0 bg-background/95 backdrop-blur px-4 pt-[max(env(safe-area-inset-top),0px)]">
      <div className="relative flex h-[44px] items-center justify-center">
        {showBack ? (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="absolute left-0 flex items-center justify-center size-[44px] -ml-2 active:scale-[0.97] transition-transform duration-[120ms] ease-out text-foreground"
          >
            <ChevronLeft size={24} strokeWidth={1.75} />
          </button>
        ) : null}
        <span className="text-[1.0625rem] font-semibold text-foreground">{title}</span>
      </div>
    </header>
  );
}