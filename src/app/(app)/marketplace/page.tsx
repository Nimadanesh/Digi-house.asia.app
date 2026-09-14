"use client";
// File responsibility: Estates browse catalog (Slice F — canonical 24-property marketplace).
// Top chrome is one control row (scrolling filter chips + sort capsule opening a sheet)
// tight under the global header; title block deleted, search lives in the header.
// Estate card stack, empty/loading/error states unchanged; whole-card navigation.
import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
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
import { MarketplaceSortSheet } from "@/components/marketplace/MarketplaceSortSheet";
import { MarketplaceSkeleton } from "@/components/marketplace/MarketplaceSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

function MarketplacePageInner() {
  const t = useTranslations("estates");
  const tCommon = useTranslations("common");
  const { estates, isLoading, isError, refetch } = useMarketplaceEstates();
  // The shared tab header owns the visible search capsule: it rewrites ?query= in
  // place, and that param is the query source here (existing filter logic untouched).
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlQuery = searchParams.get("query") ?? "";
  const [query, setQuery] = useState(urlQuery);
  // Adopt the header-driven ?query= when it changes (render-time adjustment —
  // the URL is the search source of truth, local state stays editable).
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setQuery(urlQuery);
  }
  const [filter, setFilter] = useState<EstateFilter>("all");
  const [sort, setSort] = useState<EstateSort>("curated");
  const [sortOpen, setSortOpen] = useState(false);
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
    router.replace(ROUTES.marketplace, { scroll: false });
    haptics.selection();
  }, [router]);

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
      {/* Page-level search stays mounted (filter state source) but hidden — the
          shared tab header capsule is the only visible search. */}
      <MarketplaceSearch value={query} onChange={setQuery} className="hidden" />

      {/* Single control row: scrolling filters + sort capsule trigger. */}
      <div className="flex h-9 items-center gap-2">
        <MarketplaceFilterChips
          value={filter}
          onChange={setFilter}
          onSelectHaptic={onChipHaptic}
        />
        <button
          type="button"
          onClick={() => {
            haptics.selection();
            setSortOpen(true);
          }}
          aria-haspopup="dialog"
          data-testid="estates-sort"
          aria-label={t("sortAria")}
          className="flex h-8 w-max min-w-0 max-w-[42%] shrink items-center gap-1 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] py-0 pl-3 pr-2.5"
        >
          <span className="min-w-0 flex-1 truncate text-left text-xs font-medium text-[rgba(255,255,255,0.70)]">
            {t(`sort.${sort}`)}
          </span>
          <ChevronDown
            size={14}
            strokeWidth={2}
            aria-hidden
            className="shrink-0 text-[rgba(255,255,255,0.70)]"
          />
        </button>
      </div>
      <MarketplaceSortSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        value={sort}
        onChange={setSort}
      />

      <p className="pb-2.5 pt-2 text-xs font-normal leading-tight text-[rgba(255,255,255,0.50)] tnum" data-testid="estates-count">
        {t("resultsCount", { count: listings.length })}
      </p>

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
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="mt-2 pb-2">
          <MarketplaceSkeleton />
        </div>
      }
    >
      <MarketplacePageInner />
    </Suspense>
  );
}