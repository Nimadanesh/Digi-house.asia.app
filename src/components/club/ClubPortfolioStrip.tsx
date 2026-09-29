"use client";
// File responsibility: Portfolio membership strip — supplementary tier status
// only. Portfolio stays Portfolio; links to /club.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { usdCompact } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import { CLUB_TIERS } from "@/lib/club/club-tiers";
import { getClubStatus } from "@/lib/club/club-status";
import { Block } from "@/components/common/Block";

export function ClubPortfolioStrip({ investedUsd }: { investedUsd: number }) {
  const t = useTranslations("club");
  const status = getClubStatus(investedUsd);
  const tier = CLUB_TIERS.find((x) => x.id === status.tierId) ?? CLUB_TIERS[0]!;
  const nextTier = CLUB_TIERS.find((x) => x.id === status.nextTierId) ?? null;

  return (
    <Link
      href={ROUTES.club}
      onClick={() => haptics.selection()}
      data-testid="club-portfolio-strip"
      className="block rounded-[12px] active:opacity-80"
      aria-label={`${t(tier.labelKey)} ${t("member")}`}
    >
      <Block className="flex min-h-[52px] items-center gap-3 px-4 py-2.5">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
          aria-hidden
        >
          <span className="text-xs font-bold">{t(tier.labelKey).charAt(0)}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground tnum">
            {t(tier.labelKey)} {t("member")}
          </span>
          {nextTier && status.toNextUsdCents != null ? (
            <span className="block truncate text-xs text-muted-foreground tnum">
              {t("toUnlock", { amount: usdCompact(status.toNextUsdCents), tier: t(nextTier.labelKey) })}
            </span>
          ) : (
            <span className="block truncate text-xs text-muted-foreground">{t("highestTier")}</span>
          )}
        </span>
      </Block>
    </Link>
  );
}
