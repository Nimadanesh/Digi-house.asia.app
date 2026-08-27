"use client";
// File responsibility: Home portfolio value hero card (redesign — "calm money").
// One large figure, one muted prose line; no day-change badge / FOMO cue. Figures come straight
// from the repo contract; no math changes. Mirrors the Portfolio hero's calm hierarchy.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import type { PortfolioSummary } from "@/types/position";
import { Block } from "@/components/common/Block";

export function PortfolioValueCard({
  summary,
  onNavigateHaptic,
}: {
  summary: PortfolioSummary;
  onNavigateHaptic?: () => void;
}) {
  const t = useTranslations("home");

  // Calm secondary line — "$12,500 invested · +$120 earned".
  const secondary = [
    `${usd(summary.totalInvestedUsd)} ${t("totalInvested")}`,
    `${summary.totalEarningsUsd >= 0 ? "+" : "−"}${usd(Math.abs(summary.totalEarningsUsd))} ${t("earnedWord")}`,
  ].join(" · ");

  return (
    <Link
      href={ROUTES.portfolio}
      onClick={() => onNavigateHaptic?.()}
      className="block active:scale-[0.99] transition-transform duration-[120ms] ease-out"
      data-testid="portfolio-value-card"
    >
      <Block className="p-5 pb-4">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
          {t("portfolioValue")}
        </p>
        <p
          className="mt-2 text-[2rem] font-bold leading-none tracking-[-0.02em] tnum text-foreground"
          data-testid="portfolio-value-amount"
        >
          {usd(summary.totalValueUsd)}
        </p>
        <p
          className="mt-2 pt-1 text-[0.8125rem] leading-relaxed text-muted-foreground tnum"
          data-testid="portfolio-hero-secondary"
        >
          {secondary}
        </p>
      </Block>
    </Link>
  );
}