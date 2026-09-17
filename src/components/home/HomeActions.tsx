"use client";
// File responsibility: Home Revolut-style action row — exactly three equal circular
// actions on the hero/content boundary. Invest → existing Marketplace route;
// Invite → existing referrals UI inside SettingsSheet (openSettings, no new logic);
// Card → dedicated Card page route. No tab names as labels.
import Link from "next/link";
import { CreditCard, Plus, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useUiStore } from "@/stores/ui.store";
import { haptics } from "@/lib/telegram/haptics";
import { ROUTES } from "@/lib/constants";

const CIRCLE =
  "flex size-14 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.92)] active:opacity-80";
const LABEL = "text-[11px] font-medium leading-tight text-[rgba(255,255,255,0.65)]";

export function HomeActions() {
  const t = useTranslations("home");
  const openSettings = useUiStore((s) => s.openSettings);

  return (
    <div data-testid="home-actions" className="relative z-10 flex items-start justify-center gap-7">
      <Link
        href={ROUTES.marketplace}
        onClick={() => haptics.selection()}
        data-testid="action-invest"
        className="flex min-h-[44px] min-w-[44px] flex-col items-center gap-1.5"
      >
        <span className={CIRCLE}>
          <Plus size={22} strokeWidth={2} aria-hidden />
        </span>
        <span className={LABEL}>{t("invest")}</span>
      </Link>

      <button
        type="button"
        onClick={() => {
          haptics.selection();
          openSettings();
        }}
        data-testid="action-invite"
        className="flex min-h-[44px] min-w-[44px] flex-col items-center gap-1.5"
      >
        <span className={CIRCLE}>
          <UserPlus size={22} strokeWidth={2} aria-hidden />
        </span>
        <span className={LABEL}>{t("invite")}</span>
      </button>

      <Link
        href={ROUTES.card}
        onClick={() => haptics.selection()}
        data-testid="action-card"
        className="flex min-h-[44px] min-w-[44px] flex-col items-center gap-1.5"
      >
        <span className={CIRCLE}>
          <CreditCard size={22} strokeWidth={2} aria-hidden />
        </span>
        <span className={LABEL}>{t("card")}</span>
      </Link>
    </div>
  );
}
