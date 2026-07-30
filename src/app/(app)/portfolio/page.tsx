"use client";
// File responsibility: Portfolio screen (Fable redesign). Summary, allocation, holdings + detail sheet.
import { useMemo, useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useTelegram } from "@/hooks/useTelegram";
import { haptics } from "@/lib/telegram/haptics";
import { portfolioAllocation } from "@/lib/portfolio-math";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { BrowseMarketplaceCta } from "@/components/common/BrowseMarketplaceCta";
import { PortfolioSummaryCard } from "@/components/portfolio/PortfolioSummaryCard";
import { AllocationBar } from "@/components/portfolio/AllocationBar";
import { HoldingCard } from "@/components/portfolio/HoldingCard";
import { HoldingDetailSheet } from "@/components/portfolio/HoldingDetailSheet";
import { OpenOrdersBlock } from "@/components/portfolio/OpenOrdersBlock";
import { PortfolioSkeleton } from "@/components/portfolio/PortfolioSkeleton";
import { useExportCsv } from "@/hooks/useExportCsv";
import { Block } from "@/components/common/Block";
import { Download } from "lucide-react";
import type { Holding } from "@/types/position";
import type { Listing } from "@/types/property";

export default function PortfolioPage() {
  const t = useTranslations("portfolio");
  const portfolio = usePortfolio();
  const marketplace = useMarketplace();
  // Only need backButton chrome here — haptics imported directly to avoid theme/ready churn.
  const { backButton } = useTelegram();
  const [selected, setSelected] = useState<Holding | null>(null);

  const listingById = useMemo(() => {
    const m = new Map<string, Listing>();
    for (const p of marketplace.data ?? []) m.set(p.id, p);
    return m;
  }, [marketplace.data]);

  const nameById = useMemo(
    () => Object.fromEntries((marketplace.data ?? []).map((p) => [p.id, p.title])),
    [marketplace.data],
  );

  const closeSheet = useCallback(() => {
    haptics.selection();
    setSelected(null);
  }, []);

  const { download: downloadCsv, downloading: csvDownloading } = useExportCsv();

  useEffect(() => {
    if (!selected) {
      backButton.hide();
      return;
    }
    backButton.show();
    const off = backButton.onClick(() => {
      closeSheet();
    });
    return () => {
      off();
      backButton.hide();
    };
  }, [selected, backButton, closeSheet]);

  if (portfolio.isLoading && !portfolio.data) {
    return (
      <div className="mt-3">
        <PortfolioSkeleton />
      </div>
    );
  }

  if (portfolio.isError && !portfolio.data) {
    return (
      <ErrorState
        className="mt-4"
        message={t("loadError")}
        onRetry={() => {
          haptics.impact("light");
          void portfolio.refetch();
        }}
        data-testid="portfolio-error"
      />
    );
  }

  const data = portfolio.data;
  if (!data || data.holdings.length === 0) {
    return (
      <EmptyState
        title={t("emptyTitle")}
        message={t("emptyMessage")}
        action={<BrowseMarketplaceCta />}
        className="mt-12"
        data-testid="portfolio-empty"
      />
    );
  }

  const slices = portfolioAllocation(data.holdings, data.totalValueUsd);
  const selectedListing = selected ? listingById.get(selected.propertyId) : undefined;

  return (
    <div className="mt-3 space-y-4 pb-2" data-testid="portfolio-page">
      <PortfolioSummaryCard summary={data} />
      <AllocationBar slices={slices} nameById={nameById} />

      <section className="space-y-2" data-testid="portfolio-holdings">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("myPropertiesCount", { count: data.holdings.length })}
        </h2>
        <div className="space-y-2.5">
          {data.holdings.map((h) => {
            const listing = listingById.get(h.propertyId);
            return (
              <HoldingCard
                key={h.propertyId}
                holding={h}
                title={listing?.title ?? h.propertyId}
                location={listing?.location ?? ""}
                image={listing?.images[0]}
                onOpen={() => {
                  haptics.selection();
                  setSelected(h);
                }}
              />
            );
          })}
        </div>
      </section>

      <OpenOrdersBlock orders={data.openOrders} nameById={nameById} />

      <section className="space-y-2">
        <Block>
          <button
            type="button"
            onClick={() => void downloadCsv()}
            disabled={csvDownloading}
            className="flex w-full min-h-[56px] items-center gap-2 px-4 py-3.5 text-start active:bg-surface-2/60 disabled:opacity-40"
            data-testid="portfolio-export-csv"
          >
            <Download size={20} strokeWidth={1.75} className="shrink-0 text-muted-foreground" aria-hidden />
            <span className="flex-1 text-sm font-medium leading-snug text-foreground">
              {csvDownloading ? "Exporting…" : "Export CSV"}
            </span>
          </button>
        </Block>
      </section>

      <HoldingDetailSheet
        open={Boolean(selected)}
        onClose={closeSheet}
        holding={selected}
        title={selectedListing?.title ?? selected?.propertyId ?? ""}
        location={selectedListing?.location ?? ""}
        image={selectedListing?.images[0]}
      />
    </div>
  );
}
