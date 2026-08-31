"use client";
// File responsibility: Home ownership empty state (Phase 9 Slice 3, UI Mapping §3.1) — shown in
// place of the "Your Estates" hero when the user owns no estates. Plain ownership language:
// "You don't own any estates yet" + a single Explore Estates CTA. No fabricated figures, no yield steps.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/constants";
import { haptics } from "@/lib/telegram/haptics";
import { Block } from "@/components/common/Block";

export function HomeEmptyState({ onNavigateHaptic }: { onNavigateHaptic?: () => void }) {
  const t = useTranslations("home");
  const tap = onNavigateHaptic ?? (() => haptics.selection());

  return (
    <Block className="p-5" data-testid="home-empty-state">
      <p className="text-[0.9375rem] font-semibold leading-snug text-foreground">
        {t("emptyTitle")}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t("emptyHint")}</p>
      <Link
        href={ROUTES.marketplace}
        onClick={tap}
        className="mt-4 inline-flex h-[46px] w-full items-center justify-center rounded-[10px] bg-primary text-sm font-semibold text-primary-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
        data-testid="empty-browse-marketplace"
      >
        {t("emptyCta")}
      </Link>
    </Block>
  );
}