"use client";
// File responsibility: referral progression ladder — milestones with locked /
// reached states from prototype referral state, plus the Referral Hub entry.
// No ledger, no backend; counts come from useReferralProgress (prototype zero
// until a real source exists), so the ladder renders honestly locked.
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { ROUTES } from "@/lib/constants";
import { REFERRAL_LADDER, STANDARD_AWARD_NIGHTS, referralProgress, referralStayNights } from "@/lib/club/club-economics";
import { useReferralProgress } from "@/hooks/useReferrals";
import { cn } from "@/lib/utils";
import styles from "./club-glass.module.css";

const REWARD_KEYS = [
  "referralReward.point",
  "referralReward.value",
  "referralReward.experience",
  "referralReward.priority",
  "referralReward.plusLayer",
] as const;

export function ClubReferralProgress() {
  const t = useTranslations("club");
  const { successfulReferrals } = useReferralProgress();
  const progress = referralProgress(successfulReferrals);
  const finalMilestone = REFERRAL_LADDER[REFERRAL_LADDER.length - 1]!;
  const remaining = Math.max(0, finalMilestone.referrals - progress.successfulReferrals);
  const stayNights = referralStayNights(successfulReferrals);
  const currentAdditional = stayNights - STANDARD_AWARD_NIGHTS;
  const nextReward =
    progress.nextMilestone &&
    (progress.nextMilestone.unlocksPlusLayer ||
      progress.nextMilestone.additionalNights !== currentAdditional)
      ? progress.nextMilestone.unlocksPlusLayer
        ? t("referralNextPlus")
        : t("referralNextStay", {
            nights: STANDARD_AWARD_NIGHTS + progress.nextMilestone.additionalNights,
          })
      : null;

  return (
    <section aria-label={t("referralProgressTitle")} data-testid="club-referral-progress">
      <div className={`${styles.glass2} relative overflow-hidden rounded-[22px]`}>
        <div className="relative space-y-1 p-5">
          <h2 className="text-[0.9375rem] font-semibold text-foreground">{t("referralProgressTitle")}</h2>
          <p className="text-[0.8125rem] font-medium leading-snug text-foreground tnum">
            {t("referralProgressSummary", {
              count: progress.successfulReferrals,
              points: progress.cumulativePoints,
            })}
          </p>
          <p className="text-[0.8125rem] leading-snug text-muted-foreground tnum">
            {t("referralCurrentStay", { nights: stayNights })}
            {nextReward ? ` · ${nextReward}` : ""}
          </p>
          <p className="text-[0.8125rem] leading-snug text-muted-foreground tnum">
            {progress.plusLayerUnlocked
              ? t("referralPlusUnlocked")
              : t("referralToPlus", { count: remaining })}
          </p>
          <ul className="pt-2">
            {REFERRAL_LADDER.map((milestone, i) => {
              const reached = successfulReferrals >= milestone.referrals;
              return (
                <li
                  key={milestone.referrals}
                  data-testid="referral-milestone"
                  data-referrals={milestone.referrals}
                  data-reached={reached ? "true" : "false"}
                  className="flex min-h-[48px] items-center gap-3 border-b border-white/[0.07] py-2 last:border-b-0"
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full",
                      reached ? "bg-[#4B8BFF] text-white" : "bg-white/[0.06] text-[#A0A8B8]",
                    )}
                    aria-hidden
                  >
                    {reached ? (
                      <Check size={13} strokeWidth={2.5} />
                    ) : (
                      <Lock size={12} strokeWidth={2} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {t(REWARD_KEYS[i]!)}
                    </span>
                    <span className="sr-only">{reached ? t("unlocked") : t("locked")}</span>
                    <span className="block text-[11px] leading-tight text-muted-foreground tnum">
                      {t("referralMilestoneCount", { count: milestone.referrals })}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-medium text-muted-foreground tnum">
                    {t("referralPointsValue", { count: milestone.cumulativePoints })}
                  </span>
                </li>
              );
            })}
          </ul>
          <Link
            href={ROUTES.referral}
            onClick={() => haptics.selection()}
            data-testid="club-referral-progress-cta"
            className={`${styles.btnSecondary} mt-3 flex min-h-[48px] w-full items-center justify-center rounded-[14px] text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.98]`}
          >
            {t("referralCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
