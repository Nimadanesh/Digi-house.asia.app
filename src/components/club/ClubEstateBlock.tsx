"use client";
// File responsibility: Estate-page Club touchpoint — small contextual block,
// no promises, no nights, no values. Links to /club.
import Link from "next/link";
import { Crown } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { ROUTES } from "@/lib/constants";
import { Block } from "@/components/common/Block";

export function ClubEstateBlock() {
  const t = useTranslations("club");

  return (
    <section aria-label={t("estateBenefitTitle")} data-testid="club-estate-block">
      <Block className="p-5">
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
            aria-hidden
          >
            <Crown size={19} strokeWidth={1.75} />
          </span>
          <p className="text-[0.9375rem] font-semibold leading-snug text-foreground">
            {t("estateBenefitTitle")}
          </p>
        </div>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          {t("estateBenefitBody")}
        </p>
        <Link
          href={ROUTES.club}
          onClick={() => haptics.selection()}
          data-testid="club-estate-cta"
          className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-[10px] bg-secondary px-4 text-sm font-semibold text-secondary-foreground active:opacity-80"
        >
          {t("estateBenefitCta")}
        </Link>
      </Block>
    </section>
  );
}
