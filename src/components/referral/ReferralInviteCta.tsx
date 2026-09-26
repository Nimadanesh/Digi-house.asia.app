"use client";
// File responsibility: Standard-view invite actions — primary Invite (prototype
// copy) + secondary Share. Club variant renders the single Club CTA.
// Logged-out users get an active sign-in entry (existing auth flow); logged-in
// users always get the active invitation CTA, never a disabled sign-in.
import Link from "next/link";
import { Check, UserPlus, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { useInviteLink } from "@/hooks/useInviteLink";
import { ROUTES } from "@/lib/constants";
import styles from "./referral-glass.module.css";

export function ReferralInviteCta({ variant }: { variant: "standard" | "club" }) {
  const t = useTranslations("referral");
  const { copied, isLoggedIn, copyInvite, shareInvite } = useInviteLink();
  const primaryLabel = variant === "club" ? t("clubCta") : t("inviteCta");
  const testid = variant === "club" ? "referral-club-cta" : "referral-cta-invite";

  if (!isLoggedIn) {
    return (
      <div id="referral-invite" className="flex scroll-mt-24 flex-col gap-2">
        <Link
          href={ROUTES.recoveryLogin}
          onClick={() => haptics.selection()}
          data-testid={testid}
          className={`${styles.btnPrimary} flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] px-4 text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.98]`}
        >
          <UserPlus size={18} strokeWidth={2} aria-hidden />
          {t("signInToInvite")}
        </Link>
      </div>
    );
  }

  return (
    <div id="referral-invite" className="flex scroll-mt-24 flex-col gap-2">
      <button
        type="button"
        data-testid={testid}
        onClick={() => {
          haptics.selection();
          void copyInvite();
        }}
        className={`${styles.btnPrimary} flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] px-4 text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.98]`}
      >
        {copied ? <Check size={18} strokeWidth={2} aria-hidden /> : <UserPlus size={18} strokeWidth={2} aria-hidden />}
        {copied ? t("copied") : primaryLabel}
      </button>
      {variant === "standard" ? (
        <button
          type="button"
          data-testid="referral-cta-share"
          onClick={() => {
            haptics.selection();
            void shareInvite();
          }}
          className={`${styles.btnSecondary} flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] px-4 text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.98]`}
        >
          <Share2 size={18} strokeWidth={2} aria-hidden />
          {t("shareCta")}
        </button>
      ) : null}
    </div>
  );
}
