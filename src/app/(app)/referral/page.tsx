"use client";
// File responsibility: /referral Referral Hub composition — hero, Standard /
// Club switcher (default derived from Club membership), per-view content.
// Reads the portfolio invested total through the Club selector; no financial
// logic, no settlement.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePortfolio } from "@/hooks/usePortfolio";
import { getClubStatus } from "@/lib/club/club-status";
import { haptics } from "@/lib/telegram/haptics";
import { ErrorState } from "@/components/common/ErrorState";
import { ReferralHero } from "@/components/referral/ReferralHero";
import { ReferralTypeSwitcher } from "@/components/referral/ReferralTypeSwitcher";
import { StandardReferralView } from "@/components/referral/StandardReferralView";
import { ClubReferralView } from "@/components/referral/ClubReferralView";
import styles from "@/components/referral/referral-glass.module.css";
import type { ReferralTab } from "@/components/referral/referral-tab";

export default function ReferralPage() {
  const t = useTranslations("referral");
  const portfolio = usePortfolio();
  const [explicit, setExplicit] = useState<ReferralTab | null>(null);

  const memberTab: ReferralTab = useMemo(() => {
    const invested = portfolio.data?.totalInvestedUsd;
    if (typeof invested !== "number") return "standard";
    return getClubStatus(invested).tierId === "standard" ? "standard" : "club";
  }, [portfolio.data]);

  const tab = explicit ?? memberTab;
  const showRetry = portfolio.isError && !portfolio.data;

  return (
    <div className={styles.page} data-testid="referral-page">
      <div className={styles.atmosphere} aria-hidden />
      <div className={`${styles.content} mt-3 space-y-4 pb-2`}>
        <ReferralHero activeTab={tab} />
        <ReferralTypeSwitcher value={tab} onChange={setExplicit} />
        {showRetry ? (
          <div data-testid="referral-retry">
            <ErrorState
              message={t("loadError")}
              onRetry={() => {
                haptics.impact("light");
                void portfolio.refetch();
              }}
            />
          </div>
        ) : null}
        {tab === "standard" ? (
          <StandardReferralView
            onSwitchToClub={() => {
              haptics.selection();
              setExplicit("club");
            }}
          />
        ) : (
          <ClubReferralView />
        )}
      </div>
    </div>
  );
}
