"use client";
// File responsibility: Home Revolut-style hero shell — label, big estate value, rental
// subline, estates pill (filled) or $0 + entry subline (empty). Binds to the existing
// PortfolioSummary fields only (totalValueUsd, totalEarningsUsd, holdings.length);
// no math, no new data, no CTAs, no carousel dots.
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import type { PortfolioSummary } from "@/types/position";

export function HomeHero({
  summary,
  onPill,
}: {
  summary: PortfolioSummary;
  onPill?: () => void;
}) {
  const t = useTranslations("home");
  const count = summary.holdings.length;
  const hasOwnership = count > 0;
  const amount = hasOwnership ? usd(summary.totalValueUsd) : usd(0);

  return (
    <section
      data-testid="home-hero"
      className="flex flex-col items-center px-5 pb-6 pt-6 text-center"
    >
      <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.55)]">
        {t("yourBalance")}
      </p>
      <p
        data-testid="home-hero-amount"
        className="balance-shimmer text-[36px] leading-[1.1] tracking-[-0.02em]"
      >
        {amount}
      </p>
      <p
        data-testid="home-hero-subline"
        className={
          hasOwnership
            ? "mt-2 text-[13px] leading-relaxed text-success tnum"
            : "mt-2 text-[13px] leading-relaxed text-muted-foreground"
        }
      >
        {hasOwnership
          ? `+${usd(summary.totalEarningsUsd)} ${t("rentalIncomeYtd")}`
          : t("fromEighty")}
      </p>
      {hasOwnership ? (
        <button
          type="button"
          onClick={() => {
            haptics.selection();
            onPill?.();
          }}
          data-testid="home-hero-pill"
          className="mt-3 inline-flex items-center rounded-full bg-[rgba(255,255,255,0.10)] px-3 py-1.5 text-[12px] font-medium tnum text-[rgba(255,255,255,0.80)] active:opacity-80"
        >
          {t("estatesCount", { count })}
        </button>
      ) : null}
    </section>
  );
}
