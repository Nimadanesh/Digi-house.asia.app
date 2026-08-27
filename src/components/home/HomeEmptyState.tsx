"use client";
// File responsibility: Home premium empty state — "Buy shares → Lock → Earn". Quiet, explanatory,
// no FOMO. Shown when the investor owns no shares yet. Reuses Block + haptics + ROUTES.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/constants";
import { haptics } from "@/lib/telegram/haptics";
import { Block } from "@/components/common/Block";

export function HomeEmptyState({ onNavigateHaptic }: { onNavigateHaptic?: () => void }) {
  const t = useTranslations("home");
  const tap = onNavigateHaptic ?? (() => haptics.selection());

  const steps = [
    { key: "buy", label: t("emptyStepBuy") },
    { key: "lock", label: t("emptyStepLock") },
    { key: "earn", label: t("emptyStepEarn") },
  ];

  return (
    <Block className="p-4" data-testid="home-empty-state">
      <div className="space-y-3">
        <p className="text-[0.9375rem] font-semibold leading-snug text-foreground">{t("emptyTitle")}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("emptyHint")}</p>

        <ol className="space-y-2" data-testid="empty-steps">
          {steps.map((s, i) => (
            <li
              key={s.key}
              className="flex items-center gap-3 rounded-[10px] bg-surface-2 px-3 py-2.5"
              data-testid={`empty-step-${s.key}`}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary tnum">
                {i + 1}
              </span>
              <span className="text-[0.8125rem] leading-snug text-foreground">{s.label}</span>
            </li>
          ))}
        </ol>

        <Link
          href={ROUTES.marketplace}
          onClick={tap}
          className="inline-flex h-[44px] w-full items-center justify-center rounded-[10px] bg-primary text-sm font-semibold text-primary-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
          data-testid="empty-browse-marketplace"
        >
          {t("emptyCta")}
        </Link>
      </div>
    </Block>
  );
}