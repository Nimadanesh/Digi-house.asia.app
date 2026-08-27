"use client";
// File responsibility: Portfolio screen (Fable redesign). Summary, allocation, holdings + detail sheet.
import { useMemo, useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useLocks } from "@/hooks/useLocks";
import { useNfts } from "@/hooks/useNfts";
import { useTelegram } from "@/hooks/useTelegram";
import { haptics } from "@/lib/telegram/haptics";
import { portfolioAllocation } from "@/lib/portfolio-math";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { BrowseMarketplaceCta } from "@/components/common/BrowseMarketplaceCta";
import { PortfolioSummaryCard } from "@/components/portfolio/PortfolioSummaryCard";
import { LockedFreeCard } from "@/components/portfolio/LockedFreeCard";
import { AllocationBar } from "@/components/portfolio/AllocationBar";
import { HoldingCard } from "@/components/portfolio/HoldingCard";
import { HoldingDetailSheet } from "@/components/portfolio/HoldingDetailSheet";
import { OpenOrdersBlock } from "@/components/portfolio/OpenOrdersBlock";
import { PortfolioSkeleton } from "@/components/portfolio/PortfolioSkeleton";
import { useExportCsv } from "@/hooks/useExportCsv";
import { useCancelOrder } from "@/hooks/useSells";
import { Block } from "@/components/common/Block";
import { Download } from "lucide-react";
import type { Holding } from "@/types/position";
import type { Listing } from "@/types/property";
import type { HoldingNft } from "@/types/nft";

export default function PortfolioPage() {
  const t = useTranslations("portfolio");
  const portfolio = usePortfolio();
  const marketplace = useMarketplace();
  const locksQuery = useLocks();
  const nftsQuery = useNfts();

  // Locked-share split (PRODUCT-PLAN §0.4): totals for the summary + per-holding pill.
  const lockedByProperty = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of locksQuery.data?.locks ?? []) {
      if (l.status === "matured") continue;
      m.set(l.propertyId, (m.get(l.propertyId) ?? 0) + l.shares);
    }
    return m;
  }, [locksQuery.data]);
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

  // Collectible-NFT receipt per property (display-only — the DB is the ownership record).
  const nftByProperty = useMemo(() => {
    const m = new Map<string, HoldingNft>();
    for (const n of nftsQuery.data ?? []) m.set(n.propertyId, n);
    return m;
  }, [nftsQuery.data]);

  const closeSheet = useCallback(() => {
    haptics.selection();
    setSelected(null);
  }, []);

  const { download: downloadCsv, downloading: csvDownloading } = useExportCsv();
  const cancelOrder = useCancelOrder();

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
  const totalOwned = data.holdings.reduce((s, h) => s + h.sharesOwned, 0);
  const totalLocked = [...lockedByProperty.values()].reduce((s, n) => s + n, 0);
  const totalFree = Math.max(0, totalOwned - totalLocked);
  // Quiet idle-share action targets the property holding the most free (idle) shares.
  const nudgePropertyId = data.holdings
    .map((h) => ({ id: h.propertyId, free: h.sharesOwned - (lockedByProperty.get(h.propertyId) ?? 0) }))
    .filter((h) => h.free > 0)
    .sort((a, b) => b.free - a.free)[0]?.id;

  return (
    <div className="mt-3 space-y-4 pb-2" data-testid="portfolio-page">
      <PortfolioSummaryCard summary={data} />
      <LockedFreeCard
        lockedShares={totalLocked}
        freeShares={totalFree}
        nudgePropertyId={nudgePropertyId}
      />
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
                lockedShares={lockedByProperty.get(h.propertyId) ?? 0}
                nftStatus={nftByProperty.get(h.propertyId)?.status ?? null}
                onOpen={() => {
                  haptics.selection();
                  setSelected(h);
                }}
              />
            );
          })}
        </div>
      </section>

      <OpenOrdersBlock
        orders={data.openOrders}
        nameById={nameById}
        onCancel={(orderId) => cancelOrder.mutate(orderId)}
        cancellingId={cancelOrder.isPending ? String(cancelOrder.variables) : null}
      />

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
              {csvDownloading ? t("exporting") : t("exportCsv")}
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
        nft={selected ? nftByProperty.get(selected.propertyId) ?? null : null}
      />
    </div>
  );
}
