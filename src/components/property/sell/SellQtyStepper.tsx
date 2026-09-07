"use client";
// File responsibility: shared sell quantity stepper — qty display, ± steppers,
// Max shortcut, and the out-of-range message (defensive: the steppers clamp,
// so the message only fires on programmatic/stale values).
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";

export function SellQtyStepper({
  shares,
  max,
  rangeError,
  onChange,
}: {
  shares: number;
  max: number;
  rangeError: boolean;
  onChange: (qty: number) => void;
}) {
  const t = useTranslations("property");
  return (
    <>
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label={t("decreaseQty")}
          disabled={shares <= 1}
          onClick={() => {
            haptics.selection();
            onChange(Math.max(1, shares - 1));
          }}
          className="size-12 rounded-[12px] bg-surface-2 flex items-center justify-center active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
        >
          <Minus size={22} strokeWidth={1.75} />
        </button>
        <div className="min-w-[88px] text-center text-3xl font-semibold tnum" data-testid="sell-qty">
          {shares}
        </div>
        <button
          type="button"
          aria-label={t("increaseQty")}
          disabled={shares >= max}
          onClick={() => {
            haptics.selection();
            onChange(Math.min(max, shares + 1));
          }}
          className="size-12 rounded-[12px] bg-surface-2 flex items-center justify-center active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
        >
          <Plus size={22} strokeWidth={1.75} />
        </button>
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => {
            haptics.selection();
            onChange(max);
          }}
          className="min-h-[44px] min-w-[52px] rounded-full bg-primary/15 px-3 text-sm font-semibold text-primary active:scale-[0.97] transition-transform duration-[120ms] ease-out"
        >
          {t("maxCta")}
        </button>
      </div>
      {rangeError ? (
        <p className="text-xs text-danger text-center" role="alert">
          {t("quantityInvalid", { max })}
        </p>
      ) : null}
    </>
  );
}
