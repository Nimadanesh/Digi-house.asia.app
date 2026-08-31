"use client";
// File responsibility: My Estates preview on Home (Phase 9 Slice 3, UI Mapping §3.1) — max 3 mini-
// position cards + an "All my estates" quiet link. Rendering nothing when the user owns no estates
// (the ownership hero shows the empty-state CTA instead). No horizontal-scroll FOMO; calm and capped.
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Listing } from "@/types/property";
import type { Holding } from "@/types/position";
import { ROUTES } from "@/lib/constants";
import { HomePropertyChip } from "./HomePropertyChip";

/** The brief caps My Estates on Home at 3 + All my estates. */
export const MY_PROPERTIES_HOME_LIMIT = 3;

export function MyPropertiesSection({
  holdings,
  listingById,
  onNavigateHaptic,
}: {
  holdings: Holding[];
  listingById: Map<string, Listing>;
  onNavigateHaptic?: () => void;
}) {
  const t = useTranslations("home");

  // The ownership hero owns the empty state — this section renders nothing without holdings.
  if (holdings.length === 0) {
    return null;
  }

  // Show the most recently held first; cap to the short calm set.
  const visible = holdings.slice(0, MY_PROPERTIES_HOME_LIMIT);
  const hasMore = holdings.length > visible.length;

  return (
    <section className="space-y-2" data-testid="my-properties-section">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-[0.9375rem] font-semibold text-foreground">
          {t("myEstatesCount", { count: holdings.length })}
        </h2>
        <Link
          href={ROUTES.portfolio}
          onClick={() => onNavigateHaptic?.()}
          className="text-sm font-medium text-primary min-h-[44px] inline-flex items-center"
        >
          {t("allMyEstates")}
        </Link>
      </div>

      <div className="space-y-2" data-testid="my-properties-list">
        {visible.map((h) => {
          const listing = listingById.get(h.propertyId);
          if (!listing) return null;
          return (
            <HomePropertyChip
              key={h.propertyId}
              listing={listing}
              holding={h}
              onNavigateHaptic={onNavigateHaptic}
            />
          );
        })}
      </div>

      {hasMore ? (
        <p className="px-0.5 text-xs leading-relaxed text-muted-foreground tnum">
          {t("moreEstatesCount", { count: holdings.length - visible.length })}
        </p>
      ) : null}
    </section>
  );
}
