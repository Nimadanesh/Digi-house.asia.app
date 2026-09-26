"use client";
// File responsibility: Standard-view invite actions — primary Invite (prototype
// copy) + secondary Share. Club variant renders the single Club CTA.
import { Check, UserPlus, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { useInviteLink } from "@/hooks/useInviteLink";
import styles from "./referral-glass.module.css";

export function ReferralInviteCta({ variant }: { variant: "standard" | "club" }) {
  const t = useTranslations("referral");
  const { copied, canInvite, copyInvite, shareInvite } = useInviteLink();
  const primaryLabel = variant === "club" ? t("clubCta") : t("inviteCta");

  return (
    <div id="referral-invite" className="flex scroll-mt-24 flex-col gap-2">
      <button
        type="button"
        data-testid={variant === "club" ? "referral-club-cta" : "referral-cta-invite"}
        disabled={!canInvite}
        onClick={() => {
          haptics.selection();
          void copyInvite();
        }}
        className={`${styles.btnPrimary} flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] px-4 text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.98] disabled:opacity-50`}
      >
        {copied ? <Check size={18} strokeWidth={2} aria-hidden /> : <UserPlus size={18} strokeWidth={2} aria-hidden />}
        {copied ? t("copied") : !canInvite ? t("signInToInvite") : primaryLabel}
      </button>
      {variant === "standard" ? (
        <button
          type="button"
          data-testid="referral-cta-share"
          disabled={!canInvite}
          onClick={() => {
            haptics.selection();
            void shareInvite();
          }}
          className={`${styles.btnSecondary} flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] px-4 text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.98] disabled:opacity-50`}
        >
          <Share2 size={18} strokeWidth={2} aria-hidden />
          {t("shareCta")}
        </button>
      ) : null}
    </div>
  );
}
