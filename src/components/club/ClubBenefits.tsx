"use client";
// File responsibility: the six Club benefit tiles in three groups (Access /
// Experiences / Membership) — icon + title + locked/unlocked state only.
// Long copy lives in ClubBenefitSheet (progressive disclosure).
import { Bell, CreditCard, Gift, Home, UserPlus, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import {
  CLUB_BENEFITS,
  isBenefitUnlocked,
  type ClubBenefit,
  type ClubBenefitGroup,
} from "@/lib/club/club-benefits";
import type { ClubTierId } from "@/lib/club/club-tiers";
import { cn } from "@/lib/utils";
import styles from "./club-glass.module.css";

const ICONS = {
  villa: Home,
  escape: Gift,
  priority: Zap,
  concierge: Bell,
  card: CreditCard,
  referral: UserPlus,
} as const;

const GROUPS: readonly ClubBenefitGroup[] = ["access", "experiences", "membership"];

function BenefitTile({
  benefit,
  unlocked,
  onSelect,
}: {
  benefit: ClubBenefit;
  unlocked: boolean;
  onSelect: (benefit: ClubBenefit) => void;
}) {
  const t = useTranslations("club");
  const Icon = ICONS[benefit.icon];
  return (
    <button
      type="button"
      data-testid="club-benefit"
      data-benefit={benefit.id}
      data-unlocked={unlocked ? "true" : "false"}
      aria-label={`${t(benefit.titleKey)} — ${unlocked ? t("unlocked") : t("locked")}`}
      onClick={() => {
        haptics.selection();
        onSelect(benefit);
      }}
      className={cn(
        "flex min-h-[88px] flex-col items-start justify-between gap-2 rounded-[18px] p-3 text-start active:opacity-80",
        styles.glass2,
        unlocked ? "opacity-100" : "opacity-70",
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-full",
          unlocked ? "bg-[#4B8BFF]/15 text-[#4B8BFF]" : "bg-surface-2 text-muted-foreground",
        )}
        aria-hidden
      >
        <Icon size={18} strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[0.8125rem] font-medium leading-snug text-foreground">
          {t(benefit.titleKey)}
        </span>
        <span
          className={cn(
            "mt-0.5 block text-[11px] font-medium leading-tight",
            unlocked ? "text-[#34D399]" : "text-muted-foreground",
          )}
        >
          {unlocked ? t("unlocked") : t("locked")}
        </span>
      </span>
    </button>
  );
}

export function ClubBenefits({
  tierId,
  onSelect,
}: {
  tierId: ClubTierId;
  onSelect: (benefit: ClubBenefit) => void;
}) {
  const t = useTranslations("club");

  return (
    <section aria-label={t("benefitsTitle")} data-testid="club-benefits" className="mt-2">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">{t("benefitsTitle")}</h2>
      {GROUPS.map((group) => (
        <div key={group} className="mt-3">
          <p className="px-0.5 text-[11px] font-semibold uppercase leading-tight tracking-[0.14em] text-muted-foreground">
            {t(`group.${group}`)}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            {CLUB_BENEFITS.filter((b) => b.group === group).map((benefit) => (
              <BenefitTile
                key={benefit.id}
                benefit={benefit}
                unlocked={isBenefitUnlocked(benefit, tierId)}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
