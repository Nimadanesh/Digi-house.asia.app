"use client";
// File responsibility: Home ownership hero — "Your Estates" (Phase 9 Slice 3, UI Mapping §3.1).
// Identity-first: total ownership value with a calm estates/invested/rental-income line and a
// single dominant CTA (View My Estates). No day-change badge: value-change % is only shown when
// a trustworthy baseline exists (mapping §3.1 — our dayChangeRatio is simulated, so it stays
// hidden). Figures come straight from the repo contract; no math changes.
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import type { PortfolioSummary } from "@/types/position";
import { Block } from "@/components/common/Block";

export function YourEstatesCard({
  summary,
  onNavigateHaptic,
}: {
  summary: PortfolioSummary;
  onNavigateHaptic?: () => void;
}) {
  const t = useTranslations("home");

  const count = summary.holdings.length;

  // Calm secondary line — "{n} estates · $X invested · +$Y rental income YTD".
  const secondary = [
    t("estatesCount", { count }),
    `${usd(summary.totalInvestedUsd)} ${t("totalInvested")}`,
    `+${usd(summary.totalEarningsUsd)} ${t("rentalIncomeYtd")}`,
  ].join(" · ");

  return (
    <Link
      href={ROUTES.portfolio}
      onClick={() => onNavigateHaptic?.()}
      className="block active:scale-[0.99] transition-transform duration-[120ms] ease-out"
      data-testid="your-estates-card"
    >
      <Block className="p-5 pb-4">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
          {t("yourEstates")}
        </p>
        <p
          className="mt-2 text-[2rem] font-bold leading-none tracking-[-0.02em] tnum text-foreground"
          data-testid="your-estates-amount"
        >
          {usd(summary.totalValueUsd)}
        </p>
        <p
          className="mt-2 pt-1 text-[0.8125rem] leading-relaxed text-muted-foreground tnum"
          data-testid="your-estates-secondary"
        >
          {secondary}
        </p>
        <div
          className="mt-4 flex h-[46px] items-center justify-center gap-1.5 rounded-[10px] bg-primary text-sm font-semibold text-primary-foreground"
          data-testid="your-estates-cta"
        >
          {t("viewMyEstates")}
          <ChevronRight size={16} strokeWidth={2.25} aria-hidden />
        </div>
      </Block>
    </Link>
  );
}