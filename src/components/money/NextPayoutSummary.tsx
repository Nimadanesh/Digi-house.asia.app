"use client";
// File responsibility: reusable, *static* next-payout summary (Home / Portfolio / shared money).
// Calm-money rule from the redesign brief: show the next payout date on the existing Sunday display
// rule and the estimated amount — no ticking countdown, no FOMO. Pure display; figures come straight
// from the repo contract (projectedUsd is minor units) via the payout-display helpers, never new math.
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import { nextPayoutDate, formatPayoutDate } from "@/lib/payout-display";
import { useSharedNowMs } from "@/hooks/useSharedNowMs";
import { Block } from "@/components/common/Block";

export function NextPayoutSummary({
  projectedUsd,
  onNavigateHaptic,
}: {
  /** Estimated next payout, integer minor units (from the repo contract, not derived here). */
  projectedUsd: number;
  onNavigateHaptic?: () => void;
}) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const nowMs = useSharedNowMs();
  const date = nextPayoutDate(nowMs);
  const when = formatPayoutDate(date);

  return (
    <Link
      href={ROUTES.earnings}
      onClick={() => onNavigateHaptic?.()}
      className="block active:scale-[0.99] transition-transform duration-[120ms] ease-out"
      data-testid="next-payout-summary"
    >
      <Block className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/12 text-primary">
              <CalendarClock size={20} strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium leading-snug text-muted-foreground">{t("nextPayout")}</p>
              <p
                className="text-[0.9375rem] font-semibold tnum leading-snug tracking-tight text-foreground"
                data-testid="next-payout-date"
              >
                {when}
              </p>
            </div>
          </div>
          <div className="shrink-0 space-y-1 text-end">
            <p className="text-[0.6875rem] leading-snug text-muted-foreground">{tCommon("est")}</p>
            <p className="text-[1.0625rem] font-bold tnum text-success" data-testid="next-payout-amount">
              ≈ {usd(projectedUsd)}
            </p>
          </div>
        </div>
      </Block>
    </Link>
  );
}