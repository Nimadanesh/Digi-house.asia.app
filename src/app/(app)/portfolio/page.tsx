"use client";
import { EmptyState } from "@/components/common/EmptyState";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";

export default function PortfolioPage() {
  return (
    <div className="mt-3 space-y-3">
      <Block className="p-4 space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-2/3" />
      </Block>
      <EmptyState title="No holdings yet" message="Buy a slice from the Marketplace to start earning weekly rent." />
    </div>
  );
}