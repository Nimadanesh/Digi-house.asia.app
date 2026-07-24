"use client";
import { useEffect, use } from "react";
import { useProperty } from "@/hooks/useProperty";
import { useOrderBook } from "@/hooks/useOrderBook";
import { useTelegram } from "@/hooks/useTelegram";
import { PropertyDetail } from "@/components/property/PropertyDetail";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";
import { Button } from "@/components/ui/button";

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const property = useProperty(id);
  const orderBook = useOrderBook(id);
  const tg = useTelegram();

  // Show BackButton on this detail route, hide on unmount (USER_FLOW §"Route ↔ screen").
  useEffect(() => {
    tg.backButton.show();
    return () => tg.backButton.hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (property.isLoading) {
    return (
      <div className="space-y-3 mt-3">
        <Skeleton className="h-48 w-full rounded-[12px]" />
        <Block className="p-4 space-y-2"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-full" /></Block>
        <Block className="p-4 space-y-2"><Skeleton className="h-10 w-full" /></Block>
      </div>
    );
  }
  if (property.isError || !property.data) {
    return (
      <Block className="mt-3 p-4 text-center">
        <p className="text-sm text-muted-foreground mb-3">Couldn&apos;t load this property.</p>
        <Button onClick={() => property.refetch()}>Retry</Button>
      </Block>
    );
  }
  return <PropertyDetail listing={property.data} orderBook={orderBook.data} />;
}