"use client";
// File responsibility: Referral Hub hero — eyebrow, headline, support copy,
// primary Invite action (prototype copy) + How-It-Works anchor.
// Logged-out users get an active sign-in entry; logged-in users get the
// active invitation CTA, never a disabled sign-in.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { useInviteLink } from "@/hooks/useInviteLink";
import { ROUTES } from "@/lib/constants";
import styles from "./referral-glass.module.css";
import type { ReferralTab } from "./referral-tab";

export function ReferralHero({ activeTab }: { activeTab: ReferralTab }) {
  const t = useTranslations("referral");
  const { copied, isLoggedIn, copyInvite } = useInviteLink();

  return (
    <section aria-label={t("eyebrow")} data-testid="referral-hero">
      <div className={`${styles.glassHighlight} relative overflow-hidden rounded-[28px]`}>
        <div className="relative p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4B8BFF]">
            {t("eyebrow")}
          </p>
          <h1 className="mt-1.5 text-[1.625rem] font-semibold leading-tight tracking-tight text-foreground lg:text-[1.75rem]">
            {t("headline")}
          </h1>
          <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
            {t("support")}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {!isLoggedIn ? (
              <Link
                href={ROUTES.recoveryLogin}
                onClick={() => haptics.selection()}
                data-testid="referral-hero-invite"
                className={`${styles.btnPrimary} flex min-h-[48px] w-full items-center justify-center rounded-[14px] px-4 text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.98]`}
              >
                {t("signInToInvite")}
              </Link>
            ) : (
              <button
                type="button"
                data-testid="referral-hero-invite"
                onClick={() => {
                  haptics.selection();
                  void copyInvite();
                }}
                className={`${styles.btnPrimary} flex min-h-[48px] w-full items-center justify-center rounded-[14px] px-4 text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.98]`}
              >
                {copied ? t("copied") : t("heroInvite")}
              </button>
            )}
            <a
              href={activeTab === "standard" ? "#referral-how" : "#referral-club-ladder"}
              onClick={() => haptics.selection()}
              data-testid="referral-hero-how"
              className={`${styles.btnSecondary} flex min-h-[48px] w-full items-center justify-center rounded-[14px] px-4 text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.98]`}
            >
              {t("heroHow")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
