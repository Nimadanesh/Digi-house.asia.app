import { cn } from "@/lib/utils";

// DESIGN_SYSTEM §"Grouped Block": "internal rows are separated by inset 16px hairlines, not
// full-bleed lines." Each Row sits inset 16px (mx-4) so BOTH its content and its top hairline
// start 16px from the block edge — native Telegram grouped-list look. `Block` carries no padding
// of its own, so the inset must come from the Row. We do NOT use px-4 (would double-inset content
// to 32px) and we do NOT use first:mx-0 (would flush the first row's content to the block corner
// at 0px). `first:border-t-0` removes only the leading hairline — the first row's content stays at 16px.
export function Row({ className, children, onClick, ...rest }: { className?: string; children: React.ReactNode; onClick?: () => void } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex min-h-[48px] items-center gap-2 mx-4 border-t border-border first:border-t-0", onClick ? "cursor-pointer active:scale-[0.97] transition-transform duration-[120ms] ease-out" : "", className)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}