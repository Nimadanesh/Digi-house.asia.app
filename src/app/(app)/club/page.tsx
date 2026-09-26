"use client";
// File responsibility: Private Club page — premium membership layer around the
// existing investment product. Nested route (not a tab). Reads the existing
// portfolio invested total through the Club selector; no financial logic.
import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useSharedNowMs } from "@/hooks/useSharedNowMs";
import { haptics } from "@/lib/telegram/haptics";
import { usd } from "@/lib/format";
import { CLUB_TIERS } from "@/lib/club/club-tiers";
import { getClubStatus } from "@/lib/club/club-status";
import type { ClubBenefit } from "@/lib/club/club-benefits";
import type { ClubTier } from "@/lib/club/club-tiers";
import { ClubHeader } from "@/components/club/ClubHeader";
import { ClubCard } from "@/components/club/ClubCard";
import { ClubBenefits } from "@/components/club/ClubBenefits";
import { ClubBenefitSheet } from "@/components/club/ClubBenefitSheet";
import { ClubNextUnlock } from "@/components/club/ClubNextUnlock";
import { ClubTiers } from "@/components/club/ClubTiers";
import { ClubTierSheet } from "@/components/club/ClubTierSheet";
import { ClubEscapeSection } from "@/components/club/ClubEscapeSection";
import { ClubReferralEntry } from "@/components/club/ClubReferralEntry";
import { LuxeCircleSection } from "@/components/circle/LuxeCircleSection";
import { ClubStaySection } from "@/components/club/ClubStaySection";
import { ClubStayPreferenceSheet } from "@/components/club/ClubStayPreferenceSheet";
import { useStayJourneyStore } from "@/stores/stay-journey.store";
import { ErrorState } from "@/components/common/ErrorState";
import styles from "@/components/club/club-glass.module.css";

export default function ClubPage() {
  const t = useTranslations("club");
  const portfolio = usePortfolio();
  const nowMs = useSharedNowMs();
  const [selected, setSelected] = useState<ClubBenefit | null>(null);
  const [selectedTier, setSelectedTier] = useState<ClubTier | null>(null);
  const [staySheetOpen, setStaySheetOpen] = useState(false);
  const stayPreference = useStayJourneyStore((s) => s.preference);
  const stayAllocation = useStayJourneyStore((s) => s.allocation);
  const setStayPreference = useStayJourneyStore((s) => s.setPreference);
  const closeSheet = useCallback(() => {
    haptics.selection();
    setSelected(null);
  }, []);
  const closeTierSheet = useCallback(() => {
    haptics.selection();
    setSelectedTier(null);
  }, []);

  const status = useMemo(
    () => (portfolio.data ? getClubStatus(portfolio.data.totalInvestedUsd) : null),
    [portfolio.data],
  );

  if (portfolio.isLoading && !portfolio.data) {
    return (
      <div className="mt-3 space-y-4" data-testid="club-loading">
        <div className="h-[86px] animate-pulse rounded-[12px] bg-surface-2/50" />
        <div className="h-[220px] animate-pulse rounded-[26px] bg-surface-2/50" />
        <div className="h-[220px] animate-pulse rounded-[12px] bg-surface-2/50" />
      </div>
    );
  }

  if ((portfolio.isError && !portfolio.data) || !portfolio.data || !status) {
    return (
      <ErrorState
        className="mt-4"
        message={t("loadError")}
        onRetry={() => {
          haptics.impact("light");
          void portfolio.refetch();
        }}
        data-testid="club-error"
      />
    );
  }

  const investedUsd = portfolio.data.totalInvestedUsd;
  const tier = CLUB_TIERS.find((x) => x.id === status.tierId) ?? CLUB_TIERS[0]!;
  const nextTier = CLUB_TIERS.find((x) => x.id === status.nextTierId) ?? null;

  return (
    <div className={styles.page} data-testid="club-page">
      <div className={styles.atmosphere} aria-hidden />
      <div className={`${styles.content} mt-3 space-y-6 pb-2`}>
      <ClubHeader tier={tier} investedUsd={investedUsd} nextTier={nextTier} toNextUsd={status.toNextUsdCents} />
      <ClubCard tier={tier} amountLabel={`${t("invested")} · ${usd(investedUsd)}`} />
      <ClubStaySection
        tierId={status.tierId}
        preference={stayPreference}
        allocation={stayAllocation}
        nowMs={nowMs}
        onSetPreferences={() => setStaySheetOpen(true)}
      />
      <ClubBenefits tierId={status.tierId} onSelect={setSelected} />
      <LuxeCircleSection />
      <ClubEscapeSection />
      <ClubReferralEntry />
      <ClubNextUnlock nextTier={nextTier} toNextUsd={status.toNextUsdCents} />
      <ClubTiers currentTierId={status.tierId} onSelect={setSelectedTier} />
      </div>
      <ClubBenefitSheet benefit={selected} tierId={status.tierId} onClose={closeSheet} />
      <ClubTierSheet tier={selectedTier} currentTierId={status.tierId} onClose={closeTierSheet} />
      <ClubStayPreferenceSheet
        open={staySheetOpen}
        initial={stayPreference}
        onClose={() => setStaySheetOpen(false)}
        onSave={(preference) => {
          setStayPreference(preference);
          setStaySheetOpen(false);
        }}
      />
    </div>
  );
}
