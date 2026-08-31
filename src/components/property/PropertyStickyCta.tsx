"use client";
// File responsibility: sticky bottom CTA bar — single Buy (primary) or side-by-side
// Buy/Sell (secondary); revealed after the hero scrolls away; clears the bottom tab
// bar when that is visible (REDESIGN-SPEC §4.3 + CTA fixes).
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { usd } from "@/lib/format";

export function PropertyStickyCta({
  variant,
  priceUsd,
  onBuy,
  buyDisabled = false,
  onSell,
  /** True while the app's BottomTabBar is visible — lifts the bar above it. */
  navOffset = false,
}: {
  variant: "primary" | "secondary";
  /** Per-share price shown on the button, minor units. */
  priceUsd: number;
  onBuy: () => void;
  buyDisabled?: boolean;
  /** Sell flow lands in Phase 7 — rendered disabled until then. */
  onSell?: () => void;
  navOffset?: boolean;
}) {
  const t = useTranslations("property");
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 mx-auto max-w-[480px] px-4 pt-6",
        "bg-gradient-to-t from-background via-background/95 to-background/0",
        // Above the tab bar (main's own clearance constant) or flush to the bottom.
        navOffset
          ? "bottom-[calc(88px+env(safe-area-inset-bottom))] pb-2"
          : "bottom-0 pb-[max(env(safe-area-inset-bottom),12px)]",
      )}
      data-testid="property-sticky-cta"
    >
      {variant === "primary" ? (
        <button
          type="button"
          disabled={buyDisabled}
          onClick={onBuy}
          className="pointer-events-auto flex h-[52px] w-full items-center justify-center gap-1 rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground transition-transform duration-[120ms] ease-out active:scale-[0.98] disabled:opacity-50"
          data-testid="sticky-buy"
        >
          {t("stickyAcquireOwnership", { price: usd(priceUsd) })}
        </button>
      ) : (
        <div className="pointer-events-auto grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={buyDisabled}
            onClick={onBuy}
            className="flex h-[52px] items-center justify-center gap-1 rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground transition-transform duration-[120ms] ease-out active:scale-[0.98] disabled:opacity-50"
            data-testid="sticky-buy"
          >
            {t("stickyAcquireOwnership", { price: usd(priceUsd) })}
          </button>
          <button
            type="button"
            disabled={!onSell}
            onClick={onSell}
            className="flex h-[52px] items-center justify-center rounded-[12px] border border-border bg-card text-[0.9375rem] font-semibold text-foreground transition-transform duration-[120ms] ease-out active:scale-[0.98] disabled:opacity-50"
            data-testid="sticky-sell"
          >
            {t("sell")}
          </button>
        </div>
      )}
    </div>
  );
}
