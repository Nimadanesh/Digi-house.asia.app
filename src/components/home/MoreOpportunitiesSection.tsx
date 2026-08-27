"use client";
// File responsibility: Home "More opportunities" — 1–2 additional Primary (funding) listings.
// Calm editorial list, no flame/hot/scarcity badges. Price figures come straight from the listing.
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { shareWeeklyYieldUsd } from "@/lib/property-yield";
import { ROUTES } from "@/lib/constants";
import type { Listing } from "@/types/property";
import { Block } from "@/components/common/Block";

/** Cap the "More opportunities" rail to a short, calm set. */
export const MORE_OPPORTUNITIES_LIMIT = 2;

/** Pick 1–2 Primary (funding) listings to surface under Featured, excluding the featured one. */
export function pickMoreOpportunities(
  listings: Listing[],
  excludeId?: string,
): Listing[] {
  const primary = listings
    .filter((l) => l.status === "funding" && l.id !== excludeId)
    .slice(0, MORE_OPPORTUNITIES_LIMIT);
  return primary;
}

export function MoreOpportunitiesSection({
  listings,
  onNavigateHaptic,
}: {
  listings: Listing[];
  onNavigateHaptic?: () => void;
}) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");

  if (listings.length === 0) return null;

  return (
    <section className="space-y-2" data-testid="more-opportunities-section">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("moreOpportunities")}
      </h2>
      <div className="space-y-2">
        {listings.map((listing) => {
          const monthly = (shareWeeklyYieldUsd(listing) * 52) / 12;
          return (
            <Link
              key={listing.id}
              href={ROUTES.property(listing.id)}
              onClick={() => onNavigateHaptic?.()}
              className="block active:scale-[0.98] transition-transform duration-[120ms] ease-out"
              data-testid="more-opportunity-card"
            >
              <Block className="overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
                    <Image
                      src={listing.images[0] ?? "/images/properties/p1.png"}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.9375rem] font-semibold leading-snug text-foreground">
                      {listing.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs leading-relaxed text-muted-foreground">
                      {listing.location}
                    </p>
                    <p className="mt-1 text-xs font-medium tnum text-foreground">
                      {tCommon("from")}{" "}
                      <span className="font-semibold text-foreground">
                        {usd(listing.sharePriceUsd)}/{tCommon("share")}
                      </span>
                      <span className="text-success"> · ≈ {usd(monthly)}/mo</span>
                    </p>
                  </div>
                </div>
              </Block>
            </Link>
          );
        })}
      </div>
    </section>
  );
}