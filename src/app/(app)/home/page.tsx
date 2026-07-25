"use client";
// File responsibility: Home. Portfolio balance block + next-payout block (R-3.3b [HERO]) + my-properties
// mini-cards (Task 6 PropertyCard mini variant with `holding` overlay). Empty → Marketplace CTA.
import Link from "next/link";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useEarnings } from "@/hooks/useEarnings";
import { useMarketplace } from "@/hooks/useMarketplace";
import { ROUTES, TON_PRICE_USD_CENTS } from "@/lib/constants";
import { usd, ton, estimateNanoTon } from "@/lib/format";
import { Block } from "@/components/common/Block";
import { SectionLabel } from "@/components/common/SectionLabel";
import { Skeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PayoutCountdown } from "@/components/earnings/PayoutCountdown";

export default function HomePage() {
  const portfolio = usePortfolio();
  const earnings = useEarnings();
  const marketplace = useMarketplace();

  if (portfolio.isLoading) {
    return (
      <div className="mt-3 space-y-3">
        <Block className="p-4 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-40" />
        </Block>
        <Block className="p-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
        </Block>
        {Array.from({ length: 2 }).map((_, i) => (
          <Block key={i} className="p-3 flex items-center gap-3">
            <Skeleton className="size-12 rounded-[10px]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </Block>
        ))}
      </div>
    );
  }
  if (portfolio.isError) {
    return (
      <Block className="mt-3 p-4 text-center">
        <p className="text-sm text-muted-foreground mb-3">Couldn&apos;t load your portfolio.</p>
        <button onClick={() => portfolio.refetch()} className="text-sm text-primary">Retry</button>
      </Block>
    );
  }
  const data = portfolio.data;
  if (!data || data.holdings.length === 0) {
    return (
      <EmptyState
        title="Welcome to DigiHouse"
        message="Buy a slice of a property — earn rent every Friday."
        action={
          <Link
            href={ROUTES.marketplace}
            className="inline-flex items-center justify-center h-[44px] rounded-[10px] bg-primary text-primary-foreground px-4 text-sm font-semibold"
          >
            Explore Marketplace
          </Link>
        }
        className="mt-12"
      />
    );
  }

  // My-property lookup maps (page builds them so PropertyCard mini stays free of lib/mock imports).
  const properties = marketplace.data ?? [];
  const propertyById = new Map(properties.map((p) => [p.id, p]));

  // Next-payout block — prefer the Earnings summary's this-week projected, fall back to portfolio sum.
  const pendingTotal = earnings.data?.thisWeekProjectedUsd ?? data.weeklyProjectedUsd;

  return (
    <div className="mt-3 space-y-3">
      {/* Balance block (DESIGN_SYSTEM §"Balance card (Home hero)") */}
      <Block className="p-4">
        <SectionLabel>Portfolio value</SectionLabel>
        <p className="text-[1.625rem] font-bold tracking-[-0.02em] tnum text-foreground mt-1">{usd(data.totalValueUsd)}</p>
        <p className="text-xs text-muted-foreground tnum mt-0.5">
          ≈ {ton(estimateNanoTon(data.totalValueUsd, TON_PRICE_USD_CENTS))}
        </p>
      </Block>

      {/* Next-payout block (R-3.3b [HERO]) */}
      <Block className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Next rent</span>
          <PayoutCountdown />
        </div>
        <p className="text-[1.625rem] font-bold tracking-[-0.02em] tnum text-foreground mt-1">{usd(pendingTotal)}</p>
      </Block>

      {/* My Properties section */}
      <SectionLabel className="mt-2">My properties</SectionLabel>
      {data.holdings.map((h) => {
        const listing = propertyById.get(h.propertyId);
        if (!listing) return null;
        return <PropertyCard key={h.propertyId} listing={listing} variant="mini" holding={h} />;
      })}
    </div>
  );
}