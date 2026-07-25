"use client";
// File responsibility: Earnings hero page. Loaded | loading | error | empty states per DESIGN_SYSTEM.
// The PAYOUT_DISCLAIMER renders exactly once at the top (MVP honesty contract).
import Link from "next/link";
import { useEarnings } from "@/hooks/useEarnings";
import { useMarketplace } from "@/hooks/useMarketplace";
import { PAYOUT_DISCLAIMER, ROUTES } from "@/lib/constants";
import { weeklyRent } from "@/lib/format";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { EarningsSummaryBlock } from "@/components/earnings/EarningsSummaryBlock";
import { EarningsTimeline } from "@/components/earnings/EarningsTimeline";

export default function EarningsPage() {
  const earnings = useEarnings();
  const marketplace = useMarketplace(); // property-name + weekly-rent-pool lookups (no lib/mock from rows).

  const properties = marketplace.data ?? [];
  const propertyNameById: Record<string, string> = Object.fromEntries(
    properties.map((p) => [p.id, p.title]),
  );
  const weeklyRentPoolUsdById: Record<string, number> = Object.fromEntries(
    properties.map((p) => [p.id, weeklyRent(p.annualRentUsd)]),
  );

  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs text-muted-foreground">{PAYOUT_DISCLAIMER}</p>
      {earnings.isLoading ? (
        <>
          <Block className="p-4 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </Block>
          {Array.from({ length: 3 }).map((_, i) => (
            <Block key={i} className="p-3 flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-14 rounded-full" />
            </Block>
          ))}
        </>
      ) : earnings.isError ? (
        <Block className="p-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">Couldn&apos;t load earnings.</p>
          <Button onClick={() => earnings.refetch()}>Retry</Button>
        </Block>
      ) : !earnings.data || earnings.data.entries.length === 0 ? (
        <EmptyState
          title="No earnings yet"
          message="Own a slice of a property — get rent every Friday."
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
      ) : (
        <>
          <EarningsSummaryBlock summary={earnings.data} />
          <EarningsTimeline
            entries={earnings.data.entries}
            propertyNameById={propertyNameById}
            weeklyRentPoolUsdById={weeklyRentPoolUsdById}
          />
        </>
      )}
    </div>
  );
}