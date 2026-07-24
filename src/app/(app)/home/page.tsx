"use client";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";

export default function HomePage() {
  return (
    <div className="mt-3 space-y-3">
      <Block className="p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-8 w-40" />
      </Block>
      <Block className="p-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-2 h-6 w-32" />
      </Block>
    </div>
  );
}