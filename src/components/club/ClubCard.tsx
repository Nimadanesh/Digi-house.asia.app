"use client";
// File responsibility: Club membership card — identity element reusing the
// /card visual language (dark navy face, hairline border). Presentation only:
// no balance logic, no ordering flow. The /card route stays intact.
import { useTranslations } from "next-intl";
import type { ClubTier } from "@/lib/club/club-tiers";
import styles from "./club-glass.module.css";

export function ClubCard({ tier, amountLabel }: { tier: ClubTier; amountLabel: string }) {
  const t = useTranslations("club");

  return (
    <div data-testid="club-card" className="w-full">
      <div className={`${styles.glassHero} relative overflow-hidden rounded-[26px] p-6`}>
        <p className="relative text-[10px] font-medium uppercase leading-tight tracking-[0.24em] text-white/70">
          {t("eyebrow")}
        </p>
        <p className="relative mt-4 text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-white tnum">
          {t(tier.labelKey)} {t("member")}
        </p>
        <p className="relative mt-2 max-w-full truncate text-sm leading-snug text-white/60 tnum">{amountLabel}</p>
        <span aria-hidden className="relative mt-5 block h-px w-6 bg-[#D4AF77]/60" />
        <div className="relative mt-8 flex items-end justify-between">
          <div className="flex" aria-hidden>
            <span className="size-8 rounded-full bg-white/15" />
            <span className="-ml-4 size-8 rounded-full bg-white/10" />
          </div>
          <p className="text-[17px] font-bold leading-none tracking-[-0.01em] text-white">F.Luxe</p>
        </div>
      </div>
    </div>
  );
}
