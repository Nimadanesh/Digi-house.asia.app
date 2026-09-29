"use client";
// File responsibility: Club Stay status card — staged journey presentation.
// Renders TIER_CONFIRMED / PREFERENCES_REQUIRED (unlocked + Set preferences),
// WAITING (window + countdown to confirmation), ALLOCATION_PENDING (almost
// ready), ALLOCATED (exact dates + villa name when assigned). Never shows
// exact dates or a villa while allocation fields are null.
import { useTranslations } from "next-intl";
import { BedDouble } from "lucide-react";
import { haptics } from "@/lib/telegram/haptics";
import {
  allocationCountdownDays,
  confirmationDateMs,
  deriveStayStatus,
  estimateStayWindow,
  type StayAllocation,
  type StayPreference,
} from "@/lib/club/stay-journey";
import type { ClubTierId } from "@/lib/club/club-tiers";
import styles from "./club-glass.module.css";

export function ClubStaySection({
  tierId,
  preference,
  allocation,
  villaName,
  nowMs,
  onSetPreferences,
}: {
  tierId: ClubTierId;
  preference: StayPreference | null;
  allocation: StayAllocation | null;
  villaName?: string | null;
  nowMs: number;
  onSetPreferences: () => void;
}) {
  const t = useTranslations("club");
  const { status } = deriveStayStatus({ tierId, preference, allocation, nowMs });
  if (status === null) return null;

  const openPreferences = () => {
    haptics.selection();
    onSetPreferences();
  };

  return (
    <section aria-label={t("stayTitle")} data-testid="club-stay">
      <div className={`${styles.glass2} relative overflow-hidden rounded-[22px]`}>
        <div className="relative space-y-3 p-5">
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#4B8BFF]/15 text-[#4B8BFF]"
              aria-hidden
            >
              <BedDouble size={20} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[0.9375rem] font-semibold text-foreground">{t("stayTitle")}</h2>
              <p className="text-[0.8125rem] leading-snug text-muted-foreground">{t("stayNights")}</p>
            </div>
          </div>

          {(status === "TIER_CONFIRMED" || status === "PREFERENCES_REQUIRED") && (
            <>
              <p className="text-sm leading-relaxed text-foreground">{t("stayUnlocked")}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{t("stayTellUs")}</p>
              <button
                type="button"
                data-testid="club-stay-cta"
                onClick={openPreferences}
                className={`${styles.btnPrimary} flex min-h-[48px] w-full items-center justify-center text-[15px] font-semibold transition-transform duration-150 ease-out active:scale-[0.98]`}
              >
                {t("staySetPreferences")}
              </button>
            </>
          )}

          {status === "WAITING_FOR_ALLOCATION" && preference && (
            <StayWaiting preference={preference} nowMs={nowMs} onEdit={openPreferences} />
          )}

          {status === "ALLOCATION_PENDING" && (
            <>
              <p className="text-sm font-medium leading-snug text-foreground">{t("stayAlmostReady")}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{t("stayConfirmedSoon")}</p>
            </>
          )}

          {status === "ALLOCATED" && allocation?.checkIn && allocation?.checkOut && (
            <>
              <p className="text-sm font-medium leading-snug text-foreground">{t("stayConfirmed")}</p>
              <p className="text-[1.0625rem] font-semibold leading-snug text-foreground tnum">
                {allocation.checkIn} – {allocation.checkOut}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground tnum">
                {t("stayNightsCount", { count: allocation.nights })}
                {villaName ? ` · ${villaName}` : ""}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function StayWaiting({
  preference,
  nowMs,
  onEdit,
}: {
  preference: StayPreference;
  nowMs: number;
  onEdit: () => void;
}) {
  const t = useTranslations("club");
  const window = estimateStayWindow({ preference, referenceMs: nowMs });
  const days = allocationCountdownDays({ confirmationMs: confirmationDateMs(window), nowMs });

  return (
    <>
      <p className="text-sm font-medium leading-snug text-foreground">{t("stayPrepared")}</p>
      <p className="text-sm leading-relaxed text-muted-foreground tnum">
        {t("stayWindowExpected", { window: window.label })}
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">{t("stayConfirmAfter")}</p>
      <p className="text-[0.8125rem] font-medium leading-snug text-foreground tnum" data-testid="club-stay-countdown">
        {days <= 1 ? t("stayCountdownTomorrow") : t("stayCountdownDays", { count: days })}
      </p>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex min-h-[44px] items-center text-[0.8125rem] font-medium text-[#4B8BFF] active:opacity-70"
        data-testid="club-stay-edit"
      >
        {t("staySetPreferences")}
      </button>
    </>
  );
}
