"use client";
// File responsibility: Club referral entry — the concise doorway to the
// Referral Hub. Title, one line, one CTA. Full mechanics (ladder, points,
// stay enhancement) live in /referral, never here.
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { ROUTES } from "@/lib/constants";
import styles from "./club-glass.module.css";

export function ClubReferralEntry() {
  const t = useTranslations("club");

  return (
    <section aria-label={t("referralEntryTitle")} data-testid="club-referral">
      <div className={`${styles.glass2} relative overflow-hidden rounded-[22px]`}>
        <div className="relative p-5">
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#4B8BFF]/15 text-[#4B8BFF]"
              aria-hidden
            >
              <UserPlus size={20} strokeWidth={1.75} />
            </span>
            <h2 className="text-[0.9375rem] font-semibold text-foreground">{t("referralEntryTitle")}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("referralEntrySub")}</p>
          <Link
            href={ROUTES.referral}
            onClick={() => haptics.selection()}
            data-testid="club-referral-cta"
            className={`${styles.btnSecondary} mt-3 flex min-h-[48px] w-full items-center justify-center rounded-[14px] text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.98]`}
          >
            {t("referralOpen")}
          </Link>
        </div>
      </div>
    </section>
  );
}
