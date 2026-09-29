"use client";
// File responsibility: benefit detail sheet — What it is / Who can access it /
// How it works, each concise. Uses the shared Sheet; no new modal system.
import { useTranslations } from "next-intl";
import { Sheet } from "@/components/common/Sheet";
import { StatusPill } from "@/components/common/StatusPill";
import { CLUB_TIERS } from "@/lib/club/club-tiers";
import { isBenefitUnlocked, type ClubBenefit } from "@/lib/club/club-benefits";
import type { ClubTierId } from "@/lib/club/club-tiers";
import styles from "./club-glass.module.css";

export function ClubBenefitSheet({
  benefit,
  tierId,
  onClose,
}: {
  benefit: ClubBenefit | null;
  tierId: ClubTierId;
  onClose: () => void;
}) {
  const t = useTranslations("club");
  const unlocked = benefit ? isBenefitUnlocked(benefit, tierId) : false;
  const unlockTier = benefit ? CLUB_TIERS.find((x) => x.id === benefit.unlockedAtTierId) : null;

  return (
    <Sheet open={benefit != null} onClose={onClose} labelledBy="club-benefit-sheet-title" className={`bg-transparent ${styles.sheetPanel}`}>
      {benefit ? (
        <div className="space-y-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            <h2 id="club-benefit-sheet-title" className="text-[1.0625rem] font-semibold tracking-tight text-foreground">
              {t(benefit.titleKey)}
            </h2>
            <StatusPill label={unlocked ? t("unlocked") : t("locked")} variant={unlocked ? "success" : "warning"} />
          </div>
          <div>
            <h3 className="text-[0.8125rem] font-semibold text-foreground">{t("sectionWhat")}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(benefit.bodyKey)}</p>
          </div>
          <div>
            <h3 className="text-[0.8125rem] font-semibold text-foreground">{t("sectionAccess")}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground tnum">
              {unlockTier ? t("unlockedAt", { tier: t(unlockTier.labelKey) }) : null}
            </p>
          </div>
          <div>
            <h3 className="text-[0.8125rem] font-semibold text-foreground">{t("sectionHow")}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(benefit.howKey)}</p>
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}
