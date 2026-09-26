"use client";
// File responsibility: membership progression — all five tiers with threshold
// labels. Current tier highlighted with a CURRENT marker; past tiers subdued;
// future tiers preview. Tapping a row opens the tier detail sheet.
import { Check, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { haptics } from "@/lib/telegram/haptics";
import { usd } from "@/lib/format";
import { CLUB_TIERS, getClubTierState, type ClubTier, type ClubTierId } from "@/lib/club/club-tiers";
import { cn } from "@/lib/utils";
import styles from "./club-glass.module.css";

export function ClubTiers({
  currentTierId,
  onSelect,
}: {
  currentTierId: ClubTierId;
  onSelect: (tier: ClubTier) => void;
}) {
  const t = useTranslations("club");

  return (
    <section aria-label={t("tiersTitle")} data-testid="club-tiers">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">{t("tiersTitle")}</h2>
      <div className={`${styles.glass2} mt-2.5 divide-y divide-white/[0.07] overflow-hidden rounded-[18px]`}>
        {CLUB_TIERS.map((tier) => {
          const state = getClubTierState(tier.id, currentTierId);
          return (
            <button
              key={tier.id}
              type="button"
              data-testid="club-tier"
              data-tier={tier.id}
              data-state={state}
              aria-label={`${t(tier.labelKey)}, ${state === "current" ? t("current") : state === "past" ? t("unlocked") : t("locked")}`}
              onClick={() => {
                haptics.selection();
                onSelect(tier);
              }}
              className={cn(
                "flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-start active:opacity-80",
                state === "current" && styles.tierRowCurrent,
                state === "past" && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full",
                  state === "current"
                    ? "bg-[#4B8BFF] text-white"
                    : "bg-surface-2 text-muted-foreground",
                )}
                aria-hidden
              >
                {state === "future" ? (
                  <Lock size={12} strokeWidth={2} />
                ) : (
                  <Check size={13} strokeWidth={2.5} />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {t(tier.labelKey)}
              </span>
              {state === "current" ? (
                <span className="shrink-0 rounded-full bg-[#4B8BFF]/15 px-2 py-0.5 text-xs font-medium text-[#4B8BFF]">
                  {t("current")}
                </span>
              ) : null}
              <span className="shrink-0 text-[0.8125rem] text-muted-foreground tnum">
                {tier.minUsdCents > 0 ? usd(tier.minUsdCents) : "—"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
