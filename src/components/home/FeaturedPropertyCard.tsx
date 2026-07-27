"use client";
// File responsibility: Home featured / Hot this week marketplace highlight (Fable Home §Featured).
import Link from "next/link";
import Image from "next/image";
import { Flame } from "lucide-react";
import { usd, pct, annualYieldRatio, weeklyRent, projectedYield } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import type { Listing } from "@/types/property";
import { Block } from "@/components/common/Block";
import { FundingBar } from "@/components/property/FundingBar";

export function FeaturedPropertyCard({
  listing,
  onNavigateHaptic,
}: {
  listing: Listing;
  onNavigateHaptic?: () => void;
}) {
  const totalValue = listing.sharePriceUsd * listing.totalShares;
  const apy = annualYieldRatio(listing.annualRentUsd, totalValue);
  const weekly = projectedYield(weeklyRent(listing.annualRentUsd), 1, listing.totalShares);
  const cover = listing.images[0] ?? "/images/properties/p1.png";

  return (
    <section className="space-y-2" data-testid="featured-section">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">Today&apos;s Highlight</h2>
      <Link
        href={ROUTES.property(listing.id)}
        onClick={() => onNavigateHaptic?.()}
        className="block active:scale-[0.99] transition-transform duration-[120ms] ease-out"
        data-testid="featured-card"
      >
        <Block className="overflow-hidden">
          <div className="relative aspect-[16/9] bg-surface-2">
            <Image
              src={cover}
              alt={listing.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width:480px) 100vw, 480px"
            />
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-danger/90 px-2 py-0.5 text-[0.6875rem] font-semibold text-white">
              <Flame size={12} strokeWidth={2.25} aria-hidden />
              Hot this week
            </span>
            <span className="absolute top-2.5 right-2.5 rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-white tnum">
              {pct(apy)} APY
            </span>
          </div>
          <div className="space-y-2 p-4">
            <div>
              <p className="text-[0.9375rem] font-semibold text-foreground">{listing.title}</p>
              <p className="text-sm text-muted-foreground">{listing.location}</p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">From</span>
              <span className="font-semibold tnum text-foreground">{usd(listing.sharePriceUsd)}/share</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Weekly / share</span>
              <span className="font-medium tnum text-success">{usd(weekly)}</span>
            </div>
            <FundingBar progress={listing.fundingProgressRatio} funded={listing.fundingProgressRatio >= 1} />
          </div>
        </Block>
      </Link>
    </section>
  );
}
