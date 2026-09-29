"use client";
// File responsibility: membership-card progress — the tier → next-tier bar and
// remaining-amount line, positioned directly under the membership card.
// Logic is identical to the former ClubHeader progress block (moved, not
// changed) so the progress stays owned by the membership card.
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import type { ClubTier } from "@/lib/club/club-tiers";
import styles from "./club-glass.module.css";

export function ClubCardProgress({
  tier,
  investedUsd,
  nextTier,
  toNextUsd,
}: {
  tier: ClubTier;
  investedUsd: number;
  nextTier: ClubTier | null;
  toNextUsd: number | null;
}) {
  const t = useTranslations("club");

  const progress =
    nextTier && nextTier.minUsdCents > tier.minUsdCents
      ? Math.min(1, Math.max(0, (investedUsd - tier.minUsdCents) / (nextTier.minUsdCents - tier.minUsdCents)))
      : 1;

  if (nextTier == null || toNextUsd == null) {
    return (
      <p className="mt-2 text-xs leading-snug text-muted-foreground" data-testid="club-card-progress">
        {t("highestTier")}
      </p>
    );
  }

  return (
    <div className="mt-5" data-testid="club-card-progress">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium leading-tight text-muted-foreground">
          {t(tier.labelKey)}
        </span>
        <span className="text-[11px] font-semibold leading-tight text-foreground tnum">
          {t(nextTier.labelKey)}
        </span>
      </div>
      <div
        className={`${styles.progressTrack} mt-2`}
        role="progressbar"
        aria-label={t("toUnlock", { amount: usd(toNextUsd), tier: t(nextTier.labelKey) })}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div className={styles.progressFill} style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <p className="mt-2 text-xs leading-snug text-muted-foreground tnum">
        {t("toUnlock", { amount: usd(toNextUsd), tier: t(nextTier.labelKey) })}
      </p>
    </div>
  );
}
