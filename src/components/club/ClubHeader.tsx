"use client";
// File responsibility: Club header — membership identity first viewport.
// Eyebrow, current tier, invested total, calm progress toward the next tier.
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { CLUB_BENEFITS, isBenefitUnlocked } from "@/lib/club/club-benefits";
import type { ClubTier } from "@/lib/club/club-tiers";
import styles from "./club-glass.module.css";

export function ClubHeader({
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

  // Benefits-active state derives from the unlock model (standard unlocks
  // nothing, so the line appears exactly when the tier carries benefits).
  const hasActiveBenefits = CLUB_BENEFITS.some((b) => isBenefitUnlocked(b, tier.id));

  const progress =
    nextTier && nextTier.minUsdCents > tier.minUsdCents
      ? Math.min(1, Math.max(0, (investedUsd - tier.minUsdCents) / (nextTier.minUsdCents - tier.minUsdCents)))
      : 1;

  return (
    <header className="pt-3" data-testid="club-header">
      <p className="text-[11px] font-semibold uppercase leading-tight tracking-[0.14em] text-muted-foreground">
        {t("eyebrow")}
      </p>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2.5">
        <h1 className="text-[1.875rem] font-semibold leading-none tracking-tight text-foreground tnum">
          {t(tier.labelKey)}
        </h1>{" "}
        <span className="text-[0.9375rem] font-medium leading-none text-muted-foreground">
          {t("member")}
        </span>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed tnum">
        <span className="text-muted-foreground">{t("invested")} · </span>
        <span className="font-semibold text-foreground">{usd(investedUsd)}</span>
      </p>
      {hasActiveBenefits ? (
        <p className="mt-1.5 text-[0.8125rem] font-medium leading-snug text-success">
          {t("benefitsActive", { tier: t(tier.labelKey) })}
        </p>
      ) : null}
      {nextTier == null ? (
        <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{t("highestTier")}</p>
      ) : null}
      {nextTier && toNextUsd != null ? (
        <div className="mt-5">
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
      ) : null}
    </header>
  );
}
