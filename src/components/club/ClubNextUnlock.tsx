"use client";
// File responsibility: next-unlock strip — next tier, amount required, one CTA
// maximum (Explore Estates → Marketplace). Calm, no urgency copy.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { usd } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import type { ClubTier } from "@/lib/club/club-tiers";
import styles from "./club-glass.module.css";

export function ClubNextUnlock({
  nextTier,
  toNextUsd,
}: {
  nextTier: ClubTier | null;
  toNextUsd: number | null;
}) {
  const t = useTranslations("club");

  return (
    <section aria-label={t("nextTitle")} data-testid="club-next-unlock">
      <div className={`${styles.glass3} space-y-3 rounded-[22px] p-5`}>
        <h2 className="text-[0.9375rem] font-semibold text-foreground">{t("nextTitle")}</h2>
        {nextTier && toNextUsd != null ? (
          <>
            <p className="text-sm leading-snug text-muted-foreground tnum">
              {t("toUnlock", { amount: usd(toNextUsd), tier: t(nextTier.labelKey) })}
            </p>
            <Link
              href={ROUTES.marketplace}
              onClick={() => haptics.selection()}
              className={`${styles.btnPrimary} flex min-h-[52px] w-full items-center justify-center text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.98]`}
            >
              {t("exploreEstates")}
            </Link>
          </>
        ) : (
          <p className="text-sm leading-snug text-muted-foreground">{t("topTierNote")}</p>
        )}
      </div>
    </section>
  );
}
