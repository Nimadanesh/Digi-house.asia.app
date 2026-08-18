"use client";
// File responsibility: compact horizontal “my property” chip (Fable Home §My Properties card).
import Link from "next/link";
import Image from "next/image";
import { usd } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import type { Listing } from "@/types/property";
import type { Holding } from "@/types/position";

export function HomePropertyChip({
  listing,
  holding,
  onNavigateHaptic,
}: {
  listing: Listing;
  holding: Holding;
  onNavigateHaptic?: () => void;
}) {
  const cover = listing.images[0] ?? "/images/properties/p1.png";
  return (
    <Link
      href={ROUTES.property(listing.id)}
      onClick={() => onNavigateHaptic?.()}
      className="w-[148px] shrink-0 overflow-hidden rounded-[12px] bg-card active:scale-[0.98] transition-transform duration-[120ms] ease-out"
      data-testid="home-property-chip"
    >
      <div className="relative aspect-[4/3] bg-surface-2">
        <Image src={cover} alt="" fill className="object-cover" sizes="148px" />
      </div>
      <div className="space-y-1 p-2.5">
        <p className="truncate text-sm font-semibold leading-snug text-foreground">{listing.title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground tnum">
          {holding.sharesOwned} shares
        </p>
        <p className="text-xs font-medium text-success tnum">
          {usd(holding.pendingWeekEarningsUsd)}/wk
        </p>
      </div>
    </Link>
  );
}
