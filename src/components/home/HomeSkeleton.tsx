// File responsibility: Home page loading shimmer matching Fable layout sections (header is global).
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";

export function HomeSkeleton() {
  return (
    <div className="mt-1 space-y-3" data-testid="home-skeleton">
      <Block className="p-4 space-y-3">
        <Skeleton className="mx-auto h-3 w-28" />
        <Skeleton className="mx-auto h-8 w-40" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Block>
      <Block className="p-4">
        <div className="flex justify-between gap-3">
          <div className="flex gap-3">
            <Skeleton className="size-10 rounded-[10px]" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </Block>
      <div className="flex gap-2.5 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-[148px] shrink-0 rounded-[12px]" />
        ))}
      </div>
      <Block className="overflow-hidden">
        <Skeleton className="aspect-[16/9] w-full rounded-none" />
        <div className="space-y-2 p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </Block>
    </div>
  );
}
