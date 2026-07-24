"use client";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";

export default function MarketplacePage() {
  return (
    <div className="mt-3 space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Block key={i} className="p-4 space-y-3">
          <Skeleton className="h-32 w-full rounded-[12px]" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </Block>
      ))}
    </div>
  );
}