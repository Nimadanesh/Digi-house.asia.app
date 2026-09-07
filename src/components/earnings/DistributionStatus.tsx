"use client";
// File responsibility: payout journey on Income — the distribution pipeline as a
// calm vertical progression (Accrued → Eligible → Requested → Scheduled → Paid
// out) with a next-distribution callout. Each node keeps its own source from
// summarizeDistribution; reached stages fill, the rest stay hollow. Empty stages
// render honest empty lines, unknown balances render Pending. Presentational:
// no new financial logic.
import { useTranslations } from "next-intl";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";
import { usd } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Withdrawal } from "@/types/withdrawal";
import { summarizeDistribution } from "@/lib/income-view-model";

interface JourneyNode {
  id: string;
  label: string;
  sub: string | null;
  value: string;
  valueClass: string;
  reached: boolean;
}

export function DistributionStatus({
  withdrawals,
  withdrawableUsd,
  accruedUsd,
}: {
  /** Undefined while loading (skeleton, never zeros). */
  withdrawals: Withdrawal[] | undefined;
  /** Null when the balance is unknown (Pending, never a fake $0). */
  withdrawableUsd: number | null | undefined;
  /** Current accrued total; omitted when no lock data exists. */
  accruedUsd?: number;
}) {
  const t = useTranslations("earnings");
  const tCommon = useTranslations("common");

  if (withdrawals === undefined || withdrawableUsd === undefined) {
    return (
      <section className="space-y-2" data-testid="dist-loading">
        <Block className="space-y-2 p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
        </Block>
      </section>
    );
  }

  const d = summarizeDistribution(withdrawals, withdrawableUsd);
  const scheduled = d.scheduledUsd.state === "known" && d.nextDueAt != null && d.nextDueUsd != null;

  const nodes: JourneyNode[] = [];
  if (accruedUsd !== undefined) {
    nodes.push({
      id: "dist-accrued",
      label: t("timelineAccrued"),
      sub: null,
      value: usd(accruedUsd),
      valueClass: "text-warning",
      reached: accruedUsd > 0,
    });
  }
  nodes.push(
    {
      id: "dist-eligible",
      label: t("distEligible"),
      sub: t("distEligibleSub"),
      value: d.eligible.state === "known" ? usd(d.eligible.amountUsd) : tCommon("pending"),
      valueClass: "text-foreground",
      reached: d.eligible.state === "known" && d.eligible.amountUsd > 0,
    },
    {
      id: "dist-requested",
      label: t("distRequested"),
      sub:
        d.openRequestCount > 0
          ? t("distRequestedSub", { count: d.openRequestCount })
          : t("distRequestedEmpty"),
      value: d.requestedUsd.state === "known" ? usd(d.requestedUsd.amountUsd) : "—",
      valueClass: "text-foreground",
      reached: d.openRequestCount > 0,
    },
    {
      id: "dist-scheduled",
      label: t("distScheduled"),
      sub:
        d.nextDueAt != null
          ? t("distNextDue", { date: new Date(d.nextDueAt).toLocaleDateString() })
          : t("distScheduledEmpty"),
      value: d.scheduledUsd.state === "known" ? usd(d.scheduledUsd.amountUsd) : "—",
      valueClass: "text-foreground",
      reached: d.scheduledUsd.state === "known",
    },
    {
      id: "dist-paidout",
      label: t("distPaidOut"),
      sub: t("distPaidOutSub", { count: d.paidCount }),
      value: usd(d.paidOutUsd.amountUsd),
      valueClass: "text-success",
      reached: d.paidOutUsd.amountUsd > 0,
    },
  );

  return (
    <section className="space-y-2" data-testid="dist-status">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("distTitle")}
      </h2>
      <Block className="p-4" data-testid="dist-next">
        {scheduled && d.nextDueAt != null && d.nextDueUsd != null ? (
          <div className="space-y-1">
            <p className="text-[0.6875rem] leading-snug text-muted-foreground">
              {t("distNextDue", { date: new Date(d.nextDueAt).toLocaleDateString() })}
            </p>
            <p className="text-[1.375rem] font-bold leading-none tracking-[-0.02em] tnum text-foreground">
              {usd(d.nextDueUsd)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("distScheduledEmpty")}</p>
        )}
      </Block>
      <Block className="p-4">
        <ol className="relative space-y-4 border-s border-border ps-5">
          {nodes.map((n) => (
            <li key={n.id} className="relative" data-testid={n.id}>
              <span
                aria-hidden
                className={cn(
                  "absolute top-[5px] size-2.5 rounded-full",
                  // Dot sits centered on the rail: content starts ps-5 (20px)
                  // inside the bordered list, so -25px lands on the line.
                  "start-[-25px]",
                  n.reached
                    ? "bg-primary ring-4 ring-primary/15"
                    : "border border-border bg-card",
                )}
              />
              <div className="flex min-w-0 items-baseline justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground break-words">{n.label}</p>
                  {n.sub ? (
                    <p className="mt-0.5 text-[0.6875rem] leading-snug text-muted-foreground break-words">
                      {n.sub}
                    </p>
                  ) : null}
                </div>
                <p className={`shrink-0 text-sm tnum font-semibold break-words ${n.valueClass}`}>
                  {n.value}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Block>
    </section>
  );
}
