"use client";
import { useMarketplace } from "@/hooks/useMarketplace";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export default function MarketplacePage() {
  const { data, isLoading, isError, refetch } = useMarketplace();

  if (isLoading) {
    return (
      <div className="mt-3 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Block key={i} className="overflow-hidden">
            <Skeleton className="aspect-[16/10] w-full rounded-none" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2 w-full" />
            </div>
          </Block>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Block className="mt-3 p-4 text-center">
        <p className="text-sm text-muted-foreground mb-3">Couldn&apos;t load properties.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </Block>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No properties yet"
        message="New listings land every week."
        className="mt-12"
      />
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {data.map((listing) => (
        <PropertyCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}