"use client";
// File responsibility: Luxe Circle section — the private ownership network
// summary (honest prototype counts), the shared-properties empty state, and
// navigation to estates worth sharing. No fake members, no fake properties,
// no referral mechanics (those live in the Referral Hub).
import Link from "next/link";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { useLuxeCircle } from "@/hooks/useLuxeCircle";
import { ROUTES } from "@/lib/constants";
import styles from "../club/club-glass.module.css";

export function LuxeCircleSection() {
  const t = useTranslations("circle");
  const circle = useLuxeCircle();

  return (
    <section aria-label={t("circleTitle")} data-testid="club-circle">
      <div className={`${styles.glass2} relative overflow-hidden rounded-[22px]`}>
        <div className="relative space-y-4 p-5">
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#4B8BFF]/15 text-[#4B8BFF]"
              aria-hidden
            >
              <Users size={20} strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="text-[0.9375rem] font-semibold text-foreground">{t("circleTitle")}</h2>
              <p className="text-[13px] leading-snug text-muted-foreground">{t("circleSub")}</p>
            </div>
          </div>

          <p data-testid="circle-counts" className="text-[0.8125rem] font-medium leading-snug text-foreground tnum">
            {t("circleMembers", { count: circle.memberCount })}
            {" · "}
            {t("circleShared", { count: circle.sharedPropertyCount })}
          </p>

          <div data-testid="circle-shared-empty" className="rounded-[14px] bg-white/[0.04] px-3.5 py-3">
            <p className="text-sm font-medium text-foreground">{t("circleSharedTitle")}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
              {t("circleSharedEmpty")} {t("circleSharedSub")}
            </p>
            <Link
              href={ROUTES.marketplace}
              onClick={() => haptics.selection()}
              data-testid="circle-explore"
              className={`${styles.btnSecondary} mt-3 flex min-h-[44px] w-full items-center justify-center rounded-[14px] px-4 text-sm font-semibold transition-transform duration-150 ease-out active:scale-[0.98]`}
            >
              {t("circleExplore")}
            </Link>
          </div>

          <Link
            href={ROUTES.marketplace}
            onClick={() => haptics.selection()}
            data-testid="circle-invite"
            className={`${styles.btnPrimary} flex min-h-[48px] w-full items-center justify-center rounded-[14px] px-4 text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.98]`}
          >
            {t("circleInvite")}
          </Link>
        </div>
      </div>
    </section>
  );
}
