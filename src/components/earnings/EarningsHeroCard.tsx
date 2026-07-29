"use client";
// File responsibility: Earnings hero card (Fable Earnings §Main card).
// thisWeek amount is projected when Pending — not claimed as paid to wallet.
import { useTranslations } from "next-intl";
import { Block } from "@/components/common/Block";
import { StatusPill } from "@/components/common/StatusPill";
import { PayoutCountdown } from "@/components/earnings/PayoutCountdown";
import { usd } from "@/lib/format";
import type { EarningsSummary } from "@/types/earnings";
import { consecutivePaidWeeks, thisWeekStatus } from "@/lib/earnings-stats";

export function EarningsHeroCard({ summary }: { summary: EarningsSummary }) {
  const t = useTranslations("earnings");
  const tCommon = useTranslations("common");
  const status = thisWeekStatus(summary.entries);
  const streak = consecutivePaidWeeks(summary.entries);
  const heroAmount = summary.thisWeekProjectedUsd;

  return (
    <Block className="p-4 space-y-4" data-testid="earnings-hero">
      <div className="text-center space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{t("thisWeek")}</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <p
            className="text-[1.75rem] font-bold tracking-[-0.02em] tnum text-foreground leading-none"
            data-testid="earnings-hero-amount"
          >
            {usd(heroAmount)}
          </p>
          {status === "pending" ? (
            <StatusPill label={tCommon("pending")} variant="warning" />
          ) : (
            <StatusPill label={tCommon("paid")} variant="success" />
          )}
        </div>
        <div className="pt-1.5">
          <p className="mb-1 text-[0.6875rem] leading-snug text-muted-foreground">{t("nextPayoutIn")}</p>
          <PayoutCountdown variant="long" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3.5">
        <div className="text-center sm:text-start">
          <p className="mb-1 text-[0.6875rem] leading-snug text-muted-foreground">{t("totalReceived")}</p>
          <p className="text-sm font-semibold tnum text-success" data-testid="earnings-all-time">
            {usd(summary.allTimeUsd)}
          </p>
        </div>
        <div className="text-center sm:text-start">
          <p className="mb-1 text-[0.6875rem] leading-snug text-muted-foreground">{t("consecutivePaid")}</p>
          <p className="text-sm font-semibold leading-snug text-foreground" data-testid="earnings-streak">
            {streak > 0 ? (
              t("streak", {
                count: streak,
                unit: streak === 1 ? tCommon("week") : tCommon("weeks"),
              })
            ) : (
              t("noStreak")
            )}
          </p>
        </div>
      </div>
    </Block>
  );
}
