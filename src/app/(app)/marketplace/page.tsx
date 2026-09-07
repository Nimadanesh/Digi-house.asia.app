"use client";
// File responsibility: Estates screen (Slice F — canonical 24-property marketplace).
// Page header → search → filter chips (All/Featured/New/Income/Owner Stay/Resale) → sort
// (Curated default, Estate Value available) → estate card stack; whole-card
// navigation, no per-card Buy.
// Data flow: Canonical Estate Data → useMarketplaceEstates (view model) →
// client filter/sort via pure filterEstates (no API changes, no business logic).
import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMarketplaceEstates } from "@/hooks/useMarketplaceEstates";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { haptics } from "@/lib/telegram/haptics";
import {
  filterEstates,
  type EstateFilter,
  type EstateSort,
} from "@/lib/marketplace-filter";
import { PropertyCard } from "@/components/property/PropertyCard";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { MarketplaceFilterChips } from "@/components/marketplace/MarketplaceFilterChips";
import { MarketplaceSortChips } from "@/components/marketplace/MarketplaceSortChips";
import { MarketplaceSkeleton } from "@/components/marketplace/MarketplaceSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";

export default function MarketplacePage() {
  const t = useTranslations("estates");
  const tCommon = useTranslations("common");
  const { estates, isLoading, isError, refetch } = useMarketplaceEstates();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<EstateFilter>("all");
  const [sort, setSort] = useState<EstateSort>("curated");
  const debouncedQuery = useDebouncedValue(query, 150);

  const listings = useMemo(
    () => filterEstates(estates ?? [], { query: debouncedQuery, filter, sort }),
    [estates, debouncedQuery, filter, sort],
  );

  const onNavigateHaptic = useCallback(() => haptics.selection(), []);
  const onChipHaptic = useCallback(() => haptics.selection(), []);

  const resetControls = useCallback(() => {
    setQuery("");
    setFilter("all");
    setSort("curated");
    haptics.selection();
  }, []);

  if (isLoading && estates.length === 0) {
    return (
      <div className="mt-2 pb-2">
        <MarketplaceSkeleton />
      </div>
    );
  }

  if (isError && estates.length === 0) {
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

  const emptyAll = estates.length === 0;
  const emptyFiltered = !emptyAll && listings.length === 0;

  // Honest unavailable states for filters whose data does not exist yet (no fake matches).
  const unavailable =
    filter === "owner_stay"
      ? { title: t("ownerStayEmptyTitle"), message: t("ownerStayEmptyMessage") }
      : filter === "featured"
        ? { title: t("featuredEmptyTitle"), message: t("featuredEmptyMessage") }
        : null;

  return (
    <div className="mt-2 space-y-3 pb-2" data-testid="estates-page">
      <header className="pt-1">
        <h1 className="text-[1.375rem] font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>

      <MarketplaceSearch value={query} onChange={setQuery} />

      <MarketplaceFilterChips
        value={filter}
        onChange={setFilter}
        onSelectHaptic={onChipHaptic}
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
          title={unavailable?.title ?? t("noMatchesTitle")}
          message={unavailable?.message ?? t("noMatchesMessage")}
          className="mt-8"
          action={
            <Button type="button" onClick={resetControls}>
              {tCommon("clearFilters")}
            </Button>
          }
        />
      ) : (
        <>
          <MarketplaceSortChips
            value={sort}
            onChange={setSort}
            onSelectHaptic={onChipHaptic}
          />
          <div className="space-y-3 pt-0.5" data-testid="estates-list">
            {listings.map((estate, i) => (
              <PropertyCard
                key={estate.id}
                estate={estate}
                priority={i === 0}
                onNavigateHaptic={onNavigateHaptic}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}