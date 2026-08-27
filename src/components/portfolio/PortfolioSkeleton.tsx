// File responsibility: Portfolio loading skeleton (Fable layout).
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";

export function PortfolioSkeleton() {
  return (
    <div className="space-y-3" data-testid="portfolio-skeleton">
      {/* Hero */}
      <Block className="p-5 pb-4 space-y-3">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-3 w-64 max-w-full" />
      </Block>
      {/* Locked vs Free */}
      <Block className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-12" />
          </div>
          <div className="border-s border-border ps-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-10" />
          </div>
        </div>
      </Block>
      {/* Allocation (compact row) */}
      <Block className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </Block>
      {Array.from({ length: 2 }).map((_, i) => (
        <Block key={i} className="p-3.5 space-y-2.5">
          <div className="flex gap-3">
            <Skeleton className="size-12 shrink-0 rounded-[10px]" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
        </Block>
      ))}
    </div>
  );
}

