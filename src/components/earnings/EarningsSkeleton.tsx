// File responsibility: Earnings page loading skeleton (Fable layout).
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";
import { Row } from "@/components/common/Row";

export function EarningsSkeleton() {
  return (
    <div className="space-y-3" data-testid="earnings-skeleton">
      <Block className="p-4 space-y-3">
        <Skeleton className="mx-auto h-3 w-32" />
        <Skeleton className="mx-auto h-9 w-36" />
        <Skeleton className="mx-auto h-4 w-40" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Block>
      <Skeleton className="h-4 w-28" />
      <Block className="p-4">
        <Skeleton className="h-[88px] w-full" />
      </Block>
      <Skeleton className="h-4 w-24" />
      <Block>
        {Array.from({ length: 4 }).map((_, i) => (
          <Row key={i} className="!min-h-[56px] py-2">
            <Skeleton className="size-9 shrink-0 rounded-[10px]" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-12" />
          </Row>
        ))}
      </Block>
    </div>
  );
}
