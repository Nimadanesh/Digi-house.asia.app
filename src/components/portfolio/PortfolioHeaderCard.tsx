"use client";
// File responsibility: Portfolio hero — large value, subtitle, locked/free split in one premium card.
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Block } from "@/components/common/Block";
import { usd } from "@/lib/format";
import { portfolioUnrealizedUsd } from "@/lib/portfolio-math";
import type { PortfolioSummary } from "@/types/position";

export function PortfolioHeaderCard({
  summary,
  lockedShares,
  freeShares,
}: {
  summary: PortfolioSummary;
  lockedShares: number;
  freeShares: number;
}) {
  const t = useTranslations("portfolio");
  const unrealized = portfolioUnrealizedUsd(summary.totalValueUsd, summary.totalInvestedUsd);
  const totalShares = Math.max(0, lockedShares + freeShares);
  const lockedRatio = totalShares > 0 ? lockedShares / totalShares : 0;

  const secondary = [
    `${usd(summary.totalInvestedUsd)} ${t("investedWord")}`,
    `${summary.totalEarningsUsd >= 0 ? "+" : "−"}${usd(Math.abs(summary.totalEarningsUsd))} ${t("earnedWord")}`,
    `${unrealized >= 0 ? "+" : "−"}${usd(Math.abs(unrealized))} ${t("unrealizedWord")}`,
  ].join(" · ");

  return (
    <Block className="p-5" data-testid="portfolio-summary">
      <div className="space-y-2">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
          {t("totalValue")}
        </p>
        <p
          className="text-[2rem] font-bold leading-none tracking-[-0.02em] tnum text-foreground"
          data-testid="portfolio-total-value"
        >
          {usd(summary.totalValueUsd)}
        </p>
        <p
          className="pt-1 text-[0.8125rem] leading-relaxed text-muted-foreground tnum"
          data-testid="portfolio-hero-secondary"
        >
          {secondary}
        </p>
      </div>

      <div className="mt-5 border-t border-border pt-5" data-testid="locked-free-card">
        <div className="flex items-center gap-4">
          <div className="grid min-w-0 flex-1 grid-cols-2">
            <div className="min-w-0 pe-4">
              <div className="flex items-center gap-1.5">
                <Lock size={14} strokeWidth={1.75} className="shrink-0 text-muted-foreground" aria-hidden />
                <p className="truncate text-xs font-medium text-muted-foreground">{t("lockedShares")}</p>
              </div>
              <p className="mt-2 text-xl font-semibold leading-none tnum text-foreground" data-testid="locked-shares-value">
                {lockedShares}
              </p>
              <p className="mt-2 text-[0.6875rem] leading-snug text-muted-foreground">{t("lockedCaption")}</p>
            </div>
            <div className="min-w-0 border-s border-border ps-4">
              <p className="text-xs font-medium text-muted-foreground">{t("freeShares")}</p>
              <p className="mt-2 text-xl font-semibold leading-none tnum text-foreground" data-testid="free-shares-value">
                {freeShares}
              </p>
              <p className="mt-2 text-[0.6875rem] leading-snug text-muted-foreground">{t("freeCaption")}</p>
            </div>
          </div>
          <div
            className="relative size-[52px] shrink-0"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(lockedRatio * 100)}
            aria-label={t("lockedShares")}
            data-testid="lock-ring"
          >
            <svg viewBox="0 0 52 52" className="size-[52px] -rotate-90" aria-hidden>
              <circle cx="26" cy="26" r="22" fill="none" strokeWidth="5" className="stroke-surface-2" />
              <circle
                cx="26"
                cy="26"
                r="22"
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                className="stroke-primary"
                strokeDasharray={`${(lockedRatio * 138.23).toFixed(1)} 138.23`}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-[0.6875rem] font-semibold tnum text-foreground"
              data-testid="lock-ring-pct"
            >
              {Math.round(lockedRatio * 100)}%
            </span>
          </div>
        </div>
      </div>
    </Block>
  );
}
