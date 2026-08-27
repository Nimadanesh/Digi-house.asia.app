"use client";
// File responsibility: Earnings hero (redesign). "Total earned" is the hero. Paid streak is a
// subtle trust signal. Upcoming payout is a static date + estimate on the existing Sunday rule.
// No ticking countdown. Figures come straight from the repo contract; no new math.
import { useTranslations } from "next-intl";
import { CalendarClock } from "lucide-react";
import { Block } from "@/components/common/Block";
import { StatusPill } from "@/components/common/StatusPill";
import { usd } from "@/lib/format";
import { nextPayoutDate, formatPayoutDate } from "@/lib/payout-display";
import { useSharedNowMs } from "@/hooks/useSharedNowMs";
import { consecutivePaidWeeks, thisWeekStatus } from "@/lib/earnings-stats";
import type { EarningsSummary } from "@/types/earnings";

export function EarningsHeroCard({ summary }: { summary: EarningsSummary }) {
  const t = useTranslations("earnings");
  const tCommon = useTranslations("common");
  const nowMs = useSharedNowMs();
  const status = thisWeekStatus(summary.entries);
  const streak = consecutivePaidWeeks(summary.entries);
  const date = nextPayoutDate(nowMs);
  const when = formatPayoutDate(date);

  return (
    <Block className="p-4 space-y-4" data-testid="earnings-hero">
      <div className="text-center space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">{t("totalEarned")}</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <p
            className="text-[2rem] font-bold tracking-[-0.02em] tnum text-foreground leading-none"
            data-testid="earnings-hero-amount"
          >
            {usd(summary.allTimeUsd)}
          </p>
          {status === "pending" ? (
            <StatusPill label={tCommon("pending")} variant="warning" />
          ) : (
            <StatusPill label={tCommon("paid")} variant="success" />
          )}
        </div>
        {streak > 0 ? (
          <p className="pt-1 text-xs leading-snug text-muted-foreground tnum" data-testid="earnings-streak">
            {t("streak", {
              count: streak,
              unit: streak === 1 ? tCommon("week") : tCommon("weeks"),
            })}
          </p>
        ) : null}
      </div>

      <div
        className="flex items-center justify-between gap-3 border-t border-border pt-3.5"
        data-testid="earnings-upcoming"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-primary/12 text-primary">
            <CalendarClock size={16} strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[0.6875rem] leading-snug text-muted-foreground">{t("nextPayoutIn")}</p>
            <p className="text-sm font-semibold leading-snug text-foreground tnum" data-testid="earnings-next-date">
              {when}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-end">
          <p className="text-[0.6875rem] leading-snug text-muted-foreground">{tCommon("est")}</p>
          <p className="text-[1.0625rem] font-bold tnum text-success" data-testid="earnings-next-amount">
            ≈ {usd(summary.thisWeekProjectedUsd)}
          </p>
        </div>
      </div>
    </Block>
  );
}