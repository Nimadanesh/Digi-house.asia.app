// File responsibility: Portfolio loading skeleton (Fable layout).
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";

export function PortfolioSkeleton() {
  return (
    <div className="space-y-3" data-testid="portfolio-skeleton">
      <Block className="p-4 space-y-3">
        <Skeleton className="mx-auto h-3 w-36" />
        <Skeleton className="mx-auto h-9 w-40" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Block>
      <Skeleton className="h-4 w-28" />
      <Block className="p-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mt-3 h-4 w-2/3" />
      </Block>
      {Array.from({ length: 2 }).map((_, i) => (
        <Block key={i} className="p-3 space-y-2">
          <div className="flex gap-3">
            <Skeleton className="size-12 rounded-[10px]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-8 w-full" />
        </Block>
      ))}
    </div>
  );
}

