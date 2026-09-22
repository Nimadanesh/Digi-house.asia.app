"use client";
// File responsibility: Idle-shares action banner — shown only when free shares exist.
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Block } from "@/components/common/Block";
import { ROUTES } from "@/lib/constants";
import { haptics } from "@/lib/telegram/haptics";

export function IdleSharesBanner({
  freeShares,
  nudgePropertyId,
}: {
  freeShares: number;
  nudgePropertyId?: string;
}) {
  const t = useTranslations("portfolio");
  if (freeShares <= 0 || !nudgePropertyId) return null;

  return (
    <Block className="p-4" data-testid="idle-banner">
      <div className="flex min-h-[44px] items-center justify-between gap-3">
        <p className="text-[0.8125rem] leading-snug text-muted-foreground tnum">
          {t("idleShares", { count: freeShares })}
        </p>
        <Link
          href={ROUTES.property(nudgePropertyId)}
          onClick={() => haptics.selection()}
          className="inline-flex h-10 shrink-0 items-center gap-0.5 rounded-[10px] bg-primary px-3.5 text-[0.8125rem] font-semibold text-primary-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
          data-testid="idle-nudge"
        >
          {t("lockThem")}
          <ChevronRight size={16} strokeWidth={2} aria-hidden className="rtl:rotate-180" />
        </Link>
      </div>
    </Block>
  );
}
