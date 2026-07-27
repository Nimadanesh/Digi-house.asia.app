"use client";
// File responsibility: Telegram-style marketplace search field (Fable §Header search).
import { Search, X } from "lucide-react";
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
  return (
    <div
      className={cn(
        "flex h-11 items-center gap-2 rounded-[10px] bg-surface-2 px-3",
        className,
      )}
      data-testid="marketplace-search"
    >
      <Search size={18} strokeWidth={1.75} className="shrink-0 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search properties"
        aria-label="Search properties"
        className="min-w-0 flex-1 bg-transparent text-[0.9375rem] text-foreground placeholder:text-muted-foreground outline-none"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      ) : null}
    </div>
  );
}
