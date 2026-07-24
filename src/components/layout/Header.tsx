"use client";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TITLES: Record<string, string> = {
  "/home": "DigiHouse",
  "/marketplace": "Marketplace",
  "/earnings": "Earnings",
  "/portfolio": "Portfolio",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "DigiHouse";
  return (
    <header className={cn("h-[44px] shrink-0 bg-background/95 backdrop-blur px-4 flex items-center", "pt-[max(env(safe-area-inset-top),0px)]")}>
      <span className="text-[1.0625rem] font-semibold text-foreground">{title}</span>
    </header>
  );
}