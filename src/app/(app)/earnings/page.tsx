"use client";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";
import { PAYOUT_DISCLAIMER } from "@/lib/constants";

export default function EarningsPage() {
  return (
    <div className="mt-3 space-y-3">
      <p className="px-1 text-xs text-muted-foreground">{PAYOUT_DISCLAIMER}</p>
      <Block className="p-4 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </Block>
      {Array.from({ length: 3 }).map((_, i) => (
        <Block key={i} className="p-4 flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </Block>
      ))}
    </div>
  );
}