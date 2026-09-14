"use client";
// File responsibility: Telegram-style estates search field (Phase 9 — "Search villas,
// destinations or regions."). Labels via `estates.*`.
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function MarketplaceSearch({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const t = useTranslations("estates");

  return (
    <div
      className={cn(
        "flex h-11 items-center gap-2 rounded-[10px] bg-surface-2 px-3",
        className,
      )}
      data-testid="estates-search"
    >
      <Search size={18} strokeWidth={1.75} className="shrink-0 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchAria")}
        className="min-w-0 flex-1 bg-transparent text-[0.9375rem] text-foreground placeholder:text-muted-foreground outline-none"
      />
      {value ? (
        <button
          type="button"
          aria-label={t("clearSearch")}
          onClick={() => onChange("")}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      ) : null}
    </div>
  );
}