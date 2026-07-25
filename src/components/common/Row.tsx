import { cn } from "@/lib/utils";

// DESIGN_SYSTEM §"Grouped Block": rows sit inset 16px so both content and the hairline separator
// start 16px from the block edge (native Telegram grouped-list look). `first:border-t-0 first:mx-0`
// drops the leading hairline + lets the first row align with the block's other `p-4` content.
// We do NOT also apply px-4 — that would double-inset content to 32px.
export function Row({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex min-h-[48px] items-center gap-2 mx-4 border-t border-border first:border-t-0 first:mx-0", className)}>
      {children}
    </div>
  );
}