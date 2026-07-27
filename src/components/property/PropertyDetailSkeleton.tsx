// File responsibility: loading skeleton matching Property detail layout shapes.
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";

export function PropertyDetailSkeleton() {
  return (
    <div className="space-y-4 mt-0" data-testid="property-detail-skeleton">
      <Skeleton className="h-48 w-full rounded-none -mx-4" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <Block className="p-0 overflow-hidden">
        <div className="grid grid-cols-2 gap-px">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 space-y-2">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </Block>
      <Block className="p-4 space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-full" />
      </Block>
      <Block className="p-4 space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-12 w-full" />
      </Block>
      <Block className="p-4 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </Block>
      <Block className="p-4 space-y-2">
        <Skeleton className="h-4 w-16" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-32 rounded-full" />
        </div>
      </Block>
      <Block>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mx-4 flex h-12 items-center justify-between border-t border-border first:border-t-0">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </Block>
    </div>
  );
}
