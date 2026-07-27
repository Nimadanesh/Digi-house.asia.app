"use client";
// File responsibility: Marketplace screen — search, filter chips, listing stack (Fable Marketplace).
// Data via useMarketplace; client filter/sort via pure filterMarketplaceListings.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useTelegram } from "@/hooks/useTelegram";
import { filterMarketplaceListings, type MarketplaceChip } from "@/lib/marketplace-filter";
import { PropertyCard } from "@/components/property/PropertyCard";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { MarketplaceFilterChips } from "@/components/marketplace/MarketplaceFilterChips";
import { MarketplaceSkeleton } from "@/components/marketplace/MarketplaceSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";

export default function MarketplacePage() {
  const t = useTranslations("marketplace");
  const tCommon = useTranslations("common");
  const { data, isLoading, isError, refetch } = useMarketplace();
  const { haptics } = useTelegram();
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<MarketplaceChip>("all");

  const listings = useMemo(
    () => filterMarketplaceListings(data ?? [], { query, chip }),
    [data, query, chip],
  );

  if (isLoading && !data) {
    return (
      <div className="mt-2 pb-2">
        <MarketplaceSkeleton />
      </div>
    );
  }

  if (isError && !data) {
    return (
      <ErrorState
        className="mt-4"
        message={t("loadError")}
        onRetry={() => {
          haptics.impact("light");
          void refetch();
        }}
        data-testid="marketplace-error"
      />
    );
  }

  const emptyAll = !data || data.length === 0;
  const emptyFiltered = !emptyAll && listings.length === 0;

  return (
    <div className="mt-2 space-y-3 pb-2" data-testid="marketplace-page">
      <MarketplaceSearch
        value={query}
        onChange={(v) => {
          setQuery(v);
        }}
      />

      <MarketplaceFilterChips
        value={chip}
        onChange={setChip}
        onSelectHaptic={() => haptics.selection()}
      />

      {emptyAll ? (
        <EmptyState
          title={t("emptyTitle")}
          message={t("emptyMessage")}
          className="mt-8"
          action={
            <Button
              type="button"
              onClick={() => {
                haptics.selection();
                void refetch();
              }}
            >
              {tCommon("refresh")}
            </Button>
          }
        />
      ) : emptyFiltered ? (
        <EmptyState
          title={t("noMatchesTitle")}
          message={t("noMatchesMessage")}
          className="mt-8"
          action={
            <Button
              type="button"
              onClick={() => {
                setQuery("");
                setChip("all");
                haptics.selection();
              }}
            >
              {tCommon("clearFilters")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-3 pt-0.5" data-testid="marketplace-list">
          {listings.map((listing, i) => (
            <PropertyCard
              key={listing.id}
              listing={listing}
              priority={i === 0}
              onNavigateHaptic={() => haptics.selection()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
