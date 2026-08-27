"use client";
// File responsibility: a single "My Properties" ownership row on Home (redesign). Full-width row:
// thumbnail + title + shares owned + monthly yield estimate. Calm, no FOMO.
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import type { Listing } from "@/types/property";
import type { Holding } from "@/types/position";
import { Block } from "@/components/common/Block";

export function HomePropertyChip({
  listing,
  holding,
  onNavigateHaptic,
}: {
  listing: Listing;
  holding: Holding;
  onNavigateHaptic?: () => void;
}) {
  const tCommon = useTranslations("common");
  const cover = listing.images[0] ?? "/images/properties/p1.png";
  // Display-only A4 conversion: weekly figure → monthly estimate (integer minor units).
  const monthly = Math.round((holding.pendingWeekEarningsUsd * 52) / 12);

  return (
    <Link
      href={ROUTES.property(listing.id)}
      onClick={() => onNavigateHaptic?.()}
      className="block active:scale-[0.98] transition-transform duration-[120ms] ease-out"
      data-testid="home-property-chip"
    >
      <Block className="overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
            <Image src={cover} alt="" fill className="object-cover" sizes="56px" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[0.9375rem] font-semibold leading-snug text-foreground">
                {listing.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground tnum">
                {holding.sharesOwned} {tCommon("shares")}
              </p>
            </div>
            <p className="shrink-0 text-xs font-medium tnum text-success">
              ≈ {usd(monthly)}/mo
            </p>
          </div>
        </div>
      </Block>
    </Link>
  );
}