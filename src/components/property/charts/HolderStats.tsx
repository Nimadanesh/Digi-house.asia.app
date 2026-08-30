"use client";
// File responsibility: Holder Statistics block (REDESIGN-SPEC §12.6) — compact
// statistics area where every value derives from the SAME Phase 4 shared holder
// dataset (buckets + ownership history). No PII, no invented data.
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { HolderBucket, OwnershipPoint } from "@/lib/property-analytics";
import { Block } from "@/components/common/Block";

export function HolderStats({
  holders,
  ownershipHistory,
}: {
  holders: HolderBucket[];
  /** Destructured out — bucket weightBps already encode shares/totalShares;
   * the raw total is intentionally unused in the statistics block. */
  totalShares: number;
  ownershipHistory: OwnershipPoint[];
}) {
  const t = useTranslations("property");

  const stats = useMemo(() => {
    const shares = holders.map((h) => h.shares);

    // Total holders: today's holderCount from the shared ownership history.
    const totalHolders = ownershipHistory[ownershipHistory.length - 1]?.holderCount ?? 0;

    // Average holding (shares per bucket is the dataset's granularity).
    const avg = Math.round(shares.reduce((s, v) => s + v, 0) / Math.max(1, shares.length));

    // Median holding across buckets.
    const sorted = [...shares].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 1
        ? sorted[mid]
        : Math.round((sorted[mid - 1] + sorted[mid]) / 2);

    // Top 5 ownership % — the dataset has 6 anonymized buckets, so "top 10"
    // granularity does not exist; the honest equivalent is Top 5.
    const top5Bps = [...holders]
      .sort((a, b) => b.shares - a.shares)
      .slice(0, 5)
      .reduce((s, h) => s + h.weightBps, 0);

    // New holders 30D: holderCount growth over the last ~4 weeks of shared history.
    const nowCount = ownershipHistory[ownershipHistory.length - 1]?.holderCount ?? 0;
    const monthAgoCount =
      ownershipHistory[ownershipHistory.length - 5]?.holderCount ?? nowCount;
    const new30d = Math.max(0, nowCount - monthAgoCount);

    // Largest holder %.
    const largestBps = Math.max(...holders.map((h) => h.weightBps));

    return { totalHolders, avg, median, top5Bps, new30d, largestBps };
  }, [holders, ownershipHistory]);

  const cell =
    "rounded-[10px] bg-surface-2 px-3 py-2 text-center";
  const labelCls =
    "text-[0.6875rem] uppercase tracking-wide text-muted-foreground";
  const valueCls = "text-[1.125rem] font-bold leading-tight text-foreground tnum";

  return (
    <Block className="space-y-3 p-4" data-testid="holder-stats">
      <h3 className="text-[0.9375rem] font-semibold text-foreground">
        {t("holderStatsTitle")}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <div className={cell} data-testid="stat-total-holders">
          <p className={labelCls}>{t("statTotalHolders")}</p>
          <p className={valueCls}>{stats.totalHolders}</p>
        </div>
        <div className={cell} data-testid="stat-avg-holding">
          <p className={labelCls}>{t("statAvgHolding")}</p>
          <p className={valueCls}>{stats.avg.toLocaleString()}</p>
        </div>
        <div className={cell} data-testid="stat-median-holding">
          <p className={labelCls}>{t("statMedianHolding")}</p>
          <p className={valueCls}>{stats.median.toLocaleString()}</p>
        </div>
        <div className={cell} data-testid="stat-top5">
          <p className={labelCls}>{t("statTop5Ownership")}</p>
          <p className={valueCls}>{(stats.top5Bps / 100).toFixed(1)}%</p>
        </div>
        <div className={cell} data-testid="stat-new-30d">
          <p className={labelCls}>{t("statNewHolders30d")}</p>
          <p className={valueCls}>{stats.new30d}</p>
        </div>
        <div className={cell} data-testid="stat-largest">
          <p className={labelCls}>{t("statLargestHolder")}</p>
          <p className={valueCls}>{(stats.largestBps / 100).toFixed(1)}%</p>
        </div>
      </div>
      <p className="px-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
        {t("holderPrivacyNote")}
      </p>
    </Block>
  );
}
