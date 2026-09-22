"use client";
// File responsibility: sticky Withdraw bar on Earnings — a single primary button
// (bold "Withdraw" + secondary "available: $X" line) appearing after scrolling past
// ~1.5× the hero height (fade + slide-up, interruptible transitions only), sitting
// above the bottom tab bar. Disabled + muted when nothing is withdrawable.
// Reuses the existing WithdrawalRequestSheet flow (PE-08). No new financial logic.
import { useEffect, useRef, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { useMeSummary } from "@/hooks/useLocks";
import { WithdrawalRequestSheet } from "@/components/settings/WithdrawalRequestSheet";
import { cn } from "@/lib/utils";

export function EarningsWithdrawEntry({
  heroRef,
}: {
  /** Ref of the hero section; the bar appears past ~1.5× its height. */
  heroRef?: RefObject<HTMLElement | null>;
}) {
  const t = useTranslations("earnings");
  const { data: summary } = useMeSummary();
  const [open, setOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const withdrawable = summary?.balances.withdrawableUsd ?? 0;
  const enabled = withdrawable > 0;

  useEffect(() => {
    const onScroll = () => {
      const heroH = heroRef?.current?.offsetHeight ?? 0;
      setPastHero(window.scrollY > heroH * 1.5);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [heroRef]);

  return (
    <>
      <div
        ref={barRef}
        data-testid="earnings-withdraw-entry"
        className={cn(
          "fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-[480px] px-4",
          "transition-[opacity,transform] duration-200 ease-out",
          pastHero ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
        aria-hidden={!pastHero}
      >
        <div data-testid="earnings-withdraw-block">
          <button
            type="button"
            disabled={!enabled}
            onClick={() => {
              haptics.selection();
              setOpen(true);
            }}
            className={cn(
              "flex min-h-[52px] w-full flex-row items-center justify-center gap-1.5 rounded-[12px] px-4 text-center shadow-[0_-4px_16px_rgba(0,0,0,0.22)] transition-transform duration-[120ms] ease-out",
              enabled
                ? "bg-primary text-primary-foreground active:scale-[0.98]"
                : "bg-secondary text-muted-foreground",
            )}
            data-testid="earnings-withdraw-row"
          >
            <span className="shrink-0 text-[0.9375rem] font-bold leading-snug">
              {t("withdrawButton")}
            </span>
            <span
              className={cn(
                "truncate text-[0.9375rem] leading-snug tnum",
                enabled ? "text-primary-foreground/75" : "text-muted-foreground",
              )}
              data-testid="withdrawable-balance"
            >
              · {t("withdrawAvailable", { amount: usd(withdrawable) })}
            </span>
          </button>
        </div>
      </div>

      <WithdrawalRequestSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
