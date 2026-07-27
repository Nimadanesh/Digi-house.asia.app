// File responsibility: shimmer layout for marketplace filter + card stack (title lives in Header).
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";

export function MarketplaceSkeleton() {
  return (
    <div className="space-y-3" data-testid="marketplace-skeleton">
      <Skeleton className="h-11 w-full rounded-[10px]" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 shrink-0 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Block key={i} className="overflow-hidden">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </Block>
      ))}
    </div>
  );
}
