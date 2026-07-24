"use client";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";

export default function PropertyDetailPage() {
  return (
    <div className="mt-3 space-y-3">
      <Skeleton className="h-48 w-full rounded-[12px]" />
      <Block className="p-4 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
      </Block>
      <Block className="p-4 space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </Block>
    </div>
  );
}