"use client";
// File responsibility: Club referral view — qualified-referral progress,
// milestone ladder, stay enhancement, Plus layer, tier-unchanged note, Club
// CTA. Reads the Club V1 single source of truth (club-economics) only; never
// mentions dollar rewards.
import { Check, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useReferralProgress } from "@/hooks/useReferrals";
import {
  REFERRAL_LADDER,
  STANDARD_AWARD_NIGHTS,
  referralProgress,
  referralStayNights,
} from "@/lib/club/club-economics";
import { cn } from "@/lib/utils";
import { ReferralInviteCta } from "./ReferralInviteCta";
import styles from "./referral-glass.module.css";

export function ClubReferralView() {
  const t = useTranslations("referral");
  const { successfulReferrals } = useReferralProgress();
  const progress = referralProgress(successfulReferrals);
  const stayNights = referralStayNights(successfulReferrals);
  const currentAdditional = stayNights - STANDARD_AWARD_NIGHTS;
  const remainingToPlus = Math.max(0, 10 - progress.successfulReferrals);

  // V1 presentation rule: surface the next reward only when it changes
  // something (more nights or the Plus layer) — never "Next: 4-night" at base.
  const nextReward =
    progress.nextMilestone &&
    (progress.nextMilestone.unlocksPlusLayer ||
      progress.nextMilestone.additionalNights !== currentAdditional)
      ? progress.nextMilestone.unlocksPlusLayer
        ? t("clubNextPlus")
        : t("clubNextStay", { nights: STANDARD_AWARD_NIGHTS + progress.nextMilestone.additionalNights })
      : null;

  return (
    <div data-testid="referral-club-view" role="tabpanel" className="space-y-4">
      <div className={`${styles.glass} rounded-[22px] p-5`}>
        <h2 className="text-[0.9375rem] font-semibold text-foreground">{t("clubTitle")}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t("clubSub")}</p>
      </div>

      <section aria-label={t("clubProgressTitle")} data-testid="referral-club-progress">
        <div className={`${styles.glassClub} rounded-[22px] p-5`}>
          <h3 className="text-[0.9375rem] font-semibold text-foreground">{t("clubProgressTitle")}</h3>
          <p className="mt-1.5 text-[0.8125rem] font-medium leading-snug text-foreground tnum">
            {t("clubQualified", { count: progress.successfulReferrals })}
            {" · "}
            {t("clubPoints", { count: progress.cumulativePoints })}
          </p>
          <p className="mt-0.5 text-[0.8125rem] leading-snug text-muted-foreground tnum">
            {t("clubStay", { nights: stayNights })}
            {nextReward ? ` · ${nextReward}` : ""}
          </p>
          <p className="mt-0.5 text-[0.8125rem] leading-snug text-muted-foreground tnum">
            {progress.plusLayerUnlocked
              ? t("plusUnlocked")
              : t("plusRemaining", { count: remainingToPlus })}
          </p>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={10}
            aria-valuenow={Math.min(progress.successfulReferrals, 10)}
          >
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(100, (progress.successfulReferrals / 10) * 100)}%` }}
            />
          </div>
        </div>
      </section>

      <section aria-label={t("clubLadderTitle")} data-testid="referral-club-ladder" className="scroll-mt-24">
        <div className={`${styles.glass} rounded-[22px] p-5`}>
          <h3 className="text-[0.9375rem] font-semibold text-foreground">{t("clubLadderTitle")}</h3>
          <ul className="mt-1">
            {REFERRAL_LADDER.map((milestone) => {
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
                    aria-hidden
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full",
                      reached ? "bg-[#4B8BFF] text-white" : "bg-white/[0.06] text-[#A0A8B8]",
                    )}
                  >
                    {reached ? <Check size={13} strokeWidth={2.5} /> : <Lock size={12} strokeWidth={2} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground tnum">
                      {t("clubMilestoneCount", { count: milestone.referrals })}
                    </span>
                    {milestone.unlocksPlusLayer ? (
                      <span className="block truncate text-[11px] leading-tight text-[#D4AF77]">
                        {t("plusTitle")}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-[11px] font-medium text-muted-foreground tnum">
                    {t("clubMilestonePoints", { count: milestone.cumulativePoints })}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <div data-testid="referral-stay" className={`${styles.glass} rounded-[22px] p-5`}>
        <h3 className="text-[0.9375rem] font-semibold text-foreground">{t("clubStayTitle")}</h3>
        <p className="mt-1.5 text-sm text-foreground tnum">{t("clubStayBase")}</p>
        <p className="mt-0.5 text-sm text-foreground tnum">{t("clubStayMax")}</p>
        <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{t("clubStayNote")}</p>
      </div>

      <div data-testid="referral-plus" className={`${styles.glassClub} rounded-[22px] p-5`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D4AF77]">
          {t("plusTitle")}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t("plusBody")}</p>
      </div>

      <p data-testid="referral-tier-note" className="px-1 text-[13px] leading-snug text-muted-foreground">
        {t("tierNote")}
      </p>

      <ReferralInviteCta variant="club" />
    </div>
  );
}
