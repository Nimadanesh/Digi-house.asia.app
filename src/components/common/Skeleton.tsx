import { cn } from "@/lib/utils";
import { Block } from "./Block";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-surface-2 rounded-[6px] animate-pulse", className)} aria-hidden />;
}

/**
 * Shared tab-panel loading rhythm (3 skeleton blocks) — matches the tab-panel
 * block spacing so code-split panels (analytics, charts) don't shift layout
 * while their chunk loads. Use for every dynamic tab-panel fallback.
 */
export function TabPanelSkeleton() {
  return (
    <div className="space-y-5" data-testid="tab-panel-skeleton">
      {[0, 1, 2].map((i) => (
        <Block key={i} className="space-y-3 p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-[200px] w-full" />
        </Block>
      ))}
    </div>
  );
}