"use client";
// File responsibility: tier detail sheet — tier name, threshold, one-line
// description, benefits unlocked at that level. Uses the shared Sheet;
// benefit bodies stay in the benefit sheet (progressive disclosure).
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { CLUB_BENEFITS } from "@/lib/club/club-benefits";
import { getClubTierState, type ClubTier } from "@/lib/club/club-tiers";
import { Sheet } from "@/components/common/Sheet";
import styles from "./club-glass.module.css";

export function ClubTierSheet({
  tier,
  currentTierId,
  onClose,
}: {
  tier: ClubTier | null;
  currentTierId: ClubTier["id"];
  onClose: () => void;
}) {
  const t = useTranslations("club");
  const atLevel = tier ? CLUB_BENEFITS.filter((b) => b.unlockedAtTierId === tier.id) : [];

  return (
    <Sheet open={tier != null} onClose={onClose} labelledBy="club-tier-sheet-title" className={`bg-transparent ${styles.sheetPanel}`}>
      {tier ? (
        <div className="space-y-3 pb-2">
          <div className="flex items-center justify-between gap-2">
            <h2 id="club-tier-sheet-title" className="text-[1.0625rem] font-semibold tracking-tight text-foreground tnum">
              {t(tier.labelKey)} {t("member")}
            </h2>
            {getClubTierState(tier.id, currentTierId) === "current" ? (
              <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                {t("current")}
              </span>
            ) : null}
          </div>
          <p className="text-sm font-medium text-foreground tnum">
            {tier.minUsdCents > 0 ? `${usd(tier.minUsdCents)}+` : usd(0)}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t(tier.descKey)}</p>
          <div>
            <h3 className="text-[0.8125rem] font-semibold text-foreground">{t("tierBenefitsTitle")}</h3>
            {atLevel.length > 0 ? (
              <ul className="mt-1.5 space-y-1.5">
                {atLevel.map((b) => (
                  <li key={b.id} className="flex items-center gap-2.5">
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                      aria-hidden
                    >
                      <Check size={13} strokeWidth={2.5} />
                    </span>
                    <span className="min-w-0 truncate text-sm text-foreground">{t(b.titleKey)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("tierNoBenefits")}</p>
            )}
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}
