"use client";
// File responsibility: Locked vs Free status — the key actionable distinction (§0.4 locks data).
// Calm two-column status + a quiet idle-share action when free shares exist. Display-only.
import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Block } from "@/components/common/Block";
import { ROUTES } from "@/lib/constants";
import { haptics } from "@/lib/telegram/haptics";

export function LockedFreeCard({
  lockedShares,
  freeShares,
  /** Property to open for locking idle shares (property with the most free shares). */
  nudgePropertyId,
}: {
  lockedShares: number;
  freeShares: number;
  nudgePropertyId?: string;
}) {
  const t = useTranslations("portfolio");

  return (
    <Block className="p-4" data-testid="locked-free-card">
      <div className="grid grid-cols-2">
        <div className="min-w-0 pe-4">
          <div className="flex items-center gap-1.5">
            <Lock size={14} strokeWidth={1.75} className="shrink-0 text-muted-foreground" aria-hidden />
            <p className="truncate text-xs font-medium text-muted-foreground">{t("lockedShares")}</p>
          </div>
          <p className="mt-1 text-xl font-semibold leading-none tnum text-foreground" data-testid="locked-shares-value">
            {lockedShares}
          </p>
          <p className="mt-1.5 text-[0.6875rem] leading-snug text-muted-foreground">{t("lockedCaption")}</p>
        </div>
        <div className="min-w-0 border-s border-border ps-4">
          <p className="text-xs font-medium text-muted-foreground">{t("freeShares")}</p>
          <p className="mt-1 text-xl font-semibold leading-none tnum text-foreground" data-testid="free-shares-value">
            {freeShares}
          </p>
          <p className="mt-1.5 text-[0.6875rem] leading-snug text-muted-foreground">{t("freeCaption")}</p>
        </div>
      </div>

      {freeShares > 0 && nudgePropertyId ? (
        <Link
          href={ROUTES.property(nudgePropertyId)}
          onClick={() => haptics.selection()}
          className="mt-3 flex min-h-[44px] items-center justify-between gap-2 rounded-[10px] bg-surface-2 px-3 py-2 active:scale-[0.97] transition-transform duration-[120ms] ease-out"
          data-testid="idle-nudge"
        >
          <span className="text-[0.8125rem] leading-snug text-muted-foreground tnum">
            {t("idleShares", { count: freeShares })}
          </span>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[0.8125rem] font-semibold text-primary">
            {t("lockThem")}
            <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
          </span>
        </Link>
      ) : null}
    </Block>
  );
}
