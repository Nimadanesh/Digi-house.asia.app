"use client";
// File responsibility: Portfolio hero — "calm money": one large value, one muted prose line.
// (UI redesign — figures come straight from the repo contract; no math changes.)
import { useTranslations } from "next-intl";
import { Block } from "@/components/common/Block";
import { usd } from "@/lib/format";
import { portfolioUnrealizedUsd } from "@/lib/portfolio-math";
import type { PortfolioSummary } from "@/types/position";

export function PortfolioSummaryCard({ summary }: { summary: PortfolioSummary }) {
  const t = useTranslations("portfolio");
  const unrealized = portfolioUnrealizedUsd(summary.totalValueUsd, summary.totalInvestedUsd);

  // Secondary trust line — "$12,500 invested · +$90.00 earned · +$60.00 unrealized".
  const secondary = [
    `${usd(summary.totalInvestedUsd)} ${t("investedWord")}`,
    `${summary.totalEarningsUsd >= 0 ? "+" : "−"}${usd(Math.abs(summary.totalEarningsUsd))} ${t("earnedWord")}`,
    `${unrealized >= 0 ? "+" : "−"}${usd(Math.abs(unrealized))} ${t("unrealizedWord")}`,
  ].join(" · ");

  return (
    <Block className="p-5 pb-4" data-testid="portfolio-summary">
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
    </Block>
  );
}
