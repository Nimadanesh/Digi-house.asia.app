"use client";
// File responsibility: Standard referral view — investment-linked reward
// ladder, two labeled examples, 3-step explainer, lock panel, CTAs, Club
// nudge. Reads STANDARD_REFERRAL_BANDS; never mentions points or stays.
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import {
  STANDARD_REFERRAL_BANDS,
  getStandardReferralReward,
} from "@/lib/referral/standard-referral-model";
import { ReferralInviteCta } from "./ReferralInviteCta";
import styles from "./referral-glass.module.css";

const BAND_RANGE_KEYS = ["band0range", "band1range", "band2range"] as const;
const STEP_KEYS = [
  { title: "step1title", sub: "step1sub" },
  { title: "step2title", sub: "step2sub" },
  { title: "step3title", sub: "step3sub" },
] as const;

function rewardFor(inviteeCents: number): number {
  const r = getStandardReferralReward(inviteeCents);
  return r.kind === "reward" ? r.rewardCents : 0;
}

const EXAMPLES = [
  { investCents: 2_000_000, useKey: "exampleUseShares" },
  { investCents: 5_000_000, useKey: "exampleUseToward" },
] as const;

export function StandardReferralView({ onSwitchToClub }: { onSwitchToClub: () => void }) {
  const t = useTranslations("referral");

  return (
    <div data-testid="referral-standard-view" role="tabpanel" className="space-y-4">
      <div className={`${styles.glass} rounded-[22px] p-5`}>
        <h2 className="text-[0.9375rem] font-semibold text-foreground">{t("standardTitle")}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t("standardSub")}</p>
      </div>

      <section aria-label={t("ladderTitle")} data-testid="referral-ladder">
        <div className={`${styles.glass} rounded-[22px] p-5`}>
          <h3 className="text-[0.9375rem] font-semibold text-foreground">{t("ladderTitle")}</h3>
          <ul className="mt-1">
            {STANDARD_REFERRAL_BANDS.map((band, i) => (
              <li
                key={band.minCents}
                data-testid="referral-band"
                data-rate-bps={band.rateBps}
                className="flex min-h-[56px] items-center justify-between gap-3 border-b border-white/[0.07] py-2.5 last:border-b-0"
              >
                <span className="text-sm font-medium text-foreground tnum">{t(BAND_RANGE_KEYS[i]!)}</span>
                <span className="text-right">
                  <span className="block text-lg font-semibold leading-tight text-[#4B8BFF] tnum">
                    {(band.rateBps / 100).toLocaleString(undefined, { maximumFractionDigits: 1 })}%
                  </span>
                  <span className="block text-[11px] leading-tight text-muted-foreground">
                    {t("referralReward")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div data-testid="referral-custom-note" className="mt-3 rounded-[14px] bg-white/[0.04] px-3.5 py-3">
            <p className="text-sm font-medium text-foreground tnum">{t("customTitle")}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{t("customNote")}</p>
          </div>
          <p className="mt-3 text-[11px] leading-snug text-muted-foreground">{t("ladderNote")}</p>
        </div>
      </section>

      <div data-testid="referral-examples" className={`${styles.glass} rounded-[22px] p-5`}>
        <ul className="space-y-3">
          {EXAMPLES.map((ex) => (
            <li key={ex.investCents} data-testid="referral-example" className="rounded-[14px] bg-white/[0.04] px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {t("exampleLabel")}
              </p>
              <p className="mt-1 text-sm text-foreground tnum">{t("exampleInvest", { amount: usd(ex.investCents) })}</p>
              <p className="mt-0.5 text-sm font-semibold text-[#4B8BFF] tnum">
                {t("exampleReward", { amount: usd(rewardFor(ex.investCents)) })}
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{t(ex.useKey)}</p>
            </li>
          ))}
        </ul>
      </div>

      <div id="referral-how" className={`${styles.glass} scroll-mt-24 rounded-[22px] p-5`}>
        <h3 className="text-[0.9375rem] font-semibold text-foreground">{t("howTitle")}</h3>
        <ol className="mt-2 space-y-1">
          {STEP_KEYS.map((step, i) => (
            <li
              key={step.title}
              data-testid="referral-how-step"
              className="flex min-h-[48px] items-center gap-3 border-b border-white/[0.07] py-2 last:border-b-0"
            >
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#4B8BFF]/15 text-[13px] font-semibold text-[#4B8BFF] tnum"
              >
                {i + 1}
              </span>
              <span>
                <span className="block text-sm font-medium text-foreground">{t(step.title)}</span>
                <span className="block text-[13px] leading-snug text-muted-foreground">{t(step.sub)}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm font-medium leading-snug text-foreground">{t("howNote")}</p>
      </div>

      <div data-testid="referral-lock" className={`${styles.glass} flex gap-3 rounded-[22px] p-5`}>
        <Lock size={18} strokeWidth={1.75} aria-hidden className="mt-0.5 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-sm font-semibold text-foreground">{t("lockTitle")}</p>
          <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{t("lockBody")}</p>
        </div>
      </div>

      <ReferralInviteCta variant="standard" />

      <div className={`${styles.glass} rounded-[22px] p-5`}>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("clubNudge")}</p>
        <button
          type="button"
          data-testid="referral-nudge-club"
          onClick={() => onSwitchToClub()}
          className={`${styles.btnSecondary} mt-3 flex min-h-[44px] w-full items-center justify-center rounded-[14px] px-4 text-sm font-semibold transition-transform duration-150 ease-out active:scale-[0.98]`}
        >
          {t("clubNudgeCta")}
        </button>
      </div>
    </div>
  );
}
